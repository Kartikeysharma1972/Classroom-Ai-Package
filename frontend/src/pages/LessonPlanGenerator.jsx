import React, { useState, useRef, useEffect } from 'react'
import OutputBox from '../components/OutputBox'
import CustomSelect from '../components/CustomSelect'
import ChatHistory from '../components/ChatHistory'
import UsageCounter from '../components/UsageCounter'
import ErrorToast from '../components/ErrorToast'
import { useAuth } from '../context/AuthContext'

const API = window.location.hostname === 'localhost' ? 'http://localhost:8001' : window.location.origin
const STORAGE_KEY = 'classroom-result-lesson'

const grades    = ['Kindergarten','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12','College']

const subjects  = ['Mathematics','Science','English Language Arts','Social Studies','History','Geography','Physics','Chemistry','Biology','Computer Science','Art','Music','Physical Education','Foreign Language','Other']
const durations = ['20 minutes','30 minutes','45 minutes','50 minutes','60 minutes','75 minutes','90 minutes','2 hours','Block Schedule (90 min)']

const TOPIC_SUGGESTIONS = {
  'Mathematics': {
    'Kindergarten': ['Counting 1–10','Basic Shapes','More & Less'],
    'Grade 1': ['Addition & Subtraction','Number Patterns','Measurement'],
    'Grade 2': ['Place Value','2-Digit Addition','Basic Fractions'],
    'Grade 3': ['Multiplication Tables','Division Basics','Fractions'],
    'Grade 4': ['Long Multiplication','Decimals','Area & Perimeter'],
    'Grade 5': ['Fractions & Decimals','Order of Operations','Geometry Basics'],
    'Grade 6': ['Ratios & Proportions','Integers','Algebraic Expressions'],
    'Grade 7': ['Linear Equations','Percentages','Statistics'],
    'Grade 8': ['Algebra','Pythagorean Theorem','Functions'],
    'Grade 9': ['Quadratic Equations','Polynomials','Graphing Lines'],
    'Grade 10': ['Trigonometry','Probability','Sequences & Series','Matrices Intro','Logarithms','Coordinate Geometry','Statistics','Permutations & Combinations','Financial Mathematics','Circle Theorems'],
    'Grade 11': ['Calculus Intro','Logarithms','Matrices'],
    'Grade 12': ['Calculus','Advanced Statistics','Complex Numbers'],
    'College':  ['Linear Algebra','Multivariable Calculus','Differential Equations'],
  },
  'Science': {
    'Kindergarten': ['Living & Non-living Things','Weather','Plants Around Us'],
    'Grade 1': ['Animal Habitats','Seasons','The Five Senses'],
    'Grade 2': ['Life Cycles','Solids & Liquids','Earth Materials'],
    'Grade 3': ['Food Chains','Magnetism','Weather Patterns'],
    'Grade 4': ['Ecosystems','Electricity','Rocks & Minerals'],
    'Grade 5': ['Photosynthesis','The Solar System','Matter & Energy'],
    'Grade 6': ['Cell Structure','Earth\'s Layers','Force & Motion'],
    'Grade 7': ['Human Body Systems','Chemical Reactions','Ecosystems'],
    'Grade 8': ['Genetics Basics','Waves & Sound','Newton\'s Laws'],
    'Grade 9': ['Atomic Structure','Natural Selection','Types of Energy'],
    'Grade 10': ['Periodic Table','Photosynthesis & Respiration','Plate Tectonics','Chemical Bonding','Acids & Bases','Human Body Systems','Genetics','Ecology & Environment','Newton\'s Laws','Wave Properties'],
    'Grade 11': ['Organic Chemistry','Genetics & DNA','Thermodynamics'],
    'Grade 12': ['Quantum Physics','Biotechnology','Environmental Science'],
    'College':  ['Molecular Biology','Astrophysics','Biochemistry'],
  },
  'English Language Arts': {
    'Kindergarten': ['Alphabet & Phonics','Sight Words','Story Sequencing'],
    'Grade 1': ['Short Vowels','Reading Comprehension','Sentence Writing'],
    'Grade 2': ['Nouns & Verbs','Main Idea & Details','Story Elements'],
    'Grade 3': ['Adjectives & Adverbs','Paragraph Writing','Point of View'],
    'Grade 4': ['Figurative Language','Essay Structure','Summarizing Texts'],
    'Grade 5': ['Theme & Plot','Persuasive Writing','Vocabulary in Context'],
    'Grade 6': ['Literary Devices','Argumentative Writing','Text Structure'],
    'Grade 7': ['Character Analysis','Narrative Writing','Making Inferences'],
    'Grade 8': ['Using Textual Evidence','Research Writing','Rhetorical Devices'],
    'Grade 9': ['Literary Analysis','Expository Writing','Introduction to Shakespeare'],
    'Grade 10': ['Poetry Analysis','Comparative Essays','Rhetoric & Persuasion'],
    'Grade 11': ['American Literature','Synthesis Writing','AP Style Essays'],
    'Grade 12': ['World Literature','College Essay Writing','Critical Analysis'],
    'College':  ['Academic Research Writing','Literary Theory','Advanced Composition'],
  },
  'History': {
    'Grade 3': ['Community History','Native Americans','Colonial Life'],
    'Grade 4': ['State History','American Revolution','Westward Expansion'],
    'Grade 5': ['Civil War','US Constitution','Industrial Revolution'],
    'Grade 6': ['Ancient Egypt','Ancient Greece','Ancient Rome'],
    'Grade 7': ['Middle Ages','The Renaissance','Age of Exploration'],
    'Grade 8': ['American Revolution','Civil War & Reconstruction','Immigration'],
    'Grade 9': ['World War I','Russian Revolution','The Great Depression'],
    'Grade 10': ['World War II','The Cold War','Decolonization Movements'],
    'Grade 11': ['US History Overview','Vietnam War','Civil Rights Movement'],
    'Grade 12': ['Modern World History','Genocide Studies','Global Conflicts'],
    'College':  ['Historiography','Global Economic History','Colonialism & Its Legacy'],
  },
  'Geography': {
    'Grade 3': ['Maps & Globes','Continents & Oceans','My Community'],
    'Grade 4': ['US Regions','Climate Zones','Natural Resources'],
    'Grade 5': ['World Regions','Human & Physical Geography','Migration'],
    'Grade 6': ['Latitude & Longitude','Biomes','World Population'],
    'Grade 7': ['World Cultures','Rivers & Mountains','Trade Routes'],
    'Grade 8': ['US Geography','Economic Geography','Political Maps'],
    'Grade 9': ['Physical Geography','Urbanization','Environmental Issues'],
    'Grade 10': ['Human Geography','Globalization','Cultural Landscapes'],
    'Grade 11': ['AP Human Geography','Development Patterns','Geopolitics'],
    'Grade 12': ['Economic Geography','Environmental Policy','World Systems'],
  },
  'Biology': {
    'Grade 6': ['Cell Structure','Ecosystems','Plant Biology'],
    'Grade 7': ['Human Body Systems','Genetics Intro','Microbiology'],
    'Grade 8': ['Evolution','DNA & Heredity','Ecology'],
    'Grade 9': ['Cell Division','Natural Selection','Biomes'],
    'Grade 10': ['Photosynthesis & Respiration','Genetics','Classification of Life'],
    'Grade 11': ['Molecular Biology','Animal Behavior','Human Physiology'],
    'Grade 12': ['Biotechnology','Advanced Genetics','Environmental Biology'],
    'College':  ['Cell Signaling','Population Genetics','Developmental Biology'],
  },
  'Chemistry': {
    'Grade 9': ['Atomic Structure','Periodic Table','Chemical Bonding'],
    'Grade 10': ['Chemical Reactions','Acids & Bases','Stoichiometry'],
    'Grade 11': ['Organic Chemistry','Equilibrium','Thermochemistry'],
    'Grade 12': ['Electrochemistry','Nuclear Chemistry','Advanced Organic Compounds'],
    'College':  ['Quantum Chemistry','Spectroscopy','Advanced Thermodynamics'],
  },
  'Physics': {
    'Grade 9': ['Motion & Speed','Newton\'s Laws','Energy Types'],
    'Grade 10': ['Waves & Sound','Electricity Basics','Magnetism'],
    'Grade 11': ['Thermodynamics','Optics','Circular Motion'],
    'Grade 12': ['Quantum Mechanics','Relativity','Nuclear Physics'],
    'College':  ['Classical Mechanics','Electromagnetism','Statistical Physics'],
  },
  'Computer Science': {
    'Grade 3': ['Basic Computer Parts','Introduction to Coding','Internet Safety'],
    'Grade 5': ['Scratch Programming','Algorithms','Binary Numbers'],
    'Grade 7': ['Python Basics','Web Design','Data & Databases'],
    'Grade 9': ['Programming Logic','Data Structures','Cybersecurity'],
    'Grade 11': ['Object-Oriented Programming','AI & Machine Learning','Software Design'],
    'Grade 12': ['Advanced Algorithms','Computer Networks','App Development'],
    'College':  ['Operating Systems','Compiler Design','Distributed Systems'],
  },
  'default': ['Introduction to the Topic','Key Concepts & Vocabulary','Hands-on Activity','Review & Assessment','Real-World Applications'],
}

