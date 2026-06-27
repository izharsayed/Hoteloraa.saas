const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
const API_ORIGIN = API_BASE_URL.replace(/\/api\/v\d+$/, '');

export const assetUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
};

/**
 * Resolve the tenantSlug from an email address.
 * Maps known email domains to their tenant slugs.
 */
export const getTenantSlugFromEmail = (email) => {
  const cleanEmail = email.toLowerCase().trim();

  // Super admin — system tenant
  if (cleanEmail.includes('@hoteloraa.com')) return 'system';

  // Royal Palace Hotel
  if (cleanEmail.includes('@royalpalace')) return 'royal-palace';

  // Cafe Aroma — note: the DB email uses caferoma.com (no 'a')
  if (cleanEmail.includes('@cafearoma') || cleanEmail.includes('@caferoma')) return 'cafe-aroma';

  // Star Lodge
  if (cleanEmail.includes('@starlodge')) return 'star-lodge';

  // Grand Oak Resort
  if (cleanEmail.includes('@grandoak')) return 'grand-oak';

  // Default fallback — undefined so backend can resolve it by email
  return undefined;
};

const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
  };
};

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    if (data.errors && typeof data.errors === 'object') {
      const errorDetails = Object.entries(data.errors)
        .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
        .join(' | ');
      throw new Error(`${data.message}: ${errorDetails}`);
    }
    throw new Error(data.message || 'Something went wrong');
  }
  return data.data; // The server wraps response data in a 'data' field
};

export const api = {
  get: async (path) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  post: async (path, body) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  upload: async (path, formData) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    return handleResponse(response);
  },

  put: async (path, body) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PUT',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  patch: async (path, body) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PATCH',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  delete: async (path) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  login: async (email, password) => {
    const tenantSlug = getTenantSlugFromEmail(email);
    const body = { email, password };
    if (tenantSlug) {
      body.tenantSlug = tenantSlug;
    }
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Invalid credentials');
    }
    
    localStorage.setItem('user', JSON.stringify(data.data.user));
    return data.data;
  },

  logout: async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      localStorage.removeItem('user');
    }
  },

  clearLocalSession: () => {
    localStorage.removeItem('user');
  },

  forgotPassword: async (email) => {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to request password reset');
    }
    return data.data;
  },

  resetPassword: async (token, newPassword, confirmPassword) => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token, newPassword, confirmPassword }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to reset password');
    }
    return data.data;
  },
};

export default api;

