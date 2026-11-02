import React, { createContext, useContext, useState, useEffect } from 'react';
import ApiClient from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(ApiClient.getToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await ApiClient.getMe();
          setUser(res.user);
        } catch {
          // Token invalid or expired
          ApiClient.setToken(null);
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const data = await ApiClient.login(email, password);
    ApiClient.setToken(data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await ApiClient.logout();
    } catch {
      // Ignore
    }
    ApiClient.setToken(null);
    setToken(null);
    setUser(null);
  };

  const quickSwitch = async (roleName) => {
    const credentials = {
      'Administrator': { email: 'admin@sentinel.local', pass: 'Admin@12345' },
      'Manager': { email: 'manager@sentinel.local', pass: 'Manager@12345' },
      'Employee': { email: 'employee@sentinel.local', pass: 'Employee@12345' }
    };

    const target = credentials[roleName];
    if (target) {
      return await login(target.email, target.pass);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, quickSwitch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
