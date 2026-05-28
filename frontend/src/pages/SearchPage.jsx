// SearchPage — three-mode recommendation interface
// Mode 1: Customer Search (name, email, ID)
// Mode 2: Product Explorer (select product → see top candidates)
// Mode 3: Segment Analysis (browse by VIP, Retail, University)

import { useState, useEffect }       from 'react';
import { motion, AnimatePresence }   from 'framer-motion';
import { useNavigate }               from 'react-router-dom';
import axios                         from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api/v1' });

// ── Animation variants ────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = { show: { transition: { staggerChildren: 0.07 } } };

// ── Colour helpers ────────────────────────────────────────────────────────────
function getProbColor(p) {
  if (p >= 0.50) return 'var(--green-400)';
  if (p >= 0.30) return 'var(--amber-400)';
  return 'var(--pink-400)';
}

const SEGMENT_META = {
  TOP          : { label: 'VIP',        icon: '👑', color: 'var(--amber-400)',  border: 'rgba(251,191,36,0.25)'  },
  PARTICULARES : { label: 'Retail',     icon: '🏦', color: 'var(--blue-400)',   border: 'rgba(56,189,248,0.25)'  },
  UNIVERSITARIO: { label: 'University', icon: '🎓', color: 'var(--green-400)',  border: 'rgba(52,211,153,0.25)'  },
};

const CATEGORY_COLORS = {
  Accounts    : { bg: 'rgba(56,189,248,0.10)',  text: 'var(--blue-400)',  border: 'rgba(56,189,248,0.20)'  },
  Credit      : { bg: 'rgba(240,71,138,0.10)',  text: 'var(--pink-300)',  border: 'rgba(240,71,138,0.25)'  },
  Investments : { bg: 'rgba(52,211,153,0.10)',  text: 'var(--green-400)', border: 'rgba(52,211,153,0.20)'  },
  Utilities   : { bg: 'rgba(251,191,36,0.10)',  text: 'var(--amber-400)', border: 'rgba(251,191,36,0.20)'  },
};

// ── Mode tab definitions ──────────────────────────────────────────────────────
const MODES = [
  { id: 'customer', label: 'Customer Search', icon: '🔍',
    desc: 'Search by name, email or ID' },
  { id: 'product',  label: 'Product Explorer', icon: '📦',
    desc: 'Find candidates for a product' },
  { id: 'segment',  label: 'Segment Analysis', icon: '📊',
    desc: 'Browse by customer segment' },
];

