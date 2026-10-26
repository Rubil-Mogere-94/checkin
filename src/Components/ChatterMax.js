import React, { useState, useEffect, useRef } from 'react';
import { SparkIcon, CloseIcon, SendIcon } from './Icons';

const BASE_URL = 'http://127.0.0.1:8000';

const QUICK_QUESTIONS = [
  'How does QR check-in work?',
  'Why is my location needed?',
  'How can I view my arrival history?',
  'What should I do if a check-in is missing?'
];

export default function ChatterMax({ userEmail = null, onNavigate = null }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! I am ChatterMax, your AI assistant for CheckIn. How can I help you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let sid = localStorage.getItem('chat_session_id');
    if (!sid) {
      sid = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('chat_session_id', sid);
    }
    setSessionId(sid);
  }, []);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const sendMessage = async (textToSend) => {
    const trimmed = (textToSend || input).trim();
    if (!trimmed || isStreaming) return;

    const userMsg = { sender: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    // Bot placeholder for streaming tokens
    setMessages((prev) => [...prev, { sender: 'bot', text: '', streaming: true }]);

    try {
      const email = userEmail || localStorage.getItem('email') || null;
      const response = await fetch(`${BASE_URL}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, session_id: sessionId, user_email: email }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep last incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') break;
          try {
            const { token } = JSON.parse(payload);
            if (token) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                updated[updated.length - 1] = { ...last, text: last.text + token };
                return updated;
              });
            }
          } catch {
            // ignore non-json chunk
          }
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          sender: 'bot',
          text: "I'm having trouble connecting to the backend right now. Please make sure the check-in server is running.",
          streaming: false,
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last) updated[updated.length - 1] = { ...last, streaming: false };
        return updated;
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <button
        className="assistant-button"
        id="assistantToggle"
        aria-label="Open ChatterMax assistant"
        onClick={() => setOpen(!open)}
      >
        <SparkIcon />
      </button>

      <div className={`assistant-panel ${open ? 'open' : ''}`} id="assistantPanel">
        <div className="assistant-head">
          <span className="bot-dot">
            <SparkIcon width={16} height={16} />
          </span>
          <div>
            <strong>ChatterMax Assistant</strong>
            <small>Attendance & System Guide</small>
          </div>
          <button
            className="assistant-close"
            id="assistantClose"
            aria-label="Close assistant"
            onClick={() => setOpen(false)}
          >
            <CloseIcon width={16} height={16} />
          </button>
        </div>

        <div className="assistant-body" style={{ display: 'flex', flexDirection: 'column', height: 380 }}>
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: 10,
                  display: 'flex',
                  justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '8px 12px',
                    borderRadius: 10,
                    fontSize: 10,
                    lineHeight: 1.5,
                    backgroundColor: m.sender === 'user' ? 'var(--forest)' : '#f4f6f2',
                    color: m.sender === 'user' ? '#ffffff' : 'var(--ink)',
                    border: m.sender === 'user' ? 'none' : '1px solid var(--line)',
                  }}
                >
                  {m.text || (m.streaming ? '...' : '')}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ borderTop: '1px solid var(--line)', paddingTop: 8, marginTop: 4 }}>
            <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 4, fontWeight: 700 }}>
              Quick questions:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 90, overflowY: 'auto' }}>
              {QUICK_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  className="quick-question"
                  style={{ margin: 0, padding: '5px 8px', fontSize: 9 }}
                  onClick={() => sendMessage(q)}
                >
                  {q}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <input
                type="text"
                placeholder="Ask ChatterMax a question…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isStreaming}
                style={{
                  flex: 1,
                  padding: '7px 9px',
                  borderRadius: 8,
                  border: '1px solid var(--line)',
                  fontSize: 10,
                  background: '#fcfdfb',
                }}
              />
              <button
                className="btn btn-lime"
                style={{ padding: '7px 10px' }}
                onClick={() => sendMessage()}
                disabled={isStreaming || !input.trim()}
              >
                <SendIcon width={13} height={13} />
              </button>
            </div>
          </div>
          <div className="assistant-disclaimer" style={{ marginTop: 6, fontSize: 8 }}>
            Powered by RAG FAQ knowledge base. Answers may require admin confirmation.
          </div>
        </div>
      </div>
    </>
  );
}
