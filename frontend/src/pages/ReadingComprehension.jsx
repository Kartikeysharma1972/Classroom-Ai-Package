import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import CompFormPage from './comprehension/CompFormPage'
import CompResultPage from './comprehension/CompResultPage'

const API = import.meta.env.DEV ? '' : ''

const BLOCKED_PATTERNS = [
  'porn(?:o|ography)?', 'pornographic',
  'masturbat\\w*', 'orgasm\\w*', 'erotic\\w*', 'fetish\\w*',
  'anal\\s+sex', 'oral\\s+sex',
  'sex\\s+(?:act|scene|tape|video|position|story|stories|fantasy)',
  'child\\s+porn', 'pedophil\\w*', 'incest',
  'fuck\\w*', 'cunt\\w*', 'pussy', 'whore', 'slut',
]

const BLOCKED_REGEX = new RegExp('\\b(?:' + BLOCKED_PATTERNS.join('|') + ')\\b', 'i')

const containsBlockedContent = (text = '') => BLOCKED_REGEX.test(text)

export default function ReadingComprehension() {
  const { teacherId } = useAuth()
  const [view, setView] = useState('form')
  const [sessionId, setSessionId] = useState(null)
  const [comprehension, setComprehension] = useState(null)
  const [formData, setFormData] = useState({})
  const [prefillData, setPrefillData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [streamStatus, setStreamStatus] = useState('')
  const [tabs, setTabs] = useState([])
  const sessionPromiseRef = useRef(null)

  const ensureSession = async () => {
    if (sessionId) return sessionId
    if (sessionPromiseRef.current) return sessionPromiseRef.current
    sessionPromiseRef.current = (async () => {
      try {
        const res = await fetch(`${API}/api/reading/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        })
        const data = await res.json()
        setSessionId(data.session_id)
        return data.session_id
      } finally {
        sessionPromiseRef.current = null
      }
    })()
    return sessionPromiseRef.current
  }

  const handleGenerate = async (data) => {
    if (containsBlockedContent(data.topic) || containsBlockedContent(data.learning_objective)) {
      setError('Inappropriate content detected. Please enter an educational topic suitable for classroom use.')
      return
    }
    setLoading(true)
    setError(null)
    setStreamStatus('')
    setFormData(data)
    try {
      try {
        const usageRes = await fetch(`${API}/api/increment-usage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teacher_id: teacherId, tool_name: 'comprehension' })
        })
        const usageData = await usageRes.json()
        if (usageData.exceeded) {
          setError(usageData.error || 'Daily limit exceeded. Try again tomorrow.')
          setLoading(false)
          return
        }
      } catch (e) { console.error('Usage check failed:', e) }

      const sid = await ensureSession()
      const res = await fetch(`${API}/api/reading/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, session_id: sid })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Generation failed')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          let evt
          try { evt = JSON.parse(line.slice(6)) } catch { continue }

          if (evt.type === 'progress' || evt.type === 'status') {
            setStreamStatus(evt.message)
          } else if (evt.type === 'retry') {
            setStreamStatus(`Retrying (attempt ${evt.attempt})…`)
          } else if (evt.type === 'complete') {
            setComprehension(evt.comprehension)
            setTabs(prev => {
              const label = `${data.topic} Reading Compr...`
              if (prev.find(t => t.label === label)) return prev
              return [...prev, { label, id: evt.comprehension_id }]
            })
            setView('result')
            try {
              fetch(`${API}/api/save-chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  teacher_id: teacherId, tool_name: 'comprehension',
                  topic: data.topic, grade_level: data.grade_level,
                  subject: 'Reading Comprehension',
                  request_data: data,
                  response_preview: `Reading comprehension: ${data.topic} (Grade ${data.grade_level})`,
                  response_content: JSON.stringify(evt.comprehension),
                })
              })
            } catch {}
          } else if (evt.type === 'error') {
            throw new Error(evt.message)
          }
        }
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
      setStreamStatus('')
    }
  }

  return (
    <div style={{ margin: '-24px -28px 0', minHeight: 'calc(100vh - var(--header-h))' }}>
      {view === 'form' && (
        <CompFormPage
          onGenerate={handleGenerate}
          onBack={() => window.history.back()}
          loading={loading}
          error={error}
          prefillData={prefillData}
          streamStatus={streamStatus}
        />
      )}
      {view === 'result' && comprehension && (
        <CompResultPage
          comprehension={comprehension}
          formData={formData}
          tabs={tabs}
          onNewTab={() => { setPrefillData(null); setView('form') }}
          onAdapt={(data) => { setPrefillData(data); setView('form') }}
          onRemix={(data) => handleGenerate(data)}
          onLoadFromHistory={(item) => {
            setComprehension(item.content)
            setFormData({
              topic: item.topic,
              grade_level: item.grade_level,
              learning_objective: item.learning_objective,
            })
            setTabs(prev => {
              const label = `${item.topic} Reading Compr...`
              if (prev.find(t => t.label === label)) return prev
              return [...prev, { label, id: item.id }]
            })
          }}
          onCloseTab={(idx) => {
            const newTabs = tabs.filter((_, i) => i !== idx)
            setTabs(newTabs)
            if (newTabs.length === 0) setView('form')
          }}
          api={API}
        />
      )}
    </div>
  )
}
