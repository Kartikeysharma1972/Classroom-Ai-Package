import React, { useState, useRef, useMemo } from 'react'
import OutputBox from '../components/OutputBox'
import CustomSelect from '../components/CustomSelect'
import ChatHistory from '../components/ChatHistory'
import UsageCounter from '../components/UsageCounter'
import ErrorToast from '../components/ErrorToast'
import { useAuth } from '../context/AuthContext'
import {
  GRADES, getCoreSubjects, getMiscSubjects, getCoreTopics, getMiscTopics,
  findTopicDescription,
} from '../data/cbseSubjects'

const API = window.location.hostname === 'localhost' ? 'http://localhost:8001' : window.location.origin
const STORAGE_KEY = 'classroom-result-activity'

const activityTypes = [
  { value: 'group',      label: 'Group Activities',     icon: '👥' },
  { value: 'project',    label: 'Project-Based',         icon: '🛠️' },
  { value: 'hands_on',   label: 'Hands-On / Lab',        icon: '🔬' },
  { value: 'discussion', label: 'Discussion / Debate',   icon: '💬' },
  { value: 'game',       label: 'Educational Games',     icon: '🎲' },
  { value: 'creative',   label: 'Creative Expression',   icon: '🎨' },
]

const bloomsLevels = [
  { value: 'remember',   label: 'Remember' },
  { value: 'understand', label: 'Understand' },
  { value: 'apply',      label: 'Apply' },
  { value: 'analyze',    label: 'Analyze' },
  { value: 'evaluate',   label: 'Evaluate' },
  { value: 'create',     label: 'Create' },
]

const durations  = ['15 minutes','20 minutes','30 minutes','45 minutes','60 minutes']
const groupSizes = ['Pairs (2 students)','3-4 students','4-5 students','5-6 students','Whole class']

/* ── Accent palette (green) ─────────────────── */
const ACCENT      = '#059669'
const ACCENT_SOFT = '#ecfdf5'
const ACCENT_MID  = '#a7f3d0'

