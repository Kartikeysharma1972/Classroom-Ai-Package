import os
import sys
from dotenv import load_dotenv
from openai import OpenAI
from mcp.server.fastmcp import FastMCP

load_dotenv()

mcp = FastMCP("ClassroomAI")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Import RAG modules (will be available after pip install completes)
try:
    from rag_agent import RAGAgent
    from code_analyzer import CodeAnalyzer
    RAG_AVAILABLE = True
except ImportError:
    RAG_AVAILABLE = False


def call_openai(system_prompt: str, user_prompt: str, max_tokens: int = 3500) -> str:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt},
        ],
        temperature=0.65,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content.strip()


# ─── TOOLS ────────────────────────────────────────────


@mcp.tool()
def generate_worksheet(
    topic: str,
    grade_level: str,
    subject: str = "",
    worksheet_type: str = "mixed",
    num_questions: int = 10,
    differentiation_level: str = "grade-level",
    blooms_level: str = "mixed",
    include_word_bank: bool = False,
    additional_instructions: str = "",
) -> str:
    """Generate a print-ready classroom worksheet with an answer key.

    Args:
        topic: The topic or subject matter for the worksheet (e.g. 'Photosynthesis', 'Fractions')
        grade_level: Grade level of the students (e.g. 'Grade 5', 'High School', 'Kindergarten')
        subject: Subject area such as Math, Science, ELA, History, Geography, Physics, Chemistry, Biology
        worksheet_type: Question style — 'fill_blank', 'multiple_choice', 'open_ended', 'mixed', or 'qa'
        num_questions: Number of questions to include (default 10)
        differentiation_level: Difficulty tier — 'grade-level', 'beginner', 'advanced', or 'mixed'
        blooms_level: Bloom's Taxonomy level — 'remember', 'understand', 'apply', 'analyze', 'evaluate', 'create', or 'mixed'
        include_word_bank: Add a word bank box for fill-in-the-blank questions
        additional_instructions: Any extra customization notes for the worksheet
    """
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

    q_type = type_map.get(worksheet_type, type_map["mixed"])
    diff   = diff_map.get(differentiation_level, diff_map["grade-level"])
    blooms = blooms_map.get(blooms_level, blooms_map["mixed"])

    word_bank_note = ""
    if include_word_bank and worksheet_type in ("fill_blank", "mixed"):
        word_bank_note = (
            "Include a WORD BANK box near the top of the worksheet listing all the missing words "
            "students must use, arranged in a bordered box with words separated by commas."
        )

    system_prompt = (
        "You are an expert classroom teacher and curriculum specialist with 20+ years of experience. "
        "Create professional, print-ready worksheets that are engaging, pedagogically sound, and appropriately rigorous. "
        "Ensure questions are clear, unambiguous, and aligned to the specified grade level and Bloom's level. "
        "Write in plain text ONLY — absolutely no markdown, no asterisks, no hashtags, no bold symbols. "
        "Use CAPITAL LETTERS for section headers and dashes for separators."
    )
    user_prompt = (
        f"Create a complete, professional classroom worksheet for {grade_level} students.\n\n"
        f"TOPIC: {topic}\n"
        f"{'SUBJECT: ' + subject if subject else ''}\n"
        f"QUESTION TYPE: {q_type}\n"
        f"NUMBER OF QUESTIONS: {num_questions}\n"
        f"DIFFERENTIATION LEVEL: {diff}\n"
        f"BLOOM'S TAXONOMY FOCUS: {blooms}\n"
        f"{word_bank_note}\n"
        f"{'ADDITIONAL INSTRUCTIONS: ' + additional_instructions if additional_instructions else ''}\n\n"
        "FORMAT REQUIREMENTS (plain text only, no markdown):\n"
        "- Worksheet title in ALL CAPS\n"
        "- Name / Date / Class lines\n"
        f"{'- Word Bank box with all fill-in words listed' if include_word_bank else ''}\n"
        "- Clear, brief instructions for students\n"
        "- All questions numbered (1. 2. 3. ...)\n"
        "- Adequate space for student responses\n"
        "- ANSWER KEY section at bottom with answers numbered to match\n"
        "- Include a one-sentence rationale for each answer in the key\n\n"
        "Write ONLY plain text. No **, ##, or any markdown whatsoever."
    )

    return call_openai(system_prompt, user_prompt)


