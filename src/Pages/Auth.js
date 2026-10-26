import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Context } from './Context';
import { loginUser, registerUser } from '../api';
import {
  ShieldIcon,
  UserIcon,
  EyeIcon,
  EyeOffIcon,
  CheckIcon,
  AlertIcon,
  ScanIcon,
  PinIcon,
} from '../Components/Icons';

export default function Auth({ defaultRole = 'employee' }) {
  const ctx = useContext(Context);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active role from prop or route
  const isInitialAdmin = defaultRole === 'admin' || location.pathname.includes('/admin');
  const [selectedRole, setSelectedRole] = useState(isInitialAdmin ? 'admin' : 'employee');
  const [isSignUp, setIsSignUp] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Update selected role if route changes
  useEffect(() => {
    if (location.pathname === '/admin/login') {
      setSelectedRole('admin');
    } else if (location.pathname === '/employee/login') {
      setSelectedRole('employee');
    }
  }, [location.pathname]);

  const handleRoleSwitch = (role) => {
    setSelectedRole(role);
    setError('');
    setSuccess('');
    // Optionally sync URL without reload
    if (role === 'admin' && location.pathname !== '/admin/login') {
      navigate('/admin/login', { replace: true });
    } else if (role === 'employee' && location.pathname !== '/employee/login') {
      navigate('/employee/login', { replace: true });
    }
  };

  const handleQuickFill = (demoEmail) => {
    setEmail(demoEmail);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isSignUp) {
        await registerUser(email, password, selectedRole);
        setSuccess(`Account registered as ${selectedRole === 'admin' ? 'Administrator' : 'Employee'}! Please sign in.`);
        setIsSignUp(false);
      } else {
        const data = await loginUser(email, password);

        // Store session tokens
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('email', data.email);
        localStorage.setItem('role', data.role);

        if (data.role === 'admin') {
          ctx.updateUser(2);
          navigate('/admin/dashboard');
        } else {
          ctx.updateUser(3);
          ctx.setLoggedEmployeeEmail?.(data.email);
          navigate('/employee/dashboard');
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = selectedRole === 'admin';

  return (
    <div className="auth-wrapper" style={{ padding: '32px 16px', minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <div className="auth-card" style={{ maxWidth: 460, width: '100%' }}>
        {/* Brand Header */}
        <div className="auth-header" style={{ textAlign: 'center', marginBottom: 20 }}>
          <div className="auth-logo" style={{ justifyContent: 'center' }}>
            <span className="brand-mark" style={{ width: 42, height: 42, fontSize: 24 }}>
              c.
            </span>
            <span className="brand-word" style={{ fontSize: 25 }}>
              check<span style={{ color: 'var(--lime-deep)' }}>in</span>
            </span>
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 850, margin: '8px 0 4px', color: 'var(--ink)' }}>
            {isSignUp ? `Create ${isAdmin ? 'Admin' : 'Employee'} Account` : isAdmin ? 'Operations Console' : 'Employee Workspace'}
          </h1>
          <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>
            {isSignUp
              ? 'Set up your credentials for check-in attendance.'
              : isAdmin
              ? 'Sign in to monitor arrivals, manage branches, and audit logs.'
              : 'Sign in to access your personal QR check-in pass.'}
          </p>
        </div>

        {/* Role Switcher Tabs */}
        <div className="auth-switch" style={{ marginBottom: 18 }}>
          <button
            type="button"
            className={!isAdmin ? 'active' : ''}
            onClick={() => handleRoleSwitch('employee')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <UserIcon width={14} height={14} />
            Employee Pass
          </button>
          <button
            type="button"
            className={isAdmin ? 'active' : ''}
            onClick={() => handleRoleSwitch('admin')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <ShieldIcon width={14} height={14} />
            Administrator
          </button>
        </div>

        {/* Error and Success Feedback */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 10,
              background: 'var(--red-soft)',
              color: 'var(--red)',
              fontSize: 10,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            <AlertIcon width={14} height={14} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 10,
              background: 'var(--green-soft)',
              color: 'var(--green)',
              fontSize: 10,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            <CheckIcon width={14} height={14} style={{ flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <div className="field">
            <label style={{ fontSize: 10, fontWeight: 800, color: '#4b5e50' }}>
              {isAdmin ? 'Administrator Work Email' : 'Employee Work Email'}
            </label>
            <input
              type="email"
              placeholder={isAdmin ? 'admin@company.com' : 'employee@company.com'}
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
                background: '#fcfdfb',
              }}
            />
          </div>

          <div className="field">
            <label style={{ fontSize: 10, fontWeight: 800, color: '#4b5e50' }}>Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 38px 10px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--line)',
                  fontSize: 11,
                  background: '#fcfdfb',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 8,
                  background: 'none',
                  border: 'none',
                  padding: 4,
                  color: 'var(--muted)',
                  display: 'grid',
                  placeItems: 'center',
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOffIcon width={16} height={16} /> : <EyeIcon width={16} height={16} />}
              </button>
            </div>
          </div>

          {/* Quick autofill sample accounts */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: -4 }}>
            <span style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 700 }}>Quick fill:</span>
            <button
              type="button"
              className="btn btn-quiet"
              style={{ padding: '3px 8px', fontSize: 8, borderRadius: 6 }}
              onClick={() => handleQuickFill(isAdmin ? 'admin@checkin.com' : 'rubil.mogere@gmail.com')}
            >
              {isAdmin ? 'admin@checkin.com' : 'rubil.mogere@gmail.com'}
            </button>
            <button
              type="button"
              className="btn btn-quiet"
              style={{ padding: '3px 8px', fontSize: 8, borderRadius: 6 }}
              onClick={() => handleQuickFill('mogererubil@gmail.com')}
            >
              mogererubil@gmail.com
            </button>
          </div>

          <button
            type="submit"
            className={isAdmin ? 'btn btn-primary' : 'btn btn-lime'}
            disabled={loading}
            style={{ width: '100%', padding: '12px', fontSize: 11, marginTop: 6, fontWeight: 850 }}
          >
            {loading
              ? 'Authenticating...'
              : isSignUp
              ? `Register as ${isAdmin ? 'Administrator' : 'Employee'}`
              : `Sign In to ${isAdmin ? 'Console' : 'Workspace'}`}
          </button>
        </form>

        {/* Toggle Sign In / Register */}
        <div style={{ marginTop: 18, textAlign: 'center' }}>
          <button
            type="button"
            className="text-link"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setSuccess('');
            }}
            style={{ fontSize: 10, fontWeight: 800 }}
          >
            {isSignUp
              ? 'Already registered? Sign In instead'
              : `Need a new account? Register as ${isAdmin ? 'Admin' : 'Employee'}`}
          </button>
        </div>

        {/* Feature Badges Footer */}
        <div
          style={{
            marginTop: 22,
            paddingTop: 16,
            borderTop: '1px solid var(--line)',
            display: 'flex',
            justifyContent: 'space-around',
            color: 'var(--muted)',
            fontSize: 9,
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <ScanIcon width={14} height={14} style={{ color: 'var(--forest)' }} />
            <span>Dynamic QR</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <PinIcon width={14} height={14} style={{ color: 'var(--green)' }} />
            <span>GPS Verified</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <ShieldIcon width={14} height={14} style={{ color: 'var(--forest)' }} />
            <span>JWT Security</span>
          </div>
        </div>
      </div>
    </div>
  );
}
