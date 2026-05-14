import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TeacherDashboard } from '../components/TeacherDashboard'

export default function TeacherInsights() {
  const navigate = useNavigate()
  const [classId, setClassId] = useState(localStorage.getItem('teacher-id') || '')
  const [showDashboard, setShowDashboard] = useState(!!classId)

  const handleStartDashboard = () => {
    if (classId.trim()) {
      localStorage.setItem('teacher-id', classId)
      setShowDashboard(true)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f9fafb',
      padding: 20
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 32,
        maxWidth: 1200,
        margin: '0 auto 32px'
      }}>
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 8
          }}>
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'white',
                border: 'none',
                fontSize: 20,
                cursor: 'pointer',
                padding: 8,
                borderRadius: 8,
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.target.style.background = '#f3f4f6'}
              onMouseLeave={e => e.target.style.background = 'white'}
            >
              ←
            </button>
            <h1 style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#0f172a',
              margin: 0
            }}>
              📊 Teacher Insights
            </h1>
          </div>
          <p style={{
            fontSize: 14,
            color: '#64748b',
            margin: 0,
            marginLeft: 50
          }}>
            Class-wide adaptive learning analytics and recommendations
          </p>
        </div>
        {showDashboard && (
          <button
            onClick={() => setShowDashboard(false)}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: 8,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.target.style.background = '#dc2626'}
            onMouseLeave={e => e.target.style.background = '#ef4444'}
          >
            Change Class
          </button>
        )}
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {!showDashboard ? (
          // Class Selection
          <div style={{
            background: 'white',
            border: '1.5px solid #e2e8f0',
            borderRadius: 16,
            padding: 32,
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: 24,
              fontWeight: 700,
              marginBottom: 12,
              color: '#0f172a'
            }}>
              👋 Welcome to Teacher Insights
            </div>
            <p style={{
              fontSize: 14,
              color: '#64748b',
              marginBottom: 28
            }}>
              Enter your class ID to view adaptive learning insights and student progress
            </p>

            <div style={{
              display: 'flex',
              gap: 12,
              maxWidth: 400,
              margin: '0 auto'
            }}>
              <input
                type="text"
                value={classId}
                onChange={e => setClassId(e.target.value)}
                placeholder="Enter your class ID..."
                onKeyPress={e => e.key === 'Enter' && handleStartDashboard()}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: 8,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={e => e.target.style.borderColor = '#399aff'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
              <button
                onClick={handleStartDashboard}
                disabled={!classId.trim()}
                style={{
                  background: classId.trim() ? '#399aff' : '#cbd5e1',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: classId.trim() ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => classId.trim() && (e.target.style.background = '#2e7dd1')}
                onMouseLeave={e => classId.trim() && (e.target.style.background = '#399aff')}
              >
                View Dashboard
              </button>
            </div>

            {/* Quick Info */}
            <div style={{
              marginTop: 40,
              paddingTop: 32,
              borderTop: '1px solid #e2e8f0'
            }}>
              <div style={{
                fontSize: 13,
                color: '#64748b',
                marginBottom: 16
              }}>
                💡 What you'll see:
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 16,
                textAlign: 'left'
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>📈 Class Statistics</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Total students, average mastery, at-risk students</div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>👥 Student Progress</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Individual mastery levels and learning status</div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>🎯 Topic Mastery</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Class-wide mastery by language/topic</div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>💡 Recommendations</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Personalized interventions and next steps</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Dashboard View
          <TeacherDashboard classId={classId} />
        )}
      </div>
    </div>
  )
}