@mcp.tool()
def generate_lesson_plan(
    topic: str,
    grade_level: str,
    subject: str,
    duration: str = "45 minutes",
    objectives: str = "",
    standards: str = "",
    class_type: str = "in-person",
    learning_style: str = "mixed",
    student_needs: str = "general",
    tech_integration: str = "low",
    include_topic_overview: bool = True,
    additional_notes: str = "",
) -> str:
    """Generate a comprehensive, standards-aligned lesson plan.

    Args:
        topic: The lesson topic (e.g. 'Introduction to Fractions', 'The American Revolution')
        grade_level: Grade level of the students (e.g. 'Grade 3', 'High School')
        subject: Subject area (e.g. 'Math', 'ELA', 'Science', 'History')
        duration: Class duration (e.g. '45 minutes', '60 minutes', '90 minutes')
        objectives: Specific learning objectives (optional, AI will create them if left blank)
        standards: Curriculum standards to align to (e.g. 'CCSS.MATH.5.NF.A.1')
        class_type: Delivery format — 'in-person', 'remote', or 'hybrid'
        learning_style: 'mixed', 'visual', 'auditory', or 'kinesthetic'
        student_needs: 'general', 'ell', 'special_needs', or 'gifted'
        tech_integration: Technology level — 'low', 'digital', or 'interactive'
        include_topic_overview: Prepend a subject-matter overview page for teacher reference
        additional_notes: Any extra notes or special requirements
    """
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

    topic_overview = ""
    if include_topic_overview:
        topic_system = (
            "You are a subject matter expert and experienced educator. "
            "Provide comprehensive, authoritative, and student-friendly educational content about topics. "
            "Make content accessible for the specified grade level while maintaining academic rigor. "
            "Write in plain text ONLY — no markdown, no asterisks, no hashtags."
        )
        topic_prompt = (
            f"Create a comprehensive topic overview for teacher reference:\n\n"
            f"TOPIC: {topic}\n"
            f"SUBJECT: {subject}\n"
            f"GRADE LEVEL: {grade_level}\n\n"
            "Include ALL sections with concise but detailed information:\n\n"
            "1. OVERVIEW - What this topic is about and why it matters\n\n"
            "2. KEY CONCEPTS - 5-7 core ideas with simple definitions\n\n"
            "3. ESSENTIAL VOCABULARY - 8-10 key terms defined in student-friendly language\n\n"
            "4. MAIN PRINCIPLES - 3-4 key ideas or rules about this topic\n\n"
            "5. REAL-WORLD EXAMPLES - 3 concrete examples showing how this applies\n\n"
            "6. INTERESTING FACTS - 3 fascinating or surprising facts\n\n"
            "7. COMMON MISCONCEPTIONS - 2-3 things students often misunderstand with correct explanations\n\n"
            f"Make all content age-appropriate for {grade_level}. "
            "Write in plain text. No **, ##, or markdown."
        )
        topic_overview = call_openai(topic_system, topic_prompt, max_tokens=2500)
        topic_overview = (
            "=== PAGE 1: TOPIC OVERVIEW ===\n\n"
            + topic_overview
            + "\n\n" + "=" * 50 + "\n\n=== PAGE 2: LESSON PLAN ===\n\n"
        )

    system_prompt = (
        "You are a master curriculum designer and instructional coach expert in UbD (Understanding by Design), "
        "differentiated instruction, and modern pedagogical best practices. "
        "Create detailed, actionable, classroom-ready lesson plans any teacher can pick up and use immediately. "
        "Include specific timing estimates, concrete student activities, and teacher facilitation notes. "
        "Write in plain text ONLY — no markdown, no asterisks, no hashtags. "
        "Use numbered sections with UPPERCASE HEADERS."
    )
    user_prompt = (
        f"Create a comprehensive, fully detailed lesson plan:\n\n"
        f"TOPIC: {topic}\n"
        f"SUBJECT: {subject}\n"
        f"GRADE LEVEL: {grade_level}\n"
        f"DURATION: {duration}\n"
        f"CLASS FORMAT: {class_map.get(class_type, class_map['in-person'])}\n"
        f"LEARNING STYLE FOCUS: {style_map.get(learning_style, style_map['mixed'])}\n"
        f"STUDENT NEEDS: {needs_map.get(student_needs, needs_map['general'])}\n"
        f"TECHNOLOGY: {tech_map.get(tech_integration, tech_map['low'])}\n"
        f"{'LEARNING OBJECTIVES: ' + objectives if objectives else ''}\n"
        f"{'STANDARDS: ' + standards if standards else ''}\n"
        f"{'ADDITIONAL NOTES: ' + additional_notes if additional_notes else ''}\n\n"
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
        f"   - Specific accommodations for: {needs_map.get(student_needs, 'all learners')}\n\n"
        "9. HOMEWORK / EXTENSION (if applicable)\n\n"
        "10. TEACHER REFLECTION NOTES\n"
        "    - Potential challenges and how to address them\n"
        "    - What to look for during the lesson\n"
        "    - Ideas for the follow-up lesson\n\n"
        "Write everything in plain text. No **, ##, or markdown formatting of any kind."
    )

    lesson_result = call_openai(system_prompt, user_prompt, max_tokens=4000)
    return topic_overview + lesson_result


