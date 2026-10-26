import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Context } from './Context';
import { loginUser } from '../api';
import { EyeIcon, EyeOffIcon } from '../Components/Icons';

// ─── Mini SVG atoms (inline, keeps Icons.js untouched) ───────────────────────
const MailSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" style={{ width: 17, height: 17 }}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);
const LockSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" style={{ width: 17, height: 17 }}>
    <rect x="4" y="10" width="16" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);
const ShieldCheckSvg = ({ size = 18 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size }}>
    <path d="M12 3 20 6v5c0 5-3.4 8-8 10-4.6-2-8-5-8-10V6z" />
    <path d="m8.5 12 2.3 2.3 4.8-5" />
  </svg>
);
const ArrowRightSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" style={{ width: 17, height: 17, color: '#d8ef72' }}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
const UserPlusSvg = ({ size = 18 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size }}>
    <circle cx="9" cy="8" r="4" />
    <path d="M2 21v-2a7 7 0 0 1 14 0v2M19 8v6M16 11h6" />
  </svg>
);
const LockThinSvg = ({ size = 14 }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7"
    style={{ width: size, height: size }}>
    <rect x="3" y="8" width="14" height="10" rx="2" />
    <path d="M6 8V5a4 4 0 0 1 8 0v3" />
  </svg>
);

// ─── Modal content definitions ─────────────────────────────────────────────
const MODALS = {
  forgot: {
    title: 'Reset your password',
    body: "Password resets are initiated through your organisation's approved recovery process. Contact your CheckIn administrator so they can verify your account and send a secure reset link.",
    action: 'Got it',
  },
  access: {
    title: 'Request CheckIn access',
    body: 'There is no public sign-up. Ask your organisation's Super Admin or authorised administrator to enrol you using your work email. You will receive instructions to activate your account and set your own password.',
    action: 'Got it',
  },
  help: {
    title: 'Help & support',
    body: 'For sign-in problems, forgotten passwords, or missing access, contact your organisation's CheckIn administrator. Do not share your password or verification codes with anyone.',
    action: 'Got it',
  },
  privacy: {
    title: 'Your account privacy',
    body: 'CheckIn only shows attendance records and tools permitted by your assigned role. Connect this screen to your organisation's published privacy notice before launch.',
    action: 'Got it',
  },
};

