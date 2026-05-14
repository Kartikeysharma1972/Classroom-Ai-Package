import React, { useState, useEffect } from 'react'

export function TeacherDashboard({ classId }) {
  const [classStats, setClassStats] = useState(null)
  const [studentProgress, setStudentProgress] = useState([])
  const [topicMastery, setTopicMastery] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [classId])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch class-wide statistics
      const apiBase = window.location.hostname === 'localhost' ? 'http://localhost:8001' : window.location.origin
      const statsRes = await fetch(`${apiBase}/api/adaptive/teacher-insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ class_id: classId })
      })
      const statsData = await statsRes.json()

      if (statsData.success) {
        setClassStats(statsData.stats)
        setStudentProgress(statsData.students || [])
        setTopicMastery(statsData.topics || [])
        setRecommendations(statsData.recommendations || [])
      }
    } catch (err) {
      console.error('[TeacherDashboard] Error fetching data:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 300,
        color: '#666'
      }}>
        Loading dashboard...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        background: '#fee',
        border: '1px solid #fcc',
        borderRadius: 12,
        padding: 20,
        color: '#c33'
      }}>
        {error}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Class Statistics Header */}
      {classStats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16
        }}>
          <StatCard
            label="Total Students"
            value={classStats.total_students}
            emoji="👥"
            trend={classStats.new_students_today}
          />
          <StatCard
            label="Average Mastery"
            value={`${(classStats.average_mastery * 100).toFixed(1)}%`}
            emoji="📈"
            trend={null}
          />
          <StatCard
            label="At Risk"
            value={classStats.students_below_threshold}
            emoji="⚠️"
            trend={null}
          />
          <StatCard
            label="Advanced"
            value={classStats.students_above_80}
            emoji="⭐"
            trend={null}
          />
        </div>
      )}

      {/* Student Progress Table */}
      {studentProgress.length > 0 && (
        <div>
          <h3 style={{
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 12,
            color: '#0f172a'
          }}>
            Student Progress
          </h3>
          <div style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            overflow: 'hidden'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 14
            }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Student</th>
                  <th style={{ padding: 12, textAlign: 'center', fontWeight: 600 }}>Mastery</th>
                  <th style={{ padding: 12, textAlign: 'center', fontWeight: 600 }}>Attempts</th>
                  <th style={{ padding: 12, textAlign: 'center', fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {studentProgress.map((student, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: idx < studentProgress.length - 1 ? '1px solid #e2e8f0' : 'none'
                    }}
                  >
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>
                        {student.name || `Student ${idx + 1}`}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {student.overall_mastery && `${(student.overall_mastery * 100).toFixed(1)}% avg`}
                      </div>
                    </td>
                    <td style={{ padding: 12, textAlign: 'center' }}>
                      <MasteryBar value={student.overall_mastery || 0} />
                    </td>
                    <td style={{ padding: 12, textAlign: 'center', color: '#64748b' }}>
                      {student.total_attempts || 0}
                    </td>
                    <td style={{ padding: 12, textAlign: 'center' }}>
                      <StatusBadge mastery={student.overall_mastery || 0} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Topic Mastery Heatmap */}
      {topicMastery.length > 0 && (
        <div>
          <h3 style={{
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 12,
            color: '#0f172a'
          }}>
            Topic Mastery Across Class
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: 12
          }}>
            {topicMastery.map((topic, idx) => (
              <TopicCard key={idx} topic={topic} />
            ))}
          </div>
        </div>
      )}

      {/* Recommendations Summary */}
      {recommendations.length > 0 && (
        <div>
          <h3 style={{
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 12,
            color: '#0f172a'
          }}>
            Recommended Interventions
          </h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            {recommendations.slice(0, 5).map((rec, idx) => (
              <RecommendationCard key={idx} recommendation={rec} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, emoji, trend }) {
  return (
    <div style={{
      background: 'white',
      border: '1.5px solid #e2e8f0',
      borderRadius: 12,
      padding: 16,
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        background: 'linear-gradient(135deg, #399aff, #2e7dd1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
        flexShrink: 0
      }}>
        {emoji}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
          {label}
        </div>
        <div style={{
          fontSize: 24,
          fontWeight: 700,
          color: '#0f172a'
        }}>
          {value}
        </div>
        {trend !== null && trend !== undefined && (
          <div style={{ fontSize: 11, color: trend > 0 ? '#10b981' : '#ef4444', marginTop: 4 }}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)} today
          </div>
        )}
      </div>
    </div>
  )
}

function MasteryBar({ value }) {
  const percentage = Math.min(100, Math.max(0, value * 100))
  const color = percentage < 50 ? '#ef4444' : percentage < 70 ? '#f59e0b' : '#10b981'

  return (
    <div style={{
      width: '100%',
      maxWidth: 150,
      height: 8,
      background: '#e2e8f0',
      borderRadius: 4,
      overflow: 'hidden',
      margin: '0 auto'
    }}>
      <div
        style={{
          width: `${percentage}%`,
          height: '100%',
          background: color,
          transition: 'width 0.3s ease'
        }}
      />
    </div>
  )
}

function StatusBadge({ mastery }) {
  let status, color, bgColor
  if (mastery < 0.5) {
    status = 'At Risk'
    color = '#ef4444'
    bgColor = '#fee2e2'
  } else if (mastery < 0.7) {
    status = 'In Progress'
    color = '#f59e0b'
    bgColor = '#fef3c7'
  } else if (mastery < 0.8) {
    status = 'Proficient'
    color = '#10b981'
    bgColor = '#d1fae5'
  } else {
    status = 'Advanced'
    color = '#399aff'
    bgColor = '#e0f2fe'
  }

  return (
    <div style={{
      display: 'inline-block',
      background: bgColor,
      color,
      padding: '4px 10px',
      borderRadius: 8,
      fontSize: 11,
      fontWeight: 600
    }}>
      {status}
    </div>
  )
}

function TopicCard({ topic }) {
  const avgMastery = topic.average_mastery || 0
  const percentage = Math.min(100, Math.max(0, avgMastery * 100))

  return (
    <div style={{
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: 12,
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }}>
      <div style={{
        fontSize: 13,
        fontWeight: 600,
        color: '#0f172a'
      }}>
        {topic.topic || 'Unknown'}
      </div>
      <MasteryBar value={avgMastery} />
      <div style={{
        fontSize: 11,
        color: '#64748b',
        textAlign: 'center'
      }}>
        {percentage.toFixed(0)}% mastered
      </div>
    </div>
  )
}

function RecommendationCard({ recommendation }) {
  const priorityColor = recommendation.priority > 0.8 ? '#ef4444' : recommendation.priority > 0.5 ? '#f59e0b' : '#10b981'

  return (
    <div style={{
      background: 'white',
      border: `2px solid ${priorityColor}`,
      borderRadius: 12,
      padding: 14,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12
    }}>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#0f172a',
          marginBottom: 4
        }}>
          {recommendation.student_name || 'Student'} - {recommendation.recommended_language}
        </div>
        <div style={{
          fontSize: 12,
          color: '#64748b'
        }}>
          {recommendation.reasoning}
        </div>
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 4
      }}>
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          color: priorityColor,
          background: 'rgba(0,0,0,0.05)',
          padding: '4px 8px',
          borderRadius: 6
        }}>
          Priority: {(recommendation.priority * 100).toFixed(0)}%
        </div>
        <div style={{
          fontSize: 11,
          color: '#64748b'
        }}>
          {recommendation.difficulty_level}
        </div>
      </div>
    </div>
  )
}
