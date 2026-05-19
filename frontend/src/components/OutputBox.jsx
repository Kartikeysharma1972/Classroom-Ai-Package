import React, { useRef, useState, useCallback, useEffect } from 'react'

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
        doc.setTextColor(10, 10, 10)
        y += level <= 2 ? 4 : 2
        const wrapped = doc.splitTextToSize(text, maxW)
        if (y + wrapped.length * 6 > pageH - margin) { doc.addPage(); y = margin }
        doc.text(wrapped, margin, y)
        y += wrapped.length * 6 + 3
        if (level <= 2) {
          doc.setDrawColor(57, 154, 255)
          doc.setLineWidth(0.4)
          doc.line(margin, y - 1, margin + maxW * 0.35, y - 1)
          y += 2
        }
        return
      }

      const qMatch = trimmed.match(/^(\d+)[.)]\s+(.+)/)
      if (qMatch) {
        const clean = qMatch[2].replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(57, 154, 255)
        doc.text(`${qMatch[1]}.`, margin, y)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(10, 10, 10)
        const wrapped = doc.splitTextToSize(clean, maxW - 8)
        if (y + wrapped.length * 5.5 > pageH - margin) { doc.addPage(); y = margin }
        doc.text(wrapped, margin + 8, y)
        y += wrapped.length * 5.5 + 2
        return
      }

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

      if (/^[-=]{3,}$/.test(trimmed)) {
        doc.setDrawColor(200, 200, 200)
        doc.setLineWidth(0.3)
        doc.line(margin, y, margin + maxW, y)
        y += 4
        return
      }

      const clean = trimmed.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(40, 60, 90)
      const wrapped = doc.splitTextToSize(clean, maxW)
      if (y + wrapped.length * 5.5 > pageH - margin) { doc.addPage(); y = margin }
      doc.text(wrapped, margin, y)
      y += wrapped.length * 5.5 + 2
    })

    doc.save(`${toolName.replace(/\s+/g, '-')}.pdf`)
  }
  document.head.appendChild(script)
}

// ── MARKDOWN → HTML CONVERTER ────────────────────────
function markdownToHtml(md) {
  const lines = md.split('\n')
  const out = []
  let inUl = false, inOl = false

  for (const line of lines) {
    const t = line.trim()

    if (inUl && !/^[-•*]\s+/.test(t)) { out.push('</ul>'); inUl = false }
    if (inOl && !/^\d+[.)]\s/.test(t)) { out.push('</ol>'); inOl = false }

    const hM = t.match(/^(#{1,4})\s+(.+)/)
    if (hM) { out.push(`<h${hM[1].length}>${fmtInline(hM[2])}</h${hM[1].length}>`); continue }
    if (/^\*\*[^*]+\*\*$/.test(t)) { out.push(`<h3>${fmtInline(t)}</h3>`); continue }
    if (/^[-=]{3,}$/.test(t)) { out.push('<hr>'); continue }
    if (/^[-•*]\s+/.test(t)) {
      if (!inUl) { out.push('<ul>'); inUl = true }
      out.push(`<li>${fmtInline(t.replace(/^[-•*]\s+/, ''))}</li>`); continue
    }
    const nM = t.match(/^\d+[.)]\s+(.+)/)
    if (nM) {
      if (!inOl) { out.push('<ol>'); inOl = true }
      out.push(`<li>${fmtInline(nM[1])}</li>`); continue
    }
    if (!t) { out.push('<p><br></p>'); continue }
    out.push(`<p>${fmtInline(t)}</p>`)
  }
  if (inUl) out.push('</ul>')
  if (inOl) out.push('</ol>')
  return out.join('')
}

function fmtInline(s) {
  return s
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/__(.+?)__/g, '<u>$1</u>')
    .replace(/~~(.+?)~~/g, '<s>$1</s>')
}

