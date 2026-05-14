print("[DEBUG] main.py loading...")

# Fix for Python 3.14 Windows asyncio issues
import asyncio
import sys
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from fastapi import FastAPI, HTTPException, UploadFile, File, Request
import io
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
import os
import json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from database import db
from mcp_tools import get_chat_history, check_usage_limit, increment_usage
from auth import register_user, login_user, verify_token, logout_user

print("[DEBUG] All imports complete")
load_dotenv()
print("[DEBUG] Creating FastAPI app...")

app = FastAPI(title="ClassroomAI API")

# Import RAG modules (available after pip install)
try:
    from rag_agent import RAGAgent
    from code_analyzer import CodeAnalyzer
    RAG_AVAILABLE = True
except ImportError:
    RAG_AVAILABLE = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

OPENAI_API_KEY = os.getenv("GROQ_API_KEY", "").strip() or "missing-set-GROQ_API_KEY-in-env"
OPENAI_MODEL   = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
client = OpenAI(api_key=OPENAI_API_KEY, base_url="https://api.groq.com/openai/v1")

# ─── AUTH MODELS & ENDPOINTS ─────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    school_name: str = ""

class LoginRequest(BaseModel):
    email: str
    password: str

def get_current_user(request: Request):
    auth = request.headers.get("Authorization", "")
    token = auth.replace("Bearer ", "") if auth.startswith("Bearer ") else ""
    user = verify_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

@app.post("/api/auth/register")
async def api_register(req: RegisterRequest):
    result = register_user(req.name, req.email, req.password, req.school_name)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@app.post("/api/auth/login")
async def api_login(req: LoginRequest):
    result = login_user(req.email, req.password)
    if not result["success"]:
        raise HTTPException(status_code=401, detail=result["error"])
    return result

@app.post("/api/auth/logout")
async def api_logout(request: Request):
    auth = request.headers.get("Authorization", "")
    token = auth.replace("Bearer ", "") if auth.startswith("Bearer ") else ""
    logout_user(token)
    return {"success": True}

@app.get("/api/auth/me")
async def api_me(request: Request):
    user = get_current_user(request)
    return {"success": True, "user": user}

# ─── MODELS ───────────────────────────────────────────

class WorksheetRequest(BaseModel):
    topic: str
    grade_level: str
    subject: str = ""
    worksheet_type: str = "mixed"
    num_questions: int = 10
    differentiation_level: str = "grade-level"
    blooms_level: str = "mixed"
    include_word_bank: bool = False
    additional_instructions: str = ""
    source_material: str = ""

class LessonPlanRequest(BaseModel):
    topic: str
    grade_level: str
    subject: str
    duration: str = "45 minutes"
    objectives: str = ""
    standards: str = ""
    class_type: str = "in-person"
    learning_style: str = "mixed"
    student_needs: str = "general"
    tech_integration: str = "low"
    include_topic_overview: bool = True
    additional_notes: str = ""
    source_material: str = ""

class MCAssessmentRequest(BaseModel):
    topic: str
    grade_level: str
    subject: str = ""
    num_questions: int = 10
    difficulty: str = "medium"
    blooms_level: str = "mixed"
    question_format: str = "pure_mc"
    include_explanations: bool = True
    standards: str = ""
    additional_instructions: str = ""
    source_material: str = ""

class AutoGenerateRequest(BaseModel):
    topic: str
    grade_level: str
    subject: str
    worksheet_type: str = "mixed"
    mc_format: str = "pure_mc"
    num_questions: int = 10
    source_material: str = ""

# ─── RAG ENDPOINT MODELS ──────────────────────────────

class CodeExplainRequest(BaseModel):
    code: str
    language: str
    grade: str

class DebugRequest(BaseModel):
    code: str
    language: str
    error: str

class ImproveRequest(BaseModel):
    code: str
    language: str
    focus: str = "best_practices"

class AnalyzeRequest(BaseModel):
    code: str
    language: str = "python"

class PatternRequest(BaseModel):
    pattern: str
    language: str
    grade: str

# ─── CHAT HISTORY & USAGE MODELS ──────────────────────

class ChatHistoryRequest(BaseModel):
    teacher_id: str

class UsageCheckRequest(BaseModel):
    teacher_id: str
    tool_name: str

class UsageIncrementRequest(BaseModel):
    teacher_id: str
    tool_name: str

class SaveChatRequest(BaseModel):
    teacher_id: str
    tool_name: str
    topic: str
    grade_level: str
    subject: str
    request_data: dict
    response_preview: str
    response_content: str = None  # Full response content

# ─── HELPERS ──────────────────────────────────────────

def get_grade_language_profile(grade_level: str) -> str:
    g = grade_level.lower()
    if any(x in g for x in ["kindergarten", "grade 1", "grade 2", "1st", "2nd", "k-"]):
        return (
            "LANGUAGE LEVEL — CRITICAL: Use extremely simple language. "
            "Sentences must be 3-6 words maximum. Use only basic sight words a 5-6 year old knows. "
            "No abstract concepts. Use animals, toys, food, family as examples only. "
            "Every sentence must be something a Kindergartener can read aloud."
        )
    elif any(x in g for x in ["grade 3", "grade 4", "grade 5", "3rd", "4th", "5th"]):
        return (
            "LANGUAGE LEVEL: Use simple, clear elementary school language. "
            "Sentences should be 8-12 words. Use common everyday vocabulary a 9-11 year old knows. "
            "Include concrete, relatable real-world examples. Avoid jargon. "
            "If introducing a new word, immediately define it in simple terms."
        )
    elif any(x in g for x in ["grade 6", "grade 7", "grade 8", "6th", "7th", "8th", "middle"]):
        return (
            "LANGUAGE LEVEL: Use middle school level language appropriate for ages 11-14. "
            "Moderate sentence complexity is fine. Introduce subject-specific vocabulary "
            "with brief definitions. Mix concrete examples with some abstract reasoning. "
            "Students can handle multi-step thinking but need clear structure."
        )
    elif any(x in g for x in ["grade 9", "grade 10", "grade 11", "grade 12", "9th", "10th", "11th", "12th", "high school"]):
        return (
            "LANGUAGE LEVEL: Use high school academic language for ages 14-18. "
            "Advanced vocabulary and complex sentence structures are expected. "
            "Require abstract reasoning, critical analysis, and synthesis. "
            "Use discipline-specific terminology without over-defining it. "
            "Challenge students with nuanced questions and multi-layered concepts."
        )
    return "LANGUAGE LEVEL: Use clear, age-appropriate language for the specified grade level."


