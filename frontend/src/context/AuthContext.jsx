import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('urbanpulse_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('urbanpulse_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      const storedToken = localStorage.getItem('urbanpulse_token');
      if (storedToken) {
        try {
          const res = await authApi.getMe();
          setUser(res.data);
          localStorage.setItem('urbanpulse_user', JSON.stringify(res.data));
        } catch (err) {
          console.error("Auth verification failed:", err);
          logout();
        }
      }
      setLoading(false);
    };
    verifyUser();
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('urbanpulse_token', access_token);
    localStorage.setItem('urbanpulse_user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password, role = 'CITIZEN') => {
    const res = await authApi.register({ name, email, password, role });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('urbanpulse_token', access_token);
    localStorage.setItem('urbanpulse_user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('urbanpulse_token');
    localStorage.removeItem('urbanpulse_user');
    setToken(null);
    setUser(null);
  };

  const isAuthority = user?.role === 'AUTHORITY';
  const isCitizen = user?.role === 'CITIZEN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!token,
        isAuthority,
        isCitizen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
