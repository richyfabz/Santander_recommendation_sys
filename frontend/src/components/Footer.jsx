// Footer component that provides information about the technologies used to build the 
// application and includes navigation links to different pages of the site.
import { Link } from 'react-router-dom'

// The Footer component renders a footer element that contains a left-aligned paragraph 
// with information about the technologies used in the project, and a right-aligned navigation
//  menu with links to the Home, Recommend, Metrics, and About pages. The styles for the footer are 
// defined in a JavaScript object and applied inline to the respective elements in the JSX. The 
// footer is designed to be responsive and visually consistent with the overall design of the application.
export default function Footer() {
  return (
    <footer style={styles.footer} role="contentinfo">
      <div style={styles.inner}>
        <p style={styles.left}>
          Built with XGBoost · Flask · React ·{' '}
          <span style={{ color: '#A50034', fontWeight: 600 }}>
            Santander Kaggle dataset
          </span>
        </p>
        <nav style={styles.links} aria-label="Footer navigation">
          <Link to="/"        style={styles.link}>Home</Link>
          <Link to="/search"  style={styles.link}>Recommend</Link>
          <Link to="/metrics" style={styles.link}>Metrics</Link>
          <Link to="/about"   style={styles.link}>About</Link>
        </nav>
      </div>
    </footer>
  )
}

// Styles for the Footer component, defined as a JavaScript object. 
// These styles are applied inline to the respective elements in the JSX. 
// The styles include layout properties such as display, flexbox settings, padding, 
// and colors to create a visually appealing and responsive footer that complements 
// the overall design of the application.
const styles = {
  footer: {
    background  : '#1A1A18',
    borderTop   : '1px solid rgba(255,255,255,0.06)',
    padding     : '20px 24px',
    marginTop   : 'auto',
  },
  inner: {
    maxWidth      : 1080,
    margin        : '0 auto',
    display       : 'flex',
    alignItems    : 'center',
    justifyContent: 'space-between',
    flexWrap      : 'wrap',
    gap           : 12,
  },
  left: {
    fontSize: 13,
    color   : '#9A9890',
  },
  links: {
    display: 'flex',
    gap    : 20,
  },
  link: {
    fontSize      : 13,
    color         : '#9A9890',
    textDecoration: 'none',
    transition    : 'color 0.15s',
  },
}