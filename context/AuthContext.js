'use client';
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authAPI } from '@/lib/api';

const AuthContext = createContext(null);
const INACTIVITY_TIMEOUT = 15 * 60 * 1000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimer = useRef(null);

  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
  }, []);

  const logout = useCallback(() => {
    clearInactivityTimer();
    localStorage.removeItem('token');
    localStorage.removeItem('em_welcome_seen');
    setToken(null);
    setUser(null);
  }, [clearInactivityTimer]);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) {
      setLoading(false);
      return;
    }
    setToken(savedToken);
    authAPI.getMe()
      .then((userData) => setUser(userData.data))
      .catch(() => {
        localStorage.removeItem('token');
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!token) {
      clearInactivityTimer();
      return;
    }

    const resetTimer = () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('em_welcome_seen');
        setToken(null);
        setUser(null);
        window.location.href = '/auth/login';
      }, INACTIVITY_TIMEOUT);
    };

    resetTimer();

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    return () => {
      clearTimeout(inactivityTimer.current);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [token, clearInactivityTimer]);

  const login = useCallback(async (email, password) => {
    const responseBody = await authAPI.login({ email, password });
    const { token: newToken, user: newUser } = responseBody.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
    return responseBody;
  }, []);

  const register = useCallback(async (data) => {
    const responseBody = await authAPI.register(data);
    const { token: newToken, user: newUser } = responseBody.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
    return responseBody;
  }, []);

  const updateUser = useCallback((data) => {
    setUser((prev) => ({ ...prev, ...data }));
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
