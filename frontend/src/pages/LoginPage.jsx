import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const benefits = [
  { icon: '📋', text: 'Auto-generate lesson plans aligned to syllabus' },
  { icon: '📝', text: 'MCQ & descriptive question papers instantly' },
  { icon: '👥', text: 'Group activities mapped to learning outcomes' },
  { icon: '⚡', text: 'Generate all materials in under 30 seconds' },
]

export default function LoginPage() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [isSignup, setIsSignup] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', school_name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState(null)

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError('') }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (isSignup) {
        if (!form.name.trim()) { setError('Name is required'); setLoading(false); return }
        if (form.password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return }
        await register(form.name, form.email, form.password, form.school_name)
      } else {
        await login(form.email, form.password)
      }
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getInputStyle = (field) => ({
    width: '100%', padding: '13px 16px', borderRadius: 12,
    border: `1.5px solid ${focusedField === field ? '#4f46e5' : '#e2e8f0'}`,
    fontSize: 14, fontFamily: "'Inter', 'Outfit', sans-serif",
    color: '#1a1a2e', background: focusedField === field ? '#fff' : '#f8fafc',
    outline: 'none',
    transition: 'all 0.25s ease',
    boxShadow: focusedField === field ? '0 0 0 3px rgba(79,70,229,0.1)' : 'none',
  })

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 50%, #f5f0ff 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
      fontFamily: "'Inter', 'Outfit', sans-serif",
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background animated orbs */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], x: [0, 30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: -100, left: -100,
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 70%)',
        }}
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], y: [0, -30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        style={{
          position: 'absolute', bottom: -80, right: -80,
          width: 350, height: 350, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: '100%', maxWidth: 1020,
          display: 'grid', gridTemplateColumns: '1.1fr 1fr',
          borderRadius: 28, overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.1), 0 4px 16px rgba(0,0,0,0.04)',
          background: '#fff', minHeight: 600,
          position: 'relative', zIndex: 1,
        }}>

        {/* Left - Branding */}
        <div style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6366f1 100%)',
          padding: '48px 44px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          color: '#fff', position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative circles */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute', top: -80, right: -80,
              width: 250, height: 250, borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute', bottom: -60, left: -60,
              width: 200, height: 200, borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          />
          <div style={{
            position: 'absolute', top: '30%', right: '10%',
            width: 120, height: 120, borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
          }} />

          {/* Top */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Link to="/landing" style={{
                textDecoration: 'none', color: '#fff',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                marginBottom: 28, fontSize: 13, opacity: 0.7,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                Back to home
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36 }}
            >
              <motion.div
                whileHover={{ rotate: 10, scale: 1.05 }}
                style={{
                  width: 56, height: 56, borderRadius: 18,
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
              </motion.div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>ClassroomAI</div>
                <div style={{ fontSize: 13, opacity: 0.7, fontWeight: 500 }}>by CodeVidhya</div>
              </div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.25, marginBottom: 14, letterSpacing: '-0.5px' }}
            >
              AI-Powered Teaching<br/>Made Simple
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              style={{ fontSize: 15, lineHeight: 1.7, opacity: 0.8, maxWidth: 360 }}
            >
              Join thousands of Indian educators who save 10+ hours every week using our AI teaching tools.
            </motion.p>
          </div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 36 }}
          >
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
                whileHover={{ x: 4 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  fontSize: 13, fontWeight: 500,
                }}
              >
                <span style={{ fontSize: 18 }}>{b.icon}</span>
                {b.text}
              </motion.div>
            ))}
          </motion.div>

          {/* Bottom stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            style={{
              display: 'flex', gap: 24, marginTop: 36,
              padding: '18px 0', borderTop: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {[
              { val: '500+', label: 'Teachers' },
              { val: '10K+', label: 'Materials' },
              { val: '4.9', label: 'Rating' },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{s.val}</div>
                <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right - Form */}
        <div style={{ padding: '48px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={isSignup ? 'signup' : 'signin'}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <motion.h2
                style={{ fontSize: 26, fontWeight: 800, color: '#1a1a2e', marginBottom: 6, letterSpacing: '-0.3px' }}
              >
                {isSignup ? 'Create your account' : 'Welcome back'}
              </motion.h2>
              <p style={{ fontSize: 14, color: '#64748b', marginBottom: 28, lineHeight: 1.6 }}>
                {isSignup ? 'Start creating AI-powered teaching materials today' : 'Sign in to access your teaching tools and saved materials'}
              </p>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    style={{
                      background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12,
                      padding: '12px 16px', fontSize: 13, color: '#dc2626', fontWeight: 500,
                      marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8,
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <AnimatePresence>
                  {isSignup && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}
                    >
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 7, display: 'block' }}>
                          Full Name <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="text" value={form.name} onChange={e => set('name', e.target.value)}
                          placeholder="e.g. Priya Sharma"
                          onFocus={() => setFocusedField('name')}
                          onBlur={() => setFocusedField(null)}
                          style={getInputStyle('name')}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 7, display: 'block' }}>
                          School / Institution <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
                        </label>
                        <input
                          type="text" value={form.school_name} onChange={e => set('school_name', e.target.value)}
                          placeholder="e.g. Delhi Public School"
                          onFocus={() => setFocusedField('school')}
                          onBlur={() => setFocusedField(null)}
                          style={getInputStyle('school')}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 7, display: 'block' }}>
                    Email address <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email" value={form.email} onChange={e => set('email', e.target.value)}
                      placeholder="you@school.edu"
                      required
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      style={{ ...getInputStyle('email'), paddingLeft: 42 }}
                    />
                    <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round">
                      <rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 7, display: 'block' }}>
                    Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password" value={form.password} onChange={e => set('password', e.target.value)}
                      placeholder={isSignup ? 'Min 6 characters' : 'Enter your password'}
                      required
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      style={{ ...getInputStyle('password'), paddingLeft: 42 }}
                    />
                    <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  {isSignup && form.password.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{ marginTop: 8 }}
                    >
                      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                        {[1,2,3,4].map(i => (
                          <div key={i} style={{
                            flex: 1, height: 3, borderRadius: 2,
                            background: form.password.length >= i * 3 ? (form.password.length >= 10 ? '#22c55e' : form.password.length >= 6 ? '#f59e0b' : '#ef4444') : '#e2e8f0',
                            transition: 'background 0.3s',
                          }} />
                        ))}
                      </div>
                      <span style={{ fontSize: 11, color: form.password.length >= 6 ? '#22c55e' : '#94a3b8' }}>
                        {form.password.length < 6 ? `${6 - form.password.length} more characters needed` : 'Password strength: Good'}
                      </span>
                    </motion.div>
                  )}
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={loading ? {} : { scale: 1.02, boxShadow: '0 8px 24px rgba(79,70,229,0.4)' }}
                  whileTap={loading ? {} : { scale: 0.98 }}
                  style={{
                    width: '100%', padding: '14px 24px', borderRadius: 14, border: 'none',
                    background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    color: '#fff', fontSize: 15, fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    marginTop: 4,
                    boxShadow: '0 4px 14px rgba(79,70,229,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'background 0.2s',
                  }}>
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%' }}
                      />
                      Please wait...
                    </>
                  ) : (
                    <>
                      {isSignup ? 'Create Account' : 'Sign In'}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </>
                  )}
                </motion.button>
              </form>

              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                margin: '24px 0', color: '#cbd5e1',
              }}>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                <span style={{ fontSize: 12, fontWeight: 500 }}>or</span>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              </div>

              <div style={{ textAlign: 'center', fontSize: 14, color: '#64748b' }}>
                {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setIsSignup(!isSignup); setError(''); setFocusedField(null) }}
                  style={{
                    background: 'none', border: 'none', color: '#4f46e5',
                    fontWeight: 700, cursor: 'pointer', fontSize: 14,
                    textDecoration: 'underline', textUnderlineOffset: 2,
                  }}
                >
                  {isSignup ? 'Sign In' : 'Sign Up'}
                </motion.button>
              </div>

              <p style={{ textAlign: 'center', fontSize: 11, color: '#cbd5e1', marginTop: 20, lineHeight: 1.6 }}>
                By continuing, you agree to our Terms of Service and Privacy Policy.
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
