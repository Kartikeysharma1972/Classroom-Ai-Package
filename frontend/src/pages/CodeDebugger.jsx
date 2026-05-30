import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const API = window.location.hostname === 'localhost' ? 'http://localhost:8001' : window.location.origin

// Wipe any legacy persisted result so the debugger always opens fresh.
// (Previously we persisted to localStorage; the user wants a clean slate per session.)
try { localStorage.removeItem('classroom-result-debugger') } catch {}

const LANGUAGES = [
  'auto-detect', 'Python', 'JavaScript', 'TypeScript',
  'JavaScript (React)', 'TypeScript (React)', 'Java', 'C++', 'C',
  'C#', 'Go', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Rust',
  'HTML', 'CSS', 'SQL', 'Shell/Bash',
]

const SAMPLE_CODE = `# Try this buggy sample
def calculate_average(numbers)
  total = 0
  for num in numbers
    total = total + num
  average = total / len(numbers)
  return average

print(calculate_average([10, 20, 30, 40))`

const EXT_MAP = {
  Python:'py', JavaScript:'js', TypeScript:'ts',
  'JavaScript (React)':'jsx', 'TypeScript (React)':'tsx',
  Java:'java', 'C++':'cpp', C:'c', 'C#':'cs', Go:'go',
  Ruby:'rb', PHP:'php', Swift:'swift', Kotlin:'kt', Rust:'rs',
  HTML:'html', CSS:'css', SQL:'sql', 'Shell/Bash':'sh',
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      style={{
        padding: '6px 14px', borderRadius: 8,
        border: '1.5px solid #c7d2fe', background: copied ? '#10b981' : '#eef2ff',
        color: copied ? '#fff' : '#4f46e5', fontWeight: 700, fontSize: 12, cursor: 'pointer',
      }}>
      {copied ? '✓ Copied' : '📋 Copy'}
    </button>
  )
}