def call_openai(system_prompt: str, user_prompt: str, max_tokens: int = 1800) -> str:
    try:
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt},
            ],
            temperature=0.65,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")

# ─── ROUTES ───────────────────────────────────────────

@app.post("/api/worksheet")
def generate_worksheet(req: WorksheetRequest):
    if not req.topic.strip():
        raise HTTPException(status_code=400, detail="Topic is required.")

    type_map = {
        "fill_blank":      "fill-in-the-blank questions (use ________ for blanks)",
        "multiple_choice": "multiple choice questions with 4 options each (A, B, C, D)",
        "open_ended":      "open-ended short answer questions requiring critical thinking",
        "mixed":           "a balanced mix of fill-in-the-blank, multiple choice, and open-ended questions",
        "qa":              "question and answer pairs formatted as 'Q: [question]' then 'A: [answer]' on separate lines",
    }

    diff_map = {
        "grade-level": "exactly at grade level using standard curriculum vocabulary",
        "beginner":    "simplified and scaffolded for struggling or below-grade-level students using shorter sentences and simpler vocabulary",
        "advanced":    "challenging for above-grade-level students requiring deeper analysis and extended thinking",
        "mixed":       "differentiated with a range of difficulty from foundational to higher-order thinking to support all learners",
    }

    blooms_map = {
        "remember":   "remembering and recalling facts (define, list, identify, name) — Bloom's Level 1",
        "understand": "understanding and explaining concepts (describe, explain, summarize) — Bloom's Level 2",
        "apply":      "applying knowledge to new situations (use, solve, demonstrate, calculate) — Bloom's Level 3",
        "analyze":    "analyzing and breaking down information (compare, contrast, differentiate) — Bloom's Level 4",
        "evaluate":   "evaluating and making judgments (assess, critique, justify, argue) — Bloom's Level 5",
        "create":     "creating and synthesizing new ideas (design, compose, construct, formulate) — Bloom's Level 6",
        "mixed":      "a balanced range across all Bloom's Taxonomy levels from recall to higher-order thinking",
    }

    q_type  = type_map.get(req.worksheet_type, type_map["mixed"])
    diff    = diff_map.get(req.differentiation_level, diff_map["grade-level"])
    blooms  = blooms_map.get(req.blooms_level, blooms_map["mixed"])

    word_bank_note = ""
    if req.include_word_bank and req.worksheet_type in ("fill_blank", "mixed"):
        word_bank_note = (
            "Include a WORD BANK box near the top of the worksheet listing all the missing words "
            "students must use, arranged in a bordered box with words separated by commas."
        )

    material_note = ""
    if req.source_material.strip():
        material_note = (
            f"\n\nTEACHER-UPLOADED SOURCE MATERIAL (base your questions primarily on this content):\n"
            f"---\n{req.source_material[:5000]}\n---\n"
        )

    system_prompt = (
        "You are an expert classroom teacher and curriculum specialist with 20+ years of experience. "
        "Create professional, print-ready worksheets that are engaging, pedagogically sound, and appropriately rigorous. "
        "Ensure questions are clear, unambiguous, and aligned to the specified grade level and Bloom's level. "
        + ("When source material is provided, derive ALL questions directly from that content. " if req.source_material.strip() else "")
        + "Write in plain text ONLY — absolutely no markdown, no asterisks, no hashtags, no bold symbols. "
        "Use CAPITAL LETTERS for section headers and dashes for separators."
    )

    user_prompt = (
        f"Create a complete, professional classroom worksheet for {req.grade_level} students.\n\n"
        f"TOPIC: {req.topic}\n"
        f"{'SUBJECT: ' + req.subject if req.subject else ''}\n"
        f"QUESTION TYPE: {q_type}\n"
        f"NUMBER OF QUESTIONS: {req.num_questions}\n"
        f"DIFFERENTIATION LEVEL: {diff}\n"
        f"BLOOM'S TAXONOMY FOCUS: {blooms}\n"
        f"{word_bank_note}\n"
        f"{'ADDITIONAL INSTRUCTIONS: ' + req.additional_instructions if req.additional_instructions else ''}\n"
        f"{material_note}\n"
        "FORMAT REQUIREMENTS (plain text only, no markdown):\n"
        "- Worksheet title in ALL CAPS\n"
        "- Name / Date / Class lines\n"
        f"{'- Word Bank box with all fill-in words listed' if req.include_word_bank else ''}\n"
        "- Clear, brief instructions for students\n"
        "- All questions numbered (1. 2. 3. ...)\n"
        "- Adequate space for student responses\n"
        "- ANSWER KEY section at bottom with answers numbered to match\n"
        "- Include a one-sentence rationale for each answer in the key\n\n"
        "Write ONLY plain text. No **, ##, or any markdown whatsoever."
    )

    result = call_openai(system_prompt, user_prompt)
    return {"result": result, "tool": "worksheet"}


@app.post("/api/upload-material")
async def upload_material(file: UploadFile = File(...)):
    """Extract text from teacher-uploaded material (PDF, DOCX, TXT, MD)"""
    content = await file.read()
    filename = (file.filename or "").lower()
    try:
        if filename.endswith(".pdf"):
            try:
                import pypdf
                reader = pypdf.PdfReader(io.BytesIO(content))
                text = "\n".join(p.extract_text() or "" for p in reader.pages)
            except ImportError:
                raise HTTPException(status_code=400, detail="PDF support not installed. Upload a .txt file instead.")
        elif filename.endswith(".docx"):
            try:
                import docx
                doc = docx.Document(io.BytesIO(content))
                text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
            except ImportError:
                raise HTTPException(status_code=400, detail="DOCX support not installed. Upload a .txt file instead.")
        else:
            text = content.decode("utf-8", errors="ignore")
        text = text.strip()[:8000]
        if not text:
            raise HTTPException(status_code=400, detail="Could not extract text from file.")
        return {"text": text, "chars": len(text), "filename": file.filename}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not process file: {str(e)}")


