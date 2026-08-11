import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "../styles/Home.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const SUGGESTIONS = [
  "Which companies has Kiran worked at?",
  "What are Kiran's core technical skills?",
  "Tell me about Kiran's education background.",
  "What projects has Kiran built?",
];

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 130) + "px";
  }, [input]);

  async function sendMessage(overrideText) {
    const text = (overrideText ?? input).trim();
    if (!text) return;

    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const raw = await res.text();
      let reply = "Something went wrong. Please try again.";
      try {
        const data = JSON.parse(raw);
        reply = data.reply || JSON.stringify(data);
      } catch (_) {
        reply = "Invalid response from server.";
      }

      setMessages((prev) => [...prev, { role: "ai", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "⚠️ Network or server error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const isEmpty = messages.length === 0 && !loading;

  return (
    <div className={styles.pageWrapper}>
      {/* ── Header ─────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.avatarRing}>
            <span className={styles.avatarInitials}>KP</span>
          </div>
          <div className={styles.headerInfo}>
            <div className={styles.headerName}>Kiran&apos;s AI Portfolio</div>
            <div className={styles.headerSubtitle}>
              <span className={styles.statusDot} />
              Ask me anything about Kiran
            </div>
          </div>
        </div>

        <div className={styles.headerRight}>
          <a
            href={`${API_URL}/resume`}
            download="Kiran_Resume.pdf"
            className={styles.downloadBtn}
            target="_blank"
            rel="noreferrer"
            title="Download Resume"
          >
            <svg
              className={styles.downloadIcon}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Download Resume</span>
          </a>
        </div>
      </header>

      {/* ── Chat Area ──────────────────────── */}
      <main className={styles.chatArea}>
        {isEmpty && (
          <div className={styles.welcomeContainer}>
            <div className={styles.welcomeIcon}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h1 className={styles.welcomeTitle}>Hi, I&apos;m Kiran&apos;s AI Assistant</h1>
            <p className={styles.welcomeText}>
              Ask me anything about Kiran&apos;s work experience, technical skills,
              projects, education, or achievements. I&apos;m here to help you learn more.
            </p>
            <div className={styles.suggestionsGrid}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  className={styles.suggestionPill}
                  onClick={() => sendMessage(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) =>
          msg.role === "user" ? (
            <div key={i} className={`${styles.messageRow} ${styles.userRow}`}>
              <div className={`${styles.messageBubble} ${styles.userBubble}`}>
                {msg.content}
              </div>
            </div>
          ) : (
            <div key={i} className={`${styles.messageRow} ${styles.aiRow}`}>
              <div className={styles.aiAvatar}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                </svg>
              </div>
              <div className={`${styles.messageBubble} ${styles.aiBubble}`}>
                <div className={styles.markdownContent}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )
        )}

        {loading && (
          <div className={styles.typingRow}>
            <div className={styles.aiAvatar}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
              </svg>
            </div>
            <div className={styles.typingBubble}>
              <div className={styles.typingDot} />
              <div className={styles.typingDot} />
              <div className={styles.typingDot} />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </main>

      {/* ── Input Area ─────────────────────── */}
      <footer className={styles.inputArea}>
        <div className={styles.inputWrapper}>
          <textarea
            ref={textareaRef}
            className={styles.chatInput}
            rows={1}
            placeholder="Ask about Kiran's experience, skills, projects…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            className={styles.sendBtn}
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            title="Send message"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className={styles.inputHint}>Press Enter to send · Shift+Enter for new line</p>
      </footer>
    </div>
  );
}
