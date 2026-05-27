// HomePage — bold dark hero, animated stats, feature cards
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Animation variants — reused across sections
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  show: { transition: { staggerChildren: 0.1 } },
};

const STATS = [
  { value: '922k',  label: 'Active customers',  color: 'var(--pink-400)'  },
  { value: '24',    label: 'Product classes',    color: 'var(--blue-400)'  },
  
];




export default function HomePage() {
  return (
    <main style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>

      {/* ── Hero ── */}
      <section style={styles.hero}>
        <div className="grid-bg" />

        {/* Glow orbs */}
        <div style={styles.orb1} />
        <div style={styles.orb2} />

        <div className="container" style={styles.heroInner}>
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            style={styles.heroContent}
          >
            {/* Badge */}
            <motion.div variants={fadeUp}>
              <span className="badge">
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--pink-400)',
                  boxShadow: '0 0 8px var(--pink-400)',
                  display: 'inline-block',
                }} />
                Santander Product Recommendation · ML Portfolio
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={fadeUp} style={styles.heroTitle}>
              Bank Product<br />
              <span className="gradient-text">Recommendation</span><br />
              Engine
            </motion.h1>


            {/* CTAs */}
            {/* ── CTA BUTTONS — all three in one aligned row ── */}
          <div style={{
            display    : 'flex',
            gap        : '12px',
            alignItems : 'center',
            flexWrap   : 'wrap',
            marginTop  : '32px',
            }}>
            {/* Primary — main call to action, pink glow */}
            <Link to="/search" className="btn-primary">
              Try a recommendation →
            </Link>

            {/* Ghost — secondary action, pink outlined */}
            <Link to="/metrics" className="btn-ghost">
              View model metrics
            </Link>

            {/* Secondary — soft tertiary, muted text */}
            <Link to="/about" className="btn-secondary">
              How it works
            </Link>
          </div>
        
          </motion.div>
         </div>
        </section>

      {/* ── Stats band ── */}
      <section style={styles.statsBand}>
        <div className="divider" />
        <div className="container">
          <motion.div
            style={styles.statsGrid}
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.5 }}
          >
            {STATS.map(({ value, label, color }) => (
              <motion.div
                key={label}
                variants={fadeUp}
                style={styles.statItem}
              >
                <span style={{ ...styles.statValue, color }}>{value}</span>
                <span style={styles.statLabel}>{label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
        <div className="divider" />
      </section>

      

      {/* ── CTA strip ── */}
      <section style={styles.ctaStrip}>
        <div className="divider" />
        <div className="container" style={styles.ctaInner}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 style={styles.ctaTitle}>Ready to explore?</h2>
            <p style={styles.ctaSub}>
              Enter a customer ID and get personalised product
              recommendations instantly.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Link to="/search" className="btn-primary">
              Get Recommendations →
            </Link>
          </motion.div>
        </div>
        <div className="divider" />
      </section>

    </main>
  );
}

const styles = {
  hero: {
    position: 'relative', overflow: 'hidden',
    padding: '100px 0 80px',
    background: 'linear-gradient(160deg, var(--dark-900) 0%, var(--dark-800) 100%)',
    minHeight: '92vh',
    display: 'flex', alignItems: 'center',
  },
  orb1: {
    position: 'absolute', top: -120, right: -80,
    width: 500, height: 500, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(240,71,138,0.15) 0%, transparent 65%)',
    pointerEvents: 'none',
  },
  orb2: {
    position: 'absolute', bottom: -80, left: '10%',
    width: 340, height: 340, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 65%)',
    pointerEvents: 'none',
  },
  heroInner: { position: 'relative', width: '100%' },
  heroContent: { maxWidth: 660 },
  heroTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(2.8rem, 6vw, 5rem)',
    fontWeight: 800,
    lineHeight: 1.05,
    color: 'var(--text-primary)',
    margin: '24px 0 20px',
    letterSpacing: '-0.02em',
  },
  heroSub: {
    fontSize: '1.05rem',
    color: 'var(--text-muted)',
    maxWidth: 520,
    marginBottom: 40,
    lineHeight: 1.75,
  },
  heroCtas: {
    display: 'flex', gap: 16,
    flexWrap: 'wrap', alignItems: 'center',
  },

  /* Stats */
  statsBand: {
    background: 'var(--dark-800)',
    padding: '40px 0',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 32, padding: '24px 0',
    textAlign: 'center',
  },
  statItem: {
    display: 'flex', flexDirection: 'column', gap: 6,
  },
  statValue: {
    fontFamily: 'var(--font-display)',
    fontSize: '2.4rem', fontWeight: 800,
    letterSpacing: '-0.02em',
  },
  statLabel: {
    fontSize: '0.78rem', fontWeight: 600,
    color: 'var(--text-muted)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },

  /* Feature cards */
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: 20,
  },
  featureCard: {
    padding: '28px 24px',
    position: 'relative', overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 3, borderRadius: '20px 20px 0 0',
  },
  featureIcon: {
    fontSize: '1.8rem', display: 'block', marginBottom: 14,
  },
  featureTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.05rem', fontWeight: 700,
    color: 'var(--text-primary)', marginBottom: 10,
  },
  featureDesc: {
    fontSize: '0.88rem',
    color: 'var(--text-muted)', lineHeight: 1.7,
  },

  /* Pipeline */
  pipelineSection: {
    background: 'var(--dark-800)',
    padding: '80px 0',
    borderTop: '1px solid var(--border-subtle)',
    borderBottom: '1px solid var(--border-subtle)',
  },
  pipelineGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 16,
  },
  pipelineCard: {
    display: 'flex', flexDirection: 'column', gap: 6,
    padding: '20px',
    background: 'var(--dark-700)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    transition: 'border-color 150ms ease',
    cursor: 'default',
  },
  pipelineNum: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.75rem', fontWeight: 800,
    color: 'var(--pink-400)', letterSpacing: '0.08em',
  },
  pipelineTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.95rem', fontWeight: 700,
    color: 'var(--text-primary)',
  },
  pipelineDesc: {
    fontSize: '0.8rem', color: 'var(--text-muted)',
  },

  /* CTA */
  ctaStrip: {
    background: 'var(--dark-900)',
    padding: '56px 0',
  },
  ctaInner: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    gap: 32, flexWrap: 'wrap',
    padding: '24px 24px',
  },
  ctaTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '2rem', fontWeight: 800,
    color: 'var(--text-primary)', marginBottom: 8,
  },
  ctaSub: {
    color: 'var(--text-muted)', fontSize: '0.95rem',
    maxWidth: 460,
  },
};