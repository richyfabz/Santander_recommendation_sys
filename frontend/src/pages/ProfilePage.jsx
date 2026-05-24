// ProfilePage.jsx - This component renders the profile page for a specific customer, 
// displaying their demographics, product holdings, monitoring snapshot, and recommended products
//  based on the XGBoost inference engine. It fetches the customer's data from the backend API using 
// the getRecommendations function and handles loading and error states accordingly. 
// The page is structured with a hero banner, a breadcrumb navigation, and two columns 
// for detailed information and recommendations.
import { useEffect, useState } from 'react'
import { useParams, Link }     from 'react-router-dom'
import { getRecommendations }  from '../services/api'

// The ProfilePage component is the main component that renders the profile page for a specific customer.
// It uses the useParams hook from React Router to access the customer ID from the URL, 
// and the useState and useEffect hooks to manage state and side effects for fetching data 
// from the backend API. The component handles loading and error states, and displays the customer's 
// demographics, product holdings, monitoring snapshot, and recommended products in a structured layout 
// with appropriate styling. The page includes a breadcrumb navigation for easy access back to the search 
// page, and a hero banner that highlights the customer's profile information. The recommended products
//  are displayed with a mini probability bar to visualize the likelihood of the customer engaging with 
// each product.
export default function ProfilePage() {
  const { id }               = useParams()
  const [data,    setData]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]  = useState('')

  // Fetch customer profile data from the backend API when the component mounts or when the customer ID changes.
  useEffect(() => {
    if (!id) return
    setLoading(true)
    getRecommendations(parseInt(id))
      .then(setData)
      .catch(err => setError(err.response?.data?.message || 'Failed to load profile'))
      .finally(() => setLoading(false))
  }, [id])

  // Handle loading state by displaying skeleton loaders while the data is being fetched from the API.
  if (loading) {
    return (
      <div className="page">
        <div className="page-hero"><h1>Customer profile</h1></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3].map(i => (
            <div key={i} className="skeleton" style={{ height: 80 }} aria-hidden="true" />
          ))}
        </div>
      </div>
    )
  }
// Handle error state by displaying an error message if the customer data fails to load from the API.
  if (error) {
    return (
      <div className="page">
        <div className="page-hero">
          <h1>Customer not found</h1>
          <p>{error}</p>
        </div>
        <Link to="/search" className="btn-red">← Back to search</Link>
      </div>
    )
  }
// If the data is successfully loaded, render the customer's profile information, 
// including demographics, product holdings, monitoring snapshot, and recommended products. 
// If the data is null or undefined, return null to avoid rendering the page.
  if (!data) return null

  // Destructure the demographics data from the fetched customer data for easier access in the JSX.
  const d = data.demographics
