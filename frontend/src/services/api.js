import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer Token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Unauthorized / Token Expiration
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token on auth failure
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_info');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username, password) => API.post('/auth/login/', { username, password }),
  register: (data) => API.post('/auth/register/', data),
  getMe: () => API.get('/auth/me/'),
};

export const deliveryAPI = {
  getDeliveries: (params) => API.get('/deliveries/', { params }),
  getDeliveryById: (id) => API.get(`/deliveries/${id}/`),
  createDelivery: (data) => API.post('/deliveries/', data),
  assignRider: (id, riderId) => API.post(`/deliveries/${id}/assign/`, { rider_id: riderId }),
  updateDeliveryStatus: (id, status) => API.post(`/deliveries/${id}/update-status/`, { status }),
  updateStatus: (id, status) => API.post(`/deliveries/${id}/update-status/`, { status }), // alias
  confirmDelivery: (id, code) => API.post(`/deliveries/${id}/confirm-delivery/`, { code }),
  cancelDelivery: (id, reason) => API.post(`/deliveries/${id}/cancel/`, { reason }),
  getAvailableRiders: () => API.get('/riders/available/'),
  getPharmacies: () => API.get('/pharmacies/'),
};

export default API;
