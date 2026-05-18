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
    # Optional NCERT/CBSE chapter description for the selected topic.
    topic_description: str = ""
    # "core" (CBSE TOC topic) or "miscellaneous" (curated extra topic).
    topic_track: str = "core"

class LessonPlanEnrichRequest(BaseModel):
    # The existing lesson plan body (so the model can extend it coherently).
    existing_plan: str
    topic: str
    grade_level: str
    subject: str
    duration: str = "45 minutes"
    topic_description: str = ""
    # One of: "more_activities", "more_examples", "more_topics"
    action: str = "more_activities"

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


def call_openai(system_prompt: str, user_prompt: str, max_tokens: int = 4096, temperature: float = 0.5) -> str:
    try:
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt},
            ],
            temperature=temperature,
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

    lang_profile = get_grade_language_profile(req.grade_level)

    # Get subject-specific question intelligence
    subj_lower = (req.subject or '').lower()
    subject_intelligence = ""
    if 'math' in subj_lower:
        subject_intelligence = (
            "MATH WORKSHEET RULES:\n"
            "- Every question must require CALCULATION or MATHEMATICAL WORKING\n"
            "- Include specific numerical values in every problem\n"
            "- Use word problems with real-world scenarios (not just 'Solve 2+3')\n"
            "- For higher grades: include proofs, constructions, derivations\n"
            "- NEVER write 'Define X' or 'What is X' — always ask 'Find', 'Calculate', 'Prove', 'Solve', 'Construct'\n"
        )
    elif any(s in subj_lower for s in ['science', 'physics', 'chemistry', 'biology']):
        subject_intelligence = (
            "SCIENCE WORKSHEET RULES:\n"
            "- Include numerical problems with given data and formulas\n"
            "- Ask diagram-based questions (draw and label, identify parts)\n"
            "- Include experiment-based questions (procedure, observation, conclusion)\n"
            "- Use real-world application scenarios, not just textbook recall\n"
            "- NEVER write generic 'Define X' or 'Explain X' — ask specific mechanism/reasoning questions\n"
        )
    elif any(s in subj_lower for s in ['history', 'social', 'geography', 'civics']):
        subject_intelligence = (
            "SOCIAL SCIENCE WORKSHEET RULES:\n"
            "- Include source-based questions with excerpts\n"
            "- Ask map-based questions for geography\n"
            "- Focus on cause-effect, analysis, and evaluation — not just dates/names\n"
            "- Include case study and scenario-based questions\n"
        )

    system_prompt = (
        "You are a senior CBSE/NCERT teacher with 20 years of experience creating worksheets. "
        "Every question you write is SPECIFIC, requires genuine thinking, and matches the quality "
        "of actual CBSE board exam questions. You NEVER write lazy questions like 'Define X' or 'What is X'. "
        "Every question must require calculation, analysis, reasoning, or creative application. "
        f"{lang_profile} "
        + ("Derive ALL questions from the provided source material. " if req.source_material.strip() else "")
        + "Format output with CLEAN MARKDOWN for readability:\n"
        "- Use # for main title, ## for section headers, ### for sub-sections\n"
        "- Use **bold** for important terms and labels\n"
        "- Use numbered lists (1. 2. 3.) for questions\n"
        "- Use bullet points (- ) for lists\n"
        "- Use --- for section dividers\n"
    )

    user_prompt = (
        f"Create a PRINT-READY worksheet for {req.grade_level} students.\n\n"
        f"TOPIC: {req.topic}\n"
        f"{'SUBJECT: ' + req.subject if req.subject else ''}\n"
        f"QUESTION TYPE: {q_type}\n"
        f"NUMBER OF QUESTIONS: {req.num_questions}\n"
        f"DIFFERENTIATION LEVEL: {diff}\n"
        f"BLOOM'S TAXONOMY FOCUS: {blooms}\n"
        f"{word_bank_note}\n"
        f"{'ADDITIONAL INSTRUCTIONS: ' + req.additional_instructions if req.additional_instructions else ''}\n"
        f"{material_note}\n\n"
        f"{subject_intelligence}\n"
        "QUESTION QUALITY RULES (CRITICAL):\n"
        "- EVERY question must be a complete, well-formed sentence as it would appear on a printed exam\n"
        "- Include specific values, measurements, names, dates, or scenarios in EVERY question\n"
        "- For numerical subjects: at least 50% questions must require step-by-step calculation\n"
        "- FORBIDDEN: 'Define X', 'What is X', 'List the features of X', 'Explain X in brief'\n"
        "- Each question must need at least 2-3 lines of working/writing to answer\n\n"
        "FORMAT:\n"
        "- Title in ALL CAPS\n"
        "- Name / Date / Class lines\n"
        f"{'- Word Bank box listing all fill-in words' if req.include_word_bank else ''}\n"
        "- Brief student instructions\n"
        "- Questions numbered 1, 2, 3...\n"
        "- For MCQ: 4 plausible options (A, B, C, D) — no obviously wrong choices\n"
        "- For fill-in-blank: use ________ for blanks\n"
        "- For open-ended: include point values and expected answer length\n\n"
        "## Answer Key\n"
        "- Each answer numbered to match\n"
        "- Include full solution steps for calculation questions\n"
        "- Include 1-2 sentence explanation for each answer\n\n"
        "Use proper markdown formatting: # for title, ## for sections, **bold** for key terms, numbered lists for questions, - for bullets."
    )

    result = call_openai(system_prompt, user_prompt, max_tokens=4096)
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

    lang_profile = get_grade_language_profile(req.grade_level)

    style_map = {
        "mixed":       "visual + auditory + kinesthetic combined",
        "visual":      "diagrams, charts, graphic organizers, color-coding, videos",
        "auditory":    "discussion, verbal explanations, think-pair-share, reading aloud",
        "kinesthetic": "movement activities, manipulatives, experiments, role-play",
    }

    needs_map = {
        "general":       "a general education classroom with diverse learners",
        "ell":           "English Language Learners — sentence frames, visual vocabulary, bilingual supports",
        "special_needs": "students with diverse learning needs — modifications, accommodations, chunked tasks",
        "gifted":        "gifted and talented — enrichment tasks, higher-order questioning, independent projects",
    }

    tech_map = {
        "low":         "low-tech: paper, pencil, physical manipulatives, whiteboards",
        "digital":     "digital: presentations, educational websites, online quizzes, Google Docs/Slides",
        "interactive": "interactive/blended: interactive whiteboard, simulations, collaborative platforms, apps",
    }

    class_map = {
        "in-person": "traditional in-person classroom",
        "remote":    "fully remote/virtual — video call strategies, breakout rooms, digital submission",
        "hybrid":    "hybrid with both in-person and remote students simultaneously",
    }

    lesson_material_note = ""
    if req.source_material.strip():
        lesson_material_note = (
            f"\n\nTEACHER-UPLOADED SOURCE MATERIAL (align the lesson to this content):\n"
            f"---\n{req.source_material[:5000]}\n---\n"
        )

    chapter_context = ""
    if req.topic_description.strip():
        track_label = "OFFICIAL CBSE/NCERT CHAPTER" if req.topic_track == "core" else "ENRICHMENT TOPIC"
        chapter_context = (
            f"\n{track_label} REFERENCE:\n\"{req.topic_description.strip()}\"\n"
        )

    additional_notes_instruction = ""
    if req.additional_notes and req.additional_notes.strip():
        additional_notes_instruction = (
            f"\n\nTEACHER'S SPECIAL REQUEST (MUST follow this):\n"
            f"\"{req.additional_notes.strip()}\"\n"
            f"Integrate this request throughout the lesson plan. If the teacher asks for "
            f"example questions at each subtopic, include worked examples under every subtopic. "
            f"If the teacher asks for specific activities, include those activities.\n"
        )

    additional_notes_section = ""
    if req.additional_notes and req.additional_notes.strip():
        additional_notes_section = (
            f"\nTEACHER'S SPECIAL REQUEST: {req.additional_notes.strip()}\n"
            f"You MUST follow this request and integrate it into the lesson plan.\n"
        )

    system_prompt = (
        "You are an expert teacher writing a lesson plan that another teacher can walk into "
        "class and teach from directly. You always include ACTUAL solved examples with numbers "
        "and step-by-step working. You never write generic descriptions — you write the real "
        "content. Format with clean markdown: # for title, ## for section headers, ### for sub-sections, "
        "**bold** for key terms, numbered lists for steps, - for bullet points, --- for dividers. "
        f"{lang_profile}"
    )

    user_prompt = (
        f"Write a detailed, classroom-ready lesson plan.\n\n"
        f"Topic: {req.topic}\n"
        f"Subject: {req.subject}\n"
        f"Grade: {req.grade_level}\n"
        f"Duration: {req.duration}\n"
        f"{chapter_context}"
        f"{additional_notes_section}"
        f"{lesson_material_note}\n"
        "Follow this EXACT structure. Fill in every section with REAL content.\n\n"

        "---\n\n"

        "LESSON OVERVIEW\n"
        f"Topic: {req.topic}\n"
        f"Grade: {req.grade_level} | Subject: {req.subject} | Duration: {req.duration}\n"
        "Essential Question: [Write one thought-provoking question]\n"
        "By the end of this lesson, students will be able to:\n"
        "  1. [First specific skill]\n"
        "  2. [Second specific skill]\n"
        "  3. [Third specific skill]\n\n"

        "MATERIALS NEEDED\n"
        "- [List every item with quantity, e.g., 30 calculators, 15 protractors]\n"
        "- Textbook: [chapter and page reference if applicable]\n"
        "- Board setup: [what to draw/write before class starts]\n\n"

        "WARM-UP / HOOK (5 minutes)\n"
        "Activity: [Describe a specific, engaging opening — a puzzle, challenge, real-world "
        "scenario, or surprising demo. NOT 'discuss the topic'. Write exactly what the teacher "
        "does and says.]\n"
        "Ask students: [Write 2-3 specific questions with expected answers]\n\n"

        "DIRECT INSTRUCTION (15-20 minutes)\n"
        "Teach the following concepts in order. After EACH concept, include a worked example.\n\n"
        "Concept 1: [Name and definition]\n"
        "Write on board: [What to write]\n"
        "Explain: [What to say to students, 2-3 sentences]\n\n"
        "  Worked Example 1:\n"
        "  Question: [Write the actual question with numbers]\n"
        "  Solution:\n"
        "    Step 1: [Show the actual calculation]\n"
        "    Step 2: [Show the next step]\n"
        "    Step 3: [If needed]\n"
        "    Answer: [The final answer]\n"
        "  Ask class: [A quick check question]\n\n"
        "Concept 2: [Name and definition]\n"
        "Write on board: [What to write]\n"
        "Explain: [What to say]\n\n"
        "  Worked Example 2:\n"
        "  Question: [Actual question]\n"
        "  Solution:\n"
        "    Step 1: [Actual work]\n"
        "    Step 2: [Actual work]\n"
        "    Answer: [Answer]\n"
        "  Ask class: [Check question]\n\n"
        "Concept 3: [Name and definition]\n\n"
        "  Worked Example 3:\n"
        "  Question: [Actual question]\n"
        "  Solution: [Full step-by-step]\n"
        "  Answer: [Answer]\n\n"
        "[Continue for all key concepts in the topic. Include at least 3-4 worked examples total.]\n\n"

        "GUIDED PRACTICE ACTIVITY (10-15 minutes)\n"
        "Activity Name: [Give it a fun, creative name like 'Trig Relay Race' or 'Equation "
        "Scavenger Hunt']\n"
        "How it works:\n"
        "  Step 1: [Exact instruction]\n"
        "  Step 2: [Exact instruction]\n"
        "  Step 3: [Exact instruction]\n"
        "Group size: [e.g., pairs or groups of 4]\n"
        "Questions for the activity:\n"
        "  Q1: [Actual question] -- Answer: [answer]\n"
        "  Q2: [Actual question] -- Answer: [answer]\n"
        "  Q3: [Actual question] -- Answer: [answer]\n"
        "  Q4: [Actual question] -- Answer: [answer]\n"
        "Teacher tip: [What mistakes to watch for]\n\n"

        "INDEPENDENT PRACTICE (10 minutes)\n"
        "Students solve these on their own:\n"
        "  Easy:\n"
        "    1. [Question] -- Answer: [answer]\n"
        "    2. [Question] -- Answer: [answer]\n"
        "  Medium:\n"
        "    3. [Question] -- Answer: [answer]\n"
        "    4. [Question] -- Answer: [answer]\n"
        "  Challenging:\n"
        "    5. [Question] -- Answer: [answer]\n"
        "    6. [Question] -- Answer: [answer]\n\n"

        "EXIT TICKET (5 minutes)\n"
        "Students answer on a slip of paper before leaving:\n"
        "  1. [Specific question] -- Expected answer: [answer]\n"
        "  2. [Specific question] -- Expected answer: [answer]\n\n"

        "DIFFERENTIATION\n"
        "For struggling learners:\n"
        "  - [Specific scaffold or simpler version of a problem]\n"
        "  - [Another support strategy]\n"
        "For advanced students:\n"
        "  - Challenge: [A harder problem that extends the concept]\n"
        "  - Extension: [An open-ended exploration task]\n\n"

        "HOMEWORK (4-5 problems)\n"
        "  1. [Easy] [Question] -- Answer: [answer]\n"
        "  2. [Easy] [Question] -- Answer: [answer]\n"
        "  3. [Medium] [Question] -- Answer: [answer]\n"
        "  4. [Hard] [Question] -- Answer: [answer]\n"
        "  5. [Hard] [Question] -- Answer: [answer]\n\n"

        "TEACHER NOTES\n"
        "- Common mistakes: [2-3 specific mistakes students make on this topic]\n"
        "- Time adjustment: [What to cut if running short, what to extend if time remains]\n"
        "- Next lesson: [What comes next and how this connects]\n\n"

        "IMPORTANT: Replace every [bracket] with ACTUAL content. Write real questions with "
        "real numbers and real solutions. Do not leave any brackets or placeholders.\n\n"
        "FORMAT with clean markdown: use ## for each major section header (e.g., ## Lesson Overview, ## Warm-Up / Hook), "
        "### for sub-sections, **bold** for key terms and labels, numbered lists for steps and questions, "
        "- for bullet points, --- for section dividers."
    )

    # Use higher token limit for detailed, example-rich output
    lesson_result = call_openai(system_prompt, user_prompt, max_tokens=6000, temperature=0.4)

    # Generate topic overview only if requested (as a separate quick-reference page)
    if req.include_topic_overview:
        topic_system = (
            "You are a subject matter expert. Create a concise teacher quick-reference sheet. "
            f"{lang_profile} "
            "Format with clean markdown: ## for section headers, **bold** for key terms, - for bullet lists."
        )

        topic_prompt = (
            f"Create a 1-page QUICK REFERENCE SHEET for a teacher about to teach this topic:\n\n"
            f"TOPIC: {req.topic}\nSUBJECT: {req.subject}\nGRADE LEVEL: {req.grade_level}\n\n"
            "Include these sections (keep each section concise and useful):\n\n"
            "WHAT THIS TOPIC IS: 2-3 sentence summary of the topic and why students learn it\n\n"
            "KEY FORMULAS / RULES: List all important formulas, theorems, or rules with notation\n\n"
            "ESSENTIAL VOCABULARY: 6-8 key terms with one-line definitions\n\n"
            "COMMON STUDENT MISTAKES: 3-4 specific mistakes students make and how to correct them\n\n"
            "REAL-WORLD CONNECTIONS: 3 specific examples of where this topic appears in real life\n\n"
            "PREREQUISITE CHECK: What students should already know before this lesson\n\n"
            "Use ## for section headers, **bold** for terms, - for bullet points."
        )

        topic_overview = call_openai(topic_system, topic_prompt, max_tokens=1500, temperature=0.3)
        result = (
            "=== TEACHER QUICK REFERENCE ===\n\n"
            + topic_overview
            + "\n\n" + "=" * 50 + "\n\n"
            + "=== LESSON PLAN ===\n\n"
            + lesson_result
        )
    else:
        result = lesson_result

    return {"result": result, "tool": "lesson-plan"}


