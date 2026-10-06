'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

export type UserRole = 'USER' | 'HOST' | 'ADMIN';

export interface UserProfile {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  role: UserRole;
  phoneVerified: boolean;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isCoHost: boolean;
  login: (credentials: { identifier: string; password: string }, redirectUrl?: string | null) => Promise<void>;
  register: (data: { name: string; phone: string; password: string; email?: string }) => Promise<UserProfile>;
  logout: () => void;
  verifyOtp: (otp: string) => Promise<boolean>;
  sendOtp: () => Promise<{ message: string; devOtp?: string } | void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCoHost, setIsCoHost] = useState<boolean>(false);
  const router = useRouter();

  // Load user session on initial load
  useEffect(() => {
    async function loadUserSession() {
      const storedToken = localStorage.getItem('fairbnb_token');
      if (storedToken) {
        setToken(storedToken);
        const storedCoHost = localStorage.getItem('fairbnb_is_cohost');
        if (storedCoHost === 'true') setIsCoHost(true);
        try {
          const profile = await api.get<UserProfile>('/auth/me');
          setUser(profile);
          localStorage.setItem('fairbnb_user', JSON.stringify(profile));
        } catch {
          // Stale, expired, or invalid token: clean up session silently without triggering Next.js dev overlay
          localStorage.removeItem('fairbnb_token');
          localStorage.removeItem('fairbnb_user');
          localStorage.removeItem('fairbnb_is_cohost');
          setToken(null);
          setUser(null);
          setIsCoHost(false);
        }
      }
      setIsLoading(false);
    }

    loadUserSession();
  }, []);

  const login = async (
    { identifier, password }: { identifier: string; password: string },
    redirectUrl?: string | null,
  ) => {
    // Backend expects { email, password }
    const payload = {
      email: identifier.trim(),
      password,
    };

    const res = await api.post<{ accessToken?: string; access_token?: string; user: UserProfile; isCoHost?: boolean }>('/auth/login', payload);
    const token = res.accessToken || res.access_token;
    if (!token) throw new Error('No access token returned');
    const coHost = res.isCoHost === true;
    setToken(token);
    setUser(res.user);
    setIsCoHost(coHost);
    localStorage.setItem('fairbnb_token', token);
    localStorage.setItem('fairbnb_user', JSON.stringify(res.user));
    localStorage.setItem('fairbnb_is_cohost', coHost ? 'true' : 'false');

    if (redirectUrl) {
      if (res.user.role === 'ADMIN' && !redirectUrl.startsWith('/admin')) {
        router.push('/admin/dashboard');
        return;
      }
      if (res.user.role === 'HOST' && !redirectUrl.startsWith('/host') && !redirectUrl.startsWith('/co-host')) {
        if (coHost) {
          router.push('/co-host');
        } else {
          router.push('/host/today');
        }
        return;
      }
      router.push(redirectUrl);
      return;
    }

    // Default redirect based on role
    if (res.user.role === 'ADMIN') {
      router.push('/admin/dashboard');
    } else if (res.user.role === 'HOST') {
      if (coHost) {
        router.push('/co-host');
      } else {
        router.push('/host/today');
      }
    } else {
      router.push('/guest/trips');
    }
  };

  const register = async (data: { name: string; phone: string; password: string; email?: string }) => {
    const res = await api.post<UserProfile>('/auth/register', data);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('fairbnb_token');
    localStorage.removeItem('fairbnb_user');
    localStorage.removeItem('fairbnb_is_cohost');
    setToken(null);
    setUser(null);
    setIsCoHost(false);
    router.push('/login');
  };

  const verifyOtp = async (otp: string) => {
    const res = await api.post<{ message: string }>('/auth/verify-otp', { otp });
    if (res && user) {
      const updatedUser = { ...user, phoneVerified: true };
      setUser(updatedUser);
      localStorage.setItem('fairbnb_user', JSON.stringify(updatedUser));
      return true;
    }
    return false;
  };

  const sendOtp = async () => {
    return await api.post<{ message: string; devOtp?: string }>('/auth/send-otp');
  };

  const refreshProfile = async () => {
    try {
      const profile = await api.get<UserProfile>('/auth/me');
      setUser(profile);
      localStorage.setItem('fairbnb_user', JSON.stringify(profile));
    } catch (e) {
      console.error('Error refreshing profile:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        isCoHost,
        login,
        register,
        logout,
        verifyOtp,
        sendOtp,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