@app.post("/api/lesson-plan")
def generate_lesson_plan(req: LessonPlanRequest):
    if not req.topic.strip():
        raise HTTPException(status_code=400, detail="Topic is required.")

    style_map = {
        "mixed":       "a variety of learning modalities (visual, auditory, and kinesthetic activities combined)",
        "visual":      "visual learning strategies — diagrams, charts, graphic organizers, color-coding, videos, visual aids",
        "auditory":    "auditory learning strategies — discussion, verbal explanations, think-pair-share, reading aloud",
        "kinesthetic": "kinesthetic and hands-on strategies — movement activities, manipulatives, experiments, role-play",
    }

    needs_map = {
        "general":       "a general education classroom with diverse learners",
        "ell":           "English Language Learners — include sentence frames, visual vocabulary, bilingual supports, and simplified instructions",
        "special_needs": "students with diverse learning needs — include modifications, accommodations, chunked tasks, and extra scaffolding",
        "gifted":        "gifted and talented students — include enrichment tasks, higher-order questioning, independent projects, and extensions",
    }

    tech_map = {
        "low":         "low-tech environment — paper, pencil, physical manipulatives, whiteboards only",
        "digital":     "digital tools — presentations, educational websites, online quizzes, Google Docs/Slides, video",
        "interactive": "interactive/blended technology — interactive whiteboard, simulations, collaborative platforms, educational apps",
    }

    class_map = {
        "in-person": "traditional in-person classroom",
        "remote":    "fully remote/virtual classroom — include video call strategies, breakout rooms, digital submission methods",
        "hybrid":    "hybrid classroom with both in-person and remote students simultaneously — address both audiences",
    }

    # Generate topic overview if requested
    topic_overview = ""
    if req.include_topic_overview:
        topic_system = (
            "You are a subject matter expert and experienced educator. "
            "Provide comprehensive, authoritative, and student-friendly educational content about topics. "
            "Make content accessible for the specified grade level while maintaining academic rigor. "
            "Write in plain text ONLY — no markdown, no asterisks, no hashtags."
        )

        topic_prompt = (
            f"Create a comprehensive topic overview for teacher reference:\n\n"
            f"TOPIC: {req.topic}\n"
            f"SUBJECT: {req.subject}\n"
            f"GRADE LEVEL: {req.grade_level}\n\n"
            "Include ALL sections with concise but detailed information:\n\n"
            "1. OVERVIEW - What this topic is about and why it matters\n\n"
            "2. KEY CONCEPTS - 5-7 core ideas with simple definitions\n\n"
            "3. ESSENTIAL VOCABULARY - 8-10 key terms defined in student-friendly language\n\n"
            "4. MAIN PRINCIPLES - 3-4 key ideas or rules about this topic\n\n"
            "5. REAL-WORLD EXAMPLES - 3 concrete examples showing how this applies\n\n"
            "6. INTERESTING FACTS - 3 fascinating or surprising facts\n\n"
            "7. COMMON MISCONCEPTIONS - 2-3 things students often misunderstand with correct explanations\n\n"
            f"Make all content age-appropriate for {req.grade_level}. "
            "Write in plain text. No **, ##, or markdown."
        )

        topic_overview = call_openai(topic_system, topic_prompt, max_tokens=1500)
        topic_overview = "=== PAGE 1: TOPIC OVERVIEW ===\n\n" + topic_overview + "\n\n" + "="*50 + "\n\n=== PAGE 2: LESSON PLAN ===\n\n"

    lesson_material_note = ""
    if req.source_material.strip():
        lesson_material_note = (
            f"\n\nTEACHER-UPLOADED SOURCE MATERIAL (align the lesson to this content):\n"
            f"---\n{req.source_material[:5000]}\n---\n"
        )

    system_prompt = (
        "You are a master curriculum designer and instructional coach expert in UbD (Understanding by Design), "
        "differentiated instruction, and modern pedagogical best practices. "
        "Create detailed, actionable, classroom-ready lesson plans any teacher can pick up and use immediately. "
        "Include specific timing estimates, concrete student activities, and teacher facilitation notes. "
        + ("When source material is provided, align ALL activities and content directly to it. " if req.source_material.strip() else "")
        + "Write in plain text ONLY — no markdown, no asterisks, no hashtags. "
        "Use numbered sections with UPPERCASE HEADERS."
    )

    user_prompt = (
        f"Create a comprehensive, fully detailed lesson plan:\n\n"
        f"TOPIC: {req.topic}\n"
        f"SUBJECT: {req.subject}\n"
        f"GRADE LEVEL: {req.grade_level}\n"
        f"DURATION: {req.duration}\n"
        f"CLASS FORMAT: {class_map.get(req.class_type, class_map['in-person'])}\n"
        f"LEARNING STYLE FOCUS: {style_map.get(req.learning_style, style_map['mixed'])}\n"
        f"STUDENT NEEDS: {needs_map.get(req.student_needs, needs_map['general'])}\n"
        f"TECHNOLOGY: {tech_map.get(req.tech_integration, tech_map['low'])}\n"
        f"{'LEARNING OBJECTIVES: ' + req.objectives if req.objectives else ''}\n"
        f"{'STANDARDS: ' + req.standards if req.standards else ''}\n"
        f"{'ADDITIONAL NOTES: ' + req.additional_notes if req.additional_notes else ''}\n\n"
        "Include ALL sections below with detailed, specific content:\n\n"
        "1. LESSON OVERVIEW\n"
        "   - Lesson summary (2-3 sentences)\n"
        "   - Essential question students will explore\n"
        "   - Learning objectives in SWBAT format (Students Will Be Able To...)\n"
        "   - Success criteria (what mastery looks like)\n\n"
        "2. MATERIALS AND RESOURCES\n"
        "   - All materials with quantities\n"
        "   - Technology or tools required\n"
        "   - Teacher preparation steps\n\n"
        "3. WARM-UP / HOOK (with time estimate)\n"
        "   - Engaging activity to activate prior knowledge\n"
        "   - Real-world connection or student interest hook\n"
        "   - Key discussion questions to ask\n\n"
        "4. DIRECT INSTRUCTION (with time estimate)\n"
        "   - Step-by-step teaching sequence\n"
        "   - Key vocabulary with simple definitions\n"
        "   - Teacher talking points and examples\n"
        "   - Checks for understanding during instruction\n\n"
        "5. GUIDED PRACTICE (with time estimate)\n"
        "   - Whole-class or small group activity description\n"
        "   - Student grouping suggestions\n"
        "   - Teacher facilitation notes\n\n"
        "6. INDEPENDENT PRACTICE (with time estimate)\n"
        "   - Individual student task\n"
        "   - What teacher observes and monitors\n\n"
        "7. CLOSURE AND FORMATIVE ASSESSMENT\n"
        "   - Exit ticket or closing activity\n"
        "   - How teacher assesses understanding before next lesson\n\n"
        "8. DIFFERENTIATION STRATEGIES\n"
        "   - Modifications for struggling learners\n"
        "   - Extensions for advanced students\n"
        f"   - Specific accommodations for: {needs_map.get(req.student_needs, 'all learners')}\n\n"
        "9. HOMEWORK / EXTENSION (if applicable)\n\n"
        "10. TEACHER REFLECTION NOTES\n"
        "    - Potential challenges and how to address them\n"
        "    - What to look for during the lesson\n"
        "    - Ideas for the follow-up lesson\n\n"
        "Write everything in plain text. No **, ##, or markdown formatting of any kind."
        f"{lesson_material_note}"
    )

    lesson_result = call_openai(system_prompt, user_prompt, max_tokens=2000)
    result = topic_overview + lesson_result
    return {"result": result, "tool": "lesson-plan"}


