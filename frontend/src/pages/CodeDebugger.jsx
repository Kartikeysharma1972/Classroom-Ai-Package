import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const API = window.location.hostname === 'localhost' ? 'http://localhost:8001' : window.location.origin
const STORAGE_KEY = 'classroom-result-debugger'

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

export default function CodeDebugger() {
  const { user } = useAuth()
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('auto-detect')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(() => {
    try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null } catch { return null }
  })
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState('learn')
  const textareaRef = useRef(null)

  useEffect(() => {
    if (result) localStorage.setItem(STORAGE_KEY, JSON.stringify(result))
  }, [result])

  const handleDebug = async () => {
    if (!code.trim()) { setError('Please paste some code first.'); return }
    setError(''); setResult(null); setLoading(true)
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

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) { setCode(text); setError(''); setResult(null) }
    } catch {
      textareaRef.current?.focus()
      setError('Press Ctrl+V in the code area to paste.')
    }
  }

  const handleClear = () => {
    setCode(''); setResult(null); setError('')
    localStorage.removeItem(STORAGE_KEY)
  }

  const handleSample = () => {
    setCode(SAMPLE_CODE); setLanguage('Python'); setResult(null); setError('')
  }

  const errorCount = result?.errors_found?.length || 0
  const hasErrors = errorCount > 0

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
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
            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>Code Debugger</h1>
            <p style={{ fontSize: 13.5, margin: '4px 0 0', opacity: 0.85, fontWeight: 500 }}>
              Paste student code — AI finds bugs, explains fixes, teaches the why. Perfect for CS teachers.
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
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

          <div style={{ padding: '12px 16px', display: 'flex', gap: 8, borderBottom: '1.5px solid #f1f5f9' }}>
            <button type="button" onClick={handlePaste} style={btnPrimary}>📋 Paste</button>
            <button type="button" onClick={handleSample} style={btnGhost}>✨ Sample</button>
            {code && <button type="button" onClick={handleClear} style={btnGhost}>🗑 Clear</button>}
          </div>

          <textarea
            ref={textareaRef}
            value={code}
            onChange={e => { setCode(e.target.value); setError('') }}
            placeholder={'# Paste your code here\n# Or click Sample to try a buggy example\n# Supports Python, JS, Java, C++, and more'}
            spellCheck={false}
            style={{
              flex: 1, minHeight: 360, padding: 18, border: 'none', outline: 'none',
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 13.5,
              lineHeight: 1.6, color: '#1a1a2e', background: '#fafafa', resize: 'none',
            }}
          />

          <div style={{ padding: '14px 18px', borderTop: '1.5px solid #f1f5f9', display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={handleDebug}
              disabled={loading || !code.trim()}
              style={{
                flex: 1, padding: '12px 20px', borderRadius: 12, border: 'none',
                background: loading || !code.trim() ? '#cbd5e1' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                color: '#fff', fontSize: 14, fontWeight: 800, cursor: loading || !code.trim() ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(79,70,229,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
              {loading ? (
                <>
                  <div style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.3)', borderTop: '2.5px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Analyzing your code...
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
                <div style={{ fontSize: 13.5, color: '#64748b', marginBottom: 24 }}>Paste your code and I will fix it, step by step</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {['🐛 Finds syntax errors', '🧠 Explains each fix', '⚡ Powered by Groq AI'].map(h => (
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
                    onClick={() => { setCode(result.debugged_code); setResult(null) }}
                    style={{
                      marginLeft: 'auto', padding: '5px 14px', borderRadius: 100,
                      border: '1.5px solid #10b981', background: '#ecfdf5', color: '#059669',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    }}>✏️ Apply Fix</button>
                </div>

                {result.explanation && (
                  <div style={{
                    background: 'linear-gradient(135deg, #f5f3ff, #eef2ff)',
                    border: '1.5px solid #c7d2fe', borderRadius: 14,
                    padding: '14px 18px', marginBottom: 18,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
                      🖥️ CodeFix Says
                    </div>
                    <p style={{ fontSize: 13.5, lineHeight: 1.7, color: '#3730a3', margin: 0 }}>{result.explanation}</p>
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
                  <div style={{
                    background: '#0f172a', borderRadius: 14, padding: 18, marginTop: 12,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8' }}>✅ FIXED CODE</span>
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
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
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
