"""
ClassroomAI Database Module
- Manages chat history (last 7 chats)
- Manages daily usage limits (50 per tool)
"""

import sqlite3
import json
from datetime import datetime, timedelta
from pathlib import Path

DB_PATH = Path(__file__).parent / "classroomai.db"

class ChatDatabase:
    """Manage chat history and usage limits"""

    def __init__(self):
        self.db_path = DB_PATH
        self.init_db()

    def init_db(self):
        """Initialize database tables"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        # Chat history table
        c.execute('''
            CREATE TABLE IF NOT EXISTS chat_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                teacher_id TEXT NOT NULL,
                tool_name TEXT NOT NULL,
                topic TEXT,
                grade_level TEXT,
                subject TEXT,
                request_data TEXT,
                response_preview TEXT,
                response_content TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Usage tracking table
        c.execute('''
            CREATE TABLE IF NOT EXISTS usage_tracking (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                teacher_id TEXT NOT NULL,
                tool_name TEXT NOT NULL,
                usage_count INTEGER DEFAULT 0,
                reset_date DATE DEFAULT CURRENT_DATE,
                UNIQUE(teacher_id, tool_name, reset_date)
            )
        ''')

        # Students table - for adaptive learning
        c.execute('''
            CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT UNIQUE NOT NULL,
                teacher_id TEXT NOT NULL,
                name TEXT NOT NULL,
                grade_level TEXT NOT NULL,
                subject TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_activity TIMESTAMP
            )
        ''')

        # Question bank - for storing questions with difficulty ratings
        c.execute('''
            CREATE TABLE IF NOT EXISTS question_bank (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                question_text TEXT NOT NULL,
                subject TEXT NOT NULL,
                grade_level TEXT NOT NULL,
                topic TEXT NOT NULL,
                correct_answer TEXT NOT NULL,
                difficulty_score REAL DEFAULT 0.5,
                discrimination_index REAL DEFAULT 0.5,
                times_answered INTEGER DEFAULT 0,
                correct_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Assessments - tracking student answers and performance
        c.execute('''
            CREATE TABLE IF NOT EXISTS assessments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT NOT NULL,
                question_id INTEGER NOT NULL,
                teacher_id TEXT NOT NULL,
                answer TEXT NOT NULL,
                is_correct INTEGER NOT NULL,
                time_taken REAL,
                difficulty_rating REAL,
                attempt_number INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(question_id) REFERENCES question_bank(id)
            )
        ''')

        # Learning objectives - track student progress on learning goals
        c.execute('''
            CREATE TABLE IF NOT EXISTS learning_objectives (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT NOT NULL,
                topic TEXT NOT NULL,
                subject TEXT NOT NULL,
                grade_level TEXT NOT NULL,
                mastery_level REAL DEFAULT 0.0,
                attempts_made INTEGER DEFAULT 0,
                correct_answers INTEGER DEFAULT 0,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Recommendations - store adaptive learning recommendations
        c.execute('''
            CREATE TABLE IF NOT EXISTS recommendations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT NOT NULL,
                teacher_id TEXT NOT NULL,
                recommended_topic TEXT NOT NULL,
                reasoning TEXT,
                difficulty_level TEXT,
                priority_score REAL,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP
            )
        ''')

        conn.commit()
        conn.close()

    def save_chat(self, teacher_id: str, tool_name: str, topic: str,
                  grade_level: str, subject: str, request_data: dict,
                  response_preview: str, response_content: str = None) -> int:
        """Save chat to history"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        # Use response_content if provided, otherwise use response_preview
        full_content = response_content or response_preview

        c.execute('''
            INSERT INTO chat_history
            (teacher_id, tool_name, topic, grade_level, subject, request_data, response_preview, response_content)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (teacher_id, tool_name, topic, grade_level, subject,
              json.dumps(request_data), response_preview[:200], full_content))

        conn.commit()
        chat_id = c.lastrowid
        conn.close()

        return chat_id

    def get_last_7_chats(self, teacher_id: str) -> list:
        """Get last 7 chats for a teacher (legacy)"""
        return self.get_chat_history(teacher_id, limit=7)

    def get_chat_history(self, teacher_id: str, limit: int = 50, offset: int = 0, tool_filter: str = None) -> list:
        """Get full chat history for a teacher with pagination"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        if tool_filter:
            c.execute('''
                SELECT id, tool_name, topic, grade_level, subject, response_preview, response_content, created_at
                FROM chat_history
                WHERE teacher_id = ? AND tool_name = ?
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            ''', (teacher_id, tool_filter, limit, offset))
        else:
            c.execute('''
                SELECT id, tool_name, topic, grade_level, subject, response_preview, response_content, created_at
                FROM chat_history
                WHERE teacher_id = ?
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            ''', (teacher_id, limit, offset))

        rows = c.fetchall()
        conn.close()

        chats = []
        for row in rows:
            chats.append({
                'id': row[0],
                'tool_name': row[1],
                'topic': row[2],
                'grade_level': row[3],
                'subject': row[4],
                'preview': row[5],
                'content': row[6],
                'created_at': row[7]
            })

        return chats

    def increment_usage(self, teacher_id: str, tool_name: str) -> dict:
        """Increment usage count for today"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        today = datetime.now().date().isoformat()

        # Get or create usage record for today
        c.execute('''
            SELECT usage_count FROM usage_tracking
            WHERE teacher_id = ? AND tool_name = ? AND reset_date = ?
        ''', (teacher_id, tool_name, today))

        result = c.fetchone()

        if result:
            usage_count = result[0] + 1
            c.execute('''
                UPDATE usage_tracking
                SET usage_count = ?
                WHERE teacher_id = ? AND tool_name = ? AND reset_date = ?
            ''', (usage_count, teacher_id, tool_name, today))
        else:
            usage_count = 1
            c.execute('''
                INSERT INTO usage_tracking
                (teacher_id, tool_name, usage_count, reset_date)
                VALUES (?, ?, ?, ?)
            ''', (teacher_id, tool_name, usage_count, today))

        conn.commit()
        conn.close()

        return {
            'usage_count': usage_count,
            'limit': 50,
            'remaining': max(0, 50 - usage_count),
            'exceeded': usage_count > 50
        }

    def get_usage(self, teacher_id: str, tool_name: str) -> dict:
        """Get current usage for a tool today"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        today = datetime.now().date().isoformat()

        c.execute('''
            SELECT usage_count FROM usage_tracking
            WHERE teacher_id = ? AND tool_name = ? AND reset_date = ?
        ''', (teacher_id, tool_name, today))

        result = c.fetchone()
        conn.close()

        usage_count = result[0] if result else 0

        return {
            'usage_count': usage_count,
            'limit': 50,
            'remaining': max(0, 50 - usage_count),
            'exceeded': usage_count > 50
        }

    def reset_old_usage(self):
        """Reset usage counts older than today (called on startup)"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        today = datetime.now().date().isoformat()

        c.execute('''
            DELETE FROM usage_tracking
            WHERE reset_date < ?
        ''', (today,))

        conn.commit()
        conn.close()

    # ========== ADAPTIVE LEARNING METHODS ==========

    def add_student(self, student_id: str, teacher_id: str, name: str,
                    grade_level: str, subject: str) -> bool:
        """Add a new student for adaptive learning"""
        try:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()

            c.execute('''
                INSERT OR IGNORE INTO students
                (student_id, teacher_id, name, grade_level, subject)
                VALUES (?, ?, ?, ?, ?)
            ''', (student_id, teacher_id, name, grade_level, subject))

            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error adding student: {e}")
            return False

    def record_assessment(self, student_id: str, question_id: int, teacher_id: str,
                         answer: str, is_correct: bool, time_taken: float,
                         difficulty_rating: float) -> int:
        """Record a student's assessment response"""
        try:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()

            c.execute('''
                INSERT INTO assessments
                (student_id, question_id, teacher_id, answer, is_correct, time_taken, difficulty_rating)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (student_id, question_id, teacher_id, answer, int(is_correct), time_taken, difficulty_rating))

            conn.commit()
            assessment_id = c.lastrowid
            conn.close()

            # Update learning objective
            self._update_learning_objective(student_id, question_id, is_correct)

            return assessment_id
        except Exception as e:
            print(f"Error recording assessment: {e}")
            return -1

    def _update_learning_objective(self, student_id: str, question_id: int, is_correct: bool):
        """Update learning objective mastery level based on assessment"""
        try:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()

            # Get question details
            c.execute('SELECT subject, grade_level, topic FROM question_bank WHERE id = ?', (question_id,))
            row = c.fetchone()

            if not row:
                conn.close()
                return

            subject, grade_level, topic = row

            # Check if learning objective exists
            c.execute('''
                SELECT id, correct_answers, attempts_made FROM learning_objectives
                WHERE student_id = ? AND topic = ? AND subject = ?
            ''', (student_id, topic, subject))

            obj_row = c.fetchone()

            if obj_row:
                obj_id, correct_count, attempts = obj_row
                new_attempts = attempts + 1
                new_correct = correct_count + (1 if is_correct else 0)
                mastery = new_correct / new_attempts if new_attempts > 0 else 0

                c.execute('''
                    UPDATE learning_objectives
                    SET correct_answers = ?, attempts_made = ?, mastery_level = ?, last_updated = CURRENT_TIMESTAMP
                    WHERE id = ?
                ''', (new_correct, new_attempts, mastery, obj_id))
            else:
                # Create new learning objective
                correct_count = 1 if is_correct else 0
                mastery = correct_count

                c.execute('''
                    INSERT INTO learning_objectives
                    (student_id, topic, subject, grade_level, mastery_level, correct_answers, attempts_made)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (student_id, topic, subject, grade_level, mastery, correct_count, 1))

            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Error updating learning objective: {e}")

    def get_student_progress(self, student_id: str) -> dict:
        """Get overall progress for a student"""
        try:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()

            c.execute('''
                SELECT topic, mastery_level, correct_answers, attempts_made
                FROM learning_objectives
                WHERE student_id = ?
                ORDER BY mastery_level DESC
            ''', (student_id,))

            objectives = []
            for row in c.fetchall():
                objectives.append({
                    'topic': row[0],
                    'mastery_level': row[1],
                    'correct_answers': row[2],
                    'total_attempts': row[3]
                })

            # Calculate overall mastery
            if objectives:
                avg_mastery = sum(obj['mastery_level'] for obj in objectives) / len(objectives)
            else:
                avg_mastery = 0.0

            conn.close()

            return {
                'overall_mastery': avg_mastery,
                'objectives': objectives,
                'total_topics': len(objectives)
            }
        except Exception as e:
            print(f"Error getting student progress: {e}")
            return {'overall_mastery': 0.0, 'objectives': [], 'total_topics': 0}

    def add_recommendation(self, student_id: str, teacher_id: str, recommended_topic: str,
                         reasoning: str, difficulty_level: str, priority_score: float) -> int:
        """Add an adaptive learning recommendation"""
        try:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()

            c.execute('''
                INSERT INTO recommendations
                (student_id, teacher_id, recommended_topic, reasoning, difficulty_level, priority_score)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (student_id, teacher_id, recommended_topic, reasoning, difficulty_level, priority_score))

            conn.commit()
            rec_id = c.lastrowid
            conn.close()
            return rec_id
        except Exception as e:
            print(f"Error adding recommendation: {e}")
            return -1

    def get_recommendations(self, student_id: str, limit: int = 5) -> list:
        """Get pending recommendations for a student"""
        try:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()

            c.execute('''
                SELECT id, recommended_topic, reasoning, difficulty_level, priority_score, created_at
                FROM recommendations
                WHERE student_id = ? AND status = 'pending'
                ORDER BY priority_score DESC, created_at DESC
                LIMIT ?
            ''', (student_id, limit))

            recs = []
            for row in c.fetchall():
                recs.append({
                    'id': row[0],
                    'topic': row[1],
                    'reasoning': row[2],
                    'difficulty': row[3],
                    'priority': row[4],
                    'created_at': row[5]
                })

            conn.close()
            return recs
        except Exception as e:
            print(f"Error getting recommendations: {e}")
            return []

# Initialize database
db = ChatDatabase()
db.reset_old_usage()
