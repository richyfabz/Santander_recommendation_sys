// AboutPage.jsx - A React component that serves as the "About" page for the Santander Product Recommendation project. 
// This page provides an overview of the project, including a description of the pipeline stages, 
// the technology stack used, and key results achieved. The component uses inline styles defined 
// in a JavaScript object to style the various sections of the page, such as the disclaimer, 
// pipeline stages, technology stack, and key results. The page also includes a call-to-action 
// section that encourages users to try out the recommendation system by entering a customer ID.
import { Link } from 'react-router-dom'

// The AboutPage component renders a page with information about the Santander Product Recommendation project,
// including a disclaimer, an overview of the pipeline stages, the technology stack used, and key results achieved. 
// The component uses inline styles defined in a JavaScript object to style the various sections of the page, and 
// includes a call-to-action section that encourages users to try out the recommendation system by 
// entering a customer ID.

const PIPELINE_STAGES = [
  { nb: 'NB 01', title: 'Data ingestion',         desc: '13.3M rows from train_ver2.csv streamed via chunked pandas and persisted to Parquet. Schema enforced — ncodpers int32, product cols int8.' },
  { nb: 'NB 02', title: 'Cohort selection',        desc: '3-month active window (Mar–May 2016). ~600k customers present in all three months retained. Cohort confirmed representative of full dataset.' },
  { nb: 'NB 03', title: 'Target engineering',      desc: 'ΔP difference vector computed per customer per month. Net-new product additions (ΔP=1) become training targets. Multi-add rows flattened — one row per new product.' },
  { nb: 'NB 04', title: 'Feature engineering',     desc: 'Lag-1 and lag-2 product ownership columns appended (48 lag columns). product_velocity, total_products_held_lag_1 computed. Renta imputed via province median.' },
  { nb: 'NB 05', title: 'Split & formatting',      desc: 'Dataset shuffled (seed=42) before 80/20 split to break target-index sorting from NB03. Stratification confirmed: 21 classes in train, 18 in val. XGBoost DMatrix built with sample weights.' },
  { nb: 'NB 06', title: 'Model training',          desc: 'XGBoost multi:softprob, 24 classes, eta=0.05, max_depth=6. Early stopping at round 476. Best val log-loss: 1.138. Training time: 11 minutes on CPU.' },
  { nb: 'NB 07', title: 'Evaluation',              desc: 'MAP@7 = 0.699 · AUC-ROC = 0.894 · Catalog coverage = 55.4%. All three deployment gates passed. Metrics logged to MLflow.' },
  { nb: 'NB 08', title: 'Monitoring simulation',   desc: 'PSI and KS drift detectors validated on synthetic economic shift scenario. CTR trigger fired at 40% corruption. Fairness gap computed across age bands.' },
]

const TECH_STACK = [
  { cat: 'ML pipeline',  items: ['XGBoost', 'scikit-learn', 'pandas', 'NumPy', 'FAISS', 'MLflow'] },
  { cat: 'Backend',      items: ['Flask', 'Flask-SQLAlchemy', 'Flask-CORS', 'SQLite', 'Gunicorn'] },
  { cat: 'Frontend',     items: ['React 18', 'React Router v6', 'Axios'] },
  { cat: 'Data',         items: ['Santander Kaggle competition dataset', 'Parquet', 'Apache Arrow'] },
]

