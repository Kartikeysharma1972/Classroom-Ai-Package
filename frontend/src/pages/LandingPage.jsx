import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useInView, AnimatePresence } from 'framer-motion'

const features = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
    title: 'Lesson Planning AI',
    desc: 'Auto-generate complete lesson plans aligned to CBSE, ICSE & state boards with activities, SWBAT objectives, and differentiation strategies.',
    tags: ['Syllabus-Aligned', 'SWBAT Objectives', 'Differentiated'],
    color: '#4f46e5',
    bg: '#eef2ff',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    title: 'Question Paper Generator',
    desc: 'Generate MCQ, descriptive, and competency-based question papers instantly with answer keys, marking schemes, and explanations.',
    tags: ['MCQ', 'Descriptive', 'Competency-Based'],
    color: '#0891b2',
    bg: '#ecfeff',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Class Activity Generator',
    desc: 'Generate group activities, project exercises, and hands-on tasks mapped to specific learning outcomes for every grade level.',
    tags: ['Group Work', 'Project-Based', 'Hands-On'],
    color: '#059669',
    bg: '#ecfdf5',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    title: 'Auto Generate Suite',
    desc: 'One click to generate lesson plan + worksheet + assessment + quiz simultaneously. Save hours of preparation time instantly.',
    tags: ['One-Click', 'All-in-One', '4 Tools'],
    color: '#d97706',
    bg: '#fffbeb',
  },
]

const stats = [
  { value: '4+', label: 'AI Tools', icon: '🛠' },
  { value: '10h+', label: 'Saved per Week', icon: '⏱' },
  { value: 'K-12', label: 'All Grade Levels', icon: '🎓' },
  { value: '<30s', label: 'Generation Time', icon: '⚡' },
]

const testimonials = [
  { name: 'Anita Verma', role: 'Science Teacher, DPS Noida', text: 'ClassroomAI has completely transformed my lesson planning. What used to take me 2 hours now takes 30 seconds. The quality is outstanding.', avatar: 'AV' },
  { name: 'Rajesh Kumar', role: 'Math Teacher, KV School', text: 'The question paper generator creates papers that are perfectly aligned with our curriculum. My students are more engaged than ever before.', avatar: 'RK' },
  { name: 'Suman Gupta', role: 'English Teacher, Ryan International', text: 'The class activity generator gives me fresh, creative ideas every single time. My classroom has never been more interactive and fun.', avatar: 'SG' },
]

const trustedBy = ['Delhi Public School', 'Kendriya Vidyalaya', 'Ryan International', 'DAV Schools', 'Amity International']

function FadeInSection({ children, delay = 0, direction = 'up' }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '200px 0px 200px 0px' })
  const dirMap = { up: { y: 40 }, down: { y: -40 }, left: { x: 40 }, right: { x: -40 } }
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...dirMap[direction] }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...dirMap[direction] }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

function CountUp({ target, suffix = '' }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const [val, setVal] = useState(target)

  useEffect(() => {
    if (!isInView) return
    const num = parseInt(target)
    if (isNaN(num)) { setVal(target); return }
    let start = 0
    const dur = 1500
    const step = dur / num
    const timer = setInterval(() => {
      start += 1
      setVal(start + suffix)
      if (start >= num) { clearInterval(timer); setVal(target) }
    }, Math.max(step, 20))
    return () => clearInterval(timer)
  }, [isInView, target, suffix])

  return <span ref={ref}>{val}</span>
}

