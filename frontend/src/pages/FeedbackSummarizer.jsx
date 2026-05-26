import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'

const API = window.location.hostname === 'localhost' ? 'http://localhost:8001' : window.location.origin
const STORAGE_KEY = 'classroom-result-feedback'

const FEEDBACK_TYPES = [
  { value: 'academic',     label: 'Academic Performance' },
  { value: 'behavior',     label: 'Classroom Behavior' },
  { value: 'participation',label: 'Participation' },
  { value: 'homework',     label: 'Homework & Assignments' },
  { value: 'project',      label: 'Project Work' },
  { value: 'teamwork',     label: 'Teamwork & Collaboration' },
  { value: 'creativity',   label: 'Creativity' },
  { value: 'leadership',   label: 'Leadership' },
]

const TONES = [
  { value: 'encouraging',  label: '🌟 Encouraging' },
  { value: 'constructive', label: '🛠️ Constructive' },
  { value: 'formal',       label: '🎓 Formal' },
  { value: 'warm',         label: '💝 Warm' },
  { value: 'professional', label: '💼 Professional' },
]

const GRADES = ['Kindergarten','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12']

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(star => (
        <button
          key={star} type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, fontSize: 22, lineHeight: 1, transition: 'transform 0.15s' }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.85)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <span style={{ color: star <= (hover || value) ? '#f59e0b' : '#e2e8f0' }}>★</span>
        </button>
      ))}
    </div>
  )
}

