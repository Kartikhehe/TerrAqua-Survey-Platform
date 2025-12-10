const API_BASE_URL = 'https://terr-aqua-survey-platform-backend.vercel.app/api';
const AUTH_BASE_URL = 'https://terr-aqua-survey-platform-backend.vercel.app/auth';

// Helper function to get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Helper function to set auth token in localStorage
const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
};

// Helper function to get headers with auth
const getAuthHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Waypoints API
export const waypointsAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/waypoints`, {
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      throw new Error('Failed to fetch waypoints');
    }
    return response.json();
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/waypoints/${id}`, {
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch waypoint');
    return response.json();
  },

  getDefault: async () => {
    const response = await fetch(`${API_BASE_URL}/waypoints/default`);
    if (!response.ok) throw new Error('Failed to fetch default location');
    return response.json();
  },

  create: async (waypoint) => {
    const response = await fetch(`${API_BASE_URL}/waypoints`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({
        name: waypoint.name,
        latitude: parseFloat(waypoint.lat),
        longitude: parseFloat(waypoint.lng),
        notes: waypoint.notes || '',
        image_url: waypoint.image || null,
      }),
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create waypoint');
    }
    return response.json();
  },

  update: async (id, waypoint) => {
    const response = await fetch(`${API_BASE_URL}/waypoints/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({
        name: waypoint.name,
        latitude: parseFloat(waypoint.lat),
        longitude: parseFloat(waypoint.lng),
        notes: waypoint.notes || '',
        image_url: waypoint.image || null,
      }),
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update waypoint');
    }
    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/waypoints/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to delete waypoint');
    }
    return response.json();
  },
};

// Upload API
export const uploadAPI = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const headers = {};
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: headers,
    });
    if (!response.ok) throw new Error('Failed to upload image');
    return response.json();
  },
};

// Auth API
export const authAPI = {
  signup: async (email, password, fullName) => {
    const response = await fetch(`${AUTH_BASE_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
    
    // If signup successful, store token from response
    if (response.ok) {
      const data = await response.json();
      if (data.token) {
        setAuthToken(data.token);
      }
      // Return a new response with the data
      return {
        ok: true,
        json: async () => data,
        status: response.status,
      };
    }
    
    return response;
  },

  login: async (email, password) => {
    const response = await fetch(`${AUTH_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    
    // If login successful, store token from response
    if (response.ok) {
      const data = await response.json();
      if (data.token) {
        setAuthToken(data.token);
      }
      // Return a new response with the data
      return {
        ok: true,
        json: async () => data,
        status: response.status,
      };
    }
    
    return response;
  },

  logout: async () => {
    setAuthToken(null); // Clear token from localStorage
    const response = await fetch(`${AUTH_BASE_URL}/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to logout');
    return response.json();
  },

  getCurrentUser: async () => {
    return fetch(`${AUTH_BASE_URL}/me`, {
      method: 'GET',
      credentials: 'include',
      headers: getAuthHeaders(),
    });
  },
};

