'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, clearSession, getStoredUser, getToken, saveSession } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load restore the session and verify the token with the backend.
  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    setUser(getStoredUser());
    api.me()
      .then((u) => { setUser(u); saveSession(token, u); })
      .catch(() => { clearSession(); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.login(email, password);
    saveSession(res.token, res.user);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (data) => {
    const res = await api.register(data);
    saveSession(res.token, res.user);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    window.location.href = '/login';
  }, []);

  const refreshUser = useCallback((u) => {
    setUser(u);
    saveSession(getToken(), u);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export const isStaff = (u) => u && (u.role === 'ADMIN' || u.role === 'TECHNICIAN');
export const isAdmin = (u) => u && u.role === 'ADMIN';