function VoiceMic({ onResult, disabled }) {
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
      border: listening ? '2px solid #ef4444' : `1.5px solid ${ACCENT_MID}`,
      background: listening ? '#fef2f2' : ACCENT_SOFT,
      color: listening ? '#ef4444' : ACCENT,
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

const scrollStyle = { overflowY: 'auto', overscrollBehavior: 'contain', scrollbarWidth: 'thin', scrollbarColor: `${ACCENT_MID} transparent` }
const PAGE_H    = 'calc(100vh - var(--header-h) - 56px)'
const FORM_BODY = { flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 14, scrollbarWidth: 'thin', scrollbarColor: `${ACCENT_MID} transparent` }

const ErrMsg = ({ msg }) => msg ? <div style={{ fontSize: '0.72rem', color: '#dc2626', marginTop: 4, fontWeight: 500 }}>⚠ {msg}</div> : null

const HIDE_CORE_GRADES = ['Kindergarten', 'College']
const isHideCoreGrade = (g) => HIDE_CORE_GRADES.includes(g)

// ── Track tabs (Core / Suggestions / Type) — grade-aware ─────────────────
function TrackTabs({ value, onChange, coreCount, miscCount, disabled, grade, hideCoreWhenEmpty = false, showType = true }) {
  const hideCore = isHideCoreGrade(grade) || (hideCoreWhenEmpty && coreCount === 0)
  const miscLabel = isHideCoreGrade(grade) ? 'Suggestions' : 'Miscellaneous'
  const tabs = [
    !hideCore && { key: 'core', label: 'Core (CBSE/NCERT)', count: coreCount, color: '#10b981', bg: '#ecfdf5', border: '#bbf7d0' },
    { key: 'misc', label: miscLabel, count: miscCount, color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d' },
    showType && { key: 'type', label: '✏️ Type', count: null, color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
  ].filter(Boolean)
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 6, opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      {tabs.map(t => {
        const active = value === t.key
        return (
          <button key={t.key} type="button" onClick={() => onChange(t.key)} style={{
            flex: 1, padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
            fontSize: '0.78rem', fontWeight: 600, fontFamily: 'var(--font)',
            border: active ? `1.5px solid ${t.color}` : '1.5px solid var(--border)',
            background: active ? t.bg : 'var(--surface)',
            color: active ? t.color : 'var(--text-2)',
            transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            {t.label}
            {t.count !== null && (
              <span style={{
                fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: 8,
                background: active ? t.color : '#e5e7eb', color: active ? '#fff' : 'var(--text-2)',
              }}>{t.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default function ClassActivityGenerator() {
  const { teacherId: TEACHER_ID } = useAuth()
  const [form, setForm] = useState({
    grade_level: '', subject: '', topic: '',
    activity_types: ['group'], num_activities: 3,
    duration: '30 minutes', group_size: '4-5 students',
    blooms_level: 'understand',
    learning_outcomes: '', materials_available: '',
    additional_instructions: '',
  })
  const [subjectTrack, setSubjectTrack] = useState('core')
  const [topicTrack, setTopicTrack]     = useState('core')
  const [customTopic, setCustomTopic]   = useState('')
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

  // Derived option lists
  const coreSubjects = useMemo(() => getCoreSubjects(form.grade_level), [form.grade_level])
  const miscSubjects = useMemo(() => getMiscSubjects(form.grade_level), [form.grade_level])
  const coreTopics   = useMemo(() => getCoreTopics(form.grade_level, form.subject), [form.grade_level, form.subject])
  const miscTopics   = useMemo(() => getMiscTopics(form.grade_level, form.subject), [form.grade_level, form.subject])

  const subjectOptions = subjectTrack === 'core' ? coreSubjects : miscSubjects
  const topicOptions   = topicTrack   === 'core' ? coreTopics   : miscTopics

  const subjectLocked = !form.grade_level
  const topicLocked   = !form.subject

  // Reset dependent fields when parents change
  const onGradeChange = (val) => {
    setForm(f => ({ ...f, grade_level: val, subject: '', topic: '' }))
    const defaultTrack = isHideCoreGrade(val) ? 'misc' : 'core'
    setSubjectTrack(defaultTrack); setTopicTrack(defaultTrack); setCustomTopic('')
    setErrors({})
  }
  const onSubjectTrackChange = (t) => {
    setSubjectTrack(t)
    setForm(f => ({ ...f, subject: '', topic: '' }))
    if (t === 'type') setTopicTrack('type')
    else if (t === 'misc') setTopicTrack('misc')
    else setTopicTrack(isHideCoreGrade(form.grade_level) ? 'misc' : 'core')
    setCustomTopic('')
  }
  const onSubjectChange = (val) => {
    setForm(f => ({ ...f, subject: val, topic: '' }))
    if (subjectTrack === 'type') setTopicTrack('type')
    else if (subjectTrack === 'misc') setTopicTrack('misc')
    else setTopicTrack(isHideCoreGrade(form.grade_level) ? 'misc' : 'core')
    setCustomTopic('')
  }
  const onTopicTrackChange = (t) => {
    setTopicTrack(t); setForm(f => ({ ...f, topic: '' })); setCustomTopic('')
  }
  const toggleActivityType = (v) => {
    setForm(f => {
      const has = f.activity_types.includes(v)
      const next = has ? f.activity_types.filter(t => t !== v) : [...f.activity_types, v]
      return { ...f, activity_types: next.length ? next : f.activity_types }
    })
  }

  // Build topic metadata for backend
  const buildTopicMeta = () => {
    const effectiveTopic = (form.topic && form.topic.trim()) || customTopic.trim()
    if (!effectiveTopic) return { topic: '', description: '', track: topicTrack }
    let description = ''
    if (topicTrack === 'core') {
      description = findTopicDescription(form.grade_level, form.subject, effectiveTopic) || ''
    } else {
      const m = miscTopics.find(t => t.label === effectiveTopic)
      description = m?.description || ''
    }
    return { topic: effectiveTopic, description, track: topicTrack }
  }

  const validate = () => {
    const e = {}
    if (!form.grade_level)  e.grade_level = 'Please select a grade level.'
    if (!form.subject)      e.subject     = 'Please select a subject.'
    const { topic } = buildTopicMeta()
    if (!topic) e.topic = 'Please select or type a topic.'
    if (!form.activity_types.length) e.activity_types = 'Pick at least one activity type.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const generate = async () => {
    if (!validate()) return
    setLoading(true); saveResult('')

    const { topic, description, track } = buildTopicMeta()

    try {
      const usageRes = await fetch(`${API}/api/increment-usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_id: TEACHER_ID, tool_name: 'class-activity' })
      })
      const usageData = await usageRes.json()
      if (usageData.exceeded) {
        setLimitError(usageData.error || 'Daily limit exceeded. Try again tomorrow.')
        setLoading(false); return
      }
    } catch (e) { console.error('Usage check failed:', e) }

    try {
      const payload = {
        ...form,
        // Keep legacy single-value field for backward compatibility (first selected type).
        activity_type: form.activity_types[0] || 'group',
        topic,
        topic_description: description,
        topic_track: track,
        source_material: sourceMaterial,
      }
      const res = await fetch(`${API}/api/class-activity`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Error')
      saveResult(data.result)

      if (usageCounterRef.current) usageCounterRef.current.refresh()

      try {
        fetch(`${API}/api/save-chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teacher_id: TEACHER_ID, tool_name: 'class-activity',
            topic, grade_level: form.grade_level, subject: form.subject,
            request_data: payload,
            response_preview: data.result?.substring(0, 200),
            response_content: data.result,
          })
        })
      } catch (e) { console.error('Chat save failed:', e) }
    } catch (e) { setErrors(prev => ({ ...prev, general: e.message })) }
    finally     { setLoading(false) }
  }

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      {limitError && <ErrorToast message={limitError} duration={5000} onClose={() => setLimitError('')} />}

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, alignItems: 'start', height: PAGE_H }}>

        {/* ── LEFT PANEL ── */}
        <div className="card fade-up" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: PAGE_H, padding: 0 }}>
          <div style={{ padding: '20px 24px', flexShrink: 0, borderBottom: '1.5px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <button onClick={() => setShowHistory(true)} title="Chat History" style={{
                background: ACCENT, border: 'none', borderRadius: 8,
                padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                color: 'white', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s'
              }}>
                History
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, background: '#fff', border: `1.5px solid ${ACCENT_MID}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <img src="/codevidhya_logo.jfif" alt="CodeVidhya"
                  style={{ width: '82%', height: '82%', objectFit: 'contain' }}
                  onError={(e) => { e.currentTarget.style.display='none' }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  Class Activity Generator
                  <UsageCounter ref={usageCounterRef} teacherId={TEACHER_ID} toolName="class-activity" />
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>Grade → Subject → Topic → Generate</div>
              </div>
            </div>
          </div>

          <div style={FORM_BODY}>
            <div style={{ height: 8 }}/>

            {/* STEP 1 — Grade */}
            <div className="form-group">
              <label className="form-label">Grade Level <span style={{ color: '#ef4444' }}>*</span></label>
              <CustomSelect value={form.grade_level} onChange={e => onGradeChange(e.target.value)}
                style={{ borderColor: errors.grade_level ? '#fca5a5' : ACCENT_MID }}>
                <option value="">— Select Grade —</option>
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </CustomSelect>
              <ErrMsg msg={errors.grade_level} />
            </div>

            {/* STEP 2 — Subject (Core / Suggestions / Type tabs) */}
            <div className="form-group">
              <label className="form-label">
                Subject <span style={{ color: '#ef4444' }}>*</span>
                {subjectLocked && <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 500, marginLeft: 6 }}>(select a grade first)</span>}
              </label>
              <TrackTabs
                value={subjectTrack}
                onChange={onSubjectTrackChange}
                coreCount={coreSubjects.length}
                miscCount={miscSubjects.length}
                disabled={subjectLocked}
                grade={form.grade_level}
              />
              {subjectTrack === 'type' ? (
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Artificial Intelligence, Robotics, Mathematics…"
                  value={form.subject}
                  onChange={e => onSubjectChange(e.target.value)}
                  disabled={subjectLocked}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10,
                    border: `1.5px solid ${errors.subject ? '#fca5a5' : ACCENT_MID}`,
                    fontFamily: 'inherit', fontSize: '0.9rem', background: 'var(--bg)',
                    outline: 'none', boxSizing: 'border-box', opacity: subjectLocked ? 0.5 : 1 }}
                />
              ) : (
                <CustomSelect value={form.subject} onChange={e => onSubjectChange(e.target.value)}
                  style={{ borderColor: errors.subject ? '#fca5a5' : ACCENT_MID, opacity: subjectLocked ? 0.5 : 1 }}>
                  <option value="">{subjectLocked ? 'Pick grade first…' : (subjectTrack === 'core' ? '— Pick CBSE subject —' : (isHideCoreGrade(form.grade_level) ? '— Pick a suggestion —' : '— Pick miscellaneous subject —'))}</option>
                  {subjectOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </CustomSelect>
              )}
              <ErrMsg msg={errors.subject} />
            </div>

            {/* STEP 3 — Topic (Core/Misc tabs) */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Topic <span style={{ color: '#ef4444' }}>*</span></span>
                <span style={{ fontSize: '0.68rem', color: ACCENT, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
                  Voice
                </span>
              </label>
              <TrackTabs
                value={topicTrack}
                onChange={onTopicTrackChange}
                coreCount={coreTopics.length}
                miscCount={miscTopics.length}
                disabled={topicLocked}
                grade={form.grade_level}
                hideCoreWhenEmpty
              />
              {topicTrack !== 'type' && (
                <CustomSelect value={topicOptions.some(t => t.label === form.topic) ? form.topic : ''}
                  onChange={e => { set('topic', e.target.value); setCustomTopic('') }}
                  style={{ borderColor: errors.topic ? '#fca5a5' : ACCENT_MID, opacity: topicLocked ? 0.5 : 1 }}>
                  <option value="">
                    {topicLocked ? 'Pick subject first…' :
                      (topicTrack === 'core'
                        ? '— Pick NCERT chapter / topic —'
                        : (isHideCoreGrade(form.grade_level) ? '— Pick a suggested topic —' : '— Pick miscellaneous topic —'))}
                  </option>
                  {topicOptions.map(t => <option key={t.label} value={t.label}>{t.chapter ? `${t.chapter} — ${t.label}` : t.label}</option>)}
                </CustomSelect>
              )}

              {/* Topic description preview */}
              {!topicLocked && (() => {
                const sel = topicOptions.find(t => t.label === form.topic)
                if (sel && sel.description) {
                  return (
                    <div style={{ marginTop: 8, padding: '8px 10px', background: topicTrack === 'core' ? '#ecfdf5' : '#fffbeb',
                      border: `1px solid ${topicTrack === 'core' ? '#bbf7d0' : '#fcd34d'}`, borderRadius: 8,
                      fontSize: '0.72rem', color: 'var(--text-2)', lineHeight: 1.5 }}>
                      <strong style={{ color: topicTrack === 'core' ? '#047857' : '#b45309' }}>
                        {topicTrack === 'core' ? 'NCERT scope:' : 'Topic scope:'}
                      </strong> {sel.description}
                    </div>
                  )
                }
                return null
              })()}

              {/* Custom topic textarea */}
              <div style={{ position: 'relative', marginTop: 8 }}>
                <textarea className="form-textarea"
                  placeholder={topicLocked ? '' : 'Or type a custom topic…'}
                  value={topicOptions.some(t => t.label === form.topic) ? '' : (customTopic || form.topic)}
                  onChange={e => { setCustomTopic(e.target.value); set('topic', '') }}
                  onWheel={lockScroll}
                  disabled={topicLocked}
                  style={{ ...scrollStyle, minHeight: 56, maxHeight: 90, paddingRight: 46, resize: 'vertical',
                    borderColor: errors.topic ? '#fca5a5' : ACCENT_MID, opacity: topicLocked ? 0.5 : 1 }}/>
                <VoiceMic onResult={v => { setCustomTopic(v); set('topic', '') }} disabled={topicLocked} />
              </div>
              <ErrMsg msg={errors.topic} />
            </div>

            {/* Activity Types — multi-select */}
            <div className="form-group">
              <label className="form-label">
                Activity Types
                <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 500, marginLeft: 6 }}>
                  (select one or more)
                </span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {activityTypes.map(a => {
                  const active = form.activity_types.includes(a.value)
                  return (
                    <button key={a.value} type="button" onClick={() => toggleActivityType(a.value)} style={{
                      padding: '9px 10px', borderRadius: 10,
                      border: active ? `1.5px solid ${ACCENT}` : '1.5px solid var(--border)',
                      background: active ? ACCENT_SOFT : 'var(--surface)',
                      color: active ? ACCENT : 'var(--text-2)',
                      fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                      textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8,
                      fontFamily: 'var(--font)', transition: 'all 0.15s',
                    }}>
                      <span style={{
                        width: 16, height: 16, borderRadius: 4,
                        border: active ? `2px solid ${ACCENT}` : '1.5px solid #cbd5e1',
                        background: active ? ACCENT : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {active && <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><polyline points="2 6 5 9 10 3"/></svg>}
                      </span>
                      <span style={{ fontSize: '1rem' }}>{a.icon}</span>
                      <span>{a.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Number of Activities + Duration row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Activities</label>
                <select className="form-select" value={form.num_activities} onChange={e => set('num_activities', parseInt(e.target.value))}
                  style={{ borderColor: ACCENT_MID }}>
                  {[2, 3, 4, 5].map(n => <option key={n} value={n}>{n} activities</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Duration Each</label>
                <select className="form-select" value={form.duration} onChange={e => set('duration', e.target.value)}
                  style={{ borderColor: ACCENT_MID }}>
                  {durations.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* Group Size */}
            <div className="form-group">
              <label className="form-label">Group Size</label>
              <select className="form-select" value={form.group_size} onChange={e => set('group_size', e.target.value)}
                style={{ borderColor: ACCENT_MID }}>
                {groupSizes.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>

            {/* Bloom's Level */}
            <div className="form-group">
              <label className="form-label">Bloom's Level</label>
              <select className="form-select" value={form.blooms_level} onChange={e => set('blooms_level', e.target.value)}
                style={{ borderColor: ACCENT_MID }}>
                {bloomsLevels.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>

            {/* Learning Outcomes */}
            <div className="form-group">
              <label className="form-label">Learning Outcomes (optional)</label>
              <textarea className="form-textarea"
                placeholder="e.g. Students will be able to identify the stages of photosynthesis…"
                value={form.learning_outcomes} onChange={e => set('learning_outcomes', e.target.value)}
                onWheel={lockScroll}
                style={{ ...scrollStyle, minHeight: 55, maxHeight: 90, resize: 'vertical', borderColor: ACCENT_MID }}/>
            </div>

            {/* Additional Instructions */}
            <div className="form-group">
              <label className="form-label">Additional Instructions (optional)</label>
              <textarea className="form-textarea"
                placeholder="e.g. Use locally available materials, Include assessment rubric…"
                value={form.additional_instructions} onChange={e => set('additional_instructions', e.target.value)}
                onWheel={lockScroll}
                style={{ ...scrollStyle, minHeight: 55, maxHeight: 90, resize: 'vertical', borderColor: ACCENT_MID }}/>
            </div>

            {/* Upload Teaching Material */}
            <div className="form-group">
              <label className="form-label">Upload Material (optional)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" disabled={materialUploading} onClick={() => materialFileRef.current?.click()}
                  style={{ display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:8,
                    border:`1.5px solid ${ACCENT_MID}`,background:ACCENT_SOFT,
                    color:ACCENT,fontSize:'0.82rem',fontWeight:600,cursor:'pointer' }}>
                  {materialUploading ? 'Reading…' : 'Upload PDF / DOCX / TXT'}
                </button>
                {sourceMaterial && <span style={{ fontSize:'0.78rem',color:'#10b981',fontWeight:600 }}>✓ {materialName}</span>}
                {sourceMaterial && <button type="button" onClick={() => { setSourceMaterial(''); setMaterialName('') }}
                  style={{ fontSize:'0.75rem',color:'#ef4444',background:'none',border:'none',cursor:'pointer',fontWeight:600 }}>✕ Remove</button>}
              </div>
              <input ref={materialFileRef} type="file" accept=".pdf,.docx,.txt,.md" style={{ display:'none' }} onChange={handleMaterialUpload} />
              {sourceMaterial && <div style={{ fontSize:'0.72rem',color:'var(--text-3)',marginTop:4 }}>AI will align activities to your uploaded material</div>}
            </div>

            {errors.general && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: '0.82rem', color: '#dc2626', fontWeight: 500 }}>
                ⚠ {errors.general}
              </div>
            )}

            <button className="btn btn-primary" onClick={generate} disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.95rem', marginTop: 4,
                background: `linear-gradient(135deg,${ACCENT},#047857)`, boxShadow: `0 4px 14px rgba(5,150,105,0.35)` }}>
              {loading
                ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Generating…</>
                : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg> Generate Activities</>
              }
            </button>
            <div style={{ height: 4 }}/>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ height: PAGE_H, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} className="fade-up-1">
          <div style={{ flex: 1, minHeight: 0 }}>
            <OutputBox result={result} loading={loading} toolName="class activities" onClear={clearResult} onEdit={saveResult}
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}
            />
          </div>
        </div>
      </div>

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
