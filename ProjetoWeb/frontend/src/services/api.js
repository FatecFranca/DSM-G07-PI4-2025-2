const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function getAuthToken() {
  return localStorage.getItem('token');
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    // Network errors (Failed to fetch, connection refused, etc.)
    if (error.message === 'Failed to fetch' || 
        error.name === 'TypeError' || 
        error.message.includes('NetworkError') ||
        error.message.includes('ERR_CONNECTION_REFUSED') ||
        error.message.includes('ERR_NETWORK')) {
      throw new Error(`Não foi possível conectar ao servidor. Verifique se o backend está rodando em ${API_BASE_URL}`);
    }
    throw error;
  }
}

// Test backend connection
export async function testConnection() {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Auth endpoints
async function register(email, password, fullName) {
  const data = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, fullName }),
  });
  if (data.token) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.user.id);
  }
  return data;
}

async function login(email, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data.token) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.user.id);
  }
  return data;
}

async function getMe() {
  return request('/auth/me');
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
}

// Devices endpoints
async function getDevices() {
  return request('/devices');
}

async function getDevice(id) {
  return request(`/devices/${id}`);
}

async function createDevice(device) {
  return request('/devices', {
    method: 'POST',
    body: JSON.stringify(device),
  });
}

async function updateDevice(id, device) {
  return request(`/devices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(device),
  });
}

async function deleteDevice(id) {
  return request(`/devices/${id}`, {
    method: 'DELETE',
  });
}

// Bills endpoints
async function getBills() {
  return request('/bills');
}

async function getBill(id) {
  return request(`/bills/${id}`);
}

async function createBill(bill) {
  return request('/bills', {
    method: 'POST',
    body: JSON.stringify(bill),
  });
}

async function updateBill(id, bill) {
  return request(`/bills/${id}`, {
    method: 'PUT',
    body: JSON.stringify(bill),
  });
}

async function deleteBill(id) {
  return request(`/bills/${id}`, {
    method: 'DELETE',
  });
}

// Dashboard endpoints
async function getDashboard() {
  return request('/dashboard');
}

async function getDashboardAnalytics() {
  return request('/dashboard/analytics');
}

export const api = {
  register,
  login,
  getMe,
  logout,
  getDevices,
  getDevice,
  createDevice,
  updateDevice,
  deleteDevice,
  getBills,
  getBill,
  createBill,
  updateBill,
  deleteBill,
  getDashboard,
  getDashboardAnalytics,
  testConnection,
};

