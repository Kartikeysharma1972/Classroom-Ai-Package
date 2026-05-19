import React, { useRef, useState } from 'react'

export function useToast() {
  const [toast, setToast] = useState({ msg: '', show: false })
  const timer = useRef()
  const showToast = (msg) => {
    clearTimeout(timer.current)
    setToast({ msg, show: true })
    timer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2700)
  }
  return { toast, showToast }
}

export function Toast({ toast }) {
  return (
    <div className={`toast-wrap ${toast.show ? 'show' : ''}`}>
      <div className="toast">{toast.msg}</div>
    </div>
  )
}

export function downloadTxt(content, filename) {
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ── PDF DOWNLOAD ──────────────────────────────────────
function downloadPDF(content, toolName) {
  const script = document.createElement('script')
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
  script.onload = () => {
    const { jsPDF } = window.jspdf
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const pageW   = doc.internal.pageSize.getWidth()
    const pageH   = doc.internal.pageSize.getHeight()
    const margin  = 15
    const maxW    = pageW - margin * 2
    let y         = margin

    const lines = content.split('\n')

    lines.forEach(line => {
      const trimmed = line.trim()

      if (y > pageH - margin) { doc.addPage(); y = margin }
      if (!trimmed) { y += 4; return }

      // ── Heading ──
      const hMatch = trimmed.match(/^(#{1,4})\s+(.+)/)
      const isBoldOnly = /^\*\*[^*]+\*\*$/.test(trimmed)

      if (hMatch || isBoldOnly) {
        const text = hMatch ? hMatch[2].replace(/\*\*([^*]+)\*\*/g, '$1') : trimmed.slice(2, -2)
        const level = hMatch ? hMatch[1].length : 2
        const size  = level === 1 ? 14 : level === 2 ? 12 : 11
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(size)
        doc.setTextColor(10, 10, 10) // True black
        y += level <= 2 ? 4 : 2
        const wrapped = doc.splitTextToSize(text, maxW)
        if (y + wrapped.length * 6 > pageH - margin) { doc.addPage(); y = margin }
        doc.text(wrapped, margin, y)
        y += wrapped.length * 6 + 3
        // Draw underline for h1/h2
        if (level <= 2) {
          doc.setDrawColor(57, 154, 255)
          doc.setLineWidth(0.4)
          doc.line(margin, y - 1, margin + maxW * 0.35, y - 1)
          y += 2
        }
        return
      }

      // ── Numbered question ──
      const qMatch = trimmed.match(/^(\d+)[.)]\s+(.+)/)
      if (qMatch) {
        const clean = qMatch[2].replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(57, 154, 255) // Blue number
        doc.text(`${qMatch[1]}.`, margin, y)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(10, 10, 10)
        const wrapped = doc.splitTextToSize(clean, maxW - 8)
        if (y + wrapped.length * 5.5 > pageH - margin) { doc.addPage(); y = margin }
        doc.text(wrapped, margin + 8, y)
        y += wrapped.length * 5.5 + 2
        return
      }

      // ── Answer option A) B) C) D) ──
      const optMatch = trimmed.match(/^([A-Da-d])[.)]\s+(.+)/)
      if (optMatch) {
        const clean = optMatch[2].replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9.5)
        doc.setTextColor(57, 154, 255)
        doc.text(`${optMatch[1].toUpperCase()})`, margin + 6, y)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(40, 40, 40)
        const wrapped = doc.splitTextToSize(clean, maxW - 16)
        if (y + wrapped.length * 5 > pageH - margin) { doc.addPage(); y = margin }
        doc.text(wrapped, margin + 14, y)
        y += wrapped.length * 5 + 1.5
        return
      }

      // ── Bullet ──
      if (/^[-•*]\s+/.test(trimmed)) {
        const text = trimmed.replace(/^[-•*]\s+/, '').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1')
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(57, 154, 255)
        doc.text('•', margin + 4, y)
        doc.setTextColor(40, 40, 40)
        const wrapped = doc.splitTextToSize(text, maxW - 10)
        if (y + wrapped.length * 5.5 > pageH - margin) { doc.addPage(); y = margin }
        doc.text(wrapped, margin + 10, y)
        y += wrapped.length * 5.5 + 1.5
        return
      }

      // ── Horizontal rule ──
      if (/^[-=]{3,}$/.test(trimmed)) {
        doc.setDrawColor(200, 200, 200)
        doc.setLineWidth(0.3)
        doc.line(margin, y, margin + maxW, y)
        y += 4
        return
      }

      // ── Normal paragraph ──
      const clean = trimmed.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(40, 60, 90) // Dark blue-gray
      const wrapped = doc.splitTextToSize(clean, maxW)
      if (y + wrapped.length * 5.5 > pageH - margin) { doc.addPage(); y = margin }
      doc.text(wrapped, margin, y)
      y += wrapped.length * 5.5 + 2
    })

    doc.save(`${toolName.replace(/\s+/g, '-')}.pdf`)
  }
  document.head.appendChild(script)
}

