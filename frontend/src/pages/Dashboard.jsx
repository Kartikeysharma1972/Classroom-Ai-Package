import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const tools = [
  {
    to: '/lesson-plan',
    color: '#4f46e5',
    bg: '#eef2ff',
    border: '#c7d2fe',
    gradient: 'linear-gradient(135deg, #4f46e5, #6366f1)',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
    title: 'Lesson Planner',
    desc: 'Complete lesson plans with worked examples, activities, differentiation, and exit tickets.',
    features: ['NCERT-aligned', 'Worked examples', 'Differentiated', 'Exit tickets'],
    time: '~15s',
  },
  {
    to: '/worksheet',
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
    gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4"/>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
    title: 'Worksheet Generator',
    desc: 'Print-ready worksheets with MCQ, fill-in-blank, open-ended questions, and answer keys.',
    features: ['Bloom\'s taxonomy', 'Word bank', 'Answer key', 'PDF export'],
    time: '~10s',
  },
  {
    to: '/class-activity',
    color: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    gradient: 'linear-gradient(135deg, #059669, #10b981)',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Class Activities',
    desc: 'Engaging group activities, projects, games, and hands-on tasks with assessment rubrics.',
    features: ['Group work', 'Project-based', 'Rubrics', 'Outcome-mapped'],
    time: '~12s',
  },
  {
    to: '/question-paper',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    gradient: 'linear-gradient(135deg, #d97706, #f59e0b)',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    title: 'Question Paper',
    desc: 'Full question papers with MCQ, subjective, sections, marks, watermark, and answer keys.',
    features: ['CBSE sections', 'MCQ + Subjective', 'Watermark', 'PDF export'],
    time: '~15s',
  },
]

const stats = [
  { label: 'AI Tools', value: '4', color: '#4f46e5', bg: '#eef2ff' },
  { label: 'Time Saved/Week', value: '10h+', color: '#059669', bg: '#ecfdf5' },
  { label: 'Grade Levels', value: 'K-12', color: '#d97706', bg: '#fffbeb' },
  { label: 'CBSE Aligned', value: '100%', color: '#dc2626', bg: '#fef2f2' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Hero */}
      <div className="fade-up" style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4f46e5 100%)',
        border: 'none', color: '#fff', marginBottom: 28,
        padding: '36px 36px', borderRadius: 20,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 200, height: 200,
          background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: '30%', width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', padding: '4px 14px', borderRadius: 100, letterSpacing: '0.8px', textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.1)' }}>
              AI-Powered Teaching Suite
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 8, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p style={{ fontSize: '0.95rem', opacity: 0.8, maxWidth: 480, lineHeight: 1.65, marginBottom: 22 }}>
            Create lesson plans, worksheets, activities, and question papers aligned to CBSE/NCERT curriculum in seconds.
          </p>
          <button className="btn" onClick={() => navigate('/lesson-plan')} style={{
            background: '#fff', color: '#4f46e5', fontWeight: 700, padding: '11px 24px',
            borderRadius: 12, fontSize: '0.88rem',
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
          }}>
            Start Creating
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="fade-up-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: 'var(--surface)', border: '1.5px solid var(--border)',
            borderRadius: 14, padding: '18px 20px',
            display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: 'var(--shadow)', transition: 'all 0.2s',
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: s.color }}>{s.value}</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tool Cards */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.2px' }}>Teaching Tools</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: 500 }}>Select a tool to get started</span>
        </div>
        <div className="fade-up-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {tools.map((tool, i) => (
            <div
              key={i}
              onClick={() => navigate(tool.to)}
              style={{
                background: 'var(--surface)',
                border: '1.5px solid var(--border)',
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
                e.currentTarget.style.boxShadow = `0 8px 28px ${tool.color}18`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'var(--shadow)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 48, height: 48,
                  background: tool.bg,
                  border: `1.5px solid ${tool.border}`,
                  borderRadius: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {tool.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>{tool.title}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>{tool.desc}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {tool.features.map((f, fi) => (
                    <span key={fi} style={{
                      fontSize: '0.68rem', fontWeight: 600,
                      background: tool.bg, color: tool.color,
                      padding: '2px 8px', borderRadius: 6,
                    }}>{f}</span>
                  ))}
                </div>
                <span style={{
                  fontSize: '0.78rem', fontWeight: 700, color: tool.color,
                  display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                }}>
                  Open
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
