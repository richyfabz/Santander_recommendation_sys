// OnboardingPage — personalised product recommendations for new customers
// No account needed — just fill in a few details and get started
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1, y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  },
};

const stagger = {
  show: { transition: { staggerChildren: 0.08 } },
};

// Colour mapped to probability strength — same pattern as SearchPage
function getProbColor(p) {
  if (p >= 0.50) return 'var(--green-400)';
  if (p >= 0.30) return 'var(--amber-400)';
  return 'var(--pink-400)';
}

// Category colour map — consistent with rest of app
const CATEGORY_COLORS = {
  Accounts: { bg: 'rgba(56,189,248,0.10)', text: 'var(--blue-400)', border: 'rgba(56,189,248,0.20)' },
  Cards: { bg: 'rgba(240,71,138,0.10)', text: 'var(--pink-300)', border: 'rgba(240,71,138,0.25)' },
  Credit: { bg: 'rgba(240,71,138,0.10)', text: 'var(--pink-300)', border: 'rgba(240,71,138,0.25)' },
  Investments: { bg: 'rgba(52,211,153,0.10)', text: 'var(--green-400)', border: 'rgba(52,211,153,0.20)' },
  Utilities: { bg: 'rgba(251,191,36,0.10)', text: 'var(--amber-400)', border: 'rgba(251,191,36,0.20)' },
};