// ── HTML → MARKDOWN CONVERTER ────────────────────────
function htmlToMarkdown(html) {
  let m = html
  m = m.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, c) => '# ' + strip(c) + '\n')
  m = m.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, c) => '## ' + strip(c) + '\n')
  m = m.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, c) => '### ' + strip(c) + '\n')
  m = m.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_, c) => '#### ' + strip(c) + '\n')
  m = m.replace(/<hr[^>]*>/gi, '---\n')
  m = m.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, c) => '- ' + stripKeepInline(c).trim() + '\n')
  m = m.replace(/<\/?[uo]l[^>]*>/gi, '')
  m = m.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
  m = m.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
  m = m.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
  m = m.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
  m = m.replace(/<u[^>]*>(.*?)<\/u>/gi, '__$1__')
  m = m.replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~')
  m = m.replace(/<del[^>]*>(.*?)<\/del>/gi, '~~$1~~')
  m = m.replace(/<br\s*\/?>/gi, '\n')
  m = m.replace(/<\/div>/gi, '\n')
  m = m.replace(/<div[^>]*>/gi, '')
  m = m.replace(/<\/p>/gi, '\n')
  m = m.replace(/<p[^>]*>/gi, '')
  m = m.replace(/<[^>]+>/g, '')
  m = m.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"')
  m = m.replace(/\n{3,}/g, '\n\n')
  return m.trim()
}

function strip(h) {
  return h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
}
function stripKeepInline(h) {
  let r = h
  r = r.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
  r = r.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
  r = r.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
  r = r.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
  r = r.replace(/<[^>]+>/g, '')
  return r
}

