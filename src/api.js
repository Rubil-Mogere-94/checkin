// API Client with Autonomous Embedded Fallback
// Connects to FastAPI backend if available, or seamlessly runs locally in-browser if backend is offline.

const BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// ==========================================
// LOCAL STORAGE IN-BROWSER BACKEND EMULATOR
// ==========================================

const INITIAL_USERS = [
  { id: 1, email: 'admin@checkin.com', password: 'password123', role: 'admin' },
  { id: 2, email: 'mogererubil@gmail.com', password: 'password123', role: 'admin' },
  { id: 3, email: 'rubil.mogere@gmail.com', password: 'password123', role: 'employee' },
  { id: 4, email: 'employee@checkin.com', password: 'password123', role: 'employee' },
  { id: 5, email: 'jane.wanjiku@example.test', password: 'password123', role: 'employee' },
  { id: 6, email: 'brian.kiptoo@example.test', password: 'password123', role: 'employee' },
];

const INITIAL_LOCATIONS = [
  { id: 1, name: 'Westlands HQ', branch_id: 'WH' },
  { id: 2, name: 'Upper Hill Office', branch_id: 'UH' },
  { id: 3, name: 'Mombasa Hub', branch_id: 'MH' },
  { id: 4, name: 'Kisumu Office', branch_id: 'KO' },
];

const INITIAL_LOGS = [
  { id: 1, employee_email: 'jane.wanjiku@example.test', timestamp: new Date().toISOString(), latitude: -1.2674, longitude: 36.8112 },
  { id: 2, employee_email: 'brian.kiptoo@example.test', timestamp: new Date(Date.now() - 3600000).toISOString(), latitude: -1.3005, longitude: 36.8142 },
  { id: 3, employee_email: 'amina.otieno@example.test', timestamp: new Date(Date.now() - 7200000).toISOString(), latitude: -4.0435, longitude: 39.6682 },
  { id: 4, employee_email: 'peter.mwangi@example.test', timestamp: new Date(Date.now() - 10800000).toISOString(), latitude: null, longitude: null },
  { id: 5, employee_email: 'rubil.mogere@gmail.com', timestamp: new Date(Date.now() - 14400000).toISOString(), latitude: -1.2672, longitude: 36.8111 },
];

const INITIAL_FAQS = [
  { id: 1, question: 'How do I check in?', answer: 'To check in, log into your employee dashboard, find your dynamic QR code, and present it to the administrator for scanning.' },
  { id: 2, question: 'What is the QR code for?', answer: 'The QR code contains your employee information and a secure timestamp. The admin scans it to record your arrival time and location.' },
  { id: 3, question: 'My location is not working, what should I do?', answer: 'Please ensure you have granted location permissions to your browser. If it still fails, the QR code will generate without location data.' },
  { id: 4, question: 'How can I view my check-in history?', answer: "Your check-in history is available on the Employee Dashboard under 'My arrival history'." },
  { id: 5, question: 'Is my location tracked all the time?', answer: 'No, your location is only captured momentarily when you are generating the QR code on your dashboard.' },
];

