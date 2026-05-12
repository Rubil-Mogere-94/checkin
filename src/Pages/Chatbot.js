import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, TextField, IconButton, Typography, Fab, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';

const BASE_URL = 'http://127.0.0.1:8000';

const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let sid = localStorage.getItem('chat_session_id');
    if (!sid) {
      sid = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('chat_session_id', sid);
    }
    setSessionId(sid);
  }, []);

  // Auto-scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleChat = () => setOpen(!open);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userMsg = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsStreaming(true);

    // Add empty bot message that will be filled token-by-token
    setMessages(prev => [...prev, { sender: 'bot', text: '', streaming: true }]);

    try {
      const email = localStorage.getItem('email') || null;
      const response = await fetch(`${BASE_URL}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput, session_id: sessionId, user_email: email }),
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
        buffer = lines.pop(); // keep incomplete last line in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') break;
          try {
            const { token } = JSON.parse(payload);
            if (token) {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                updated[updated.length - 1] = { ...last, text: last.text + token };
                return updated;
              });
            }
          } catch {
            // malformed chunk — skip
          }
        }
      }
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          sender: 'bot',
          text: '⚠️ Could not reach the assistant. Is the backend running?',
          streaming: false,
        };
        return updated;
      });
    } finally {
      // Mark streaming done
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], streaming: false };
        return updated;
      });
      setIsStreaming(false);
    }
  };

  return (
    <>
      <Fab
        color="secondary"
        aria-label="chat"
        onClick={toggleChat}
        sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}
      >
        {open ? <CloseIcon /> : <ChatIcon />}
      </Fab>

      {open && (
        <Paper
          elevation={4}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 20,
            width: 340,
            height: 480,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            overflow: 'hidden',
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          }}
        >
          {/* Header */}
          <Box sx={{ bgcolor: 'secondary.main', color: 'white', p: 2 }}>
            <Typography variant="h6" fontWeight="bold">ChatterMax</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {isStreaming ? '● Thinking…' : 'AI Assistant · Powered by Ollama'}
            </Typography>
          </Box>

          {/* Messages */}
          <Box
            sx={{
              flexGrow: 1,
              p: 2,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            {messages.length === 0 && (
              <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 2 }}>
                Hi! I'm ChatterMax. Ask me anything 👋
              </Typography>
            )}
            {messages.map((m, i) => (
              <Box
                key={i}
                sx={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  bgcolor: m.sender === 'user' ? 'primary.main' : 'grey.200',
                  color: m.sender === 'user' ? 'white' : 'black',
                  p: 1.5,
                  borderRadius: 2,
                  maxWidth: '85%',
                  boxShadow: 1,
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {m.text || (m.streaming && (
                    <CircularProgress size={12} thickness={5} sx={{ color: 'grey.500' }} />
                  ))}
                  {/* Blinking cursor while streaming */}
                  {m.streaming && m.text && (
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-block',
                        width: '2px',
                        height: '1em',
                        bgcolor: 'grey.600',
                        ml: 0.3,
                        verticalAlign: 'text-bottom',
                        animation: 'blink 1s step-end infinite',
                        '@keyframes blink': {
                          '0%, 100%': { opacity: 1 },
                          '50%': { opacity: 0 },
                        },
                      }}
                    />
                  )}
                </Typography>
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input */}
          <Box
            sx={{
              p: 1.5,
              display: 'flex',
              borderTop: '1px solid rgba(0,0,0,0.1)',
              bgcolor: 'white',
            }}
          >
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              placeholder="Ask me anything…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              disabled={isStreaming}
              sx={{ mr: 1, bgcolor: 'grey.100', borderRadius: 1 }}
            />
            <IconButton
              color="secondary"
              onClick={handleSend}
              disabled={isStreaming}
              sx={{
                bgcolor: isStreaming ? 'grey.300' : 'secondary.light',
                color: 'white',
                '&:hover': { bgcolor: 'secondary.main' },
              }}
            >
              <SendIcon fontSize="small" />
            </IconButton>
          </Box>
        </Paper>
      )}
    </>
  );
};

export default Chatbot;