function getTopicSuggestions(subject, grade) {
  const subjectMap = TOPIC_SUGGESTIONS[subject]
  if (!subjectMap) return TOPIC_SUGGESTIONS['default']
  return subjectMap[grade] || TOPIC_SUGGESTIONS['default']
}

function VoiceMic({ onResult, disabled, accentColor = '#399aff', softBg = '#eff6ff', midBorder = '#bfdbfe' }) {
  const [listening, setListening] = useState(false)
  const recRef = useRef(null)
  const toggle = () => {
    if (disabled) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Voice input requires Google Chrome.'); return }
    if (listening) { recRef.current?.stop(); setListening(false); return }
    const rec = new SR()
    rec.lang = 'en-US'; rec.interimResults = false
    rec.onresult = (e) => { onResult(e.results[0][0].transcript); setListening(false) }
    rec.onerror = () => setListening(false)
    rec.onend   = () => setListening(false)
    rec.start(); recRef.current = rec; setListening(true)
  }
  return (
    <button type="button" onClick={toggle} title={listening ? 'Stop' : 'Speak'} disabled={disabled} style={{
      position: 'absolute', right: 9, top: 9, width: 30, height: 30, borderRadius: '50%',
      border: listening ? '2px solid #ef4444' : `1.5px solid ${midBorder}`,
      background: listening ? '#fef2f2' : softBg,
      color: listening ? '#ef4444' : accentColor,
      cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.2s', opacity: disabled ? 0.4 : 1,
      boxShadow: listening ? '0 0 0 4px rgba(239,68,68,0.15)' : 'none',
      animation: listening ? 'pulse 1.2s ease-in-out infinite' : 'none', zIndex: 2,
    }}>
      {listening
        ? <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
        : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
      }
    </button>
  )
}