@app.post("/api/mc-assessment")
def generate_mc_assessment(req: MCAssessmentRequest):
    if not req.topic.strip():
        raise HTTPException(status_code=400, detail="Topic is required.")

    blooms_map = {
        "remember":   "recall and recognition (define, identify, name, list) — Bloom's Level 1",
        "understand": "comprehension (explain, describe, summarize, classify) — Bloom's Level 2",
        "apply":      "application (use, solve, demonstrate, calculate) — Bloom's Level 3",
        "analyze":    "analysis (compare, contrast, examine, differentiate) — Bloom's Level 4",
        "evaluate":   "evaluation (assess, critique, justify, recommend) — Bloom's Level 5",
        "create":     "synthesis/creation (design, formulate, propose, construct) — Bloom's Level 6",
        "mixed":      "a deliberate mix across all Bloom's Taxonomy levels (recall through synthesis)",
    }

    mc_count = max(1, int(req.num_questions * 0.7))
    other_count = req.num_questions - mc_count

    format_map = {
        "pure_mc":      f"all {req.num_questions} questions as standard multiple choice (4 options: A, B, C, D)",
        "mc_truefalse": f"{mc_count} multiple choice questions (4 options A-D) followed by {other_count} True/False questions, clearly labeled by section",
        "mc_short":     f"{mc_count} multiple choice questions (4 options A-D) followed by {other_count} short answer questions requiring 1-2 sentence responses",
    }

    diff_desc = {
        "easy":   "straightforward recall and basic comprehension — accessible to most students",
        "medium": "moderate application and analysis — requires solid understanding of core concepts",
        "hard":   "challenging evaluation and synthesis — requires deep mastery and critical thinking",
        "mixed":  "a range from basic recall to challenging analysis across difficulty levels",
    }

    answer_key_note = (
        "In the ANSWER KEY, for each question provide: the correct answer letter AND a 1-2 sentence explanation of "
        "why it is correct and what common misconception the wrong options address."
        if req.include_explanations else
        "In the ANSWER KEY, list only the question number and correct answer letter."
    )

    mc_material_note = ""
    if req.source_material.strip():
        mc_material_note = (
            f"\n\nTEACHER-UPLOADED SOURCE MATERIAL (base ALL questions on this content):\n"
            f"---\n{req.source_material[:5000]}\n---\n"
        )

    system_prompt = (
        "You are an expert assessment designer with deep knowledge of curriculum standards, "
        "Bloom's Taxonomy, and best practices in test construction. "
        "Create high-quality, fair, and valid assessments. "
        "All distractors (wrong answers) must be plausible but clearly incorrect to students who mastered the material. "
        "Avoid trick questions, double negatives, and 'all of the above' options. "
        + ("When source material is provided, ALL questions must come directly from that content. " if req.source_material.strip() else "")
        + "Write in plain text ONLY — no markdown, no asterisks, no hashtags."
    )

    user_prompt = (
        f"Create a {req.num_questions}-question assessment on: '{req.topic}'\n\n"
        f"GRADE LEVEL: {req.grade_level}\n"
        f"{'SUBJECT: ' + req.subject if req.subject else ''}\n"
        f"DIFFICULTY: {diff_desc.get(req.difficulty, diff_desc['medium'])}\n"
        f"BLOOM'S TAXONOMY FOCUS: {blooms_map.get(req.blooms_level, blooms_map['mixed'])}\n"
        f"QUESTION FORMAT: {format_map.get(req.question_format, format_map['pure_mc'])}\n"
        f"{'STANDARDS: ' + req.standards if req.standards else ''}\n"
        f"{'ADDITIONAL INSTRUCTIONS: ' + req.additional_instructions if req.additional_instructions else ''}\n"
        f"{mc_material_note}\n"
        "FORMAT REQUIREMENTS (plain text only):\n"
        "- Assessment title in ALL CAPS\n"
        "- Name / Date / Score fields\n"
        "- Brief student instructions\n"
        "- All questions numbered consecutively\n"
        "- Options clearly labeled A, B, C, D for MC questions\n"
        "- True / False clearly labeled for T/F questions\n"
        "- Writing lines for short answer questions\n\n"
        f"ANSWER KEY: {answer_key_note}\n\n"
        "Write everything in plain text. No **, ##, or any markdown."
    )

    result = call_openai(system_prompt, user_prompt, max_tokens=1800)
    return {"result": result, "tool": "mc-assessment"}


