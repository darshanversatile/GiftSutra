import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  axios.defaults.withCredentials = true;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/profile`);
        setUser(data);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`, { email, password });
    setUser(data);
  };

  const register = async (name, email, password) => {
    const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/register`, { name, email, password });
    setUser(data);
  };

  const logout = async () => {
    await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/logout`);
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

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, forgotPassword, resetPassword, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
