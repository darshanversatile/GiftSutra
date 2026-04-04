import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  axios.defaults.withCredentials = true;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        setToken(storedToken);

        if (storedToken) {
          const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/profile`);
          setUser(data);
        } else {
          setUser(null);
        }
      } catch (error) {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (email) => {
    const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`, { email });
    return data;
  };

  const register = async (name, email) => {
    const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/register`, { name, email });
    return data;
  };

  const verifyOtp = async (email, otp) => {
    const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/verify-otp`, { email, otp });
    if (data.token) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
    }
    setUser(data);
    return data;
  };

  const logout = async () => {
    await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/logout`);
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const forgotPassword = async (email) => {
    const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/forgot-password`, { email });
    return data;
  };

  const resetPassword = async (token, password) => {
    const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/reset-password/${token}`, { password });
    return data;
  };

  const isAuthenticated = Boolean(token || user);

  return (
    <AuthContext.Provider value={{ user, setUser, token, isAuthenticated, login, register, verifyOtp, logout, forgotPassword, resetPassword, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
