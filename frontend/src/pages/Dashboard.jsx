import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const tools = [
  {
    to: '/lesson-plan',
    color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
    title: 'Lesson Planner',
    desc: 'Complete plans with worked examples, activities, differentiation, exit tickets.',
    features: ['NCERT', 'Differentiated', 'Exit tickets'],
    time: '~15s',
  },
  {
    to: '/worksheet',
    color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4"/>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
    title: 'Worksheet Generator',
    desc: 'MCQ, fill-blank, open-ended worksheets with answer keys.',
    features: ['Bloom\'s', 'Word bank', 'PDF'],
    time: '~10s',
  },
  {
    to: '/class-activity',
    color: '#059669', bg: '#ecfdf5', border: '#a7f3d0',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Class Activities',
    desc: 'Group activities, projects, hands-on tasks with rubrics.',
    features: ['Group work', 'Rubrics', 'Mapped'],
    time: '~12s',
  },
  {
    to: '/question-paper',
    color: '#d97706', bg: '#fffbeb', border: '#fde68a',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    title: 'Question Paper',
    desc: 'Full papers with sections, marks, watermark, answer keys.',
    features: ['CBSE sections', 'MCQ', 'Subjective'],
    time: '~15s',
  },
  {
    to: '/code-debugger',
    color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/>
        <polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
    title: 'Code Debugger',
    desc: 'Paste student code — AI finds bugs and teaches the fix step-by-step.',
    features: ['20+ langs', 'Step-by-step', 'CS-friendly'],
    time: '~20s',
    isNew: true,
  },
  {
    to: '/feedback',
    color: '#db2777', bg: '#fdf2f8', border: '#fbcfe8',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#db2777" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    title: 'Feedback Writer',
    desc: 'Personalized student feedback with star ratings + report card export.',
    features: ['Star ratings', 'Tone presets', 'Report card'],
    time: '~8s',
    isNew: true,
  },
  {
    to: '/vocabulary',
    color: '#ea580c', bg: '#fff7ed', border: '#fed7aa',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        <line x1="8" y1="7" x2="16" y2="7"/>
        <line x1="8" y1="11" x2="14" y2="11"/>
      </svg>
    ),
    title: 'Vocabulary Mastery',
    desc: 'Grade-calibrated vocabulary worksheets with matching, fill-in-blank, and sentence writing.',
    features: ['K-12 grades', 'Answer key', 'Export'],
    time: '~15s',
    isNew: true,
  },
  {
    to: '/comprehension',
    color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
    title: 'Reading Comprehension',
    desc: 'AI-generated passages with text-dependent questions, annotation guide, and vocabulary in context.',
    features: ['Passages', 'Questions', 'Vocab'],
    time: '~20s',
    isNew: true,
  },
]

const stats = [
  { label: 'AI tools', value: '8', sub: 'Production-ready', color: '#4f46e5', bg: '#eef2ff', icon: '🛠' },
  { label: 'Avg. time saved', value: '10h+', sub: 'every week', color: '#059669', bg: '#ecfdf5', icon: '⏱' },
  { label: 'Grade coverage', value: 'K–12', sub: 'All Indian boards', color: '#d97706', bg: '#fffbeb', icon: '🎓' },
  { label: 'Output speed', value: '<30s', sub: 'per generation', color: '#7c3aed', bg: '#f5f3ff', icon: '⚡' },
]