// ── INLINE RENDERER ───────────────────────────────────
function InlineLine({ text, color }) {
  const parts = []
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g
  let last = 0, m
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push({ type: 'text', val: text.slice(last, m.index) })
    if (m[0].startsWith('**')) parts.push({ type: 'bold', val: m[0].slice(2, -2) })
    else parts.push({ type: 'italic', val: m[0].slice(1, -1) })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ type: 'text', val: text.slice(last) })
  return (
    <>
      {parts.map((p, i) =>
        p.type === 'bold'   ? <strong key={i} style={{ color: '#0a0a0a', fontWeight: 700 }}>{p.val}</strong> :
        p.type === 'italic' ? <em key={i} style={{ color: color || '#2563eb', fontStyle: 'italic' }}>{p.val}</em> :
        <span key={i}>{p.val}</span>
      )}
    </>
  )
}

function isHeaderFillLine(line) {
  const t = line.trim()
  return /^_{3,}\s*\(?(name|date|class|subject|teacher|school|student)\)?[:\s]*$/i.test(t) ||
         /^(name|date|class|subject|teacher|school|student)\s*:\s*_{3,}$/i.test(t) ||
         /^_{3,}\s*(name|date|class|subject|teacher|school|student)\s*$/i.test(t)
}

function extractHeaderLabel(line) {
  const m = line.match(/\(?(name|date|class|subject|teacher|school|student)\)?/i)
  return m ? m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase() : ''
}

// ── CONTENT PARSER ────────────────────────────────────
function parseContent(text) {
  const lines = text.split('\n')
  const blocks = []
  let i = 0
  const headerFills = []
  const scanLimit = Math.min(lines.length, 10)
  const usedIndices = new Set()
  for (let j = 0; j < scanLimit; j++) {
    if (isHeaderFillLine(lines[j])) {
      headerFills.push(extractHeaderLabel(lines[j]))
      usedIndices.add(j)
    }
  }
  while (i < lines.length) {
    if (usedIndices.has(i)) { i++; continue }
    const line = lines[i]
    const trimmed = line.trim()
    if (!trimmed) { blocks.push({ type: 'blank' }); i++; continue }
    // Horizontal rule
    if (/^[-=]{3,}$/.test(trimmed)) { blocks.push({ type: 'hr' }); i++; continue }
    // Headings
    const hMatch = trimmed.match(/^(#{1,4})\s+(.+)/)
    if (hMatch) { blocks.push({ type: 'heading', level: hMatch[1].length, text: hMatch[2] }); i++; continue }
    if (/^\*\*[^*]+\*\*$/.test(trimmed)) { blocks.push({ type: 'heading', level: 3, text: trimmed.slice(2, -2) }); i++; continue }
    // Numbered items
    const qMatch = trimmed.match(/^(\d+)[.)]\s+(.+)/)
    if (qMatch) { blocks.push({ type: 'question', num: qMatch[1], text: qMatch[2] }); i++; continue }
    // Options
    const optMatch = trimmed.match(/^([A-Da-d])[.)]\s+(.+)/)
    if (optMatch) { blocks.push({ type: 'option', label: optMatch[1].toUpperCase(), text: optMatch[2] }); i++; continue }
    // Bullets
    if (/^[-•*]\s+/.test(trimmed)) { blocks.push({ type: 'bullet', text: trimmed.replace(/^[-•*]\s+/, '') }); i++; continue }
    // Table row
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) { blocks.push({ type: 'table_row', text: trimmed }); i++; continue }
    // Normal paragraph
    blocks.push({ type: 'para', text: trimmed }); i++
  }
  return { blocks, headerFills }
}