export default function LandingPage() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'Inter', 'Outfit', sans-serif", color: '#1a1a2e', overflowX: 'hidden' }}>

      {/* ── NAVBAR ── */}
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
          padding: '0 40px', height: 72,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '1px solid #e5e7eb' : 'none',
          transition: 'background 0.3s ease, backdrop-filter 0.3s ease, border-bottom 0.3s ease',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.div
            whileHover={{ rotate: 10, scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300 }}
            style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
            }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </motion.div>
          <div>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.5px' }}>ClassroomAI</span>
            <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 500, marginLeft: 8 }}>by CodeVidhya</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.button
            whileHover={{ scale: 1.04, borderColor: '#4f46e5' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/login')}
            style={{
              padding: '9px 22px', borderRadius: 10, border: '1.5px solid #e5e7eb',
              background: '#fff', color: '#374151', fontSize: 14, fontWeight: 600,
              cursor: 'pointer',
            }}>
            Sign In
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: '0 8px 24px rgba(79,70,229,0.45)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/login')}
            style={{
              padding: '9px 22px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(79,70,229,0.3)',
            }}>
            Get Started Free
          </motion.button>
        </div>
      </motion.nav>

      {/* ── HERO SECTION ── */}
      <section style={{
        paddingTop: 140, paddingBottom: 80,
        background: 'linear-gradient(180deg, #f5f3ff 0%, #fff 100%)',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        {/* Animated background orbs */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.06, 0.1, 0.06] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: 60, left: '5%',
            width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)',
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.05, 0.09, 0.05] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          style={{
            position: 'absolute', top: 120, right: '5%',
            width: 350, height: 350, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)',
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.04, 0.07, 0.04] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          style={{
            position: 'absolute', bottom: 0, left: '30%',
            width: 300, height: 300, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
          }}
        />

        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px', position: 'relative' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', borderRadius: 100,
              background: '#eef2ff', border: '1px solid #c7d2fe',
              fontSize: 13, fontWeight: 600, color: '#4f46e5',
              marginBottom: 24,
            }}>
            <motion.span
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}
            />
            Powered by AI — Trusted by Educators
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            style={{
              fontSize: 56, fontWeight: 900, lineHeight: 1.12,
              letterSpacing: '-2px', color: '#1a1a2e',
              marginBottom: 20,
            }}>
            Teaching Materials in
            <motion.span
              initial={{ backgroundSize: '0% 100%' }}
              animate={{ backgroundSize: '100% 100%' }}
              transition={{ duration: 1, delay: 1 }}
              style={{
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}> Seconds</motion.span>,
            <br/>Not Hours
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            style={{
              fontSize: 18, lineHeight: 1.75, color: '#64748b',
              maxWidth: 620, margin: '0 auto 40px',
              fontWeight: 400,
            }}>
            Generate lesson plans, question papers, class activities, and quizzes — all aligned to your state syllabus. Built for Indian educators, powered by AI.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 12px 32px rgba(79,70,229,0.4)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/login')}
              style={{
                padding: '15px 36px', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                color: '#fff', fontSize: 16, fontWeight: 700,
                cursor: 'pointer', boxShadow: '0 8px 24px rgba(79,70,229,0.35)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
              Start Creating for Free
              <motion.svg
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </motion.svg>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04, borderColor: '#4f46e5', color: '#4f46e5' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                padding: '15px 36px', borderRadius: 14,
                border: '1.5px solid #e5e7eb', background: '#fff',
                color: '#374151', fontSize: 16, fontWeight: 600,
                cursor: 'pointer',
              }}>
              See How It Works
            </motion.button>
          </motion.div>
        </div>

        {/* Stats Bar */}
        <div style={{
          maxWidth: 820, margin: '64px auto 0', padding: '0 24px',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
        }}>
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 + i * 0.1 }}
              whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
              style={{
                background: '#fff', borderRadius: 18, padding: '22px 16px',
                border: '1px solid #f1f5f9',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                textAlign: 'center', cursor: 'default',
              }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#1a1a2e' }}>
                <CountUp target={s.value} />
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── TRUSTED BY BAR ── */}
      <section style={{ padding: '40px 40px 20px', background: '#fff' }}>
        <FadeInSection>
          <div style={{ textAlign: 'center', maxWidth: 900, margin: '0 auto' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 20 }}>
              Trusted by teachers from leading schools
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
              {trustedBy.map((name, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 + i * 0.15 }}
                  style={{ fontSize: 14, fontWeight: 600, color: '#cbd5e1', letterSpacing: '-0.3px' }}
                >
                  {name}
                </motion.span>
              ))}
            </div>
          </div>
        </FadeInSection>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section id="features" style={{
        padding: '80px 40px',
        maxWidth: 1100, margin: '0 auto',
      }}>
        <FadeInSection>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{
              display: 'inline-block', padding: '4px 14px', borderRadius: 100,
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              fontSize: 12, fontWeight: 700, color: '#16a34a',
              textTransform: 'uppercase', letterSpacing: '0.5px',
              marginBottom: 16,
            }}>
              Features
            </div>
            <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-1px', marginBottom: 12, color: '#1a1a2e' }}>
              Everything a Teacher Needs
            </h2>
            <p style={{ fontSize: 16, color: '#64748b', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
              Four powerful AI tools designed specifically for Indian educators. Each one saves you hours of work every single week.
            </p>
          </div>
        </FadeInSection>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
          {features.map((f, i) => (
            <FadeInSection key={i} delay={i * 0.12} direction={i % 2 === 0 ? 'left' : 'right'}>
              <motion.div
                whileHover={{ y: -6, boxShadow: `0 16px 40px ${f.color}18` }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                style={{
                  background: '#fff', borderRadius: 20, padding: '36px',
                  border: '1px solid #f1f5f9',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                  cursor: 'default', height: '100%',
                }}>
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    width: 58, height: 58, borderRadius: 16,
                    background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 20,
                  }}>
                  {f.icon}
                </motion.div>
                <h3 style={{ fontSize: 21, fontWeight: 700, marginBottom: 10, color: '#1a1a2e' }}>{f.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.75, color: '#64748b', marginBottom: 18 }}>{f.desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {f.tags.map((t, ti) => (
                    <span key={ti} style={{
                      fontSize: 11, fontWeight: 600, padding: '5px 14px', borderRadius: 100,
                      background: f.bg, color: f.color, border: `1px solid ${f.color}25`,
                    }}>{t}</span>
                  ))}
                </div>
              </motion.div>
            </FadeInSection>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '80px 40px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <FadeInSection>
            <div style={{
              display: 'inline-block', padding: '4px 14px', borderRadius: 100,
              background: '#eef2ff', border: '1px solid #c7d2fe',
              fontSize: 12, fontWeight: 700, color: '#4f46e5',
              textTransform: 'uppercase', letterSpacing: '0.5px',
              marginBottom: 16,
            }}>
              How It Works
            </div>
            <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-1px', marginBottom: 56, color: '#1a1a2e' }}>
              Three Simple Steps
            </h2>
          </FadeInSection>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, position: 'relative' }}>
            {/* Connecting line */}
            <div style={{
              position: 'absolute', top: 28, left: 'calc(16.67% + 28px)', right: 'calc(16.67% + 28px)',
              height: 2, background: 'linear-gradient(90deg, #c7d2fe, #e9d5ff)',
              zIndex: 0,
            }} />
            {[
              { step: '01', title: 'Select', desc: 'Choose your subject, grade level, and topic. Works with CBSE, ICSE, and all state boards.', icon: '🎯' },
              { step: '02', title: 'Generate', desc: 'Our AI creates professional teaching materials tailored to your curriculum in under 30 seconds.', icon: '✨' },
              { step: '03', title: 'Download', desc: 'Review, customize, and download as PDF. Ready to use in your classroom immediately.', icon: '📥' },
            ].map((s, i) => (
              <FadeInSection key={i} delay={i * 0.2}>
                <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    style={{
                      width: 60, height: 60, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                      color: '#fff', fontSize: 18, fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 20px',
                      boxShadow: '0 6px 20px rgba(79,70,229,0.35)',
                      border: '4px solid #f8fafc',
                    }}>{s.step}</motion.div>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                  <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10, color: '#1a1a2e' }}>{s.title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.75, color: '#64748b', maxWidth: 240, margin: '0 auto' }}>{s.desc}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEMO PREVIEW ── */}
      <section style={{ padding: '80px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <FadeInSection>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{
              display: 'inline-block', padding: '4px 14px', borderRadius: 100,
              background: '#fdf4ff', border: '1px solid #f0abfc',
              fontSize: 12, fontWeight: 700, color: '#a855f7',
              textTransform: 'uppercase', letterSpacing: '0.5px',
              marginBottom: 16,
            }}>
              See It In Action
            </div>
            <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-1px', marginBottom: 12, color: '#1a1a2e' }}>
              From Input to Output in Seconds
            </h2>
            <p style={{ fontSize: 16, color: '#64748b', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
              Just enter your subject, grade, and topic — our AI handles the rest.
            </p>
          </div>
        </FadeInSection>

        <FadeInSection delay={0.2}>
          <motion.div
            whileHover={{ y: -4 }}
            style={{
              background: 'linear-gradient(135deg, #f5f3ff 0%, #eef2ff 50%, #fdf4ff 100%)',
              borderRadius: 24, padding: '48px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
            }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 32, alignItems: 'center' }}>
              {/* Input side */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>Your Input</div>
                <div style={{ background: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  {[
                    { label: 'Subject', value: 'Science' },
                    { label: 'Grade', value: 'Class 8' },
                    { label: 'Topic', value: 'Photosynthesis' },
                    { label: 'Board', value: 'CBSE' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none' }}>
                      <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>{item.label}</span>
                      <span style={{ fontSize: 13, color: '#1a1a2e', fontWeight: 600 }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <motion.div
                animate={{ x: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </motion.div>

              {/* Output side */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>AI Output</div>
                <div style={{ background: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  {[
                    { icon: '📋', label: 'Complete Lesson Plan', detail: '45-min structured plan' },
                    { icon: '📝', label: 'Question Paper', detail: '25 questions + answers' },
                    { icon: '🎯', label: 'Class Activities', detail: '3 group activities' },
                    { icon: '✅', label: 'Quiz', detail: '10 MCQs with explanations' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none' }}>
                      <span style={{ fontSize: 18 }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>{item.label}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </FadeInSection>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: '80px 40px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <FadeInSection>
            <div style={{
              display: 'inline-block', padding: '4px 14px', borderRadius: 100,
              background: '#fffbeb', border: '1px solid #fde68a',
              fontSize: 12, fontWeight: 700, color: '#d97706',
              textTransform: 'uppercase', letterSpacing: '0.5px',
              marginBottom: 16,
            }}>
              Testimonials
            </div>
            <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-1px', marginBottom: 40, color: '#1a1a2e' }}>
              Loved by Teachers
            </h2>
          </FadeInSection>

          <FadeInSection delay={0.15}>
            <div style={{
              background: '#fff', borderRadius: 24, padding: '48px',
              border: '1px solid #f1f5f9',
              boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
              minHeight: 200, position: 'relative', overflow: 'hidden',
            }}>
              {/* Star rating */}
              <div style={{ marginBottom: 20 }}>
                {[...Array(5)].map((_, i) => (
                  <span key={i} style={{ fontSize: 20, color: '#f59e0b' }}>★</span>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTestimonial}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <p style={{ fontSize: 18, lineHeight: 1.8, color: '#475569', fontStyle: 'italic', marginBottom: 28 }}>
                    "{testimonials[activeTestimonial].text}"
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 14, fontWeight: 700,
                    }}>
                      {testimonials[activeTestimonial].avatar}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>{testimonials[activeTestimonial].name}</div>
                      <div style={{ fontSize: 13, color: '#94a3b8' }}>{testimonials[activeTestimonial].role}</div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 28 }}>
                {testimonials.map((_, i) => (
                  <motion.button
                    key={i}
                    animate={{ width: i === activeTestimonial ? 28 : 8 }}
                    onClick={() => setActiveTestimonial(i)}
                    style={{
                      height: 8, borderRadius: 4,
                      background: i === activeTestimonial ? '#4f46e5' : '#e2e8f0',
                      border: 'none', cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section style={{
        padding: '100px 40px',
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6366f1 100%)',
        textAlign: 'center', color: '#fff',
        position: 'relative', overflow: 'hidden',
      }}>
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute', top: -100, right: -100,
            width: 400, height: 400, borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', bottom: -80, left: -80,
            width: 300, height: 300, borderRadius: '50%',
            background: 'rgba(255,255,255,0.03)',
          }}
        />
        <FadeInSection>
          <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative' }}>
            <h2 style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-1px', marginBottom: 18, lineHeight: 1.2 }}>
              Ready to Transform Your Teaching?
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.75, opacity: 0.85, marginBottom: 36 }}>
              Join hundreds of educators who are saving hours every week with AI-powered teaching tools. Start for free — no credit card required.
            </p>
            <motion.button
              whileHover={{ scale: 1.06, boxShadow: '0 12px 32px rgba(0,0,0,0.25)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/login')}
              style={{
                padding: '17px 44px', borderRadius: 14, border: 'none',
                background: '#fff', color: '#4f46e5', fontSize: 17, fontWeight: 700,
                cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                display: 'inline-flex', alignItems: 'center', gap: 10,
              }}>
              Get Started Free
              <motion.svg
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </motion.svg>
            </motion.button>
            <p style={{ fontSize: 13, opacity: 0.6, marginTop: 16 }}>Free forever for basic usage. No setup needed.</p>
          </div>
        </FadeInSection>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '48px 40px', background: '#fff', borderTop: '1px solid #e5e7eb' }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>ClassroomAI by CodeVidhya</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>
              &copy; {new Date().getFullYear()} CodeVidhya. All rights reserved.
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
