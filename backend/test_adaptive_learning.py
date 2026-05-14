"""
Integration test for Adaptive Learning System
Tests all components: database, ML models, API endpoints
"""

import sys
import json
from database import db
from ml_models import (
    irt_model, bkt_model, difficulty_adaptor, path_recommender
)
from adaptive_integration import adaptive_integration

def test_database_operations():
    """Test database schema and operations"""
    print("\n" + "="*50)
    print("TEST 1: Database Operations")
    print("="*50)

    try:
        # Add a test student
        success = db.add_student(
            student_id="test_student_001",
            teacher_id="teacher_001",
            name="Test Student",
            grade_level="Grade 6",
            subject="Mathematics"
        )
        print(f"[OK] Add student: {success}")

        # Record an assessment
        assessment_id = db.record_assessment(
            student_id="test_student_001",
            question_id=1,
            teacher_id="teacher_001",
            answer="42",
            is_correct=True,
            time_taken=15.5,
            difficulty_rating=0.5
        )
        print(f"[OK] Record assessment: {assessment_id}")

        # Get student progress
        progress = db.get_student_progress("test_student_001")
        print(f"[OK] Get student progress:")
        print(f"  - Overall mastery: {progress['overall_mastery']:.2%}")
        print(f"  - Topics: {len(progress['objectives'])}")

        # Add recommendation
        rec_id = db.add_recommendation(
            student_id="test_student_001",
            teacher_id="teacher_001",
            recommended_topic="Algebra Basics",
            reasoning="Ready to advance from basic arithmetic",
            difficulty_level="medium",
            priority_score=0.8
        )
        print(f"[OK] Add recommendation: {rec_id}")

        # Get recommendations
        recs = db.get_recommendations("test_student_001")
        print(f"[OK] Get recommendations: {len(recs)} found")

        return True
    except Exception as e:
        print(f"[FAIL] Database test failed: {e}")
        return False

def test_ml_models():
    """Test ML models"""
    print("\n" + "="*50)
    print("TEST 2: Machine Learning Models")
    print("="*50)

    try:
        # Test IRT
        ability = irt_model.estimate_ability(8, 10)  # 80% correct
        print(f"[OK] IRT ability estimation: {ability:.2f}")

        next_difficulty = irt_model.update_difficulty(1, True, 0.8, 0.5)
        print(f"[OK] IRT difficulty update: {next_difficulty:.2f}")

        probability = irt_model.probability_correct(0.8, 0.5)
        print(f"[OK] IRT success probability: {probability:.2%}")

        # Test BKT
        new_mastery = bkt_model.update_mastery(0.5, True, 1.0)
        print(f"[OK] BKT mastery update (correct): {new_mastery:.2f}")

        predicted_mastery = bkt_model.predict_mastery(8, 10, 1.0)
        print(f"[OK] BKT mastery prediction: {predicted_mastery:.2f}")

        knowledge_state = bkt_model.estimate_knowledge_state(0.75)
        print(f"[OK] BKT knowledge state: {knowledge_state['state']}")

        # Test Difficulty Adaptor
        next_diff = difficulty_adaptor.get_next_difficulty(0.8, 0.5, [1, 1, 1, 0, 1])
        print(f"[OK] Difficulty adaptor: {next_diff:.2f}")

        sequence = difficulty_adaptor.suggest_difficulty_sequence(0.6, "Algebra", 3)
        print(f"[OK] Difficulty sequence: {[f'{d:.2f}' for d in sequence]}")

        return True
    except Exception as e:
        print(f"[FAIL] ML models test failed: {e}")
        return False