const lockScroll = (e) => {
  const el = e.currentTarget
  const { scrollTop, scrollHeight, clientHeight } = el
  const atTop    = scrollTop === 0
  const atBottom = scrollTop + clientHeight >= scrollHeight - 1
  if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) e.preventDefault()
  e.stopPropagation()
}

const scrollStyle = { overflowY: 'auto', overscrollBehavior: 'contain', scrollbarWidth: 'thin', scrollbarColor: '#bfdbfe transparent' }
const PAGE_H    = 'calc(100vh - var(--header-h) - 56px)'
const FORM_BODY = { flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 14, scrollbarWidth: 'thin', scrollbarColor: '#bfdbfe transparent' }

const ErrMsg = ({ msg }) => msg ? <div style={{ fontSize: '0.72rem', color: '#dc2626', marginTop: 4, fontWeight: 500 }}>⚠ {msg}</div> : null

export default function LessonPlanGenerator() {
  const { teacherId: TEACHER_ID } = useAuth()
  const STUDENT_ID = 'student-' + (Math.random().toString(36).substring(7))
  const [form, setForm] = useState({
    topic: '', grade_level: '', subject: '',
    duration: '45 minutes', objectives: '', standards: '',
    include_topic_overview: true,
    additional_notes: ''
  })
  const [result, setResult]   = useState(() => localStorage.getItem(STORAGE_KEY) || '')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors]   = useState({})
  const [showHistory, setShowHistory] = useState(false)
  const [limitError, setLimitError] = useState('')
  const usageCounterRef = useRef(null)
  const [sourceMaterial, setSourceMaterial] = useState('')
  const [materialName, setMaterialName]     = useState('')
  const [materialUploading, setMaterialUploading] = useState(false)
  const materialFileRef = useRef(null)

  const handleMaterialUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return
    setMaterialUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch(`${API}/api/upload-material`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Upload failed')
      setSourceMaterial(data.text); setMaterialName(file.name)
    } catch (e) { alert('Could not read file: ' + e.message) }
    finally { setMaterialUploading(false); e.target.value = '' }
  }

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const saveResult  = (val) => { setResult(val); localStorage.setItem(STORAGE_KEY, val) }
  const clearResult = ()    => { setResult(''); localStorage.removeItem(STORAGE_KEY) }

  const validate = () => {
    const e = {}
    if (!form.subject)      e.subject     = 'Please select a subject.'
    if (!form.grade_level)  e.grade_level = 'Please select a grade level.'
    if (!form.topic.trim()) e.topic       = 'Please enter or select a topic.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const generate = async () => {
    if (!validate()) return
    setLoading(true); saveResult('')

    // Check usage limit first
    try {
      const usageRes = await fetch(`${API}/api/increment-usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_id: TEACHER_ID, tool_name: 'lesson-plan' })
      })
      const usageData = await usageRes.json()

      if (usageData.exceeded) {
        setLimitError(usageData.error || 'Daily limit exceeded. Try again tomorrow.')
        setLoading(false)
        return
      }
    } catch (e) {
      console.error('Usage check failed:', e)
      // Continue anyway if usage check fails
    }

    try {
      const res  = await fetch(`${API}/api/lesson-plan`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source_material: sourceMaterial }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Error')
      saveResult(data.result)

      // Refresh usage counter immediately
      if (usageCounterRef.current) {
        usageCounterRef.current.refresh()
      }

      // Save to chat history
      try {
        fetch(`${API}/api/save-chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teacher_id: TEACHER_ID,
            tool_name: 'lesson-plan',
            topic: form.topic,
            grade_level: form.grade_level,
            subject: form.subject,
            request_data: form,
            response_preview: data.result?.substring(0, 200),
            response_content: data.result
          })
        })
      } catch (e) {
        console.error('Chat save failed:', e)
      }
    } catch (e) { setErrors(prev => ({ ...prev, general: e.message })) }
    finally     { setLoading(false) }
  }

  const topicLocked = !form.subject || !form.grade_level
  const suggestions = topicLocked ? [] : getTopicSuggestions(form.subject, form.grade_level)

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      {limitError && <ErrorToast message={limitError} duration={5000} onClose={() => setLimitError('')} />}

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, alignItems: 'start', height: PAGE_H }}>

        {/* ── LEFT PANEL ── */}
        <div className="card fade-up" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: PAGE_H, padding: 0 }}>
          <div style={{ padding: '20px 24px', flexShrink: 0, borderBottom: '1.5px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <button onClick={() => setShowHistory(true)} title="Chat History" style={{
                background: '#399aff', border: 'none', borderRadius: 8,
                padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                color: 'white', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s'
              }}>
                📋 History
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#399aff" strokeWidth="1.9" strokeLinecap="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 8 }}>
                Lesson Plan Generator
                <UsageCounter ref={usageCounterRef} teacherId={TEACHER_ID} toolName="lesson-plan" />
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>Subject → Grade → Topic → Generate</div>
            </div>
          </div>
        </div>

        <div style={FORM_BODY}>
          <div style={{ height: 8 }}/>

          {/* STEP 1 — Subject */}
          <div className="form-group">
            <label className="form-label">Subject <span style={{ color: '#ef4444' }}>*</span></label>
            <select className="form-select" value={form.subject}
              onChange={e => { set('subject', e.target.value); set('topic', '') }}
              style={{ borderColor: errors.subject ? '#fca5a5' : '#bfdbfe' }}>
              <option value="">— Select Subject —</option>
              {subjects.map(s => <option key={s}>{s}</option>)}
            </select>
            <ErrMsg msg={errors.subject} />
          </div>

          {/* STEP 2 — Grade */}
          <div className="form-group">
            <label className="form-label">Grade Level <span style={{ color: '#ef4444' }}>*</span></label>
            <CustomSelect value={form.grade_level}
              onChange={e => { set('grade_level', e.target.value); set('topic', '') }}
              style={{ borderColor: errors.grade_level ? '#fca5a5' : '#bfdbfe' }}>
              <option value="">— Select Grade —</option>
              {grades.map(g => <option key={g}>{g}</option>)}
            </CustomSelect>
            <ErrMsg msg={errors.grade_level} />
          </div>

          {/* STEP 3 — Topic dropdown + custom textarea */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Topic / Objective <span style={{ color: '#ef4444' }}>*</span></span>
              <span style={{ fontSize: '0.68rem', color: '#399aff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
                Voice enabled
              </span>
            </label>

            {/* Dropdown */}
            <select
              className="form-select"
              value={suggestions.includes(form.topic) ? form.topic : ''}
              onChange={e => set('topic', e.target.value)}
              disabled={topicLocked}
              style={{ borderColor: errors.topic ? '#fca5a5' : '#bfdbfe', opacity: topicLocked ? 0.5 : 1, marginBottom: 8 }}
            >
              <option value="">{topicLocked ? 'Select subject & grade first…' : '— Pick a topic —'}</option>
              {suggestions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Custom textarea with voice */}
            <div style={{ position: 'relative' }}>
              <textarea className="form-textarea"
                placeholder="Or type a custom topic…"
                value={suggestions.includes(form.topic) ? '' : form.topic}
                onChange={e => set('topic', e.target.value)}
                onWheel={lockScroll}
                disabled={topicLocked}
                style={{ ...scrollStyle, minHeight: 60, maxHeight: 100, paddingRight: 46, resize: 'vertical',
                  borderColor: errors.topic ? '#fca5a5' : '#bfdbfe', opacity: topicLocked ? 0.5 : 1 }}/>
              <VoiceMic onResult={v => set('topic', v)}
                disabled={topicLocked} accentColor="#399aff" softBg="#eff6ff" midBorder="#bfdbfe"/>
            </div>
            <ErrMsg msg={errors.topic} />
          </div>

          {/* Duration */}
          <div className="form-group">
            <label className="form-label">Class Duration</label>
            <select className="form-select" value={form.duration} onChange={e => set('duration', e.target.value)}
              style={{ borderColor: '#bfdbfe' }}>
              {durations.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>

          {/* Learning Objectives */}
          <div className="form-group">
            <label className="form-label">Learning Objectives (optional)</label>
            <textarea className="form-textarea"
              placeholder="e.g. Students will be able to explain the process of photosynthesis…"
              value={form.objectives} onChange={e => set('objectives', e.target.value)}
              onWheel={lockScroll}
              style={{ ...scrollStyle, minHeight: 60, maxHeight: 100, resize: 'vertical', borderColor: '#bfdbfe' }}/>
          </div>

          {/* Standards */}
          <div className="form-group">
            <label className="form-label">Standards / Curriculum (optional)</label>
            <input className="form-input" placeholder="e.g. CCSS.ELA-LITERACY.RL.5.1, NGSS HS-LS1-5…"
              value={form.standards} onChange={e => set('standards', e.target.value)}
              style={{ borderColor: '#bfdbfe' }}/>
          </div>

          {/* Include Topic Overview */}
          <div className="form-group">
            <label className="form-label">Output</label>
            <button type="button" onClick={() => set('include_topic_overview', !form.include_topic_overview)} style={{
              width: '100%', padding: '9px 14px', borderRadius: 10, fontFamily: 'var(--font)',
              border: form.include_topic_overview ? '2px solid var(--accent)' : '1.5px solid var(--border)',
              background: form.include_topic_overview ? 'var(--accent-soft)' : 'var(--surface)',
              color: form.include_topic_overview ? 'var(--accent)' : 'var(--text-2)',
              fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.18s', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ width: 18, height: 18, borderRadius: 5,
                border: form.include_topic_overview ? '2px solid #399aff' : '1.5px solid #ccc',
                background: form.include_topic_overview ? '#399aff' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {form.include_topic_overview && <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><polyline points="2 6 5 9 10 3"/></svg>}
              </span>
              Include Topic Overview page
            </button>
          </div>

          {/* Additional Notes */}
          <div className="form-group">
            <label className="form-label">Additional Notes (optional)</label>
            <textarea className="form-textarea"
              placeholder="e.g. Students have prior knowledge of cell biology…"
              value={form.additional_notes} onChange={e => set('additional_notes', e.target.value)}
              style={{ minHeight: 55, maxHeight: 90, borderColor: '#bfdbfe' }}/>
          </div>

          {/* Upload Teaching Material */}
          <div className="form-group">
            <label className="form-label">Upload Your Material (optional)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" disabled={materialUploading} onClick={() => materialFileRef.current?.click()}
                style={{ display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:8,
                  border:'1.5px solid var(--accent-mid)',background:'var(--accent-soft)',
                  color:'var(--accent)',fontSize:'0.82rem',fontWeight:600,cursor:'pointer' }}>
                {materialUploading ? '⏳ Reading…' : '📄 Upload PDF / DOCX / TXT'}
              </button>
              {sourceMaterial && <span style={{ fontSize:'0.78rem',color:'#10b981',fontWeight:600 }}>✓ {materialName}</span>}
              {sourceMaterial && <button type="button" onClick={() => { setSourceMaterial(''); setMaterialName('') }}
                style={{ fontSize:'0.75rem',color:'#ef4444',background:'none',border:'none',cursor:'pointer',fontWeight:600 }}>✕ Remove</button>}
            </div>
            <input ref={materialFileRef} type="file" accept=".pdf,.docx,.txt,.md" style={{ display:'none' }} onChange={handleMaterialUpload} />
            {sourceMaterial && <div style={{ fontSize:'0.72rem',color:'var(--text-3)',marginTop:4 }}>AI will align the lesson to your uploaded material</div>}
          </div>

          {errors.general && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: '0.82rem', color: '#dc2626', fontWeight: 500 }}>
              ⚠ {errors.general}
            </div>
          )}

          <button className="btn btn-primary" onClick={generate} disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.95rem', marginTop: 4,
              background: 'linear-gradient(135deg,#399aff,#1d7fe0)', boxShadow: '0 4px 14px rgba(57,154,255,0.35)' }}>
            {loading
              ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Generating…</>
              : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg> Generate Lesson Plan</>
            }
          </button>
          <div style={{ height: 4 }}/>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ height: PAGE_H, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} className="fade-up-1">
        <div style={{ flex: 1, minHeight: 0 }}>
          <OutputBox result={result} loading={loading} toolName="lesson plan" onClear={clearResult}
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>}
          />
        </div>
      </div>
    </div>

    {/* Chat History Sidebar */}
    <ChatHistory
      isOpen={showHistory}
      onClose={() => setShowHistory(false)}
      teacherId={TEACHER_ID}
      onSelectChat={(chat) => {
        saveResult(chat.content || chat.preview)
        setShowHistory(false)
      }}
    />
    </div>
  )
}