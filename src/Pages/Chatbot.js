import React, { useState, useEffect } from 'react';
import { Box, Paper, TextField, IconButton, Typography, Fab } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import { chatWithBot } from '../api';

const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    // Generate a random session ID if not exists
    let sid = localStorage.getItem('chat_session_id');
    if (!sid) {
      // Very simple uuid generator for browser
      sid = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('chat_session_id', sid);
    }
    setSessionId(sid);
  }, []);

  const toggleChat = () => setOpen(!open);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput('');

    try {
      const email = localStorage.getItem('email') || null;
      const res = await chatWithBot(currentInput, sessionId, email);
      setMessages((prev) => [...prev, { sender: 'bot', text: res.response }]);
    } catch (err) {
      setMessages((prev) => [...prev, { sender: 'bot', text: 'Error connecting to the HR Assistant.' }]);
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
            width: 320,
            height: 450,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            overflow: 'hidden',
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
          }}
        >
          <Box sx={{ bgcolor: 'secondary.main', color: 'white', p: 2 }}>
            <Typography variant="h6" fontWeight="bold">HR Assistant</Typography>
            <Typography variant="caption">Powered by ChatterMax (Ollama)</Typography>
          </Box>
          <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {messages.length === 0 && (
              <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 2 }}>
                Hello! I'm your AI assistant. How can I help you today?
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
                  boxShadow: 1
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{m.text}</Typography>
              </Box>
            ))}
          </Box>
          <Box sx={{ p: 1.5, display: 'flex', borderTop: '1px solid rgba(0,0,0,0.1)', bgcolor: 'white' }}>
            <TextField 
              fullWidth 
              size="small" 
              variant="outlined" 
              placeholder="Ask me anything..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              sx={{ mr: 1, bgcolor: 'grey.100', borderRadius: 1 }}
            />
            <IconButton color="secondary" onClick={handleSend} sx={{ bgcolor: 'secondary.light', color: 'white', '&:hover': { bgcolor: 'secondary.main' } }}>
              <SendIcon fontSize="small" />
            </IconButton>
          </Box>
        </Paper>
      )}
    </>
  );
};

export default Chatbot;