@app.post("/api/lesson-plan/enrich")
def enrich_lesson_plan(req: LessonPlanEnrichRequest):
    if not req.existing_plan.strip():
        raise HTTPException(status_code=400, detail="Existing plan is required.")
    if not req.topic.strip():
        raise HTTPException(status_code=400, detail="Topic is required.")

    action_map = {
        "more_activities": {
            "title": "ADDITIONAL CLASSROOM ACTIVITIES",
            "instruction": (
                "Generate 4-5 NEW, distinct in-class activities for this lesson that are NOT "
                "already in the existing plan. For each activity include: a clear name, time "
                "estimate, materials needed, step-by-step teacher instructions, student grouping, "
                "and the learning outcome. Mix kinesthetic, collaborative, discussion-based, and "
                "creative formats. Keep them NCERT/CBSE classroom appropriate."
            ),
        },
        "more_examples": {
            "title": "ADDITIONAL NCERT-STYLE EXAMPLE QUESTIONS WITH SOLUTIONS",
            "instruction": (
                "Generate 6-8 ADDITIONAL example questions in NCERT textbook style for the topics "
                "explained in the existing lesson plan. Do NOT repeat any question already shown "
                "above. Cover a range: 2 easy, 3 medium, 2 HOTS (Higher Order Thinking Skills). "
                "For each: state the question, show every solution step with intermediate "
                "reasoning, and end with the final answer. Use the exact tone, notation, and "
                "structure of solved examples in NCERT books for this grade."
            ),
        },
        "more_topics": {
            "title": "ADDITIONAL SUBTOPICS & RELATED TOPICS TO COVER",
            "instruction": (
                "Suggest 5-7 ADDITIONAL subtopics and closely related topics the teacher can "
                "cover to deepen understanding of the main topic. For each subtopic include: "
                "a 1-line description, 2-3 key concepts inside it, suggested time to cover, "
                "1 fully solved NCERT-style example question, and a quick practice question with "
                "answer. Order from foundational to advanced."
            ),
        },
    }

    spec = action_map.get(req.action)
    if not spec:
        raise HTTPException(status_code=400, detail="Unknown action.")

    chapter_context = (
        f"\nNCERT CHAPTER REFERENCE: \"{req.topic_description.strip()}\"\n"
        if req.topic_description.strip() else ""
    )

    system_prompt = (
        "You are a senior NCERT-aligned teacher and curriculum designer. "
        "Extend an existing lesson plan with new, non-overlapping, classroom-ready content. "
        "Format with markdown: ## for section headers, ### for sub-sections, **bold** for key terms, "
        "numbered lists for questions, - for bullets. Model all questions and solutions on NCERT textbook style."
    )

    user_prompt = (
        f"Existing lesson plan (for reference — do not repeat its content):\n"
        f"---\n{req.existing_plan[:6000]}\n---\n\n"
        f"TOPIC: {req.topic}\n"
        f"SUBJECT: {req.subject}\n"
        f"GRADE LEVEL: {req.grade_level}\n"
        f"DURATION: {req.duration}\n"
        f"{chapter_context}\n"
        f"Produce a single section titled:\n{spec['title']}\n\n"
        f"{spec['instruction']}\n\n"
        "Output ONLY this new section with clean markdown formatting."
    )

    addition = call_openai(system_prompt, user_prompt, max_tokens=1800)
    return {"result": addition, "tool": "lesson-plan", "action": req.action}


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

    lang_profile = get_grade_language_profile(req.grade_level)

    system_prompt = (
        "You are an expert assessment designer. Create rigorous, fair assessments with "
        "SPECIFIC, SCENARIO-BASED questions — not generic recall questions. "
        "Every distractor must be plausible (common student mistakes). "
        "No trick questions, no double negatives, no 'all of the above'. "
        f"{lang_profile} "
        + ("ALL questions must come directly from the provided source material. " if req.source_material.strip() else "")
        + "Format with clean markdown: # for title, ## for sections, **bold** for key terms, "
        "numbered lists for questions, - for bullet points."
    )

    user_prompt = (
        f"Create a {req.num_questions}-question assessment on: '{req.topic}'\n\n"
        f"GRADE LEVEL: {req.grade_level}\n"
        f"{'SUBJECT: ' + req.subject if req.subject else ''}\n"
        f"DIFFICULTY: {diff_desc.get(req.difficulty, diff_desc['medium'])}\n"
        f"BLOOM'S TAXONOMY: {blooms_map.get(req.blooms_level, blooms_map['mixed'])}\n"
        f"FORMAT: {format_map.get(req.question_format, format_map['pure_mc'])}\n"
        f"{'STANDARDS: ' + req.standards if req.standards else ''}\n"
        f"{'ADDITIONAL INSTRUCTIONS: ' + req.additional_instructions if req.additional_instructions else ''}\n"
        f"{mc_material_note}\n"
        "FORMAT:\n"
        "- Title in ALL CAPS with topic and grade\n"
        "- Name / Date / Score fields\n"
        "- Brief student instructions (time allowed, marking scheme)\n"
        "- Questions numbered consecutively\n"
        "- MC options labeled A, B, C, D\n\n"
        "QUESTION QUALITY RULES:\n"
        "- Use real-world scenarios and applied problems (e.g., 'A ladder leans against a wall "
        "at 60 degrees...' not 'What is the sine of an angle?')\n"
        "- Include diagram descriptions where helpful (e.g., 'In the figure, triangle ABC has...')\n"
        "- Mix question types: some conceptual, some calculation-based, some application\n"
        "- Each wrong option should represent a COMMON STUDENT MISTAKE\n\n"
        f"ANSWER KEY: {answer_key_note}\n"
        "For calculation questions, show the working in the answer key.\n\n"
        "Use markdown: # for title, ## for sections, **bold** for important terms, numbered lists for questions."
    )

    result = call_openai(system_prompt, user_prompt, max_tokens=4096)
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
        + "Format with markdown: # for title, ## for sections, **bold** for key terms, "
        "numbered lists for questions, - for bullets."
    )
    ws_user = (
        f"Create a complete classroom worksheet for {req.grade_level} students.\n\n"
        f"TOPIC: {req.topic}\nSUBJECT: {req.subject}\n"
        f"QUESTION TYPE: {type_map.get(req.worksheet_type, type_map['mixed'])}\n"
        f"NUMBER OF QUESTIONS: {req.num_questions}\n"
        f"{auto_material_note}\n"
        "Include: # worksheet title, Name/Date/Class lines, student instructions, "
        "numbered questions, and ## Answer Key at the bottom with rationales.\n"
        "Use markdown: # title, ## sections, **bold**, numbered lists, - bullets."
    )

    # ── Topic Overview (Page 1 — teacher reference) ────
    ov_system = (
        f"You are a subject matter expert and experienced educator writing a teacher reference guide. "
        f"{lang} "
        "Format with markdown: ## for section headers, **bold** for key terms, - for bullet lists."
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
        "Use markdown: ## for sections, **bold** for terms, - for bullets."
    )

    # ── Lesson Plan (Page 2 — teaching instructions) ───
    lp_system = (
        f"You are a master curriculum designer creating a lesson plan for {req.grade_level} students. "
        f"{lang} "
        "Include ACTUAL worked examples with step-by-step solutions and SPECIFIC creative activities. "
        "Never write vague instructions like 'provide examples' — write the actual examples. "
        "Format with markdown: ## for section headers, ### for sub-sections, **bold** for key terms, "
        "numbered lists for steps, - for bullet points, --- for dividers."
    )
    lp_user = (
        f"Create a DETAILED 45-minute lesson plan with REAL teaching content:\n\n"
        f"TOPIC: {req.topic}\nSUBJECT: {req.subject}\nGRADE LEVEL: {req.grade_level}\n\n"
        "Include ALL sections with ACTUAL content (not placeholders):\n"
        "1. LESSON OVERVIEW (SWBAT objectives, essential question, success criteria)\n"
        "2. MATERIALS AND RESOURCES (with quantities)\n"
        "3. WARM-UP/HOOK (5 min) - a SPECIFIC engaging activity, puzzle, or real-world challenge\n"
        "4. DIRECT INSTRUCTION (15 min) - step-by-step teaching script with 2-3 WORKED EXAMPLES "
        "showing full solutions\n"
        "5. GUIDED PRACTICE (10 min) - a NAMED creative activity (e.g., 'Equation Relay Race') "
        "with 3-4 actual practice questions and solutions\n"
        "6. INDEPENDENT PRACTICE (10 min) - 4-5 actual problems with answer key\n"
        "7. EXIT TICKET (5 min) - 2 specific questions with expected answers\n"
        "8. DIFFERENTIATION - simpler problems for struggling learners, challenge problems for advanced\n\n"
        "CRITICAL: Write REAL questions, REAL solutions, REAL activities. "
        "A teacher must be able to teach directly from this.\n"
        "Use markdown: ## for sections, ### for sub-sections, **bold** for key terms, numbered lists, - for bullets."
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
        "Format with markdown: # for title, ## for sections, **bold** for key terms, numbered lists for questions. "
        "All wrong answer choices must be plausible but clearly incorrect to students who studied."
    )
    mc_user = (
        f"Create a {req.num_questions}-question assessment:\n\n"
        f"TOPIC: {req.topic}\nSUBJECT: {req.subject}\nGRADE LEVEL: {req.grade_level}\n"
        f"FORMAT: {format_map.get(req.mc_format, format_map['pure_mc'])}\n"
        f"{auto_material_note}\n"
        "Include: title in ALL CAPS, Name/Date/Score fields, student instructions, "
        "numbered questions, and ## Answer Key with one-sentence explanations per answer.\n"
        "Use markdown: # title, ## sections, **bold**, numbered lists, - bullets."
    )

    # ── Run sequentially to stay within Groq free-tier rate limits ────────────
    topic_overview = call_openai(ov_system, ov_user, 1200, temperature=0.3)
    lesson_content = call_openai(lp_system, lp_user, 3000, temperature=0.4)
    worksheet      = call_openai(ws_system, ws_user, 2000, temperature=0.4)
    mc_assessment  = call_openai(mc_system, mc_user, 2000, temperature=0.4)

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

    # Subject-specific activity intelligence
    subj_lower = (req.subject or '').lower()
    subject_activity_hints = ""
    if 'math' in subj_lower:
        subject_activity_hints = (
            "MATH ACTIVITY INTELLIGENCE:\n"
            "- Include hands-on manipulatives (paper folding for geometry, blocks for fractions, etc.)\n"
            "- Design activities where students DISCOVER mathematical concepts through exploration\n"
            "- Include real measurement tasks (measure classroom objects, calculate areas)\n"
            "- Use math puzzles, pattern recognition, and logical reasoning games\n"
            "- For higher grades: include real-world modeling (budgeting, statistics from surveys)\n"
        )
    elif any(s in subj_lower for s in ['science', 'physics', 'chemistry', 'biology']):
        subject_activity_hints = (
            "SCIENCE ACTIVITY INTELLIGENCE:\n"
            "- Design actual experiments students can perform with available materials\n"
            "- Include hypothesis → procedure → observation → conclusion format\n"
            "- Use inquiry-based learning where students discover concepts\n"
            "- Include field observation activities (plant growth, weather tracking)\n"
            "- For chemistry/physics: include safe demonstrations with household items\n"
        )
    elif 'english' in subj_lower:
        subject_activity_hints = (
            "ENGLISH ACTIVITY INTELLIGENCE:\n"
            "- Include role-play, dramatization, and reader's theater\n"
            "- Design collaborative writing exercises (story relay, group essay)\n"
            "- Include debate and structured discussion formats\n"
            "- Use creative activities (poetry slam, comic strip creation, news broadcast)\n"
        )
    elif any(s in subj_lower for s in ['history', 'social', 'geography', 'civics']):
        subject_activity_hints = (
            "SOCIAL SCIENCE ACTIVITY INTELLIGENCE:\n"
            "- Include map-making and geographical modeling activities\n"
            "- Design timeline creation and historical reenactment activities\n"
            "- Use case studies from current events connected to topics\n"
            "- Include mock parliament, mock court, or community planning exercises\n"
        )

    system_prompt = (
        "You are a master teacher and CBSE-trained instructional designer with expertise in "
        "active learning, NEP 2020 pedagogy, and experiential education. "
        "You create activities that are SPECIFIC, ACTIONABLE, and directly tied to curriculum outcomes. "
        "Every activity you design has been tested in real Indian classrooms and works with commonly available materials. "
        "You never write vague activities — every step is detailed, timed, and has clear student roles. "
        f"{lang} "
        + ("When source material is provided, align ALL activities directly to that content. " if req.source_material.strip() else "")
        + "Format output with CLEAN MARKDOWN for beautiful readability:\n"
        "- Use # for activity number (e.g., # Activity 1: Shape Scavenger Hunt)\n"
        "- Use ## for section headers (e.g., ## Learning Outcomes, ## Materials Needed, ## Procedure)\n"
        "- Use ### for sub-sections\n"
        "- Use **bold** for important labels, terms, and student roles\n"
        "- Use numbered lists (1. 2. 3.) for steps and procedures\n"
        "- Use bullet points (- ) for materials, outcomes, and reflection questions\n"
        "- Use --- between activities as dividers\n"
    )

    user_prompt = (
        f"Create {req.num_activities} detailed, classroom-tested activities for {req.grade_level} students.\n\n"
        f"TOPIC: {req.topic}\n"
        f"{'SUBJECT: ' + req.subject if req.subject else ''}\n"
        f"ACTIVITY TYPE: {activity_map.get(req.activity_type, activity_map['mixed'])}\n"
        f"DURATION PER ACTIVITY: {req.duration}\n"
        f"GROUP SIZE: {req.group_size}\n"
        f"{'LEARNING OUTCOMES TO ADDRESS: ' + req.learning_outcomes if req.learning_outcomes else ''}\n"
        f"{'MATERIALS AVAILABLE: ' + req.materials_available if req.materials_available else ''}\n"
        f"{'ADDITIONAL INSTRUCTIONS: ' + req.additional_instructions if req.additional_instructions else ''}\n"
        f"{material_note}\n\n"
        f"{subject_activity_hints}\n"
        "ACTIVITY QUALITY RULES (CRITICAL):\n"
        "- Every activity must be SPECIFIC to the topic — not a generic 'discuss in groups' activity\n"
        "- Include exact materials with quantities (e.g., '4 chart papers, 12 colored markers, 1 protractor per group')\n"
        "- Time every sub-step (e.g., 'Step 1: Distribute materials (2 min), Step 2: Explain task (3 min)')\n"
        "- Define clear student roles within groups (recorder, presenter, material manager, etc.)\n"
        "- Include a specific assessment rubric or checklist for each activity\n\n"
        "FOR EACH ACTIVITY, INCLUDE ALL OF THE FOLLOWING:\n\n"
        "1. ACTIVITY TITLE - Creative, engaging name that hints at the concept\n"
        "2. LEARNING OUTCOMES - 2-3 specific SWBAT outcomes aligned to NCERT/CBSE\n"
        "3. MATERIALS NEEDED - Complete list with exact quantities per group\n"
        "4. TEACHER PREPARATION - What to prepare BEFORE class (5-10 min)\n"
        "5. ACTIVITY PROCEDURE - Minute-by-minute breakdown:\n"
        "   - Hook/Introduction (2-3 min) — specific opening question or demonstration\n"
        "   - Main activity steps (numbered, timed)\n"
        "   - Student roles within groups\n"
        "   - Expected student output/deliverable\n"
        "6. DIFFERENTIATION\n"
        "   - Scaffolding: specific support for struggling learners\n"
        "   - Extension: challenge task for advanced students\n"
        "7. ASSESSMENT - Specific rubric or checklist (not just 'observe students')\n"
        "8. REFLECTION QUESTIONS - 2-3 thought-provoking debrief questions\n\n"
        "Make each activity UNIQUE and progressively more challenging. "
        "Activities must be practical for Indian schools with standard resources.\n\n"
        "FORMATTING (CRITICAL):\n"
        "Use clean markdown throughout:\n"
        "- # Activity 1: [Title] for each activity heading\n"
        "- ## for section headers within each activity\n"
        "- **bold** for key labels and student roles\n"
        "- Numbered lists for procedure steps\n"
        "- Bullet points (- ) for materials, outcomes, questions\n"
        "- --- between activities"
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


# ─── INTERACTIVE QUIZ GENERATOR (v2) ──────────────────

class QuizRequest(BaseModel):
    topic: str
    grade_level: str
    subject: str = ""
    num_questions: int = 5
    difficulty: str = "medium"
    question_category: str = "ncert"          # ncert | miscellaneous | advanced
    question_type: str = "mcq"                # mcq | subjective | mix
    paper_mode: bool = False
    topic_description: str = ""
    topic_track: str = "core"                 # core | misc


def _get_subject_question_patterns(subject: str, qtype: str) -> str:
    """Return subject-specific question pattern guidance so the AI generates real exam-quality questions."""
    subj = subject.lower()

    if 'math' in subj:
        if qtype == 'subjective' or qtype == 'mix':
            return (
                "MATHEMATICS SUBJECTIVE QUESTION PATTERNS (MANDATORY — follow these patterns):\n"
                "You MUST generate questions from these categories. Mix them across the set:\n"
                "  1. PROVE / SHOW THAT: Theorem proofs, geometric proofs, algebraic identities\n"
                "     Example pattern: 'Prove that the tangent at any point of a circle is perpendicular to the radius through the point of contact.'\n"
                "  2. FIND / CALCULATE: Numerical problems with given values, requiring step-by-step calculation\n"
                "     Example pattern: 'In a circle with center O, a tangent PT touches the circle at T. If OT = 6 cm and OP = 10 cm, find the length of PT.'\n"
                "  3. CONSTRUCT / DRAW: Geometric constructions with specific measurements\n"
                "     Example pattern: 'Draw a circle of radius 4 cm. From a point 7 cm from its center, construct the pair of tangents to the circle.'\n"
                "  4. APPLICATION / WORD PROBLEM: Real scenario requiring mathematical modeling\n"
                "     Example pattern: 'Two concentric circles are of radii 5 cm and 9 cm. Find the length of the chord of the larger circle which touches the smaller circle.'\n"
                "  5. PROVE WITH CONDITIONS: Problems with given figure/conditions to prove a relationship\n"
                "     Example pattern: 'From an external point P, two tangents PA and PB are drawn to a circle with center O. Prove that PA = PB.'\n\n"
                "CRITICAL RULES FOR MATH:\n"
                "- NEVER generate 'Define X' or 'Explain X' or 'What is X' type questions for math\n"
                "- Every question MUST require mathematical working — calculation, proof, or construction\n"
                "- Include specific numerical values (cm, degrees, etc.) in find/calculate questions\n"
                "- For proofs, state exactly what needs to be proved\n"
                "- For constructions, give exact measurements\n"
                "- At least 40% questions should be PROVE type, 40% FIND/CALCULATE type\n"
            )
        else:  # MCQ
            return (
                "MATHEMATICS MCQ PATTERNS:\n"
                "- Questions must require actual calculation or reasoning, not just recall\n"
                "- Include numerical problems where students must compute the answer\n"
                "- Options should be close numerical values (e.g., 6 cm, 8 cm, 10 cm, 12 cm) to test precision\n"
                "- NEVER ask 'What is the definition of X' as MCQ — ask 'What is the value of X given Y'\n"
            )

    elif 'science' in subj or 'physics' in subj or 'chemistry' in subj or 'biology' in subj:
        if qtype == 'subjective' or qtype == 'mix':
            return (
                "SCIENCE SUBJECTIVE QUESTION PATTERNS (MANDATORY):\n"
                "  1. EXPLAIN MECHANISM: How does X process work? Describe with steps/stages\n"
                "  2. NUMERICAL: Given values, calculate using formulas (for Physics/Chemistry)\n"
                "  3. DIAGRAM-BASED: Draw and label a diagram of X. Explain the function of each part.\n"
                "  4. COMPARE & CONTRAST: Differentiate between X and Y with examples\n"
                "  5. REASON-BASED: Why does X happen? Give scientific reasoning with examples\n"
                "  6. EXPERIMENT: Describe an experiment to demonstrate X. Include materials, procedure, observation, conclusion.\n"
                "  7. APPLICATION: How is X used in daily life / industry? Give 3 examples with explanation.\n\n"
                "CRITICAL: Do NOT generate vague questions like 'Explain photosynthesis' — instead ask:\n"
                "'Describe the light-dependent reactions of photosynthesis. What role does chlorophyll play in capturing solar energy?'\n"
                "- Make questions SPECIFIC with clear scope\n"
                "- Include numerical data where applicable\n"
            )
        else:
            return (
                "SCIENCE MCQ PATTERNS:\n"
                "- Include diagram-based reasoning questions\n"
                "- Numerical problems with calculations\n"
                "- Conceptual questions that test understanding, not memorization\n"
            )

    elif 'english' in subj:
        if qtype == 'subjective' or qtype == 'mix':
            return (
                "ENGLISH SUBJECTIVE QUESTION PATTERNS:\n"
                "  1. PASSAGE-BASED: Provide a short passage and ask comprehension + inference questions\n"
                "  2. CHARACTER ANALYSIS: Analyze a character's motivations, actions, and development\n"
                "  3. CREATIVE WRITING: Write a letter/essay/story on a given topic with word limit\n"
                "  4. GRAMMAR APPLICATION: Rewrite sentences, transform voice/tense, correct errors in context\n"
                "  5. CRITICAL THINKING: Compare themes across texts, evaluate author's perspective\n"
                "- Do NOT ask 'Define noun' or 'What is a verb' — ask questions requiring APPLICATION\n"
            )
        else:
            return "ENGLISH MCQ: Test grammar application, reading comprehension, vocabulary in context.\n"

    elif 'social' in subj or 'history' in subj or 'geography' in subj or 'civics' in subj or 'economics' in subj:
        if qtype == 'subjective' or qtype == 'mix':
            return (
                "SOCIAL SCIENCE SUBJECTIVE PATTERNS:\n"
                "  1. ANALYZE: Why did event X happen? What were its causes and consequences?\n"
                "  2. COMPARE: Compare the policies/movements/features of X and Y\n"
                "  3. MAP-BASED: Locate and explain the significance of places/routes/regions\n"
                "  4. SOURCE-BASED: Read the source and answer — interpret historical documents\n"
                "  5. EVALUATE: Assess the impact of X on society/economy/politics with examples\n"
                "  6. CASE STUDY: Given a scenario, apply concepts to analyze the situation\n"
                "- NEVER ask 'Who was X' or 'When did X happen' — ask 'Analyze WHY X happened and its impact'\n"
            )
        else:
            return "SOCIAL SCIENCE MCQ: Test cause-effect, map skills, source interpretation — not just dates/names.\n"

    # Generic fallback for other subjects
    if qtype == 'subjective' or qtype == 'mix':
        return (
            "SUBJECTIVE QUESTION PATTERNS:\n"
            "  1. ANALYZE / EVALUATE: Questions requiring critical thinking and reasoning\n"
            "  2. APPLY: Use concepts to solve real-world problems with specific data\n"
            "  3. COMPARE: Detailed comparison with examples and reasoning\n"
            "  4. CREATE / DESIGN: Design a solution, experiment, or creative piece\n"
            "  5. JUSTIFY / PROVE: Support a statement with evidence and logical reasoning\n"
            "- NEVER generate 'Define X', 'What is X', 'List features of X' type questions\n"
            "- Every question must require THINKING, not just REMEMBERING\n"
        )
    return ""


def _build_category_prompt(category: str, grade: str, subject: str, topic: str, difficulty: str) -> str:
    """Return category-specific instructions for the AI."""
    if category == "ncert":
        return (
            f"IMPORTANT — NCERT / CBSE BOARD EXAM LEVEL QUESTIONS:\n"
            f"You are generating questions for {grade} {subject} on the topic '{topic}'.\n"
            f"These questions MUST match the style and rigor of actual CBSE board exam papers and NCERT exercise questions.\n\n"
            f"DIFFICULTY CALIBRATION for '{difficulty}':\n"
            f"  - easy: NCERT in-text questions and basic exercise questions. Still require working/reasoning — NOT definitions.\n"
            f"  - medium: NCERT exercise questions and CBSE board exam questions. Application-based, multi-step.\n"
            f"  - hard: HOTS questions from CBSE board papers, exemplar problems, and NCERT exemplar. Require proof, multi-concept integration, or complex calculation.\n\n"
            f"ABSOLUTELY FORBIDDEN:\n"
            f"  - 'Define X', 'What is X', 'Explain X in brief', 'List the properties of X'\n"
            f"  - Any question answerable in one line without mathematical/logical working\n"
            f"  - Generic textbook-style recall questions\n"
            f"  - Questions that just ask to 'compare' or 'differentiate' without specific context\n\n"
            f"EVERY question must require the student to THINK, CALCULATE, PROVE, CONSTRUCT, or ANALYZE.\n"
            f"Model your questions after actual CBSE board papers — look at past year question papers for reference."
        )
    elif category == "miscellaneous":
        return (
            f"MISCELLANEOUS / BROAD KNOWLEDGE QUESTIONS on '{topic}' ({subject}, {grade}):\n"
            f"Generate questions from real-world applications, cross-disciplinary connections, interesting problems, "
            f"and practical scenarios related to this topic.\n"
            f"Questions should go BEYOND the textbook but remain age-appropriate for {grade}.\n"
            f"For '{difficulty}' difficulty:\n"
            f"  - easy: Real-world application problems with given data.\n"
            f"  - medium: Cross-subject connections, practical engineering/daily life scenarios.\n"
            f"  - hard: Research-level thinking, open-ended analysis, multi-domain integration.\n\n"
            f"FORBIDDEN: 'Define X', 'What is X', generic recall questions.\n"
            f"Every question must present a SCENARIO or PROBLEM to solve."
        )
    else:  # advanced
        return (
            f"ADVANCED / COMPETITIVE EXAM LEVEL QUESTIONS on '{topic}' ({subject}, {grade}):\n"
            f"Generate questions at the level of competitive exams appropriate for {grade}:\n"
            f"  - Grade 1-5: Math/Science Olympiad (SOF), IMO, NSO style\n"
            f"  - Grade 6-8: NTSE Stage 1, Regional Olympiad style\n"
            f"  - Grade 9-10: NTSE Stage 2, Pre-RMO, KVPY-SA, Foundation IIT/NEET style\n"
            f"  - Grade 11-12: JEE Main/Advanced, NEET, KVPY, BITSAT style\n"
            f"  - College: GATE, NET, GRE Subject style\n\n"
            f"For '{difficulty}' difficulty:\n"
            f"  - easy: Standard competitive exam questions — one concept, clear approach.\n"
            f"  - medium: Multi-step problems combining 2-3 concepts.\n"
            f"  - hard: Olympiad-level tricky problems, unconventional approaches, proof-based.\n\n"
            f"FORBIDDEN: Textbook-level questions, definitions, simple recall.\n"
            f"Every question must be a genuine PROBLEM that requires deep thinking."
        )


def _build_type_schema(qtype: str, paper_mode: bool) -> str:
    """Return the JSON schema the AI must follow based on question type."""
    mcq_obj = (
        '    {{\n'
        '      "id": 1,\n'
        '      "type": "mcq",\n'
        '      "question": "<Question text>",\n'
        '      "options": ["A) <option>", "B) <option>", "C) <option>", "D) <option>"],\n'
        '      "correct": "A",\n'
        '      "explanation": "<1-2 sentence explanation>",\n'
        '      "marks": 1{section}\n'
        '    }}'
    )
    subj_obj = (
        '    {{\n'
        '      "id": 1,\n'
        '      "type": "subjective",\n'
        '      "question": "<Question text>",\n'
        '      "correct": "",\n'
        '      "options": [],\n'
        '      "explanation": "<Model answer / key points — 2-4 sentences>",\n'
        '      "marks": 2{section}\n'
        '    }}'
    )
    section_field = ',\n      "section": "Section A"' if paper_mode else ''
    mcq_obj = mcq_obj.replace('{section}', section_field)
    subj_obj = subj_obj.replace('{section}', section_field)

    if qtype == "mcq":
        example = mcq_obj
    elif qtype == "subjective":
        example = subj_obj
    else:  # mix
        example = mcq_obj + ',\n' + subj_obj

    paper_fields = ""
    if paper_mode:
        paper_fields = (
            '\n  "paper_mode": true,'
            '\n  "duration": "<suggested time, e.g. 1 Hour>",'
            '\n  "instructions": ["<instruction 1>", "<instruction 2>", "<instruction 3>"],'
        )

    return (
        f'{{\n'
        f'  "title": "<Quiz / Paper title>",{paper_fields}\n'
        f'  "questions": [\n{example}\n  ]\n'
        f'}}'
    )


def _build_type_rules(qtype: str, paper_mode: bool, num_q: int) -> str:
    """Return rules for the question type."""
    rules = []
    if qtype == "mcq" or qtype == "mix":
        rules += [
            '- For MCQ: "correct" must be A, B, C, or D',
            '- All 4 MCQ options must be plausible — close values that require actual calculation to distinguish',
            '- MCQ marks: 1 mark each',
            '- MCQ questions MUST require calculation or deep reasoning, NEVER just recall',
        ]
    if qtype == "subjective" or qtype == "mix":
        rules += [
            '- For Subjective: "explanation" must contain a COMPLETE model answer / solution steps (3-6 sentences minimum)',
            '- Marks distribution: 2-mark questions (30%), 3-mark questions (40%), 5-mark questions (30%)',
            '- 2-mark: Short proof, simple numerical, reason-based — requires 3-4 lines of working',
            '- 3-mark: Application problem, multi-step numerical, prove with diagram — requires 5-8 lines',
            '- 5-mark: Complex proof, construction + proof, long numerical, case-based — requires 10+ lines',
            '- ABSOLUTELY NO "Define X", "What is X", "Explain X", "List features" type questions',
            '- Every subjective question MUST require the student to show mathematical working, write a proof, draw a construction, or solve a multi-step problem',
            '- For model answers in "explanation": show the actual solution steps, not just a summary',
        ]
    if qtype == "mix":
        mcq_count = max(1, num_q // 3)
        subj_count = num_q - mcq_count
        rules.append(f'- Generate approximately {mcq_count} MCQ and {subj_count} Subjective questions')
        rules.append('- Put all MCQs first, then subjective questions')

    if paper_mode:
        rules += [
            '- Organize into sections: "Section A – Objective" (1 mark each), "Section B – Short Answer" (2-3 marks), "Section C – Long Answer" (5 marks)',
            '- Include a "section" field on every question',
            '- Provide 3-4 clear exam instructions',
            '- Set appropriate duration based on total marks',
        ]

    rules += [
        '- Every question MUST have "type" set to "mcq" or "subjective"',
        '- QUALITY CHECK: If a question can be answered by just writing a definition or one-line fact, DISCARD it and write a better question',
        '- Include specific numerical values, measurements, and conditions in problems',
        '- Vary the cognitive level: some application, some analysis, some evaluation, some creation',
    ]
    return '\n'.join(rules)


@app.post("/api/quiz")
async def generate_quiz(request: QuizRequest):
    if not request.topic.strip():
        raise HTTPException(status_code=400, detail="Topic cannot be empty")

    grade_profile = get_grade_language_profile(request.grade_level)
    category_prompt = _build_category_prompt(
        request.question_category, request.grade_level,
        request.subject, request.topic, request.difficulty
    )
    subject_patterns = _get_subject_question_patterns(request.subject, request.question_type)
    json_schema = _build_type_schema(request.question_type, request.paper_mode)
    type_rules = _build_type_rules(request.question_type, request.paper_mode, request.num_questions)

    topic_ctx = ""
    if request.topic_description:
        topic_ctx = f"\nCurriculum context: {request.topic_description}\n"

    system_msg = (
        "You are a senior CBSE board exam paper setter with 20+ years of experience. "
        "You have set actual CBSE Class 10 and Class 12 board papers. "
        "You write questions EXACTLY like they appear on real printed exam papers — complete sentences with variables, measurements, diagrams references, and clear instructions on what to prove/find/construct. "
        "You NEVER write lazy shorthand questions. You NEVER write 'Define X' or 'Explain Y' type questions for subjects like Mathematics. "
        "Every question you write requires genuine mathematical working, logical proof, or step-by-step analysis to solve. "
        "Your question text is always a complete, well-formed sentence — ready to print on a board exam paper without any editing. "
        "Always respond with valid JSON only. No markdown, no code fences, no extra text outside the JSON."
    )

    prompt = f"""You are setting a {request.difficulty}-level {request.question_type.upper()} assessment on "{request.topic}" for {request.grade_level} {request.subject}.
{"This is a FULL QUESTION PAPER — include sections, marks allocation, and exam instructions." if request.paper_mode else ""}

{category_prompt}

{subject_patterns}

{grade_profile}
{topic_ctx}

Generate exactly {request.num_questions} high-quality questions. Each question must be a genuine problem that requires mathematical working, logical proof, step-by-step analysis, or creative construction.

SELF-CHECK before outputting each question — EVERY question MUST pass ALL checks:
  1. Would this EXACT question wording appear on an actual CBSE board exam paper? If no, rewrite it.
  2. Does this question require at least 3+ lines of working/writing to answer? If no, make it harder.
  3. Is this just a "define/explain/list" question? If yes, REPLACE it with a prove/find/construct/analyze question.
  4. Is the question text a COMPLETE, well-formed sentence? If it reads like short keywords (e.g. "Prove tangent perpendicular"), REWRITE it as a full question (e.g. "Prove that the tangent at any point of a circle is perpendicular to the radius through the point of contact.").
  5. For NUMERICAL questions: does it specify exact values (e.g., "OT = 6 cm, OP = 10 cm")? If no, add specific values.
  6. For PROVE questions: does it state EXACTLY what to prove? (e.g., "Prove that PA = PB" not just "Prove equal tangents").
  7. For CONSTRUCTION questions: does it give exact measurements? (e.g., "Draw a circle of radius 4 cm. From a point 7 cm from its center, construct a pair of tangents.").

CRITICAL — QUESTION TEXT QUALITY:
- Each question MUST be written as a complete, grammatically correct sentence — the way it would appear PRINTED on an actual exam paper.
- NEVER write shorthand like "Find length tangent 10 cm" — write "A tangent PQ at a point Q of a circle of radius 5 cm meets a line through the center O at point P such that OP = 13 cm. Find the length of PQ."
- Include variable names (P, Q, O, A, B), measurements (cm, degrees), and relationships in the question text itself.
- Minimum question text length: 15 words for 2-mark, 25 words for 3-mark, 35 words for 5-mark questions.

Return ONLY valid JSON (no markdown, no code fences):
{json_schema}

Rules:
{type_rules}"""

    # More tokens for paper mode and more questions — subjective needs more
    max_tok = 2000
    if request.question_type in ("subjective", "mix"):
        max_tok = 3000
    if request.num_questions > 10:
        max_tok = max(max_tok, 3500)
    if request.num_questions > 20:
        max_tok = max(max_tok, 5000)
    if request.paper_mode:
        max_tok = max(max_tok, 4000)

    try:
        completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": prompt},
            ],
            model=OPENAI_MODEL, temperature=0.6, max_tokens=max_tok,
        )
        import re as _re
        text = completion.choices[0].message.content.strip()
        text = _re.sub(r'^```[a-z]*\s*', '', text)
        text = _re.sub(r'\s*```$', '', text).strip()
        data = json.loads(text)

        # Ensure every question has required fields
        for i, q in enumerate(data.get("questions", [])):
            q.setdefault("id", i + 1)
            q.setdefault("type", "mcq" if q.get("options") else "subjective")
            q.setdefault("marks", 1 if q.get("type") == "mcq" else 2)
            q.setdefault("correct", "")
            q.setdefault("explanation", "")
            q.setdefault("options", [])

        if request.paper_mode:
            data["paper_mode"] = True

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