// ── RICH TEXT TOOLBAR (Google Docs style) ─────────────
export function RichTextToolbar({ editorRef, onSave, onCancel }) {
  const exec = (cmd, val = null) => {
    document.execCommand(cmd, false, val)
    if (editorRef.current) editorRef.current.focus()
  }

  const TB = { padding: '3px 7px', border: '1px solid #e2e8f0', borderRadius: 5, background: '#fff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 28, height: 28, transition: 'all 0.15s', lineHeight: 1, fontFamily: 'inherit' }
  const SEL = { ...TB, minWidth: 'unset', padding: '3px 6px', fontSize: '0.74rem', cursor: 'pointer', appearance: 'none', background: '#fff url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'10\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'3\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'/%3E%3C/svg%3E") no-repeat right 5px center', paddingRight: 20 }
  const DIV = { width: 1, height: 20, background: '#e2e8f0', margin: '0 3px', flexShrink: 0 }

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2,
      padding: '6px 12px', borderBottom: '1.5px solid #e5e7eb',
      background: '#f8fafc', userSelect: 'none',
    }}>
      {/* Undo / Redo */}
      <button style={TB} onClick={() => exec('undo')} title="Undo (Ctrl+Z)">
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
      </button>
      <button style={TB} onClick={() => exec('redo')} title="Redo (Ctrl+Y)">
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/></svg>
      </button>

      <div style={DIV} />

      {/* Heading */}
      <select style={{ ...SEL, width: 95 }} defaultValue="" onChange={e => { if (e.target.value) exec('formatBlock', e.target.value); e.target.value = '' }} title="Heading Style">
        <option value="" disabled>Style</option>
        <option value="p">Normal</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
        <option value="h4">Heading 4</option>
      </select>

      {/* Font size */}
      <select style={{ ...SEL, width: 58 }} defaultValue="3" onChange={e => exec('fontSize', e.target.value)} title="Font Size">
        <option value="1">8</option>
        <option value="2">10</option>
        <option value="3">12</option>
        <option value="4">14</option>
        <option value="5">18</option>
        <option value="6">24</option>
        <option value="7">36</option>
      </select>

      <div style={DIV} />

      {/* Bold */}
      <button style={{ ...TB, fontWeight: 800, fontSize: '0.85rem' }} onClick={() => exec('bold')} title="Bold (Ctrl+B)">B</button>
      {/* Italic */}
      <button style={{ ...TB, fontStyle: 'italic', fontFamily: 'Georgia, serif', fontSize: '0.85rem' }} onClick={() => exec('italic')} title="Italic (Ctrl+I)">I</button>
      {/* Underline */}
      <button style={{ ...TB, textDecoration: 'underline', fontSize: '0.85rem' }} onClick={() => exec('underline')} title="Underline (Ctrl+U)">U</button>
      {/* Strikethrough */}
      <button style={{ ...TB, textDecoration: 'line-through', fontSize: '0.85rem' }} onClick={() => exec('strikeThrough')} title="Strikethrough">S</button>

      <div style={DIV} />

      {/* Text Color */}
      <div style={{ position: 'relative', display: 'inline-flex' }}>
        <button style={{ ...TB, fontWeight: 800, fontSize: '0.85rem', borderBottom: '3px solid #dc2626', paddingBottom: 1 }} title="Text Color">A</button>
        <input type="color" defaultValue="#dc2626" onChange={e => exec('foreColor', e.target.value)}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
      </div>
      {/* Highlight */}
      <div style={{ position: 'relative', display: 'inline-flex' }}>
        <button style={{ ...TB, fontWeight: 800, fontSize: '0.85rem', background: '#fef08a' }} title="Highlight Color">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <input type="color" defaultValue="#fef08a" onChange={e => exec('hiliteColor', e.target.value)}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
      </div>

      <div style={DIV} />

      {/* Align */}
      <button style={TB} onClick={() => exec('justifyLeft')} title="Align Left">
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
      </button>
      <button style={TB} onClick={() => exec('justifyCenter')} title="Align Center">
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/></svg>
      </button>
      <button style={TB} onClick={() => exec('justifyRight')} title="Align Right">
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></svg>
      </button>

      <div style={DIV} />

      {/* Lists */}
      <button style={TB} onClick={() => exec('insertUnorderedList')} title="Bullet List">
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3.5" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="3.5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="3.5" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>
      </button>
      <button style={TB} onClick={() => exec('insertOrderedList')} title="Numbered List">
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/></svg>
      </button>

      <div style={DIV} />

      {/* Indent */}
      <button style={TB} onClick={() => exec('outdent')} title="Decrease Indent">
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><polyline points="7 8 3 12 7 16"/><line x1="21" y1="12" x2="11" y2="12"/><line x1="21" y1="6" x2="11" y2="6"/><line x1="21" y1="18" x2="11" y2="18"/></svg>
      </button>
      <button style={TB} onClick={() => exec('indent')} title="Increase Indent">
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><polyline points="3 8 7 12 3 16"/><line x1="21" y1="12" x2="11" y2="12"/><line x1="21" y1="6" x2="11" y2="6"/><line x1="21" y1="18" x2="11" y2="18"/></svg>
      </button>

      <div style={DIV} />

      {/* Clear Formatting */}
      <button style={{ ...TB, color: '#ef4444' }} onClick={() => exec('removeFormat')} title="Clear Formatting">
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>

      {/* Save & Cancel — right side */}
      {onSave && (
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button style={{
            padding: '4px 14px', borderRadius: 6, border: 'none', fontSize: '0.76rem', fontWeight: 700,
            background: '#7c3aed', color: '#fff', cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(124,58,237,0.25)', display: 'flex', alignItems: 'center', gap: 4,
          }} onClick={onSave} title="Save (Ctrl+S)">
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            Save
          </button>
          <button style={{
            padding: '4px 12px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: '0.76rem', fontWeight: 600,
            background: '#fff', color: '#64748b', cursor: 'pointer',
          }} onClick={onCancel}>
            Cancel
          </button>
        </div>
      )}
    </div>
  )
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
    if (/^[-=]{3,}$/.test(trimmed)) { blocks.push({ type: 'hr' }); i++; continue }
    const hMatch = trimmed.match(/^(#{1,4})\s+(.+)/)
    if (hMatch) { blocks.push({ type: 'heading', level: hMatch[1].length, text: hMatch[2] }); i++; continue }
    if (/^\*\*[^*]+\*\*$/.test(trimmed)) { blocks.push({ type: 'heading', level: 3, text: trimmed.slice(2, -2) }); i++; continue }
    const qMatch = trimmed.match(/^(\d+)[.)]\s+(.+)/)
    if (qMatch) { blocks.push({ type: 'question', num: qMatch[1], text: qMatch[2] }); i++; continue }
    const optMatch = trimmed.match(/^([A-Da-d])[.)]\s+(.+)/)
    if (optMatch) { blocks.push({ type: 'option', label: optMatch[1].toUpperCase(), text: optMatch[2] }); i++; continue }
    if (/^[-•*]\s+/.test(trimmed)) { blocks.push({ type: 'bullet', text: trimmed.replace(/^[-•*]\s+/, '') }); i++; continue }
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) { blocks.push({ type: 'table_row', text: trimmed }); i++; continue }
    blocks.push({ type: 'para', text: trimmed }); i++
  }
  return { blocks, headerFills }
}

