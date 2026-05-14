import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      style={{
        padding: '8px 16px',
        background: 'var(--accent-soft)',
        border: '1.5px solid var(--accent-mid)',
        borderRadius: 'var(--radius)',
        color: 'var(--accent)',
        fontWeight: 600,
        fontSize: '0.9rem',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontFamily: 'var(--font)',
      }}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onMouseEnter={(e) => {
        e.target.style.borderColor = 'var(--accent)'
        e.target.style.transform = 'translateY(-2px)'
        e.target.style.boxShadow = '0 4px 12px rgba(57, 154, 255, 0.2)'
      }}
      onMouseLeave={(e) => {
        e.target.style.borderColor = 'var(--accent-mid)'
        e.target.style.transform = 'translateY(0)'
        e.target.style.boxShadow = 'none'
      }}
    >
      {isDark ? '☀️ Light' : '🌙 Dark'}
    </button>
  )
}
