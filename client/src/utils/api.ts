import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Hardcoding the production URL to ensure the APK NEVER falls back to localhost
const API_URL = 'https://dollay-shollay-app.vercel.app/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
