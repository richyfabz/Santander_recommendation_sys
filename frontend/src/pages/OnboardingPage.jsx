// OnboardingPage — Cold-start form processing for new customer matrix profiling
import React, { useState } from 'react';
import { motion } from 'framer-motion';

// Align with the exact easing curves and spring timings used in your HomePage
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } 
  },
};

const stagger = {
  show: { transition: { staggerChildren: 0.08 } },
};

export default function OnboardingPage() {
  // Form input matrix staging maps matching expected backend data structure
  const [formData, setFormData] = useState({
    age: 28,
    income: 45000.0,
    segment: '02 - PARTICULARES',
    gender: 'V'
  });

  // UI state tracking mirrors operational dashboard patterns
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Updates specific targeted keys dynamically within our form data map
  const handleInputChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  // Coordinates real-time async post requests targeting the Stage A inference API
  const handleFetchRecommendations = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Connect directly to the newly established /api/v1 prefix mapping
      const response = await fetch('http://127.0.0.1:5000/api/v1/onboarding/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          age: parseInt(formData.age, 10),
          income: parseFloat(formData.income),
          segment: formData.segment,
          gender: formData.gender
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setRecommendations(data.recommendations || []);
      } else {
        setError(data.message || 'Failed to capture cold-start affinity arrays.');
      }
    } catch (err) {
      setError('Network communication drop encountered. Verify Flask server uptime status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ background: 'var(--bg-page)', minHeight: '100vh', padding: '120px 0 80px' }}>
      <div className="grid-bg" />
      
      {/* Structural accent glow orbs mapped precisely to your styling architecture */}
      <div style={styles.orbPink} />
      <div style={styles.orbBlue} />

      <div className="container">
        <motion.div 
          variants={stagger} 
          initial="hidden" 
          animate="show" 
          style={styles.layoutSplit}
        >
          
          {/* ── Left Column: Synthetic Input Generation Interface ── */}
          <motion.div variants={fadeUp} style={styles.cardContainer}>
            <span className="badge">
              <span style={styles.badgePulseIndicator} />
              Cold-Start System Stage A
            </span>
            
            <h1 style={styles.pageTitle}>
              Client <span className="gradient-text">Onboarding</span> Profile
            </h1>
            <p style={styles.pageSubtitle}>
              Generate an evaluation vector manually for un-registered entities to trigger immediate multi-class product predictions.
            </p>

            <form onSubmit={handleFetchRecommendations} style={styles.formContainer}>
              <div style={styles.formGroup}>
                <label style={styles.fieldLabel}>Age Parameter</label>
                <input 
                  type="number" 
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  style={styles.textInput}
                  min="18"
                  max="110"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.fieldLabel}>Gross Annual Income (Renta, €)</label>
                <input 
                  type="number" 
                  value={formData.income}
                  onChange={(e) => handleInputChange('income', e.target.value)}
                  style={styles.textInput}
                  min="0"
                  step="500"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.fieldLabel}>Target Marketing Segment</label>
                <select 
                  value={formData.segment} 
                  onChange={(e) => handleInputChange('segment', e.target.value)}
                  style={styles.dropdownInput}
                >
                  <option value="02 - PARTICULARES">02 - PARTICULARES (Standard Retail)</option>
                  <option value="03 - UNIVERSITARIO">03 - UNIVERSITARIO (Higher Ed Student)</option>
                  <option value="01 - TOP">01 - TOP (High-Net-Worth VIP)</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.fieldLabel}>Gender Categorization Code</label>
                <select 
                  value={formData.gender} 
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  style={styles.dropdownInput}
                >
                  <option value="V">V (Male Identity Flag)</option>
                  <option value="H">H (Female Identity Flag)</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                style={{ marginTop: '12px', width: '100%', justifyContent: 'center' }}
                disabled={loading}
              >
                {loading ? 'Running Inference Loop...' : 'Generate Propensities →'}
              </button>
            </form>
          </motion.div>

          {/* ── Right Column: Vector Propensity Result Cards ── */}
          <motion.div variants={fadeUp} style={styles.resultsWrapper}>
            {error && (
              <div style={styles.errorAlert}>
                <span style={{ color: 'var(--amber-400)', fontWeight: 700 }}>⚠️ Matrix Fault:</span> {error}
              </div>
            )}

            {recommendations.length > 0 ? (
              <div style={styles.resultsTimeline}>
                <h3 style={styles.resultsHeader}>
                  Model Output Affinity Matrix <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>({recommendations.length} classes extracted)</span>
                </h3>
                
                {recommendations.map((item, index) => (
                  <div key={item.product_code} style={styles.propensityRow}>
                    {/* Visual rank indicator badge matching card boundaries */}
                    <div style={styles.rankBadge}>{index + 1}</div>
                    
                    <div style={styles.productMetaBlock}>
                      <div style={styles.productTitleLine}>
                        <span style={styles.productNameText}>{item.name}</span>
                        <span style={styles.productCodeBadge}>{item.product_code}</span>
                      </div>
                      <p style={styles.productDescText}>{item.description}</p>
                    </div>

                    {/* Probability confidence display with embedded bar overlay graphics */}
                    <div style={styles.metricOutputContainer}>
                      <span style={styles.metricPercentageText}>
                        {(item.probability * 100).toFixed(2)}%
                      </span>
                      <div style={styles.barGraphTrack}>
                        <div style={{ ...styles.barGraphFill, width: `${item.probability * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.emptyPlaceholderState}>
                <div style={styles.placeholderDashedBox}>
                  <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                    Awaiting Profile Matrix Submission
                  </p>
                  <p style={{ color: 'var(--grey-500)', fontSize: '0.82rem', marginTop: '4px' }}>
                    Adjust client attributes and execute the booster calculation to capture confidence indices.
                  </p>
                </div>
              </div>
            )}
          </motion.div>

        </motion.div>
      </div>
    </main>
  );
}

// Inline styles designed carefully around your custom index.css layout architecture tokens
const styles = {
  layoutSplit: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
    gap: '40px',
    alignItems: 'start',
    position: 'relative',
    zIndex: 1
  },
  orbPink: {
    position: 'absolute', top: -140, left: -60,
    width: 450, height: 450, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(240,71,138,0.12) 0%, transparent 65%)',
    pointerEvents: 'none', zIndex: 0
  },
  orbBlue: {
    position: 'absolute', bottom: -80, right: '5%',
    width: 400, height: 400, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 65%)',
    pointerEvents: 'none', zIndex: 0
  },
  badgePulseIndicator: {
    width: 6, height: 6, borderRadius: '50%',
    background: 'var(--pink-400)',
    boxShadow: '0 0 8px var(--pink-400)',
    display: 'inline-block',
  },
  cardContainer: {
    padding: '40px',
    background: 'var(--dark-800)',
    border: '1px solid var(--border-card)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-card)'
  },
  pageTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '2.5rem', fontWeight: 800,
    color: 'var(--text-primary)',
    margin: '20px 0 12px',
    letterSpacing: '-0.02em',
    lineHeight: 1.1
  },
  pageSubtitle: {
    fontSize: '0.92rem', color: 'var(--text-muted)',
    lineHeight: 1.6, marginBottom: '32px'
  },
  formContainer: {
    display: 'flex', flexDirection: 'column', gap: '20px'
  },
  formGroup: {
    display: 'flex', flexDirection: 'column', gap: '6px'
  },
  fieldLabel: {
    fontSize: '0.78rem', fontWeight: 600,
    color: 'var(--grey-300)', letterSpacing: '0.03em',
    textTransform: 'uppercase'
  },
  textInput: {
    padding: '12px 16px',
    background: 'var(--dark-700)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-card)',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'var(--font-body)', fontSize: '0.92rem',
    transition: 'border-color var(--t-fast)',
    outline: 'none'
  },
  dropdownInput: {
    padding: '12px 16px',
    background: 'var(--dark-700)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-card)',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'var(--font-body)', fontSize: '0.92rem',
    cursor: 'pointer', outline: 'none'
  },
  resultsWrapper: {
    display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '500px'
  },
  resultsHeader: {
    fontFamily: 'var(--font-display)', fontSize: '1.2rem',
    fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px'
  },
  resultsTimeline: {
    padding: '32px', background: 'var(--dark-950)',
    border: '1px solid rgba(255, 255, 255, 0.03)',
    borderRadius: 'var(--radius-lg)', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)'
  },
  propensityRow: {
    display: 'flex', alignItems: 'center', gap: '16px',
    padding: '16px', background: 'var(--dark-800)',
    border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
    marginBottom: '12px', transition: 'border-color var(--t-fast)'
  },
  rankBadge: {
    width: '28px', height: '28px', borderRadius: '50%',
    background: 'var(--dark-700)', border: '1px solid var(--border-card)',
    color: 'var(--pink-300)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700,
    fontFamily: 'var(--font-display)'
  },
  productMetaBlock: {
    flex: 1, display: 'flex', flexDirection: 'column', gap: '4px'
  },
  productTitleLine: {
    display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap'
  },
  productNameText: {
    fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem'
  },
  productCodeBadge: {
    fontSize: '0.7rem', color: 'var(--blue-400)',
    background: 'rgba(56,189,248,0.06)', padding: '2px 6px',
    borderRadius: '4px', border: '1px solid rgba(56,189,248,0.12)'
  },
  productDescText: {
    fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4
  },
  metricOutputContainer: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
    gap: '6px', minWidth: '80px'
  },
  metricPercentageText: {
    fontFamily: 'var(--font-display)', fontWeight: 700,
    fontSize: '1.05rem', color: 'var(--pink-300)'
  },
  barGraphTrack: {
    width: '70px', height: '4px', background: 'var(--dark-700)',
    borderRadius: '2px', overflow: 'hidden'
  },
  barGraphFill: {
    height: '100%', background: 'linear-gradient(90deg, var(--pink-400), var(--blue-400))',
    borderRadius: '2px'
  },
  emptyPlaceholderState: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--dark-800)', borderRadius: 'var(--radius-lg)',
    border: '1px dashed var(--border-card)', padding: '40px'
  },
  placeholderDashedBox: {
    textAlign: 'center', maxWidth: '320px'
  },
  errorAlert: {
    padding: '16px', background: 'rgba(251,191,36,0.05)',
    border: '1px solid var(--amber-400)', borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)', fontSize: '0.88rem'
  }
};