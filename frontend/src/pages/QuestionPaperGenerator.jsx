import React, { useState, useRef, useEffect, useMemo } from 'react'
import ChatHistory from '../components/ChatHistory'
import UsageCounter from '../components/UsageCounter'
import { useAuth } from '../context/AuthContext'
import { GRADES, getCoreSubjects, getMiscSubjects, getCoreTopics, getMiscTopics, findTopicDescription } from '../data/cbseSubjects'

const API = window.location.hostname === 'localhost' ? 'http://localhost:8001' : window.location.origin
const STORAGE_KEY = 'classroom-qpaper-state'

/* ─── Reusable SelectDown ──────────────────────────── */
function SelectDown({ value, onChange, options, placeholder }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef(null)
  React.useEffect(() => {
    if (!open) return
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  const selected = options.find(o => (o.value ?? o) === value)
  const label = selected ? (selected.label ?? selected) : (placeholder || value)
  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10,
          fontFamily: 'inherit', fontSize: '0.9rem', color: selected ? 'var(--text-1)' : 'var(--text-3)', background: 'var(--bg)',
          cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', outline: 'none' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <ul style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 9999,
          background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 10,
          maxHeight: 220, overflowY: 'auto', padding: '4px 0', margin: 0, listStyle: 'none',
          boxShadow: '0 8px 28px rgba(0,0,0,0.18)' }}>
          {options.map((opt) => {
            const v = opt.value ?? opt; const l = opt.label ?? opt; const active = v === value
            return (
              <li key={v} onMouseDown={() => { onChange(v); setOpen(false) }}
                style={{ padding: '9px 14px', cursor: 'pointer', fontSize: '0.9rem',
                  color: active ? 'var(--accent)' : 'var(--text-1)',
                  background: active ? 'var(--accent-soft)' : 'transparent', fontWeight: active ? 600 : 400 }}>{l}</li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/* ─── Track Tabs ───────────────────────────────────── */
function TrackTabs({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
      {[{ key: 'core', label: 'CBSE / NCERT', icon: '📘' }, { key: 'misc', label: 'Miscellaneous', icon: '🌍' }].map(t => (
        <button key={t.key} type="button" onClick={() => onChange(t.key)}
          style={{ flex: 1, padding: '10px 0', border: `1.5px solid ${value === t.key ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 10, background: value === t.key ? 'var(--accent-soft)' : 'var(--bg)',
            color: value === t.key ? 'var(--accent)' : 'var(--text-2)', fontWeight: value === t.key ? 700 : 500,
            fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  )
}

/* ─── Pill Selector ────────────────────────────────── */
function PillSelector({ options, value, onChange, columns = 3 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 8 }}>
      {options.map(opt => {
        const active = value === opt.value
        return (
          <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
            style={{ padding: '10px 8px', border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 10, background: active ? 'var(--accent-soft)' : 'var(--bg)',
              color: active ? 'var(--accent)' : 'var(--text-2)', fontWeight: active ? 700 : 500,
              fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textAlign: 'center' }}>
            <span style={{ fontSize: '1.1rem' }}>{opt.icon}</span>
            <span>{opt.label}</span>
            {opt.desc && <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 400 }}>{opt.desc}</span>}
          </button>
        )
      })}
    </div>
  )
}

const Label = ({ children }) => (
  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>{children}</label>
)

/* ─── PDF Generation ───────────────────────────────── */
function downloadPaperPDF(data, grade, subject, difficulty, logoDataUrl) {
  const loadScript = (src) => new Promise((resolve) => {
    if (document.querySelector(`script[src*="${src.split('/').pop()}"]`)) { resolve(); return }
    const s = document.createElement('script'); s.src = src; s.onload = resolve; document.head.appendChild(s)
  })
  loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js').then(() => {
    const { jsPDF } = window.jspdf
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pw = doc.internal.pageSize.getWidth(), ph = doc.internal.pageSize.getHeight()
    const m = 18, maxW = pw - m * 2
    let y = m

    const checkPage = (need) => { if (y + need > ph - m) { addWatermark(); doc.addPage(); y = m } }
    const addWatermark = () => {
      if (!logoDataUrl) return
      try {
        const s = 40; doc.saveGraphicsState()
        doc.setGState(new doc.GState({ opacity: 0.06 }))
        doc.addImage(logoDataUrl, 'PNG', (pw - s) / 2, (ph - s) / 2, s, s)
        doc.restoreGraphicsState()
      } catch {}
    }

    // Header with logo
    if (logoDataUrl) {
      try { doc.addImage(logoDataUrl, 'PNG', (pw - 18) / 2, y, 18, 18) } catch {}
      y += 22
    }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(11, 27, 45)
    const title = doc.splitTextToSize(data.title || 'Question Paper', maxW)
    doc.text(title, pw / 2, y, { align: 'center' }); y += title.length * 7 + 2

    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(80, 80, 80)
    doc.text(`Grade: ${grade}  |  Subject: ${subject}  |  Difficulty: ${difficulty}`, pw / 2, y, { align: 'center' }); y += 6
    const totalMarks = (data.questions || []).reduce((s, q) => s + (q.marks || 1), 0)
    doc.text(`Total Marks: ${totalMarks}  |  Time: ${data.duration || 'As instructed'}`, pw / 2, y, { align: 'center' }); y += 4
    doc.setDrawColor(180); doc.setLineWidth(0.5); doc.line(m, y, pw - m, y); y += 5

    // Instructions
    const instructions = data.instructions || ['Read all questions carefully.', 'Write neat and legible answers.', 'Marks are indicated on the right.']
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(40, 40, 40)
    doc.text('General Instructions:', m, y); y += 5
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
    instructions.forEach(inst => { const l = doc.splitTextToSize(`• ${inst}`, maxW); checkPage(l.length * 4.5); doc.text(l, m + 2, y); y += l.length * 4.5 })
    y += 5

    // Questions
    let curSection = ''
    ;(data.questions || []).forEach((q, i) => {
      if (q.section && q.section !== curSection) {
        curSection = q.section; checkPage(12)
        doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(57, 154, 255)
        doc.text(q.section, m, y); y += 7
      }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(11, 27, 45)
      const qW = doc.splitTextToSize(q.question, maxW - 22); checkPage(qW.length * 5.5 + 6)
      doc.text(`Q${i + 1}.`, m, y)
      if (q.marks) { doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(120, 120, 120); doc.text(`[${q.marks}]`, pw - m, y, { align: 'right' }) }
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(30, 30, 30)
      doc.text(qW, m + 10, y); y += qW.length * 5.5 + 2

      if (q.type === 'mcq' && q.options) {
        q.options.forEach((opt, j) => {
          const letter = ['A','B','C','D'][j]
          doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(61, 85, 110)
          const oW = doc.splitTextToSize(`(${letter}) ${opt.replace(/^[A-D]\)\s*/i, '')}`, maxW - 18)
          checkPage(oW.length * 5 + 1); doc.text(oW, m + 14, y); y += oW.length * 5 + 1
        }); y += 2
      }
      if (q.type === 'subjective') {
        const lines = (q.marks || 1) <= 2 ? 3 : (q.marks || 1) <= 4 ? 5 : 8
        doc.setDrawColor(200); doc.setLineWidth(0.3)
        for (let l = 0; l < lines; l++) { checkPage(7); doc.line(m + 10, y + 2, pw - m, y + 2); y += 7 }
        y += 2
      }
      y += 3
    })

    // Answer key page
    addWatermark(); doc.addPage(); y = m
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(11, 27, 45)
    doc.text('ANSWER KEY', pw / 2, y, { align: 'center' }); y += 10
    ;(data.questions || []).forEach((q, i) => {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(30, 30, 30); checkPage(12)
      doc.text(`Q${i + 1}. ${q.type === 'mcq' ? q.correct : '(Subjective)'}`, m, y); y += 4
      if (q.explanation) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(80, 80, 80)
        const eL = doc.splitTextToSize(q.explanation, maxW - 10); checkPage(eL.length * 4.5)
        doc.text(eL, m + 6, y); y += eL.length * 4.5 + 4
      }
    })
    addWatermark()
    doc.save(`${(data.title || 'Question-Paper').replace(/\s+/g, '-')}.pdf`)
  })
}


/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function QuestionPaperGenerator() {
  const { teacherId: TEACHER_ID } = useAuth()

  const [grade, setGrade]               = useState('Grade 10')
  const [subject, setSubject]           = useState('')
  const [topic, setTopic]               = useState('')
  const [subjectTrack, setSubjectTrack] = useState('core')
  const [difficulty, setDifficulty]     = useState('medium')
  const [numQ, setNumQ]                 = useState(10)
  const [questionCategory, setQuestionCategory] = useState('ncert')
  const [questionType, setQuestionType] = useState('mix')
  const [schoolLogo, setSchoolLogo]     = useState(null)
  const [schoolLogoName, setSchoolLogoName] = useState('')

  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const usageCounterRef         = useRef(null)
  const [paper, setPaper]       = useState(null)
  const [mode, setMode]         = useState('setup') // setup | paper

  // Derived
  const coreSubjects = useMemo(() => getCoreSubjects(grade), [grade])
  const miscSubjects = useMemo(() => getMiscSubjects(grade), [grade])
  const subjectList = subjectTrack === 'core' ? coreSubjects : miscSubjects
  const coreTopics = useMemo(() => getCoreTopics(grade, subject), [grade, subject])
  const miscTopics = useMemo(() => getMiscTopics(grade, subject), [grade, subject])
  const topicList = subjectTrack === 'core' ? coreTopics : miscTopics

  useEffect(() => { setSubject(''); setTopic('') }, [grade, subjectTrack])
  useEffect(() => { setTopic('') }, [subject])

  // Persist
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(STORAGE_KEY))
      if (!s) return
      if (s.grade) setGrade(s.grade)
      if (s.subjectTrack) setSubjectTrack(s.subjectTrack)
      if (s.difficulty) setDifficulty(s.difficulty)
      if (s.numQ) setNumQ(s.numQ)
      if (s.questionCategory) setQuestionCategory(s.questionCategory)
      if (s.questionType) setQuestionType(s.questionType)
      if (s.paper && s.mode === 'paper') { setPaper(s.paper); setMode('paper') }
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ grade, subject, topic, subjectTrack, difficulty, numQ, questionCategory, questionType, paper, mode })) } catch {}
  }, [grade, subject, topic, subjectTrack, difficulty, numQ, questionCategory, questionType, paper, mode])

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setSchoolLogoName(file.name)
    const reader = new FileReader(); reader.onload = (ev) => setSchoolLogo(ev.target.result); reader.readAsDataURL(file)
  }

  const generate = async () => {
    if (!subject.trim()) { setError('Please select a subject'); return }
    if (!topic.trim()) { setError('Please select or enter a topic'); return }
    setLoading(true); setError('')
    try {
      try {
        const u = await fetch(`${API}/api/increment-usage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ teacher_id: TEACHER_ID, tool_name: 'question-paper' }) })
        const ud = await u.json(); if (ud.exceeded) { setError(ud.error || 'Daily limit exceeded.'); setLoading(false); return }
      } catch {}

      const topicDesc = findTopicDescription(grade, subject, topic) || ''
      const res = await fetch(`${API}/api/quiz`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, grade_level: grade, subject, num_questions: numQ, difficulty, question_category: questionCategory, question_type: questionType, paper_mode: true, topic_description: topicDesc, topic_track: subjectTrack }),
      })
      if (!res.ok) {
        let errMsg = 'Failed to generate question paper'
        try { const errData = await res.json(); errMsg = errData.detail || errMsg } catch {}
        throw new Error(errMsg)
      }
      const text = await res.text()
      let data
      try { data = JSON.parse(text) } catch { throw new Error('AI returned an invalid response. Please try again.') }
      setPaper(data); setMode('paper')
      if (usageCounterRef.current) usageCounterRef.current.refresh()

      try { fetch(`${API}/api/save-chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_id: TEACHER_ID, tool_name: 'question-paper', topic, grade_level: grade, subject,
          request_data: { topic, grade, subject, numQ, difficulty, questionCategory, questionType },
          response_preview: `Paper: ${data.title} — ${data.questions?.length} questions`,
          response_content: JSON.stringify(data) }) }) } catch {}
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleDownloadPDF = () => {
    if (!paper) return; setPdfLoading(true)
    setTimeout(() => { downloadPaperPDF(paper, grade, subject, difficulty, schoolLogo); setPdfLoading(false) }, 300)
  }


  /* ═══ SETUP SCREEN ═══ */
  if (mode === 'setup') return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <button onClick={() => setShowHistory(true)}
          style={{ background: '#399aff', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: 'white', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          📋 History
        </button>
        <h1 style={{ flex: 1, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-1)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          📄 Question Paper Generator
          <UsageCounter ref={usageCounterRef} teacherId={TEACHER_ID} toolName="question-paper" />
        </h1>
      </div>
      <p style={{ color: 'var(--text-2)', fontSize: '0.9rem', marginBottom: 28 }}>
        Generate NCERT-aligned question papers with proper sections, marks, and answer keys
      </p>

      <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div><Label>Source Track</Label><TrackTabs value={subjectTrack} onChange={setSubjectTrack} /></div>

        <div><Label>Grade Level *</Label><SelectDown value={grade} onChange={setGrade} options={GRADES} /></div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div><Label>Subject *</Label><SelectDown value={subject} onChange={setSubject} options={subjectList.length ? subjectList : ['Select grade first']} placeholder="Select subject" /></div>
          <div><Label>Topic *</Label>
            {topicList.length > 0
              ? <SelectDown value={topic} onChange={setTopic} options={topicList.map(t => typeof t === 'string' ? t : { value: t.label || t.topic, label: t.label || t.topic })} placeholder="Select topic" />
              : <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Enter topic..."
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontFamily: 'inherit', fontSize: '0.9rem', color: 'var(--text-1)', background: 'var(--bg)', outline: 'none', boxSizing: 'border-box' }} />
            }
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div><Label>Difficulty</Label><SelectDown value={difficulty} onChange={setDifficulty} options={[{ value: 'easy', label: '🟢 Easy' }, { value: 'medium', label: '🟡 Medium' }, { value: 'hard', label: '🔴 Hard' }]} /></div>
          <div><Label>Number of Questions</Label><SelectDown value={numQ} onChange={v => setNumQ(Number(v))} options={[5,8,10,15,20,25,30].map(n => ({ value: n, label: `${n} questions` }))} /></div>
        </div>

        <div><Label>Question Category</Label>
          <PillSelector value={questionCategory} onChange={setQuestionCategory} options={[
            { value: 'ncert', icon: '📗', label: 'NCERT Based', desc: 'Textbook-aligned' },
            { value: 'miscellaneous', icon: '🌐', label: 'Miscellaneous', desc: 'Broad knowledge' },
            { value: 'advanced', icon: '🚀', label: 'Advanced', desc: 'Competitive level' },
          ]} />
        </div>

        <div><Label>Question Type</Label>
          <PillSelector value={questionType} onChange={setQuestionType} options={[
            { value: 'mcq', icon: '🔘', label: 'MCQ', desc: 'Multiple choice' },
            { value: 'subjective', icon: '✍️', label: 'Subjective', desc: 'Descriptive' },
            { value: 'mix', icon: '🔀', label: 'Mix', desc: 'MCQ + Subjective' },
          ]} />
        </div>

        {/* Logo Upload */}
        <div style={{ padding: '14px 16px', background: 'var(--bg)', border: '1.5px dashed var(--border)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-1)', marginBottom: 4 }}>🏫 School Logo / Watermark</div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-3)' }}>
              {schoolLogoName ? `✅ ${schoolLogoName}` : 'Upload your school logo (PNG/JPG) — appears as watermark on all pages'}
            </div>
          </div>
          <label style={{ padding: '8px 16px', background: 'var(--accent-soft)', color: 'var(--accent)', border: '1.5px solid var(--accent)', borderRadius: 8, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {schoolLogo ? 'Change' : 'Upload'}
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoUpload} style={{ display: 'none' }} />
          </label>
          {schoolLogo && <img src={schoolLogo} alt="logo" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 6, border: '1px solid var(--border)' }} />}
        </div>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: '0.85rem' }}>⚠️ {error}</div>}

        <button onClick={generate} disabled={loading}
          style={{ padding: '14px', background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', color: 'white', border: 'none', borderRadius: 12, fontFamily: 'inherit', fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 14px rgba(var(--accent-rgb),.3)' }}>
          {loading ? '⏳ Generating Question Paper…' : '📄 Generate Question Paper'}
        </button>
      </div>

      <ChatHistory isOpen={showHistory} onClose={() => setShowHistory(false)} teacherId={TEACHER_ID} onSelectChat={() => setShowHistory(false)} />
    </div>
  )


  /* ═══ PAPER VIEW ═══ */
  if (mode === 'paper' && paper) {
    const totalMarks = (paper.questions || []).reduce((s, q) => s + (q.marks || 1), 0)
    const mcqCount = (paper.questions || []).filter(q => q.type === 'mcq').length
    const subjCount = (paper.questions || []).filter(q => q.type === 'subjective').length

    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-1)' }}>{paper.title}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: 2 }}>
              {grade} · {subject} · {difficulty} · {totalMarks} marks
              {mcqCount > 0 && ` · ${mcqCount} MCQ`}{subjCount > 0 && ` · ${subjCount} Subjective`}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleDownloadPDF} disabled={pdfLoading}
              style={{ padding: '8px 18px', borderRadius: 10, border: '1.5px solid #fecaca', background: 'transparent', color: '#dc2626', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              {pdfLoading ? '⏳ Preparing…' : '📄 Download PDF'}
            </button>
            <button onClick={() => { setMode('setup'); setPaper(null) }}
              style={{ padding: '8px 18px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
              📝 New Paper
            </button>
          </div>
        </div>

        {/* Questions */}
        <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          {(paper.questions || []).map((q, i) => (
            <div key={q.id || i} style={{ padding: '18px 22px', borderBottom: i < paper.questions.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 10, flex: 1 }}>
                  <span style={{ background: q.type === 'mcq' ? '#dbeafe' : '#fef3c7', color: q.type === 'mcq' ? '#1d4ed8' : '#92400e',
                    padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap', height: 'fit-content' }}>
                    {q.type === 'mcq' ? 'MCQ' : 'Subjective'}
                  </span>
                  <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: '0.92rem', lineHeight: 1.5 }}>Q{i + 1}. {q.question}</div>
                </div>
                {q.marks && <span style={{ background: 'var(--accent-soft)', color: 'var(--accent)', padding: '2px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap', marginLeft: 12 }}>{q.marks} Mark{q.marks > 1 ? 's' : ''}</span>}
              </div>

              {q.type === 'mcq' && q.options && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8, marginLeft: 36 }}>
                  {q.options.map((opt, j) => {
                    const letter = ['A','B','C','D'][j]; const isCorrect = letter === q.correct
                    return (
                      <div key={letter} style={{ padding: '6px 10px', borderRadius: 8, fontSize: '0.85rem',
                        background: isCorrect ? '#d1fae5' : 'var(--bg)', border: `1px solid ${isCorrect ? '#10b981' : 'var(--border)'}`,
                        color: isCorrect ? '#065f46' : 'var(--text-1)', fontWeight: isCorrect ? 600 : 400, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 700 }}>{letter})</span> {opt.replace(/^[A-D]\)\s*/i, '')}
                        {isCorrect && <span style={{ marginLeft: 'auto' }}>✅</span>}
                      </div>
                    )
                  })}
                </div>
              )}

              {q.explanation && (
                <div style={{ marginTop: 10, marginLeft: 36, padding: '8px 12px', background: '#f0f9ff', borderRadius: 8, fontSize: '0.8rem', color: '#1e40af', lineHeight: 1.5, borderLeft: '3px solid #3b82f6' }}>
                  💡 {q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>

        <ChatHistory isOpen={showHistory} onClose={() => setShowHistory(false)} teacherId={TEACHER_ID} onSelectChat={() => setShowHistory(false)} />
      </div>
    )
  }

  return null
}
