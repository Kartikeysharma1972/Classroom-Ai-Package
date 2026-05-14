import React, { useState, useRef, useEffect } from 'react'
import ChatHistory from '../components/ChatHistory'
import UsageCounter from '../components/UsageCounter'
import { useAuth } from '../context/AuthContext'

const API = window.location.hostname === 'localhost' ? 'http://localhost:8001' : window.location.origin
const STORAGE_KEY = 'classroom-quiz-state'

const grades    = ['Kindergarten','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12','College']
const subjects  = ['Mathematics','Science','English Language Arts','Social Studies','History','Geography','Physics','Chemistry','Biology','Computer Science','Art','Music','Other']
const OPTION_COLORS = { A: '#3b82f6', B: '#10b981', C: '#f59e0b', D: '#ef4444' }

function SelectDown({ value, onChange, options }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef(null)
  React.useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])
  const selected = options.find(o => (o.value ?? o) === value)
  const label = selected ? (selected.label ?? selected) : value
  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10,
          fontFamily: 'inherit', fontSize: '0.9rem', color: 'var(--text-1)', background: 'var(--bg)',
          cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', outline: 'none' }}>
        <span>{label}</span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <ul style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 9999,
          background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 10,
          maxHeight: 220, overflowY: 'auto', padding: '4px 0', margin: 0, listStyle: 'none',
          boxShadow: '0 8px 28px rgba(0,0,0,0.18)' }}>
          {options.map((opt) => {
            const v = opt.value ?? opt
            const l = opt.label ?? opt
            const active = v === value
            return (
              <li key={v} onMouseDown={() => { onChange(v); setOpen(false) }}
                style={{ padding: '9px 14px', cursor: 'pointer', fontSize: '0.9rem',
                  color: active ? 'var(--accent)' : 'var(--text-1)',
                  background: active ? 'var(--accent-soft)' : 'transparent',
                  fontWeight: active ? 600 : 400 }}>
                {l}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function VoiceBtn({ onResult }) {
  const [listening, setListening] = useState(false)
  const recRef = useRef(null)
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) return null
  const toggle = () => {
    if (listening) { recRef.current?.stop(); setListening(false); return }
    const rec = new SR(); recRef.current = rec
    rec.continuous = false; rec.interimResults = false
    rec.onstart = () => setListening(true)
    rec.onresult = e => { onResult(e.results[0][0].transcript); setListening(false) }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    rec.start()
  }
  return (
    <button type="button" onClick={toggle} title="Voice input"
      style={{ padding: '8px 10px', border: `1.5px solid ${listening ? '#ef4444' : 'var(--border)'}`,
        borderRadius: 8, background: listening ? '#fee2e2' : 'var(--surface)', cursor: 'pointer',
        color: listening ? '#ef4444' : 'var(--text-2)', fontSize: 14, transition: 'all .2s' }}>
      {listening ? '⏹' : '🎙'}
    </button>
  )
}

function quizToText(quiz, grade, subject, difficulty) {
  let text = `# ${quiz.title}\nGrade: ${grade} | Subject: ${subject} | Difficulty: ${difficulty}\n\n`
  quiz.questions.forEach((q, i) => {
    text += `${i + 1}. ${q.question}\n`
    q.options.forEach((opt, j) => {
      const letter = ['A','B','C','D'][j]
      text += `   ${letter}) ${opt.replace(/^[A-D]\)\s*/i, '')}\n`
    })
    text += `   **Answer: ${q.correct}**\n   Explanation: ${q.explanation}\n\n`
  })
  return text
}

function downloadQuizPDF(quiz, grade, subject, difficulty) {
  const script = document.createElement('script')
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
  script.onload = () => {
    const { jsPDF } = window.jspdf
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const margin = 15
    const maxW = pageW - margin * 2
    let y = margin

    const addLine = (needed) => {
      if (y + needed > pageH - margin) { doc.addPage(); y = margin }
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(11, 27, 45)
    const titleWrapped = doc.splitTextToSize(quiz.title, maxW)
    addLine(titleWrapped.length * 8)
    doc.text(titleWrapped, margin, y)
    y += titleWrapped.length * 8 + 2

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`${grade} · ${subject} · ${difficulty}`, margin, y)
    y += 12

    quiz.questions.forEach((q, i) => {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(57, 154, 255)
      doc.text(`Q${i + 1}.`, margin, y)
      doc.setFontSize(10.5)
      doc.setTextColor(11, 27, 45)
      const qWrapped = doc.splitTextToSize(q.question, maxW - 10)
      addLine(qWrapped.length * 6 + 4)
      doc.text(qWrapped, margin + 10, y)
      y += qWrapped.length * 6 + 4

      q.options.forEach((opt, j) => {
        const letter = ['A','B','C','D'][j]
        const isCorrect = letter === q.correct
        doc.setFont('helvetica', isCorrect ? 'bold' : 'normal')
        doc.setFontSize(10)
        doc.setTextColor(isCorrect ? 21 : 61, isCorrect ? 128 : 85, isCorrect ? 61 : 110)
        const optText = opt.replace(/^[A-D]\)\s*/i, '')
        doc.text(`${letter})`, margin + 8, y)
        const optWrapped = doc.splitTextToSize(optText, maxW - 20)
        addLine(optWrapped.length * 5.5 + 1)
        doc.text(optWrapped, margin + 16, y)
        y += optWrapped.length * 5.5 + 1
      })

      doc.setFont('helvetica', 'italic')
      doc.setFontSize(9)
      doc.setTextColor(120, 120, 120)
      const expWrapped = doc.splitTextToSize(`Explanation: ${q.explanation}`, maxW - 10)
      addLine(expWrapped.length * 5 + 10)
      doc.text(expWrapped, margin + 8, y + 2)
      y += expWrapped.length * 5 + 10
    })

    doc.save(`${quiz.title.replace(/\s+/g, '-')}-Quiz.pdf`)
  }
  if (!document.querySelector('script[src*="jspdf"]')) {
    document.head.appendChild(script)
  } else {
    script.onload()
  }
}

export default function QuizGenerator() {
  const { teacherId: TEACHER_ID } = useAuth()
  const [topic, setTopic]           = useState('')
  const [grade, setGrade]           = useState('Grade 8')
  const [subject, setSubject]       = useState('Science')
  const [numQ, setNumQ]             = useState(5)
  const [difficulty, setDifficulty] = useState('medium')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const usageCounterRef = useRef(null)

  const [quiz, setQuiz]         = useState(null)
  const [mode, setMode]         = useState('setup')
  const [current, setCurrent]   = useState(0)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [answers, setAnswers]   = useState([])

  // Restore persisted state on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
      if (!saved) return
      if (saved.topic)      setTopic(saved.topic)
      if (saved.grade)      setGrade(saved.grade)
      if (saved.subject)    setSubject(saved.subject)
      if (saved.numQ)       setNumQ(saved.numQ)
      if (saved.difficulty) setDifficulty(saved.difficulty)
      if (saved.quiz && saved.mode) {
        setQuiz(saved.quiz)
        setMode(saved.mode)
        setCurrent(saved.current || 0)
        setAnswers(saved.answers || [])
      }
    } catch {}
  }, [])

  // Persist state whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        topic, grade, subject, numQ, difficulty, quiz, mode, current, answers
      }))
    } catch {}
  }, [topic, grade, subject, numQ, difficulty, quiz, mode, current, answers])

  const generateQuiz = async () => {
    if (!topic.trim()) { setError('Please enter a topic'); return }
    setLoading(true); setError('')
    try {
      // Check usage limit
      try {
        const usageRes = await fetch(`${API}/api/increment-usage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teacher_id: TEACHER_ID, tool_name: 'quiz' })
        })
        const usageData = await usageRes.json()
        if (usageData.exceeded) {
          setError(usageData.error || 'Daily limit exceeded. Try again tomorrow.')
          setLoading(false)
          return
        }
      } catch {}

      const res = await fetch(`${API}/api/quiz`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, grade_level: grade, subject, num_questions: numQ, difficulty }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to generate quiz')

      setQuiz(data)
      setCurrent(0); setSelected(null); setAnswered(false); setAnswers([])
      setMode('playing')
      if (usageCounterRef.current) usageCounterRef.current.refresh()

      // Save to chat history
      try {
        fetch(`${API}/api/save-chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teacher_id: TEACHER_ID,
            tool_name: 'quiz',
            topic,
            grade_level: grade,
            subject,
            request_data: { topic, grade_level: grade, subject, num_questions: numQ, difficulty },
            response_preview: `Quiz: ${data.title} — ${data.questions?.length} questions`,
            response_content: quizToText(data, grade, subject, difficulty),
          })
        })
      } catch {}
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleSelect = (letter) => {
    if (answered) return
    setSelected(letter)
    setAnswered(true)
    const q = quiz.questions[current]
    setAnswers(prev => [...prev, { questionId: q.id, selected: letter, correct: q.correct }])
  }

  const handleNext = () => {
    if (current + 1 >= quiz.questions.length) {
      setMode('results')
    } else {
      setCurrent(c => c + 1)
      setSelected(null)
      setAnswered(false)
    }
  }

  const score = answers.filter(a => a.selected === a.correct).length

  const resetQuiz = () => {
    setCurrent(0); setSelected(null); setAnswered(false); setAnswers([])
    setMode('playing')
  }

  const handleDownloadPDF = () => {
    if (!quiz) return
    setPdfLoading(true)
    setTimeout(() => {
      downloadQuizPDF(quiz, grade, subject, difficulty)
      setPdfLoading(false)
    }, 200)
  }

  // ── SETUP SCREEN ──────────────────────────────────────
  if (mode === 'setup') return (
    <div style={{ maxWidth: 620, margin: '0 auto', padding: '32px 20px', position: 'relative' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <button onClick={() => setShowHistory(true)}
          style={{ background: '#399aff', border: 'none', borderRadius: 8, padding: '8px 14px',
            cursor: 'pointer', color: 'white', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          📋 History
        </button>
        <h1 style={{ flex: 1, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-1)', margin: 0,
          display: 'flex', alignItems: 'center', gap: 10 }}>
          🎯 Quiz Generator
          <UsageCounter ref={usageCounterRef} teacherId={TEACHER_ID} toolName="quiz" />
        </h1>
      </div>
      <p style={{ color: 'var(--text-2)', fontSize: '0.9rem', marginBottom: 28 }}>
        Generate an interactive quiz and test student knowledge instantly
      </p>

      <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Topic */}
        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>Topic *</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={topic} onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && generateQuiz()}
              placeholder="e.g. Photosynthesis, World War 2, Algebra..."
              style={{ flex: 1, padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10,
                fontFamily: 'inherit', fontSize: '0.9rem', color: 'var(--text-1)', background: 'var(--bg)',
                outline: 'none', transition: 'border-color .2s' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}/>
            <VoiceBtn onResult={setTopic} />
          </div>
        </div>

        {/* Grade + Subject */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>Grade Level</label>
            <SelectDown value={grade} onChange={setGrade} options={grades} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>Subject</label>
            <SelectDown value={subject} onChange={setSubject} options={subjects} />
          </div>
        </div>

        {/* Questions + Difficulty */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>Number of Questions</label>
            <SelectDown value={numQ} onChange={v => setNumQ(Number(v))}
              options={[3,5,8,10,15].map(n => ({ value: n, label: `${n} questions` }))} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>Difficulty</label>
            <SelectDown value={difficulty} onChange={setDifficulty}
              options={[{ value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' }, { value: 'hard', label: 'Hard' }]} />
          </div>
        </div>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: '0.85rem' }}>⚠️ {error}</div>}

        <button onClick={generateQuiz} disabled={loading}
          style={{ padding: '14px', background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
            color: 'white', border: 'none', borderRadius: 12, fontFamily: 'inherit',
            fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1, transition: 'all .2s', boxShadow: '0 4px 14px rgba(var(--accent-rgb),.3)' }}>
          {loading ? '⏳ Generating Quiz…' : '🎯 Generate Quiz'}
        </button>
      </div>

      <ChatHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        teacherId={TEACHER_ID}
        onSelectChat={() => setShowHistory(false)}
      />
    </div>
  )

  // ── PLAYING SCREEN ──────────────────────────────────
  if (mode === 'playing' && quiz) {
    const q = quiz.questions[current]
    const total = quiz.questions.length
    const progress = (current / total) * 100
    const isCorrect = answered && selected === q.correct
    const isWrong   = answered && selected !== q.correct

    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px', position: 'relative' }}>
        {/* Top bar: counter + PDF + history */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 10 }}>
              {quiz.title}
              <UsageCounter ref={usageCounterRef} teacherId={TEACHER_ID} toolName="quiz" />
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: 2 }}>{grade} · {subject} · {difficulty}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={handleDownloadPDF} disabled={pdfLoading}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid #fecaca',
                background: 'transparent', color: '#dc2626', fontSize: '0.8rem', fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              {pdfLoading ? '⏳' : '📄'} Download PDF
            </button>
            <button onClick={() => setShowHistory(true)}
              style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid var(--border)',
                background: 'var(--surface)', color: 'var(--text-2)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
              📋 History
            </button>
            <div style={{ background: 'var(--accent-soft)', border: '1.5px solid var(--accent)', borderRadius: 10,
              padding: '6px 14px', fontWeight: 700, color: 'var(--accent)', fontSize: '0.85rem' }}>
              {current + 1} / {total}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 6, background: 'var(--border)', borderRadius: 99, marginBottom: 28, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent-dark))',
            borderRadius: 99, transition: 'width .4s ease' }} />
        </div>

        {/* Question card */}
        <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 20, padding: 28, marginBottom: 20 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Question {current + 1}</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.5, marginBottom: 24 }}>{q.question}</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.options.map((opt, i) => {
              const letter = ['A','B','C','D'][i]
              const isSelected = selected === letter
              const isThisCorrect = answered && letter === q.correct
              const isThisWrong = answered && isSelected && letter !== q.correct

              let bg = 'var(--bg)', border = 'var(--border)', color = 'var(--text-1)'
              if (isThisCorrect)                          { bg = '#d1fae5'; border = '#10b981'; color = '#065f46' }
              else if (isThisWrong)                       { bg = '#fee2e2'; border = '#ef4444'; color = '#991b1b' }
              else if (isSelected && !answered)           { bg = 'var(--accent-soft)'; border = 'var(--accent)'; color = 'var(--accent)' }

              return (
                <button key={letter} onClick={() => handleSelect(letter)} disabled={answered}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                    background: bg, border: `1.5px solid ${border}`, borderRadius: 12,
                    cursor: answered ? 'default' : 'pointer', textAlign: 'left', fontFamily: 'inherit',
                    color, fontWeight: 600, fontSize: '0.9rem', transition: 'all .15s' }}>
                  <span style={{ width: 28, height: 28, borderRadius: 8, background: OPTION_COLORS[letter],
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>{letter}</span>
                  {opt.replace(/^[A-D]\)\s*/i, '')}
                  {isThisCorrect && <span style={{ marginLeft: 'auto', fontSize: '1.1rem' }}>✅</span>}
                  {isThisWrong  && <span style={{ marginLeft: 'auto', fontSize: '1.1rem' }}>❌</span>}
                </button>
              )
            })}
          </div>

          {answered && (
            <div style={{ marginTop: 18, padding: '14px 16px', borderRadius: 12,
              background: isCorrect ? '#d1fae5' : '#fef3c7', border: `1.5px solid ${isCorrect ? '#10b981' : '#f59e0b'}`,
              animation: 'fadeUp .3s ease' }}>
              <div style={{ fontWeight: 800, marginBottom: 4, color: isCorrect ? '#065f46' : '#92400e', fontSize: '0.85rem' }}>
                {isCorrect ? '🎉 Correct!' : `💡 Correct answer: ${q.correct}`}
              </div>
              <div style={{ fontSize: '0.85rem', color: isCorrect ? '#065f46' : '#78350f', lineHeight: 1.6 }}>{q.explanation}</div>
            </div>
          )}
        </div>

        {answered && (
          <button onClick={handleNext}
            style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
              color: 'white', border: 'none', borderRadius: 12, fontFamily: 'inherit',
              fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', animation: 'fadeUp .3s ease' }}>
            {current + 1 >= total ? '🏁 See Results' : 'Next Question →'}
          </button>
        )}

        <ChatHistory
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          teacherId={TEACHER_ID}
          onSelectChat={() => setShowHistory(false)}
        />
      </div>
    )
  }

  // ── RESULTS SCREEN ──────────────────────────────────
  if (mode === 'results') {
    const pct = Math.round((score / quiz.questions.length) * 100)
    const grade_emoji = pct >= 90 ? '🏆' : pct >= 70 ? '🎉' : pct >= 50 ? '👍' : '📚'
    const grade_label = pct >= 90 ? 'Excellent!' : pct >= 70 ? 'Good Job!' : pct >= 50 ? 'Keep Practicing' : 'Needs Review'

    return (
      <div style={{ maxWidth: 620, margin: '0 auto', padding: '32px 20px', position: 'relative' }}>

        {/* Action buttons row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <button onClick={handleDownloadPDF} disabled={pdfLoading}
            style={{ padding: '8px 18px', borderRadius: 10, border: '1.5px solid #fecaca',
              background: 'transparent', color: '#dc2626', fontSize: '0.85rem', fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {pdfLoading ? '⏳ Preparing…' : '📄 Download PDF'}
          </button>
          <button onClick={() => setShowHistory(true)}
            style={{ padding: '8px 18px', borderRadius: 10, border: '1.5px solid var(--border)',
              background: 'var(--surface)', color: 'var(--text-2)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
            📋 History
          </button>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-2)' }}>
            Uses: <UsageCounter ref={usageCounterRef} teacherId={TEACHER_ID} toolName="quiz" />
          </div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 20, padding: 32, textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>{grade_emoji}</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-1)', marginBottom: 6 }}>{grade_label}</div>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--accent)', marginBottom: 6 }}>{pct}%</div>
          <div style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>{score} out of {quiz.questions.length} correct</div>

          <div style={{ height: 12, background: 'var(--border)', borderRadius: 99, margin: '20px 0', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, transition: 'width .6s ease',
              background: pct >= 70 ? 'linear-gradient(90deg, #10b981, #059669)' : pct >= 50 ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 'linear-gradient(90deg, #ef4444, #dc2626)' }} />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
            <button onClick={resetQuiz}
              style={{ padding: '10px 24px', background: 'var(--accent)', color: 'white', border: 'none',
                borderRadius: 10, fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
              🔄 Retry Quiz
            </button>
            <button onClick={() => { setMode('setup'); setQuiz(null); setAnswers([]) }}
              style={{ padding: '10px 24px', background: 'var(--bg)', color: 'var(--text-1)', border: '1.5px solid var(--border)',
                borderRadius: 10, fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
              📝 New Quiz
            </button>
            <button onClick={handleDownloadPDF} disabled={pdfLoading}
              style={{ padding: '10px 24px', background: '#fee2e2', color: '#dc2626', border: '1.5px solid #fecaca',
                borderRadius: 10, fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
              {pdfLoading ? '⏳' : '📄'} Save as PDF
            </button>
          </div>
        </div>

        {/* Answer review */}
        <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1.5px solid var(--border)', fontWeight: 700, color: 'var(--text-1)', fontSize: '0.9rem' }}>
            📋 Answer Review
          </div>
          {quiz.questions.map((q, i) => {
            const a = answers[i]
            const correct = a?.selected === q.correct
            return (
              <div key={q.id} style={{ padding: '14px 20px', borderBottom: i < quiz.questions.length - 1 ? '1px solid var(--border)' : 'none',
                background: correct ? '#f0fdf4' : '#fef2f2' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{correct ? '✅' : '❌'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: '0.87rem', marginBottom: 4 }}>{q.question}</div>
                    {!correct && <div style={{ fontSize: '0.8rem', color: '#dc2626' }}>Your answer: {a?.selected} &nbsp;·&nbsp; Correct: {q.correct}</div>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <ChatHistory
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          teacherId={TEACHER_ID}
          onSelectChat={() => setShowHistory(false)}
        />
      </div>
    )
  }

  return null
}
