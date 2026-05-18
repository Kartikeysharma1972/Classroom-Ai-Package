import React from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const titles = {
  '/':               { label: 'Dashboard',              sub: 'Welcome back! Choose a tool to get started.' },
  '/worksheet':      { label: 'Worksheet Generator',    sub: 'Generate ready-to-use worksheets for any topic.' },
  '/lesson-plan':    { label: 'Lesson Plan Generator',  sub: 'Create comprehensive lesson plans in seconds.' },

  '/class-activity': { label: 'Class Activity Generator', sub: 'Generate engaging group activities mapped to learning outcomes.' },
  '/question-paper': { label: 'Question Paper Generator', sub: 'Generate NCERT-aligned question papers with sections, marks, and answer keys.' },
  '/teacher-insights':{ label: 'Teacher Insights',      sub: 'Analytics and insights from your classroom activity.' },
}

export default function Header() {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const info = titles[pathname] || titles['/']

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'T'

  return (
    <header style={{
      height: 'var(--header-h)',
      background: 'var(--surface)',
      borderBottom: '1.5px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.3px' }}>
          {info.label}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', fontWeight: 500, marginTop: 1 }}>
          {info.sub}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span className="badge badge-blue" style={{ background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}>AI Powered</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', fontWeight: 700, color: '#fff',
            letterSpacing: '0.3px',
          }}>{initials}</div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{user?.name || 'Teacher'}</div>
            <button onClick={logout} style={{
              fontSize: 11, color: '#94a3b8', background: 'none', border: 'none',
              cursor: 'pointer', padding: 0, fontWeight: 500,
            }}>Sign out</button>
          </div>
        </div>
      </div>
    </header>
  )
}