// The AboutPage component is exported as the default export of this module, 
// allowing it to be imported and used in other parts of the application, such as in the 
// routing setup defined in App.jsx.
export default function AboutPage() {
  return (
    <div className="page">
      <div className="page-hero">
        <h1>About this project</h1>
        <p>
          An end-to-end bank product recommendation system built on the{' '}
          <strong>Santander Product Recommendation Kaggle competition dataset</strong>.
          This is a personal ML portfolio project not affiliated with or endorsed by Santander Group.
        </p>
      </div>

      {/* DISCLAIMER  */}
      <div style={styles.disclaimer} role="note">
        <span style={styles.disclaimerIcon}>ℹ</span>
        <p style={styles.disclaimerText}>
          This project uses the publicly available Santander dataset from Kaggle for educational
          and portfolio purposes only. It is not affiliated with, endorsed by, or representative of
          Banco Santander S.A. or any of its subsidiaries.
        </p>
      </div>

      {/* PIPELINE STAGES  */}
      <section style={{ marginBottom: 40 }} aria-label="Pipeline stages">
        <h2 style={styles.sectionTitle}>Pipeline 8 notebook stages</h2>
        <div style={styles.pipelineGrid}>
          {PIPELINE_STAGES.map(({ nb, title, desc }, i) => (
            <div
              key   = {nb}
              className="card"
              style = {{
                borderTop  : '3px solid #A50034',
                animation  : `fadeUp 0.3s ease ${i * 60}ms both`,
              }}
            >
              <div style={styles.nbBadge}>{nb}</div>
              <h3 style={styles.stageTitle}>{title}</h3>
              <p style={styles.stageDesc}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TECH STACK  */}
      <section style={{ marginBottom: 40 }} aria-label="Technology stack">
        <h2 style={styles.sectionTitle}>Technology stack</h2>
        <div style={styles.techGrid}>
          {TECH_STACK.map(({ cat, items }) => (
            <div key={cat} className="card">
              <h3 style={styles.techCat}>{cat}</h3>
              <div style={styles.techItems}>
                {items.map(item => (
                  <span key={item} style={styles.techTag}>{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* KEY RESULTS */}
      <section className="card" style={{ marginBottom: 40 }} aria-label="Key results">
        <h2 style={styles.sectionTitle}>Key results</h2>
        <div style={styles.resultsGrid}>
          {[
            { metric: 'MAP@7',          value: '0.699',  context: 'vs 0.028 threshold' },
            { metric: 'AUC-ROC',        value: '0.894',  context: 'macro one-vs-rest' },
            { metric: 'Coverage',       value: '55.4%',  context: '13 of 24 products' },
            { metric: 'Training rows',  value: '33,870', context: 'product addition events' },
            { metric: 'Early stop',     value: 'Rd. 476',context: 'of 500 max rounds' },
            { metric: 'Val log-loss',   value: '1.138',  context: 'best iteration' },
          ].map(({ metric, value, context }) => (
            <div key={metric} style={styles.resultItem}>
              <div style={styles.resultValue}>{value}</div>
              <div style={styles.resultMetric}>{metric}</div>
              <div style={styles.resultContext}>{context}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div style={styles.cta}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          Ready to try it?
        </h2>
        <p style={{ fontSize: 14, color: '#6B6B65', marginBottom: 20 }}>
          Enter a customer ID and see the XGBoost model generate recommendations in real time
        </p>
        <Link to="/search" className="btn-red">
          Try a recommendation →
        </Link>
      </div>

    </div>
  )
}

// Styles for the AboutPage component, defined as a JavaScript object. 
// These styles are applied inline to the respective elements in the JSX. 
// The styles include layout properties such as display, flexbox settings, padding, 
// and colors to create a visually appealing and responsive about page that effectively 
// presents the project's pipeline stages, technology stack, and key results.
const styles = {
  disclaimer: {
    display     : 'flex',
    gap         : 12,
    padding     : '14px 16px',
    borderRadius: 10,
    background  : 'rgba(165,0,52,0.04)',
    border      : '1px solid rgba(165,0,52,0.15)',
    marginBottom: 32,
  },
  disclaimerIcon: {
    fontSize  : 16,
    color     : '#A50034',
    flexShrink: 0,
    marginTop : 1,
  },
  disclaimerText: {
    fontSize: 13,
    color   : '#3D3D3A',
    lineHeight: 1.6,
  },
  sectionTitle: {
    fontSize    : 20,
    fontWeight  : 700,
    letterSpacing: '-0.01em',
    marginBottom: 16,
  },
  pipelineGrid: {
    display             : 'grid',
    gridTemplateColumns : 'repeat(auto-fit, minmax(240px, 1fr))',
    gap                 : 12,
  },
  nbBadge: {
    fontSize    : 10,
    fontWeight  : 700,
    color       : '#A50034',
    background  : 'rgba(165,0,52,0.08)',
    padding     : '3px 8px',
    borderRadius: 4,
    display     : 'inline-block',
    marginBottom: 8,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  stageTitle: {
    fontSize    : 14,
    fontWeight  : 700,
    color       : '#1A1A18',
    marginBottom: 6,
  },
  stageDesc: {
    fontSize : 12,
    color    : '#6B6B65',
    lineHeight: 1.65,
  },
  techGrid: {
    display             : 'grid',
    gridTemplateColumns : 'repeat(auto-fit, minmax(200px, 1fr))',
    gap                 : 12,
  },
  techCat: {
    fontSize    : 13,
    fontWeight  : 700,
    color       : '#A50034',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  techItems: {
    display : 'flex',
    flexWrap: 'wrap',
    gap     : 6,
  },
  techTag: {
    fontSize    : 12,
    padding     : '4px 10px',
    borderRadius: 6,
    background  : '#F4F3EF',
    color       : '#3D3D3A',
    fontWeight  : 500,
  },
  resultsGrid: {
    display             : 'grid',
    gridTemplateColumns : 'repeat(auto-fit, minmax(140px, 1fr))',
    gap                 : 12,
  },
  resultItem: {
    padding     : '14px 16px',
    background  : '#FFF5F7',
    borderRadius: 10,
    border      : '1px solid rgba(165,0,52,0.1)',
  },
  resultValue: {
    fontSize    : 22,
    fontWeight  : 800,
    color       : '#A50034',
    letterSpacing: '-0.02em',
    marginBottom: 3,
  },
  resultMetric: {
    fontSize  : 13,
    fontWeight: 600,
    color     : '#1A1A18',
    marginBottom: 2,
  },
  resultContext: {
    fontSize: 11,
    color   : '#9A9890',
  },
  cta: {
    textAlign   : 'center',
    padding     : '40px 24px',
    background  : '#fff',
    borderRadius: 16,
    border      : '1px solid rgba(0,0,0,0.07)',
  },
}