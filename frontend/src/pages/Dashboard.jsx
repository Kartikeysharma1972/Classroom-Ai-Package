import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function downloadPDF(content, filename) {
  const script = document.createElement('script')
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
  script.onload = () => {
    const { jsPDF } = window.jspdf
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const lines = doc.splitTextToSize(content, 180)
    let y = 20
    doc.setFontSize(11)
    lines.forEach(line => {
      if (y > 280) { doc.addPage(); y = 20 }
      doc.text(line, 15, y)
      y += 6
    })
    doc.save(filename)
  }
  if (!window.jspdf) document.head.appendChild(script)
  else script.onload()
}

function RecentGenerations() {
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [activeTab, setActiveTab] = useState({})

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('classroom-auto-history') || '[]')
    setHistory(saved)
  }, [])

  if (history.length === 0) return null

  const tabLabels = [
    { key: 'lesson_plan',   label: 'Lesson Plan',   emoji: '📋' },
    { key: 'worksheet',     label: 'Worksheet',     emoji: '📝' },
    { key: 'mc_assessment', label: 'MC Assessment', emoji: '✅' },
  ]

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>
          Recent Auto-Generations
        </h2>
        <button
          onClick={() => { localStorage.removeItem('classroom-auto-history'); setHistory([]) }}
          style={{ fontSize: 12, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Clear all
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {history.map((item) => {
          const isOpen = expanded === item.id
          const tab = activeTab[item.id] || 'lesson_plan'
          return (
            <div key={item.id} style={{
              background: 'var(--surface)', border: '1.5px solid var(--border)',
              borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow)',
            }}>
              {/* Header row */}
              <div
                onClick={() => setExpanded(isOpen ? null : item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 20px', cursor: 'pointer',
                  background: isOpen ? 'var(--accent-soft)' : 'var(--surface)',
                  borderBottom: isOpen ? '1.5px solid var(--border)' : 'none',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>⚡</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)', marginBottom: 2 }}>
                    {item.topic}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                    {item.grade} · {item.subject} · {item.generatedAt} · ⚡{item.timeTaken}s
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {tabLabels.map(t => (
                    <button
                      key={t.key}
                      onClick={e => {
                        e.stopPropagation()
                        downloadPDF(item[t.key], `${item.topic}-${t.label}.pdf`)
                      }}
                      style={{
                        fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6,
                        border: '1.5px solid var(--border)', background: 'var(--surface)',
                        cursor: 'pointer', color: 'var(--text-2)',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}
                      title={`Download ${t.label} PDF`}
                    >
                      {t.emoji} PDF
                    </button>
                  ))}
                  <span style={{ fontSize: 18, color: 'var(--text-3)', marginLeft: 4 }}>
                    {isOpen ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {/* Expanded content with tabs */}
              {isOpen && (
                <div style={{ padding: '16px 20px' }}>
                  {/* Tabs */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    {tabLabels.map(t => (
                      <button
                        key={t.key}
                        onClick={() => setActiveTab(prev => ({ ...prev, [item.id]: t.key }))}
                        style={{
                          padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                          cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                          background: tab === t.key ? 'var(--accent)' : 'var(--bg)',
                          color: tab === t.key ? '#fff' : 'var(--text-2)',
                        }}
                      >
                        {t.emoji} {t.label}
                      </button>
                    ))}
                    <button
                      onClick={() => downloadPDF(item[tab], `${item.topic}-${tabLabels.find(t=>t.key===tab)?.label}.pdf`)}
                      style={{
                        marginLeft: 'auto', padding: '7px 16px', borderRadius: 8,
                        fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        background: 'linear-gradient(135deg,#f59e0b,#ef4444)',
                        color: '#fff', border: 'none',
                        boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
                      }}
                    >
                      ⬇ Download PDF
                    </button>
                  </div>

                  {/* Content preview */}
                  <pre style={{
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '14px 16px',
                    fontSize: 12, lineHeight: 1.7, color: 'var(--text-1)',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    maxHeight: 320, overflowY: 'auto', margin: 0,
                    fontFamily: 'monospace',
                  }}>
                    {item[tab]}
                  </pre>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const tools = [
  {
    to: '/lesson-plan',
    color: '#4f46e5',
    bg: '#eef2ff',
    border: '#c7d2fe',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
    title: 'Lesson Planner',
    desc: 'Auto-generate complete lesson plans aligned to state syllabus with activities, objectives, and differentiation.',
    features: ['Syllabus-aligned', 'SWBAT objectives', 'Differentiated', 'Topic overview'],
    time: '~15 seconds',
  },
  {
    to: '/class-activity',
    color: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Class Activities',
    desc: 'Generate group activities, project exercises, and hands-on tasks mapped to specific learning outcomes.',
    features: ['Group work', 'Project-based', 'Hands-on', 'Outcome-mapped'],
    time: '~12 seconds',
  },
  {
    to: '/question-paper',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <line x1="10" y1="9" x2="8" y2="9"/>
      </svg>
    ),
    title: 'Question Paper Generator',
    desc: 'NCERT-aligned question papers with MCQ, subjective, sections, marks, school watermark, and answer keys.',
    features: ['NCERT/CBSE', 'MCQ + Subjective', 'Watermark', 'PDF Export'],
    time: '~15 seconds',
  },
]

const stats = [
  { label: 'AI Tools', value: '4', icon: '🛠' },
  { label: 'Time Saved/Week', value: '10h+', icon: '⏱' },
  { label: 'Grade Levels', value: 'K–12', icon: '🎓' },
  { label: 'Powered By', icon: '⚡' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div>
      {/* Hero */}
      <div className="card fade-up" style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        border: 'none', color: '#fff', marginBottom: 28,
        padding: '32px 32px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'rgba(255,255,255,0.2)', padding: '3px 12px', borderRadius: 100, letterSpacing: '0.5px', textTransform: 'uppercase' }}>AI Powered</span>
        </div>
        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 8, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
          Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
        </h1>
        <p style={{ fontSize: '1rem', opacity: 0.88, maxWidth: 500, lineHeight: 1.6, marginBottom: 20 }}>
          Your AI toolkit for teaching. Generate lesson plans, question papers, activities, and quizzes in seconds.
        </p>
        <button className="btn" onClick={() => navigate('/auto-generate')} style={{ background: '#fff', color: '#4f46e5', fontWeight: 700, padding: '10px 22px' }}>
          Start Creating
        </button>
      </div>

      {/* Stats */}
      <div className="grid-3 fade-up-1" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 28 }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: 'var(--surface)', border: '1.5px solid var(--border)',
            borderRadius: 14, padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: 'var(--shadow)',
          }}>
            <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-1)' }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: 500 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Generations */}
      <RecentGenerations />

      {/* Auto Generate Featured Card */}
      <div
        className="fade-up-2"
        onClick={() => navigate('/auto-generate')}
        style={{
          marginBottom: 24, padding: '24px 28px', borderRadius: 18, cursor: 'pointer',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6366f1 100%)',
          border: 'none', color: '#fff', boxShadow: '0 8px 32px rgba(79,70,229,0.25)',
          transition: 'all 0.22s ease', display: 'flex', alignItems: 'center', gap: 24,
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(79,70,229,0.35)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(79,70,229,0.25)' }}
      >
        <div style={{ fontSize: 44, flexShrink: 0 }}>⚡</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.3px' }}>Auto Generate — All 4 Tools at Once</span>
            <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(255,255,255,0.25)', padding: '2px 10px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: '0.6px' }}>NEW</span>
          </div>
          <p style={{ fontSize: 14, opacity: 0.9, margin: 0, lineHeight: 1.55 }}>
            Select grade + subject + topic once → get a Lesson Plan, Worksheet, MC Assessment &amp; Quiz in one click.
            Language automatically adjusts for each grade level. Powered by MCP automation.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {['Auto language adjustment', 'Parallel generation', 'MCP-powered', '4 tools in ~30s'].map(f => (
              <span key={f} style={{ fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 100 }}>{f}</span>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 24, opacity: 0.8, flexShrink: 0 }}>→</div>
      </div>

      {/* Tool Cards */}
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: 16 }}>Teaching Tools</h2>
        <div className="grid-3 fade-up-2" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {tools.map((tool, i) => (
            <div
              key={i}
              onClick={() => navigate(tool.to)}
              style={{
                background: 'var(--surface)',
                border: `1.5px solid var(--border)`,
                borderRadius: 18,
                padding: '24px',
                cursor: 'pointer',
                transition: 'all 0.22s ease',
                boxShadow: 'var(--shadow)',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = tool.color
                e.currentTarget.style.transform = 'translateY(-3px)'
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'var(--shadow)'
              }}
            >
              {/* Icon */}
              <div style={{
                width: 52, height: 52,
                background: tool.bg,
                border: `1.5px solid ${tool.border}`,
                borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {tool.icon}
              </div>

              {/* Text */}
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>{tool.title}</h3>
                <p style={{ fontSize: '0.83rem', color: 'var(--text-2)', lineHeight: 1.55 }}>{tool.desc}</p>
              </div>

              {/* Features */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {tool.features.map((f, fi) => (
                  <span key={fi} style={{
                    fontSize: '0.7rem', fontWeight: 600,
                    background: tool.bg, color: tool.color,
                    border: `1px solid ${tool.border}`,
                    padding: '2px 9px', borderRadius: 100,
                  }}>{f}</span>
                ))}
              </div>

              {/* CTA */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 500 }}>⚡ {tool.time}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: tool.color }}>Open →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