const quickTips = [
  { icon: '💡', text: 'Use Lesson Planner first — it sets up everything else for your week.' },
  { icon: '🎯', text: 'For revision week, pair Worksheet + Question Paper generators.' },
  { icon: '🐛', text: 'CS teachers: drop student code into Code Debugger for instant lesson material.' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0] || 'Teacher'

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto' }}>
      {/* ── HERO ── */}
      <div className="fade-up" style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 35%, #4f46e5 75%, #7c3aed 100%)',
        color: '#fff', marginBottom: 24,
        padding: '32px 36px', borderRadius: 22,
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 24px 56px rgba(79,70,229,0.18)',
      }}>
        <div style={{
          position: 'absolute', top: -60, right: -40, width: 280, height: 280,
          background: 'radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', bottom: -90, left: '35%', width: 320, height: 320,
          background: 'radial-gradient(circle, rgba(168,85,247,0.32) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', top: 30, right: 110,
          width: 6, height: 6, borderRadius: '50%', background: '#fff',
          boxShadow: '0 0 12px #fff', opacity: 0.6,
        }} />
        <div style={{
          position: 'absolute', top: 80, right: 60,
          width: 4, height: 4, borderRadius: '50%', background: '#fff',
          boxShadow: '0 0 10px #fff', opacity: 0.5,
        }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontSize: 11, fontWeight: 700,
              background: 'rgba(255,255,255,0.14)',
              backdropFilter: 'blur(10px)',
              padding: '5px 14px', borderRadius: 100,
              letterSpacing: '0.6px', textTransform: 'uppercase',
              border: '1px solid rgba(255,255,255,0.16)',
              marginBottom: 16,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
              AI Teaching Suite · Active
            </div>
            <h1 style={{
              fontSize: 32, fontWeight: 800, marginBottom: 10,
              letterSpacing: '-0.8px', lineHeight: 1.15,
            }}>
              Good to see you, {firstName} 👋
            </h1>
            <p style={{
              fontSize: 15, opacity: 0.82, maxWidth: 520,
              lineHeight: 1.65, marginBottom: 22, fontWeight: 400,
            }}>
              Eight AI tools designed exclusively for teachers — generate lesson plans, worksheets,
              vocabulary, comprehension, feedback, even debug student code. Pick a tool to start.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/lesson-plan')} style={{
                background: '#fff', color: '#4f46e5',
                fontWeight: 700, padding: '11px 22px',
                borderRadius: 11, fontSize: 13.5,
                border: 'none', cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.25)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.18)' }}>
                Start a lesson plan
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
              <button onClick={() => navigate('/code-debugger')} style={{
                background: 'rgba(255,255,255,0.12)',
                color: '#fff', backdropFilter: 'blur(10px)',
                fontWeight: 600, padding: '11px 22px',
                borderRadius: 11, fontSize: 13.5,
                border: '1px solid rgba(255,255,255,0.22)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.20)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}>
                🐛 Try Code Debugger
              </button>
            </div>
          </div>

          {/* Mini stats card */}
          <div style={{
            background: 'rgba(255,255,255,0.10)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.16)',
            borderRadius: 16, padding: '16px 22px',
            display: 'flex', gap: 24, flexShrink: 0,
          }}>
            <div>
              <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>This week</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>0 <span style={{ fontSize: 12, opacity: 0.65 }}>generations</span></div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.18)' }} />
            <div>
              <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Streak</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>Day 1 🔥</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="fade-up-1" style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 14, marginBottom: 28,
      }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '16px 18px',
            transition: 'var(--transition)',
            boxShadow: 'var(--shadow-xs)',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = s.color + '55'; e.currentTarget.style.boxShadow = `0 8px 22px ${s.color}14` }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'var(--shadow-xs)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15,
              }}>{s.icon}</div>
              <div style={{
                fontSize: 9.5, fontWeight: 700, color: 'var(--text-3)',
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>{s.label}</div>
            </div>
            <div style={{
              fontSize: 22, fontWeight: 800, color: 'var(--text-1)',
              letterSpacing: '-0.5px', lineHeight: 1.1,
            }}>{s.value}</div>
            <div style={{
              fontSize: 11.5, color: 'var(--text-3)',
              fontWeight: 500, marginTop: 4,
            }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── TOOL GRID HEADER ── */}
      <div className="fade-up-2" style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <div>
          <h2 style={{
            fontSize: 17, fontWeight: 800, color: 'var(--text-1)',
            letterSpacing: '-0.3px', marginBottom: 3,
          }}>Your Teaching Tools</h2>
          <p style={{ fontSize: 12.5, color: 'var(--text-3)', fontWeight: 500 }}>
            Eight AI-powered tools, one place — pick any to get started.
          </p>
        </div>
        <span style={{
          fontSize: 11, color: 'var(--text-3)', fontWeight: 600,
          padding: '4px 10px', borderRadius: 100,
          background: 'var(--bg-2)',
        }}>{tools.length} tools available</span>
      </div>

      {/* ── TOOL CARDS ── */}
      <div className="fade-up-2" style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 14, marginBottom: 28,
      }}>
        {tools.map((tool, i) => (
          <div
            key={i}
            onClick={() => navigate(tool.to)}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 16, padding: 20,
              cursor: 'pointer',
              transition: 'var(--transition)',
              boxShadow: 'var(--shadow-xs)',
              display: 'flex', flexDirection: 'column', gap: 14,
              position: 'relative', overflow: 'hidden',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = tool.color + '55'
              e.currentTarget.style.transform = 'translateY(-3px)'
              e.currentTarget.style.boxShadow = `0 16px 36px ${tool.color}1f`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'var(--shadow-xs)'
            }}
          >
            {tool.isNew && (
              <span style={{
                position: 'absolute', top: 12, right: 12,
                padding: '2px 8px', borderRadius: 100,
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                color: '#fff', fontSize: 9, fontWeight: 800,
                letterSpacing: '0.4px',
              }}>NEW</span>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44, height: 44,
                background: tool.bg,
                border: `1.5px solid ${tool.border}`,
                borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>{tool.icon}</div>
              <div style={{ minWidth: 0 }}>
                <h3 style={{
                  fontSize: 14.5, fontWeight: 700, color: 'var(--text-1)',
                  marginBottom: 2, letterSpacing: '-0.2px',
                }}>{tool.title}</h3>
                <div style={{
                  fontSize: 10.5, fontWeight: 700, color: tool.color,
                  letterSpacing: '0.3px',
                }}>{tool.time}</div>
              </div>
            </div>

            <p style={{
              fontSize: 12.5, color: 'var(--text-2)',
              lineHeight: 1.55, margin: 0, flex: 1,
            }}>{tool.desc}</p>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              paddingTop: 12, borderTop: '1px dashed var(--border)',
            }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {tool.features.map((f, fi) => (
                  <span key={fi} style={{
                    fontSize: 10, fontWeight: 600,
                    background: tool.bg, color: tool.color,
                    padding: '2px 7px', borderRadius: 5,
                  }}>{f}</span>
                ))}
              </div>
              <span style={{
                fontSize: 11.5, fontWeight: 700, color: tool.color,
                display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0,
              }}>
                Open
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── QUICK TIPS ── */}
      <div className="fade-up-3" style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16, padding: 22,
        boxShadow: 'var(--shadow-xs)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, borderRadius: 8,
            background: '#fffbeb', border: '1px solid #fde68a',
          }}>💡</span>
          <h3 style={{
            fontSize: 14, fontWeight: 700, color: 'var(--text-1)',
            letterSpacing: '-0.2px',
          }}>Pro tips for new teachers</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {quickTips.map((t, i) => (
            <div key={i} style={{
              padding: 14, borderRadius: 12,
              background: 'var(--bg-2)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{t.icon}</span>
              <p style={{
                fontSize: 12.5, color: 'var(--text-2)',
                lineHeight: 1.55, margin: 0,
              }}>{t.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 980px) {
          .fade-up-2 > div { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 720px) {
          .fade-up-1 { grid-template-columns: 1fr 1fr !important; }
          .fade-up-2 > div { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
