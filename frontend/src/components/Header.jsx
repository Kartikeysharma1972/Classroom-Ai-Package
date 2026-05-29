import React, { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const titles = {
  '/':                { label: 'Dashboard',                sub: 'Welcome back — pick a tool to start.' },
  '/worksheet':       { label: 'Worksheet Generator',      sub: 'Print-ready worksheets with Bloom\'s taxonomy levels and answer keys.' },
  '/lesson-plan':     { label: 'Lesson Plan Generator',    sub: 'Complete lesson plans aligned to CBSE / NCERT / state boards.' },
  '/class-activity':  { label: 'Class Activity Generator', sub: 'Group activities and projects mapped to learning outcomes.' },
  '/question-paper':  { label: 'Question Paper Generator', sub: 'Full question papers with sections, marks, and answer keys.' },
  '/teacher-insights':{ label: 'Teacher Insights',         sub: 'Analytics and insights from your classroom.' },
  '/code-debugger':   { label: 'Code Debugger',            sub: 'Paste student code — AI finds bugs and teaches the fix.' },
  '/feedback':        { label: 'Feedback Writer',          sub: 'Personalized student feedback with star ratings.' },
}

export default function Header() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const info = titles[pathname] || titles['/']
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'T'

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  return (
    <header style={{
      height: 'var(--header-h)',
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(12px) saturate(160%)',
      WebkitBackdropFilter: 'blur(12px) saturate(160%)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* Left — page title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 16, fontWeight: 700, color: 'var(--text-1)',
            letterSpacing: '-0.3px', lineHeight: 1.2,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {info.label}
          </div>
          <div style={{
            fontSize: 12.5, color: 'var(--text-3)', fontWeight: 500,
            marginTop: 2, lineHeight: 1.3,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            maxWidth: 540,
          }}>
            {info.sub}
          </div>
        </div>
      </div>

      {/* Right — search hint + status + user */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* AI status pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '6px 12px', borderRadius: 100,
          background: '#ecfdf5', border: '1px solid #a7f3d0',
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%', background: '#10b981',
            boxShadow: '0 0 0 3px rgba(16,185,129,0.18)',
            animation: 'pulse 2s ease-in-out infinite',
          }} />
          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#059669', letterSpacing: '0.2px' }}>
            AI Online
          </span>
        </div>

        {/* User chip with dropdown */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setMenuOpen(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '5px 12px 5px 5px',
              borderRadius: 100,
              border: '1px solid var(--border)',
              background: menuOpen ? 'var(--bg-2)' : 'var(--surface)',
              cursor: 'pointer',
              transition: 'var(--transition)',
            }}
            onMouseEnter={e => { if (!menuOpen) e.currentTarget.style.background = 'var(--bg-2)' }}
            onMouseLeave={e => { if (!menuOpen) e.currentTarget.style.background = 'var(--surface)' }}
          >
            <div style={{
              width: 30, height: 30,
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff',
              letterSpacing: '0.3px',
              boxShadow: '0 2px 8px rgba(79,70,229,0.3)',
            }}>{initials}</div>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{
                fontSize: 12.5, fontWeight: 600, color: 'var(--text-1)',
                maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{user?.name || 'Teacher'}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 500 }}>
                {user?.school_name || 'Free plan'}
              </div>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{
                color: 'var(--text-3)',
                transform: menuOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {menuOpen && (
            <div className="dropdown" style={{ top: 'calc(100% + 8px)', right: 0, minWidth: 240 }}>
              <div style={{
                padding: '10px 12px 12px',
                borderBottom: '1px solid var(--border)',
                marginBottom: 4,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{user?.name || 'Teacher'}</div>
                <div style={{
                  fontSize: 11.5, color: 'var(--text-3)', marginTop: 2,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{user?.email || 'teacher@school.edu'}</div>
              </div>

              <button type="button" className="dropdown-item" onClick={() => { setMenuOpen(false); navigate('/') }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                </svg>
                Dashboard
              </button>

              <button type="button" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                Account settings
              </button>

              <button type="button" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Help & support
              </button>

              <div className="dropdown-divider" />

              <button type="button" className="dropdown-item danger" onClick={() => { setMenuOpen(false); logout(); navigate('/landing') }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