// ── Probability bar ───────────────────────────────────────────────────────────
function ProbBar({ prob, delay = 0 }) {
  const color = getProbColor(prob);
  return (
    <div style={styles.probRow}>
      <div style={styles.probTrack}>
        <motion.div
          style      = {{ ...styles.probFill, background: color, boxShadow: `0 0 6px ${color}` }}
          initial    = {{ width: 0 }}
          animate    = {{ width: `${(prob * 100).toFixed(1)}%` }}
          transition = {{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <span style={{ ...styles.probLabel, color }}>
        {(prob * 100).toFixed(1)}%
      </span>
    </div>
  );
}

// ── Customer card — used in search results and product explorer ───────────────
function CustomerCard({ customer, onClick, showProbability, probability }) {
  const seg = SEGMENT_META[customer.segment] || SEGMENT_META.PARTICULARES;
  return (
    <motion.div
      variants   = {fadeUp}
      whileHover = {{ y: -4, scale: 1.015,
        transition: { type: 'spring', stiffness: 300, damping: 20 } }}
      className  = "card"
      style      = {styles.customerCard}
      onClick    = {onClick}
    >
      {/* Avatar + name */}
      <div style={styles.cardHeader}>
        <div style={{ ...styles.avatar,
          background: seg.color === 'var(--amber-400)'
            ? 'rgba(251,191,36,0.15)' : seg.color === 'var(--green-400)'
            ? 'rgba(52,211,153,0.15)' : 'rgba(56,189,248,0.15)',
          border: `1px solid ${seg.border}`,
          color: seg.color,
        }}>
          {customer.name.split(' ').map(w => w[0]).join('').slice(0,2)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={styles.cardName}>{customer.name}</div>
          <div style={styles.cardEmail}>{customer.email}</div>
        </div>
        <span style={{ ...styles.segBadge,
          background: seg.color === 'var(--amber-400)'
            ? 'rgba(251,191,36,0.10)' : seg.color === 'var(--green-400)'
            ? 'rgba(52,211,153,0.10)' : 'rgba(56,189,248,0.10)',
          color: seg.color, border: `1px solid ${seg.border}`,
        }}>
          {seg.icon} {seg.label}
        </span>
      </div>

      {/* Stats row */}
      <div style={styles.statsRow}>
        <div style={styles.statChip}>
          <span style={styles.statVal}>{customer.age}</span>
          <span style={styles.statKey}>yrs</span>
        </div>
        <div style={styles.statChip}>
          <span style={styles.statVal}>{customer.tenure_months}mo</span>
          <span style={styles.statKey}>tenure</span>
        </div>
        <div style={styles.statChip}>
          <span style={styles.statVal}>
            €{(customer.income/1000).toFixed(0)}k
          </span>
          <span style={styles.statKey}>income</span>
        </div>
        <div style={styles.statChip}>
          <span style={styles.statVal}>{customer.holdings.length}</span>
          <span style={styles.statKey}>products</span>
        </div>
      </div>

      {/* Probability bar — shown in product explorer mode */}
      {showProbability && probability != null && (
        <div style={{ marginTop: 12, paddingTop: 12,
          borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--text-muted)', marginBottom: 6 }}>
            Conversion probability
          </div>
          <ProbBar prob={probability} />
        </div>
      )}

      {/* Click hint */}
      <div style={styles.cardHint}>
        View recommendations →
      </div>
    </motion.div>
  );
}

// ── Recommendation panel — shown after selecting a customer ───────────────────
function RecommendationPanel({ customerId, onClose }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const navigate              = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const res = await API.get(`/recommend/${customerId}`);
        setData(res.data);
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load recommendations.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [customerId]);

  return (
    <motion.div
      initial    = {{ opacity: 0, x: 24 }}
      animate    = {{ opacity: 1, x: 0 }}
      exit       = {{ opacity: 0, x: 24 }}
      transition = {{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style      = {styles.panel}
    >
      {/* Panel header */}
      <div style={styles.panelHeader}>
        <span style={styles.panelTitle}>Recommendations</span>
        <button onClick={onClose} style={styles.closeBtn}>✕</button>
      </div>

      {loading && (
        <div style={styles.panelLoading}>
          <motion.div
            animate    = {{ rotate: 360 }}
            transition = {{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style      = {styles.spinner}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Running inference...
          </span>
        </div>
      )}

      {error && (
        <div style={styles.panelError}>⚠️ {error}</div>
      )}

      {data && !loading && (
        <div style={styles.panelContent}>
          {/* Customer summary */}
          <div style={styles.panelCustomer}>
            <div style={styles.panelCustomerName}>{data.name}</div>
            <div style={styles.panelCustomerSub}>
              ID {data.customer_id} · {
                SEGMENT_META[data.segment]?.label || data.segment
              }
            </div>
          </div>

          {/* Holdings */}
          {data.holdings?.length > 0 && (
            <div style={styles.holdingsWrap}>
              <div style={styles.holdingsLabel}>Currently holds</div>
              <div style={styles.holdingsTags}>
                {data.holdings.map(h => (
                  <span key={h} style={styles.holdingTag}>{h}</span>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div style={styles.panelRecsLabel}>Top Recommendations</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.recommendations?.map((rec, i) => {
              const cat = CATEGORY_COLORS[rec.category] || CATEGORY_COLORS.Utilities;
              return (
                <motion.div
                  key        = {rec.product_code}
                  initial    = {{ opacity: 0, y: 12 }}
                  animate    = {{ opacity: 1, y: 0 }}
                  transition = {{ delay: i * 0.07 }}
                  style      = {styles.panelRecCard}
                >
                  <div style={styles.panelRecTop}>
                    <span style={{
                      ...styles.rankBadge,
                      background: i === 0 ? 'var(--pink-400)' : 'var(--dark-600)',
                      color: i === 0 ? '#fff' : 'var(--text-muted)',
                    }}>#{i + 1}</span>
                    <span style={{
                      ...styles.catBadge,
                      background: cat.bg, color: cat.text,
                      border: `1px solid ${cat.border}`,
                    }}>{rec.category}</span>
                  </div>
                  <div style={styles.panelRecName}>{rec.name}</div>
                  <code style={styles.panelRecCode}>{rec.product_code}</code>
                  <ProbBar prob={rec.probability} delay={i * 0.08} />
                </motion.div>
              );
            })}
          </div>

          {/* Full profile link */}
          <button
            onClick   = {() => navigate(`/profile/${data.customer_id}`)}
            className = "btn-primary"
            style     = {{ width: '100%', justifyContent: 'center', marginTop: 16 }}
          >
            Full Profile →
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ── Mode 1: Customer Search ───────────────────────────────────────────────────
function CustomerSearchMode({ onSelectCustomer }) {
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      // Detect if input is numeric — search by ID directly
      const isId = /^\d+$/.test(query.trim());
      if (isId) {
        onSelectCustomer(parseInt(query.trim()));
        return;
      }
      const res = await API.get('/customers/search', {
        params: { q: query.trim(), limit: 12 }
      });
      setResults(res.data.customers || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Search form */}
      <form onSubmit={handleSearch} style={styles.searchForm}>
        <div style={styles.inputRow}>
          <input
            type        = "text"
            value       = {query}
            onChange    = {e => setQuery(e.target.value)}
            placeholder = "Search by name, email, or customer ID..."
            style       = {styles.input}
            className   = "search-input"
            disabled    = {loading}
            autoFocus
          />
          <motion.button
            type       = "submit"
            className  = "btn-primary"
            disabled   = {loading || !query.trim()}
            whileHover = {{ scale: 1.03 }}
            whileTap   = {{ scale: 0.97 }}
            style      = {{ flexShrink: 0, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Searching...' : 'Search →'}
          </motion.button>
        </div>

        {/* Quick ID hints */}
        <div style={styles.hintRow}>
          <span style={styles.hintText}>Try:</span>
          {['Elena', 'Carlos', 'university', '1001', '2005', '3003'].map(h => (
            <button key={h} type="button" style={styles.hintBtn}
              onClick={() => { setQuery(h); }}>
              {h}
            </button>
          ))}
        </div>
      </form>

      {/* Results */}
      <AnimatePresence>
        {searched && !loading && results.length === 0 && (
          <motion.div
            initial = {{ opacity: 0 }} animate = {{ opacity: 1 }}
            style   = {styles.emptyState}
          >
            <div style={styles.emptyIcon}>🔍</div>
            <p style={styles.emptyTitle}>No customers found</p>
            <p style={styles.emptySub}>Try a different name, email, or segment</p>
          </motion.div>
        )}
      </AnimatePresence>

      {results.length > 0 && (
        <motion.div
          variants = {stagger} initial = "hidden" animate = "show"
          style    = {styles.resultsGrid}
        >
          {results.map(c => (
            <CustomerCard
              key      = {c.customer_id}
              customer = {c}
              onClick  = {() => onSelectCustomer(c.customer_id)}
            />
          ))}
        </motion.div>
      )}

      {/* Empty initial state */}
      {!searched && (
        <motion.div
          initial    = {{ opacity: 0 }}
          animate    = {{ opacity: 1 }}
          transition = {{ delay: 0.3 }}
          style      = {styles.emptyState}
        >
          <div style={styles.emptyIcon}>👤</div>
          <p style={styles.emptyTitle}>Search for a customer</p>
          <p style={styles.emptySub}>
            Enter a name, email address, segment name, or numeric customer ID
          </p>
        </motion.div>
      )}
    </div>
  );
}

// ── Mode 2: Product Explorer ──────────────────────────────────────────────────
function ProductExplorerMode({ onSelectCustomer }) {
  const [products,  setProducts]  = useState([]);
  const [selected,  setSelected]  = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [fetched,   setFetched]   = useState(false);

  // Load product catalog on mount
  useEffect(() => {
    API.get('/products').then(r => setProducts(r.data.products || []));
  }, []);

  async function handleProductSelect(code) {
    setSelected(code);
    setLoading(true);
    setFetched(true);
    try {
      const res = await API.get(`/products/${code}/top-customers`,
        { params: { limit: 12 } });
      setCustomers(res.data.top_customers || []);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }

  // Group products by category for the dropdown
  const grouped = products.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  const selectedProduct = products.find(p => p.code === selected);

  return (
    <div>
      {/* Product selector */}
      <div style={styles.productSelectorWrap}>
        <label style={styles.selectorLabel}>
          Select a product to find the best candidates
        </label>
        <select
          value    = {selected}
          onChange = {e => handleProductSelect(e.target.value)}
          style    = {styles.select}
          className= "search-input"
        >
          <option value="">— Choose a product —</option>
          {Object.entries(grouped).map(([cat, prods]) => (
            <optgroup key={cat} label={cat}>
              {prods.map(p => (
                <option key={p.code} value={p.code}>{p.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Selected product info banner */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial = {{ opacity: 0, y: -8 }}
            animate = {{ opacity: 1, y: 0 }}
            exit    = {{ opacity: 0 }}
            style   = {styles.productBanner}
          >
            <div>
              <div style={styles.productBannerName}>
                {selectedProduct.name}
              </div>
              <div style={styles.productBannerDesc}>
                {selectedProduct.desc} · {selectedProduct.category}
              </div>
            </div>
            <span style={{
              ...styles.catBadge,
              ...CATEGORY_COLORS[selectedProduct.category],
              border: `1px solid ${CATEGORY_COLORS[selectedProduct.category]?.border}`,
            }}>
              {selectedProduct.category}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      {loading && (
        <div style={{ ...styles.emptyState }}>
          <motion.div
            animate    = {{ rotate: 360 }}
            transition = {{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style      = {styles.spinner}
          />
          <p style={styles.emptySub}>Finding top candidates...</p>
        </div>
      )}

      {/* Results */}
      {!loading && fetched && customers.length > 0 && (
        <div>
          <div style={styles.resultsHeader}>
            <span style={styles.resultsCount}>
              Top {customers.length} candidates
            </span>
            <span style={styles.resultsSub}>
              ranked by conversion probability
            </span>
          </div>
          <motion.div
            variants = {stagger} initial = "hidden" animate = "show"
            style    = {styles.resultsGrid}
          >
            {customers.map(c => (
              <CustomerCard
                key             = {c.customer_id}
                customer        = {c}
                onClick         = {() => onSelectCustomer(c.customer_id)}
                showProbability = {true}
                probability     = {c.probability}
              />
            ))}
          </motion.div>
        </div>
      )}

      {/* Empty initial */}
      {!fetched && (
        <motion.div
          initial    = {{ opacity: 0 }}
          animate    = {{ opacity: 1 }}
          transition = {{ delay: 0.3 }}
          style      = {styles.emptyState}
        >
          <div style={styles.emptyIcon}>📦</div>
          <p style={styles.emptyTitle}>Select a product above</p>
          <p style={styles.emptySub}>
            The model will rank all customers by likelihood to add that product next month
          </p>
        </motion.div>
      )}
    </div>
  );
}

//  Mode 3: Segment Analysis 
function SegmentAnalysisMode({ onSelectCustomer }) {
  const [segments,  setSegments]  = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(false);

  // Load segment summaries on mount
  useEffect(() => {
    API.get('/segments').then(r => setSegments(r.data.segments || []));
  }, []);

  async function handleSegmentSelect(seg) {
    setSelected(seg);
    setLoading(true);
    try {
      const res = await API.get('/customers/search', {
        params: { segment: seg.segment, limit: 15 }
      });
      setCustomers(res.data.customers || []);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Segment cards */}
      <motion.div
        variants = {stagger} initial = "hidden" animate = "show"
        style    = {styles.segmentGrid}
      >
        {segments.map(seg => {
          const meta    = SEGMENT_META[seg.segment] || SEGMENT_META.PARTICULARES;
          const isActive = selected?.segment === seg.segment;
          return (
            <motion.div
              key        = {seg.segment}
              variants   = {fadeUp}
              whileHover = {{ y: -4, scale: 1.02,
                transition: { type: 'spring', stiffness: 300, damping: 20 } }}
              onClick    = {() => handleSegmentSelect(seg)}
              className  = "card"
              style      = {{
                ...styles.segCard,
                border: isActive
                  ? `1px solid ${meta.color}`
                  : '1px solid var(--border-card)',
                cursor: 'pointer',
              }}
            >
              <div style={styles.segCardHeader}>
                <span style={styles.segIcon}>{meta.icon}</span>
                <span style={{ ...styles.segLabel, color: meta.color }}>
                  {meta.label}
                </span>
                {isActive && (
                  <span style={{ ...styles.activePill, background: meta.color }}>
                    Selected
                  </span>
                )}
              </div>
              <p style={styles.segDesc}>{seg.description}</p>
              <div style={styles.segStats}>
                <div style={styles.segStat}>
                  <span style={{ ...styles.segStatVal, color: meta.color }}>
                    {seg.count}
                  </span>
                  <span style={styles.segStatKey}>customers</span>
                </div>
                <div style={styles.segStat}>
                  <span style={{ ...styles.segStatVal, color: meta.color }}>
                    {seg.avg_age}
                  </span>
                  <span style={styles.segStatKey}>avg age</span>
                </div>
                <div style={styles.segStat}>
                  <span style={{ ...styles.segStatVal, color: meta.color }}>
                    €{(seg.avg_income/1000).toFixed(0)}k
                  </span>
                  <span style={styles.segStatKey}>avg income</span>
                </div>
                <div style={styles.segStat}>
                  <span style={{ ...styles.segStatVal, color: meta.color }}>
                    {seg.avg_tenure}mo
                  </span>
                  <span style={styles.segStatKey}>avg tenure</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Customer list for selected segment */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial = {{ opacity: 0, y: 12 }}
            animate = {{ opacity: 1, y: 0 }}
            exit    = {{ opacity: 0 }}
          >
            <div style={styles.resultsHeader}>
              <span style={styles.resultsCount}>
                {SEGMENT_META[selected.segment]?.label} customers
              </span>
              <span style={styles.resultsSub}>
                click any card to view recommendations
              </span>
            </div>

            {loading ? (
              <div style={styles.emptyState}>
                <motion.div
                  animate    = {{ rotate: 360 }}
                  transition = {{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style      = {styles.spinner}
                />
              </div>
            ) : (
              <motion.div
                variants = {stagger} initial = "hidden" animate = "show"
                style    = {styles.resultsGrid}
              >
                {customers.map(c => (
                  <CustomerCard
                    key      = {c.customer_id}
                    customer = {c}
                    onClick  = {() => onSelectCustomer(c.customer_id)}
                  />
                ))}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty initial */}
      {!selected && segments.length > 0 && (
        <motion.div
          initial    = {{ opacity: 0 }}
          animate    = {{ opacity: 1 }}
          transition = {{ delay: 0.4 }}
          style      = {styles.emptyState}
        >
          <div style={styles.emptyIcon}>📊</div>
          <p style={styles.emptyTitle}>Select a segment above</p>
          <p style={styles.emptySub}>
            Browse all customers in that segment and run recommendations for any of them
          </p>
        </motion.div>
      )}
    </div>
  );
}

// ── Main page 
export default function SearchPage() {
  const [activeMode,      setActiveMode]      = useState('customer');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  function handleSelectCustomer(id) {
    setSelectedCustomer(id);
  }

  function handleClosePanel() {
    setSelectedCustomer(null);
  }

  return (
    <main style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>

      {/*  Page header */}
      <section style={styles.header}>
        <div className="grid-bg" />
        <div style={styles.orb} />
        <div className="container" style={{ position: 'relative' }}>
          <motion.div
            initial  = "hidden"
            animate  = "show"
            variants = {stagger}
          >
            <motion.div variants={fadeUp}>
              <span className="badge">Model Inference</span>
            </motion.div>
            <motion.h1 variants={fadeUp} style={styles.pageTitle}>
              Product <span className="gradient-text">Recommender</span>
            </motion.h1>
            <motion.p variants={fadeUp} style={styles.pageSub}>
              Three ways to explore recommendations search by customer,
              find candidates for a product, or browse by segment.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── Mode tabs ── */}
      <div style={styles.tabsBar}>
        <div className="container">
          <div style={styles.tabs}>
            {MODES.map(mode => (
              <button
                key     = {mode.id}
                onClick = {() => {
                  setActiveMode(mode.id);
                  setSelectedCustomer(null);
                }}
                style   = {{
                  ...styles.tab,
                  background: activeMode === mode.id
                    ? 'rgba(240,71,138,0.12)' : 'transparent',
                  borderColor: activeMode === mode.id
                    ? 'var(--pink-400)' : 'transparent',
                  color: activeMode === mode.id
                    ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                <span style={styles.tabIcon}>{mode.icon}</span>
                <span style={styles.tabLabel}>{mode.label}</span>
                <span style={styles.tabDesc}>{mode.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content area ── */}
      <div className="container" style={{ padding: '40px 24px 64px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: selectedCustomer ? '1fr 360px' : '1fr',
          gap: 24, alignItems: 'start',
          transition: 'grid-template-columns 300ms ease',
        }}>

          {/* Main content */}
          <div>
            <AnimatePresence mode="wait">
              {activeMode === 'customer' && (
                <motion.div key="customer"
                  initial = {{ opacity: 0, y: 12 }}
                  animate = {{ opacity: 1, y: 0 }}
                  exit    = {{ opacity: 0, y: -8 }}
                  transition = {{ duration: 0.3 }}
                >
                  <CustomerSearchMode
                    onSelectCustomer={handleSelectCustomer}
                  />
                </motion.div>
              )}
              {activeMode === 'product' && (
                <motion.div key="product"
                  initial = {{ opacity: 0, y: 12 }}
                  animate = {{ opacity: 1, y: 0 }}
                  exit    = {{ opacity: 0, y: -8 }}
                  transition = {{ duration: 0.3 }}
                >
                  <ProductExplorerMode
                    onSelectCustomer={handleSelectCustomer}
                  />
                </motion.div>
              )}
              {activeMode === 'segment' && (
                <motion.div key="segment"
                  initial = {{ opacity: 0, y: 12 }}
                  animate = {{ opacity: 1, y: 0 }}
                  exit    = {{ opacity: 0, y: -8 }}
                  transition = {{ duration: 0.3 }}
                >
                  <SegmentAnalysisMode
                    onSelectCustomer={handleSelectCustomer}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sliding recommendation panel */}
          <AnimatePresence>
            {selectedCustomer && (
              <RecommendationPanel
                key        = {selectedCustomer}
                customerId = {selectedCustomer}
                onClose    = {handleClosePanel}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        .search-input:focus {
          outline: none;
          border-color: var(--pink-400) !important;
          box-shadow: 0 0 0 3px rgba(240,71,138,0.15) !important;
        }
        .search-input::placeholder { color: var(--grey-500); }
        select.search-input option { background: var(--dark-700); color: var(--text-primary); }
        select.search-input optgroup { color: var(--text-muted); font-weight: 700; }
      `}</style>
    </main>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  header: {
    position: 'relative', overflow: 'hidden',
    padding: '72px 0 56px',
    background: 'var(--dark-800)',
    borderBottom: '1px solid var(--border-subtle)',
  },
  orb: {
    position: 'absolute', top: -80, right: -60,
    width: 360, height: 360, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(240,71,138,0.12) 0%, transparent 65%)',
    pointerEvents: 'none',
  },
  pageTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(2rem, 4vw, 3.2rem)',
    fontWeight: 800, lineHeight: 1.1,
    color: 'var(--text-primary)',
    margin: '20px 0 14px', letterSpacing: '-0.02em',
  },
  pageSub: {
    fontSize: '1rem', color: 'var(--text-muted)',
    maxWidth: 520, lineHeight: 1.75,
  },

  /* Mode tabs */
  tabsBar: {
    background: 'var(--dark-800)',
    borderBottom: '1px solid var(--border-subtle)',
    position: 'sticky', top: 64, zIndex: 50,
  },
  tabs: {
    display: 'flex', gap: 4, padding: '12px 0',
    overflowX: 'auto',
  },
  tab: {
    display: 'flex', flexDirection: 'column', gap: 2,
    padding: '10px 20px', borderRadius: 'var(--radius-md)',
    border: '1px solid transparent',
    cursor: 'pointer', textAlign: 'left',
    transition: 'all 150ms ease', flexShrink: 0,
    fontFamily: 'var(--font-body)',
  },
  tabIcon:  { fontSize: '1.1rem' },
  tabLabel: { fontSize: '0.88rem', fontWeight: 700, lineHeight: 1.2 },
  tabDesc:  { fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1 },

  /* Search form */
  searchForm: { maxWidth: 760, marginBottom: 28 },
  inputRow: {
    display: 'flex', gap: 12,
    alignItems: 'center', flexWrap: 'wrap', marginBottom: 10,
  },
  input: {
    flex: '1 1 260px',
    background: 'var(--dark-700)',
    border: '1px solid var(--border-card)',
    borderRadius: 'var(--radius-md)',
    padding: '14px 18px',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.95rem',
    transition: 'border-color 150ms, box-shadow 150ms',
  },
  hintRow: {
    display: 'flex', gap: 8,
    alignItems: 'center', flexWrap: 'wrap',
  },
  hintText: { fontSize: '0.8rem', color: 'var(--text-muted)' },
  hintBtn: {
    background: 'rgba(240,71,138,0.08)',
    border: '1px solid rgba(240,71,138,0.20)',
    borderRadius: 99, padding: '3px 12px',
    color: 'var(--pink-300)', fontSize: '0.8rem',
    fontWeight: 600, cursor: 'pointer',
    transition: 'background 150ms',
    fontFamily: 'var(--font-body)',
  },

  /* Product selector */
  productSelectorWrap: { maxWidth: 520, marginBottom: 20 },
  selectorLabel: {
    display: 'block', fontSize: '0.85rem',
    color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500,
  },
  select: {
    width: '100%',
    background: 'var(--dark-700)',
    border: '1px solid var(--border-card)',
    borderRadius: 'var(--radius-md)',
    padding: '14px 18px',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'border-color 150ms',
  },
  productBanner: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: 16,
    background: 'var(--dark-700)',
    border: '1px solid var(--border-card)',
    borderRadius: 'var(--radius-md)',
    padding: '14px 18px', marginBottom: 24,
  },
  productBannerName: {
    fontFamily: 'var(--font-display)',
    fontSize: '1rem', fontWeight: 700,
    color: 'var(--text-primary)', marginBottom: 3,
  },
  productBannerDesc: {
    fontSize: '0.82rem', color: 'var(--text-muted)',
  },

  /* Segment cards */
  segmentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 16, marginBottom: 32,
  },
  segCard: { padding: '24px' },
  segCardHeader: {
    display: 'flex', alignItems: 'center',
    gap: 10, marginBottom: 10,
  },
  segIcon:  { fontSize: '1.4rem' },
  segLabel: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.1rem', fontWeight: 800,
    flex: 1,
  },
  activePill: {
    fontSize: '0.68rem', fontWeight: 700,
    padding: '2px 8px', borderRadius: 99,
    color: '#fff', letterSpacing: '0.04em',
  },
  segDesc: {
    fontSize: '0.82rem', color: 'var(--text-muted)',
    lineHeight: 1.6, marginBottom: 16,
  },
  segStats: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8,
  },
  segStat: {
    display: 'flex', flexDirection: 'column',
    gap: 2, textAlign: 'center',
  },
  segStatVal: {
    fontFamily: 'var(--font-display)',
    fontSize: '1rem', fontWeight: 700,
  },
  segStatKey: {
    fontSize: '0.65rem', color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.04em',
  },

  /* Results */
  resultsHeader: {
    display: 'flex', alignItems: 'baseline',
    gap: 10, marginBottom: 16,
  },
  resultsCount: {
    fontFamily: 'var(--font-display)',
    fontSize: '1rem', fontWeight: 700,
    color: 'var(--text-primary)',
  },
  resultsSub: {
    fontSize: '0.8rem', color: 'var(--text-muted)',
  },
  resultsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 14,
  },

  /* Customer card */
  customerCard: {
    padding: '18px 20px', cursor: 'pointer',
    background: 'var(--dark-700)',
  },
  cardHeader: {
    display: 'flex', alignItems: 'center',
    gap: 12, marginBottom: 14,
  },
  avatar: {
    width: 40, height: 40, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-display)',
    fontSize: '0.85rem', fontWeight: 800,
    flexShrink: 0,
  },
  cardName: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.95rem', fontWeight: 700,
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  cardEmail: {
    fontSize: '0.75rem', color: 'var(--text-muted)',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  segBadge: {
    fontSize: '0.68rem', fontWeight: 700,
    padding: '3px 8px', borderRadius: 99,
    flexShrink: 0, letterSpacing: '0.03em',
  },
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 6, marginBottom: 8,
  },
  statChip: {
    display: 'flex', flexDirection: 'column',
    gap: 1, textAlign: 'center',
    background: 'var(--dark-600)',
    borderRadius: 'var(--radius-sm)',
    padding: '6px 4px',
  },
  statVal: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.82rem', fontWeight: 700,
    color: 'var(--text-primary)',
  },
  statKey: {
    fontSize: '0.62rem', color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.03em',
  },
  cardHint: {
    fontSize: '0.75rem', color: 'var(--pink-400)',
    fontWeight: 600, marginTop: 10,
    opacity: 0.7,
  },

  /* Probability */
  probRow: { display: 'flex', alignItems: 'center', gap: 10 },
  probTrack: {
    flex: 1, height: 5, borderRadius: 99,
    background: 'var(--dark-600)', overflow: 'hidden',
  },
  probFill: { height: '100%', borderRadius: 99 },
  probLabel: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.82rem', fontWeight: 700,
    minWidth: 40, textAlign: 'right',
  },

  /* Recommendation panel */
  panel: {
    background: 'var(--dark-700)',
    border: '1px solid var(--border-card)',
    borderRadius: 'var(--radius-xl)',
    position: 'sticky', top: 120,
    maxHeight: 'calc(100vh - 140px)',
    overflowY: 'auto',
  },
  panelHeader: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid var(--border-subtle)',
    position: 'sticky', top: 0,
    background: 'var(--dark-700)',
    borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
    zIndex: 10,
  },
  panelTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.9rem', fontWeight: 800,
    color: 'var(--text-primary)',
    textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  closeBtn: {
    background: 'var(--dark-600)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-muted)', cursor: 'pointer',
    width: 28, height: 28, fontSize: '0.8rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-body)',
  },
  panelLoading: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 12,
    padding: '48px 20px',
  },
  panelError: {
    padding: '16px 20px',
    color: 'var(--pink-300)', fontSize: '0.85rem',
  },
  panelContent: { padding: '16px 20px 20px' },
  panelCustomer: { marginBottom: 14 },
  panelCustomerName: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.1rem', fontWeight: 800,
    color: 'var(--text-primary)',
  },
  panelCustomerSub: {
    fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2,
  },
  holdingsWrap: {
    marginBottom: 16, paddingBottom: 16,
    borderBottom: '1px solid var(--border-subtle)',
  },
  holdingsLabel: {
    fontSize: '0.68rem', fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase',
    color: 'var(--text-muted)', marginBottom: 8, display: 'block',
  },
  holdingsTags: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  holdingTag: {
    background: 'rgba(56,189,248,0.08)',
    border: '1px solid rgba(56,189,248,0.20)',
    borderRadius: 99, padding: '3px 10px',
    fontSize: '0.7rem', color: 'var(--blue-400)', fontWeight: 500,
  },
  panelRecsLabel: {
    fontSize: '0.68rem', fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase',
    color: 'var(--text-muted)', marginBottom: 10,
  },
  panelRecCard: {
    background: 'var(--dark-600)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 14px',
  },
  panelRecTop: {
    display: 'flex', gap: 6,
    alignItems: 'center', marginBottom: 8,
  },
  rankBadge: {
    display: 'inline-block', borderRadius: 99,
    padding: '2px 8px', fontSize: '0.68rem',
    fontWeight: 800, letterSpacing: '0.06em',
  },
  catBadge: {
    display: 'inline-block', borderRadius: 99,
    padding: '2px 9px', fontSize: '0.68rem', fontWeight: 600,
  },
  panelRecName: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.88rem', fontWeight: 700,
    color: 'var(--text-primary)', marginBottom: 2,
  },
  panelRecCode: {
    display: 'block', fontSize: '0.68rem',
    fontFamily: 'monospace', color: 'var(--text-muted)', marginBottom: 8,
  },

  /* Empty / loading */
  emptyState: {
    textAlign: 'center', padding: '60px 20px',
  },
  emptyIcon: { fontSize: '2rem', marginBottom: 12, opacity: 0.35 },
  emptyTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.1rem', fontWeight: 700,
    color: 'var(--text-secondary)', marginBottom: 6,
  },
  emptySub: {
    fontSize: '0.88rem', color: 'var(--text-muted)',
    maxWidth: 360, margin: '0 auto',
  },
  spinner: {
    width: 32, height: 32, borderRadius: '50%',
    border: '3px solid var(--border-card)',
    borderTopColor: 'var(--pink-400)',
    margin: '0 auto 8px',
  },
};