export default function FeedbackSummarizer() {
  const { user } = useAuth()
  const [studentName, setStudentName] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [feedbackType, setFeedbackType] = useState('academic')
  const [tone, setTone] = useState('encouraging')
  const [context, setContext] = useState('')
  const [ratings, setRatings] = useState({})
  const [result, setResult] = useState(() => {
    try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null } catch { return null }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const editorRef = useRef(null)

  useEffect(() => {
    if (result) localStorage.setItem(STORAGE_KEY, JSON.stringify(result))
  }, [result])

  const setRating = (k, v) => setRatings(r => ({ ...r, [k]: v }))
  const hasRatings = Object.keys(ratings).length > 0
  const avgRating = hasRatings
    ? (Object.values(ratings).reduce((a, b) => a + b, 0) / Object.values(ratings).length).toFixed(1)
    : null

  const handleGenerate = async (e) => {
    e?.preventDefault()
    setError('')
    if (!studentName.trim()) { setError('Student name is required.'); return }
    if (!gradeLevel) { setError('Please select a grade level.'); return }
    if (!hasRatings) { setError('Please rate at least one area before generating feedback.'); return }
    setLoading(true); setResult(null)
    try {
      const res = await fetch(`${API}/api/generate-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: studentName,
          grade_level: gradeLevel,
          feedback_type: feedbackType,
          tone,
          ratings,
          context,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Server error') }
      const data = await res.json()
      setResult({ ...data, _ratings: { ...ratings }, _student: studentName, _grade: gradeLevel })
    } catch (e) {
      setError(e.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!result) return
    const text = editorRef.current?.innerText || result.generated_feedback
    navigator.clipboard.writeText(text)
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  const handleReset = () => {
    setStudentName(''); setGradeLevel(''); setFeedbackType('academic'); setTone('encouraging')
    setContext(''); setRatings({}); setResult(null); setError('')
    localStorage.removeItem(STORAGE_KEY)
  }

  const handleDownload = () => {
    if (!result) return
    const r = result._ratings || {}
    const ratingRows = Object.entries(r).map(([k, v]) => {
      const label = FEEDBACK_TYPES.find(f => f.value === k)?.label || k
      const stars = '★'.repeat(v) + '☆'.repeat(5 - v)
      return `<tr><td style="padding:10px 14px;border:1px solid #e0f2fe;font-size:13px;">${label}</td><td style="padding:10px 14px;border:1px solid #e0f2fe;text-align:center;color:#f59e0b;font-size:18px;letter-spacing:2px;">${stars}</td><td style="padding:10px 14px;border:1px solid #e0f2fe;text-align:center;font-weight:600;font-size:13px;">${v}/5</td></tr>`
    }).join('')
    const avg = Object.values(r).length
      ? (Object.values(r).reduce((a, b) => a + b, 0) / Object.values(r).length).toFixed(1)
      : 'N/A'
    const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    const toneLabel = TONES.find(t => t.value === result.tone)?.label || result.tone
    const typeLabel = FEEDBACK_TYPES.find(t => t.value === result.feedback_type)?.label || result.feedback_type
    const feedbackHtml = editorRef.current?.innerHTML || result.generated_feedback.replace(/\n/g, '<br/>')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Report Card - ${result._student}</title>
<style>
  body{font-family:'Segoe UI',Arial,sans-serif;max-width:760px;margin:0 auto;padding:40px 30px;color:#0f172a;background:#fff;}
  .header{text-align:center;border-bottom:3px solid #4f46e5;padding-bottom:18px;margin-bottom:24px;}
  .title{font-size:26px;font-weight:800;color:#4f46e5;letter-spacing:-0.5px;}
  .meta-row{display:flex;gap:16px;background:#eef2ff;padding:16px 20px;border-radius:12px;margin-bottom:22px;}
  .meta-cell{flex:1;}
  .meta-label{font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;}
  .meta-value{font-size:18px;font-weight:700;margin-top:3px;color:#1a1a2e;}
  table{width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;margin-bottom:22px;}
  th{background:#4f46e5;color:#fff;padding:11px 14px;text-align:left;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;}
  .section-title{font-size:15px;font-weight:700;margin:0 0 10px;color:#1a1a2e;}
  .feedback-box{background:#f8fafc;border:1.5px solid #e0f2fe;border-radius:12px;padding:18px 22px;font-size:14px;line-height:1.8;color:#334155;}
  .footer{border-top:2px solid #e0f2fe;padding-top:14px;margin-top:24px;display:flex;justify-content:space-between;font-size:11px;color:#94a3b8;}
  @media print{body{padding:20px;}}
</style></head><body>
<div class="header">
  <div class="title">📋 Student Report Card</div>
  <div style="font-size:12px;color:#64748b;margin-top:6px;">Generated by ClassroomAI · ${date}</div>
</div>
<div class="meta-row">
  <div class="meta-cell"><div class="meta-label">Student</div><div class="meta-value">${result._student}</div></div>
  <div class="meta-cell"><div class="meta-label">Grade</div><div class="meta-value">${result._grade}</div></div>
  <div class="meta-cell"><div class="meta-label">Overall</div><div class="meta-value" style="color:#4f46e5;">${avg}/5</div></div>
</div>
<div class="section-title">⭐ Performance Ratings</div>
<table><thead><tr><th>Category</th><th style="text-align:center;">Rating</th><th style="text-align:center;">Score</th></tr></thead><tbody>${ratingRows}</tbody></table>
<div class="section-title">✍️ Teacher's Feedback <span style="font-size:11px;font-weight:400;color:#64748b;">· ${typeLabel} · ${toneLabel}</span></div>
<div class="feedback-box">${feedbackHtml}</div>
<div class="footer">
  <div>Teacher: ${user?.name || 'Teacher'}${user?.email ? ' · ' + user.email : ''}</div>
  <div>Powered by <strong style="color:#4f46e5;">ClassroomAI</strong> by CodeVidhya</div>
</div>
</body></html>`
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html); win.document.close()
    setTimeout(() => { win.focus(); win.print() }, 400)
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* HEADER */}
      <div className="fade-up" style={{
        background: 'linear-gradient(135deg, #be185d 0%, #db2777 50%, #f59e0b 100%)',
        borderRadius: 20, padding: '28px 32px', marginBottom: 24, color: '#fff',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -50, right: -50, width: 220, height: 220,
          borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.25)',
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>Feedback Writer</h1>
            <p style={{ fontSize: 13.5, margin: '4px 0 0', opacity: 0.92, fontWeight: 500 }}>
              Personalized student feedback in seconds — rate each area, pick a tone, download as a report card.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* LEFT - FORM */}
        <div style={{
          background: '#fff', borderRadius: 18, border: '1.5px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)', padding: 24,
        }}>
          <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="👤 Student Name" required>
              <input
                type="text" value={studentName} onChange={e => setStudentName(e.target.value)}
                placeholder="e.g. Arjun Sharma"
                style={inputStyle}
              />
            </Field>

            <Field label="🎓 Grade Level" required>
              <select value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} style={inputStyle}>
                <option value="">Select grade...</option>
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>

            <Field label="📋 Feedback Type" required>
              <select value={feedbackType} onChange={e => setFeedbackType(e.target.value)} style={inputStyle}>
                {FEEDBACK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>

            <Field label="⭐ Rate Each Area">
              <div style={{
                background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12,
                padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                {FEEDBACK_TYPES.map(ft => (
                  <div key={ft.value} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{ft.label}</span>
                    <StarRating value={ratings[ft.value] || 0} onChange={v => setRating(ft.value, v)} />
                  </div>
                ))}
              </div>
            </Field>

            <Field label="💖 Tone">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {TONES.map(t => (
                  <button
                    key={t.value} type="button"
                    onClick={() => setTone(t.value)}
                    style={{
                      padding: '7px 14px', borderRadius: 100, fontSize: 12.5, fontWeight: 600,
                      border: '1.5px solid',
                      borderColor: tone === t.value ? '#4f46e5' : '#e2e8f0',
                      background: tone === t.value ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : '#fff',
                      color: tone === t.value ? '#fff' : '#475569',
                      cursor: 'pointer', transition: 'all 0.2s',
                      boxShadow: tone === t.value ? '0 4px 12px rgba(79,70,229,0.25)' : 'none',
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="✨ Extra Insight (optional)">
              <textarea
                value={context} onChange={e => setContext(e.target.value)}
                placeholder="Any specific observations? e.g. 'Led the science project brilliantly but struggles with time management'"
                maxLength={500}
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }}
              />
              <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'right', marginTop: 4 }}>{context.length}/500</div>
            </Field>

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: '#fef2f2', color: '#dc2626', fontSize: 13, fontWeight: 600,
                border: '1.5px solid #fecaca',
              }}>⚠️ {error}</div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="submit"
                disabled={loading || !hasRatings}
                style={{
                  flex: 1, padding: '13px 20px', borderRadius: 12, border: 'none',
                  background: loading || !hasRatings ? '#cbd5e1' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  color: '#fff', fontSize: 14, fontWeight: 800,
                  cursor: loading || !hasRatings ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(79,70,229,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                {loading ? (
                  <>
                    <div style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.3)', borderTop: '2.5px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Generating...
                  </>
                ) : (hasRatings ? '✨ Generate Feedback' : 'Rate Areas First')}
              </button>
              {result && (
                <button type="button" onClick={handleReset} style={{
                  padding: '13px 18px', borderRadius: 12, border: '1.5px solid #e2e8f0',
                  background: '#fff', color: '#475569', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}>🔄 Reset</button>
              )}
            </div>
          </form>
        </div>

        {/* RIGHT - OUTPUT */}
        <div style={{
          background: '#fff', borderRadius: 18, border: '1.5px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)', padding: 24,
          display: 'flex', flexDirection: 'column', minHeight: 400,
        }}>
          {loading ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              <div style={{ width: 56, height: 56, border: '4px solid #e2e8f0', borderTop: '4px solid #4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>Generating personalized feedback...</p>
            </div>
          ) : result ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>Generated Feedback</h3>
                <span style={{
                  padding: '4px 11px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                  background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe',
                }}>{FEEDBACK_TYPES.find(t => t.value === result.feedback_type)?.label}</span>
                <span style={{
                  padding: '4px 11px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                  background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0',
                }}>{TONES.find(t => t.value === result.tone)?.label}</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                  <button type="button" onClick={() => setEditing(v => !v)} style={smallBtn}>
                    {editing ? '✓ Done' : '✏️ Edit'}
                  </button>
                  <button type="button" onClick={handleCopy} style={smallBtn}>
                    {copied ? '✓ Copied' : '📋 Copy'}
                  </button>
                </div>
              </div>

              <div
                ref={editorRef}
                contentEditable={editing}
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: result.generated_feedback.replace(/\n/g, '<br/>') }}
                style={{
                  background: '#f8fafc', border: editing ? '2px solid #4f46e5' : '1.5px solid #e2e8f0',
                  borderRadius: 14, padding: '16px 20px', fontSize: 14, lineHeight: 1.8,
                  color: '#334155', minHeight: 180, outline: 'none',
                  transition: 'border-color 0.2s', whiteSpace: editing ? 'normal' : 'pre-wrap',
                }}
              />

              {/* Report Card Summary */}
              <div style={{
                background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                borderRadius: 14, padding: 16, border: '1.5px solid #fde68a',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#92400e' }}>📋 Report Card Summary</div>
                  <button type="button" onClick={handleDownload} style={{
                    padding: '7px 14px', borderRadius: 10, border: 'none',
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(79,70,229,0.25)',
                  }}>⬇ Download Report</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Student</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>{result._student}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Grade</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>{result._grade}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Overall</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#4f46e5' }}>
                      {Object.values(result._ratings || {}).length
                        ? (Object.values(result._ratings).reduce((a, b) => a + b, 0) / Object.values(result._ratings).length).toFixed(1) + '/5'
                        : 'N/A'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {Object.entries(result._ratings || {}).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#1a1a2e' }}>
                      <span style={{ fontWeight: 500 }}>{FEEDBACK_TYPES.find(f => f.value === k)?.label || k}</span>
                      <span style={{ letterSpacing: 1, color: '#f59e0b' }}>{'★'.repeat(v)}{'☆'.repeat(5 - v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 20 }}>
              <div style={{
                width: 72, height: 72, borderRadius: 20, background: '#fef3c7',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, marginBottom: 16,
              }}>✍️</div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#1a1a2e', margin: '0 0 6px' }}>Ready to Generate</h3>
              <p style={{ fontSize: 13.5, color: '#64748b', maxWidth: 300, lineHeight: 1.6, margin: 0 }}>
                Fill in the form, rate each area, and click generate to create personalized student feedback.
              </p>
              <div style={{ display: 'flex', gap: 6, marginTop: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
                {['⚡ <30s', '🎯 Personalized', '📋 Report card'].map(h => (
                  <span key={h} style={{
                    fontSize: 11, padding: '5px 11px', borderRadius: 100,
                    background: '#fef3c7', color: '#92400e', fontWeight: 600,
                  }}>{h}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 7,
      }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1.5px solid #e2e8f0', background: '#f8fafc',
  fontSize: 14, fontFamily: 'inherit', color: '#1a1a2e',
  outline: 'none', transition: 'all 0.2s',
  boxSizing: 'border-box',
}

const smallBtn = {
  padding: '6px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0',
  background: '#fff', color: '#475569', fontSize: 12, fontWeight: 700, cursor: 'pointer',
}
