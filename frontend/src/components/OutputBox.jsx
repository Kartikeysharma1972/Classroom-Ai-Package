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
  // Dynamically load jsPDF from CDN
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

      // Page break check
      if (y > pageH - margin) {
        doc.addPage()
        y = margin
      }

      if (!trimmed) {
        y += 4
        return
      }

      // Heading detection (bold-only line or ### ## #)
      const hMatch = trimmed.match(/^(#{1,4})\s+(.+)/)
      const isBoldOnly = /^\*\*[^*]+\*\*$/.test(trimmed)

      if (hMatch || isBoldOnly) {
        const text = hMatch ? hMatch[2] : trimmed.slice(2, -2)
        const level = hMatch ? hMatch[1].length : 2
        const size  = level === 1 ? 14 : level === 2 ? 12 : 11
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(size)
        doc.setTextColor(11, 27, 45)
        const wrapped = doc.splitTextToSize(text, maxW)
        if (y + wrapped.length * 6 > pageH - margin) { doc.addPage(); y = margin }
        doc.text(wrapped, margin, y)
        y += wrapped.length * 6 + 3
        return
      }

      // Numbered question
      const qMatch = trimmed.match(/^(\d+)[.)]\s+(.+)/)
      if (qMatch) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(57, 154, 255)
        doc.text(`${qMatch[1]}.`, margin, y)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(11, 27, 45)
        const wrapped = doc.splitTextToSize(qMatch[2], maxW - 8)
        if (y + wrapped.length * 5.5 > pageH - margin) { doc.addPage(); y = margin }
        doc.text(wrapped, margin + 8, y)
        y += wrapped.length * 5.5 + 2
        return
      }

      // Answer option A) B) C) D)
      const optMatch = trimmed.match(/^([A-Da-d])[.)]\s+(.+)/)
      if (optMatch) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9.5)
        doc.setTextColor(61, 85, 110)
        doc.text(`${optMatch[1].toUpperCase()})`, margin + 6, y)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(11, 27, 45)
        const wrapped = doc.splitTextToSize(optMatch[2], maxW - 16)
        if (y + wrapped.length * 5 > pageH - margin) { doc.addPage(); y = margin }
        doc.text(wrapped, margin + 14, y)
        y += wrapped.length * 5 + 1.5
        return
      }

      // Bullet
      if (/^[-•*]\s+/.test(trimmed)) {
        const text = trimmed.replace(/^[-•*]\s+/, '')
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(11, 27, 45)
        doc.text('•', margin + 4, y)
        const wrapped = doc.splitTextToSize(text, maxW - 10)
        if (y + wrapped.length * 5.5 > pageH - margin) { doc.addPage(); y = margin }
        doc.text(wrapped, margin + 10, y)
        y += wrapped.length * 5.5 + 1.5
        return
      }

      // Normal paragraph — strip **bold** markers for PDF
      const clean = trimmed.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(61, 85, 110)
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
function InlineLine({ text }) {
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
        p.type === 'bold'   ? <strong key={i}>{p.val}</strong> :
        p.type === 'italic' ? <em key={i}>{p.val}</em> :
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
    const hMatch = trimmed.match(/^(#{1,4})\s+(.+)/)
    if (hMatch) { blocks.push({ type: 'heading', level: hMatch[1].length, text: hMatch[2] }); i++; continue }
    if (/^\*\*[^*]+\*\*$/.test(trimmed)) { blocks.push({ type: 'heading', level: 3, text: trimmed.slice(2, -2) }); i++; continue }
    const qMatch = trimmed.match(/^(\d+)[.)]\s+(.+)/)
    if (qMatch) { blocks.push({ type: 'question', num: qMatch[1], text: qMatch[2] }); i++; continue }
    const optMatch = trimmed.match(/^([A-Da-d])[.)]\s+(.+)/)
    if (optMatch) { blocks.push({ type: 'option', label: optMatch[1].toUpperCase(), text: optMatch[2] }); i++; continue }
    if (/^[-•*]\s+/.test(trimmed)) { blocks.push({ type: 'bullet', text: trimmed.replace(/^[-•*]\s+/, '') }); i++; continue }
    blocks.push({ type: 'para', text: trimmed }); i++
  }
  return { blocks, headerFills }
}

