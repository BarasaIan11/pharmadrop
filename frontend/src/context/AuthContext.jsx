import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user_info');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const saveUser = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem('user_info', JSON.stringify(userData));
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const res = await authAPI.getMe();
          saveUser(res.data);
        } catch (err) {
          console.error('Session expired or invalid:', err);
          logout();
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (username, password) => {
    const res = await authAPI.login(username, password);
    const { access, refresh, user: userData } = res.data;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    saveUser(userData);
    return userData;
  };

  const register = async (formData) => {
    await authAPI.register(formData);
    return login(formData.username, formData.password);
  };

  /**
   * Quick demo login. Maps a role key to a seeded demo account.
   * Each demo account has a different pharmacy tenant for multi-tenant demonstration.
   */
  const quickLogin = async (roleName) => {
    const demoAccounts = {
      CUSTOMER:       { username: 'customer1',   label: 'Esther Wanjiku (Customer)' },
      PHARMACY_STAFF: { username: 'staff1',      label: 'Pharmacy Staff @ Nairobi Central' },
      DISPATCHER:     { username: 'dispatcher1', label: 'Dispatcher @ Nairobi Central' },
      RIDER:          { username: 'rider1',      label: 'David Kamau (Rider)' },
    };
    const account = demoAccounts[roleName] || demoAccounts.CUSTOMER;
    return login(account.username, 'password123');
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    setUser(null);
  };

  /** Derived helpers for easy consumption in components */
  const isCustomer       = user?.role === 'CUSTOMER';
  const isPharmacyStaff  = user?.role === 'PHARMACY_STAFF';
  const isDispatcher     = user?.role === 'DISPATCHER';
  const isRider          = user?.role === 'RIDER';
  const pharmacyName     = user?.pharmacy_detail?.name || null;
  const pharmacyCode     = user?.pharmacy_detail?.code || null;

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, quickLogin, logout, saveUser,
      isCustomer, isPharmacyStaff, isDispatcher, isRider,
      pharmacyName, pharmacyCode,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
