import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_API_BASE_URL = __DEV__
  ? 'http://192.168.1.30:5000/api/v1'
  : 'https://api.hoteloraa.work-desk.tech/api/v1';

// In-memory cache for fast access
let currentApiBaseUrl = DEFAULT_API_BASE_URL;
let currentToken = null;
let currentUser = null;
let onAuthFailureCallback = null;

// Initialize from AsyncStorage
export const initApi = async (onAuthFailure) => {
  onAuthFailureCallback = onAuthFailure;
  try {
    const savedUrl = await AsyncStorage.getItem('hoteloraa_api_base_url');
    if (savedUrl && !savedUrl.includes('/api.hoteloraa.work-desk.tech')) {
      currentApiBaseUrl = savedUrl;
    } else {
      currentApiBaseUrl = DEFAULT_API_BASE_URL;
      await AsyncStorage.removeItem('hoteloraa_api_base_url');
    }
    const token = await AsyncStorage.getItem('hoteloraa_token');
    if (token) {
      currentToken = token;
    }
    const userStr = await AsyncStorage.getItem('hoteloraa_user');
    if (userStr) {
      currentUser = JSON.parse(userStr);
    }
  } catch (e) {
    console.error('Failed to load API settings from AsyncStorage', e);
  }
};

export const getApiBaseUrl = () => currentApiBaseUrl;

export const setApiBaseUrl = async (url) => {
  let cleanUrl = url.trim().replace(/\/$/, '');
  currentApiBaseUrl = cleanUrl;
  await AsyncStorage.setItem('hoteloraa_api_base_url', cleanUrl);
};

export const resetApiBaseUrl = async () => {
  currentApiBaseUrl = DEFAULT_API_BASE_URL;
  await AsyncStorage.removeItem('hoteloraa_api_base_url');
};

export const getCurrentToken = () => currentToken;
export const getCurrentUser = () => currentUser;

export const updateCurrentUser = async (updatedUser) => {
  currentUser = updatedUser;
  await AsyncStorage.setItem('hoteloraa_user', JSON.stringify(updatedUser));
};

/**
 * Resolve tenantSlug from email address (mirrors web frontend)
 */
export const getTenantSlugFromEmail = (email) => {
  const cleanEmail = email.toLowerCase().trim();
  if (cleanEmail.includes('@hoteloraa.com')) return 'system';
  if (cleanEmail.includes('@royalpalace')) return 'royal-palace';
  if (cleanEmail.includes('@cafearoma') || cleanEmail.includes('@caferoma')) return 'cafe-aroma';
  if (cleanEmail.includes('@starlodge')) return 'star-lodge';
  if (cleanEmail.includes('@grandoak')) return 'grand-oak';
  return undefined;
};

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  const text = await response.text();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = { message: text || 'Empty response from server' };
  }

  if (!response.ok) {
    if (response.status === 401) {
      await clearSession();
      if (onAuthFailureCallback) {
        onAuthFailureCallback('Session expired. Please log in again.');
      }
      throw new Error('Session expired. Please log in again.');
    }
    if (data.errors && typeof data.errors === 'object') {
      const errorDetails = Object.entries(data.errors)
        .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
        .join(' | ');
      throw new Error(`${data.message || 'Error'}: ${errorDetails}`);
    }
    throw new Error(data.message || 'Something went wrong');
  }

  return data.data; // Server wraps responses in 'data' field
};

export const clearSession = async () => {
  currentToken = null;
  currentUser = null;
  await AsyncStorage.removeItem('hoteloraa_token');
  await AsyncStorage.removeItem('hoteloraa_user');
};

export const api = {
  get: async (path) => {
    const response = await fetch(`${currentApiBaseUrl}${path}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  post: async (path, body) => {
    const response = await fetch(`${currentApiBaseUrl}${path}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  put: async (path, body) => {
    const response = await fetch(`${currentApiBaseUrl}${path}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  patch: async (path, body) => {
    const response = await fetch(`${currentApiBaseUrl}${path}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  upload: async (path, formData) => {
    const headers = {};
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }
    const response = await fetch(`${currentApiBaseUrl}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return handleResponse(response);
  },

  delete: async (path) => {
    const response = await fetch(`${currentApiBaseUrl}${path}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  login: async (email, password) => {
    const tenantSlug = getTenantSlugFromEmail(email);
    const body = { email, password };
    if (tenantSlug) {
      body.tenantSlug = tenantSlug;
    }

    const response = await fetch(`${currentApiBaseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Server connection error. Please check API URL.');
    }

    if (!response.ok) {
      throw new Error(data.message || 'Invalid credentials');
    }

    const loginData = data.data;
    currentToken = loginData.token;
    currentUser = loginData.user;

    if (loginData.token) {
      await AsyncStorage.setItem('hoteloraa_token', loginData.token);
    }
    if (loginData.user) {
      await AsyncStorage.setItem('hoteloraa_user', JSON.stringify(loginData.user));
    }

    return loginData;
  },

  logout: async () => {
    try {
      await fetch(`${currentApiBaseUrl}/auth/logout`, {
        method: 'POST',
        headers: getHeaders(),
      });
    } catch (e) {
      console.warn('Logout request failed', e);
    } finally {
      await clearSession();
    }
  },

  forgotPassword: async (email) => {
    const response = await fetch(`${currentApiBaseUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  resetPassword: async (token, newPassword, confirmPassword) => {
    const response = await fetch(`${currentApiBaseUrl}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword, confirmPassword }),
    });
    return handleResponse(response);
  },
};

export const getAbsoluteAssetUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  const host = currentApiBaseUrl.replace('/api/v1', '');
  return `${host}${path}`;
};