// ─── Modal ─────────────────────────────────────────────────────────────────
function Modal({ modal, onClose }) {
  const closeRef = useRef(null);
  useEffect(() => {
    if (modal) closeRef.current?.focus();
  }, [modal]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!modal) return null;
  const { title, body, action } = MODALS[modal];

  return (
    <div
      className="ci-modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ci-modal-title"
    >
      <div className="ci-modal">
        <div className="ci-modal-mark">
          <ShieldCheckSvg size={21} />
        </div>
        <h3 id="ci-modal-title">{title}</h3>
        <p>{body}</p>
        <div className="ci-modal-actions">
          <button type="button" onClick={onClose} ref={closeRef}>Close</button>
          <button type="button" className="ci-modal-primary" onClick={onClose}>{action}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Decorative QR pattern ──────────────────────────────────────────────────
const QRPattern = () => (
  <svg viewBox="0 0 100 100" role="img" aria-label="Decorative QR pattern" style={{ width: '100%', height: '100%' }}>
    <rect width="100" height="100" rx="4" fill="#fff" />
    <g fill="#14251f">
      <path d="M5 5h30v30H5zM10 10v20h20V10z" />
      <path d="M15 15h10v10H15zM65 5h30v30H65zM70 10v20h20V10zM75 15h10v10H75zM5 65h30v30H5zM10 70v20h20V70zM15 75h10v10H15z" />
      <path d="M43 5h7v7h-7zM50 12h7v7h-7zM43 22h7v7h-7zM57 25h7v7h-7zM42 38h8v8h-8zM53 40h6v6h-6zM65 40h8v8h-8zM80 40h7v7h-7zM40 53h8v8h-8zM51 52h7v7h-7zM62 53h8v8h-8zM76 53h7v7h-7zM40 66h7v7h-7zM52 65h8v8h-8zM63 66h7v7h-7zM76 66h8v8h-8zM40 78h8v8h-8zM54 78h7v7h-7zM67 79h7v7h-7zM84 81h8v8h-8zM43 91h7v5h-7zM58 91h8v5h-8zM72 91h7v5h-7z" />
    </g>
  </svg>
);

// ─── Brand Panel (left) ─────────────────────────────────────────────────────
function BrandPanel() {
  return (
    <section className="ci-brand-panel" aria-label="CheckIn introduction">
      <div className="ci-grain" />
      <a className="ci-brand" href="/" aria-label="CheckIn home">
        <div className="ci-brand-mark">✓</div>
        <div>
          <div className="ci-brand-name">check<span>in</span></div>
          <div className="ci-brand-sub">Attendance, accounted for.</div>
        </div>
      </a>

      <div className="ci-hero-copy">
        <div className="ci-eyebrow">A clearer way to check in</div>
        <h1>Your day.<br />Your presence.<br /><span>On record.</span></h1>
        <p>One secure place to check in, view your attendance, and keep your team connected—without the paperwork.</p>
      </div>

      <div className="ci-visual-card" aria-label="Illustration of an employee check-in pass">
        <div className="ci-visual-top">
          <span className="ci-visual-label">Employee check-in pass</span>
          <span className="ci-online"><i />&nbsp;System ready</span>
        </div>
        <div className="ci-pass">
          <div>
            <div className="ci-pass-kicker">Good to see you</div>
            <h3>Your next check-in.</h3>
            <p>Scan your assigned QR to record attendance.</p>
            <span className="ci-pass-status">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}>
                <path d="m4 10 4 4 8-8" />
              </svg>
              &nbsp;Secure &amp; verified
            </span>
          </div>
          <div className="ci-qr-wrap"><QRPattern /></div>
        </div>
        <div className="ci-visual-footer">
          <div className="ci-avatar-stack">
            <span>AM</span><span>JK</span><span>+8</span>
          </div>
          <span><strong>One simple system</strong> for every team member</span>
        </div>
      </div>

      <div className="ci-brand-foot">
        <span>© 2026 CheckIn</span>
        <span className="ci-secure-note">
          <LockThinSvg size={14} />
          Private access · Role-based permissions
        </span>
      </div>
    </section>
  );
}

// ─── Auth Page ──────────────────────────────────────────────────────────────
export default function Auth() {
  const ctx = useContext(Context);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formMsg, setFormMsg] = useState('');
  const [formMsgType, setFormMsgType] = useState('info'); // 'info' | 'error'
  const [modal, setModal] = useState(null); // null | 'forgot' | 'access' | 'help' | 'privacy'

  // Redirect already-logged-in users
  useEffect(() => {
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');
    if (token && role === 'admin') navigate('/admin/dashboard', { replace: true });
    else if (token && role === 'employee') navigate('/employee/dashboard', { replace: true });
  }, [navigate]);

  const showMsg = (text, type = 'error') => {
    setFormMsg(text);
    setFormMsgType(type);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormMsg('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/\S+@\S+\.\S+/.test(trimmedEmail)) {
      showMsg('Enter a valid registered work email to continue.');
      return;
    }
    if (!password) {
      showMsg('Enter your password to continue.');
      return;
    }

    setLoading(true);
    try {
      const data = await loginUser(trimmedEmail, password);

      if (rememberMe) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('email', data.email);
        localStorage.setItem('role', data.role);
      } else {
        sessionStorage.setItem('token', data.access_token);
        sessionStorage.setItem('email', data.email);
        sessionStorage.setItem('role', data.role);
        // also set localStorage so authHeaders() works (cleared on signout)
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('email', data.email);
        localStorage.setItem('role', data.role);
      }

      if (data.role === 'admin' || data.role === 'super_admin') {
        ctx.updateUser(2);
        navigate('/admin/dashboard');
      } else {
        ctx.updateUser(3);
        ctx.setLoggedEmployeeEmail?.(data.email);
        navigate('/employee/dashboard');
      }
    } catch (err) {
      showMsg(err.message || 'Authentication failed. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ci-page">
      <BrandPanel />

      {/* ── Auth Panel ── */}
      <section className="ci-auth-panel" aria-label="Sign in">
        {/* Mobile-only brand */}
        <a className="ci-mobile-brand" href="/" aria-label="CheckIn home">
          <div className="ci-brand-mark" style={{ width: 38, height: 38, borderRadius: 12, fontSize: 22 }}>✓</div>
          <div>
            <div className="ci-brand-name" style={{ fontSize: 20 }}>check<span style={{ color: '#668a3e' }}>in</span></div>
            <div className="ci-brand-sub" style={{ fontSize: 8, letterSpacing: '1.3px', color: '#79877c', fontWeight: 800, marginTop: 4 }}>Attendance, accounted for.</div>
          </div>
        </a>

        <div className="ci-auth-box">
          {/* Welcome */}
          <header className="ci-welcome">
            <div className="ci-mini-label">Member access</div>
            <h2>Welcome back.</h2>
            <p>Sign in with your registered work email to continue to CheckIn.</p>
          </header>

          {/* Access note */}
          <div className="ci-access-note">
            <div className="ci-access-icon"><ShieldCheckSvg size={18} /></div>
            <div>
              <strong>One secure sign-in for the whole team</strong>
              <p>Employees and authorised administrators use this same page. Your account permissions determine what you can access.</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="ci-field">
              <div className="ci-field-head">
                <label htmlFor="ci-email">Work email</label>
              </div>
              <div className="ci-input-wrap">
                <span className="ci-leading"><MailSvg /></span>
                <input
                  id="ci-email"
                  type="email"
                  autoComplete="username"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setFormMsg(''); }}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="ci-field">
              <div className="ci-field-head">
                <label htmlFor="ci-password">Password</label>
                <button type="button" className="ci-forgot" onClick={() => setModal('forgot')}>
                  Forgot password?
                </button>
              </div>
              <div className="ci-input-wrap">
                <span className="ci-leading"><LockSvg /></span>
                <input
                  id="ci-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFormMsg(''); }}
                  required
                />
                <button
                  type="button"
                  className="ci-reveal"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? <EyeOffIcon width={17} height={17} /> : <EyeIcon width={17} height={17} />}
                </button>
              </div>
            </div>

            {/* Options row */}
            <div className="ci-options">
              <label className="ci-remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me on this device</span>
              </label>
              <span className="ci-session-tag">
                <LockThinSvg size={13} />
                &nbsp;Secure session
              </span>
            </div>

            {/* Submit */}
            <button type="submit" className="ci-submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in securely'}
              {!loading && <ArrowRightSvg />}
            </button>

            {/* Form message */}
            {formMsg && (
              <div
                className={`ci-form-message ${formMsgType === 'error' ? 'ci-form-message--error' : ''}`}
                role="status"
                aria-live="polite"
              >
                {formMsg}
              </div>
            )}
          </form>

          {/* Divider */}
          <div className="ci-separator">New to CheckIn?</div>

          {/* Invite row */}
          <div className="ci-invite-row">
            <UserPlusSvg size={18} />
            <div>
              <strong>Get access through your organisation</strong>
              <span>
                Accounts are created or invited by the Super Admin or an authorised administrator.&nbsp;
                <button type="button" className="ci-support-link" onClick={() => setModal('access')}>
                  Request access
                </button>
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="ci-auth-footer">
          <span>© 2026 CheckIn</span>
          <div className="ci-footer-links">
            <button type="button" className="ci-footer-link" onClick={() => setModal('privacy')}>Privacy</button>
            <button type="button" className="ci-footer-link" onClick={() => setModal('help')}>Help &amp; support</button>
          </div>
        </footer>
      </section>

      {/* Modal */}
      <Modal modal={modal} onClose={() => setModal(null)} />
    </div>
  );
}