// Render the profile page with the customer's information and recommendations, 
// using inline styles defined in the styles object for layout and design.
  return (
    <div className="page">

      {/*  BREADCRUMB  */}
      <div style={styles.breadcrumb}>
        <Link to="/search" style={styles.breadLink}>← Search</Link>
        <span style={styles.breadSep}>/</span>
        <span style={styles.breadCurrent}>Customer {data.customer_id}</span>
      </div>

      {/*  HERO BANNER  */}
      <div style={styles.heroBanner}>
        <div style={styles.avatarRing} aria-hidden="true">
          <div style={styles.avatarInner}>
            {String(data.customer_id).slice(-2)}
          </div>
        </div>
        <div>
          <h1 style={styles.profileName}>Customer {data.customer_id}</h1>
          <p style={styles.profileSub}>
            Santander feature store · Age {d.age} · {d.tenure_months} months tenure
          </p>
        </div>
      </div>

      <div style={styles.grid}>

        {/*  LEFT COLUMN  */}
        <div>

          {/* Demographics card */}
          <div className="card" style={styles.cardGap}>
            <h2 style={styles.cardTitle}>Demographics</h2>
            <dl>
              {[
                ['Customer ID',  data.customer_id],
                ['Age',          `${d.age} years`],
                ['Tenure',       `${d.tenure_months} months`],
                ['Annual income',`€${d.income?.toLocaleString() || '—'}`],
              ].map(([k, v]) => (
                <div key={k} style={styles.dlRow}>
                  <dt style={styles.dt}>{k}</dt>
                  <dd style={styles.dd}>{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Holdings card */}
          <div className="card" style={styles.cardGap}>
            <h2 style={styles.cardTitle}>Product holdings</h2>
            <div style={styles.tagsRow}>
              {data.holdings.length > 0
                ? data.holdings.map((h, i) => (
                    <span key={i} style={styles.holdingTag}>{h}</span>
                  ))
                : <span style={{ fontSize: 13, color: '#9A9890' }}>No holdings on record</span>
              }
            </div>
          </div>

          {/* Monitoring card */}
          <div className="card">
            <h2 style={styles.cardTitle}>Monitoring snapshot</h2>
            {data.pipeline_audit?.monitoring && (
              <dl>
                {[
                  ['Baseline CTR',    data.pipeline_audit.monitoring.baseline_ctr],
                  ['Current CTR',     data.pipeline_audit.monitoring.current_ctr],
                  ['CTR drop',        data.pipeline_audit.monitoring.ctr_drop],
                  ['Retrain status',  data.pipeline_audit.monitoring.retrain_status],
                ].map(([k, v]) => (
                  <div key={k} style={styles.dlRow}>
                    <dt style={styles.dt}>{k}</dt>
                    <dd style={{
                      ...styles.dd,
                      color: k === 'Retrain status' && String(v).includes('FIRED')
                        ? '#A50034' : '#1A1A18'
                    }}>
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

        </div>

        {/*  RIGHT COLUMN  */}
        <div>

          {/* Recommendations */}
          <div className="card">
            <h2 style={styles.cardTitle}>Recommended products</h2>
            <p style={{ fontSize: 13, color: '#9A9890', marginBottom: 16 }}>
              Top recommendations from the XGBoost inference engine
            </p>
            {data.recommendations.map((rec, i) => (
              <div
                key   = {rec.product_code}
                style = {{
                  ...styles.miniRecRow,
                  animation: `fadeUp 0.3s ease ${i * 60}ms both`,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={styles.miniRecName}>{rec.name}</div>
                  <div style={styles.miniRecCat}>{rec.category}</div>
                </div>
                {/* Mini probability bar */}
                <div style={styles.miniBarWrap}>
                  <div style={styles.miniBarBg}>
                    <div style={{
                      ...styles.miniBarFill,
                      width: `${rec.probability * 100}%`,
                      transitionDelay: `${i * 80 + 300}ms`,
                    }} />
                  </div>
                  <span style={styles.miniPct}>
                    {(rec.probability * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
            <Link
              to        = "/search"
              className = "btn-outline"
              style     = {{ display: 'block', textAlign: 'center', marginTop: 16 }}
            >
              Re-run with feedback →
            </Link>
          </div>

          {/* Pipeline gates */}
          <div className="card" style={{ marginTop: 14 }}>
            <h2 style={styles.cardTitle}>Deployment gates</h2>
            {Object.values(data.pipeline_audit?.gates || {}).map(gate => {
              const pass = gate.value >= gate.threshold
              return (
                <div key={gate.metric} style={styles.dlRow}>
                  <dt style={styles.dt}>{gate.metric}</dt>
                  <dd style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{gate.value}</span>
                    <span style={{
                      fontSize    : 11,
                      fontWeight  : 600,
                      padding     : '2px 8px',
                      borderRadius: 20,
                      ...(pass
                        ? { background: '#E1F5EE', color: '#0F6E56' }
                        : { background: '#FCE8E8', color: '#991F1F' })
                    }}>
                      {pass ? 'PASS' : 'FAIL'}
                    </span>
                  </dd>
                </div>
              )
            })}
          </div>

        </div>
      </div>
    </div>
  )
}

// Styles for the ProfilePage component, defined as a JavaScript object. 
// These styles are applied inline to the respective elements in the JSX. 
// The styles include layout properties such as display, flexbox settings, padding, 
// and colors to create a visually appealing and responsive profile page that effectively 
// presents the customer's information and recommendations.
const styles = {
  breadcrumb: {
    display    : 'flex',
    alignItems : 'center',
    gap        : 8,
    marginBottom: 20,
    fontSize   : 13,
  },
  breadLink: {
    color         : '#A50034',
    textDecoration: 'none',
    fontWeight    : 500,
  },
  breadSep    : { color: '#C8C7C2' },
  breadCurrent: { color: '#6B6B65' },
  heroBanner: {
    display     : 'flex',
    alignItems  : 'center',
    gap         : 20,
    marginBottom: 28,
    padding     : '20px 24px',
    background  : '#fff',
    borderRadius: 16,
    borderLeft  : '4px solid #A50034',
    boxShadow   : '0 1px 3px rgba(0,0,0,0.07)',
  },
  avatarRing: {
    width       : 56,
    height      : 56,
    borderRadius: '50%',
    background  : '#A50034',
    display     : 'flex',
    alignItems  : 'center',
    justifyContent: 'center',
    flexShrink  : 0,
  },
  avatarInner: {
    fontSize  : 20,
    fontWeight: 800,
    color     : '#fff',
    letterSpacing: '-0.02em',
  },
  profileName: {
    fontSize    : 22,
    fontWeight  : 800,
    color       : '#1A1A18',
    letterSpacing: '-0.02em',
  },
  profileSub: {
    fontSize: 13,
    color   : '#9A9890',
    marginTop: 3,
  },
  grid: {
    display             : 'grid',
    gridTemplateColumns : '1fr 1fr',
    gap                 : 14,
    alignItems          : 'start',
  },
  cardGap: {
    marginBottom: 14,
  },
  cardTitle: {
    fontSize    : 16,
    fontWeight  : 700,
    color       : '#1A1A18',
    marginBottom: 14,
  },
  dlRow: {
    display        : 'flex',
    justifyContent : 'space-between',
    alignItems     : 'center',
    padding        : '8px 0',
    borderBottom   : '1px solid rgba(0,0,0,0.05)',
  },
  dt: { fontSize: 13, color: '#9A9890' },
  dd: { fontSize: 13, fontWeight: 600, color: '#1A1A18' },
  tagsRow: { display: 'flex', flexWrap: 'wrap', gap: 7 },
  holdingTag: {
    fontSize    : 13,
    padding     : '5px 12px',
    borderRadius: 20,
    background  : 'rgba(165,0,52,0.08)',
    color       : '#A50034',
    fontWeight  : 500,
    border      : '1px solid rgba(165,0,52,0.2)',
  },
  miniRecRow: {
    display    : 'flex',
    alignItems : 'center',
    gap        : 12,
    padding    : '9px 0',
    borderBottom: '1px solid rgba(0,0,0,0.05)',
  },
  miniRecName: { fontSize: 14, fontWeight: 600, color: '#1A1A18' },
  miniRecCat : { fontSize: 12, color: '#9A9890', marginTop: 1 },
  miniBarWrap: { display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 },
  miniBarBg  : { flex: 1, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.07)', overflow: 'hidden' },
  miniBarFill: {
    height    : '100%',
    borderRadius: 2,
    background: '#A50034',
    width     : '0%',
    transition: 'width 0.7s cubic-bezier(0.25,0.46,0.45,0.94)',
  },
  miniPct: { fontSize: 12, fontWeight: 700, color: '#A50034', minWidth: 38, textAlign: 'right' },
}