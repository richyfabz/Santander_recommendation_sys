// HomePage — hero section, feature cards, pipeline overview
// Animations: staggered fade-up on load, card hover lifts

import { Link } from 'react-router-dom';

// Stat items shown in the hero band
const STATS = [
  { value: '922k',    label: 'Active customers' },
  { value: '24',      label: 'Product classes'  },
  { value: '0.699',   label: 'MAP@7 score'      },
  { value: '476',     label: 'Boost rounds'     },
];

// Feature cards below the hero
const FEATURES = [
  {
    icon: '🔍',
    title: 'Smart Recommendations',
    desc: 'XGBoost multi-class classifier trained on 33k product addition events, returning top-5 personalised recommendations per customer.',
    delay: 'fade-up-2',
  },
  {
    icon: '📊',
    title: 'Live Metrics Dashboard',
    desc: 'MAP@7, AUC-ROC, and per-product precision/recall visualised in real time. Early stopping at round 476 prevents overfitting.',
    delay: 'fade-up-3',
  },
  {
    icon: '🧬',
    title: '8-Stage ML Pipeline',
    desc: 'From raw 13M-row CSV to serving predictions — ingestion, cohort selection, feature engineering, training, and monitoring.',
    delay: 'fade-up-4',
  },
];

export default function HomePage() {
  return (
    <main>

      {/* ── Hero ── */}
      <section style={styles.hero}>
        {/* Decorative blobs */}
        <span style={styles.blob1} aria-hidden="true" />
        <span style={styles.blob2} aria-hidden="true" />

        <div className="container" style={styles.heroInner}>
          <p className="fade-up fade-up-1" style={styles.eyebrow}>
            Santander Product Recommendation · ML Portfolio
          </p>
          <h1 className="fade-up fade-up-2" style={styles.heroTitle}>
            Bank Product<br />
            <span style={styles.heroAccent}>Recommendation</span><br />
            Engine
          </h1>
          <p className="fade-up fade-up-3" style={styles.heroSub}>
            An end-to-end gradient-boosting system that predicts which
            new financial products each customer will add next month.
          </p>
          <div className="fade-up fade-up-4" style={styles.heroCta}>
            <Link to="/search" className="btn-primary">
              Try a Recommendation →
            </Link>
            <Link to="/about" style={styles.ctaSecondary}>
              See how it works
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats band ── */}
      <section style={styles.statsBand}>
        <div className="container" style={styles.statsGrid}>
          {STATS.map(({ value, label }, i) => (
            <div key={label} className={`fade-up fade-up-${i + 1}`}
                 style={styles.statItem}>
              <span style={styles.statValue}>{value}</span>
              <span style={styles.statLabel}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section className="page-section container">
        <h2 className="section-title fade-up">What this system does</h2>
        <p className="section-subtitle fade-up fade-up-1">
          A complete ML pipeline from raw data to live predictions.
        </p>
        <div style={styles.featureGrid}>
          {FEATURES.map(({ icon, title, desc, delay }) => (
            <div key={title} className={`card fade-up ${delay}`}
                 style={styles.featureCard}>
              <span style={styles.featureIcon}>{icon}</span>
              <h3 style={styles.featureTitle}>{title}</h3>
              <p style={styles.featureDesc}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA strip ── */}
      <section style={styles.ctaStrip}>
        <div className="container" style={styles.ctaStripInner}>
          <div>
            <h2 style={styles.ctaStripTitle}>Ready to explore?</h2>
            <p style={styles.ctaStripSub}>
              Enter a customer ID and get personalised product recommendations instantly.
            </p>
          </div>
          <Link to="/search" className="btn-primary" style={{ flexShrink: 0 }}>
            Get Recommendations →
          </Link>
        </div>
      </section>

    </main>
  );
}

const styles = {
  /* Hero */
  hero: {
    position: 'relative',
    overflow: 'hidden',
    padding: '96px 0 80px',
    background: 'linear-gradient(160deg, var(--pink-50) 0%, #fff4f8 50%, var(--grey-50) 100%)',
  },
  blob1: {
    position: 'absolute', top: -80, right: -80,
    width: 420, height: 420, borderRadius: '50%',
    background: 'radial-gradient(circle, var(--pink-200) 0%, transparent 70%)',
    opacity: 0.5, display: 'block',
  },
  blob2: {
    position: 'absolute', bottom: -60, left: '15%',
    width: 280, height: 280, borderRadius: '50%',
    background: 'radial-gradient(circle, var(--blue-100) 0%, transparent 70%)',
    opacity: 0.6, display: 'block',
  },
  heroInner: {
    position: 'relative',
    maxWidth: 680,
  },
  eyebrow: {
    fontSize: '0.8rem',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--pink-500)',
    marginBottom: 16,
  },
  heroTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(2.4rem, 5vw, 4rem)',
    fontWeight: 700,
    lineHeight: 1.1,
    color: 'var(--grey-900)',
    marginBottom: 24,
  },
  heroAccent: {
    color: 'var(--pink-500)',
  },
  heroSub: {
    fontSize: '1.1rem',
    color: 'var(--grey-700)',
    maxWidth: 520,
    marginBottom: 36,
    lineHeight: 1.7,
  },
  heroCta: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    flexWrap: 'wrap',
  },
  ctaSecondary: {
    color: 'var(--pink-600)',
    fontWeight: 500,
    textDecoration: 'none',
    fontSize: '0.95rem',
    borderBottom: '1px solid var(--pink-300)',
    paddingBottom: 2,
    transition: 'color 150ms ease, border-color 150ms ease',
  },

  /* Stats */
  statsBand: {
    background: 'linear-gradient(135deg, var(--pink-600) 0%, var(--pink-500) 100%)',
    padding: '40px 0',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 32,
    textAlign: 'center',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  statValue: {
    fontFamily: 'var(--font-display)',
    fontSize: '2.2rem',
    fontWeight: 700,
    color: '#ffffff',
  },
  statLabel: {
    fontSize: '0.82rem',
    color: 'rgba(255,255,255,0.75)',
    fontWeight: 500,
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
  },

  /* Feature cards */
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 24,
  },
  featureCard: {
    padding: '32px 28px',
  },
  featureIcon: {
    fontSize: '2rem',
    display: 'block',
    marginBottom: 16,
  },
  featureTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.2rem',
    fontWeight: 600,
    color: 'var(--pink-700)',
    marginBottom: 10,
  },
  featureDesc: {
    fontSize: '0.92rem',
    color: 'var(--grey-700)',
    lineHeight: 1.65,
  },

  /* CTA strip */
  ctaStrip: {
    background: 'var(--pink-50)',
    borderTop: '1px solid var(--pink-200)',
    borderBottom: '1px solid var(--pink-200)',
    padding: '56px 0',
    marginTop: 40,
  },
  ctaStripInner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 32,
    flexWrap: 'wrap',
  },
  ctaStripTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.8rem',
    fontWeight: 700,
    color: 'var(--pink-700)',
    marginBottom: 8,
  },
  ctaStripSub: {
    color: 'var(--grey-700)',
    fontSize: '0.95rem',
  },
};