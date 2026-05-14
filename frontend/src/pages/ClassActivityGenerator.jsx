import React, { useState, useRef } from 'react'
import OutputBox from '../components/OutputBox'
import ChatHistory from '../components/ChatHistory'
import UsageCounter from '../components/UsageCounter'
import ErrorToast from '../components/ErrorToast'
import { useAuth } from '../context/AuthContext'

const API = window.location.hostname === 'localhost' ? 'http://localhost:8001' : window.location.origin
const STORAGE_KEY = 'classroom-result-activity'

const grades = ['Kindergarten','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12','College']
const subjects = ['Mathematics','Science','English Language Arts','Social Studies','History','Geography','Physics','Chemistry','Biology','Computer Science','Art','Music','Physical Education','Foreign Language','Other']

const activityTypes = [
  { value: 'group', label: 'Group Activities' },
  { value: 'project', label: 'Project-Based' },
  { value: 'hands_on', label: 'Hands-On / Lab' },
  { value: 'discussion', label: 'Discussion / Debate' },
  { value: 'game', label: 'Educational Games' },
  { value: 'creative', label: 'Creative Expression' },
  { value: 'mixed', label: 'Mixed Activities' },
]

const durations = ['15 minutes', '20 minutes', '30 minutes', '45 minutes', '60 minutes']
const groupSizes = ['Pairs (2 students)', '3-4 students', '4-5 students', '5-6 students', 'Whole class']

const PAGE_H = 'calc(100vh - var(--header-h) - 56px)'

