import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
  { label: 'AI Tools', value: '5', icon: '🛠' },
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
        <button className="btn" onClick={() => navigate('/lesson-plan')} style={{ background: '#fff', color: '#4f46e5', fontWeight: 700, padding: '10px 22px' }}>
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

      {/* Tool Cards */}
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: 16 }}>Teaching Tools</h2>
        <div className="grid-3 fade-up-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
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
