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

// ---- USERS ----
export const getUsers = async () => {
  const res = await fetch(`${BASE_URL}/api/users`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
};

export const deleteUser = async (id) => {
  const res = await fetch(`${BASE_URL}/api/users/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete user');
  return res.json();
};

// ---- LOCATIONS ----
export const getLocations = async () => {
  const res = await fetch(`${BASE_URL}/api/locations`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch locations');
  return res.json();
};

export const createLocation = async (name, branch_id) => {
  const res = await fetch(`${BASE_URL}/api/locations`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name, branch_id }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to create location');
  }
  return res.json();
};

export const deleteLocation = async (id) => {
  const res = await fetch(`${BASE_URL}/api/locations/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete location');
  return res.json();
};

// ---- CHATBOT ----
export const chatWithBot = async (message, session_id, user_email = null) => {
  const res = await fetch(`${BASE_URL}/chat/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, session_id, user_email }),
  });
  if (!res.ok) throw new Error('Failed to send message to Chatbot');
  return res.json();
};