@app.post("/api/auto-generate")
def auto_generate(req: AutoGenerateRequest):
    if not req.topic.strip():
        raise HTTPException(status_code=400, detail="Topic is required.")
    if not req.grade_level.strip():
        raise HTTPException(status_code=400, detail="Grade level is required.")
    if not req.subject.strip():
        raise HTTPException(status_code=400, detail="Subject is required.")

    lang = get_grade_language_profile(req.grade_level)

    # ── Worksheet ──────────────────────────────────────
    type_map = {
        "fill_blank":      "fill-in-the-blank questions (use ________ for blanks)",
        "multiple_choice": "multiple choice questions with 4 options each (A, B, C, D)",
        "open_ended":      "open-ended short answer questions requiring critical thinking",
        "mixed":           "a balanced mix of fill-in-the-blank, multiple choice, and open-ended questions",
        "qa":              "question and answer pairs formatted as 'Q: [question]' then 'A: [answer]' on separate lines",
    }
    auto_material_note = (
        f"\n\nTEACHER-UPLOADED SOURCE MATERIAL (base content on this):\n---\n{req.source_material[:4000]}\n---\n"
        if req.source_material.strip() else ""
    )

    ws_system = (
        f"You are an expert classroom teacher creating a worksheet for {req.grade_level} students. "
        f"{lang} "
        + ("Base all questions on the provided source material. " if req.source_material.strip() else "")
        + "Write in plain text ONLY — no markdown, no asterisks, no hashtags. "
        "Use CAPITAL LETTERS for section headers."
    )
    ws_user = (
        f"Create a complete classroom worksheet for {req.grade_level} students.\n\n"
        f"TOPIC: {req.topic}\nSUBJECT: {req.subject}\n"
        f"QUESTION TYPE: {type_map.get(req.worksheet_type, type_map['mixed'])}\n"
        f"NUMBER OF QUESTIONS: {req.num_questions}\n"
        f"{auto_material_note}\n"
        "Include: worksheet title in ALL CAPS, Name/Date/Class lines, student instructions, "
        "numbered questions, and an ANSWER KEY at the bottom with rationales.\n"
        "Plain text only. No **, ##, or any markdown."
    )

    # ── Topic Overview (Page 1 — teacher reference) ────
    ov_system = (
        f"You are a subject matter expert and experienced educator writing a teacher reference guide. "
        f"{lang} "
        "Write in plain text ONLY — no markdown, no asterisks, no hashtags."
    )
    ov_user = (
        f"Create a comprehensive topic overview for teacher reference:\n\n"
        f"TOPIC: {req.topic}\nSUBJECT: {req.subject}\nGRADE LEVEL: {req.grade_level}\n\n"
        "Include ALL sections below with concise but detailed content:\n\n"
        "1. OVERVIEW - What this topic is and why it matters at this grade level\n\n"
        "2. KEY CONCEPTS - 5-7 core ideas with simple definitions appropriate for the grade\n\n"
        "3. ESSENTIAL VOCABULARY - 8-10 key terms defined in student-friendly language\n\n"
        "4. MAIN PRINCIPLES - 3-4 key rules or ideas about this topic\n\n"
        "5. REAL-WORLD EXAMPLES - 3 concrete examples showing how this applies in daily life\n\n"
        "6. INTERESTING FACTS - 3 fascinating or surprising facts to engage students\n\n"
        "7. COMMON MISCONCEPTIONS - 2-3 things students often misunderstand with correct explanations\n\n"
        f"Write everything at the correct complexity for {req.grade_level} students. "
        "Plain text only. No **, ##, or any markdown."
    )

    # ── Lesson Plan (Page 2 — teaching instructions) ───
    lp_system = (
        f"You are a master curriculum designer creating a lesson plan for {req.grade_level} students. "
        f"{lang} "
        "Write in plain text ONLY — no markdown, no asterisks. "
        "Use numbered sections with UPPERCASE HEADERS."
    )
    lp_user = (
        f"Create a complete 45-minute lesson plan:\n\n"
        f"TOPIC: {req.topic}\nSUBJECT: {req.subject}\nGRADE LEVEL: {req.grade_level}\n\n"
        "Include: 1. LESSON OVERVIEW (objectives in SWBAT format, essential question, success criteria) "
        "2. MATERIALS AND RESOURCES 3. WARM-UP/HOOK (10 min) 4. DIRECT INSTRUCTION (15 min) "
        "5. GUIDED PRACTICE (10 min) 6. INDEPENDENT PRACTICE (7 min) "
        "7. CLOSURE & FORMATIVE ASSESSMENT (3 min) 8. DIFFERENTIATION STRATEGIES "
        "(modifications for struggling learners, extensions for advanced students).\n"
        "Plain text only. No **, ##, or any markdown."
    )

    # ── MC Assessment ──────────────────────────────────
    mc_count = max(1, int(req.num_questions * 0.7))
    other_count = req.num_questions - mc_count
    format_map = {
        "pure_mc":      f"all {req.num_questions} standard multiple choice questions (4 options: A, B, C, D)",
        "mc_truefalse": f"{mc_count} multiple choice (A-D) followed by {other_count} True/False questions",
        "mc_short":     f"{mc_count} multiple choice (A-D) followed by {other_count} short answer questions",
    }
    mc_system = (
        f"You are an expert assessment designer creating a quiz for {req.grade_level} students. "
        f"{lang} "
        "Write in plain text ONLY — no markdown, no asterisks. "
        "All wrong answer choices must be plausible but clearly incorrect to students who studied."
    )
    mc_user = (
        f"Create a {req.num_questions}-question assessment:\n\n"
        f"TOPIC: {req.topic}\nSUBJECT: {req.subject}\nGRADE LEVEL: {req.grade_level}\n"
        f"FORMAT: {format_map.get(req.mc_format, format_map['pure_mc'])}\n"
        f"{auto_material_note}\n"
        "Include: title in ALL CAPS, Name/Date/Score fields, student instructions, "
        "numbered questions, and ANSWER KEY with one-sentence explanations per answer.\n"
        "Plain text only. No **, ##, or any markdown."
    )

    # ── Run sequentially to stay within Groq free-tier rate limits ────────────
    topic_overview = call_openai(ov_system, ov_user, 800)
    lesson_content = call_openai(lp_system, lp_user, 900)
    worksheet      = call_openai(ws_system, ws_user, 800)
    mc_assessment  = call_openai(mc_system, mc_user, 800)

    # Combine overview + lesson plan (matching the Lesson Plan Generator format)
    lesson_plan = (
        "=== PAGE 1: TOPIC OVERVIEW (TEACHER REFERENCE) ===\n\n"
        + topic_overview
        + "\n\n" + "=" * 50 + "\n\n"
        + "=== PAGE 2: LESSON PLAN ===\n\n"
        + lesson_content
    )

    return {
        "worksheet":     worksheet,
        "lesson_plan":   lesson_plan,
        "mc_assessment": mc_assessment,
        "grade_profile": lang,
        "tool": "auto-generate",
    }


# ─── CLASS ACTIVITY GENERATOR ────────────────────────

class ClassActivityRequest(BaseModel):
    topic: str
    grade_level: str
    subject: str = ""
    activity_type: str = "group"
    num_activities: int = 3
    duration: str = "30 minutes"
    group_size: str = "4-5 students"
    learning_outcomes: str = ""
    materials_available: str = ""
    additional_instructions: str = ""
    source_material: str = ""

