#!/usr/bin/env python3
"""
Test script for ClassroomAI usage counter endpoints
Run this after starting the backend server
"""

import requests
import json
import sys

BASE_URL = "http://localhost:8001"
TEACHER_ID = "teacher-demo-123"
TOOL_NAME = "worksheet"

def test_check_usage():
    """Test check-usage endpoint"""
    url = f"{BASE_URL}/api/check-usage"
    payload = {"teacher_id": TEACHER_ID, "tool_name": TOOL_NAME}

    print(f"\n✓ Testing {url}")
    print(f"  Payload: {payload}")

    try:
        response = requests.post(url, json=payload, timeout=5)
        print(f"  Status: {response.status_code}")
        data = response.json()
        print(f"  Response: {json.dumps(data, indent=2)}")
        return data
    except Exception as e:
        print(f"  ERROR: {e}")
        return None

def test_increment_usage():
    """Test increment-usage endpoint"""
    url = f"{BASE_URL}/api/increment-usage"
    payload = {"teacher_id": TEACHER_ID, "tool_name": TOOL_NAME}

    print(f"\n✓ Testing {url}")
    print(f"  Payload: {payload}")

    try:
        response = requests.post(url, json=payload, timeout=5)
        print(f"  Status: {response.status_code}")
        data = response.json()
        print(f"  Response: {json.dumps(data, indent=2)}")
        return data
    except Exception as e:
        print(f"  ERROR: {e}")
        return None

def main():
    print("=" * 60)
    print("ClassroomAI Usage Counter Test")
    print("=" * 60)

    # Test 1: Check initial usage
    print("\n[TEST 1] Check current usage (should be 0 or previous count)")
    initial = test_check_usage()

    if not initial:
        print("\n❌ Failed to connect to backend!")
        print("Make sure the server is running: python main.py")
        sys.exit(1)

    # Test 2: Increment usage
    print("\n[TEST 2] Increment usage by 1")
    incremented = test_increment_usage()

    if not incremented:
        print("\n❌ Failed to increment usage!")
        sys.exit(1)

    # Test 3: Check usage again
    print("\n[TEST 3] Check usage again (should be incremented)")
    final = test_check_usage()

    # Verify the values
    print("\n" + "=" * 60)
    print("TEST RESULTS")
    print("=" * 60)

    if initial and incremented and final:
        initial_count = initial.get('usage_count', 0)
        incremented_count = incremented.get('usage_count', 0)
        final_count = final.get('usage_count', 0)

        print(f"\nInitial count:     {initial_count}/50")
        print(f"After increment:   {incremented_count}/50")
        print(f"Check again:       {final_count}/50")

        # Verify incrementing works
        if incremented_count == initial_count + 1:
            print("\n✅ INCREMENT WORKING: Counter increased correctly")
        else:
            print(f"\n❌ INCREMENT ISSUE: Expected {initial_count + 1}, got {incremented_count}")

        # Verify check-usage returns same value
        if final_count == incremented_count:
            print("✅ CHECK-USAGE WORKING: Returns correct value")
        else:
            print(f"❌ CHECK-USAGE ISSUE: Expected {incremented_count}, got {final_count}")

        print("\n" + "=" * 60)
        print("All tests completed!")
        print("=" * 60)
    else:
        print("\n❌ Some tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
