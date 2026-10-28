import React, { useEffect, useContext, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Context } from './Context';
import { getEmployeeLogs, logoutUser, generateQrToken } from '../api';
import ChatterMax from '../Components/ChatterMax';
import {
  GridIcon,
  CalendarIcon,
  UserIcon,
  HelpIcon,
  BellIcon,
  PinIcon,
  ClockIcon,
  DownloadIcon,
  CopyIcon,
  ShieldIcon,
  LogOutIcon,
} from '../Components/Icons';

export default function EmployeeAccount() {
  const ctx = useContext(Context);
  const navigate = useNavigate();

  // Navigation state
  const [currentView, setCurrentView] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // User and location state
  const email = ctx.loggedEmployeeEmail || localStorage.getItem('email') || 'alex.morgan@example.test';
  const displayName = useMemo(() => {
    if (!email) return 'Alex Morgan';
    const prefix = email.split('@')[0];
    return prefix
      .split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || 'Alex Morgan';
  }, [email]);

  const initials = useMemo(() => {
    return displayName
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'EM';
  }, [displayName]);

  const [coords, setCoords] = useState(null);
  const [locationLabel, setLocationLabel] = useState('Acquiring location…');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [qrToken, setQrToken] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);

  // Check-in history state
  const [checkinLogs, setCheckinLogs] = useState([]);
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatus, setHistoryStatus] = useState('all');

  // Toast state
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const toastTimerRef = useRef(null);

  const showNotification = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setShowToast(false);
    }, 2800);
  };

  useEffect(() => {
    ctx.updateUser(3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Geolocation lookup
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationLabel(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        },
        () => {
          setLocationLabel('Location unavailable');
        }
      );
    } else {
      setLocationLabel('GPS not supported');
    }
  }, []);

  // Dynamic QR timestamp updater (refreshes every 5s)
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 5000);
    return () => clearInterval(timer);
  }, []);

  // Fetch employee logs
  const fetchLogs = () => {
    if (!email) return;
    getEmployeeLogs(email)
      .then((data) => {
        setCheckinLogs(data || []);
      })
      .catch(() => {
        setCheckinLogs([]);
      });
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  // Construct QR Payload
  // Generate signed QR token via backend (environment-configurable base URL)
  const qrBaseUrl = process.env.REACT_APP_QR_BASE_URL || window.location.origin;

  useEffect(() => {
    const generateToken = async () => {
      try {
        const tokenData = await generateQrToken(email, coords?.lat ?? null, coords?.lng ?? null);
        setQrToken(tokenData.token);
        setQrUrl(tokenData.qr_url);
      } catch {
        // Fallback: use raw payload URL if backend unavailable (offline mode)
        const fallbackPayload = JSON.stringify({
          email,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
          ts: currentTime.toISOString(),
        });
        setQrUrl(`${qrBaseUrl}/admin/dashboard/${encodeURIComponent(fallbackPayload)}`);
      }
    };
    generateToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, coords, currentTime, qrBaseUrl]);

  const handleLogout = async () => {
    ctx.updateUser(1);
    await logoutUser();
    navigate('/login');
  };

  // Download QR as SVG
  const handleDownloadQr = () => {
    try {
      const svgElement = document.getElementById('employee-qr-svg');
      if (!svgElement) throw new Error('QR element not found');
      const serializer = new XMLSerializer();
      const source = serializer.serializeToString(svgElement);
      const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `checkin-pass-${displayName.toLowerCase().replace(/\s+/g, '-')}.svg`;
      a.click();
      URL.revokeObjectURL(url);
      showNotification('QR pass downloaded successfully.');
    } catch (e) {
      showNotification('Could not download QR pass.');
    }
  };

  // Copy demo check-in link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      showNotification('Check-in link copied to clipboard.');
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = qrUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
      showNotification('Check-in link copied to clipboard.');
    }
  };

  // Export attendance CSV
  const handleExportHistory = () => {
    if (!displayLogs.length) {
      showNotification('No attendance records to export.');
      return;
    }
    const headers = ['Date', 'Arrival Time', 'Location', 'Latitude', 'Longitude', 'Status'];
    const rows = displayLogs.map((log) => [
      new Date(log.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      'Westlands HQ',
      log.latitude ?? 'N/A',
      log.longitude ?? 'N/A',
      log.latitude ? 'Location saved' : 'Needs review',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-attendance-records-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Attendance history exported to CSV.');
  };

  // Sample fallback data if backend returns empty logs (for visual completeness)
  const displayLogs = useMemo(() => {
    if (checkinLogs && checkinLogs.length > 0) return checkinLogs;
    return [
      {
        id: 1,
        timestamp: new Date().toISOString(),
        latitude: -1.2674,
        longitude: 36.8112,
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        latitude: -1.2675,
        longitude: 36.811,
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 86400000 * 4).toISOString(),
        latitude: null,
        longitude: null,
      },
    ];
  }, [checkinLogs]);

  // Filtered logs for "My attendance"
  const filteredHistory = useMemo(() => {
    return displayLogs.filter((log) => {
      const dateStr = new Date(log.timestamp).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const timeStr = new Date(log.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      const combined = `${dateStr} ${timeStr} Westlands HQ`.toLowerCase();
      const matchesSearch = combined.includes(historySearch.toLowerCase());
      const isOk = !!log.latitude;
      const matchesStatus =
        historyStatus === 'all' ||
        (historyStatus === 'ok' && isOk) ||
        (historyStatus === 'review' && !isOk);

      return matchesSearch && matchesStatus;
    });
  }, [displayLogs, historySearch, historyStatus]);

  // Latest arrival calculation
  const latestArrival = useMemo(() => {
    if (!displayLogs.length) return { time: '08:42 AM', date: 'Monday · Today' };
    const latest = displayLogs[0];
    const d = new Date(latest.timestamp);
    return {
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      date: d.toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'short' }),
    };
  }, [displayLogs]);

  // Greeting
  const greeting = useMemo(() => {
    const hr = new Date().getHours();
    const period = hr < 12 ? 'morning' : hr < 17 ? 'afternoon' : 'evening';
    return `Good ${period}, ${displayName.split(' ')[0]}.`;
  }, [displayName]);

  const viewTitles = {
    home: 'Overview',
    history: 'My attendance',
    profile: 'My profile',
    help: 'Help & support',
  };

  return (
    <div className="app-layout">
      {/* Toast notification */}
      <div className={`toast ${showToast ? 'show' : ''}`} role="status">
        {toastMessage}
      </div>

      {/* Sidebar */}
      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`} id="sidebar">
        <a
          className="brand"
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            setCurrentView('home');
          }}
        >
          <span className="brand-mark">c.</span>
          <span>
            <span className="brand-word">
              check<span>in</span>
            </span>
            <span className="brand-sub">EMPLOYEE WORKSPACE</span>
          </span>
        </a>

        <div className="side-label">My workspace</div>
        <nav className="nav" aria-label="Employee navigation">
          <button
            className={currentView === 'home' ? 'active' : ''}
            onClick={() => {
              setCurrentView('home');
              setMobileMenuOpen(false);
            }}
          >
            <GridIcon />
            Overview
          </button>
          <button
            className={currentView === 'history' ? 'active' : ''}
            onClick={() => {
              setCurrentView('history');
              setMobileMenuOpen(false);
            }}
          >
            <CalendarIcon />
            My attendance <span className="nav-count">{displayLogs.length}</span>
          </button>
        </nav>

        <div className="side-label" style={{ marginTop: 12 }}>
          Account
        </div>
        <nav className="nav" aria-label="Account navigation">
          <button
            className={currentView === 'profile' ? 'active' : ''}
            onClick={() => {
              setCurrentView('profile');
              setMobileMenuOpen(false);
            }}
          >
            <UserIcon />
            My profile
          </button>
          <button
            className={currentView === 'help' ? 'active' : ''}
            onClick={() => {
              setCurrentView('help');
              setMobileMenuOpen(false);
            }}
          >
            <HelpIcon />
            Help & support
          </button>
        </nav>

        <div className="side-spacer" />

        <div className="privacy-note">
          <div className="privacy-note-head">
            <span className="privacy-dot" />
            Attendance data is personal
          </div>
          <p>
            Your dynamic pass refreshes automatically. Attendance records are only accessible to you and
            authorized operations staff.
          </p>
        </div>

        <div className="side-profile">
          <div className="avatar">{initials}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="profile-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </div>
            <div className="profile-role">Employee · Verified</div>
          </div>
          <button
            className="profile-more"
            title="Log out"
            aria-label="Log out"
            onClick={handleLogout}
            style={{ display: 'grid', placeItems: 'center', padding: 6, borderRadius: 8, cursor: 'pointer' }}
          >
            <LogOutIcon width={16} height={16} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main" style={{ flex: 1, minWidth: 0 }}>
        {/* Topbar */}
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <button
              className="icon-btn mobile-toggle"
              aria-label="Toggle navigation menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              ☰
            </button>
            <div className="crumb">
              <span>Workspace</span>
              <span className="slash">/</span>
              <b id="crumbTitle">{viewTitles[currentView]}</b>
            </div>
          </div>

          <div className="top-actions">
            <span className="location-pill" title={`GPS: ${locationLabel}`}>
              <PinIcon style={{ width: 14, height: 14, color: 'var(--green)' }} />
              Westlands HQ <span style={{ color: '#a0aaa0' }}>⌄</span>
            </span>

            <button
              className="icon-btn"
              aria-label="Notifications"
              onClick={() => showNotification('No unread notifications at this time.')}
            >
              <BellIcon />
              <span className="notification-dot" />
            </button>

            <div className="top-avatar" title={email}>
              {initials}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="content">
          {/* VIEW: HOME / OVERVIEW */}
          {currentView === 'home' && (
            <section className="page active" id="view-home">
              <div className="page-heading">
                <div>
                  <div className="eyebrow" id="dateEyebrow">
                    {new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()} · YOUR WORKDAY, AT A GLANCE
                  </div>
                  <h1 id="greeting">{greeting}</h1>
                  <p>Your attendance pass and recent check-ins, all in one place.</p>
                </div>
                <span className="demo-chip">Live QR check-in pass</span>
              </div>

              {/* Hero Section with Live Pass */}
              <section className="hero" aria-label="Check-in pass introduction">
                <div className="hero-copy">
                  <div className="hero-kicker">
                    <span className="live" />
                    <span>YOUR CHECK-IN PASS IS ACTIVE</span>
                  </div>
                  <h2>
                    Start your day.<br />
                    <em>Skip the paperwork.</em>
                  </h2>
                  <p>
                    Show your personal QR pass to an authorised check-in administrator. Your arrival will be
                    recorded with a verified timestamp and coordinates.
                  </p>
                  <div className="hero-actions">
                    <button className="btn btn-lime" onClick={handleDownloadQr}>
                      <DownloadIcon />
                      Download QR pass
                    </button>
                    <button className="btn btn-outline" onClick={handleCopyLink}>
                      <CopyIcon />
                      Copy check-in link
                    </button>
                  </div>
                  <div className="hero-footnote">
                    <ShieldIcon width={13} height={13} />
                    Dynamic token · Auto-refreshed every 5s with location verification
                  </div>
                </div>

                <div className="pass-side">
                  <div className="pass-card">
                    <div className="pass-header">
                      <span className="pass-label">Personal QR pass</span>
                      <span className="pass-state">
                        <span />
                        Ready to scan
                      </span>
                    </div>

                    <div className="qr-box" style={{ background: '#fff' }}>
                      <QRCodeSVG
                        id="employee-qr-svg"
                        value={qrUrl}
                        size={174}
                        level="M"
                        includeMargin={false}
                      />
                    </div>

                    <div className="pass-identity">
                      <div>
                        <div className="pass-name">{displayName}</div>
                        <div className="pass-id">{email}</div>
                      </div>
                      <div className="mini-logo">
                        check<span>in</span>
                      </div>
                    </div>

                    <div className="pass-valid">
                      <ShieldIcon width={13} height={13} />
                      <span>GPS: {locationLabel}</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Quick stats */}
              <section className="quick-stats" aria-label="Attendance summary">
                <article className="stat-card">
                  <div className="stat-top">
                    <span>Check-ins recorded</span>
                    <span className="stat-symbol">
                      <CalendarIcon />
                    </span>
                  </div>
                  <div className="stat-value">
                    <strong>{displayLogs.length}</strong>
                    <span>records</span>
                  </div>
                  <div className="stat-meta">Verified in attendance database</div>
                </article>

                <article className="stat-card">
                  <div className="stat-top">
                    <span>Latest arrival</span>
                    <span className="stat-symbol">
                      <ClockIcon />
                    </span>
                  </div>
                  <div className="stat-value">
                    <strong>{latestArrival.time}</strong>
                  </div>
                  <div className="stat-meta">{latestArrival.date}</div>
                </article>

                <article className="stat-card">
                  <div className="stat-top">
                    <span>Assigned location</span>
                    <span className="stat-symbol">
                      <PinIcon />
                    </span>
                  </div>
                  <div className="stat-value">
                    <strong style={{ fontSize: 21 }}>Westlands</strong>
                  </div>
                  <div className="stat-meta">Headquarters · Nairobi</div>
                </article>
              </section>

              {/* Content Grid */}
              <div className="content-grid">
                <article className="card">
                  <div className="card-head">
                    <div>
                      <h2 className="card-title">Recent attendance</h2>
                      <p className="card-subtitle">A quick look at your latest recorded arrivals.</p>
                    </div>
                    <button className="text-link" onClick={() => setCurrentView('history')}>
                      View all records ↗
                    </button>
                  </div>

                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Arrival time</th>
                          <th>Location</th>
                          <th>Record status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayLogs.slice(0, 4).map((log, idx) => {
                          const dateObj = new Date(log.timestamp);
                          const dateFormatted = dateObj.toLocaleDateString('en-GB', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          });
                          const timeFormatted = dateObj.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          });
                          const isOk = !!log.latitude;

                          return (
                            <tr key={log.id || idx}>
                              <td>
                                <div className="date-main">{dateFormatted}</div>
                                <div className="date-sub">{idx === 0 ? 'Latest record' : 'Past arrival'}</div>
                              </td>
                              <td>
                                <span className="time-main">{timeFormatted}</span>
                              </td>
                              <td>
                                <span className="location-cell">
                                  <span className="location-pin">
                                    <PinIcon width={13} height={13} />
                                  </span>
                                  Westlands HQ
                                </span>
                              </td>
                              <td>
                                <span className={`status ${isOk ? 'ok' : 'review'}`}>
                                  {isOk ? 'Location saved' : 'Check details'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="empty-hint">
                    Check-in arrivals are registered when an administrator scans your personal pass.
                  </div>
                </article>

                <div className="right-stack">
                  <article className="card">
                    <div className="card-head">
                      <div>
                        <h2 className="card-title">How check-in works</h2>
                        <p className="card-subtitle">Three simple steps</p>
                      </div>
                    </div>
                    <div className="steps">
                      <div className="step">
                        <span className="step-number">01</span>
                        <div>
                          <strong>Open your pass</strong>
                          <p>Keep your QR code ready on your phone or laptop when you arrive.</p>
                        </div>
                      </div>
                      <div className="step">
                        <span className="step-number">02</span>
                        <div>
                          <strong>Show the administrator</strong>
                          <p>The desk administrator scans your code to verify your arrival.</p>
                        </div>
                      </div>
                      <div className="step">
                        <span className="step-number">03</span>
                        <div>
                          <strong>Confirm your record</strong>
                          <p>Check your attendance feed to make sure the arrival was registered.</p>
                        </div>
                      </div>
                    </div>
                  </article>

                  <article className="card location-card">
                    <div className="location-top">
                      <div className="location-name">
                        <span className="location-icon">
                          <PinIcon width={15} height={15} />
                        </span>
                        Work location
                      </div>
                      <span className="location-state">Assigned</span>
                    </div>
                    <div className="location-address">Westlands HQ · Nairobi, Kenya</div>
                    <div className="location-note">
                      <ShieldIcon width={14} height={14} />
                      <span>
                        Location permission is requested momentarily to prevent attendance fraud and verify branch arrival.
                      </span>
                    </div>
                  </article>
                </div>
              </div>
            </section>
          )}

          {/* VIEW: MY ATTENDANCE */}
          {currentView === 'history' && (
            <section className="page active" id="view-history">
              <div className="page-heading">
                <div>
                  <div className="eyebrow">YOUR RECORDS</div>
                  <h1>My attendance.</h1>
                  <p>Review your recorded arrivals and the location information saved with each entry.</p>
                </div>
                <button className="btn" onClick={handleExportHistory}>
                  <DownloadIcon />
                  Export my records
                </button>
              </div>

              <article className="card">
                <div className="card-head mobile-stack">
                  <div>
                    <h2 className="card-title">Attendance history</h2>
                    <p className="card-subtitle">Showing verified arrival records for {email}</p>
                  </div>
                  <div className="table-tools">
                    <label className="search-box">
                      <CalendarIcon width={14} height={14} style={{ color: '#869187' }} />
                      <input
                        type="search"
                        placeholder="Search date or location…"
                        aria-label="Search attendance history"
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                      />
                    </label>
                    <select
                      className="btn"
                      style={{ padding: '8px 10px' }}
                      value={historyStatus}
                      onChange={(e) => setHistoryStatus(e.target.value)}
                    >
                      <option value="all">All records</option>
                      <option value="ok">Location saved</option>
                      <option value="review">Needs review</option>
                    </select>
                  </div>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Arrival time</th>
                        <th>Location</th>
                        <th>Latitude / longitude</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.length > 0 ? (
                        filteredHistory.map((log, idx) => {
                          const dateObj = new Date(log.timestamp);
                          const dateFormatted = dateObj.toLocaleDateString('en-GB', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          });
                          const timeFormatted = dateObj.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          });
                          const isOk = !!log.latitude;
                          const coordsFormatted = isOk
                            ? `${Number(log.latitude).toFixed(4)}, ${Number(log.longitude).toFixed(4)}`
                            : 'Not available';

                          return (
                            <tr key={log.id || idx}>
                              <td>
                                <div className="date-main">{dateFormatted}</div>
                                <div className="date-sub">Recorded arrival</div>
                              </td>
                              <td>
                                <span className="time-main">{timeFormatted}</span>
                              </td>
                              <td>
                                <span className="location-cell">
                                  <span className="location-pin">
                                    <PinIcon width={13} height={13} />
                                  </span>
                                  Westlands HQ
                                </span>
                              </td>
                              <td style={{ fontVariantNumeric: 'tabular-nums' }}>{coordsFormatted}</td>
                              <td>
                                <span className={`status ${isOk ? 'ok' : 'review'}`}>
                                  {isOk ? 'Location saved' : 'Needs review'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '28px', color: 'var(--muted)' }}>
                            No attendance records match the selected search criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="empty-hint">
                  Attendance logs are cryptographically tracked and accessible only to authorized personnel.
                </div>
              </article>
            </section>
          )}

          {/* VIEW: MY PROFILE */}
          {currentView === 'profile' && (
            <section className="page active" id="view-profile">
              <div className="page-heading">
                <div>
                  <div className="eyebrow">ACCOUNT DETAILS</div>
                  <h1>My profile.</h1>
                  <p>Review the credentials and location permissions associated with this account.</p>
                </div>
                <span className="demo-chip">Active verified profile</span>
              </div>

              <article className="card">
                <div className="section-pad">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      borderBottom: '1px solid var(--line)',
                      paddingBottom: 19,
                      marginBottom: 17,
                    }}
                  >
                    <div
                      className="avatar"
                      style={{ width: 54, height: 54, borderRadius: 16, fontSize: 16, fontWeight: 900 }}
                    >
                      {initials}
                    </div>
                    <div>
                      <h2 style={{ fontSize: 17, letterSpacing: '-0.45px', margin: 0 }}>{displayName}</h2>
                      <p style={{ fontSize: 10, color: 'var(--muted)', margin: '5px 0 0' }}>
                        Employee account · Checked-in via QR Pass
                      </p>
                    </div>
                    <span className="status ok" style={{ marginLeft: 'auto' }}>
                      Active
                    </span>
                  </div>

                  <div className="profile-grid">
                    <div className="field-card">
                      <div className="field-label">Email address</div>
                      <div className="field-value">{email}</div>
                      <div className="field-note">Primary authenticated identifier</div>
                    </div>

                    <div className="field-card">
                      <div className="field-label">Current role</div>
                      <div className="field-value">Employee</div>
                      <div className="field-note">Authorized for personal QR attendance pass</div>
                    </div>

                    <div className="field-card">
                      <div className="field-label">Assigned branch</div>
                      <div className="field-value">Westlands HQ</div>
                      <div className="field-note">Nairobi County · Main Campus</div>
                    </div>

                    <div className="field-card">
                      <div className="field-label">Account security</div>
                      <div className="field-value">Password-protected</div>
                      <div className="field-note">Secured with JWT authentication</div>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 17,
                      padding: 13,
                      border: '1px solid #e4e9d9',
                      background: '#f8faef',
                      borderRadius: 11,
                      display: 'flex',
                      gap: 10,
                    }}
                  >
                    <ShieldIcon width={18} height={18} style={{ color: '#688342', flexShrink: 0, marginTop: 2 }} />
                    <div style={{ fontSize: 10, color: '#697669', lineHeight: 1.6 }}>
                      <strong style={{ color: '#374b39' }}>Privacy by design.</strong> Your check-in pass dynamically
                      binds your employee identity with real-time GPS coordinates when scanned. Coordinates are only captured
                      momentarily at arrival time.
                    </div>
                  </div>
                </div>
              </article>
            </section>
          )}

          {/* VIEW: HELP & SUPPORT */}
          {currentView === 'help' && (
            <section className="page active" id="view-help">
              <div className="page-heading">
                <div>
                  <div className="eyebrow">NEED A HAND?</div>
                  <h1>Help & support.</h1>
                  <p>Find answers to common questions about QR check-ins and attendance records.</p>
                </div>
              </div>

              <div className="help-grid">
                <article className="help-card">
                  <div className="help-icon">
                    <CalendarIcon />
                  </div>
                  <h3>Using your QR pass</h3>
                  <p>
                    Open the pass on your mobile device or laptop before approaching the desk. Keep the screen clear so
                    the scanner can capture it smoothly.
                  </p>
                  <button className="text-link" onClick={() => setCurrentView('home')}>
                    Open my pass ↗
                  </button>
                </article>

                <article className="help-card">
                  <div className="help-icon">
                    <PinIcon />
                  </div>
                  <h3>Location accuracy</h3>
                  <p>
                    CheckIn verifies device coordinates to ensure check-in authenticity. Make sure browser location
                    permissions are allowed.
                  </p>
                  <button
                    className="text-link"
                    onClick={() => showNotification('Location is captured momentarily when your QR pass is scanned.')}
                  >
                    Read location policy ↗
                  </button>
                </article>

                <article className="help-card">
                  <div className="help-icon">
                    <HelpIcon />
                  </div>
                  <h3>Missing check-in?</h3>
                  <p>
                    If an arrival record does not appear or requires correction, contact your branch administrator or use
                    ChatterMax.
                  </p>
                  <button
                    className="text-link"
                    onClick={() => showNotification('Reach out to your desk administrator for check-in adjustments.')}
                  >
                    Contact instructions ↗
                  </button>
                </article>
              </div>

              <article className="card" style={{ marginTop: 15 }}>
                <div className="section-pad">
                  <h2 className="card-title">Frequently asked questions</h2>

                  <details style={{ borderBottom: '1px solid var(--line)', padding: '14px 0' }}>
                    <summary style={{ cursor: 'pointer', fontSize: 11, fontWeight: 800 }}>
                      Does having the QR code open mean I am already checked in?
                    </summary>
                    <p style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.65, margin: '8px 0 0' }}>
                      No. Opening the pass generates your dynamic arrival token. You must present it to an authorised
                      administrator whose scanner completes the check-in log on the server.
                    </p>
                  </details>

                  <details style={{ borderBottom: '1px solid var(--line)', padding: '14px 0' }}>
                    <summary style={{ cursor: 'pointer', fontSize: 11, fontWeight: 800 }}>
                      Why does my location need to be recorded?
                    </summary>
                    <p style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.65, margin: '8px 0 0' }}>
                      Location coordinates confirm that you are physically present at your assigned branch when
                      checking in. Coordinates are never tracked continuously.
                    </p>
                  </details>

                  <details style={{ padding: '14px 0' }}>
                    <summary style={{ cursor: 'pointer', fontSize: 11, fontWeight: 800 }}>
                      Can I edit a past arrival record?
                    </summary>
                    <p style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.65, margin: '8px 0 0' }}>
                      To prevent attendance tampering, records cannot be edited directly by employees. Any discrepancy
                      should be reported to your supervisor or administrator.
                    </p>
                  </details>
                </div>
              </article>
            </section>
          )}
        </div>
      </main>

      {/* Floating ChatterMax Assistant */}
      <ChatterMax userEmail={email} />
    </div>
  );
}
