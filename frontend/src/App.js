import React, { useState, useEffect } from 'react';
import './index.css';

function App() {
  // Application State Managers tracking query strings, network latency hooks, and payloads
  const [queryId, setQueryId] = useState('1001');
  const [activeProfile, setActiveProfile] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [errorFeedback, setErrorFeedback] = useState(null);

  /**
   * Dispatches network data lookup queries back to the running Flask server instance.
   * * @param {string} targetId The customer account number string target (ncodpers).
   */
  const fetchModelData = async (targetId) => {
    if (!targetId) return;
    setIsSearching(true);
    setErrorFeedback(null);
    
    try {
      const response = await fetch(`http://localhost:5000/api/v1/recommend/${targetId}`);
      const payload = await response.json();
      
      if (payload.status === "success") {
        setActiveProfile(payload);
      } else {
        throw new Error(payload.message || "Endpoint lookup exception.");
      }
    } catch (err) {
      setErrorFeedback(err.message);
      setActiveProfile(null);
    } finally {
      setIsSearching(false);
    }
  };

  // Mount effect hook auto-running an initial telemetry fetch for record ID 1001 on load
  useEffect(() => { 
    fetchModelData('1001'); 
  }, []);

  return (
    <div className="abisola-style-root">
      {/* Top Application Navigation Strip displaying system status flags */}
      <nav className="navbar-container">
        <div className="nav-inner">
          <div className="brand-badge">
            <span className="brand-dot"></span>
            SANTANDER OPERATIONAL TELEMETRY
          </div>
          {activeProfile && (
            <div className={`system-status-indicator ${activeProfile.pipeline_audit.monitoring.retrain_status.includes("FIRED") ? "is-drifted" : "is-nominal"}`}>
              {activeProfile.pipeline_audit.monitoring.retrain_status}
            </div>
          )}
        </div>
      </nav>

      <main className="workspace-wrapper">
        {/* Input registry control element card */}
        <section className="search-control-card">
          <form onSubmit={(e) => { e.preventDefault(); fetchModelData(queryId.trim()); }}>
            <div className="input-flex-row">
              <input 
                type="text" 
                value={queryId} 
                onChange={(e) => setQueryId(e.target.value)}
                placeholder="Query Operational Registry ID (e.g., 1001, 1002, 1005)..."
                disabled={isSearching} 
                className="minimal-dark-input"
              />
              <button type="submit" disabled={isSearching} className="minimal-dark-button">
                Sync Profile Map
              </button>
            </div>
          </form>
          {errorFeedback && <div className="dark-error-banner">✕ {errorFeedback}</div>}
        </section>

        {activeProfile && (
          <div className="premium-dashboard-grid">
            {/* Left Column Rail: Handles profile metrics, validation status, and telemetry streams */}
            <div className="left-meta-rail">
              
              {/* Feature Records Panel */}
              <div className="premium-content-card">
                <div className="card-top-meta">
                  <h4>Feature Records Cache</h4>
                  <span className="id-pill">NCODPERS // {activeProfile.customer_id}</span>
                </div>
                <div className="features-inner-list">
                  <div className="feature-item-box"><span className="feature-lbl">Age (age)</span><span className="feature-val">{activeProfile.demographics.age} Yrs</span></div>
                  <div className="feature-item-box"><span className="feature-lbl">Gross Income (renta)</span><span className="feature-val">${activeProfile.demographics.income.toLocaleString()}</span></div>
                  <div className="feature-item-box"><span className="feature-lbl">Tenure (antiguedad)</span><span className="feature-val">{activeProfile.demographics.tenure_months} Mos</span></div>
                </div>
              </div>

              {/* Current Instrument Inventory Box */}
              <div className="premium-content-card">
                <div className="card-top-meta"><h4>Current System Holdings</h4></div>
                <div className="holdings-stack-wrap">
                  {activeProfile.holdings.map((title, idx) => (
                    <div key={idx} className="minimal-holding-tag"><span className="dot-prefix"></span>{title}</div>
                  ))}
                  {activeProfile.holdings.length === 0 && <span className="empty-text">No active assets registered.</span>}
                </div>
              </div>

              {/* Validation Gate Metric Status Boards */}
              <div className="premium-content-card gate-card-accent">
                <div className="card-top-meta"><h4>Notebook 07 Verification Gates</h4></div>
                <div className="verification-stack">
                  {Object.values(activeProfile.pipeline_audit.gates).map((gate, idx) => (
                    <div key={idx} className="gate-item-row">
                      <span className="gate-lbl-text">{gate.metric} (Target ≥ {gate.threshold})</span>
                      <span className="gate-status-pill">PASS // {gate.value}</span>
                    </div>
                  ))}
                </div>
                <div className="deployment-approved-footer">DEPLOYMENT VALIDATION: APPROVED</div>
              </div>

              {/* Continuous Drift Monitoring Board */}
              <div className="premium-content-card">
                <div className="card-top-meta"><h4>Notebook 08 Live Metric Tracking</h4></div>
                <div className="features-inner-list">
                  <div className="feature-item-box"><span className="feature-lbl">Baseline Expected CTR</span><span className="feature-val">{activeProfile.pipeline_audit.monitoring.baseline_ctr}</span></div>
                  <div className="feature-item-box"><span className="feature-lbl">Live Running CTR</span><span className="feature-val">{activeProfile.pipeline_audit.monitoring.current_ctr}</span></div>
                  <div className="feature-item-box"><span className="feature-lbl">Calculated Metric Drop</span><span className="feature-val-highlight">{activeProfile.pipeline_audit.monitoring.ctr_drop}</span></div>
                </div>
              </div>
            </div>

            {/* Right Column Grid: Renders ranked affinity probabilities stream output */}
            <div className="right-inference-stream">
              <div className="stream-intro">
                <h3>Sorted Propensity Stream</h3>
                <p>Next-best-actions prioritized matching your validation metrics criteria.</p>
              </div>
              <div className="inference-cards-stack">
                {activeProfile.recommendations.map((rec, idx) => {
                  const percent = (rec.probability * 100).toFixed(1);
                  let scoreTier = 'low-propensity';
                  if (rec.probability >= 0.45) scoreTier = 'high-propensity';
                  else if (rec.probability >= 0.30) scoreTier = 'mid-propensity';

                  return (
                    <div key={rec.product_code} className="premium-inference-row-card">
                      <div className="rank-indicator-node">0{idx + 1}</div>
                      <div className="product-details-content">
                        <div className="product-title-row">
                          <h5>{rec.name}</h5>
                          <span className="category-meta-tag">{rec.category}</span>
                        </div>
                        <p className="product-desc-text">{rec.description}</p>
                        <div className="probability-progress-wrapper">
                          <div className="progress-bar-track">
                            <div className={`progress-bar-fill ${scoreTier}`} style={{ width: `${percent}%` }} />
                          </div>
                          <div className={`progress-percentage-readout ${scoreTier}`}>{percent}% Affinity</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;