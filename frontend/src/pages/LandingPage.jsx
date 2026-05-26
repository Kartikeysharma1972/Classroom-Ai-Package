import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useInView, AnimatePresence } from 'framer-motion'

// ── DATA ─────────────────────────────────────────────────────────
const features = [
  {
    icon: '📝', accent: '#3B82F6',
    title: 'AI Lesson Planner',
    desc: 'Generate full lesson plans aligned to CBSE / NCERT / State boards in 30 seconds — objectives, activities, differentiation.',
  },
  {
    icon: '📊', accent: '#0EA5E9',
    title: 'Quiz & Test Creator',
    desc: 'Auto-generate MCQs, subjective, true/false and competency-based question papers with answer keys.',
  },
  {
    icon: '💬', accent: '#EC4899',
    title: 'Student Feedback Writer',
    desc: 'Personalized written feedback for every student — star ratings, custom tones, printable report cards.',
  },
  {
    icon: '🐛', accent: '#8B5CF6',
    title: 'Code Debugger',
    desc: 'CS teachers — paste student code, AI explains every bug and fix step-by-step. 20+ languages.',
    badge: 'NEW',
  },
  {
    icon: '🎯', accent: '#10B981',
    title: 'Class Activity Generator',
    desc: 'Engaging group activities, projects, hands-on tasks mapped to specific learning outcomes for every grade.',
  },
  {
    icon: '📈', accent: '#F59E0B',
    title: 'Worksheet Builder',
    desc: 'Print-ready worksheets with Bloom\'s taxonomy levels, word banks, and bundled answer keys.',
  },
]

const testimonials = [
  {
    name: 'Priya Sharma', role: 'Science Teacher', school: 'Delhi Public School',
    text: 'ClassroomAI saved me 2 hours every single day! The lesson plans align perfectly with our CBSE syllabus.',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&q=80',
  },
  {
    name: 'Rajesh Kumar', role: 'Math Teacher', school: 'Kendriya Vidyalaya',
    text: 'My quiz quality improved dramatically. Students are more engaged and the question variety is brilliant.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&q=80',
  },
  {
    name: 'Anita Menon', role: 'English Teacher', school: 'Vibgyor High',
    text: 'Best investment any teacher can make. The feedback writer alone has transformed my report card weeks.',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&q=80',
  },
]

const pricingPlans = [
  {
    name: 'Free',
    monthly: 0, annual: 0,
    desc: 'For teachers exploring AI',
    features: [
      '10 AI generations per month',
      'Basic lesson plans & worksheets',
      'PDF export',
      'Community support',
    ],
    cta: 'Start Free',
  },
  {
    name: 'Pro',
    monthly: 299, annual: 249,
    desc: 'For everyday teaching',
    features: [
      'Unlimited AI generations',
      'All 6 AI tools unlocked',
      'Code Debugger + Feedback Writer',
      'Priority email support',
      'Saved history + reports',
    ],
    cta: 'Try Pro Free',
    popular: true,
  },
  {
    name: 'School Plan',
    monthly: 1999, annual: 1599,
    desc: 'For institutions',
    features: [
      'Up to 25 teacher accounts',
      'School admin dashboard',
      'Bulk student feedback',
      'Custom CBSE/ICSE board mapping',
      'Dedicated onboarding',
    ],
    cta: 'Contact Sales',
  },
]

const faqs = [
  {
    q: 'Is ClassroomAI really free to start?',
    a: 'Yes. You get 10 AI generations every month forever, no credit card required. Upgrade only when you outgrow the free tier.',
  },
  {
    q: 'Which boards and curricula does it support?',
    a: 'CBSE, ICSE, IB, and all major Indian state boards. You can also customise outputs for international curricula and IGCSE.',
  },
  {
    q: 'Do the AI outputs sound generic?',
    a: 'No — you give the topic, grade, subject, and tone. The AI tailors every output to your context. Most teachers say the quality matches their best hand-written lessons.',
  },
  {
    q: 'Can I edit what the AI generates?',
    a: 'Absolutely. Every output is fully editable inline. You can tweak, regenerate sections, or export to PDF / Word.',
  },
  {
    q: 'Who is behind ClassroomAI?',
    a: 'ClassroomAI is built by CodeVidhya — an Indian edtech team focused on empowering teachers with practical AI tools that actually save time.',
  },
]

