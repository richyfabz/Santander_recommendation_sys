// Home page component that serves as the landing page for the application,
//  providing an overview of the recommendation system, key statistics, and deployment status.
import { Link } from 'react-router-dom' // Link component from React Router for client-side navigation
import { useEffect, useState } from 'react' // React hooks for managing state and side effects
import { getHealth } from '../services/api' // API service function to fetch the health status of the model deployment

// Animated stat card for the hero section
function StatCard({ value, label, delay = 0 }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  return (
    <div style={{
      ...styles.statCard,
      opacity  : visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(10px)',
      transition: `opacity 0.4s ease ${delay}ms, transform 0.4s ease ${delay}ms`,
    }}>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  )
}

// Main HomePage component that renders the hero section, model statistics,
// how it works steps, and deployment gate status. It uses the getHealth API function 
// to fetch the health status of the model deployment and displays it in a dedicated section. 
// The component is styled using inline styles defined in a JavaScript object.
export default function HomePage() {
  const [health, setHealth] = useState(null)

  useEffect(() => {
    getHealth().then(setHealth).catch(() => {})
  }, [])

  return (
    <div className="page">

      {/*  HERO  */}
      <section style={styles.hero} aria-label="Hero section">

        {/* Red accent bar */}
        <div style={styles.accentBar} aria-hidden="true" />

        <div style={styles.heroContent}>
          <span style={styles.tag}>ML · Recommendation System</span>
          <h1 style={styles.heroTitle}>
            Bank product<br />
            <span style={styles.heroRed}>recommendations</span><br />
            powered by XGBoost
          </h1>
          <p style={styles.heroSub}>
            A full end-to-end machine learning pipeline trained on the
            Santander Kaggle dataset 33,870 customer product additions,
            24 product classes, MAP@7 of 0.699.
          </p>
          <div style={styles.heroBtns}>
            <Link to="/search" className="btn-red">
              Try a recommendation →
            </Link>
            <Link to="/metrics" className="btn-outline">
              View model metrics
            </Link>
          </div>
        </div>

        {/* Red panel on the right */}
        <div style={styles.heroPanel} aria-hidden="true">
          <div style={styles.panelInner}>
            <div style={styles.panelLabel}>Model confidence</div>
            {[84, 61, 43, 27].map((v, i) => (
              <div key={i} style={styles.panelBar}>
                <div style={styles.panelBarBg}>
                  <div style={{
                    ...styles.panelBarFill,
                    width: `${v}%`,
                    transitionDelay: `${300 + i * 100}ms`,
                  }} />
                </div>
                <span style={styles.panelPct}>{v}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS ROW  */}
      <section style={styles.statsRow} aria-label="Model statistics">
        <StatCard value="0.699"  label="MAP@7 score"       delay={100} />
        <StatCard value="0.894"  label="AUC-ROC"            delay={180} />
        <StatCard value="55.4%"  label="Catalog coverage"   delay={260} />
        <StatCard value="24"     label="Product classes"    delay={340} />
        <StatCard value="33,870" label="Training events"    delay={420} />
      </section>

      {/*  HOW IT WORKS  */}
      <section style={{ marginBottom: 48 }} aria-label="How the system works">
        <h2 style={styles.sectionTitle}>How it works</h2>
        <div style={styles.stepsGrid}>
          {[
            { n: '01', title: 'Data ingestion',    body: '13.3M rows from the Santander Kaggle dataset ingested into Parquet format with strict schema enforcement.' },
            { n: '02', title: 'Feature engineering', body: 'Lag features, product velocity, and income imputation applied across a 3-month active customer cohort.' },
            { n: '03', title: 'XGBoost training',  body: 'Multi-class softprob objective across 24 product classes. Early stopping at round 476 with MAP@7 = 0.699.' },
            { n: '04', title: 'Live inference',    body: 'Flask API serves top-N recommendations per customer ID with business-logic masking of already-owned products.' },
          ].map(({ n, title, body }, i) => (
            <div
              key   = {n}
              style = {{
                ...styles.stepCard,
                animationDelay: `${i * 80}ms`,
              }}
              className="card"
            >
              <div style={styles.stepNum}>{n}</div>
              <h3 style={styles.stepTitle}>{title}</h3>
              <p style={styles.stepBody}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/*  DEPLOYMENT STATUS  */}
      {health && (
        <section className="card" aria-label="Deployment gate status">
          <div style={styles.gateHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Deployment gate</h2>
              <p style={{ fontSize: 13, color: '#6B6B65', marginTop: 2 }}>
                All gates must pass before model serves production traffic
              </p>
            </div>
            <span
              className="gate-pill"
              style={{
                ...(health.gates.all_pass
                  ? { background: '#E1F5EE', color: '#0F6E56' }
                  : { background: '#FCE8E8', color: '#991F1F' }),
                fontSize: 13,
                padding : '6px 14px',
              }}
            >
              {health.gates.all_pass ? '✓ All gates passed' : '✗ Gate failure'}
            </span>
          </div>
          <div style={styles.gateGrid}>
            {[
              { label: 'MAP@7 ≥ 0.028',      value: health.metrics.map_at_7.toFixed(3),      pass: health.gates.map7_pass },
              { label: 'AUC-ROC ≥ 0.70',     value: health.metrics.auc_roc.toFixed(3),       pass: health.gates.auc_pass  },
              { label: 'Coverage ≥ 50%',      value: `${health.metrics.catalog_coverage}%`,   pass: health.gates.coverage_pass },
            ].map(({ label, value, pass }) => (
              <div key={label} style={styles.gateRow}>
                <span style={styles.gateLabel}>{label}</span>
                <div style={styles.gateRight}>
                  <span style={styles.gateValue}>{value}</span>
                  <span
                    className="gate-pill"
                    style={pass
                      ? { background: '#E1F5EE', color: '#0F6E56' }
                      : { background: '#FCE8E8', color: '#991F1F' }
                    }
                  >
                    {pass ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  )
}

// Styles for the HomePage component, defined as a JavaScript object. 
// These styles are applied inline to the respective elements in the JSX. 
// The styles include layout properties such as display, flexbox settings, padding, colors,
//  typography, and animations to create a visually appealing and responsive home page that 
// effectively communicates the key features and performance of the recommendation system.
const styles = {
  hero: {
    display      : 'flex',
    gap          : 32,
    alignItems   : 'center',
    marginBottom : 40,
    position     : 'relative',
    minHeight    : 340,
  },
  accentBar: {
    position    : 'absolute',
    left        : -24,
    top         : 0,
    bottom      : 0,
    width       : 4,
    background  : '#A50034',
    borderRadius: '0 3px 3px 0',
  },
  heroContent: {
    flex: 1,
    paddingLeft: 20,
  },
  tag: {
    display     : 'inline-block',
    fontSize    : 11,
    fontWeight  : 600,
    color       : '#A50034',
    background  : 'rgba(165,0,52,0.08)',
    padding     : '4px 10px',
    borderRadius: 20,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize    : 40,
    fontWeight  : 800,
    lineHeight  : 1.15,
    letterSpacing: '-0.025em',
    marginBottom: 16,
    color       : '#1A1A18',
  },
  heroRed: {
    color: '#A50034',
  },
  heroSub: {
    fontSize    : 15,
    color       : '#6B6B65',
    lineHeight  : 1.7,
    marginBottom: 24,
    maxWidth    : 440,
  },
  heroBtns: {
    display : 'flex',
    gap     : 12,
    flexWrap: 'wrap',
  },
  heroPanel: {
    width       : 240,
    flexShrink  : 0,
    background  : '#A50034',
    borderRadius: 16,
    padding     : 24,
    animation   : 'fadeIn 0.5s ease 0.2s both',
  },
  panelInner: { color: '#fff' },
  panelLabel: {
    fontSize    : 11,
    fontWeight  : 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    opacity     : 0.7,
    marginBottom: 16,
  },
  panelBar: {
    display    : 'flex',
    alignItems : 'center',
    gap        : 8,
    marginBottom: 10,
  },
  panelBarBg: {
    flex        : 1,
    height      : 5,
    borderRadius: 3,
    background  : 'rgba(255,255,255,0.25)',
    overflow    : 'hidden',
  },
  panelBarFill: {
    height      : '100%',
    borderRadius: 3,
    background  : '#fff',
    width       : 0,
    transition  : 'width 0.75s cubic-bezier(0.25,0.46,0.45,0.94)',
  },
  panelPct: {
    fontSize  : 12,
    fontWeight: 600,
    minWidth  : 32,
    textAlign : 'right',
    opacity   : 0.9,
  },
  statsRow: {
    display             : 'grid',
    gridTemplateColumns : 'repeat(auto-fit, minmax(140px, 1fr))',
    gap                 : 10,
    marginBottom        : 40,
  },
  statCard: {
    background  : '#fff',
    border      : '1px solid rgba(0,0,0,0.07)',
    borderRadius: 12,
    padding     : '16px 18px',
    borderTop   : '3px solid #A50034',
  },
  statValue: {
    fontSize    : 24,
    fontWeight  : 700,
    color       : '#A50034',
    letterSpacing: '-0.02em',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color   : '#9A9890',
    fontWeight: 500,
  },
  sectionTitle: {
    fontSize    : 20,
    fontWeight  : 700,
    color       : '#1A1A18',
    letterSpacing: '-0.01em',
    marginBottom: 16,
  },
  stepsGrid: {
    display             : 'grid',
    gridTemplateColumns : 'repeat(auto-fit, minmax(220px, 1fr))',
    gap                 : 14,
  },
  stepCard: {
    borderTop: '3px solid #A50034',
  },
  stepNum: {
    fontSize    : 28,
    fontWeight  : 800,
    color       : 'rgba(165,0,52,0.15)',
    lineHeight  : 1,
    marginBottom: 8,
  },
  stepTitle: {
    fontSize    : 15,
    fontWeight  : 600,
    marginBottom: 6,
    color       : '#1A1A18',
  },
  stepBody: {
    fontSize: 13,
    color   : '#6B6B65',
    lineHeight: 1.65,
  },
  gateHeader: {
    display        : 'flex',
    justifyContent : 'space-between',
    alignItems     : 'flex-start',
    marginBottom   : 20,
    flexWrap       : 'wrap',
    gap            : 10,
  },
  gateGrid: {
    display      : 'flex',
    flexDirection: 'column',
    gap          : 0,
  },
  gateRow: {
    display        : 'flex',
    justifyContent : 'space-between',
    alignItems     : 'center',
    padding        : '10px 0',
    borderBottom   : '1px solid rgba(0,0,0,0.05)',
  },
  gateLabel: {
    fontSize: 14,
    color   : '#3D3D3A',
  },
  gateRight: {
    display    : 'flex',
    alignItems : 'center',
    gap        : 10,
  },
  gateValue: {
    fontSize  : 15,
    fontWeight: 700,
    color     : '#1A1A18',
  },
}