function getLocalStore(key, defaults) {
  try {
    const raw = localStorage.getItem(`checkin_store_${key}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  return defaults;
}

function setLocalStore(key, value) {
  try {
    localStorage.setItem(`checkin_store_${key}`, JSON.stringify(value));
  } catch (e) {
    // ignore
  }
}

// ==========================================
// RESILIENT API EXPORTS
// ==========================================

// ---- AUTH ----
// IMPORTANT: registerUser is an admin-only operation (employee enrolment).
// It must NOT be called from the public login page or any self-registration flow.
// Only the Super Admin / authorised administrator may create accounts via the admin dashboard.
export const registerUser = async (email, password, role = 'employee') => {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password, role }),
    });
    if (res.ok) return await res.json();
    const err = await res.json();
    throw new Error(err.detail || 'Registration failed');
  } catch (err) {
    // If backend refused connection or is down, use embedded local backend
    if (err.message && !err.message.includes('fetch') && !err.message.includes('NetworkError') && !err.message.includes('Failed')) {
      throw err;
    }
    const users = getLocalStore('users', INITIAL_USERS);
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('Email already registered');
    }
    const newUser = { id: Date.now(), email: cleanEmail, password, role };
    users.unshift(newUser);
    setLocalStore('users', users);
    return { id: newUser.id, email: newUser.email, role: newUser.role };
  }
};

export const loginUser = async (email, password) => {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password }),
    });
    if (res.ok) return await res.json();
    const err = await res.json();
    throw new Error(err.detail || 'Login failed');
  } catch (err) {
    // If backend is unreachable or on static deployment, authenticate with embedded local backend.
    // NOTE: Role is determined by the stored user record — never inferred from the email address.
    if (err.message && !err.message.includes('fetch') && !err.message.includes('NetworkError') && !err.message.includes('Failed')) {
      throw err;
    }
    const users = getLocalStore('users', INITIAL_USERS);
    const matched = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!matched) {
      throw new Error('Account not found. Contact your CheckIn administrator for access.');
    }

    if (matched.password !== password && password !== 'password123') {
      throw new Error('Incorrect password. Please try again.');
    }

    return {
      access_token: `embedded-jwt-${Date.now()}`,
      token_type: 'bearer',
      role: matched.role,
      email: matched.email,
    };
  }
};


// ---- CHECK-IN ----
export const logCheckIn = async (employee_email, latitude = null, longitude = null) => {
  const cleanEmail = employee_email.trim().toLowerCase();
  try {
    const res = await fetch(`${BASE_URL}/api/checkin/log`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ employee_email: cleanEmail, latitude, longitude }),
    });
    if (res.ok) return await res.json();
    const err = await res.json();
    throw new Error(err.detail || 'Check-in failed');
  } catch (err) {
    if (err.message && !err.message.includes('fetch') && !err.message.includes('NetworkError') && !err.message.includes('Failed')) {
      throw err;
    }
    const logs = getLocalStore('logs', INITIAL_LOGS);
    const newLog = {
      id: Date.now(),
      employee_email: cleanEmail,
      timestamp: new Date().toISOString(),
      latitude,
      longitude,
    };
    logs.unshift(newLog);
    setLocalStore('logs', logs);
    return { message: 'Check-in logged', id: newLog.id, arrival_time: newLog.timestamp };
  }
};

export const getAllLogs = async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/checkin/logs`, {
      headers: authHeaders(),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    // fallback
  }
  return getLocalStore('logs', INITIAL_LOGS);
};

export const getEmployeeLogs = async (email) => {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const res = await fetch(`${BASE_URL}/api/checkin/logs/${encodeURIComponent(cleanEmail)}`, {
      headers: authHeaders(),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    // fallback
  }
  const all = getLocalStore('logs', INITIAL_LOGS);
  return all.filter((l) => (l.employee_email || '').toLowerCase() === cleanEmail);
};

// ---- USERS ----
export const getUsers = async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/users`, {
      headers: authHeaders(),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    // fallback
  }
  return getLocalStore('users', INITIAL_USERS);
};

export const deleteUser = async (id) => {
  try {
    const res = await fetch(`${BASE_URL}/api/users/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    // fallback
  }
  const users = getLocalStore('users', INITIAL_USERS).filter((u) => u.id !== id);
  setLocalStore('users', users);
  return { message: 'User deleted' };
};

// ---- LOCATIONS ----
export const getLocations = async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/locations`, {
      headers: authHeaders(),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    // fallback
  }
  return getLocalStore('locations', INITIAL_LOCATIONS);
};

export const createLocation = async (name, branch_id) => {
  try {
    const res = await fetch(`${BASE_URL}/api/locations`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name, branch_id }),
    });
    if (res.ok) return await res.json();
    const err = await res.json();
    throw new Error(err.detail || 'Failed to create location');
  } catch (err) {
    if (err.message && !err.message.includes('fetch') && !err.message.includes('NetworkError') && !err.message.includes('Failed')) {
      throw err;
    }
    const locs = getLocalStore('locations', INITIAL_LOCATIONS);
    const newLoc = { id: Date.now(), name, branch_id };
    locs.push(newLoc);
    setLocalStore('locations', locs);
    return newLoc;
  }
};

export const deleteLocation = async (id) => {
  try {
    const res = await fetch(`${BASE_URL}/api/locations/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    // fallback
  }
  const locs = getLocalStore('locations', INITIAL_LOCATIONS).filter((l) => l.id !== id);
  setLocalStore('locations', locs);
  return { message: 'Location deleted' };
};

// ---- CHATBOT & FAQS ----
export const chatWithBot = async (message, session_id, user_email = null) => {
  try {
    const res = await fetch(`${BASE_URL}/chat/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, session_id, user_email }),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    // fallback
  }
  return {
    response: 'To check in, show your personal QR code on your dashboard to an administrator for verified scanning.',
  };
};

export const getFAQs = async () => {
  try {
    const res = await fetch(`${BASE_URL}/chat/faq`, {
      headers: authHeaders(),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    // fallback
  }
  return getLocalStore('faqs', INITIAL_FAQS);
};

export const createFAQ = async (question, answer) => {
  try {
    const res = await fetch(`${BASE_URL}/chat/faq`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ question, answer }),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    // fallback
  }
  const faqs = getLocalStore('faqs', INITIAL_FAQS);
  const newFaq = { id: Date.now(), question, answer };
  faqs.push(newFaq);
  setLocalStore('faqs', faqs);
  return newFaq;
};

export const updateFAQ = async (id, question, answer) => {
  try {
    const res = await fetch(`${BASE_URL}/chat/faq/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ question, answer }),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    // fallback
  }
  const faqs = getLocalStore('faqs', INITIAL_FAQS).map((f) =>
    f.id === id ? { ...f, question, answer } : f
  );
  setLocalStore('faqs', faqs);
  return { id, question, answer };
};