// ── RENDERED OUTPUT (THE MAIN VISUAL ENGINE) ──────────
function RenderedOutput({ text }) {
  const { blocks, headerFills } = parseContent(text)
  const renderBlocks = []
  let tableBuffer = []
  blocks.forEach((b) => {
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
      {headerFills.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, marginBottom: 24, paddingBottom: 16, borderBottom: '2px solid #e5e7eb' }}>
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
        if (b.type === 'hr') return <div key={i} style={{ height: 1, background: 'linear-gradient(90deg, #e5e7eb 0%, #bfdbfe 50%, #e5e7eb 100%)', margin: '16px 0' }} />
        if (b.type === 'heading') {
          const isH1 = b.level === 1, isH2 = b.level === 2
          return (
            <div key={i} style={{
              fontWeight: 800, fontSize: isH1 ? '1.25rem' : isH2 ? '1.08rem' : b.level === 3 ? '0.96rem' : '0.9rem',
              color: '#0a0a0a', marginTop: isH1 ? 28 : isH2 ? 22 : 16, marginBottom: isH1 || isH2 ? 8 : 5,
              paddingBottom: isH1 || isH2 ? 8 : 0, borderBottom: isH1 ? '2.5px solid #2563eb' : isH2 ? '1.5px solid #bfdbfe' : 'none',
              letterSpacing: isH1 ? '-0.3px' : '-0.1px', lineHeight: 1.4, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {isH1 && <span style={{ width: 4, height: 20, background: '#2563eb', borderRadius: 2, flexShrink: 0 }} />}
              <InlineLine text={b.text} color="#0a0a0a" />
            </div>
          )
        }
        if (b.type === 'question') return (
          <div key={i} style={{ marginTop: 16, marginBottom: 4, display: 'flex', gap: 8, alignItems: 'flex-start', paddingLeft: 2 }}>
            <span style={{ fontWeight: 800, color: '#2563eb', minWidth: 28, textAlign: 'right', fontSize: '0.9rem', paddingTop: 1, flexShrink: 0 }}>{b.num}.</span>
            <span style={{ color: '#1e293b', fontWeight: 500, flex: 1 }}><InlineLine text={b.text} color="#1e293b" /></span>
          </div>
        )
        if (b.type === 'option') return (
          <div key={i} style={{ paddingLeft: 42, marginBottom: 3, display: 'flex', gap: 8, alignItems: 'baseline' }}>
            <span style={{ fontWeight: 700, color: '#2563eb', minWidth: 24, fontSize: '0.84rem', background: '#eff6ff', borderRadius: 4, padding: '1px 6px', textAlign: 'center', flexShrink: 0 }}>{b.label}</span>
            <span style={{ color: '#334155' }}><InlineLine text={b.text} color="#334155" /></span>
          </div>
        )
        if (b.type === 'bullet') return (
          <div key={i} style={{ paddingLeft: 16, marginBottom: 4, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ color: '#2563eb', fontWeight: 700, fontSize: '0.5rem', marginTop: 8, flexShrink: 0 }}>●</span>
            <span style={{ color: '#334155', flex: 1 }}><InlineLine text={b.text} color="#334155" /></span>
          </div>
        )
        if (b.type === 'table') {
          const rows = b.rows.filter(r => !/^[|:\-\s]+$/.test(r)).map(r => r.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length).map(c => c.trim()))
          if (rows.length === 0) return null
          const header = rows[0], body = rows.slice(1)
          return (
            <div key={i} style={{ margin: '14px 0', overflowX: 'auto', borderRadius: 10, border: '1.5px solid #e2e8f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead><tr style={{ background: '#f0f7ff' }}>{header.map((h, hi) => (
                  <th key={hi} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#0a0a0a', borderBottom: '2px solid #bfdbfe', fontSize: '0.82rem' }}>{h}</th>
                ))}</tr></thead>
                <tbody>{body.map((row, ri) => (
                  <tr key={ri} style={{ background: ri % 2 === 0 ? '#fff' : '#f8fafc' }}>{row.map((cell, ci) => (
                    <td key={ci} style={{ padding: '8px 14px', color: '#334155', borderBottom: '1px solid #f1f5f9', fontWeight: ci === 0 ? 600 : 400 }}><InlineLine text={cell} color="#334155" /></td>
                  ))}</tr>
                ))}</tbody>
              </table>
            </div>
          )
        }
        return <p key={i} style={{ margin: '5px 0 8px', color: '#334155', paddingLeft: 2, lineHeight: 1.8 }}><InlineLine text={b.text} color="#334155" /></p>
      })}
    </div>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────
