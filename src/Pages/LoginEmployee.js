import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Context } from '../Pages/Context';
import { loginUser, registerUser } from '../api';
import { ShieldIcon, UserIcon } from '../Components/Icons';

export default function LoginEmployee() {
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
        await registerUser(email, password, 'employee');
        setSuccess('Employee account created! Please sign in.');
        setIsSignUp(false);
      } else {
        const data = await loginUser(email, password);
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('email', data.email);
        localStorage.setItem('role', data.role);
        ctx.updateUser(3);
        ctx.setLoggedEmployeeEmail?.(data.email);
        navigate('/employee/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your email and password.');
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
          <h1>{isSignUp ? 'New Employee Setup' : 'Employee Workspace'}</h1>
          <p>Access your personal QR check-in pass and arrival history.</p>
        </div>

        {/* Portal Switcher */}
        <div className="auth-switch">
          <button onClick={() => navigate('/admin/login')}>
            <ShieldIcon width={13} height={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            Administrator
          </button>
          <button className="active">
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
            <label style={{ fontSize: 10, fontWeight: 800, color: '#4b5e50' }}>Work Email</label>
            <input
              type="email"
              placeholder="alex.morgan@company.com"
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
            className="btn btn-lime"
            disabled={loading}
            style={{ width: '100%', padding: '12px', fontSize: 11, marginTop: 6 }}
          >
            {loading ? 'Signing in...' : isSignUp ? 'Create Employee Account' : 'Sign In to Workspace'}
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
            {isSignUp ? 'Already registered? Sign In' : 'First time here? Register as Employee'}
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
          Dynamic token generation with GPS verification · CheckIn v2
        </div>
      </div>
    </div>
  );
}