function RenderedOutput({ text }) {
  const { blocks, headerFills } = parseContent(text)
  return (
    <div style={{ fontFamily: 'var(--font, inherit)', fontSize: '0.92rem', lineHeight: 1.8, color: 'var(--text-1)' }}>
      {headerFills.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, marginBottom: 20, paddingBottom: 14, borderBottom: '1px dashed var(--border, #e5e7eb)' }}>
          {headerFills.map(label => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-2)', minWidth: 56 }}>{label}:</span>
              <div style={{ width: 180, borderBottom: '1.5px solid var(--text-1, #1e1e2e)', height: 22, display: 'inline-block' }} />
            </div>
          ))}
        </div>
      )}
      {blocks.map((b, i) => {
        if (b.type === 'blank') return <div key={i} style={{ height: 10 }} />
        if (b.type === 'heading') {
          const sizes = { 1: '1.2rem', 2: '1.05rem', 3: '0.97rem', 4: '0.92rem' }
          return <div key={i} style={{ fontWeight: 700, fontSize: sizes[b.level] || '0.97rem', color: 'var(--text-1)', marginTop: b.level <= 2 ? 20 : 14, marginBottom: 6 }}><InlineLine text={b.text} /></div>
        }
        if (b.type === 'question') return (
          <div key={i} style={{ marginTop: 18, marginBottom: 4 }}>
            <span style={{ fontWeight: 700, color: 'var(--accent)', marginRight: 6 }}>{b.num}.</span>
            <InlineLine text={b.text} />
          </div>
        )
        if (b.type === 'option') return (
          <div key={i} style={{ paddingLeft: 24, marginBottom: 2, display: 'flex', gap: 8, alignItems: 'baseline' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-2)', minWidth: 20 }}>{b.label})</span>
            <InlineLine text={b.text} />
          </div>
        )
        if (b.type === 'bullet') return (
          <div key={i} style={{ paddingLeft: 20, marginBottom: 3, display: 'flex', gap: 8, alignItems: 'baseline' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.7rem', marginTop: 4 }}>●</span>
            <InlineLine text={b.text} />
          </div>
        )
        return <p key={i} style={{ margin: '4px 0 8px', color: 'var(--text-2)' }}><InlineLine text={b.text} /></p>
      })}
    </div>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────
export default function OutputBox({ result, loading, toolName = 'output', icon, onClear }) {
  const [toastState, setToastState] = useState({ msg: '', show: false })
  const [pdfLoading, setPdfLoading] = useState(false)
  const timer = useRef()

  const showToast = (msg) => {
    clearTimeout(timer.current)
    setToastState({ msg, show: true })
    timer.current = setTimeout(() => setToastState(t => ({ ...t, show: false })), 2700)
  }

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(result); showToast('Copied to clipboard!') }
    catch { showToast('Could not copy') }
  }

  const handleDownloadTxt = () => {
    downloadTxt(result, `${toolName.replace(/\s+/g, '-')}.txt`)
    showToast('Downloaded as TXT!')
  }

  const handleDownloadPDF = () => {
    setPdfLoading(true)
    showToast('Preparing PDF…')
    setTimeout(() => {
      downloadPDF(result, toolName)
      setPdfLoading(false)
      showToast('Downloaded as PDF!')
    }, 300)
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
            Generated Output
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {result && (
              <>
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
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px', scrollbarWidth: 'thin', scrollbarColor: 'var(--accent-mid) transparent' }}>
          {isEmpty && (
            <div className="output-placeholder">
              <div className="output-placeholder-icon">
                <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
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
          {result && !loading && (
            <div style={{ animation: 'fadeUp 0.4s ease' }}>
              <RenderedOutput text={result} />
            </div>
          )}
        </div>
      </div>

      <div className={`toast-wrap ${toastState.show ? 'show' : ''}`}>
        <div className="toast">{toastState.msg}</div>
      </div>
    </>
  )
}