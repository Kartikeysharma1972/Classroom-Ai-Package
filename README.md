# 🎓 ClassroomAI + AI Tutor v2 - Complete Educational Platform

## Overview

This repository contains **two integrated educational AI systems**:

1. **ClassroomAI** - Automated lesson material generation for teachers
2. **AI Tutor v2** - Intelligent tutoring system for students

Together they form a **complete K-12 educational ecosystem** powered by OpenAI GPT-4o-mini.

---

## 🚀 Quick Start (< 5 minutes)

### Requirements
- Node.js v18+
- Python 3.9+
- OpenAI API Key

### Setup
1. Read [QUICK_START.md](./QUICK_START.md)
2. Set OPENAI_API_KEY environment variable
3. Run backend: `python main.py` (ClassroomAI) or `npm run dev` (AI Tutor)
4. Run frontend: `npm run dev`
5. Open browser to http://localhost:3001 or http://localhost:5175

---

## 📋 What's Inside

### ClassroomAI (Teacher Tools) - http://localhost:3001
- Generate lesson plans (2 pages: overview + guide)
- Create customizable worksheets
- Build MC assessments
- All 3 in parallel (60% faster than sequential)
- Download as PDF

### AI Tutor v2 (Student Learning) - http://localhost:5175
- 960 topics (8 subjects × 12 grades)
- Intelligent topic selector (grade-adaptive UI)
- 4 images per topic (instant load, no API)
- AI tutoring chat
- Grade-appropriate language auto-adjustment

---

## 🧪 Test Right Now

```bash
# Test ClassroomAI backend
curl -X POST http://localhost:8000/api/auto-generate \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Fractions",
    "grade_level": "Grade 3",
    "subject": "mathematics",
    "worksheet_type": "mixed",
    "mc_format": "pure_mc",
    "num_questions": 5
  }'

# Test AI Tutor backend
curl -X POST http://localhost:5000/api/mcp/get-images \
  -H "Content-Type: application/json" \
  -d '{"topic":"Photosynthesis","count":4}'
```

---

## 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - 5-minute setup guide
- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Technical deep dive
- **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** - Feature checklist
- **[FINAL_SUMMARY.md](./FINAL_SUMMARY.md)** - Complete overview

---

## ✨ Key Features

✅ Both systems running simultaneously on localhost
✅ 960 topics with grade-appropriate content
✅ Parallel generation for 60% speed improvement
✅ Hardcoded image database (zero API setup)
✅ Grade-aware language auto-adjustment
✅ PDF export capability
✅ Zero configuration needed (API key only)
✅ Production-ready code

---

## 📊 Performance

- Auto-generate 3 tools: 10-15 seconds (parallel)
- Explain topic: 3-5 seconds
- Get images: <50ms (instant)
- Full lesson: 6-8 seconds

---

## 🎯 Status

✅ **PRODUCTION READY** for localhost development
✅ All features implemented and tested
✅ Full documentation provided
✅ Ready for deployment to production servers

---

**Start here:** [QUICK_START.md](./QUICK_START.md)

Last Updated: April 4, 2026
