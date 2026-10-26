import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Context } from '../Pages/Context';
import { loginUser, registerUser } from '../api';
import { ShieldIcon, UserIcon } from '../Components/Icons';

export default function LoginAdmin() {
  const ctx = useContext(Context);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isSignUp) {
        await registerUser(email, password, 'admin');
        setSuccess('Administrator registered! Please sign in.');
        setIsSignUp(false);
      } else {
        const data = await loginUser(email, password);
        if (data.role !== 'admin') {
          setError('This account does not have administrator privileges.');
          setLoading(false);
          return;
        }
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('email', data.email);
        localStorage.setItem('role', data.role);
        ctx.updateUser(2);
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="brand-mark" style={{ width: 36, height: 36, fontSize: 20 }}>
              c.
            </span>
            <span className="brand-word" style={{ fontSize: 22 }}>
              check<span>in</span>
            </span>
          </div>
          <h1>{isSignUp ? 'Create Admin Account' : 'Operations Console'}</h1>
          <p>Sign in to manage employee attendance, branches, and check-in logs.</p>
        </div>

        {/* Portal Switcher */}
        <div className="auth-switch">
          <button className="active">
            <ShieldIcon width={13} height={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            Administrator
          </button>
          <button onClick={() => navigate('/employee/login')}>
            <UserIcon width={13} height={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            Employee
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              background: 'var(--red-soft)',
              color: 'var(--red)',
              fontSize: 10,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              background: 'var(--green-soft)',
              color: 'var(--green)',
              fontSize: 10,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <div className="field">
            <label style={{ fontSize: 10, fontWeight: 800, color: '#4b5e50' }}>Admin Work Email</label>
            <input
              type="email"
              placeholder="admin@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid var(--line)',
                fontSize: 11,
              }}
            />
          </div>

          <div className="field">
            <label style={{ fontSize: 10, fontWeight: 800, color: '#4b5e50' }}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid var(--line)',
                fontSize: 11,
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '12px', fontSize: 11, marginTop: 6 }}
          >
            {loading ? 'Authenticating...' : isSignUp ? 'Register Admin Account' : 'Sign In as Administrator'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button
            type="button"
            className="text-link"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setSuccess('');
            }}
            style={{ fontSize: 10 }}
          >
            {isSignUp ? 'Already have an admin account? Sign In' : 'Need a new admin account? Register'}
          </button>
        </div>

        <div
          style={{
            marginTop: 20,
            padding: 10,
            background: '#f9faf7',
            borderRadius: 10,
            border: '1px solid var(--line)',
            fontSize: 9,
            color: 'var(--muted)',
            textAlign: 'center',
          }}
        >
          CheckIn v2 Operations · Role-governed attendance infrastructure
        </div>
      </div>
    </div>
  );
}