export default function ClassActivityGenerator() {
  const { teacherId } = useAuth()
  const [form, setForm] = useState({
    topic: '', grade_level: '', subject: '',
    activity_type: 'group', num_activities: 3,
    duration: '30 minutes', group_size: '4-5 students',
    learning_outcomes: '', materials_available: '',
    additional_instructions: ''
  })
  const [result, setResult] = useState(() => localStorage.getItem(STORAGE_KEY) || '')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [showHistory, setShowHistory] = useState(false)
  const [limitError, setLimitError] = useState('')
  const usageCounterRef = useRef(null)
  const [sourceMaterial, setSourceMaterial] = useState('')
  const [materialName, setMaterialName] = useState('')
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
  const saveResult = (val) => { setResult(val); localStorage.setItem(STORAGE_KEY, val) }
  const clearResult = () => { setResult(''); localStorage.removeItem(STORAGE_KEY) }

  const validate = () => {
    const e = {}
    if (!form.subject) e.subject = 'Please select a subject.'
    if (!form.grade_level) e.grade_level = 'Please select a grade level.'
    if (!form.topic.trim()) e.topic = 'Please enter a topic.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const generate = async () => {
    if (!validate()) return
    setLoading(true); saveResult('')

    try {
      const usageRes = await fetch(`${API}/api/increment-usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_id: teacherId, tool_name: 'class-activity' })
      })
      const usageData = await usageRes.json()
      if (usageData.exceeded) {
        setLimitError('Daily limit exceeded. Try again tomorrow.')
        setLoading(false)
        return
      }
    } catch (e) { console.error('Usage check failed:', e) }

    try {
      const res = await fetch(`${API}/api/class-activity`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source_material: sourceMaterial }),
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
            teacher_id: teacherId,
            tool_name: 'class-activity',
            topic: form.topic,
            grade_level: form.grade_level,
            subject: form.subject,
            request_data: form,
            response_preview: data.result?.substring(0, 200),
            response_content: data.result
          })
        })
      } catch (e) { console.error('Chat save failed:', e) }
    } catch (e) { setErrors(prev => ({ ...prev, general: e.message })) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      {limitError && <ErrorToast message={limitError} duration={5000} onClose={() => setLimitError('')} />}

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, alignItems: 'start', height: PAGE_H }}>
        {/* LEFT PANEL */}
        <div className="card fade-up" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: PAGE_H, padding: 0 }}>
          <div style={{ padding: '20px 24px', flexShrink: 0, borderBottom: '1.5px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <button onClick={() => setShowHistory(true)} style={{
                background: '#059669', border: 'none', borderRadius: 8,
                padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                color: 'white', fontSize: '0.85rem', fontWeight: 600,
              }}>
                History
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, background: '#ecfdf5', border: '1.5px solid #a7f3d0', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.9" strokeLinecap="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  Class Activity Generator
                  <UsageCounter ref={usageCounterRef} teacherId={teacherId} toolName="class-activity" />
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>Subject &rarr; Grade &rarr; Topic &rarr; Generate</div>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 14, scrollbarWidth: 'thin' }}>
            <div style={{ height: 8 }} />

            <div className="form-group">
              <label className="form-label">Subject <span style={{ color: '#ef4444' }}>*</span></label>
              <select className="form-select" value={form.subject} onChange={e => set('subject', e.target.value)}
                style={{ borderColor: errors.subject ? '#fca5a5' : 'var(--border)' }}>
                <option value="">-- Select Subject --</option>
                {subjects.map(s => <option key={s}>{s}</option>)}
              </select>
              {errors.subject && <div style={{ fontSize: '0.72rem', color: '#dc2626', marginTop: 4 }}>{errors.subject}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Grade Level <span style={{ color: '#ef4444' }}>*</span></label>
              <select className="form-select" value={form.grade_level} onChange={e => set('grade_level', e.target.value)}
                style={{ borderColor: errors.grade_level ? '#fca5a5' : 'var(--border)' }}>
                <option value="">-- Select Grade --</option>
                {grades.map(g => <option key={g}>{g}</option>)}
              </select>
              {errors.grade_level && <div style={{ fontSize: '0.72rem', color: '#dc2626', marginTop: 4 }}>{errors.grade_level}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Topic <span style={{ color: '#ef4444' }}>*</span></label>
              <textarea className="form-textarea" placeholder="e.g. Photosynthesis, Fractions, The Water Cycle..."
                value={form.topic} onChange={e => set('topic', e.target.value)}
                style={{ minHeight: 60, borderColor: errors.topic ? '#fca5a5' : 'var(--border)' }} />
              {errors.topic && <div style={{ fontSize: '0.72rem', color: '#dc2626', marginTop: 4 }}>{errors.topic}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Activity Type</label>
              <select className="form-select" value={form.activity_type} onChange={e => set('activity_type', e.target.value)}>
                {activityTypes.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Number of Activities</label>
                <select className="form-select" value={form.num_activities} onChange={e => set('num_activities', parseInt(e.target.value))}>
                  {[2, 3, 4, 5].map(n => <option key={n} value={n}>{n} activities</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Duration Each</label>
                <select className="form-select" value={form.duration} onChange={e => set('duration', e.target.value)}>
                  {durations.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Group Size</label>
              <select className="form-select" value={form.group_size} onChange={e => set('group_size', e.target.value)}>
                {groupSizes.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Learning Outcomes (optional)</label>
              <textarea className="form-textarea" placeholder="e.g. Students will be able to identify the stages of photosynthesis..."
                value={form.learning_outcomes} onChange={e => set('learning_outcomes', e.target.value)}
                style={{ minHeight: 55, maxHeight: 90 }} />
            </div>

            <div className="form-group">
              <label className="form-label">Upload Material (optional)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" disabled={materialUploading} onClick={() => materialFileRef.current?.click()}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8,
                    border: '1.5px solid #a7f3d0', background: '#ecfdf5',
                    color: '#059669', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                  {materialUploading ? 'Reading...' : 'Upload PDF / DOCX / TXT'}
                </button>
                {sourceMaterial && <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>{materialName}</span>}
                {sourceMaterial && <button type="button" onClick={() => { setSourceMaterial(''); setMaterialName('') }}
                  style={{ fontSize: '0.75rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Remove</button>}
              </div>
              <input ref={materialFileRef} type="file" accept=".pdf,.docx,.txt,.md" style={{ display: 'none' }} onChange={handleMaterialUpload} />
            </div>

            {errors.general && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: '0.82rem', color: '#dc2626', fontWeight: 500 }}>
                {errors.general}
              </div>
            )}

            <button className="btn btn-primary" onClick={generate} disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.95rem', marginTop: 4,
                background: 'linear-gradient(135deg,#059669,#047857)', boxShadow: '0 4px 14px rgba(5,150,105,0.35)' }}>
              {loading
                ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Generating...</>
                : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg> Generate Activities</>
              }
            </button>
            <div style={{ height: 4 }} />
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ height: PAGE_H, display: 'flex', flexDirection: 'column', overflow: 'auto' }} className="fade-up-1">
          <OutputBox result={result} loading={loading} toolName="class activities" onClear={clearResult}
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}
          />
        </div>
      </div>

      <ChatHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        teacherId={teacherId}
        onSelectChat={(chat) => {
          saveResult(chat.content || chat.preview)
          setShowHistory(false)
        }}
      />
    </div>
  )
}
