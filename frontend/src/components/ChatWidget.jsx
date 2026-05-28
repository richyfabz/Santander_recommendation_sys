// ChatWidget.jsx — Floating chatbot bubble + sliding chat panel
//
// Architecture:
// - Floats bottom-right on every page via App.jsx
// - Clicking the bubble toggles the chat panel open/closed
// - Messages are sent to Flask /api/v1/chat which queries Mistral-7B
// - "End Chat" sends history to /api/v1/chat/summary → agent email
// - Conversation history stored in React state for the session duration
// - Context-aware: if recommendations exist in sessionStorage, they are
//   passed to the model so it knows what was just recommended

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence }      from 'framer-motion';
import axios                            from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api/v1' });

// Suggested questions shown when chat is empty
// Helps users understand what the chatbot can do
const SUGGESTIONS = [
  'What is a pension plan?',
  'How does a credit card work?',
  'What is the difference between a savings and current account?',
  'Should I get a mortgage?',
  'What is Direct Debit?',
];

export default function ChatWidget() {
  // Whether the chat panel is open or closed
  const [open,    setOpen]    = useState(false);

  // Full conversation history — array of {role, content} objects
  // Sent with every message so the model has full context
  const [history, setHistory] = useState([]);

  // Current message being typed in the input
  const [input,   setInput]   = useState('');

  // Loading state while waiting for model response
  const [loading, setLoading] = useState(false);

  // Status message shown after ending the chat
  const [endMsg,  setEndMsg]  = useState('');

  // Whether the chat has been ended — disables input
  const [ended,   setEnded]   = useState(false);

  // Customer name — read from sessionStorage if set by onboarding form
  const [userName, setUserName] = useState('');

  // Auto-scroll to bottom when new messages arrive
  const bottomRef = useRef(null);

  // On mount: check if a customer name was saved by the onboarding form
  useEffect(() => {
    const name = sessionStorage.getItem('recsys_user_name') || '';
    if (name) setUserName(name);
  }, []);

  // Scroll to bottom whenever history changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  // ── Send a message to the chatbot ─────────────────────────────────────────
  async function sendMessage(text) {
    const message = (text || input).trim();
    if (!message || loading || ended) return;

    // Clear input immediately for responsive feel
    setInput('');

    // Add user message to history and show it instantly
    const newHistory = [...history, { role: 'user', content: message }];
    setHistory(newHistory);
    setLoading(true);

    try {
      // Optionally pass recommended products as context
      // These are stored in sessionStorage by SearchPage after a query
      const context = sessionStorage.getItem('recsys_last_recommendations') || '';

      const res = await API.post('/chat', {
        message,
        history : history, // Send previous history (not including this message)
        context,
      });

      const reply = res.data.reply || 'Sorry, I could not generate a response.';

      // Add assistant reply to history
      setHistory(prev => [...prev, { role: 'assistant', content: reply }]);

    } catch {
      setHistory(prev => [
        ...prev,
        {
          role   : 'assistant',
          content: 'I\'m having trouble connecting right now. Please try again in a moment.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // ── End chat and send summary email to agent ──────────────────────────────
  async function endChat() {
    if (history.length === 0) {
      setOpen(false);
      return;
    }

    setEnded(true);
    setEndMsg('Sending summary to our team...');

    try {
      await API.post('/chat/summary', {
        history,
        user_name: userName || 'Anonymous',
      });
      setEndMsg('✓ Summary sent to our team. We\'ll be in touch soon!');
    } catch {
      setEndMsg('Chat ended. Thank you for using our advisor.');
    }
  }

  // ── Reset chat for a new session ──────────────────────────────────────────
  function resetChat() {
    setHistory([]);
    setInput('');
    setEnded(false);
    setEndMsg('');
    setLoading(false);
  }

  // ── Handle Enter key in input ─────────────────────────────────────────────
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      {/* ── Floating bubble button ── */}
      <motion.button
        onClick    = {() => setOpen(o => !o)}
        whileHover = {{ scale: 1.08 }}
        whileTap   = {{ scale: 0.94 }}
        style      = {styles.bubble}
        aria-label = {open ? 'Close chat' : 'Open product advisor'}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span
              key       = "close"
              initial   = {{ rotate: -90, opacity: 0 }}
              animate   = {{ rotate: 0,   opacity: 1 }}
              exit      = {{ rotate: 90,  opacity: 0 }}
              transition= {{ duration: 0.2 }}
              style     = {{ fontSize: '1.2rem', lineHeight: 1 }}
            >
              ✕
            </motion.span>
          ) : (
            <motion.span
              key       = "open"
              initial   = {{ scale: 0.7, opacity: 0 }}
              animate   = {{ scale: 1,   opacity: 1 }}
              exit      = {{ scale: 0.7, opacity: 0 }}
              transition= {{ duration: 0.2 }}
              style     = {{ fontSize: '1.4rem', lineHeight: 1 }}
            >
              💬
            </motion.span>
          )}
        </AnimatePresence>

        {/* Notification dot — shows when chat is closed and there's history */}
        {!open && history.length > 0 && (
          <span style={styles.notifDot} />
        )}
      </motion.button>

      {/* ── Chat panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial    = {{ opacity: 0, y: 20, scale: 0.95 }}
            animate    = {{ opacity: 1, y: 0,  scale: 1    }}
            exit       = {{ opacity: 0, y: 20, scale: 0.95 }}
            transition = {{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style      = {styles.panel}
          >

            {/* Panel header */}
            <div style={styles.header}>
              <div style={styles.headerLeft}>
                <div style={styles.headerAvatar}>🏦</div>
                <div>
                  <div style={styles.headerName}>Product Advisor</div>
                  <div style={styles.headerSub}>
                    {loading ? 'Typing...' : 'Ask me anything about our products'}
                  </div>
                </div>
              </div>
              {/* End chat button — triggers email summary */}
              {history.length > 0 && !ended && (
                <button onClick={endChat} style={styles.endBtn}>
                  End Chat
                </button>
              )}
              {ended && (
                <button onClick={resetChat} style={styles.endBtn}>
                  New Chat
                </button>
              )}
            </div>

            {/* Message area */}
            <div style={styles.messages}>

              {/* Welcome message — shown when no history */}
              {history.length === 0 && !ended && (
                <div style={styles.welcome}>
                  <div style={styles.welcomeEmoji}>👋</div>
                  <p style={styles.welcomeTitle}>
                    Hi{userName ? `, ${userName}` : ''}! I'm your product advisor.
                  </p>
                  <p style={styles.welcomeSub}>
                    Ask me anything about Santander's banking products.
                  </p>

                  {/* Suggestion chips */}
                  <div style={styles.suggestions}>
                    {SUGGESTIONS.map(s => (
                      <button
                        key     = {s}
                        onClick = {() => sendMessage(s)}
                        style   = {styles.suggestionChip}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversation messages */}
              {history.map((msg, i) => (
                <div
                  key   = {i}
                  style = {{
                    ...styles.msgRow,
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  {/* Bot avatar — shown on left for assistant messages */}
                  {msg.role === 'assistant' && (
                    <div style={styles.botAvatar}>🏦</div>
                  )}
                  <div style={{
                    ...styles.bubble2,
                    ...(msg.role === 'user'
                      ? styles.userBubble
                      : styles.botBubble),
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Typing indicator while waiting for response */}
              {loading && (
                <div style={{ ...styles.msgRow, justifyContent: 'flex-start' }}>
                  <div style={styles.botAvatar}>🏦</div>
                  <div style={{ ...styles.bubble2, ...styles.botBubble }}>
                    <span style={styles.typingDots}>
                      <span>●</span><span>●</span><span>●</span>
                    </span>
                  </div>
                </div>
              )}

              {/* End chat confirmation message */}
              {endMsg && (
                <div style={styles.endMsgBox}>
                  {endMsg}
                </div>
              )}

              {/* Invisible element to scroll to */}
              <div ref={bottomRef} />
            </div>

            {/* Input area */}
            {!ended && (
              <div style={styles.inputArea}>
                <input
                  type        = "text"
                  value       = {input}
                  onChange    = {e => setInput(e.target.value)}
                  onKeyDown   = {handleKeyDown}
                  placeholder = "Ask about a product..."
                  style       = {styles.chatInput}
                  disabled    = {loading}
                  autoFocus
                />
                <motion.button
                  onClick    = {() => sendMessage()}
                  disabled   = {!input.trim() || loading}
                  whileHover = {{ scale: 1.05 }}
                  whileTap   = {{ scale: 0.95 }}
                  style      = {{
                    ...styles.sendBtn,
                    opacity: !input.trim() || loading ? 0.5 : 1,
                  }}
                >
                  →
                </motion.button>
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyframe animations for typing dots */}
      <style>{`
        @keyframes chatDot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40%            { opacity: 1;   transform: scale(1);   }
        }
      `}</style>
    </>
  );
}

const styles = {
  /* Floating bubble */
  bubble: {
    position      : 'fixed',
    bottom        : 28,
    right         : 28,
    width         : 56,
    height        : 56,
    borderRadius  : '50%',
    background    : 'linear-gradient(135deg, var(--pink-500) 0%, var(--pink-400) 100%)',
    border        : 'none',
    cursor        : 'pointer',
    display       : 'flex',
    alignItems    : 'center',
    justifyContent: 'center',
    boxShadow     : '0 4px 24px rgba(240,71,138,0.45)',
    zIndex        : 1000,
    color         : '#fff',
  },
  notifDot: {
    position    : 'absolute',
    top         : 6,
    right       : 6,
    width       : 10,
    height      : 10,
    borderRadius: '50%',
    background  : 'var(--green-400)',
    border      : '2px solid var(--dark-900)',
    boxShadow   : '0 0 6px var(--green-400)',
  },

  /* Chat panel */
  panel: {
    position     : 'fixed',
    bottom       : 96,
    right        : 28,
    width        : 360,
    maxHeight    : 560,
    borderRadius : 'var(--radius-xl)',
    background   : 'var(--dark-800)',
    border       : '1px solid var(--border-card)',
    boxShadow    : '0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px var(--border-card)',
    display      : 'flex',
    flexDirection: 'column',
    overflow     : 'hidden',
    zIndex       : 999,
  },

  /* Header */
  header: {
    display        : 'flex',
    alignItems     : 'center',
    justifyContent : 'space-between',
    padding        : '14px 16px',
    borderBottom   : '1px solid var(--border-subtle)',
    background     : 'linear-gradient(135deg, var(--pink-600) 0%, var(--pink-500) 100%)',
  },
  headerLeft: {
    display   : 'flex',
    alignItems: 'center',
    gap       : 10,
  },
  headerAvatar: {
    width         : 36,
    height        : 36,
    borderRadius  : '50%',
    background    : 'rgba(255,255,255,0.15)',
    display       : 'flex',
    alignItems    : 'center',
    justifyContent: 'center',
    fontSize      : '1.1rem',
  },
  headerName: {
    fontFamily: 'var(--font-display)',
    fontSize  : '0.9rem',
    fontWeight: 700,
    color     : '#fff',
  },
  headerSub: {
    fontSize: '0.72rem',
    color   : 'rgba(255,255,255,0.75)',
  },
  endBtn: {
    background  : 'rgba(255,255,255,0.15)',
    border      : '1px solid rgba(255,255,255,0.25)',
    borderRadius: 99,
    padding     : '4px 12px',
    fontSize    : '0.72rem',
    fontWeight  : 600,
    color       : '#fff',
    cursor      : 'pointer',
    transition  : 'background 150ms ease',
    fontFamily  : 'var(--font-body)',
  },

  /* Messages */
  messages: {
    flex      : 1,
    overflowY : 'auto',
    padding   : '16px',
    display   : 'flex',
    flexDirection: 'column',
    gap       : 10,
  },

  /* Welcome */
  welcome: {
    textAlign: 'center',
    padding  : '12px 0',
  },
  welcomeEmoji: {
    fontSize    : '2rem',
    marginBottom: 8,
  },
  welcomeTitle: {
    fontFamily  : 'var(--font-display)',
    fontSize    : '0.95rem',
    fontWeight  : 700,
    color       : 'var(--text-primary)',
    marginBottom: 4,
  },
  welcomeSub: {
    fontSize    : '0.82rem',
    color       : 'var(--text-muted)',
    marginBottom: 16,
    lineHeight  : 1.5,
  },
  suggestions: {
    display  : 'flex',
    flexWrap : 'wrap',
    gap      : 6,
    justifyContent: 'center',
  },
  suggestionChip: {
    background  : 'rgba(240,71,138,0.08)',
    border      : '1px solid rgba(240,71,138,0.20)',
    borderRadius: 99,
    padding     : '5px 12px',
    fontSize    : '0.75rem',
    color       : 'var(--pink-300)',
    cursor      : 'pointer',
    fontFamily  : 'var(--font-body)',
    fontWeight  : 500,
    textAlign   : 'left',
    transition  : 'background 150ms ease',
  },

  /* Message bubbles */
  msgRow: {
    display   : 'flex',
    alignItems: 'flex-end',
    gap       : 8,
  },
  botAvatar: {
    width         : 28,
    height        : 28,
    borderRadius  : '50%',
    background    : 'rgba(240,71,138,0.12)',
    border        : '1px solid rgba(240,71,138,0.20)',
    display       : 'flex',
    alignItems    : 'center',
    justifyContent: 'center',
    fontSize      : '0.8rem',
    flexShrink    : 0,
  },
  bubble2: {
    maxWidth    : '78%',
    padding     : '10px 14px',
    borderRadius: 'var(--radius-md)',
    fontSize    : '0.85rem',
    lineHeight  : 1.55,
  },
  userBubble: {
    background  : 'linear-gradient(135deg, var(--pink-500) 0%, var(--pink-400) 100%)',
    color       : '#fff',
    borderRadius: '14px 14px 4px 14px',
  },
  botBubble: {
    background  : 'var(--dark-700)',
    color       : 'var(--text-primary)',
    border      : '1px solid var(--border-subtle)',
    borderRadius: '14px 14px 14px 4px',
  },

  /* Typing dots */
  typingDots: {
    display : 'inline-flex',
    gap     : 4,
    fontSize: '0.5rem',
    '& span': {
      animation: 'chatDot 1.4s infinite',
    },
  },

  /* End message */
  endMsgBox: {
    background  : 'rgba(52,211,153,0.08)',
    border      : '1px solid rgba(52,211,153,0.20)',
    borderRadius: 'var(--radius-md)',
    padding     : '10px 14px',
    fontSize    : '0.82rem',
    color       : 'var(--green-400)',
    textAlign   : 'center',
  },

  /* Input area */
  inputArea: {
    display    : 'flex',
    gap        : 8,
    padding    : '12px 16px',
    borderTop  : '1px solid var(--border-subtle)',
    background : 'var(--dark-800)',
  },
  chatInput: {
    flex        : 1,
    background  : 'var(--dark-700)',
    border      : '1px solid var(--border-card)',
    borderRadius: 'var(--radius-md)',
    padding     : '10px 14px',
    color       : 'var(--text-primary)',
    fontFamily  : 'var(--font-body)',
    fontSize    : '0.88rem',
    outline     : 'none',
    transition  : 'border-color 150ms',
  },
  sendBtn: {
    width         : 40,
    height        : 40,
    borderRadius  : 'var(--radius-md)',
    background    : 'var(--pink-400)',
    border        : 'none',
    color         : '#fff',
    fontSize      : '1.1rem',
    cursor        : 'pointer',
    display       : 'flex',
    alignItems    : 'center',
    justifyContent: 'center',
    flexShrink    : 0,
    fontFamily    : 'var(--font-body)',
  },
};