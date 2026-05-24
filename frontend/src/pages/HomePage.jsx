import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Santander Recommender Portal Landing Core.
 * High-performance UI hub routing operational telemetry dashboards.
 */
export default function HomePage() {
  return (
    <div className="homepage-container" style={{ padding: '2rem', color: '#fff', backgroundColor: '#111', minHeight: '80vh' }}>
      <header className="hero-section" style={{ textAlign: 'center', margin: '4rem 0' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#ec0000', marginBottom: '1rem' }}>
          SANTANDER PREDICTIVE ENGINES
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#aaa', maxWidth: '600px', margin: '0 auto' }}>
          Real-time propensity optimization and continuous model verification gates.
        </p>
      </header>

      <div className="dashboard-navigation-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <div className="nav-card" style={{ background: '#222', padding: '2rem', borderRadius: '8px', borderLeft: '4px solid #ec0000' }}>
          <h3>Model Inference Stream</h3>
          <p style={{ color: '#aaa', margin: '1rem 0' }}>Query features stores and evaluate ranked propensities.</p>
          <Link to="/search" style={{ color: '#ec0000', fontWeight: 'bold', textDecoration: 'none' }}>Open Target Search →</Link>
        </div>

        <div className="nav-card" style={{ background: '#222', padding: '2rem', borderRadius: '8px', borderLeft: '4px solid #aaa' }}>
          <h3>Pipeline Telemetry Metrics</h3>
          <p style={{ color: '#aaa', margin: '1rem 0' }}>Audit validation thresholds and drift monitoring vectors.</p>
          <Link to="/metrics" style={{ color: '#fff', fontWeight: 'bold', textDecoration: 'none' }}>View Metrics →</Link>
        </div>
      </div>
    </div>
  );
}