import React, { useContext, useState } from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { useNavigate } from 'react-router-dom';
import { Context } from '../Pages/Context';
import { loginUser, registerUser } from '../api';

function Copyright(props) {
  return (
    <Typography variant="body2" color="text.secondary" align="center" {...props}>
      {'Copyright © '}
      <Link color="inherit" href="#">Check in with QR code</Link>{' '}
      {new Date().getFullYear()}
    </Typography>
  );
}



export default function Admin() {
  const ctx = useContext(Context);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (isSignUp) {
        await registerUser(email, password, 'admin');
        setSuccess('Admin registered! Please sign in.');
        setIsSignUp(false);
      } else {
        const data = await loginUser(email, password);
        if (data.role !== 'admin') {
          setError('This account does not have admin privileges.');
          setLoading(false);
          return;
        }
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('email', data.email);
        localStorage.setItem('role', data.role);
        ctx.updateUser(2);
        ctx.updateLoggedAdminEmail(data.email);
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          className="glass-panel"
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            p: 4,
          }}
        >
          <Avatar sx={{ m: 1, background: 'linear-gradient(90deg, #8A2BE2, #FF1493)' }}>
            {isSignUp ? <PersonAddIcon /> : <LockOutlinedIcon />}
          </Avatar>
          <Typography component="h1" variant="h5" sx={{ color: 'white', mb: 1 }}>
            {isSignUp ? 'Register Administrator' : 'Administrator Sign In'}
          </Typography>

          {error && <Alert severity="error" sx={{ width: '100%', mb: 1 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ width: '100%', mb: 1 }}>{success}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              className="glass-input"
              margin="normal"
              required
              fullWidth
              id="admin-email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              className="glass-input"
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="admin-password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              className="primary-gradient-btn"
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : (isSignUp ? 'Create Admin Account' : 'Sign In')}
            </Button>
            <Link
              component="button"
              type="button"
              variant="body2"
              sx={{ color: 'rgba(255,255,255,0.6)', display: 'block', textAlign: 'center' }}
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess(''); }}
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Register"}
            </Link>
          </Box>
        </Box>
        <Copyright sx={{ mt: 4, mb: 4, color: 'rgba(255,255,255,0.4)' }} />
      </Container>
  );
}