const trustedSchools = [
  'Delhi Public School', 'Kendriya Vidyalaya', 'Ryan International', 'DAV Schools',
  'Amity International', 'Vibgyor High', 'Bal Bharati',
]

// ── HELPER COMPONENTS ────────────────────────────────────────────
function FadeIn({ children, delay = 0, y = 30 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px 0px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

function Logo({ size = 38, withText = true, dark = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: size, height: size, borderRadius: 12,
        background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        boxShadow: '0 4px 14px rgba(59,130,246,0.18)',
        border: '1.5px solid #DBEAFE',
        flexShrink: 0,
      }}>
        <img
          src="/codevidhya_logo.jfif"
          alt="CodeVidhya"
          style={{ width: '85%', height: '85%', objectFit: 'contain' }}
        />
      </div>
      {withText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: size > 38 ? 24 : 20, fontWeight: 700,
            color: dark ? '#fff' : '#0F172A', letterSpacing: '-0.5px',
          }}>ClassroomAI</span>
          <span style={{
            fontSize: 11, color: dark ? 'rgba(255,255,255,0.7)' : '#64748B',
            fontWeight: 500, marginTop: 1,
          }}>by CodeVidhya</span>
        </div>
      )}
    </div>
  )
}

// ── MAIN COMPONENT ───────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [navVisible, setNavVisible] = useState(true)
  const [lastScroll, setLastScroll] = useState(0)
  const [pricingAnnual, setPricingAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 20)
      setNavVisible(y < lastScroll || y < 100)
      setLastScroll(y)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [lastScroll])

  return (
    <div style={{
      minHeight: '100vh', background: '#FFFFFF',
      fontFamily: "'DM Sans', -apple-system, sans-serif", color: '#0F172A',
      overflowX: 'hidden',
    }}>
      {/* Global font loading */}
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* ── NAVBAR ───────────────────────────────────────────────── */}
      <motion.nav
        animate={{ y: navVisible ? 0 : -90 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, height: 72,
          padding: '0 clamp(20px, 5vw, 48px)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: scrolled ? 'rgba(255,255,255,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(219,234,254,0.5)' : '1px solid transparent',
          transition: 'background 0.3s, border-color 0.3s, backdrop-filter 0.3s',
        }}>
        <Logo />
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div className="nav-links" style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
            {[
              { label: 'Features', href: '#features' },
              { label: 'How It Works', href: '#how' },
              { label: 'Testimonials', href: '#testimonials' },
              { label: 'Pricing', href: '#pricing' },
            ].map(l => (
              <a key={l.href} href={l.href}
                style={{
                  fontSize: 14, fontWeight: 500, color: '#475569',
                  textDecoration: 'none', transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#3B82F6'}
                onMouseLeave={e => e.currentTarget.style.color = '#475569'}
              >{l.label}</a>
            ))}
          </div>
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: '0 8px 24px rgba(59,130,246,0.35)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/login')}
            style={{
              padding: '10px 22px', borderRadius: 100, border: 'none',
              background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
              color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(59,130,246,0.25)',
              fontFamily: 'inherit',
            }}>
            Try Free →
          </motion.button>
        </div>
      </motion.nav>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative', paddingTop: 140, paddingBottom: 100,
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F0F8FF 35%, #FFFFFF 100%)',
        overflow: 'hidden',
      }}>
        {/* Animated mesh background */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: '-10%', left: '-10%',
            width: 600, height: 600, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(147,197,253,0.35) 0%, transparent 65%)',
            filter: 'blur(40px)',
          }} />
        <motion.div
          animate={{ scale: [1, 1.3, 1], rotate: [0, -25, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
          style={{
            position: 'absolute', top: '20%', right: '-15%',
            width: 700, height: 700, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(219,234,254,0.5) 0%, transparent 65%)',
            filter: 'blur(50px)',
          }} />

        {/* Floating decorative shapes */}
        <FloatingShape top="20%" left="5%" delay={0} icon="📚" />
        <FloatingShape top="40%" left="3%" delay={1.5} icon="💡" />
        <FloatingShape top="15%" right="8%" delay={3} icon="⭐" />
        <FloatingShape top="60%" right="6%" delay={2} icon="🎓" />

        <div style={{
          maxWidth: 1200, margin: '0 auto',
          padding: '0 clamp(20px, 5vw, 48px)',
          display: 'grid', gridTemplateColumns: '1.1fr 1fr',
          gap: 60, alignItems: 'center', position: 'relative',
        }} className="hero-grid">

          {/* LEFT CONTENT */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 14px', borderRadius: 100,
                background: '#E8F4FD', border: '1px solid #93C5FD',
                fontSize: 12.5, fontWeight: 600, color: '#1D4ED8',
                marginBottom: 24,
              }}>
              <motion.span
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} />
              AI Toolkit for Educators — by CodeVidhya
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(38px, 5.5vw, 60px)',
                fontWeight: 700, lineHeight: 1.08, letterSpacing: '-1.5px',
                color: '#0F172A', marginBottom: 24,
              }}>
              Your AI-Powered<br />
              Teaching Assistant —<br />
              <span style={{
                background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                fontStyle: 'italic',
              }}>built for educators.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              style={{
                fontSize: 18, lineHeight: 1.7, color: '#475569',
                marginBottom: 36, maxWidth: 520, fontWeight: 400,
              }}>
              Save 10+ hours every week. Create lesson plans, quizzes,
              student feedback, debug student code — all with the
              power of AI, in seconds.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55 }}
              style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 40 }}>
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: '0 16px 36px rgba(59,130,246,0.4)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/login')}
                style={{
                  padding: '15px 32px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                  color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(59,130,246,0.3)',
                  display: 'flex', alignItems: 'center', gap: 10,
                  fontFamily: 'inherit',
                }}>
                Start for Free
                <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>→</motion.span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04, borderColor: '#3B82F6', color: '#3B82F6' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  padding: '15px 32px', borderRadius: 12,
                  border: '1.5px solid #DBEAFE', background: '#fff',
                  color: '#475569', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                ▶ Watch Demo
              </motion.button>
            </motion.div>

            {/* Floating stat badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.75 }}
              style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { v: '500+', l: 'Teachers' },
                { v: '4.9★', l: 'Rating' },
                { v: '10x', l: 'Faster lessons' },
              ].map((b, i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
                  style={{
                    background: '#fff', borderRadius: 14, padding: '10px 18px',
                    boxShadow: '0 8px 24px rgba(59,130,246,0.1)',
                    border: '1px solid #DBEAFE',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#3B82F6' }}>{b.v}</div>
                  <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>{b.l}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT IMAGE */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: 'relative' }}>
            <div style={{
              position: 'relative', borderRadius: 28, overflow: 'hidden',
              boxShadow: '0 30px 80px rgba(59,130,246,0.25), 0 8px 28px rgba(0,0,0,0.08)',
              aspectRatio: '4/5',
            }}>
              <img
                src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&q=80"
                alt="Teacher in modern classroom"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(135deg, rgba(59,130,246,0.18) 0%, transparent 50%, rgba(37,99,235,0.12) 100%)',
              }} />
            </div>

            {/* Floating card 1 */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute', top: 30, left: -30,
                background: '#fff', borderRadius: 16, padding: '14px 18px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.12)',
                display: 'flex', alignItems: 'center', gap: 12,
                border: '1px solid #DBEAFE',
              }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: '#E8F4FD',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
              }}>📝</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Lesson plan ready</div>
                <div style={{ fontSize: 11, color: '#64748B' }}>Class 8 · Photosynthesis</div>
              </div>
            </motion.div>

            {/* Floating card 2 */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              style={{
                position: 'absolute', bottom: 60, right: -30,
                background: '#fff', borderRadius: 16, padding: '14px 18px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.12)',
                display: 'flex', alignItems: 'center', gap: 12,
                border: '1px solid #DBEAFE',
              }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: '#DBEAFE',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
              }}>⚡</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Generated in 24s</div>
                <div style={{ fontSize: 11, color: '#64748B' }}>Faster than ever</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── TRUSTED BY ───────────────────────────────────────────── */}
      <section style={{ padding: '40px 0', background: '#fff', borderTop: '1px solid #F1F5F9' }}>
        <FadeIn>
          <div style={{ textAlign: 'center', maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: '#94A3B8',
              letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 22,
            }}>
              Trusted by 500+ schools across India
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 36, flexWrap: 'wrap' }}>
              {trustedSchools.map((name, i) => (
                <div key={i} style={{
                  padding: '7px 18px', borderRadius: 100,
                  background: '#F8FAFC', border: '1px solid #E2E8F0',
                  fontSize: 13, fontWeight: 600, color: '#64748B',
                  letterSpacing: '-0.2px',
                }}>{name}</div>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────── */}
      <section id="features" style={{ padding: '110px 0', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(20px, 5vw, 48px)' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', maxWidth: 660, margin: '0 auto 60px' }}>
              <div style={{
                display: 'inline-block', padding: '5px 14px', borderRadius: 100,
                background: '#E8F4FD', color: '#1D4ED8',
                fontSize: 11, fontWeight: 700, letterSpacing: '1px',
                textTransform: 'uppercase', marginBottom: 18,
              }}>
                Six AI Tools
              </div>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(32px, 4.5vw, 48px)',
                fontWeight: 700, letterSpacing: '-1.2px', color: '#0F172A',
                margin: '0 0 16px', lineHeight: 1.15,
              }}>
                Everything a teacher needs,<br />
                <span style={{ fontStyle: 'italic', color: '#3B82F6' }}>nothing they don't.</span>
              </h2>
              <p style={{ fontSize: 17, lineHeight: 1.7, color: '#64748B', margin: 0 }}>
                Six dedicated AI tools — each one designed to solve a specific weekly headache for educators.
              </p>
            </div>
          </FadeIn>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 22,
          }}>
            {features.map((f, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <motion.div
                  whileHover={{ y: -8, rotate: -0.5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  style={{
                    background: '#fff', borderRadius: 20, padding: 32,
                    border: '1.5px solid #DBEAFE',
                    boxShadow: '0 4px 16px rgba(59,130,246,0.06)',
                    height: '100%', cursor: 'default', position: 'relative',
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 20px 50px rgba(59,130,246,0.18)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(59,130,246,0.06)'}
                >
                  {f.badge && (
                    <span style={{
                      position: 'absolute', top: 18, right: 18,
                      padding: '3px 10px', borderRadius: 100,
                      background: 'linear-gradient(135deg, #F59E0B, #EF4444)',
                      color: '#fff', fontSize: 10, fontWeight: 800,
                      letterSpacing: '0.5px',
                    }}>{f.badge}</span>
                  )}
                  <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: `${f.accent}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, marginBottom: 20,
                  }}>{f.icon}</div>
                  <h3 style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 22, fontWeight: 700, color: '#0F172A',
                    margin: '0 0 10px', letterSpacing: '-0.3px',
                  }}>{f.title}</h3>
                  <p style={{ fontSize: 14.5, lineHeight: 1.7, color: '#64748B', margin: 0 }}>{f.desc}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section id="how" style={{
        padding: '110px 0',
        background: 'linear-gradient(180deg, #F8FBFF 0%, #FFFFFF 100%)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(20px, 5vw, 48px)' }}>
          <FadeIn>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: 60, alignItems: 'center',
            }} className="how-grid">
              <div>
                <div style={{
                  display: 'inline-block', padding: '5px 14px', borderRadius: 100,
                  background: '#E8F4FD', color: '#1D4ED8',
                  fontSize: 11, fontWeight: 700, letterSpacing: '1px',
                  textTransform: 'uppercase', marginBottom: 18,
                }}>How It Works</div>
                <h2 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 'clamp(30px, 4vw, 44px)',
                  fontWeight: 700, letterSpacing: '-1px', color: '#0F172A',
                  margin: '0 0 16px', lineHeight: 1.15,
                }}>
                  Three steps from<br />
                  <span style={{ fontStyle: 'italic', color: '#3B82F6' }}>idea → classroom-ready.</span>
                </h2>
                <p style={{ fontSize: 16, lineHeight: 1.7, color: '#64748B', margin: 0, marginBottom: 30 }}>
                  No technical skills needed. If you can fill out a form, you can use ClassroomAI.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {[
                    { n: '01', t: 'Tell AI your topic', d: 'Choose subject, grade, topic. CBSE / ICSE / state — we got you.' },
                    { n: '02', t: 'AI generates content', d: 'Lesson plan, quiz, feedback, code fixes — under 30 seconds.' },
                    { n: '03', t: 'Customize & teach', d: 'Edit inline, export PDF, or push straight to your classroom.' },
                  ].map((s, i) => (
                    <motion.div key={i}
                      whileHover={{ x: 4 }}
                      style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      <div style={{
                        flexShrink: 0, width: 50, height: 50, borderRadius: 14,
                        background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 16, fontWeight: 700, letterSpacing: '-0.5px',
                        boxShadow: '0 8px 20px rgba(59,130,246,0.25)',
                      }}>{s.n}</div>
                      <div>
                        <h4 style={{
                          fontFamily: "'Playfair Display', serif",
                          fontSize: 19, fontWeight: 700, color: '#0F172A',
                          margin: '0 0 4px',
                        }}>{s.t}</h4>
                        <p style={{ fontSize: 14, lineHeight: 1.7, color: '#64748B', margin: 0 }}>{s.d}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                style={{
                  position: 'relative', borderRadius: 24, overflow: 'hidden',
                  boxShadow: '0 30px 80px rgba(59,130,246,0.18)',
                  aspectRatio: '4/3',
                }}>
                <img
                  src="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80"
                  alt="Teacher using laptop"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(135deg, transparent 60%, rgba(59,130,246,0.2))',
                }} />
              </motion.div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────── */}
      <section id="testimonials" style={{ padding: '110px 0', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(20px, 5vw, 48px)' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 56px' }}>
              <div style={{
                display: 'inline-block', padding: '5px 14px', borderRadius: 100,
                background: '#E8F4FD', color: '#1D4ED8',
                fontSize: 11, fontWeight: 700, letterSpacing: '1px',
                textTransform: 'uppercase', marginBottom: 18,
              }}>Loved by Teachers</div>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(30px, 4.5vw, 46px)',
                fontWeight: 700, letterSpacing: '-1px', color: '#0F172A',
                margin: 0, lineHeight: 1.15,
              }}>
                Real teachers,<br />
                <span style={{ fontStyle: 'italic', color: '#3B82F6' }}>real time saved.</span>
              </h2>
            </div>
          </FadeIn>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 22,
          }}>
            {testimonials.map((t, i) => (
              <FadeIn key={i} delay={i * 0.12}>
                <motion.div
                  whileHover={{ y: -6 }}
                  style={{
                    background: '#F0F8FF', borderRadius: 20,
                    padding: 32, border: '1.5px solid #DBEAFE',
                    height: '100%', display: 'flex', flexDirection: 'column',
                  }}>
                  <div style={{ marginBottom: 14 }}>
                    {[...Array(5)].map((_, j) => (
                      <span key={j} style={{ color: '#F59E0B', fontSize: 16 }}>★</span>
                    ))}
                  </div>
                  <p style={{
                    fontSize: 15.5, lineHeight: 1.75, color: '#334155',
                    marginBottom: 24, fontStyle: 'italic', flex: 1,
                  }}>"{t.text}"</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img
                      src={t.avatar} alt={t.name}
                      style={{
                        width: 46, height: 46, borderRadius: '50%',
                        objectFit: 'cover', border: '2px solid #fff',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      }}
                    />
                    <div>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: '#0F172A' }}>{t.name}</div>
                      <div style={{ fontSize: 12.5, color: '#64748B' }}>{t.role} · {t.school}</div>
                    </div>
                  </div>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────── */}
      <section id="pricing" style={{
        padding: '110px 0',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F0F8FF 50%, #FFFFFF 100%)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(20px, 5vw, 48px)' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 36px' }}>
              <div style={{
                display: 'inline-block', padding: '5px 14px', borderRadius: 100,
                background: '#E8F4FD', color: '#1D4ED8',
                fontSize: 11, fontWeight: 700, letterSpacing: '1px',
                textTransform: 'uppercase', marginBottom: 18,
              }}>Pricing</div>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(30px, 4.5vw, 46px)',
                fontWeight: 700, letterSpacing: '-1px', color: '#0F172A',
                margin: '0 0 16px', lineHeight: 1.15,
              }}>
                Simple, honest<br />
                <span style={{ fontStyle: 'italic', color: '#3B82F6' }}>teacher-friendly pricing.</span>
              </h2>
            </div>

            <div style={{
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              gap: 14, marginBottom: 48,
            }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: pricingAnnual ? '#94A3B8' : '#0F172A' }}>Monthly</span>
              <button
                type="button"
                onClick={() => setPricingAnnual(v => !v)}
                style={{
                  position: 'relative', width: 52, height: 28, borderRadius: 100,
                  border: 'none', cursor: 'pointer',
                  background: pricingAnnual ? '#3B82F6' : '#CBD5E1',
                  transition: 'background 0.25s',
                }}>
                <motion.div
                  animate={{ x: pricingAnnual ? 26 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  style={{
                    position: 'absolute', top: 2,
                    width: 24, height: 24, borderRadius: '50%',
                    background: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  }} />
              </button>
              <span style={{ fontSize: 14, fontWeight: 600, color: pricingAnnual ? '#0F172A' : '#94A3B8' }}>
                Annual
                <span style={{
                  marginLeft: 8, padding: '2px 8px', borderRadius: 100,
                  background: '#DCFCE7', color: '#16A34A',
                  fontSize: 11, fontWeight: 700,
                }}>Save 17%</span>
              </span>
            </div>
          </FadeIn>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24, maxWidth: 1000, margin: '0 auto',
          }}>
            {pricingPlans.map((p, i) => {
              const price = pricingAnnual ? p.annual : p.monthly
              return (
                <FadeIn key={i} delay={i * 0.1}>
                  <motion.div
                    whileHover={{ y: -10 }}
                    style={{
                      background: p.popular ? 'linear-gradient(180deg, #2563EB 0%, #1D4ED8 100%)' : '#fff',
                      color: p.popular ? '#fff' : '#0F172A',
                      borderRadius: 20, padding: '36px 30px',
                      border: p.popular ? 'none' : '1.5px solid #DBEAFE',
                      boxShadow: p.popular
                        ? '0 24px 64px rgba(59,130,246,0.35)'
                        : '0 4px 16px rgba(59,130,246,0.06)',
                      position: 'relative', height: '100%',
                      display: 'flex', flexDirection: 'column',
                    }}>
                    {p.popular && (
                      <div style={{
                        position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                        padding: '5px 14px', borderRadius: 100,
                        background: '#F59E0B', color: '#fff',
                        fontSize: 11, fontWeight: 800, letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                      }}>Most Popular</div>
                    )}
                    <h3 style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 24, fontWeight: 700,
                      margin: '0 0 4px', letterSpacing: '-0.3px',
                    }}>{p.name}</h3>
                    <p style={{
                      fontSize: 13.5, opacity: p.popular ? 0.85 : 1,
                      color: p.popular ? '#fff' : '#64748B', margin: '0 0 22px',
                    }}>{p.desc}</p>
                    <div style={{ marginBottom: 24, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 44, fontWeight: 700, letterSpacing: '-1px',
                      }}>{price === 0 ? '₹0' : `₹${price}`}</span>
                      <span style={{ fontSize: 13, opacity: p.popular ? 0.8 : 0.6 }}>/month</span>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', flex: 1 }}>
                      {p.features.map((feat, j) => (
                        <li key={j} style={{
                          display: 'flex', alignItems: 'flex-start', gap: 10,
                          fontSize: 14, lineHeight: 1.6,
                          color: p.popular ? '#fff' : '#475569',
                          opacity: p.popular ? 0.95 : 1,
                          marginBottom: 10,
                        }}>
                          <span style={{
                            flexShrink: 0, marginTop: 2,
                            color: p.popular ? '#93C5FD' : '#3B82F6',
                            fontWeight: 800,
                          }}>✓</span>
                          {feat}
                        </li>
                      ))}
                    </ul>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate('/login')}
                      style={{
                        width: '100%', padding: '13px 20px', borderRadius: 12,
                        border: p.popular ? 'none' : '1.5px solid #3B82F6',
                        background: p.popular ? '#fff' : 'transparent',
                        color: p.popular ? '#2563EB' : '#3B82F6',
                        fontSize: 14, fontWeight: 700, cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}>{p.cta} →</motion.button>
                  </motion.div>
                </FadeIn>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section style={{ padding: '110px 0', background: '#fff' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 clamp(20px, 5vw, 48px)' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{
                display: 'inline-block', padding: '5px 14px', borderRadius: 100,
                background: '#E8F4FD', color: '#1D4ED8',
                fontSize: 11, fontWeight: 700, letterSpacing: '1px',
                textTransform: 'uppercase', marginBottom: 18,
              }}>FAQ</div>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(30px, 4vw, 44px)',
                fontWeight: 700, letterSpacing: '-1px', color: '#0F172A',
                margin: 0, lineHeight: 1.15,
              }}>
                Got questions?<br />
                <span style={{ fontStyle: 'italic', color: '#3B82F6' }}>We have answers.</span>
              </h2>
            </div>
          </FadeIn>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {faqs.map((f, i) => (
              <FadeIn key={i} delay={i * 0.06}>
                <motion.div
                  layout
                  style={{
                    background: openFaq === i ? '#E8F4FD' : '#fff',
                    border: openFaq === i ? '1.5px solid #93C5FD' : '1.5px solid #E2E8F0',
                    borderRadius: 14, overflow: 'hidden',
                    transition: 'background 0.3s, border-color 0.3s',
                  }}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{
                      width: '100%', padding: '20px 24px',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      textAlign: 'left', fontFamily: 'inherit',
                    }}>
                    <span style={{
                      fontSize: 16, fontWeight: 600, color: '#0F172A',
                      letterSpacing: '-0.2px', flex: 1,
                    }}>{f.q}</span>
                    <motion.span
                      animate={{ rotate: openFaq === i ? 45 : 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ fontSize: 22, color: '#3B82F6', fontWeight: 300, marginLeft: 16 }}>+</motion.span>
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        style={{ overflow: 'hidden' }}>
                        <div style={{
                          padding: '0 24px 22px',
                          fontSize: 14.5, lineHeight: 1.75, color: '#475569',
                        }}>{f.a}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────── */}
      <section style={{
        padding: '100px clamp(20px, 5vw, 48px)',
        background: 'linear-gradient(135deg, #DBEAFE 0%, #93C5FD 50%, #DBEAFE 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Sparkle pattern */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.2, 0.6, 0.2], scale: [1, 1.4, 1] }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
            style={{
              position: 'absolute',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: 4, height: 4, borderRadius: '50%',
              background: '#fff', boxShadow: '0 0 8px #fff',
            }} />
        ))}

        <FadeIn>
          <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(34px, 5vw, 54px)',
              fontWeight: 700, letterSpacing: '-1.2px', color: '#0F172A',
              margin: '0 0 18px', lineHeight: 1.1,
            }}>
              Ready to transform<br />
              <span style={{ fontStyle: 'italic', color: '#1D4ED8' }}>your teaching?</span>
            </h2>
            <p style={{
              fontSize: 17, lineHeight: 1.7, color: '#334155',
              margin: '0 0 36px', maxWidth: 540, marginLeft: 'auto', marginRight: 'auto',
            }}>
              Join hundreds of teachers already saving 10+ hours every week.
              No credit card. No setup. Just better teaching.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: '0 16px 36px rgba(15,23,42,0.25)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/login')}
                style={{
                  padding: '15px 32px', borderRadius: 12, border: 'none',
                  background: '#0F172A', color: '#fff',
                  fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(15,23,42,0.2)',
                  fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                Start for Free <span>→</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/login')}
                style={{
                  padding: '15px 32px', borderRadius: 12,
                  border: '1.5px solid rgba(15,23,42,0.2)', background: 'rgba(255,255,255,0.5)',
                  color: '#0F172A', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  fontFamily: 'inherit',
                }}>
                Sign In
              </motion.button>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer style={{ background: '#0F172A', color: '#94A3B8', padding: '60px 0 30px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(20px, 5vw, 48px)' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr',
            gap: 40, marginBottom: 40,
          }} className="footer-grid">
            <div>
              <Logo dark size={42} />
              <p style={{
                fontSize: 14, lineHeight: 1.7, marginTop: 16,
                maxWidth: 320, opacity: 0.7,
              }}>
                The AI toolkit built exclusively for teachers and educators. Save 10+ hours a week, every week.
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                {[
                  { name: 'Twitter', icon: 'M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z' },
                  { name: 'LinkedIn', icon: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z' },
                  { name: 'YouTube', icon: 'M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z M9.75 15.02l5.75-3.27-5.75-3.27v6.54z' },
                ].map(s => (
                  <a key={s.name} href="#" style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#94A3B8', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#3B82F6'; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#94A3B8' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d={s.icon}/></svg>
                  </a>
                ))}
              </div>
            </div>

            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Testimonials', 'FAQ'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
              { title: 'Legal', links: ['Privacy', 'Terms', 'Cookies', 'Security'] },
            ].map((col, i) => (
              <div key={i}>
                <h4 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 15, fontWeight: 700, color: '#fff',
                  margin: '0 0 16px', letterSpacing: '-0.2px',
                }}>{col.title}</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {col.links.map(link => (
                    <li key={link} style={{ marginBottom: 9 }}>
                      <a href="#" style={{
                        fontSize: 13.5, color: '#94A3B8',
                        textDecoration: 'none', transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                      onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
                      >{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div style={{
            paddingTop: 26, borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: 12,
          }}>
            <p style={{ fontSize: 13, opacity: 0.7, margin: 0 }}>
              &copy; {new Date().getFullYear()} CodeVidhya. ClassroomAI — built with ♥ for teachers.
            </p>
            <p style={{ fontSize: 13, opacity: 0.5, margin: 0 }}>
              Made in India 🇮🇳
            </p>
          </div>
        </div>
      </footer>

      {/* RESPONSIVE STYLES */}
      <style>{`
        @media (max-width: 880px) {
          .nav-links { display: none !important; }
          .hero-grid, .how-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  )
}

// ── DECORATIVE FLOATING SHAPE ────────────────────────────────────
function FloatingShape({ top, left, right, delay, icon }) {
  return (
    <motion.div
      animate={{
        y: [0, -20, 0],
        rotate: [0, 10, 0],
      }}
      transition={{
        duration: 6, repeat: Infinity,
        ease: 'easeInOut', delay,
      }}
      style={{
        position: 'absolute',
        top, left, right,
        fontSize: 32, opacity: 0.5,
        filter: 'drop-shadow(0 8px 20px rgba(59,130,246,0.2))',
        zIndex: 1, pointerEvents: 'none',
      }}>
      {icon}
    </motion.div>
  )
}