@app.post("/api/class-activity")
def generate_class_activity(req: ClassActivityRequest):
    if not req.topic.strip():
        raise HTTPException(status_code=400, detail="Topic is required.")

    activity_map = {
        "group":       "collaborative group activities where students work together in teams",
        "project":     "project-based exercises that produce a tangible deliverable or presentation",
        "hands_on":    "hands-on kinesthetic activities using physical materials or experiments",
        "discussion":  "structured discussion activities like Socratic seminars, debates, or think-pair-share",
        "game":        "educational games and gamified learning activities",
        "creative":    "creative expression activities like art, drama, writing, or multimedia projects",
        "mixed":       "a balanced mix of group work, hands-on activities, and creative exercises",
    }

    lang = get_grade_language_profile(req.grade_level)

    material_note = ""
    if req.source_material.strip():
        material_note = (
            f"\n\nTEACHER-UPLOADED SOURCE MATERIAL (align activities to this content):\n"
            f"---\n{req.source_material[:5000]}\n---\n"
        )

    system_prompt = (
        "You are an experienced instructional designer and classroom teacher specializing in "
        "active learning strategies and collaborative pedagogy. "
        "Create engaging, well-structured classroom activities that maximize student participation "
        "and are directly mapped to specific learning outcomes. "
        f"{lang} "
        + ("When source material is provided, align ALL activities directly to that content. " if req.source_material.strip() else "")
        + "Write in plain text ONLY — no markdown, no asterisks, no hashtags. "
        "Use CAPITAL LETTERS for section headers and dashes for separators."
    )

    user_prompt = (
        f"Create {req.num_activities} detailed classroom activities for {req.grade_level} students.\n\n"
        f"TOPIC: {req.topic}\n"
        f"{'SUBJECT: ' + req.subject if req.subject else ''}\n"
        f"ACTIVITY TYPE: {activity_map.get(req.activity_type, activity_map['mixed'])}\n"
        f"DURATION PER ACTIVITY: {req.duration}\n"
        f"GROUP SIZE: {req.group_size}\n"
        f"{'LEARNING OUTCOMES TO ADDRESS: ' + req.learning_outcomes if req.learning_outcomes else ''}\n"
        f"{'MATERIALS AVAILABLE: ' + req.materials_available if req.materials_available else ''}\n"
        f"{'ADDITIONAL INSTRUCTIONS: ' + req.additional_instructions if req.additional_instructions else ''}\n"
        f"{material_note}\n"
        "FOR EACH ACTIVITY, INCLUDE ALL OF THE FOLLOWING:\n\n"
        "1. ACTIVITY TITLE - Creative, engaging name\n"
        "2. LEARNING OUTCOMES - 2-3 specific outcomes this activity addresses (use SWBAT format)\n"
        "3. MATERIALS NEEDED - Complete list with quantities\n"
        "4. SETUP INSTRUCTIONS - Step-by-step teacher preparation\n"
        "5. ACTIVITY PROCEDURE - Detailed step-by-step instructions with time estimates\n"
        "   - Introduction/hook (2-3 min)\n"
        "   - Main activity steps\n"
        "   - Student roles within groups\n"
        "6. DIFFERENTIATION\n"
        "   - Scaffolding for struggling learners\n"
        "   - Extension for advanced students\n"
        "7. ASSESSMENT - How to evaluate student learning during/after the activity\n"
        "8. REFLECTION QUESTIONS - 2-3 debrief questions for class discussion\n\n"
        "Make each activity unique and progressively more challenging. "
        "Ensure activities promote critical thinking, collaboration, and creativity. "
        "Write everything in plain text. No **, ##, or any markdown."
    )

    result = call_openai(system_prompt, user_prompt, max_tokens=2000)
    return {"result": result, "tool": "class-activity"}


# ─── RAG ENDPOINTS (ADVANCED FEATURES) ─────────────────

