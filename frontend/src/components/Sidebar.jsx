import React from 'react'
import { NavLink } from 'react-router-dom'

const navGroups = [
  {
    title: 'Overview',
    items: [
      {
        to: '/', exact: true,
        label: 'Dashboard',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Teaching Tools',
    items: [
      {
        to: '/lesson-plan',
        label: 'Lesson Planner',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
        ),
      },
      {
        to: '/class-activity',
        label: 'Class Activities',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        ),
      },
      {
        to: '/worksheet',
        label: 'Worksheet',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 11 12 14 22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        ),
      },
      {
        to: '/question-paper',
        label: 'Question Paper',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <line x1="10" y1="9" x2="8" y2="9"/>
          </svg>
        ),
      },
    ],
  },
  {
    title: 'CS & Feedback',
    badge: 'NEW',
    items: [
      {
        to: '/code-debugger',
        label: 'Code Debugger',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"/>
            <polyline points="8 6 2 12 8 18"/>
          </svg>
        ),
      },
      {
        to: '/feedback',
        label: 'Feedback Writer',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        ),
      },
    ],
  },
]

export default function Sidebar() {
  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0,
      width: 'var(--sidebar-w)', height: '100vh',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      zIndex: 100, overflowY: 'auto',
    }}>
      {/* Brand */}
      <div style={{
        padding: '18px 18px 14px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{
            width: 38, height: 38,
            background: '#fff',
            borderRadius: 11,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1.5px solid var(--accent-mid)',
            boxShadow: '0 2px 8px rgba(79,70,229,0.15)',
            flexShrink: 0, overflow: 'hidden',
          }}>
            <img
              src="/codevidhya_logo.jfif"
              alt="ClassroomAI"
              style={{ width: '85%', height: '85%', objectFit: 'contain' }}
              onError={(e) => {
                // Fallback to SVG icon if logo missing
                e.currentTarget.style.display = 'none'
                e.currentTarget.parentElement.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>'
              }}
            />
          </div>
          <div style={{ lineHeight: 1.15 }}>
            <div style={{
              fontSize: 15, fontWeight: 800, color: 'var(--text-1)',
              letterSpacing: '-0.4px',
            }}>ClassroomAI</div>
            <div style={{
              fontSize: 10.5, color: 'var(--text-3)',
              fontWeight: 500, marginTop: 2, letterSpacing: '0.1px',
            }}>by CodeVidhya</div>
          </div>
        </div>
      </div>

      {/* Nav groups */}
      <nav style={{ padding: '14px 10px', flex: 1 }}>
        {navGroups.map((group, gi) => (
          <div key={gi} style={{ marginBottom: gi < navGroups.length - 1 ? 18 : 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '4px 10px 8px',
            }}>
              <span style={{
                fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)',
                textTransform: 'uppercase', letterSpacing: '0.7px',
              }}>{group.title}</span>
              {group.badge && (
                <span style={{
                  fontSize: 9, fontWeight: 800,
                  background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                  color: '#fff', padding: '2px 6px', borderRadius: 5,
                  letterSpacing: '0.3px',
                }}>{group.badge}</span>
              )}
            </div>

            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                style={({ isActive }) => ({
                  position: 'relative',
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8.5px 12px',
                  borderRadius: 9,
                  marginBottom: 2,
                  textDecoration: 'none',
                  fontSize: 13.5,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--accent)' : 'var(--text-2)',
                  background: isActive ? 'var(--accent-soft)' : 'transparent',
                  transition: 'var(--transition)',
                })}
                onMouseEnter={e => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.background = 'var(--bg-2)'
                    e.currentTarget.style.color = 'var(--text-1)'
                  }
                }}
                onMouseLeave={e => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-2)'
                  }
                }}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span style={{
                        position: 'absolute', left: -10, top: '50%', transform: 'translateY(-50%)',
                        width: 3, height: 18, borderRadius: '0 3px 3px 0',
                        background: 'var(--accent-grad)',
                      }} />
                    )}
                    <span style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 22, height: 22,
                      color: isActive ? 'var(--accent)' : 'var(--text-3)',
                      transition: 'color 0.15s',
                    }}>{item.icon}</span>
                    <span style={{ lineHeight: 1.3, letterSpacing: '-0.1px' }}>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Pro upgrade card */}
      <div style={{ padding: '0 12px 12px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #4f46e5 100%)',
          borderRadius: 14,
          padding: '14px 14px 16px',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -20, right: -20,
            width: 80, height: 80, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
          }} />
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '2px 8px', borderRadius: 100,
            background: 'rgba(255,255,255,0.18)',
            fontSize: 9.5, fontWeight: 800, letterSpacing: '0.5px',
            marginBottom: 8, position: 'relative',
          }}>
            <span>★</span> UPGRADE
          </div>
          <div style={{
            fontSize: 13, fontWeight: 700, marginBottom: 4,
            letterSpacing: '-0.2px', position: 'relative',
          }}>Go Pro — ₹299/mo</div>
          <div style={{
            fontSize: 11, opacity: 0.75, lineHeight: 1.5,
            marginBottom: 10, position: 'relative',
          }}>Unlimited AI generations + all 6 tools</div>
          <button style={{
            width: '100%', padding: '7px', borderRadius: 8,
            border: 'none', background: '#fff', color: '#4f46e5',
            fontSize: 11.5, fontWeight: 800, cursor: 'pointer',
            letterSpacing: '-0.1px', position: 'relative',
            transition: 'transform 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >Upgrade Now</button>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 18px 14px',
        borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 7, height: 7, background: '#10b981', borderRadius: '50%',
            boxShadow: '0 0 0 3px rgba(16,185,129,0.18)',
          }} />
          <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>
            All systems operational
          </span>
        </div>
        <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 500 }}>v2.0</span>
      </div>
    </aside>
  )
}