export default function OnboardingPage() {
  const [formData, setFormData] = useState({
    name: '',
    age: 28,
    income: 45000,
    segment: '02 - PARTICULARES',
    gender: 'V',
  });

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  // Add this state below the others at the top of the component
  const [customerName, setCustomerName] = useState('');

  function handleChange(key, value) {
    setFormData(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSubmitted(false);

    try {
      const response = await fetch(
        'http://127.0.0.1:5000/api/v1/onboarding/recommend',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name   : formData.name.trim(), 
            age: parseInt(formData.age, 10),
            income: parseFloat(formData.income),
            segment: formData.segment,
            gender: formData.gender,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setRecommendations(data.recommendations || []);
        setCustomerName(data.customer_name || formData.name || 'you');
        setSubmitted(true);
      } else {
        setError(data.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setError(
        'Could not reach the server. Please make sure the app is running.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{
      background: 'var(--bg-page)',
      minHeight: '100vh',
      padding: '80px 0 80px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div className="grid-bg" />
      <div style={styles.orbPink} />
      <div style={styles.orbBlue} />

      <div className="container">

        {/* ── Page heading ── */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          style={{ marginBottom: 48 }}
        >
          <motion.div variants={fadeUp}>
            <span className="badge">
              <span style={styles.pulseDot} />
              New Customer
            </span>
          </motion.div>
          <motion.h1 variants={fadeUp} style={styles.pageTitle}>
            Find the right <span className="gradient-text">products</span><br />
            for you
          </motion.h1>
          <motion.p variants={fadeUp} style={styles.pageSubtitle}>
            Tell us a little about yourself and we'll suggest the Santander
            products that best match your needs no account required.
          </motion.p>
        </motion.div>

        {/* ── Two column layout ── */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          style={styles.layout}
        >

          {/* ── LEFT: Form ── */}
          <motion.div variants={fadeUp} style={styles.formCard}>
            <h2 style={styles.formTitle}>Your profile</h2>
            <p style={styles.formSub}>
              We use these details to personalise your recommendations.
              Nothing is stored.
            </p>

            <form onSubmit={handleSubmit} style={styles.form}>
              {/* Name — display only, personalises the results header */}
              <div style={styles.field}>
                <label style={styles.label}>What is your first name?</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                  style={styles.input}
                  className="search-input"
                  placeholder="e.g. Richard"
                  required
                  maxLength={60}
                />
              </div>
              {/* Age */}
              <div style={styles.field}>
                <label style={styles.label}>How old are you?</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={e => handleChange('age', e.target.value)}
                  style={styles.input}
                  min="18"
                  max="110"
                  required
                  className="search-input"
                />
              </div>

              {/* Income */}
              <div style={styles.field}>
                <label style={styles.label}>
                  What is your approximate annual income? (€)
                </label>
                <input
                  type="number"
                  value={formData.income}
                  onChange={e => handleChange('income', e.target.value)}
                  style={styles.input}
                  min="0"
                  step="500"
                  required
                  className="search-input"
                  placeholder="e.g. 45000"
                />
                <span style={styles.fieldHint}>
                  This helps us understand which products suit your budget.
                </span>
              </div>

              {/* Segment */}
              <div style={styles.field}>
                <label style={styles.label}>
                  Which best describes you?
                </label>
                <select
                  value={formData.segment}
                  onChange={e => handleChange('segment', e.target.value)}
                  style={styles.select}
                  className="search-input"
                >
                  <option value="02 - PARTICULARES">
                    I'm a regular working professional
                  </option>
                  <option value="03 - UNIVERSITARIO">
                    I'm a student or recent graduate
                  </option>
                  <option value="01 - TOP">
                    I'm a high-income or business customer
                  </option>
                </select>
              </div>

              {/* Gender */}
              <div style={styles.field}>
                <label style={styles.label}>Gender</label>
                <select
                  value={formData.gender}
                  onChange={e => handleChange('gender', e.target.value)}
                  style={styles.select}
                  className="search-input"
                >
                  <option value="V">Male</option>
                  <option value="H">Female</option>
                </select>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                className="btn-primary"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  marginTop: 8,
                  width: '100%',
                  justifyContent: 'center',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading
                  ? 'Finding your products...'
                  : 'Show my recommendations →'}
              </motion.button>

            </form>
          </motion.div>

          {/* ── RIGHT: Results ── */}
          <motion.div variants={fadeUp} style={styles.resultsCol}>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={styles.errorBox}
                >
                  <span style={{ fontSize: '1.1rem' }}>⚠️</span>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      Something went wrong
                    </div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>
                      {error}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recommendations */}
            <AnimatePresence>
              {submitted && recommendations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Header */}
                  <div style={styles.resultsHeader}>
                    <h2 style={styles.resultsTitle}>
                      {customerName
                        ? `Products picked for ${customerName}`
                        : 'Products picked for you'}
                    </h2>
                    <p style={styles.resultsSub}>
                      Based on your profile, here are the products we think
                      would suit you best.
                    </p>
                  </div>

                  {/* Cards */}
                  <motion.div
                    variants={stagger}
                    initial="hidden"
                    animate="show"
                    style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                  >
                    {recommendations.map((item, i) => {
                      const color = getProbColor(item.probability);
                      const cat = CATEGORY_COLORS[item.category]
                        || CATEGORY_COLORS.Accounts;
                      const isTop = i === 0;
                      const pct = (item.probability * 100).toFixed(1);

                      return (
                        <motion.div
                          key={item.product_code}
                          variants={fadeUp}
                          whileHover={{
                            y: -3, scale: 1.01,
                            transition: {
                              type: 'spring', stiffness: 300, damping: 20,
                            },
                          }}
                          style={{
                            ...styles.recCard,
                            border: isTop
                              ? '1px solid rgba(240,71,138,0.45)'
                              : '1px solid var(--border-card)',
                          }}
                        >
                          {/* Top accent line */}
                          {isTop && (
                            <div style={styles.topAccent} />
                          )}

                          {/* Rank + category */}
                          <div style={styles.recTop}>
                            <div style={styles.recTopLeft}>
                              <span style={{
                                ...styles.rankBadge,
                                background: isTop
                                  ? 'var(--pink-400)' : 'var(--dark-600)',
                                color: isTop ? '#fff' : 'var(--text-muted)',
                                boxShadow: isTop
                                  ? '0 0 10px rgba(240,71,138,0.4)' : 'none',
                              }}>
                                #{i + 1}
                              </span>
                              <span style={{
                                ...styles.catBadge,
                                background: cat.bg,
                                color: cat.text,
                                border: `1px solid ${cat.border}`,
                              }}>
                                {item.category}
                              </span>
                            </div>
                            <span style={{ ...styles.pct, color }}>
                              {pct}% match
                            </span>
                          </div>

                          {/* Product name + description */}
                          <h3 style={styles.recName}>{item.name}</h3>
                          <p style={styles.recDesc}>{item.description}</p>

                          {/* Probability bar */}
                          <div style={styles.probRow}>
                            <div style={styles.probTrack}>
                              <motion.div
                                style={{
                                  ...styles.probFill,
                                  background: color,
                                  boxShadow: `0 0 6px ${color}`,
                                }}
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{
                                  duration: 0.8, delay: i * 0.08,
                                  ease: [0.22, 1, 0.36, 1],
                                }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>

                  {/* Footer note */}
                  <p style={styles.footerNote}>
                    These suggestions are generated by our ML model based on
                    customers with similar profiles. Speak to an advisor for
                    personalised financial guidance.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty state — before submission */}
            {!submitted && !error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={styles.emptyState}
              >
                <div style={styles.emptyIcon}>✨</div>
                <p style={styles.emptyTitle}>
                  Your recommendations will appear here
                </p>
                <p style={styles.emptySub}>
                  Fill in the form and we'll suggest the products that best
                  match your profile.
                </p>
              </motion.div>
            )}

          </motion.div>

        </motion.div>
      </div>

      <style>{`
        .search-input:focus {
          outline: none;
          border-color: var(--pink-400) !important;
          box-shadow: 0 0 0 3px rgba(240,71,138,0.15) !important;
        }
        select.search-input option {
          background: var(--dark-700);
          color: var(--text-primary);
        }
      `}</style>
    </main>
  );
}

const styles = {
  /* Background orbs */
  orbPink: {
    position: 'fixed', top: -140, left: -60,
    width: 450, height: 450, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(240,71,138,0.10) 0%, transparent 65%)',
    pointerEvents: 'none', zIndex: 0,
  },
  orbBlue: {
    position: 'fixed', bottom: -80, right: '5%',
    width: 400, height: 400, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 65%)',
    pointerEvents: 'none', zIndex: 0,
  },
  pulseDot: {
    width: 6, height: 6, borderRadius: '50%',
    background: 'var(--pink-400)',
    boxShadow: '0 0 8px var(--pink-400)',
    display: 'inline-block',
  },

  /* Page heading */
  pageTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(2.2rem, 4vw, 3.6rem)',
    fontWeight: 800,
    color: 'var(--text-primary)',
    margin: '20px 0 14px',
    letterSpacing: '-0.02em',
    lineHeight: 1.1,
  },
  pageSubtitle: {
    fontSize: '1rem',
    color: 'var(--text-muted)',
    maxWidth: 520,
    lineHeight: 1.75,
  },

  /* Layout */
  layout: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: 32,
    alignItems: 'start',
    position: 'relative',
    zIndex: 1,
  },

  /* Form card */
  formCard: {
    padding: '36px 40px',
    background: 'var(--dark-800)',
    border: '1px solid var(--border-card)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-card)',
  },
  formTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.4rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 6,
  },
  formSub: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    lineHeight: 1.6,
    marginBottom: 28,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--grey-300)',
    lineHeight: 1.4,
  },
  fieldHint: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: 3,
  },
  input: {
    padding: '12px 16px',
    background: 'var(--dark-700)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-card)',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.92rem',
    transition: 'border-color 150ms, box-shadow 150ms',
    outline: 'none',
  },
  select: {
    padding: '12px 16px',
    background: 'var(--dark-700)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-card)',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.92rem',
    cursor: 'pointer',
    outline: 'none',
    transition: 'border-color 150ms',
  },

  /* Results column */
  resultsCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    minHeight: 500,
  },
  resultsHeader: { marginBottom: 16 },
  resultsTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.4rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 6,
  },
  resultsSub: {
    fontSize: '0.88rem',
    color: 'var(--text-muted)',
    lineHeight: 1.6,
  },

  /* Recommendation card */
  recCard: {
    padding: '18px 20px',
    background: 'var(--dark-700)',
    borderRadius: 'var(--radius-lg)',
    position: 'relative',
    overflow: 'hidden',
    cursor: 'default',
    transition: 'box-shadow 280ms ease, border-color 280ms ease',
  },
  topAccent: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 3,
    background: 'var(--pink-400)',
    borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
  },
  recTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recTopLeft: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  rankBadge: {
    display: 'inline-block',
    borderRadius: 99,
    padding: '2px 10px',
    fontSize: '0.72rem',
    fontWeight: 800,
    letterSpacing: '0.06em',
    transition: 'all 150ms',
  },
  catBadge: {
    display: 'inline-block',
    borderRadius: 99,
    padding: '2px 10px',
    fontSize: '0.7rem',
    fontWeight: 600,
    letterSpacing: '0.04em',
  },
  pct: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.88rem',
    fontWeight: 700,
  },
  recName: {
    fontFamily: 'var(--font-display)',
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 4,
    lineHeight: 1.25,
  },
  recDesc: {
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
    lineHeight: 1.65,
    marginBottom: 12,
  },
  probRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  probTrack: {
    flex: 1,
    height: 5,
    borderRadius: 99,
    background: 'var(--dark-600)',
    overflow: 'hidden',
  },
  probFill: {
    height: '100%',
    borderRadius: 99,
  },

  /* Error */
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    background: 'rgba(240,71,138,0.08)',
    border: '1px solid rgba(240,71,138,0.25)',
    borderRadius: 'var(--radius-md)',
    padding: '16px 18px',
    color: 'var(--pink-300)',
    fontSize: '0.9rem',
  },

  /* Empty state */
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--dark-800)',
    borderRadius: 'var(--radius-lg)',
    border: '1px dashed var(--border-card)',
    padding: '60px 40px',
    textAlign: 'center',
    minHeight: 400,
  },
  emptyIcon: {
    fontSize: '2.4rem',
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: '0.88rem',
    color: 'var(--text-muted)',
    maxWidth: 300,
    lineHeight: 1.6,
  },

  /* Footer note */
  footerNote: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    lineHeight: 1.6,
    marginTop: 16,
    padding: '12px 16px',
    background: 'var(--dark-800)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-subtle)',
  },
};