@app.post("/api/advanced/explain")
async def explain_advanced(request: CodeExplainRequest):
    """Explain advanced code with RAG-retrieved knowledge base"""
    if not RAG_AVAILABLE:
        raise HTTPException(status_code=503, detail="RAG system not available")

    try:
        agent = RAGAgent()
        explanation = agent.explain_code(request.code, request.language, request.grade)
        return {"explanation": explanation, "tool": "explain-code"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/advanced/debug")
async def debug_code(request: DebugRequest):
    """Debug code using pattern matching from knowledge base"""
    if not RAG_AVAILABLE:
        raise HTTPException(status_code=503, detail="RAG system not available")

    try:
        agent = RAGAgent()
        solution = agent.debug_code(request.code, request.language, request.error)
        return {"solution": solution, "tool": "debug-code"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/advanced/improve")
async def improve_code(request: ImproveRequest):
    """Suggest code improvements based on best practices"""
    if not RAG_AVAILABLE:
        raise HTTPException(status_code=503, detail="RAG system not available")

    try:
        agent = RAGAgent()
        improvements = agent.suggest_improvements(request.code, request.language, request.focus)
        return {"improvements": improvements, "tool": "improve-code"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/advanced/analyze")
async def analyze_code(request: AnalyzeRequest):
    """Analyze code structure, complexity, and best practice violations"""
    if not RAG_AVAILABLE:
        raise HTTPException(status_code=503, detail="RAG system not available")

    try:
        analyzer = CodeAnalyzer()
        if request.language == "python":
            analysis = analyzer.analyze_python(request.code)
        elif request.language == "javascript":
            analysis = analyzer.analyze_javascript(request.code)
        else:
            raise HTTPException(status_code=400, detail=f"Language {request.language} not supported")

        return {
            "analysis": analysis,
            "tool": "analyze-code"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/advanced/teach-pattern")
async def teach_pattern(request: PatternRequest):
    """Teach design pattern with code examples"""
    if not RAG_AVAILABLE:
        raise HTTPException(status_code=503, detail="RAG system not available")

    try:
        agent = RAGAgent()
        explanation = agent.teach_pattern(request.pattern, request.language, request.grade)
        return {"explanation": explanation, "tool": "teach-pattern"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── CHAT HISTORY & USAGE ENDPOINTS ───────────────────

print("[STARTUP] Loading chat history & usage endpoints...")

class FullHistoryRequest(BaseModel):
    teacher_id: str
    limit: int = 50
    offset: int = 0
    tool_filter: str = ""

@app.post("/api/chat-history")
async def get_chat_history_endpoint(request: ChatHistoryRequest):
    """Get last 7 chats for a teacher (legacy)"""
    try:
        result = get_chat_history(request.teacher_id)
        return result
    except Exception as e:
        print(f"Error getting chat history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/history")
async def get_full_history(request: FullHistoryRequest):
    """Get full paginated chat history for a teacher"""
    try:
        chats = db.get_chat_history(
            request.teacher_id,
            limit=request.limit,
            offset=request.offset,
            tool_filter=request.tool_filter or None
        )
        return {"success": True, "chats": chats, "count": len(chats)}
    except Exception as e:
        print(f"Error getting history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/check-usage")
async def check_usage_endpoint(request: UsageCheckRequest):
    """Check daily usage limit for a tool"""
    try:
        result = db.get_usage(request.teacher_id, request.tool_name)
        return result
    except Exception as e:
        print(f"❌ Error checking usage: {e}")
        import traceback
        traceback.print_exc()
        return {
            "usage_count": 0,
            "limit": 50,
            "remaining": 50,
            "exceeded": False
        }

@app.post("/api/increment-usage")
async def increment_usage_endpoint(request: UsageIncrementRequest):
    """Increment usage count and check if limit exceeded"""
    try:
        result = increment_usage(request.teacher_id, request.tool_name)

        # If limit exceeded, return 429 (Too Many Requests) but still return the data
        if result['exceeded']:
            return result  # Frontend handles the error display

        return result
    except Exception as e:
        print(f"❌ Error incrementing usage: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/save-chat")
async def save_chat_endpoint(request: SaveChatRequest):
    """Save a chat to history"""
    try:
        chat_id = db.save_chat(
            request.teacher_id,
            request.tool_name,
            request.topic,
            request.grade_level,
            request.subject,
            request.request_data,
            request.response_preview,
            request.response_content
        )

        return {
            "success": True,
            "chat_id": chat_id,
            "message": "Chat saved to history"
        }
    except Exception as e:
        print(f"❌ Error saving chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ─── ADAPTIVE LEARNING ENDPOINTS ───────────────────────

class AdaptiveAssessmentRequest(BaseModel):
    student_id: str
    question_id: int
    teacher_id: str
    answer: str
    is_correct: bool
    time_taken: float
    difficulty_rating: float

@app.post("/api/adaptive/submit-answer")
async def submit_answer(request: AdaptiveAssessmentRequest):
    """Record student answer and update adaptive learning models"""
    try:
        assessment_id = db.record_assessment(
            student_id=request.student_id,
            question_id=request.question_id,
            teacher_id=request.teacher_id,
            answer=request.answer,
            is_correct=request.is_correct,
            time_taken=request.time_taken,
            difficulty_rating=request.difficulty_rating
        )

        return {
            "success": True,
            "assessment_id": assessment_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/adaptive/student-progress")
async def get_student_progress(data: dict):
    """Get student's current learning progress"""
    try:
        student_id = data.get("student_id")
        if not student_id:
            return {"success": False, "error": "student_id required"}

        progress = db.get_student_progress(student_id)
        return {
            "success": True,
            "student_id": student_id,
            "progress": progress
        }
    except Exception as e:
        default_progress = {
            "overall_mastery": 0.0,
            "objectives": [],
            "total_topics": 0
        }
        return {
            "success": True,
            "student_id": data.get("student_id", "unknown"),
            "progress": default_progress
        }

@app.post("/api/adaptive/recommend-next")
async def recommend_next(data: dict):
    """Get adaptive learning recommendations for student"""
    try:
        from ml_models import path_recommender

        student_id = data.get("student_id")
        num_recommendations = data.get("num_recommendations", 3)

        if not student_id:
            raise HTTPException(status_code=400, detail="student_id required")

        recommendations = path_recommender.get_recommendations(
            student_id=student_id,
            num_recommendations=num_recommendations
        )

        return {
            "success": True,
            "student_id": student_id,
            "recommendations": recommendations
        }
    except Exception as e:
        default_recommendations = [
            {"topic": "Introduction to the Topic", "reason": "foundational", "priority": 0.9, "difficulty": "easy"},
            {"topic": "Key Concepts and Vocabulary", "reason": "foundational", "priority": 0.8, "difficulty": "easy"},
            {"topic": "Practical Applications", "reason": "foundational", "priority": 0.7, "difficulty": "medium"},
        ]
        return {
            "success": True,
            "student_id": data.get("student_id", "unknown"),
            "recommendations": default_recommendations,
            "note": "Using default recommendations"
        }

@app.post("/api/adaptive/generate-adaptive-question")
async def generate_adaptive_question(data: dict):
    """Generate question at appropriate difficulty level"""
    try:
        from ml_models import difficulty_adaptor, irt_model

        student_id = data.get("student_id")
        topic = data.get("topic")
        grade_level = data.get("grade_level")

        if not all([student_id, topic, grade_level]):
            raise HTTPException(status_code=400, detail="student_id, topic, grade_level required")

        # Get student progress to estimate ability
        progress = db.get_student_progress(student_id)
        student_ability = irt_model.estimate_ability(
            sum(obj['correct_answers'] for obj in progress['objectives']),
            sum(obj['total_attempts'] for obj in progress['objectives'])
        ) if progress['objectives'] else 0.5

        # Suggest appropriate difficulty
        suggested_difficulty = difficulty_adaptor.get_next_difficulty(
            student_ability=student_ability,
            current_difficulty=0.5,
            recent_performance=[]
        )

        # Generate question using existing AI endpoint
        prompt = f"""Generate a {topic} question for {grade_level} level.
        Difficulty: {suggested_difficulty} (0=easy, 1=hard)
        Include 4 multiple choice options and mark the correct answer."""

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert educator. Generate a clear, engaging educational question."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=300
        )

        question_text = response.choices[0].message.content

        return {
            "success": True,
            "student_id": student_id,
            "topic": topic,
            "difficulty": suggested_difficulty,
            "question": question_text,
            "student_ability": student_ability
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/adaptive/teacher-insights")
async def get_teacher_insights(data: dict):
    """Get analytics and insights for teacher dashboard"""
    try:
        class_id = data.get("class_id")

        if not class_id:
            raise HTTPException(status_code=400, detail="class_id required")

        # Get all students for this class from database
        import sqlite3
        from pathlib import Path
        db_path = Path(__file__).parent / "classroom.db"
        conn = sqlite3.connect(str(db_path))
        c = conn.cursor()

        c.execute('''
            SELECT student_id, name FROM students WHERE teacher_id = ? LIMIT 100
        ''', (class_id,))

        students = c.fetchall()

        if not students:
            return {
                "success": True,
                "stats": {
                    "total_students": 0,
                    "average_mastery": 0.0,
                    "students_below_threshold": 0,
                    "students_above_80": 0,
                    "new_students_today": 0
                },
                "students": [],
                "topics": [],
                "recommendations": []
            }

        # Aggregate student progress data
        student_progresses = []
        topic_mastery_map = {}
        total_mastery = 0
        below_threshold = 0
        above_80 = 0

        for student_id, name in students:
            c.execute('''
                SELECT language, mastery_level, attempts_made, correct_answers FROM learning_objectives
                WHERE student_id = ?
            ''', (student_id,))

            objectives = c.fetchall()

            if objectives:
                student_mastery = sum(obj[1] for obj in objectives) / len(objectives)
                total_attempts = sum(obj[2] for obj in objectives)

                student_progresses.append({
                    'name': name,
                    'student_id': student_id,
                    'overall_mastery': student_mastery,
                    'total_attempts': total_attempts
                })

                total_mastery += student_mastery

                if student_mastery < 0.7:
                    below_threshold += 1
                if student_mastery >= 0.8:
                    above_80 += 1

                # Track topic mastery
                for lang, mastery, attempts, correct in objectives:
                    if lang not in topic_mastery_map:
                        topic_mastery_map[lang] = {'total': 0, 'count': 0}
                    topic_mastery_map[lang]['total'] += mastery
                    topic_mastery_map[lang]['count'] += 1

        avg_mastery = total_mastery / len(student_progresses) if student_progresses else 0

        # Convert topic mastery map to list
        topics = [
            {
                'topic': topic,
                'average_mastery': data['total'] / data['count'] if data['count'] > 0 else 0
            }
            for topic, data in sorted(
                topic_mastery_map.items(),
                key=lambda x: x[1]['total'] / x[1]['count'] if x[1]['count'] > 0 else 0
            )
        ]

        # Get pending recommendations
        c.execute('''
            SELECT student_id, recommended_language, reasoning, difficulty_level, priority_score
            FROM recommendations
            WHERE student_id IN (SELECT student_id FROM students WHERE teacher_id = ?)
            AND status = 'pending'
            ORDER BY priority_score DESC
            LIMIT 10
        ''', (class_id,))

        recommendations = []
        for rec in c.fetchall():
            student_id, lang, reasoning, difficulty, priority = rec
            # Find student name
            student_name = next((s[1] for s in students if s[0] == student_id), f"Student {student_id[:8]}")
            recommendations.append({
                'student_id': student_id,
                'student_name': student_name,
                'recommended_language': lang,
                'reasoning': reasoning,
                'difficulty_level': difficulty,
                'priority': priority
            })

        conn.close()

        return {
            "success": True,
            "stats": {
                "total_students": len(students),
                "average_mastery": avg_mastery,
                "students_below_threshold": below_threshold,
                "students_above_80": above_80,
                "new_students_today": 0
            },
            "students": student_progresses[:20],  # Limit to top 20
            "topics": topics,
            "recommendations": recommendations
        }
    except Exception as e:
        print(f"[ERROR] Teacher insights error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── INTERACTIVE QUIZ GENERATOR ────────────────────────

class QuizRequest(BaseModel):
    topic: str
    grade_level: str
    subject: str = ""
    num_questions: int = 5
    difficulty: str = "medium"

@app.post("/api/quiz")
async def generate_quiz(request: QuizRequest):
    if not request.topic.strip():
        raise HTTPException(status_code=400, detail="Topic cannot be empty")
    grade_profile = get_grade_language_profile(request.grade_level)
    prompt = f"""Generate {request.num_questions} multiple choice quiz questions about "{request.topic}" for {request.grade_level} students.
{f'Subject: {request.subject}' if request.subject else ''}
Difficulty: {request.difficulty}
{grade_profile}

Return ONLY valid JSON (no markdown):
{{
  "title": "<Quiz title>",
  "questions": [
    {{
      "id": 1,
      "question": "<Question text>",
      "options": ["A) <option>", "B) <option>", "C) <option>", "D) <option>"],
      "correct": "A",
      "explanation": "<Why this answer is correct, 1-2 sentences>"
    }}
  ]
}}

Rules:
- correct must be A, B, C, or D
- All 4 options must be plausible (no obviously wrong answers)
- explanation must be educational and friendly
- questions must be appropriate for grade level
- Use simple language for younger grades"""

    try:
        completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a quiz generator. Always respond with valid JSON only. No markdown."},
                {"role": "user", "content": prompt},
            ],
            model=OPENAI_MODEL, temperature=0.5, max_tokens=1000,
        )
        import re as _re
        text = completion.choices[0].message.content.strip()
        text = _re.sub(r'^```[a-z]*\s*', '', text)
        text = _re.sub(r'\s*```$', '', text).strip()
        data = json.loads(text)
        return data
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse quiz JSON: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── SERVE FRONTEND ────────────────────────────────────

FRONTEND_DIST = Path(__file__).parent.parent / "frontend" / "dist"

if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

NO_CACHE_HEADERS = {"Cache-Control": "no-cache, no-store, must-revalidate", "Pragma": "no-cache", "Expires": "0"}

@app.get("/")
def serve_index():
    index_file = FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(index_file, headers=NO_CACHE_HEADERS)
    return {"message": "Frontend not built"}

@app.get("/{full_path:path}", include_in_schema=False)
def serve_frontend(full_path: str):
    if full_path.startswith("api/"):
        return {"error": "Not found"}
    file_path = FRONTEND_DIST / full_path
    if file_path.exists():
        return FileResponse(file_path)
    index_file = FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(index_file, headers=NO_CACHE_HEADERS)
    return {"error": "Not found"}

if __name__ == "__main__":
    import uvicorn
    import socket

    # Configure socket to allow reuse (fixes TIME_WAIT port binding issues on Windows)
    class SocketReusableServer(uvicorn.Server):
        def install_signal_handlers(self):
            pass

    # Create uvicorn config with socket reuse enabled
    config = uvicorn.Config(
        app,
        host="127.0.0.1",
        port=8001,
        log_level="info"
    )

    # Allow address reuse to fix "port already in use" errors
    config.disable_lifespan = False

    server = uvicorn.Server(config)

    # Patch socket to allow reuse
    original_socket = socket.socket
    def patched_socket(*args, **kwargs):
        sock = original_socket(*args, **kwargs)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        if hasattr(socket, 'SO_REUSEPORT'):
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEPORT, 1)
        return sock
    socket.socket = patched_socket

    try:
        import asyncio
        asyncio.run(server.serve())
    except KeyboardInterrupt:
        pass