export default function OutputBox({ result, loading, toolName = 'output', icon, onClear, onEdit }) {
  const [toastState, setToastState] = useState({ msg: '', show: false })
  const [pdfLoading, setPdfLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const editRef = useRef(null)
  const timer = useRef()

  const showToast = (msg) => {
    clearTimeout(timer.current)
    setToastState({ msg, show: true })
    timer.current = setTimeout(() => setToastState(t => ({ ...t, show: false })), 2700)
  }

  // Get current content (markdown) from editor
  const getEditMarkdown = useCallback(() => {
    if (!editRef.current) return result
    return htmlToMarkdown(editRef.current.innerHTML)
  }, [result])

  const handleCopy = async () => {
    const text = editing ? getEditMarkdown() : result
    try { await navigator.clipboard.writeText(text); showToast('Copied to clipboard!') }
    catch { showToast('Could not copy') }
  }

  const handleDownloadTxt = () => {
    const text = editing ? getEditMarkdown() : result
    downloadTxt(text, `${toolName.replace(/\s+/g, '-')}.txt`)
    showToast('Downloaded as TXT!')
  }

  const handleDownloadPDF = () => {
    const text = editing ? getEditMarkdown() : result
    setPdfLoading(true)
    showToast('Preparing PDF...')
    setTimeout(() => {
      downloadPDF(text, toolName)
      setPdfLoading(false)
      showToast('Downloaded as PDF!')
    }, 300)
  }

  const startEdit = () => {
    setEditing(true)
    setTimeout(() => {
      if (editRef.current) {
        editRef.current.innerHTML = markdownToHtml(result)
        editRef.current.focus()
      }
    }, 50)
  }

  const saveEdit = () => {
    if (onEdit && editRef.current) {
      onEdit(htmlToMarkdown(editRef.current.innerHTML))
    }
    setEditing(false)
    showToast('Changes saved!')
  }

  const cancelEdit = () => {
    setEditing(false)
  }

  // Keyboard shortcuts in contentEditable
  const handleEditorKey = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveEdit() }
    if (e.key === 'Escape') { cancelEdit() }
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
              <span style={{ fontSize: '0.65rem', fontWeight: 600, background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 100, marginLeft: 6, letterSpacing: '0.3px' }}>EDIT MODE</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {result && !editing && (
              <>
                {onEdit && (
                  <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12, color: '#7c3aed', borderColor: '#ddd6fe', background: '#f5f3ff' }} onClick={startEdit}>
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
                <button className="btn btn-ghost" onClick={handleDownloadTxt} style={{ padding: '6px 12px', fontSize: 12, color: '#16a34a', borderColor: '#bbf7d0' }}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  TXT
                </button>
                <button className="btn btn-ghost" onClick={handleDownloadPDF} disabled={pdfLoading} style={{ padding: '6px 12px', fontSize: 12, color: '#dc2626', borderColor: '#fecaca', opacity: pdfLoading ? 0.6 : 1 }}>
                  {pdfLoading
                    ? <div style={{ width: 12, height: 12, border: '2px solid #fecaca', borderTopColor: '#dc2626', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    : <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  }
                  PDF
                </button>
                <button className="btn btn-ghost" onClick={onClear} style={{ padding: '6px 12px', fontSize: 12, color: '#ef4444', borderColor: '#fecaca' }}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  Clear
                </button>
              </>
            )}

            {/* Edit mode: copy/download still available in header */}
            {editing && (
              <>
                <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={handleCopy}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Copy
                </button>
                <button className="btn btn-ghost" onClick={handleDownloadTxt} style={{ padding: '6px 12px', fontSize: 12, color: '#16a34a', borderColor: '#bbf7d0' }}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  TXT
                </button>
                <button className="btn btn-ghost" onClick={handleDownloadPDF} disabled={pdfLoading} style={{ padding: '6px 12px', fontSize: 12, color: '#dc2626', borderColor: '#fecaca', opacity: pdfLoading ? 0.6 : 1 }}>
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

        {/* Rich text toolbar — only in edit mode */}
        {editing && (
          <RichTextToolbar editorRef={editRef} onSave={saveEdit} onCancel={cancelEdit} />
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
              <p>Generating with AI...</p>
            </div>
          )}
          {result && !loading && !editing && (
            <div style={{ animation: 'fadeUp 0.4s ease' }}>
              <RenderedOutput text={result} />
            </div>
          )}
          {editing && (
            <div
              ref={editRef}
              contentEditable
              suppressContentEditableWarning
              onKeyDown={handleEditorKey}
              spellCheck={true}
              style={{
                width: '100%',
                minHeight: '100%',
                border: 'none',
                outline: 'none',
                padding: '20px 28px',
                fontFamily: 'var(--font, "Inter", system-ui, sans-serif)',
                fontSize: '0.9rem',
                lineHeight: 1.85,
                color: '#1e293b',
                background: '#fff',
                caretColor: '#7c3aed',
                overflowWrap: 'break-word',
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