// ── RENDERED OUTPUT (THE MAIN VISUAL ENGINE) ──────────
function RenderedOutput({ text }) {
  const { blocks, headerFills } = parseContent(text)

  // Collect table rows into groups
  const renderBlocks = []
  let tableBuffer = []
  blocks.forEach((b, i) => {
    if (b.type === 'table_row') {
      tableBuffer.push(b.text)
    } else {
      if (tableBuffer.length > 0) {
        renderBlocks.push({ type: 'table', rows: [...tableBuffer] })
        tableBuffer = []
      }
      renderBlocks.push(b)
    }
  })
  if (tableBuffer.length > 0) renderBlocks.push({ type: 'table', rows: [...tableBuffer] })

  return (
    <div style={{ fontFamily: 'var(--font, "Inter", system-ui, sans-serif)', fontSize: '0.88rem', lineHeight: 1.85, color: '#2563eb' }}>

      {/* Header fill fields */}
      {headerFills.length > 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8,
          marginBottom: 24, paddingBottom: 16,
          borderBottom: '2px solid #e5e7eb',
        }}>
          {headerFills.map(label => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0a0a0a', minWidth: 70 }}>{label}:</span>
              <div style={{ width: 200, borderBottom: '1.5px solid #94a3b8', height: 22 }} />
            </div>
          ))}
        </div>
      )}

      {renderBlocks.map((b, i) => {
        if (b.type === 'blank') return <div key={i} style={{ height: 8 }} />

        if (b.type === 'hr') return (
          <div key={i} style={{ height: 1, background: 'linear-gradient(90deg, #e5e7eb 0%, #bfdbfe 50%, #e5e7eb 100%)', margin: '16px 0' }} />
        )

        if (b.type === 'heading') {
          const isH1 = b.level === 1
          const isH2 = b.level === 2
          return (
            <div key={i} style={{
              fontWeight: 800,
              fontSize: isH1 ? '1.25rem' : isH2 ? '1.08rem' : b.level === 3 ? '0.96rem' : '0.9rem',
              color: '#0a0a0a',
              marginTop: isH1 ? 28 : isH2 ? 22 : 16,
              marginBottom: isH1 || isH2 ? 8 : 5,
              paddingBottom: isH1 || isH2 ? 8 : 0,
              borderBottom: isH1 ? '2.5px solid #2563eb' : isH2 ? '1.5px solid #bfdbfe' : 'none',
              letterSpacing: isH1 ? '-0.3px' : '-0.1px',
              lineHeight: 1.4,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {isH1 && <span style={{ width: 4, height: 20, background: '#2563eb', borderRadius: 2, flexShrink: 0 }} />}
              <InlineLine text={b.text} color="#0a0a0a" />
            </div>
          )
        }

        if (b.type === 'question') return (
          <div key={i} style={{
            marginTop: 16, marginBottom: 4, display: 'flex', gap: 8, alignItems: 'flex-start',
            paddingLeft: 2,
          }}>
            <span style={{
              fontWeight: 800, color: '#2563eb', minWidth: 28, textAlign: 'right',
              fontSize: '0.9rem', paddingTop: 1, flexShrink: 0,
            }}>{b.num}.</span>
            <span style={{ color: '#1e293b', fontWeight: 500, flex: 1 }}>
              <InlineLine text={b.text} color="#1e293b" />
            </span>
          </div>
        )

        if (b.type === 'option') return (
          <div key={i} style={{
            paddingLeft: 42, marginBottom: 3, display: 'flex', gap: 8, alignItems: 'baseline',
          }}>
            <span style={{
              fontWeight: 700, color: '#2563eb', minWidth: 24,
              fontSize: '0.84rem',
              background: '#eff6ff', borderRadius: 4, padding: '1px 6px',
              textAlign: 'center', flexShrink: 0,
            }}>{b.label}</span>
            <span style={{ color: '#334155' }}>
              <InlineLine text={b.text} color="#334155" />
            </span>
          </div>
        )

        if (b.type === 'bullet') return (
          <div key={i} style={{
            paddingLeft: 16, marginBottom: 4, display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <span style={{
              color: '#2563eb', fontWeight: 700, fontSize: '0.5rem', marginTop: 8,
              flexShrink: 0,
            }}>●</span>
            <span style={{ color: '#334155', flex: 1 }}>
              <InlineLine text={b.text} color="#334155" />
            </span>
          </div>
        )

        // Table rendering
        if (b.type === 'table') {
          const rows = b.rows
            .filter(r => !/^[|:\-\s]+$/.test(r)) // skip separator rows
            .map(r => r.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length).map(c => c.trim()))
          if (rows.length === 0) return null
          const header = rows[0]
          const body = rows.slice(1)
          return (
            <div key={i} style={{ margin: '14px 0', overflowX: 'auto', borderRadius: 10, border: '1.5px solid #e2e8f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#f0f7ff' }}>
                    {header.map((h, hi) => (
                      <th key={hi} style={{
                        padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#0a0a0a',
                        borderBottom: '2px solid #bfdbfe', fontSize: '0.82rem',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {body.map((row, ri) => (
                    <tr key={ri} style={{ background: ri % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      {row.map((cell, ci) => (
                        <td key={ci} style={{
                          padding: '8px 14px', color: '#334155', borderBottom: '1px solid #f1f5f9',
                          fontWeight: ci === 0 ? 600 : 400,
                        }}><InlineLine text={cell} color="#334155" /></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }

        // Paragraph
        return (
          <p key={i} style={{ margin: '5px 0 8px', color: '#334155', paddingLeft: 2, lineHeight: 1.8 }}>
            <InlineLine text={b.text} color="#334155" />
          </p>
        )
      })}
    </div>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────
export default function OutputBox({ result, loading, toolName = 'output', icon, onClear, onEdit }) {
  const [toastState, setToastState] = useState({ msg: '', show: false })
  const [pdfLoading, setPdfLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const editRef = useRef(null)
  const timer = useRef()

  const showToast = (msg) => {
    clearTimeout(timer.current)
    setToastState({ msg, show: true })
    timer.current = setTimeout(() => setToastState(t => ({ ...t, show: false })), 2700)
  }

  const handleCopy = async () => {
    const text = editing ? editText : result
    try { await navigator.clipboard.writeText(text); showToast('Copied to clipboard!') }
    catch { showToast('Could not copy') }
  }

  const handleDownloadTxt = () => {
    const text = editing ? editText : result
    downloadTxt(text, `${toolName.replace(/\s+/g, '-')}.txt`)
    showToast('Downloaded as TXT!')
  }

  const handleDownloadPDF = () => {
    const text = editing ? editText : result
    setPdfLoading(true)
    showToast('Preparing PDF…')
    setTimeout(() => {
      downloadPDF(text, toolName)
      setPdfLoading(false)
      showToast('Downloaded as PDF!')
    }, 300)
  }

  const startEdit = () => {
    setEditText(result)
    setEditing(true)
    setTimeout(() => { if (editRef.current) editRef.current.focus() }, 50)
  }

  const saveEdit = () => {
    if (onEdit) onEdit(editText)
    setEditing(false)
    showToast('Changes saved!')
  }

  const cancelEdit = () => {
    setEditing(false)
    setEditText('')
  }

  // Handle keyboard shortcuts in editor
  const handleEditorKey = (e) => {
    // Ctrl+S / Cmd+S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      saveEdit()
    }
    // Escape to cancel
    if (e.key === 'Escape') {
      cancelEdit()
    }
    // Tab to indent
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = e.target
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const val = ta.value
      const newVal = val.substring(0, start) + '  ' + val.substring(end)
      setEditText(newVal)
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + 2 }, 0)
    }
  }

  const isEmpty = !result && !loading

  return (
    <>
      <div className="output-box" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header bar */}
        <div className="output-box-header">
          <div className="output-box-title">
            {icon || (
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            )}
            {editing ? 'Editing Output' : 'Generated Output'}
            {editing && (
              <span style={{
                fontSize: '0.65rem', fontWeight: 600, background: '#fef3c7', color: '#92400e',
                padding: '2px 8px', borderRadius: 100, marginLeft: 6, letterSpacing: '0.3px',
              }}>EDIT MODE</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {result && !editing && (
              <>
                {onEdit && (
                  <button className="btn btn-ghost" style={{
                    padding: '6px 12px', fontSize: 12,
                    color: '#7c3aed', borderColor: '#ddd6fe',
                    background: '#f5f3ff',
                  }} onClick={startEdit}>
                    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                  </button>
                )}

                <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={handleCopy}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Copy
                </button>

                <button className="btn btn-ghost" onClick={handleDownloadTxt}
                  style={{ padding: '6px 12px', fontSize: 12, color: '#16a34a', borderColor: '#bbf7d0' }}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  TXT
                </button>

                <button className="btn btn-ghost" onClick={handleDownloadPDF} disabled={pdfLoading}
                  style={{ padding: '6px 12px', fontSize: 12, color: '#dc2626', borderColor: '#fecaca', opacity: pdfLoading ? 0.6 : 1 }}>
                  {pdfLoading
                    ? <div style={{ width: 12, height: 12, border: '2px solid #fecaca', borderTopColor: '#dc2626', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    : <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  }
                  PDF
                </button>

                <button className="btn btn-ghost" onClick={onClear}
                  style={{ padding: '6px 12px', fontSize: 12, color: '#ef4444', borderColor: '#fecaca' }}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  Clear
                </button>
              </>
            )}

            {/* Edit mode toolbar */}
            {editing && (
              <>
                <button className="btn" style={{
                  padding: '6px 16px', fontSize: 12, fontWeight: 700,
                  background: '#7c3aed', color: '#fff',
                  borderRadius: 8, border: 'none',
                  boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
                }} onClick={saveEdit}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Save
                </button>

                <button className="btn btn-ghost" style={{
                  padding: '6px 12px', fontSize: 12, color: '#64748b',
                }} onClick={cancelEdit}>
                  Cancel
                </button>

                <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={handleCopy}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Copy
                </button>

                <button className="btn btn-ghost" onClick={handleDownloadTxt}
                  style={{ padding: '6px 12px', fontSize: 12, color: '#16a34a', borderColor: '#bbf7d0' }}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  TXT
                </button>

                <button className="btn btn-ghost" onClick={handleDownloadPDF} disabled={pdfLoading}
                  style={{ padding: '6px 12px', fontSize: 12, color: '#dc2626', borderColor: '#fecaca', opacity: pdfLoading ? 0.6 : 1 }}>
                  {pdfLoading
                    ? <div style={{ width: 12, height: 12, border: '2px solid #fecaca', borderTopColor: '#dc2626', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    : <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  }
                  PDF
                </button>
              </>
            )}
          </div>
        </div>

        {/* Edit mode hint bar */}
        {editing && (
          <div style={{
            padding: '6px 20px',
            background: 'linear-gradient(90deg, #faf5ff, #f5f3ff)',
            borderBottom: '1px solid #ede9fe',
            display: 'flex', alignItems: 'center', gap: 16,
            fontSize: '0.72rem', color: '#7c3aed', fontWeight: 500,
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <kbd style={{ background: '#ede9fe', padding: '1px 5px', borderRadius: 4, fontSize: '0.68rem', fontWeight: 700, fontFamily: 'monospace' }}>Ctrl+S</kbd> Save
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <kbd style={{ background: '#ede9fe', padding: '1px 5px', borderRadius: 4, fontSize: '0.68rem', fontWeight: 700, fontFamily: 'monospace' }}>Esc</kbd> Cancel
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <kbd style={{ background: '#ede9fe', padding: '1px 5px', borderRadius: 4, fontSize: '0.68rem', fontWeight: 700, fontFamily: 'monospace' }}>Tab</kbd> Indent
            </span>
            <span style={{ marginLeft: 'auto', color: '#a78bfa', fontSize: '0.7rem' }}>
              Edit markdown directly — changes reflect in preview, PDF & downloads
            </span>
          </div>
        )}

        {/* Scrollable content */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: editing ? 0 : '28px 28px', scrollbarWidth: 'thin', scrollbarColor: '#bfdbfe transparent' }}>
          {isEmpty && (
            <div className="output-placeholder">
              <div className="output-placeholder-icon">
                <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </div>
              <p>Your {toolName} will appear here</p>
              <span>Fill in the form and click Generate</span>
            </div>
          )}
          {loading && (
            <div className="loader">
              <div className="spinner"/>
              <p>Generating with AI…</p>
            </div>
          )}
          {result && !loading && !editing && (
            <div style={{ animation: 'fadeUp 0.4s ease' }}>
              <RenderedOutput text={result} />
            </div>
          )}
          {editing && (
            <textarea
              ref={editRef}
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onKeyDown={handleEditorKey}
              spellCheck={false}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                outline: 'none',
                resize: 'none',
                padding: '20px 24px',
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                fontSize: '0.84rem',
                lineHeight: 1.9,
                color: '#1e293b',
                background: '#fefefe',
                caretColor: '#7c3aed',
                tabSize: 2,
              }}
            />
          )}
        </div>
      </div>

      <div className={`toast-wrap ${toastState.show ? 'show' : ''}`}>
        <div className="toast">{toastState.msg}</div>
      </div>
    </>
  )
}