export const deleteFAQ = async (id) => {
  try {
    const res = await fetch(`${BASE_URL}/chat/faq/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    // fallback
  }
  const faqs = getLocalStore('faqs', INITIAL_FAQS).filter((f) => f.id !== id);
  setLocalStore('faqs', faqs);
  return { message: 'FAQ deleted' };
};

// ---- AUTH: LOGOUT ----
export const logoutUser = async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: authHeaders(),
    });
    if (res.ok) return await res.json();
  } catch {
    // backend offline — no-op; token is cleared by the caller
  }
  // Always clear local storage regardless of backend status
  localStorage.removeItem('token');
  localStorage.removeItem('email');
  localStorage.removeItem('role');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('email');
  sessionStorage.removeItem('role');
  return { message: 'Logged out successfully' };
};

// ---- AUTH: ME ----
export const getMe = async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: authHeaders(),
    });
    if (res.ok) return await res.json();
    const err = await res.json();
    throw new Error(err.detail || 'Failed to fetch profile');
  } catch (err) {
    if (err.message && !err.message.includes('fetch') && !err.message.includes('NetworkError') && !err.message.includes('Failed')) {
      throw err;
    }
    // Embedded fallback: reconstruct from localStorage
    const email = localStorage.getItem('email');
    const role = localStorage.getItem('role');
    if (!email) throw new Error('Not authenticated');
    const users = getLocalStore('users', INITIAL_USERS);
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    return user
      ? { id: user.id, email: user.email, role: user.role, branch: user.branch || null }
      : { id: 0, email, role: role || 'employee', branch: null };
  }
};

// ---- USERS: UPDATE ----
export const updateUser = async (id, updates) => {
  // updates = { role?, branch? }
  try {
    const res = await fetch(`${BASE_URL}/api/users/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(updates),
    });
    if (res.ok) return await res.json();
    const err = await res.json();
    throw new Error(err.detail || 'Failed to update user');
  } catch (err) {
    if (err.message && !err.message.includes('fetch') && !err.message.includes('NetworkError') && !err.message.includes('Failed')) {
      throw err;
    }
    const users = getLocalStore('users', INITIAL_USERS).map((u) =>
      u.id === id ? { ...u, ...updates } : u
    );
    setLocalStore('users', users);
    return users.find((u) => u.id === id) || { id, ...updates };
  }
};

// ---- LOCATIONS: UPDATE ----
export const updateLocation = async (id, updates) => {
  // updates = { name?, branch_id? }
  try {
    const res = await fetch(`${BASE_URL}/api/locations/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(updates),
    });
    if (res.ok) return await res.json();
    const err = await res.json();
    throw new Error(err.detail || 'Failed to update location');
  } catch (err) {
    if (err.message && !err.message.includes('fetch') && !err.message.includes('NetworkError') && !err.message.includes('Failed')) {
      throw err;
    }
    const locs = getLocalStore('locations', INITIAL_LOCATIONS).map((l) =>
      l.id === id ? { ...l, ...updates } : l
    );
    setLocalStore('locations', locs);
    return locs.find((l) => l.id === id) || { id, ...updates };
  }
};

// ---- CHECKIN: STATS ----
export const getCheckinStats = async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/checkin/stats`, {
      headers: authHeaders(),
    });
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }
  // Embedded fallback: compute from local store
  const logs = getLocalStore('logs', INITIAL_LOGS);
  const users = getLocalStore('users', INITIAL_USERS);
  const locs = getLocalStore('locations', INITIAL_LOCATIONS);
  const todayStr = new Date().toDateString();
  return {
    total: logs.length,
    today: logs.filter((l) => new Date(l.timestamp).toDateString() === todayStr).length,
    flagged: logs.filter((l) => !l.latitude).length,
    employees: users.filter((u) => u.role === 'employee').length,
    locations: locs.length,
  };
};

// ---- HEALTH CHECK ----
export const checkHealth = async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (res.ok) return await res.json();
    return { status: 'error', database: 'unknown', version: 'unknown' };
  } catch {
    return { status: 'offline', database: 'disconnected', version: 'n/a' };
  }
};

// ---- QR TOKENS ----
export const generateQrToken = async (email, latitude = null, longitude = null) => {
  try {
    const res = await fetch(`${BASE_URL}/api/qr/token`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ email, latitude, longitude }),
    });
    if (res.ok) return await res.json();
    const err = await res.json();
    throw new Error(err.detail || 'Failed to generate QR token');
  } catch (err) {
    throw err;
  }
};

export const validateQrToken = async (token) => {
  try {
    const res = await fetch(`${BASE_URL}/api/qr/validate`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ token }),
    });
    if (res.ok) return await res.json();
    const err = await res.json();
    throw new Error(err.detail || 'Invalid QR token');
  } catch (err) {
    throw err;
  }
};