def test_learning_path_recommender():
    """Test learning path recommendations"""
    print("\n" + "="*50)
    print("TEST 3: Learning Path Recommender")
    print("="*50)

    try:
        # This will return recommendations for our test student
        recommendations = path_recommender.get_recommendations(
            student_id="test_student_001",
            num_recommendations=3
        )

        print(f"[OK] Get recommendations: {len(recommendations)} topics")
        for rec in recommendations[:3]:
            print(f"  - {rec['topic']} ({rec['reason']}) - Priority: {rec['priority']:.2f}")

        return True
    except Exception as e:
        print(f"[FAIL] Learning path test failed: {e}")
        return False

def test_adaptive_integration():
    """Test integration layer"""
    print("\n" + "="*50)
    print("TEST 4: Adaptive Integration Layer")
    print("="*50)

    try:
        # Register student interaction
        reg = adaptive_integration.register_student_interaction(
            student_id="test_student_002",
            teacher_id="teacher_001",
            tool_name="worksheet",
            topic="Fractions",
            grade_level="Grade 5",
            subject="Mathematics"
        )
        print(f"[OK] Register student: {reg['student_registered']}")

        # Adapt difficulty
        difficulty = adaptive_integration.adapt_generation_difficulty(
            student_id="test_student_002",
            topic="Fractions",
            grade_level="Grade 5"
        )
        print(f"[OK] Adapt difficulty: {difficulty:.2f}")

        # Record generation
        gen = adaptive_integration.record_generation(
            student_id="test_student_002",
            teacher_id="teacher_001",
            tool_name="worksheet",
            topic="Fractions",
            content="3/4 + 1/4 = ?",
            grade_level="Grade 5",
            subject="Mathematics"
        )
        print(f"[OK] Record generation: {gen['chat_id']}")

        # Suggest next topic
        next_topic = adaptive_integration.suggest_next_topic("test_student_002")
        print(f"[OK] Suggest next topic: {next_topic['next_topic'] or 'Foundational'}")

        # Create adaptive sequence
        sequence = adaptive_integration.create_adaptive_question_sequence(
            student_id="test_student_002",
            topic="Fractions",
            num_questions=3
        )
        print(f"[OK] Create question sequence: {len(sequence)} questions")

        return True
    except Exception as e:
        print(f"[FAIL] Integration test failed: {e}")
        return False

def test_api_endpoints():
    """Test API endpoints (requires server running)"""
    print("\n" + "="*50)
    print("TEST 5: API Endpoints (Optional - requires server)")
    print("="*50)

    try:
        import requests

        base_url = "http://localhost:5000"
        headers = {"Content-Type": "application/json"}

        # Test student-progress endpoint
        response = requests.post(
            f"{base_url}/api/adaptive/student-progress",
            json={"student_id": "test_student_001"},
            headers=headers,
            timeout=5
        )

        if response.status_code == 200:
            data = response.json()
            print(f"[OK] GET /api/adaptive/student-progress: {data['success']}")
            return True
        else:
            print(f"[FAIL] API test failed: {response.status_code}")
            return False

    except requests.exceptions.ConnectionError:
        print("[SKIP] API test skipped (server not running)")
        return None
    except Exception as e:
        print(f"[FAIL] API test failed: {e}")
        return False

def run_all_tests():
    """Run all tests"""
    print("\n" + "="*70)
    print("ADAPTIVE LEARNING SYSTEM - COMPREHENSIVE TEST SUITE")
    print("="*70)

    results = {
        "Database Operations": test_database_operations(),
        "ML Models": test_ml_models(),
        "Learning Path Recommender": test_learning_path_recommender(),
        "Adaptive Integration": test_adaptive_integration(),
        "API Endpoints": test_api_endpoints(),
    }

    # Print summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)

    for test_name, result in results.items():
        if result is None:
            status = "[SKIP] SKIPPED"
        elif result:
            status = "[OK] PASSED"
        else:
            status = "[FAIL] FAILED"
        print(f"{test_name:.<50} {status}")

    passed = sum(1 for r in results.values() if r is True)
    total = len([r for r in results.values() if r is not None])

    print(f"\nTotal: {passed}/{total} tests passed")
    print("="*70)

    return passed == total

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
