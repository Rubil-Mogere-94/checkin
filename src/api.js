const BASE_URL = 'http://127.0.0.1:8000';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// ---- AUTH ----
export const registerUser = async (email, password, role = 'employee') => {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Registration failed');
  }
  return res.json();
};

export const loginUser = async (email, password) => {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Login failed');
  }
  return res.json(); // { access_token, token_type, role, email }
};

// ---- CHECK-IN ----
export const logCheckIn = async (employee_email, latitude = null, longitude = null) => {
  const res = await fetch(`${BASE_URL}/api/checkin/log`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ employee_email, latitude, longitude }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Check-in failed');
  }
  return res.json();
};

export const getAllLogs = async () => {
  const res = await fetch(`${BASE_URL}/api/checkin/logs`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch logs');
  return res.json();
};

export const getEmployeeLogs = async (email) => {
  const res = await fetch(`${BASE_URL}/api/checkin/logs/${encodeURIComponent(email)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch employee logs');
  return res.json();
};