@mcp.tool()
def generate_mc_assessment(
    topic: str,
    grade_level: str,
    subject: str = "",
    num_questions: int = 10,
    difficulty: str = "medium",
    blooms_level: str = "mixed",
    question_format: str = "pure_mc",
    include_explanations: bool = True,
    standards: str = "",
    additional_instructions: str = "",
) -> str:
    """Generate a multiple-choice assessment or quiz with an answer key.

    Args:
        topic: Assessment topic (e.g. 'World War II', 'Cell Biology', 'Algebra Equations')
        grade_level: Grade level of the students (e.g. 'Grade 8', 'High School')
        subject: Subject area (e.g. 'History', 'Biology', 'Math')
        num_questions: Total number of questions (default 10)
        difficulty: 'easy', 'medium', 'hard', or 'mixed'
        blooms_level: Bloom's Taxonomy level — 'remember', 'understand', 'apply', 'analyze', 'evaluate', 'create', or 'mixed'
        question_format: 'pure_mc' (all multiple choice), 'mc_truefalse' (MC + True/False), or 'mc_short' (MC + short answer)
        include_explanations: Include answer explanations in the key
        standards: Curriculum standards to align to (optional)
        additional_instructions: Any extra customization notes
    """
    blooms_map = {
        "remember":   "recall and recognition (define, identify, name, list) — Bloom's Level 1",
        "understand": "comprehension (explain, describe, summarize, classify) — Bloom's Level 2",
        "apply":      "application (use, solve, demonstrate, calculate) — Bloom's Level 3",
        "analyze":    "analysis (compare, contrast, examine, differentiate) — Bloom's Level 4",
        "evaluate":   "evaluation (assess, critique, justify, recommend) — Bloom's Level 5",
        "create":     "synthesis/creation (design, formulate, propose, construct) — Bloom's Level 6",
        "mixed":      "a deliberate mix across all Bloom's Taxonomy levels (recall through synthesis)",
    }
    mc_count = max(1, int(num_questions * 0.7))
    other_count = num_questions - mc_count
    format_map = {
        "pure_mc":      f"all {num_questions} questions as standard multiple choice (4 options: A, B, C, D)",
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
        if include_explanations else
        "In the ANSWER KEY, list only the question number and correct answer letter."
    )

    system_prompt = (
        "You are an expert assessment designer with deep knowledge of curriculum standards, "
        "Bloom's Taxonomy, and best practices in test construction. "
        "Create high-quality, fair, and valid assessments. "
        "All distractors (wrong answers) must be plausible but clearly incorrect to students who mastered the material. "
        "Avoid trick questions, double negatives, and 'all of the above' options. "
        "Write in plain text ONLY — no markdown, no asterisks, no hashtags."
    )
    user_prompt = (
        f"Create a {num_questions}-question assessment on: '{topic}'\n\n"
        f"GRADE LEVEL: {grade_level}\n"
        f"{'SUBJECT: ' + subject if subject else ''}\n"
        f"DIFFICULTY: {diff_desc.get(difficulty, diff_desc['medium'])}\n"
        f"BLOOM'S TAXONOMY FOCUS: {blooms_map.get(blooms_level, blooms_map['mixed'])}\n"
        f"QUESTION FORMAT: {format_map.get(question_format, format_map['pure_mc'])}\n"
        f"{'STANDARDS: ' + standards if standards else ''}\n"
        f"{'ADDITIONAL INSTRUCTIONS: ' + additional_instructions if additional_instructions else ''}\n\n"
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

    return call_openai(system_prompt, user_prompt, max_tokens=3500)


@mcp.tool()
def auto_generate_all(
    topic: str,
    grade_level: str,
    subject: str,
    worksheet_type: str = "mixed",
    mc_format: str = "pure_mc",
    num_questions: int = 10,
) -> str:
    """Generate a worksheet, lesson plan, AND MC assessment all at once for a topic.
    Language complexity is automatically adjusted for the grade level.

    Args:
        topic: The lesson topic (e.g. 'Fractions', 'Photosynthesis', 'World War II')
        grade_level: Grade level (e.g. 'Grade 3', 'Grade 10', 'High School')
        subject: Subject area (e.g. 'Math', 'Science', 'History')
        worksheet_type: 'mixed', 'fill_blank', 'multiple_choice', 'open_ended', or 'qa'
        mc_format: 'pure_mc', 'mc_truefalse', or 'mc_short'
        num_questions: Number of questions in worksheet and assessment (default 10)
    """
    from concurrent.futures import ThreadPoolExecutor

    g = grade_level.lower()
    if any(x in g for x in ["kindergarten", "grade 1", "grade 2", "1st", "2nd", "k-"]):
        lang = "Use extremely simple language: 3-6 word sentences, basic sight words only, concrete concepts, no abstract ideas."
    elif any(x in g for x in ["grade 3", "grade 4", "grade 5", "3rd", "4th", "5th"]):
        lang = "Use simple elementary language: 8-12 word sentences, common everyday vocabulary, concrete real-world examples."
    elif any(x in g for x in ["grade 6", "grade 7", "grade 8", "6th", "7th", "8th", "middle"]):
        lang = "Use middle school language: moderate complexity, introduce subject terms with definitions, some abstract thinking."
    else:
        lang = "Use high school academic language: advanced vocabulary, complex sentences, abstract reasoning and analysis."

    type_map = {
        "fill_blank": "fill-in-the-blank questions (use ________ for blanks)",
        "multiple_choice": "multiple choice questions with 4 options (A, B, C, D)",
        "open_ended": "open-ended short answer questions",
        "mixed": "a mix of fill-in-the-blank, multiple choice, and open-ended questions",
        "qa": "Q: [question] / A: [answer] pairs",
    }
    mc_count = max(1, int(num_questions * 0.7))
    other_count = num_questions - mc_count
    format_map = {
        "pure_mc": f"all {num_questions} multiple choice (A, B, C, D)",
        "mc_truefalse": f"{mc_count} multiple choice then {other_count} True/False",
        "mc_short": f"{mc_count} multiple choice then {other_count} short answer",
    }

    ws_sys = f"Expert teacher for {grade_level}. {lang} Plain text only, no markdown."
    ws_usr = (
        f"Worksheet for {grade_level} — TOPIC: {topic} | SUBJECT: {subject}\n"
        f"TYPE: {type_map.get(worksheet_type, type_map['mixed'])} | QUESTIONS: {num_questions}\n"
        "Include: ALL CAPS title, Name/Date/Class lines, instructions, numbered questions, ANSWER KEY with rationales.\n"
        "Plain text only."
    )

    lp_sys = f"Master curriculum designer for {grade_level}. {lang} Plain text only, numbered UPPERCASE sections."
    lp_usr = (
        f"45-minute lesson plan — TOPIC: {topic} | SUBJECT: {subject} | GRADE: {grade_level}\n"
        "Sections: 1.LESSON OVERVIEW (SWBAT objectives) 2.MATERIALS 3.WARM-UP/HOOK "
        "4.DIRECT INSTRUCTION 5.GUIDED PRACTICE 6.INDEPENDENT PRACTICE 7.CLOSURE & ASSESSMENT 8.DIFFERENTIATION\n"
        "Plain text only."
    )

    mc_sys = f"Expert assessment designer for {grade_level}. {lang} Plain text only, no markdown."
    mc_usr = (
        f"Assessment — TOPIC: {topic} | SUBJECT: {subject} | GRADE: {grade_level}\n"
        f"FORMAT: {format_map.get(mc_format, format_map['pure_mc'])} | QUESTIONS: {num_questions}\n"
        "Include: ALL CAPS title, Name/Date/Score, instructions, numbered questions, ANSWER KEY with explanations.\n"
        "Plain text only."
    )

    with ThreadPoolExecutor(max_workers=3) as pool:
        f_ws = pool.submit(call_openai, ws_sys, ws_usr, 2500)
        f_lp = pool.submit(call_openai, lp_sys, lp_usr, 3500)
        f_mc = pool.submit(call_openai, mc_sys, mc_usr, 2500)
        worksheet     = f_ws.result()
        lesson_plan   = f_lp.result()
        mc_assessment = f_mc.result()

    divider = "\n\n" + "=" * 60 + "\n\n"
    return (
        f"AUTO-GENERATED MATERIALS FOR: {topic.upper()} | {subject} | {grade_level}\n"
        f"Language automatically adjusted for {grade_level}\n"
        + "=" * 60
        + divider
        + "LESSON PLAN\n" + "-" * 40 + "\n" + lesson_plan
        + divider
        + "WORKSHEET\n" + "-" * 40 + "\n" + worksheet
        + divider
        + "MC ASSESSMENT\n" + "-" * 40 + "\n" + mc_assessment
    )


# ─── RAG-BASED ADVANCED TOOLS ─────────────────────────


@mcp.tool()
def explain_advanced_code(code: str, language: str, grade: str) -> str:
    """Explain advanced code concepts with RAG-retrieved knowledge base.

    Uses semantic search to find relevant programming concepts, design patterns,
    and best practices from the knowledge base, then generates a detailed explanation
    tailored to the student's grade level.

    Args:
        code: Source code to explain (any programming language)
        language: Programming language (python, javascript, java, cpp, etc.)
        grade: Grade level for explanation complexity (e.g. '9', '10', '11', '12')

    Returns:
        Detailed code explanation with referenced concepts and real-world examples
    """
    if not RAG_AVAILABLE:
        return "RAG system not available. Install chromadb, anthropic, sentence-transformers first."

    try:
        agent = RAGAgent()
        return agent.explain_code(code, language, grade)
    except Exception as e:
        return f"Error explaining code: {str(e)}"


@mcp.tool()
def debug_with_patterns(code: str, language: str, error: str) -> str:
    """Debug code using pattern matching from the knowledge base.

    Searches for similar debugging patterns, common errors, and solutions,
    then provides a step-by-step debugging guide specific to the error.

    Args:
        code: Source code with the bug
        language: Programming language
        error: Error message or description of the issue

    Returns:
        Step-by-step debugging guide with similar solved issues and solutions
    """
    if not RAG_AVAILABLE:
        return "RAG system not available. Install required dependencies first."

    try:
        agent = RAGAgent()
        return agent.debug_code(code, language, error)
    except Exception as e:
        return f"Error debugging code: {str(e)}"


@mcp.tool()
def suggest_code_improvements(code: str, language: str, focus: str = "best_practices") -> str:
    """Suggest code improvements based on best practices and patterns.

    Analyzes code and retrieves relevant best practices, design patterns,
    or performance tips, then provides specific, actionable improvements.

    Args:
        code: Source code to review
        language: Programming language
        focus: Improvement focus area (best_practices, performance, readability, design_patterns)

    Returns:
        Code improvement suggestions with before/after examples
    """
    if not RAG_AVAILABLE:
        return "RAG system not available. Install required dependencies first."

    try:
        agent = RAGAgent()
        return agent.suggest_improvements(code, language, focus)
    except Exception as e:
        return f"Error suggesting improvements: {str(e)}"


@mcp.tool()
def analyze_code_structure(code: str, language: str = "python") -> str:
    """Analyze code structure, complexity, and potential issues.

    Provides structural analysis including functions, classes, cyclomatic complexity,
    best practice violations, and refactoring suggestions.

    Args:
        code: Source code to analyze
        language: Programming language (python or javascript)

    Returns:
        JSON-formatted analysis with structure, complexity, and issues
    """
    if not RAG_AVAILABLE:
        return "RAG system not available. Install required dependencies first."

    try:
        analyzer = CodeAnalyzer()
        if language == "python":
            analysis = analyzer.analyze_python(code)
        elif language == "javascript":
            analysis = analyzer.analyze_javascript(code)
        else:
            return f"Language {language} not yet supported"

        import json
        return json.dumps(analysis, indent=2)
    except Exception as e:
        return f"Error analyzing code: {str(e)}"


@mcp.tool()
def teach_design_pattern(pattern: str, language: str, grade: str) -> str:
    """Teach a design pattern with code examples and use cases.

    Retrieves design pattern information from knowledge base and generates
    a comprehensive explanation with code examples in the requested language.

    Args:
        pattern: Design pattern name (factory, singleton, observer, adapter, etc.)
        language: Programming language for code examples (python, javascript, java, etc.)
        grade: Grade level (9-12 for high school, college for advanced)

    Returns:
        Pattern explanation with code examples, use cases, and practice exercises
    """
    if not RAG_AVAILABLE:
        return "RAG system not available. Install required dependencies first."

    try:
        agent = RAGAgent()
        return agent.teach_pattern(pattern, language, grade)
    except Exception as e:
        return f"Error teaching pattern: {str(e)}"


# ─── ENTRY POINT ──────────────────────────────────────

def main():
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