function LearningStep({ index, error, fix }) {
  const [open, setOpen] = useState(true)
  return (
    <div style={{
      background: '#fff', border: '1.5px solid #e0e7ff', borderRadius: 14,
      marginBottom: 12, overflow: 'hidden',
    }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 18px', background: '#eef2ff', border: 'none', cursor: 'pointer',
        }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 14, flexShrink: 0,
        }}>{index + 1}</div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Bug #{index + 1}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e', marginTop: 2 }}>{error}</div>
        </div>
        <span style={{ fontSize: 16, color: '#4f46e5', transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s' }}>▾</span>
      </button>
      {open && (
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{
              display: 'inline-block', fontSize: 10, fontWeight: 800, color: '#dc2626',
              background: '#fef2f2', padding: '3px 10px', borderRadius: 100, marginBottom: 6,
            }}>🐛 WHAT WENT WRONG</div>
            <p style={{ fontSize: 13.5, lineHeight: 1.7, color: '#475569', margin: 0 }}>{error}</p>
          </div>
          <div>
            <div style={{
              display: 'inline-block', fontSize: 10, fontWeight: 800, color: '#059669',
              background: '#ecfdf5', padding: '3px 10px', borderRadius: 100, marginBottom: 6,
            }}>🛠️ HOW IT WAS FIXED</div>
            <p style={{ fontSize: 13.5, lineHeight: 1.7, color: '#475569', margin: 0 }}>{fix}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Floating CS Tutor — CodeVidhya branded, CS-only ──────────────────────────
function CSTutorFab() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "👋 Hi! I'm your CS Tutor. How can I help you today?" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [voiceErr, setVoiceErr] = useState('')
  const bottomRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => { if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, open])

  const send = async (text) => {
    const t = (text || input).trim()
    if (!t || loading) return
    setInput('')
    const next = [...messages, { role: 'user', content: t }]
    setMessages(next)
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/cs-tutor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.map(m => ({ role: m.role, content: m.content })) }),
      })
      if (!res.ok) throw new Error('Tutor error')
      const data = await res.json()
      setMessages(p => [...p, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages(p => [...p, { role: 'assistant', content: "❌ I couldn't reach the tutor service. Please try again." }])
    } finally {
      setLoading(false)
    }
  }

  const handleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setVoiceErr('Voice input is not supported in this browser. Use Chrome / Edge.')
      setTimeout(() => setVoiceErr(''), 3500)
      return
    }
    if (listening) {
      try { recognitionRef.current?.stop() } catch {}
      setListening(false)
      return
    }
    const rec = new SR()
    recognitionRef.current = rec
    rec.continuous = false
    rec.interimResults = true
    rec.lang = 'en-US'
    rec.onstart = () => { setListening(true); setVoiceErr('') }
    rec.onresult = (e) => {
      let transcript = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript
      }
      setInput(transcript)
      if (e.results[e.results.length - 1].isFinal) {
        setListening(false)
        if (transcript.trim()) send(transcript)
      }
    }
    rec.onerror = (ev) => {
      setListening(false)
      const msg = ev.error === 'not-allowed'
        ? 'Microphone permission denied.'
        : ev.error === 'no-speech'
          ? 'Did not catch that — please try again.'
          : `Voice error: ${ev.error}`
      setVoiceErr(msg)
      setTimeout(() => setVoiceErr(''), 3500)
    }
    rec.onend = () => setListening(false)
    try { rec.start() } catch (e) {
      setListening(false)
      setVoiceErr('Could not start microphone. Try again.')
      setTimeout(() => setVoiceErr(''), 3000)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 999,
          width: open ? 48 : 'auto', height: 56, padding: open ? 0 : '0 18px 0 14px',
          borderRadius: open ? '50%' : 100, border: 'none',
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(79,70,229,0.4)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
        {open ? '✕' : (
          <>
            <img src="/codevidhya_logo.jfif" alt="" style={{ width: 32, height: 32, borderRadius: '50%', background: '#fff', padding: 2 }} />
            CS Tutor
          </>
        )}
      </button>

      {open && (
        <div style={{
          position: 'fixed', bottom: 92, right: 24, zIndex: 999,
          width: 380, maxWidth: 'calc(100vw - 32px)', height: 560, maxHeight: 'calc(100vh - 120px)',
          background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 18,
          boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 16px', background: 'linear-gradient(135deg, #0f172a, #4f46e5)',
            color: '#fff',
          }}>
            <img src="/codevidhya_logo.jfif" alt="CodeVidhya" style={{
              width: 36, height: 36, borderRadius: 10, background: '#fff', padding: 3,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>CS Tutor</div>
              <div style={{ fontSize: 11, opacity: 0.85 }}>by CodeVidhya</div>
            </div>
            <button onClick={() => setOpen(false)} style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
              width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontSize: 14,
            }}>✕</button>
          </div>

          <div style={{
            flex: 1, overflowY: 'auto', padding: '14px 14px 4px',
            background: 'linear-gradient(180deg, #f8fafc, #fff)',
          }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 10,
              }}>
                <div style={{
                  maxWidth: '82%', padding: '9px 13px', borderRadius: 14,
                  background: m.role === 'user' ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : '#fff',
                  color: m.role === 'user' ? '#fff' : '#1a1a2e',
                  fontSize: 13.5, lineHeight: 1.55,
                  border: m.role === 'user' ? 'none' : '1.5px solid #e2e8f0',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>{m.content}</div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
                <div style={{
                  padding: '10px 14px', borderRadius: 14,
                  background: '#fff', border: '1.5px solid #e2e8f0',
                  display: 'flex', gap: 4,
                }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{
                      width: 7, height: 7, borderRadius: '50%', background: '#4f46e5',
                      animation: `bounce 1.2s ${i * 0.15}s infinite ease-in-out`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {voiceErr && (
            <div style={{
              padding: '8px 14px', background: '#fef2f2', color: '#dc2626',
              fontSize: 12, fontWeight: 600, borderTop: '1.5px solid #fecaca',
            }}>⚠️ {voiceErr}</div>
          )}
          {listening && (
            <div style={{
              padding: '8px 14px', background: '#fef3c7', color: '#92400e',
              fontSize: 12, fontWeight: 700, borderTop: '1.5px solid #fde68a',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%', background: '#dc2626',
                animation: 'pulse 1s ease-in-out infinite',
              }} />
              🎙️ Listening — speak now...
            </div>
          )}
          <div style={{
            display: 'flex', gap: 8, padding: 12, borderTop: '1.5px solid #f1f5f9', background: '#fff',
          }}>
            <button
              type="button"
              onClick={handleVoice}
              disabled={loading}
              title={listening ? 'Stop listening' : 'Speak your question'}
              style={{
                width: 42, padding: 0, borderRadius: 10,
                border: listening ? 'none' : '1.5px solid #e2e8f0',
                background: listening ? 'linear-gradient(135deg, #ef4444, #dc2626)' : '#fff',
                color: listening ? '#fff' : '#4f46e5',
                fontSize: 16, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{listening ? '⏹' : '🎙️'}</button>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && send()}
              placeholder={listening ? 'Listening...' : 'Ask anything about CS...'}
              disabled={loading}
              style={{
                flex: 1, padding: '10px 12px', border: '1.5px solid #e2e8f0',
                borderRadius: 10, fontSize: 13.5, outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => send()}
              disabled={loading || !input.trim()}
              style={{
                padding: '0 14px', borderRadius: 10, border: 'none',
                background: loading || !input.trim() ? '#cbd5e1' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                color: '#fff', fontWeight: 800, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              }}>➤</button>
          </div>
        </div>
      )}
    </>
  )
}

export default function CodeDebugger() {
  const { user } = useAuth()
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('auto-detect')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState('learn')
  const textareaRef = useRef(null)

  // New feature state
  const [runOutput, setRunOutput] = useState(null)
  const [runLoading, setRunLoading] = useState(false)
  const [simpleExp, setSimpleExp] = useState('')
  const [simpleLoading, setSimpleLoading] = useState(false)
  const [fixApplied, setFixApplied] = useState(false)
  const fileInputRef = useRef(null)

  const EXT_TO_LANG = {
    py: 'Python', js: 'JavaScript', ts: 'TypeScript', jsx: 'JavaScript (React)',
    tsx: 'TypeScript (React)', java: 'Java', cpp: 'C++', cc: 'C++', cxx: 'C++',
    c: 'C', h: 'C', cs: 'C#', go: 'Go', rb: 'Ruby', php: 'PHP', swift: 'Swift',
    kt: 'Kotlin', rs: 'Rust', html: 'HTML', htm: 'HTML', css: 'CSS', sql: 'SQL',
    sh: 'Shell/Bash', bash: 'Shell/Bash',
  }

  const handleUploadFile = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 200 * 1024) {
      setError(`File too large (${(file.size / 1024).toFixed(0)} KB). Max 200 KB.`)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result || '')
      setCode(text)
      setError('')
      setResult(null)
      setRunOutput(null)
      setSimpleExp('')
      setFixApplied(false)
      const ext = (file.name.split('.').pop() || '').toLowerCase()
      const detected = EXT_TO_LANG[ext]
      if (detected) setLanguage(detected)
    }
    reader.onerror = () => setError('Could not read the file. Try a plain text/code file.')
    reader.readAsText(file)
  }

  const handleRun = async () => {
    if (!code?.trim()) { setError('Please paste some code first.'); return }
    setError(''); setRunLoading(true); setRunOutput(null)
    try {
      const res = await fetch(`${API}/api/run-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: result?.language || language }),
      })
      const data = await res.json()
      setRunOutput(data)
    } catch {
      setRunOutput({ output: '', error: 'Could not reach server', exit_code: -1, language })
    } finally {
      setRunLoading(false)
    }
  }

  const handleDebug = async () => {
    if (!code.trim()) { setError('Please paste some code first.'); return }
    setError(''); setResult(null); setSimpleExp(''); setFixApplied(false); setLoading(true); setViewMode('learn')
    try {
      const res = await fetch(`${API}/api/debug-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Server error') }
      const data = await res.json()
      data.original_code = code
      setResult(data)
    } catch (e) {
      setError(e.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const handleExplainSimple = async () => {
    if (!result?.errors_found?.length) return
    setSimpleLoading(true); setSimpleExp('')
    try {
      const res = await fetch(`${API}/api/explain-simple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errors: result.errors_found,
          fixes: result.fixes_applied,
          language: result.language,
        }),
      })
      const data = await res.json()
      setSimpleExp(data.explanation || '')
    } catch {
      setSimpleExp('Could not generate simple explanation. Please try again.')
    } finally {
      setSimpleLoading(false)
    }
  }

  const handleDownloadReport = () => {
    if (!result) return
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const errorsHtml = result.errors_found?.length
      ? result.errors_found.map((e, i) => `<li>${esc(e)}</li>`).join('')
      : '<li>No bugs found.</li>'
    const fixesHtml = result.fixes_applied?.length
      ? result.fixes_applied.map(f => `<li>${esc(f)}</li>`).join('')
      : '<li>No fixes needed.</li>'
    const runSection = runOutput ? `
      <h2>▶ Run Output</h2>
      <div class="meta"><strong>Language:</strong> ${esc(runOutput.language)} ${runOutput.simulated ? '(AI Simulated)' : ''} &nbsp;&nbsp; <strong>Exit code:</strong> ${runOutput.exit_code}</div>
      <pre>${esc(runOutput.output || runOutput.error || '(no output)')}</pre>` : ''

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Debug Report — ${esc(date)}</title>
<style>
  body{font-family:'Segoe UI',Arial,sans-serif;max-width:900px;margin:0 auto;padding:40px;color:#1a1a2e;position:relative}
  .watermark{position:fixed;bottom:30px;right:30px;opacity:0.08;pointer-events:none;z-index:0}
  .watermark img{width:200px;height:200px;object-fit:contain}
  .brand-bar{display:flex;align-items:center;gap:14px;padding-bottom:18px;border-bottom:3px solid #4f46e5;margin-bottom:24px}
  .brand-bar img{width:54px;height:54px;border-radius:12px;background:#fff;padding:4px;border:1.5px solid #c7d2fe}
  .brand-bar .brand-text{line-height:1.2}
  .brand-bar .brand-name{font-size:22px;font-weight:800;color:#4f46e5;letter-spacing:-0.5px}
  .brand-bar .brand-sub{font-size:12px;color:#64748b;margin-top:2px;font-weight:600}
  h1{color:#1a1a2e;margin:0 0 8px;font-size:24px;letter-spacing:-0.5px}
  h2{color:#1e40af;margin-top:28px;font-size:17px;border-left:4px solid #4f46e5;padding-left:10px}
  pre{background:#f1f5f9;padding:16px;border-radius:8px;font-size:12.5px;white-space:pre-wrap;word-break:break-all;border:1.5px solid #e2e8f0;font-family:'Consolas','Monaco',monospace;line-height:1.6}
  ul{padding-left:20px}li{margin:6px 0;line-height:1.6;font-size:14px}
  .meta{background:#eff6ff;padding:12px 16px;border-radius:8px;margin:14px 0;font-size:13.5px;color:#1e293b}
  .footer{margin-top:40px;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:14px;text-align:center;line-height:1.6}
  .footer img{width:22px;height:22px;border-radius:5px;background:#fff;vertical-align:middle;margin-right:6px}
  @media print{body{padding:24px}.watermark{position:absolute;opacity:0.06}}
</style></head><body>
<div class="watermark"><img src="/codevidhya_logo.jfif" alt=""></div>
<div class="brand-bar">
  <img src="/codevidhya_logo.jfif" alt="CodeVidhya">
  <div class="brand-text">
    <div class="brand-name">CodeVidhya</div>
    <div class="brand-sub">ClassroomAI · Code Debugger</div>
  </div>
</div>
<h1>🔮 Code Debugging Report</h1>
<div class="meta"><strong>Date:</strong> ${esc(date)} at ${esc(time)} &nbsp;&nbsp; <strong>Language:</strong> ${esc(result.language)} &nbsp;&nbsp; <strong>Bugs Found:</strong> ${result.errors_found?.length || 0}</div>

<h2>📋 Original Code</h2>
<pre>${esc(result.original_code || '')}</pre>

<h2>🐛 Bugs Found</h2>
<ul>${errorsHtml}</ul>

<h2>🛠️ Fixes Applied</h2>
<ul>${fixesHtml}</ul>

<h2>✅ Fixed Code</h2>
<pre>${esc(result.debugged_code || '')}</pre>

<h2>💡 Explanation</h2>
<p style="line-height:1.8;font-size:14px;background:#f5f3ff;padding:14px 18px;border-radius:8px;border-left:4px solid #7c3aed">${esc(result.explanation || '').replace(/\n/g, '<br>')}</p>

${simpleExp ? `<h2>🧒 Simple Explanation</h2><p style="line-height:1.8;font-size:14px;background:#fff7ed;padding:14px 18px;border-radius:8px;border-left:4px solid #f59e0b">${esc(simpleExp).replace(/\n/g, '<br>')}</p>` : ''}

${runSection}

<div class="footer">
  <img src="/codevidhya_logo.jfif" alt="CodeVidhya">
  Generated by <strong>CodeVidhya ClassroomAI</strong> · Code Debugger
</div>
</body></html>`
    const win = window.open('', '_blank')
    if (!win) { setError('Pop-up blocked. Please allow pop-ups to download the report.'); return }
    win.document.write(html)
    win.document.close()
    setTimeout(() => { win.focus(); win.print() }, 400)
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) { setCode(text); setError(''); setResult(null); setRunOutput(null) }
    } catch {
      textareaRef.current?.focus()
      setError('Press Ctrl+V in the code area to paste.')
    }
  }

  const handleClear = () => {
    setCode(''); setResult(null); setError(''); setRunOutput(null); setSimpleExp(''); setFixApplied(false)
  }

  const handleSample = () => {
    setCode(SAMPLE_CODE); setLanguage('Python')
    setResult(null); setError(''); setRunOutput(null); setSimpleExp(''); setFixApplied(false)
  }

  const handleApplyFix = () => {
    if (!result?.debugged_code) return
    setCode(result.debugged_code)
    setFixApplied(true)
    setViewMode('fixed')
    setRunOutput(null)
  }

  const errorCount = result?.errors_found?.length || 0
  const hasErrors = errorCount > 0

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
      {/* Subtle watermark */}
      <div style={{
        position: 'fixed', bottom: 18, left: 18, opacity: 0.06,
        pointerEvents: 'none', zIndex: 0,
      }}>
        <img src="/codevidhya_logo.jfif" alt="" style={{ width: 140, height: 140, objectFit: 'contain' }} />
      </div>

      {/* HEADER */}
      <div className="fade-up" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #4f46e5 100%)',
        borderRadius: 20, padding: '28px 32px', marginBottom: 24, color: '#fff',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -50, right: -50, width: 220, height: 220,
          borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: '#fff', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.2)', overflow: 'hidden',
          }}>
            <img src="/codevidhya_logo.jfif" alt="CodeVidhya"
              style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>Code Debugger</h1>
            <p style={{ fontSize: 13.5, margin: '4px 0 0', opacity: 0.85, fontWeight: 500 }}>
              Run code first — if it works, no fix needed. Otherwise, AI finds bugs, explains, and teaches the fix.
            </p>
          </div>
          {hasErrors && (
            <div style={{
              marginLeft: 'auto', padding: '8px 16px', borderRadius: 100,
              background: '#ef4444', fontSize: 12, fontWeight: 800,
            }}>🐛 {errorCount} bug{errorCount !== 1 ? 's' : ''} found</div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, position: 'relative', zIndex: 1 }}>
        {/* LEFT - INPUT */}
        <div style={{
          background: '#fff', borderRadius: 18, border: '1.5px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1.5px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a2e' }}>📝 Your Code</div>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              style={{
                marginLeft: 'auto', padding: '6px 12px', borderRadius: 8,
                border: '1.5px solid #e2e8f0', background: '#f8fafc',
                fontSize: 13, fontWeight: 600, color: '#1a1a2e', cursor: 'pointer',
              }}>
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div style={{ padding: '12px 16px', display: 'flex', gap: 8, borderBottom: '1.5px solid #f1f5f9', flexWrap: 'wrap' }}>
            <button type="button" onClick={handlePaste} style={btnPrimary}>📋 Paste</button>
            <button type="button" onClick={handleUploadFile} style={btnPrimary}>📂 Upload File</button>
            <button type="button" onClick={handleSample} style={btnGhost}>✨ Sample</button>
            {code && <button type="button" onClick={handleClear} style={btnGhost}>🗑 Clear</button>}
            <input
              ref={fileInputRef}
              type="file"
              accept=".py,.js,.ts,.jsx,.tsx,.java,.cpp,.cc,.cxx,.c,.h,.cs,.go,.rb,.php,.swift,.kt,.rs,.html,.htm,.css,.sql,.sh,.bash,.txt"
              onChange={handleFileSelected}
              style={{ display: 'none' }}
            />
          </div>

          <textarea
            ref={textareaRef}
            value={code}
            onChange={e => { setCode(e.target.value); setError('') }}
            placeholder={'# Paste your code here\n# Or click Sample to try a buggy example\n# Supports Python, JS, Java, C++, and more'}
            spellCheck={false}
            style={{
              flex: 1, minHeight: 340, padding: 18, border: 'none', outline: 'none',
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 13.5,
              lineHeight: 1.6, color: '#1a1a2e', background: '#fafafa', resize: 'none',
            }}
          />

          <div style={{ padding: '14px 18px', borderTop: '1.5px solid #f1f5f9', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleRun}
              disabled={runLoading || (!code.trim() && !result)}
              style={{
                flex: '1 1 140px', padding: '12px 18px', borderRadius: 12, border: 'none',
                background: runLoading || (!code.trim() && !result) ? '#cbd5e1' : 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff', fontSize: 14, fontWeight: 800,
                cursor: runLoading || (!code.trim() && !result) ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(16,185,129,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
              {runLoading ? (
                <>
                  <div style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.3)', borderTop: '2.5px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Running...
                </>
              ) : '▶ Run Code'}
            </button>
            <button
              type="button"
              onClick={handleDebug}
              disabled={loading || !code.trim()}
              style={{
                flex: '1 1 140px', padding: '12px 18px', borderRadius: 12, border: 'none',
                background: loading || !code.trim() ? '#cbd5e1' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                color: '#fff', fontSize: 14, fontWeight: 800,
                cursor: loading || !code.trim() ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(79,70,229,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
              {loading ? (
                <>
                  <div style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.3)', borderTop: '2.5px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Analyzing...
                </>
              ) : '🔮 Fix My Code'}
            </button>
          </div>

          {error && (
            <div style={{
              margin: '0 18px 16px', padding: '10px 14px', borderRadius: 10,
              background: '#fef2f2', color: '#dc2626', fontSize: 13, fontWeight: 600,
              border: '1.5px solid #fecaca',
            }}>⚠️ {error}</div>
          )}

          {runOutput && (
            <div style={{ margin: '0 18px 16px', borderRadius: 10, overflow: 'hidden', border: '1.5px solid #e2e8f0' }}>
              <div style={{
                background: runOutput.exit_code === 0 ? '#064e3b' : '#7f1d1d',
                padding: '8px 14px', fontSize: 12, fontWeight: 700, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span>
                  {runOutput.exit_code === 0 ? '✅ Output' : '❌ Error'}
                  {' — '}{runOutput.language}
                  {runOutput.simulated ? ' (AI Simulated)' : ''}
                </span>
                <button onClick={() => setRunOutput(null)} style={{
                  background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14,
                }}>✕</button>
              </div>
              <pre style={{
                margin: 0, padding: '12px 14px', fontSize: 12.5, lineHeight: 1.6,
                background: '#0f172a', color: '#e2e8f0',
                maxHeight: 180, overflow: 'auto',
                whiteSpace: 'pre-wrap', wordBreak: 'break-all',
              }}>{runOutput.output || runOutput.error || '(no output)'}</pre>
              {runOutput.exit_code === 0 && !runOutput.error ? (
                <div style={{
                  background: '#ecfdf5', padding: '8px 14px', fontSize: 12, color: '#059669',
                  fontWeight: 600, borderTop: '1.5px solid #a7f3d0',
                }}>
                  ✨ Code ran successfully — no fix needed! Use “Fix My Code” only if behaviour is wrong.
                </div>
              ) : (
                <div style={{
                  background: '#fef2f2', padding: '8px 14px', fontSize: 12, color: '#dc2626',
                  fontWeight: 600, borderTop: '1.5px solid #fecaca',
                }}>
                  ⚠️ Your code has errors and cannot run — click <b>🔮 Fix My Code</b> to see the bugs and the corrected version.
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT - OUTPUT */}
        <div style={{
          background: '#fff', borderRadius: 18, border: '1.5px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column',
          overflow: 'hidden', maxHeight: 'calc(100vh - 220px)',
        }}>
          <div style={{ padding: '14px 20px', borderBottom: '1.5px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a2e' }}>🧠 AI Analysis</div>
            {result && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, background: '#f1f5f9', padding: 3, borderRadius: 10 }}>
                <button type="button" onClick={() => setViewMode('learn')} style={tabBtn(viewMode === 'learn')}>📚 Learn</button>
                <button type="button" onClick={() => setViewMode('fixed')} style={tabBtn(viewMode === 'fixed')}>✅ Fixed</button>
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            {!result && !loading && (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: 56, marginBottom: 14 }}>🤖</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#1a1a2e', marginBottom: 6 }}>Ready to debug your code!</div>
                <div style={{ fontSize: 13.5, color: '#64748b', marginBottom: 24 }}>
                  Tip: Click <b>▶ Run Code</b> first. If it works, you're done. If not, click <b>🔮 Fix My Code</b>.
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {['▶ Run before you fix', '🐛 Finds syntax errors', '🧠 Explains each fix', '🧒 Simple explanation', '📄 Download report'].map(h => (
                    <span key={h} style={{
                      fontSize: 11.5, padding: '6px 12px', borderRadius: 100,
                      background: '#eef2ff', color: '#4f46e5', fontWeight: 600,
                      border: '1px solid #c7d2fe',
                    }}>{h}</span>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', background: '#eef2ff',
                  margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, animation: 'pulse 1.5s ease-in-out infinite',
                }}>🔍</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 16 }}>Analyzing your code...</div>
                {['Reading your code', 'Scanning for bugs', 'Applying fixes', 'Validating output'].map((s, i) => (
                  <div key={i} style={{ fontSize: 13, color: '#64748b', padding: '4px 0' }}>
                    <span style={{
                      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                      background: '#4f46e5', marginRight: 8, opacity: 0.5 + i * 0.15,
                    }} /> {s}
                  </div>
                ))}
              </div>
            )}

            {result && (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '5px 12px', borderRadius: 100, fontSize: 12, fontWeight: 700,
                    background: hasErrors ? '#fef2f2' : '#ecfdf5',
                    color: hasErrors ? '#dc2626' : '#059669',
                    border: `1px solid ${hasErrors ? '#fecaca' : '#a7f3d0'}`,
                  }}>
                    {hasErrors ? `🐛 ${errorCount} bug${errorCount !== 1 ? 's' : ''} fixed` : '✅ No bugs found'}
                  </span>
                  <span style={{
                    padding: '5px 12px', borderRadius: 100, fontSize: 12, fontWeight: 700,
                    background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe',
                  }}>💻 {result.language}</span>
                  <button
                    type="button"
                    onClick={handleApplyFix}
                    style={{
                      padding: '5px 14px', borderRadius: 100,
                      border: '1.5px solid #10b981', background: '#ecfdf5', color: '#059669',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    }}>✏️ Apply Fix</button>
                  {hasErrors && (
                    <button
                      type="button"
                      onClick={handleExplainSimple}
                      disabled={simpleLoading}
                      style={{
                        padding: '5px 14px', borderRadius: 100,
                        border: '1.5px solid #c4b5fd', background: '#f5f3ff', color: '#6d28d9',
                        fontSize: 12, fontWeight: 700, cursor: simpleLoading ? 'wait' : 'pointer',
                      }}>{simpleLoading ? '⏳ Generating…' : '🧒 Simple Explanation'}</button>
                  )}
                  <button
                    type="button"
                    onClick={handleDownloadReport}
                    style={{
                      marginLeft: 'auto', padding: '5px 14px', borderRadius: 100,
                      border: '1.5px solid #fdba74', background: '#fff7ed', color: '#c2410c',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    }}>📄 Download Report</button>
                </div>

                {simpleExp && (
                  <div style={{
                    background: 'linear-gradient(135deg, #fff7ed, #fef3c7)',
                    border: '1.5px solid #fdba74', borderRadius: 14,
                    padding: '14px 18px', marginBottom: 18, position: 'relative',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                        🧒 Simple Explanation
                      </div>
                      <button onClick={() => setSimpleExp('')} style={{
                        marginLeft: 'auto', background: 'none', border: 'none',
                        cursor: 'pointer', color: '#c2410c', fontSize: 16, fontWeight: 800,
                      }}>✕</button>
                    </div>
                    <p style={{ fontSize: 13.5, lineHeight: 1.7, color: '#7c2d12', margin: 0, whiteSpace: 'pre-wrap' }}>{simpleExp}</p>
                  </div>
                )}

                {fixApplied && hasErrors && (
                  <div style={{
                    background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
                    border: '1.5px solid #6ee7b7', borderRadius: 12,
                    padding: '10px 14px', marginBottom: 14,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{ fontSize: 18 }}>✅</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#065f46' }}>
                      Fix applied — your editor now contains the corrected code. Click <b>▶ Run Code</b> to verify.
                    </span>
                  </div>
                )}

                {viewMode === 'learn' && hasErrors && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a2e', marginBottom: 12 }}>
                      📚 Step-by-Step Error Correction
                    </div>
                    {result.errors_found.map((err, i) => (
                      <LearningStep
                        key={i} index={i} error={err}
                        fix={result.fixes_applied?.[i] || 'Fix applied automatically.'}
                      />
                    ))}
                  </div>
                )}

                {(viewMode === 'fixed' || !hasErrors) && (
                  <div>
                    {hasErrors && (
                      <div style={{
                        background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14,
                        padding: 16, marginBottom: 14,
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a2e', marginBottom: 10 }}>
                          🛠️ Summary of {errorCount} Fix{errorCount !== 1 ? 'es' : ''}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <div>
                            <div style={{
                              fontSize: 10, fontWeight: 800, color: '#dc2626',
                              background: '#fef2f2', padding: '3px 8px', borderRadius: 100,
                              display: 'inline-block', marginBottom: 8, letterSpacing: '0.6px',
                            }}>🐛 BUGS FOUND</div>
                            {result.errors_found.map((e, i) => (
                              <div key={i} style={{
                                display: 'flex', gap: 8, padding: '6px 0',
                                fontSize: 12.5, color: '#475569', lineHeight: 1.5,
                                borderBottom: i < result.errors_found.length - 1 ? '1px dashed #f1f5f9' : 'none',
                              }}>
                                <span style={{
                                  flexShrink: 0, width: 18, height: 18, borderRadius: '50%',
                                  background: '#fef2f2', color: '#dc2626', fontSize: 10, fontWeight: 800,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>{i + 1}</span>
                                <span>{e}</span>
                              </div>
                            ))}
                          </div>
                          <div>
                            <div style={{
                              fontSize: 10, fontWeight: 800, color: '#059669',
                              background: '#ecfdf5', padding: '3px 8px', borderRadius: 100,
                              display: 'inline-block', marginBottom: 8, letterSpacing: '0.6px',
                            }}>🛠️ FIXES APPLIED</div>
                            {result.fixes_applied.map((f, i) => (
                              <div key={i} style={{
                                display: 'flex', gap: 8, padding: '6px 0',
                                fontSize: 12.5, color: '#475569', lineHeight: 1.5,
                                borderBottom: i < result.fixes_applied.length - 1 ? '1px dashed #f1f5f9' : 'none',
                              }}>
                                <span style={{
                                  flexShrink: 0, width: 18, height: 18, borderRadius: '50%',
                                  background: '#ecfdf5', color: '#059669', fontSize: 10, fontWeight: 800,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>{i + 1}</span>
                                <span>{f}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div style={{
                      background: '#0f172a', borderRadius: 14, padding: 18, marginTop: 12,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8' }}>
                          ✅ FIXED CODE {fixApplied ? '· In Editor' : ''}
                        </span>
                        <div style={{ marginLeft: 'auto' }}>
                          <CopyButton text={result.debugged_code} />
                        </div>
                      </div>
                      <pre style={{
                        margin: 0, padding: 0, color: '#e2e8f0',
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5,
                        lineHeight: 1.7, overflowX: 'auto', whiteSpace: 'pre-wrap',
                      }}>{result.debugged_code}</pre>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <CSTutorFab />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

const btnPrimary = {
  padding: '7px 14px', borderRadius: 8, border: '1.5px solid #c7d2fe',
  background: '#eef2ff', color: '#4f46e5', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
}
const btnGhost = {
  padding: '7px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0',
  background: '#fff', color: '#475569', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
}
const tabBtn = (active) => ({
  padding: '5px 12px', borderRadius: 7, border: 'none',
  background: active ? '#fff' : 'transparent',
  color: active ? '#4f46e5' : '#64748b',
  fontSize: 12, fontWeight: 700, cursor: 'pointer',
  boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
})
