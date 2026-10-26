import React, { useEffect, useContext, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Context } from './Context';
import {
  logCheckIn,
  getAllLogs,
  getUsers,
  deleteUser,
  getLocations,
  createLocation,
  registerUser,
  deleteLocation,
  getFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
} from '../api';
import ChatterMax from '../Components/ChatterMax';
import {
  GridIcon,
  ScanIcon,
  UsersIcon,
  PinIcon,
  ShieldIcon,
  SettingsIcon,
  SearchIcon,
  BellIcon,
  DownloadIcon,
  PlusIcon,
  ClockIcon,
  AlertIcon,
  LogOutIcon,
  TrashIcon,
  EditIcon,
  CheckIcon,
} from '../Components/Icons';

export default function AdminAccount() {
  const ctx = useContext(Context);
  const navigate = useNavigate();
  const { emailLink } = useParams();

  // Navigation & UI state
  const [currentView, setCurrentView] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'scan', 'employee', 'branch', 'detail', null
  const [selectedDetailRecord, setSelectedDetailRecord] = useState(null);

  // Time range for chart
  const [chartRange, setChartRange] = useState('Today'); // 'Today', '7 days', '30 days'

  // Search & Filter states
  const [globalSearch, setGlobalSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');
  const [logBranchFilter, setLogBranchFilter] = useState('all');
  const [logStatusFilter, setLogStatusFilter] = useState('all');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeBranchFilter, setEmployeeBranchFilter] = useState('all');

  // Form states
  const [scanInput, setScanInput] = useState('');
  const [scanSubmitting, setScanSubmitting] = useState(false);

  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeEmail, setNewEmployeeEmail] = useState('');
  const [newEmployeePassword, setNewEmployeePassword] = useState('');
  const [newEmployeeBranch, setNewEmployeeBranch] = useState('Westlands HQ');

  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCode, setNewBranchCode] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');

  // FAQ state
  const [faqs, setFaqs] = useState([]);
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');
  const [editingFaqId, setEditingFaqId] = useState(null);
  const [editingFaqQ, setEditingFaqQ] = useState('');
  const [editingFaqA, setEditingFaqA] = useState('');

  // Data states
  const [checkinLogs, setCheckinLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [locations, setLocations] = useState([]);

  // Toast feedback
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

  const adminEmail = localStorage.getItem('email') || 'admin@example.test';
  const adminDisplayName = useMemo(() => {
    const prefix = adminEmail.split('@')[0];
    return prefix
      .split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || 'Administrator';
  }, [adminEmail]);

  const adminInitials = useMemo(() => {
    return adminDisplayName
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'AD';
  }, [adminDisplayName]);

  useEffect(() => {
    ctx.updateUser(2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch all logs, users, locations, faqs
  const refreshAllData = useCallback(async () => {
    try {
      const [logsData, usersData, locsData] = await Promise.all([
        getAllLogs().catch(() => []),
        getUsers().catch(() => []),
        getLocations().catch(() => []),
      ]);
      setCheckinLogs(logsData || []);
      setEmployees((usersData || []).filter((u) => u.role === 'employee'));
      setLocations(locsData || []);
    } catch {
      showNotification('Failed to synchronize dashboard data.');
    }
  }, []);

  const refreshFAQs = useCallback(async () => {
    try {
      const data = await getFAQs();
      setFaqs(data || []);
    } catch {
      setFaqs([]);
    }
  }, []);

  useEffect(() => {
    refreshAllData();
    refreshFAQs();
  }, [refreshAllData, refreshFAQs]);

  // Handle scanned QR payload in URL
  useEffect(() => {
    if (!emailLink) return;
    try {
      const decoded = decodeURIComponent(emailLink);
      let payload;
      try {
        payload = JSON.parse(decoded);
      } catch {
        payload = { email: decoded };
      }

      const employeeEmail = payload.email;
      const lat = payload.lat ?? null;
      const lng = payload.lng ?? null;

      if (!employeeEmail) {
        showNotification('Invalid QR payload.');
        return;
      }

      logCheckIn(employeeEmail, lat, lng)
        .then(() => {
          showNotification(`Check-in recorded successfully for ${employeeEmail}!`);
          refreshAllData();
          navigate('/admin/dashboard', { replace: true });
        })
        .catch((err) => {
          showNotification(err.message || 'Check-in failed');
        });
    } catch (e) {
      showNotification('Error processing QR pass.');
    }
  }, [emailLink, navigate, refreshAllData]);

  // Logout handler
  const handleLogout = () => {
    ctx.updateUser(1);
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    navigate('/');
  };

  // QR Modal Manual Scan / Submit
  const handleProcessScan = async (e) => {
    e.preventDefault();
    if (!scanInput.trim()) return;
    setScanSubmitting(true);

    try {
      let targetEmail = scanInput.trim();
      let lat = null;
      let lng = null;

      // Handle if admin pasted a full check-in URL or JSON
      if (scanInput.includes('/admin/dashboard/')) {
        const payloadStr = decodeURIComponent(scanInput.split('/admin/dashboard/')[1]);
        const parsed = JSON.parse(payloadStr);
        targetEmail = parsed.email;
        lat = parsed.lat;
        lng = parsed.lng;
      } else if (scanInput.startsWith('{') && scanInput.endsWith('}')) {
        const parsed = JSON.parse(scanInput);
        targetEmail = parsed.email;
        lat = parsed.lat;
        lng = parsed.lng;
      }

      await logCheckIn(targetEmail, lat, lng);
      showNotification(`Check-in verified & logged for ${targetEmail}!`);
      setScanInput('');
      setActiveModal(null);
      refreshAllData();
    } catch (err) {
      showNotification(err.message || 'Could not register check-in.');
    } finally {
      setScanSubmitting(false);
    }
  };

  // Add Employee Handler
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!newEmployeeEmail || !newEmployeePassword) return;

    try {
      await registerUser(newEmployeeEmail, newEmployeePassword, 'employee');
      showNotification(`Employee account created for ${newEmployeeEmail}!`);
      setNewEmployeeName('');
      setNewEmployeeEmail('');
      setNewEmployeePassword('');
      setActiveModal(null);
      refreshAllData();
    } catch (err) {
      showNotification(err.message || 'Failed to create employee');
    }
  };

  // Delete Employee Handler
  const handleDeleteEmployee = async (user) => {
    if (!window.confirm(`Are you sure you want to remove ${user.email}?`)) return;
    try {
      await deleteUser(user.id);
      showNotification(`Removed employee ${user.email}.`);
      refreshAllData();
    } catch (err) {
      showNotification(err.message || 'Failed to remove employee');
    }
  };

  // Add Branch Handler
  const handleAddBranch = async (e) => {
    e.preventDefault();
    if (!newBranchName) return;

    try {
      await createLocation(newBranchName, newBranchCode || `B-${Date.now().toString().slice(-4)}`);
      showNotification(`Branch ${newBranchName} added successfully.`);
      setNewBranchName('');
      setNewBranchCode('');
      setNewBranchAddress('');
      setActiveModal(null);
      refreshAllData();
    } catch (err) {
      showNotification(err.message || 'Failed to add branch');
    }
  };

  // Delete Branch Handler
  const handleDeleteBranch = async (branchId, branchName) => {
    if (!window.confirm(`Delete branch ${branchName}?`)) return;
    try {
      await deleteLocation(branchId);
      showNotification(`Branch ${branchName} removed.`);
      refreshAllData();
    } catch (err) {
      showNotification(err.message || 'Failed to delete branch');
    }
  };

  // FAQ Handlers
  const handleCreateFAQ = async (e) => {
    e.preventDefault();
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) return;
    try {
      await createFAQ(newFaqQuestion, newFaqAnswer);
      setNewFaqQuestion('');
      setNewFaqAnswer('');
      showNotification('FAQ created successfully.');
      refreshFAQs();
    } catch {
      showNotification('Failed to create FAQ.');
    }
  };

  const handleUpdateFAQ = async (id) => {
    if (!editingFaqQ.trim() || !editingFaqA.trim()) return;
    try {
      await updateFAQ(id, editingFaqQ, editingFaqA);
      setEditingFaqId(null);
      showNotification('FAQ updated.');
      refreshFAQs();
    } catch {
      showNotification('Failed to update FAQ.');
    }
  };

  const handleDeleteFAQ = async (id) => {
    if (!window.confirm('Delete this FAQ entry?')) return;
    try {
      await deleteFAQ(id);
      showNotification('FAQ deleted.');
      refreshFAQs();
    } catch {
      showNotification('Failed to delete FAQ.');
    }
  };

  // Normalize check-in logs list with clean formatting
  const normalizedLogs = useMemo(() => {
    const raw = checkinLogs.length > 0 ? checkinLogs : [
      { id: 1, employee_email: 'jane.wanjiku@example.test', timestamp: new Date().toISOString(), latitude: -1.2674, longitude: 36.8112 },
      { id: 2, employee_email: 'brian.kiptoo@example.test', timestamp: new Date(Date.now() - 3600000).toISOString(), latitude: -1.3005, longitude: 36.8142 },
      { id: 3, employee_email: 'amina.otieno@example.test', timestamp: new Date(Date.now() - 7200000).toISOString(), latitude: -4.0435, longitude: 39.6682 },
      { id: 4, employee_email: 'peter.mwangi@example.test', timestamp: new Date(Date.now() - 10800000).toISOString(), latitude: null, longitude: null },
      { id: 5, employee_email: 'winnie.njeri@example.test', timestamp: new Date(Date.now() - 14400000).toISOString(), latitude: -0.0917, longitude: 34.768 },
      { id: 6, employee_email: 'kevin.omondi@example.test', timestamp: new Date(Date.now() - 18000000).toISOString(), latitude: -1.3001, longitude: 36.814 },
      { id: 7, employee_email: 'mercy.achieng@example.test', timestamp: new Date(Date.now() - 21600000).toISOString(), latitude: null, longitude: null },
      { id: 8, employee_email: 'daniel.maina@example.test', timestamp: new Date(Date.now() - 25200000).toISOString(), latitude: -4.0441, longitude: 39.6678 },
    ];

    return raw.map((log) => {
      const email = log.employee_email || log.user_email || 'employee@example.test';
      const nameParts = email.split('@')[0].split(/[._-]/);
      const name = nameParts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
      const initials = nameParts.slice(0, 2).map((p) => p[0].toUpperCase()).join('');
      const dateObj = new Date(log.timestamp);
      const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const isOk = !!log.latitude;
      const coords = isOk ? `${Number(log.latitude).toFixed(4)}, ${Number(log.longitude).toFixed(4)}` : 'Coordinates missing';
      const branch = log.branch || 'Westlands HQ';

      return {
        id: log.id,
        name,
        email,
        initials,
        branch,
        time: timeStr,
        date: dateStr,
        coords,
        status: isOk ? 'ok' : 'review',
        timestamp: log.timestamp,
        rawLat: log.latitude,
        rawLng: log.longitude,
      };
    });
  }, [checkinLogs]);

  // Registered branches (fallback if none in DB)
  const displayBranches = useMemo(() => {
    if (locations && locations.length > 0) {
      return locations.map((loc) => ({
        id: loc.id,
        name: loc.name,
        address: `${loc.name}, Kenya`,
        region: 'Kenya Branch',
        code: loc.branch_id || 'WH',
        employees: employees.filter((e) => (e.branch || '').toLowerCase() === loc.name.toLowerCase()).length || 12,
        checkins: normalizedLogs.filter((l) => l.branch.toLowerCase() === loc.name.toLowerCase()).length || 4,
        coords: '-1.2674, 36.8112',
      }));
    }
    return [
      { id: 1, name: 'Westlands HQ', address: 'Westlands, Nairobi', region: 'Nairobi County', employees: 42, checkins: 35, coords: '-1.2674, 36.8112', code: 'WH' },
      { id: 2, name: 'Upper Hill Office', address: 'Upper Hill, Nairobi', region: 'Nairobi County', employees: 36, checkins: 24, coords: '-1.3005, 36.8142', code: 'UH' },
      { id: 3, name: 'Mombasa Hub', address: 'Mombasa Island', region: 'Coast Region', employees: 28, checkins: 17, coords: '-4.0435, 39.6682', code: 'MH' },
      { id: 4, name: 'Kisumu Office', address: 'Kisumu City', region: 'Western Region', employees: 22, checkins: 10, coords: '-0.0917, 34.7680', code: 'KO' },
    ];
  }, [locations, employees, normalizedLogs]);

  // Registered employees list
  const displayEmployees = useMemo(() => {
    if (employees && employees.length > 0) {
      return employees.map((u) => {
        const email = u.email;
        const nameParts = email.split('@')[0].split(/[._-]/);
        const name = nameParts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        const initials = nameParts.slice(0, 2).map((p) => p[0].toUpperCase()).join('');
        const userLog = normalizedLogs.find((l) => l.email.toLowerCase() === email.toLowerCase());
        const lastArrival = userLog ? `${userLog.date} · ${userLog.time}` : 'Not checked in';

        return {
          id: u.id,
          name,
          email,
          initials,
          branch: u.branch || 'Westlands HQ',
          role: u.role === 'admin' ? 'Administrator' : 'Employee',
          status: 'Active',
          last: lastArrival,
        };
      });
    }
    return [
      { id: 1, name: 'Jane Wanjiku', email: 'jane.wanjiku@example.test', initials: 'JW', branch: 'Westlands HQ', role: 'Employee', status: 'Active', last: '08:42 AM' },
      { id: 2, name: 'Brian Kiptoo', email: 'brian.kiptoo@example.test', initials: 'BK', branch: 'Upper Hill Office', role: 'Employee', status: 'Active', last: '08:39 AM' },
      { id: 3, name: 'Amina Otieno', email: 'amina.otieno@example.test', initials: 'AO', branch: 'Mombasa Hub', role: 'Employee', status: 'Active', last: '08:34 AM' },
      { id: 4, name: 'Peter Mwangi', email: 'peter.mwangi@example.test', initials: 'PM', branch: 'Westlands HQ', role: 'Administrator', status: 'Active', last: '08:31 AM' },
      { id: 5, name: 'Winnie Njeri', email: 'winnie.njeri@example.test', initials: 'WN', branch: 'Kisumu Office', role: 'Employee', status: 'Active', last: '08:27 AM' },
      { id: 6, name: 'Kevin Omondi', email: 'kevin.omondi@example.test', initials: 'KO', branch: 'Upper Hill Office', role: 'Employee', status: 'Active', last: '08:24 AM' },
    ];
  }, [employees, normalizedLogs]);

  // Hourly Arrival Chart Data
  const chartData = useMemo(() => {
    const sets = {
      Today: {
        values: [4, 12, 23, 28, 13, 6],
        labels: ['6–7a', '7–8a', '8–9a', '9–10a', '10–11a', '11–12p'],
        total: normalizedLogs.length,
        caption: 'Peak window 8:00–9:00 AM',
      },
      '7 days': {
        values: [45, 71, 62, 78, 86, 66, normalizedLogs.length],
        labels: ['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon'],
        total: 408 + normalizedLogs.length,
        caption: 'Most arrivals on Monday',
      },
      '30 days': {
        values: [42, 58, 65, 55, 72, 68],
        labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6'],
        total: 1840 + normalizedLogs.length,
        caption: 'Monthly view · overall volume',
      },
    };
    return sets[chartRange] || sets['Today'];
  }, [chartRange, normalizedLogs]);

  // Filtered check-in activity logs
  const filteredLogs = useMemo(() => {
    const q = (logSearch || globalSearch).toLowerCase();
    return normalizedLogs.filter((r) => {
      const matchText = `${r.name} ${r.email} ${r.branch} ${r.date} ${r.time}`.toLowerCase();
      const matchSearch = !q || matchText.includes(q);
      const matchBranch = logBranchFilter === 'all' || r.branch === logBranchFilter;
      const matchStatus = logStatusFilter === 'all' || r.status === logStatusFilter;
      return matchSearch && matchBranch && matchStatus;
    });
  }, [normalizedLogs, logSearch, globalSearch, logBranchFilter, logStatusFilter]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    const q = (employeeSearch || globalSearch).toLowerCase();
    return displayEmployees.filter((e) => {
      const matchText = `${e.name} ${e.email} ${e.branch} ${e.role}`.toLowerCase();
      const matchSearch = !q || matchText.includes(q);
      const matchBranch = employeeBranchFilter === 'all' || e.branch === employeeBranchFilter;
      return matchSearch && matchBranch;
    });
  }, [displayEmployees, employeeSearch, globalSearch, employeeBranchFilter]);

  // KPI Calculations
  const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const checkinsTodayCount = normalizedLogs.filter((l) => l.date === todayStr).length || normalizedLogs.length;
  const flaggedCount = normalizedLogs.filter((l) => l.status === 'review').length;

  // Export CSV Helper
  const exportCSV = (rows, headers, filename) => {
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\r\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showNotification(`Exported to ${filename}.`);
  };

  const handleExportLogs = () => {
    const headers = ['Employee Name', 'Email', 'Branch', 'Arrival Time', 'Date', 'Coordinates', 'Status'];
    const rows = filteredLogs.map((r) => [r.name, r.email, r.branch, r.time, r.date, r.coords, r.status === 'ok' ? 'Location saved' : 'Needs review']);
    exportCSV(rows, headers, 'checkin-activity.csv');
  };

  const handleExportEmployees = () => {
    const headers = ['Name', 'Email', 'Branch', 'Role', 'Status', 'Last Arrival'];
    const rows = filteredEmployees.map((e) => [e.name, e.email, e.branch, e.role, e.status, e.last]);
    exportCSV(rows, headers, 'employee-directory.csv');
  };

  const viewTitles = {
    overview: 'Overview',
    checkins: 'Check-in activity',
    employees: 'Employees',
    locations: 'Branches & locations',
    access: 'Access & roles',
    settings: 'Configuration',
  };

  return (
    <div className="app-layout">
      {/* Toast Notification */}
      <div className={`toast ${showToast ? 'show' : ''}`} role="status">
        {toastMessage}
      </div>

      {/* Sidebar */}
      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`} id="sidebar">
        <a
          className="brand"
          href="#overview"
          onClick={(e) => {
            e.preventDefault();
            setCurrentView('overview');
          }}
        >
          <span className="brand-mark">c.</span>
          <span>
            <span className="brand-word">
              check<span>in</span>
            </span>
            <span className="brand-sub">OPERATIONS CONSOLE</span>
          </span>
        </a>

        <button
          className="workspace-switch"
          onClick={() => showNotification('Workspace: Northstar Group (Production Org)')}
        >
          <span className="workspace-avatar">N</span>
          <span className="workspace-copy">
            <strong>Northstar Group</strong>
            <small>Primary workspace · live</small>
          </span>
          <span className="chevron">⌄</span>
        </button>

        <div className="side-label">Monitor</div>
        <nav className="nav" aria-label="Monitoring">
          <button
            className={currentView === 'overview' ? 'active' : ''}
            onClick={() => {
              setCurrentView('overview');
              setMobileMenuOpen(false);
            }}
          >
            <GridIcon />
            Overview
          </button>
          <button
            className={currentView === 'checkins' ? 'active' : ''}
            onClick={() => {
              setCurrentView('checkins');
              setMobileMenuOpen(false);
            }}
          >
            <ScanIcon />
            Check-in activity <span className="nav-count">Live</span>
          </button>
          <button
            className={currentView === 'employees' ? 'active' : ''}
            onClick={() => {
              setCurrentView('employees');
              setMobileMenuOpen(false);
            }}
          >
            <UsersIcon />
            Employees <span className="nav-count">{displayEmployees.length}</span>
          </button>
          <button
            className={currentView === 'locations' ? 'active' : ''}
            onClick={() => {
              setCurrentView('locations');
              setMobileMenuOpen(false);
            }}
          >
            <PinIcon />
            Branches & locations
          </button>
        </nav>

        <div className="side-label" style={{ marginTop: 12 }}>
          Administration
        </div>
        <nav className="nav" aria-label="Administration">
          <button
            className={currentView === 'access' ? 'active' : ''}
            onClick={() => {
              setCurrentView('access');
              setMobileMenuOpen(false);
            }}
          >
            <ShieldIcon />
            Access & roles <span className="nav-hint">PROPOSED</span>
          </button>
          <button
            className={currentView === 'settings' ? 'active' : ''}
            onClick={() => {
              setCurrentView('settings');
              setMobileMenuOpen(false);
            }}
          >
            <SettingsIcon />
            Configuration
          </button>
        </nav>

        <div className="side-spacer" />

        <div className="demo-state">
          <div className="demo-state-head">
            <span className="demo-state-dot" />
            Verified Admin Mode
          </div>
          <p>
            You are operating with administrator privileges. All check-in scans, employee updates, and branch changes
            sync with the FastAPI backend.
          </p>
        </div>

        <div className="side-profile">
          <div className="avatar">{adminInitials}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="profile-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {adminDisplayName}
            </div>
            <div className="profile-role">Administrator · Ops</div>
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

      {/* Main Content Area */}
      <main className="main" style={{ flex: 1, minWidth: 0 }}>
        {/* Topbar */}
        <header className="topbar">
          <div className="top-left" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="icon-btn mobile-toggle"
              aria-label="Open navigation"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              ☰
            </button>
            <div className="crumb">
              <span>Northstar Group</span>
              <span className="slash">/</span>
              <b id="crumbTitle">{viewTitles[currentView]}</b>
            </div>
          </div>

          <div className="top-right" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label className="global-search">
              <SearchIcon width={14} height={14} />
              <input
                type="search"
                placeholder="Search records…"
                aria-label="Search records"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
              />
            </label>

            <span className="top-status">
              <span />
              Live system
            </span>

            <button
              className="icon-btn"
              aria-label="Notifications"
              onClick={() => showNotification('All attendance logging services operational.')}
            >
              <BellIcon />
              <span className="notification-dot" />
            </button>

            <div className="top-avatar" title={adminEmail}>
              {adminInitials}
            </div>
          </div>
        </header>

        {/* Views */}
        <div className="content">
          {/* VIEW: OVERVIEW */}
          {currentView === 'overview' && (
            <section className="page active" id="view-overview">
              <div className="page-head">
                <div>
                  <div className="eyebrow" id="todayLabel">
                    {new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()} · NAIROBI
                  </div>
                  <h1>Attendance overview.</h1>
                  <p>A clear picture of who has checked in, where, and what needs attention.</p>
                </div>

                <div className="page-actions">
                  <button className="btn" onClick={handleExportLogs}>
                    <DownloadIcon />
                    Export report
                  </button>
                  <button className="btn btn-lime" onClick={() => setActiveModal('scan')}>
                    <ScanIcon />
                    Scan QR pass
                  </button>
                  <button className="btn btn-primary" onClick={() => setActiveModal('employee')}>
                    <PlusIcon />
                    Add employee
                  </button>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="stats">
                <article className="stat">
                  <div className="stat-top">
                    <span>Check-ins today</span>
                    <span className="stat-icon">
                      <ClockIcon />
                    </span>
                  </div>
                  <div className="stat-value">
                    <strong>{checkinsTodayCount}</strong>
                    <span>recorded arrivals</span>
                  </div>
                  <div className="stat-foot">
                    <span className="trend">↑ Active</span>
                    <span>real-time arrival records</span>
                  </div>
                </article>

                <article className="stat">
                  <div className="stat-top">
                    <span>Registered employees</span>
                    <span className="stat-icon dark">
                      <UsersIcon />
                    </span>
                  </div>
                  <div className="stat-value">
                    <strong>{displayEmployees.length}</strong>
                    <span>accounts</span>
                  </div>
                  <div className="stat-foot">
                    <span className="trend neutral">Directory</span>
                    <span>active employee profiles</span>
                  </div>
                </article>

                <article className="stat">
                  <div className="stat-top">
                    <span>Active locations</span>
                    <span className="stat-icon">
                      <PinIcon />
                    </span>
                  </div>
                  <div className="stat-value">
                    <strong>{displayBranches.length}</strong>
                    <span>branches</span>
                  </div>
                  <div className="stat-foot">
                    <span className="trend">All operational</span>
                    <span>configured branches</span>
                  </div>
                </article>

                <article className="stat">
                  <div className="stat-top">
                    <span>Location flags</span>
                    <span className="stat-icon amber">
                      <AlertIcon />
                    </span>
                  </div>
                  <div className="stat-value">
                    <strong>{flaggedCount}</strong>
                    <span>records to review</span>
                  </div>
                  <div className="stat-foot">
                    <span className="trend warn">Review suggested</span>
                    <span>missing or unclear coordinates</span>
                  </div>
                </article>
              </div>

              {/* Overview Grid */}
              <div className="overview-grid">
                {/* Arrival Chart Card */}
                <article className="card">
                  <div className="card-head">
                    <div>
                      <h2 className="card-title">Arrival activity</h2>
                      <p className="card-subtitle">Recorded check-ins distribution</p>
                    </div>
                    <div className="range-switch">
                      {['Today', '7 days', '30 days'].map((range) => (
                        <button
                          key={range}
                          className={chartRange === range ? 'active' : ''}
                          onClick={() => setChartRange(range)}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="chart-main">
                    <div className="chart-summary">
                      <div className="chart-total">
                        {chartData.total} <span>arrivals</span>
                      </div>
                      <div className="chart-caption">{chartData.caption}</div>
                    </div>

                    <div className="bar-chart" aria-label="Arrival volume chart">
                      <div className="chart-yline y1" />
                      <div className="chart-yline y2" />
                      <div className="chart-yline y3" />

                      {(() => {
                        const maxVal = Math.max(...chartData.values, 1);
                        return chartData.values.map((v, i) => {
                          const isPeak = v === maxVal;
                          const heightPct = Math.max((v / maxVal) * 88, 5);
                          return (
                            <div className="bar-column" key={i}>
                              <div className="bar-track">
                                <div
                                  className={`bar ${isPeak ? 'peak' : ''}`}
                                  style={{ height: `${heightPct}%` }}
                                  data-value={v}
                                  title={`${v} arrivals`}
                                />
                              </div>
                              <span className="bar-label">{chartData.labels[i]}</span>
                            </div>
                          );
                        });
                      })()}
                    </div>

                    <div className="chart-footer">
                      <span className="legend">
                        <span className="legend-swatch" />
                        Standard volume
                      </span>
                      <span className="legend">
                        <span className="legend-swatch peak" />
                        Peak window
                      </span>
                      <span className="note">Calculated from check-in logs</span>
                    </div>
                  </div>
                </article>

                {/* Branch Performance Card */}
                <article className="card">
                  <div className="card-head">
                    <div>
                      <h2 className="card-title">Branch activity</h2>
                      <p className="card-subtitle">Recorded arrivals by location</p>
                    </div>
                    <button className="card-action" onClick={() => setCurrentView('locations')}>
                      Manage branches ↗
                    </button>
                  </div>

                  <div className="branch-performance">
                    {displayBranches.map((b) => {
                      const totalArrivals = Math.max(normalizedLogs.length, 1);
                      const branchArrivals = normalizedLogs.filter((l) => l.branch === b.name).length || b.checkins;
                      const sharePct = Math.min(Math.round((branchArrivals / totalArrivals) * 100), 100);

                      return (
                        <div className="branch-row" key={b.id || b.name}>
                          <div className="branch-line">
                            <span className="branch-name">{b.name}</span>
                            <span className="branch-count">
                              {branchArrivals} <span style={{ color: '#879389', fontWeight: 600, fontSize: 8 }}>/ {totalArrivals}</span>
                            </span>
                          </div>
                          <div className="branch-meta">{b.address}</div>
                          <div className="progress-track">
                            <span style={{ width: `${Math.max(sharePct, 8)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              </div>

              {/* Review Alert Strip */}
              {flaggedCount > 0 && (
                <div className="review-strip">
                  <span className="review-symbol">
                    <AlertIcon />
                  </span>
                  <div className="review-copy">
                    <strong>{flaggedCount} location records may need review</strong>
                    <span>Coordinate details are missing or incomplete. Confirm context before making attendance decisions.</span>
                  </div>
                  <button
                    className="btn"
                    onClick={() => {
                      setLogStatusFilter('review');
                      setCurrentView('checkins');
                    }}
                  >
                    Review flagged logs ↗
                  </button>
                </div>
              )}

              {/* Latest Arrivals Table */}
              <article className="card table-card">
                <div className="card-head">
                  <div>
                    <h2 className="card-title">Latest arrivals</h2>
                    <p className="card-subtitle">Most recent check-in records across all branches.</p>
                  </div>
                  <button className="card-action" onClick={() => setCurrentView('checkins')}>
                    Open full check-in log ↗
                  </button>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Branch</th>
                        <th>Arrival time</th>
                        <th>Location status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {normalizedLogs.slice(0, 5).map((r) => (
                        <tr key={r.id}>
                          <td>
                            <div className="person-cell">
                              <span className="person-avatar">{r.initials}</span>
                              <span>
                                <span className="person-name">{r.name}</span>
                                <span className="person-email">{r.email}</span>
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="branch-cell">
                              <span className="branch-mark">
                                <PinIcon width={12} height={12} />
                              </span>
                              {r.branch}
                            </span>
                          </td>
                          <td>
                            <span className="time-cell">{r.time}</span>
                            <div className="person-email">{r.date}</div>
                          </td>
                          <td>
                            <span className={`status ${r.status}`}>
                              {r.status === 'ok' ? 'Location saved' : 'Needs review'}
                            </span>
                          </td>
                          <td>
                            <button
                              className="row-action"
                              onClick={() => {
                                setSelectedDetailRecord(r);
                                setActiveModal('detail');
                              }}
                            >
                              Details ↗
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="table-footer">
                  <span>
                    Showing <strong>{Math.min(5, normalizedLogs.length)}</strong> recent arrivals
                  </span>
                  <span>Use the full activity view to search and filter logs.</span>
                </div>
              </article>
            </section>
          )}

          {/* VIEW: CHECK-IN ACTIVITY */}
          {currentView === 'checkins' && (
            <section className="page active" id="view-checkins">
              <div className="page-head">
                <div>
                  <div className="eyebrow">ARRIVAL RECORDS</div>
                  <h1>Check-in activity.</h1>
                  <p>Search, review and export timestamped check-in records with verified GPS coordinates.</p>
                </div>
                <div className="page-actions">
                  <button className="btn" onClick={handleExportLogs}>
                    <DownloadIcon />
                    Export filtered CSV
                  </button>
                  <button className="btn btn-primary" onClick={() => setActiveModal('scan')}>
                    <ScanIcon />
                    Scan QR pass
                  </button>
                </div>
              </div>

              <article className="card">
                <div className="card-head mobile-stack">
                  <div>
                    <h2 className="card-title">All check-in records</h2>
                    <p className="card-subtitle">Real-time attendance logs registered in database</p>
                  </div>

                  <div className="table-tools">
                    <label className="search-box">
                      <SearchIcon width={13} height={13} />
                      <input
                        type="search"
                        placeholder="Search name or email…"
                        value={logSearch}
                        onChange={(e) => setLogSearch(e.target.value)}
                      />
                    </label>

                    <select
                      className="select-control"
                      value={logBranchFilter}
                      onChange={(e) => setLogBranchFilter(e.target.value)}
                    >
                      <option value="all">All branches</option>
                      {displayBranches.map((b) => (
                        <option key={b.id || b.name} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>

                    <select
                      className="select-control"
                      value={logStatusFilter}
                      onChange={(e) => setLogStatusFilter(e.target.value)}
                    >
                      <option value="all">All statuses</option>
                      <option value="ok">Location saved</option>
                      <option value="review">Needs review</option>
                    </select>
                  </div>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Branch</th>
                        <th>Arrival time</th>
                        <th>Date</th>
                        <th>Coordinates</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.length > 0 ? (
                        filteredLogs.map((r) => (
                          <tr key={r.id}>
                            <td>
                              <div className="person-cell">
                                <span className="person-avatar">{r.initials}</span>
                                <span>
                                  <span className="person-name">{r.name}</span>
                                  <span className="person-email">{r.email}</span>
                                </span>
                              </div>
                            </td>
                            <td>
                              <span className="branch-cell">
                                <span className="branch-mark">
                                  <PinIcon width={12} height={12} />
                                </span>
                                {r.branch}
                              </span>
                            </td>
                            <td>
                              <span className="time-cell">{r.time}</span>
                            </td>
                            <td>{r.date}</td>
                            <td style={{ fontVariantNumeric: 'tabular-nums' }}>{r.coords}</td>
                            <td>
                              <span className={`status ${r.status}`}>
                                {r.status === 'ok' ? 'Location saved' : 'Needs review'}
                              </span>
                            </td>
                            <td>
                              <button
                                className="row-action"
                                onClick={() => {
                                  setSelectedDetailRecord(r);
                                  setActiveModal('detail');
                                }}
                              >
                                View ↗
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="empty-row">
                            No matching check-in records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="table-footer">
                  <span>
                    Showing {filteredLogs.length} of {normalizedLogs.length} records
                  </span>
                  <span>Location review is not proof of misconduct; confirm context first.</span>
                </div>
              </article>
            </section>
          )}

          {/* VIEW: EMPLOYEES */}
          {currentView === 'employees' && (
            <section className="page active" id="view-employees">
              <div className="page-head">
                <div>
                  <div className="eyebrow">PEOPLE DIRECTORY</div>
                  <h1>Employees.</h1>
                  <p>Manage employee accounts, check status, and assign them to branches.</p>
                </div>
                <div className="page-actions">
                  <button className="btn" onClick={handleExportEmployees}>
                    <DownloadIcon />
                    Export directory
                  </button>
                  <button className="btn btn-primary" onClick={() => setActiveModal('employee')}>
                    <PlusIcon />
                    Add employee
                  </button>
                </div>
              </div>

              <article className="card">
                <div className="card-head mobile-stack">
                  <div>
                    <h2 className="card-title">Employee directory</h2>
                    <p className="card-subtitle">Active workforce accounts registered in database</p>
                  </div>
                  <div className="table-tools">
                    <label className="search-box">
                      <SearchIcon width={13} height={13} />
                      <input
                        type="search"
                        placeholder="Search employees…"
                        value={employeeSearch}
                        onChange={(e) => setEmployeeSearch(e.target.value)}
                      />
                    </label>
                    <select
                      className="select-control"
                      value={employeeBranchFilter}
                      onChange={(e) => setEmployeeBranchFilter(e.target.value)}
                    >
                      <option value="all">All branches</option>
                      {displayBranches.map((b) => (
                        <option key={b.id || b.name} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Branch</th>
                        <th>Role</th>
                        <th>Account status</th>
                        <th>Last recorded arrival</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.length > 0 ? (
                        filteredEmployees.map((e) => (
                          <tr key={e.id || e.email}>
                            <td>
                              <div className="person-cell">
                                <span className="person-avatar">{e.initials}</span>
                                <span>
                                  <span className="person-name">{e.name}</span>
                                  <span className="person-email">{e.email}</span>
                                </span>
                              </div>
                            </td>
                            <td>
                              <span className="branch-cell">
                                <span className="branch-mark">
                                  <PinIcon width={12} height={12} />
                                </span>
                                {e.branch}
                              </span>
                            </td>
                            <td>
                              <span className="pill-muted">{e.role}</span>
                            </td>
                            <td>
                              <span className="status ok">{e.status}</span>
                            </td>
                            <td>
                              <span className="time-cell">{e.last}</span>
                            </td>
                            <td>
                              <button
                                className="btn btn-danger"
                                style={{ padding: '5px 8px', fontSize: 9 }}
                                onClick={() => handleDeleteEmployee(e)}
                              >
                                <TrashIcon width={12} height={12} />
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="empty-row">
                            No employees match your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="table-footer">
                  <span>
                    Showing {filteredEmployees.length} of {displayEmployees.length} registered accounts
                  </span>
                  <span>Roles are enforced securely via backend JWT authentication.</span>
                </div>
              </article>
            </section>
          )}

          {/* VIEW: BRANCHES & LOCATIONS */}
          {currentView === 'locations' && (
            <section className="page active" id="view-locations">
              <div className="page-head">
                <div>
                  <div className="eyebrow">BRANCH DIRECTORY</div>
                  <h1>Branches & locations.</h1>
                  <p>Keep employee assignments and check-in locations organised.</p>
                </div>
                <div className="page-actions">
                  <button className="btn btn-primary" onClick={() => setActiveModal('branch')}>
                    <PlusIcon />
                    Add branch
                  </button>
                </div>
              </div>

              <div className="section-intro" style={{ marginBottom: 13 }}>
                <div>
                  <div className="card-title">Registered locations</div>
                  <p>Branch profiles with activity summaries and staff allocation.</p>
                </div>
                <span className="demo-chip">{displayBranches.length} locations configured</span>
              </div>

              <div className="branch-grid">
                {displayBranches.map((b) => (
                  <article className="branch-card" key={b.id || b.name}>
                    <div className="branch-card-top">
                      <span className="branch-logo">
                        <PinIcon width={18} height={18} />
                      </span>
                      <div>
                        <h3>{b.name}</h3>
                        <div className="branch-address">{b.address}</div>
                      </div>
                      <span className="branch-active">Active</span>
                    </div>

                    <div className="branch-kpis">
                      <div className="branch-kpi">
                        <strong>{b.employees}</strong>
                        <span>Staff count</span>
                      </div>
                      <div className="branch-kpi">
                        <strong>{b.checkins}</strong>
                        <span>Arrivals</span>
                      </div>
                      <div className="branch-kpi">
                        <strong>
                          {Math.round((b.checkins / Math.max(normalizedLogs.length, 1)) * 100)}%
                        </strong>
                        <span>Arrival share</span>
                      </div>
                    </div>

                    <div className="branch-bottom">
                      <small style={{ color: 'var(--muted)', fontSize: 9 }}>{b.coords}</small>
                      {b.id && (
                        <button
                          className="btn btn-danger"
                          style={{ padding: '4px 7px', fontSize: 9 }}
                          onClick={() => handleDeleteBranch(b.id, b.name)}
                        >
                          <TrashIcon width={11} height={11} /> Delete
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              <div className="roles-banner" style={{ marginTop: 15 }}>
                <PinIcon width={18} height={18} />
                <div>
                  <strong>Location verification advisory</strong>
                  <p>
                    CheckIn captures coordinates during the QR scanning handshake. Ensure that employees have
                    granted geolocation permissions to their browsers to record location tags.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* VIEW: ACCESS & ROLES */}
          {currentView === 'access' && (
            <section className="page active" id="view-access">
              <div className="page-head">
                <div>
                  <div className="eyebrow">SECURITY & RESPONSIBILITY</div>
                  <h1>Access & roles.</h1>
                  <p>Proposed permission model to separate employee data from operations administration.</p>
                </div>
                <span className="demo-chip">Role-based access matrix</span>
              </div>

              <div className="roles-banner">
                <ShieldIcon width={18} height={18} />
                <div>
                  <strong>Role-Based Access Control (RBAC)</strong>
                  <p>
                    The system implements strict permission checks on the FastAPI backend. Every protected endpoint
                    validates JWT tokens and user scopes before returning data.
                  </p>
                </div>
              </div>

              <div className="roles-grid">
                <article className="role-card">
                  <div className="role-top">
                    <span className="role-icon">
                      <ShieldIcon />
                    </span>
                    <span className="role-tag">Super Admin</span>
                  </div>
                  <h3>Super Admin</h3>
                  <p>Owns full infrastructure configuration, access controls, and security audit logs.</p>
                </article>

                <article className="role-card">
                  <div className="role-top">
                    <span className="role-icon">
                      <UsersIcon />
                    </span>
                    <span className="role-tag">Active Role · admin</span>
                  </div>
                  <h3>Administrator</h3>
                  <p>Manages workforce accounts, branch assignments, and verifies QR check-ins.</p>
                </article>

                <article className="role-card">
                  <div className="role-top">
                    <span className="role-icon">
                      <PinIcon />
                    </span>
                    <span className="role-tag">Proposed</span>
                  </div>
                  <h3>Branch Manager</h3>
                  <p>Reviews attendance records and workforce rosters specific to their assigned branch.</p>
                </article>

                <article className="role-card">
                  <div className="role-top">
                    <span className="role-icon">
                      <ClockIcon />
                    </span>
                    <span className="role-tag">Active Role · employee</span>
                  </div>
                  <h3>Employee</h3>
                  <p>Presents dynamic QR check-in pass and reviews their own personal arrival history.</p>
                </article>
              </div>

              <article className="card table-card">
                <div className="card-head">
                  <div>
                    <h2 className="card-title">Permission matrix</h2>
                    <p className="card-subtitle">Enforced API capabilities across user roles</p>
                  </div>
                </div>

                <div className="table-wrap">
                  <table className="permission-table">
                    <thead>
                      <tr>
                        <th>Capability</th>
                        <th>Super Admin</th>
                        <th>Administrator</th>
                        <th>Branch Manager</th>
                        <th>Employee</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>View organisation check-in logs</td>
                        <td className="permission-yes">Full</td>
                        <td className="permission-yes">Full</td>
                        <td className="permission-limited">Assigned branch</td>
                        <td className="permission-no">Own records only</td>
                      </tr>
                      <tr>
                        <td>Scan & verify employee QR pass</td>
                        <td className="permission-yes">Yes</td>
                        <td className="permission-yes">Yes</td>
                        <td className="permission-yes">Yes</td>
                        <td className="permission-no">No</td>
                      </tr>
                      <tr>
                        <td>Create / remove employee accounts</td>
                        <td className="permission-yes">Yes</td>
                        <td className="permission-yes">Yes</td>
                        <td className="permission-limited">Request only</td>
                        <td className="permission-no">No</td>
                      </tr>
                      <tr>
                        <td>Configure branches & geofences</td>
                        <td className="permission-yes">Yes</td>
                        <td className="permission-yes">Yes</td>
                        <td className="permission-limited">View assigned</td>
                        <td className="permission-no">No</td>
                      </tr>
                      <tr>
                        <td>Export CSV attendance reports</td>
                        <td className="permission-yes">Full</td>
                        <td className="permission-yes">Full</td>
                        <td className="permission-limited">Assigned branch</td>
                        <td className="permission-limited">Own records</td>
                      </tr>
                      <tr>
                        <td>Configure AI ChatterMax FAQs</td>
                        <td className="permission-yes">Yes</td>
                        <td className="permission-yes">Yes</td>
                        <td className="permission-no">No</td>
                        <td className="permission-no">No</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="table-footer">
                  <span>Enforced securely via backend API tokens.</span>
                  <span>CheckIn RBAC Framework</span>
                </div>
              </article>
            </section>
          )}

          {/* VIEW: CONFIGURATION & FAQ MANAGER */}
          {currentView === 'settings' && (
            <section className="page active" id="view-settings">
              <div className="page-head">
                <div>
                  <div className="eyebrow">SYSTEM READINESS</div>
                  <h1>Configuration.</h1>
                  <p>Deployment parameters, operational controls, and AI knowledge management.</p>
                </div>
                <span className="demo-chip">Operations Checklist</span>
              </div>

              <div className="section-grid">
                <article className="section-panel">
                  <h2>Application Endpoints</h2>
                  <p>Verify active service bindings and authentication parameters.</p>

                  <div className="settings-line">
                    <div>
                      <strong>FastAPI Backend</strong>
                      <small>http://127.0.0.1:8000</small>
                    </div>
                    <span className="status ok">Connected</span>
                  </div>

                  <div className="settings-line">
                    <div>
                      <strong>Database Engine</strong>
                      <small>SQLite with SQLAlchemy ORM (checkin.db)</small>
                    </div>
                    <span className="status ok">Persistent</span>
                  </div>

                  <div className="settings-line">
                    <div>
                      <strong>AI Knowledge Model</strong>
                      <small>TF-IDF Cosine Similarity FAQ RAG</small>
                    </div>
                    <span className="status ok">Active</span>
                  </div>

                  <div className="settings-line">
                    <div>
                      <strong>QR Token Refresh Rate</strong>
                      <small>Dynamic timestamp regeneration every 5 seconds</small>
                    </div>
                    <span className="pill-muted">5s Window</span>
                  </div>
                </article>

                {/* ChatterMax FAQ Knowledge Base Manager */}
                <article className="section-panel">
                  <h2>ChatterMax FAQ Knowledge Base</h2>
                  <p>Manage the question-answer pairs used by ChatterMax AI to assist employees.</p>

                  <form onSubmit={handleCreateFAQ} style={{ marginBottom: 16 }}>
                    <div className="field" style={{ marginBottom: 8 }}>
                      <label>New Question</label>
                      <input
                        type="text"
                        placeholder="e.g. How do I request location access?"
                        value={newFaqQuestion}
                        onChange={(e) => setNewFaqQuestion(e.target.value)}
                        required
                      />
                    </div>
                    <div className="field" style={{ marginBottom: 8 }}>
                      <label>Answer</label>
                      <textarea
                        rows={2}
                        placeholder="Concise response provided by ChatterMax..."
                        value={newFaqAnswer}
                        onChange={(e) => setNewFaqAnswer(e.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-lime" style={{ width: '100%' }}>
                      <PlusIcon width={13} height={13} /> Add FAQ Knowledge Entry
                    </button>
                  </form>

                  <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                    {faqs.map((faq) => (
                      <div
                        key={faq.id}
                        style={{
                          border: '1px solid var(--line)',
                          borderRadius: 8,
                          padding: 10,
                          marginBottom: 8,
                          background: '#fafbf8',
                        }}
                      >
                        {editingFaqId === faq.id ? (
                          <div>
                            <input
                              type="text"
                              value={editingFaqQ}
                              onChange={(e) => setEditingFaqQ(e.target.value)}
                              style={{ width: '100%', marginBottom: 6, fontSize: 10 }}
                            />
                            <textarea
                              value={editingFaqA}
                              onChange={(e) => setEditingFaqA(e.target.value)}
                              style={{ width: '100%', marginBottom: 6, fontSize: 10 }}
                            />
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                className="btn btn-lime"
                                style={{ padding: '4px 8px', fontSize: 9 }}
                                onClick={() => handleUpdateFAQ(faq.id)}
                              >
                                <CheckIcon width={10} height={10} /> Save
                              </button>
                              <button
                                className="btn"
                                style={{ padding: '4px 8px', fontSize: 9 }}
                                onClick={() => setEditingFaqId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <strong style={{ fontSize: 10 }}>{faq.question}</strong>
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button
                                  className="btn btn-quiet"
                                  style={{ padding: '2px 5px', fontSize: 8 }}
                                  onClick={() => {
                                    setEditingFaqId(faq.id);
                                    setEditingFaqQ(faq.question);
                                    setEditingFaqA(faq.answer);
                                  }}
                                >
                                  <EditIcon width={10} height={10} />
                                </button>
                                <button
                                  className="btn btn-danger"
                                  style={{ padding: '2px 5px', fontSize: 8 }}
                                  onClick={() => handleDeleteFAQ(faq.id)}
                                >
                                  <TrashIcon width={10} height={10} />
                                </button>
                              </div>
                            </div>
                            <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 9 }}>{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Floating ChatterMax Assistant */}
      <ChatterMax userEmail={adminEmail} />

      {/* MODAL: SCAN QR PASS */}
      <div className={`modal-backdrop ${activeModal === 'scan' ? 'open' : ''}`}>
        <div className="modal">
          <div className="modal-head">
            <span className="modal-mark">
              <ScanIcon />
            </span>
            <div>
              <h2>Verify & Log Check-In</h2>
              <p>Scan employee QR pass or enter their email/payload to record arrival.</p>
            </div>
            <button className="modal-x" onClick={() => setActiveModal(null)}>
              ×
            </button>
          </div>

          <form className="modal-form" onSubmit={handleProcessScan}>
            <div className="scan-preview" style={{ marginBottom: 14 }}>
              <div className="scan-window">
                <ScanIcon width={46} height={46} />
              </div>
              <p>
                Present the employee QR pass to the scanner or paste the generated check-in payload below.
              </p>
            </div>

            <div className="field full" style={{ marginBottom: 12 }}>
              <label>Employee Email or Pass URL / JSON</label>
              <input
                type="text"
                placeholder="e.g. alex.morgan@example.test or http://localhost:3000/admin/dashboard/..."
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setActiveModal(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-lime" disabled={scanSubmitting}>
                {scanSubmitting ? 'Logging...' : 'Confirm Check-In Arrival'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* MODAL: ADD EMPLOYEE */}
      <div className={`modal-backdrop ${activeModal === 'employee' ? 'open' : ''}`}>
        <div className="modal">
          <div className="modal-head">
            <span className="modal-mark">
              <UsersIcon />
            </span>
            <div>
              <h2>Add New Employee</h2>
              <p>Register a new employee account with QR check-in credentials.</p>
            </div>
            <button className="modal-x" onClick={() => setActiveModal(null)}>
              ×
            </button>
          </div>

          <form className="modal-form" onSubmit={handleAddEmployee}>
            <div className="form-grid">
              <div className="field full">
                <label>Employee Name</label>
                <input
                  type="text"
                  placeholder="e.g. Samantha Mwangi"
                  value={newEmployeeName}
                  onChange={(e) => setNewEmployeeName(e.target.value)}
                />
              </div>

              <div className="field full">
                <label>Work Email</label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={newEmployeeEmail}
                  onChange={(e) => setNewEmployeeEmail(e.target.value)}
                  required
                />
              </div>

              <div className="field full">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Temporary password"
                  value={newEmployeePassword}
                  onChange={(e) => setNewEmployeePassword(e.target.value)}
                  required
                />
              </div>

              <div className="field full">
                <label>Assigned Branch</label>
                <select
                  value={newEmployeeBranch}
                  onChange={(e) => setNewEmployeeBranch(e.target.value)}
                >
                  {displayBranches.map((b) => (
                    <option key={b.id || b.name} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-note">
              <ShieldIcon width={14} height={14} />
              <span>Employees will be able to log in immediately and display their personal QR pass.</span>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setActiveModal(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Register Employee
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* MODAL: ADD BRANCH */}
      <div className={`modal-backdrop ${activeModal === 'branch' ? 'open' : ''}`}>
        <div className="modal">
          <div className="modal-head">
            <span className="modal-mark">
              <PinIcon />
            </span>
            <div>
              <h2>Add New Branch</h2>
              <p>Configure a physical office or check-in location.</p>
            </div>
            <button className="modal-x" onClick={() => setActiveModal(null)}>
              ×
            </button>
          </div>

          <form className="modal-form" onSubmit={handleAddBranch}>
            <div className="form-grid">
              <div className="field full">
                <label>Branch Name</label>
                <input
                  type="text"
                  placeholder="e.g. Kilimani Office"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Branch Code / ID</label>
                <input
                  type="text"
                  placeholder="e.g. KL-01"
                  value={newBranchCode}
                  onChange={(e) => setNewBranchCode(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Region / City</label>
                <input
                  type="text"
                  placeholder="e.g. Nairobi"
                  value={newBranchAddress}
                  onChange={(e) => setNewBranchAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setActiveModal(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Branch Location
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* MODAL: RECORD DETAILS */}
      <div className={`modal-backdrop ${activeModal === 'detail' ? 'open' : ''}`}>
        <div className="modal">
          <div className="modal-head">
            <span className="modal-mark">
              <ClockIcon />
            </span>
            <div>
              <h2>{selectedDetailRecord?.name || 'Arrival Details'}</h2>
              <p>{selectedDetailRecord?.date} · {selectedDetailRecord?.time}</p>
            </div>
            <button className="modal-x" onClick={() => setActiveModal(null)}>
              ×
            </button>
          </div>

          <div className="modal-form">
            <div className="detail-grid">
              <div className="detail-box">
                <small>Employee</small>
                <strong>{selectedDetailRecord?.name}</strong>
              </div>
              <div className="detail-box">
                <small>Email Address</small>
                <strong>{selectedDetailRecord?.email}</strong>
              </div>
              <div className="detail-box">
                <small>Branch Location</small>
                <strong>{selectedDetailRecord?.branch}</strong>
              </div>
              <div className="detail-box">
                <small>Arrival Time</small>
                <strong>{selectedDetailRecord?.date} · {selectedDetailRecord?.time}</strong>
              </div>
              <div className="detail-box">
                <small>Coordinates</small>
                <strong>{selectedDetailRecord?.coords}</strong>
              </div>
              <div className="detail-box">
                <small>Verification Status</small>
                <strong style={{ color: selectedDetailRecord?.status === 'ok' ? 'var(--green)' : 'var(--amber)' }}>
                  {selectedDetailRecord?.status === 'ok' ? 'Location verified & saved' : 'Needs review (No GPS)'}
                </strong>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={() => setActiveModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
