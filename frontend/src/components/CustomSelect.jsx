import React, { useState, useRef, useEffect } from 'react'

/**
 * CustomSelect – always opens downward, works inside overflow:hidden containers.
 * Props mirror a native <select>: value, onChange, disabled, style, children (<option> elements).
 */
export default function CustomSelect({ value, onChange, disabled, style, children, placeholder }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Build option list from <option> children
  const options = React.Children.toArray(children)
    .filter(c => c.type === 'option')
    .map(c => ({ value: c.props.value ?? c.props.children, label: c.props.children }))

  const selected = options.find(o => String(o.value) === String(value))
  const displayLabel = selected ? selected.label : (placeholder || options[0]?.label || '')

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const select = (optValue) => {
    onChange({ target: { value: optValue } })
    setOpen(false)
  }

  const baseStyle = {
    position: 'relative',
    display: 'inline-block',
    width: '100%',
    ...style,
  }

  const triggerStyle = {
    width: '100%',
    padding: '8px 32px 8px 12px',
    borderRadius: 8,
    border: style?.borderColor ? `1.5px solid ${style.borderColor}` : '1.5px solid var(--border)',
    background: disabled ? 'var(--bg)' : 'var(--surface)',
    color: selected ? 'var(--text-1)' : 'var(--text-3)',
    fontSize: '0.875rem',
    fontFamily: 'var(--font)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    textAlign: 'left',
    outline: 'none',
    opacity: style?.opacity ?? 1,
    appearance: 'none',
    WebkitAppearance: 'none',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'border-color 0.15s',
  }

  const listStyle = {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    zIndex: 9999,
    background: 'var(--surface)',
    border: '1.5px solid var(--border)',
    borderRadius: 8,
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    maxHeight: 220,
    overflowY: 'auto',
    scrollbarWidth: 'thin',
    padding: '4px 0',
  }

  return (
    <div ref={ref} style={baseStyle}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        style={triggerStyle}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayLabel}
        </span>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          style={{ flexShrink: 0, marginLeft: 6, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', color: 'var(--text-3)' }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <ul style={listStyle}>
          {options.map((opt, i) => (
            <li
              key={i}
              onClick={() => select(opt.value)}
              style={{
                padding: '8px 14px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontFamily: 'var(--font)',
                color: String(opt.value) === String(value) ? 'var(--accent)' : 'var(--text-1)',
                background: String(opt.value) === String(value) ? 'var(--accent-soft)' : 'transparent',
                fontWeight: String(opt.value) === String(value) ? 600 : 400,
                listStyle: 'none',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (String(opt.value) !== String(value)) e.currentTarget.style.background = 'var(--bg)' }}
              onMouseLeave={e => { e.currentTarget.style.background = String(opt.value) === String(value) ? 'var(--accent-soft)' : 'transparent' }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
