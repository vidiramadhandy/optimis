// src/lib/useAuth.js
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Login gagal');
        return false;
      }
      
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        router.push('/home');
        return true;
      }
      
      setError('Token tidak ditemukan dalam respons');
      return false;
    } catch (err) {
      console.error('Login failed:', err);
      setError('Terjadi kesalahan saat login');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Registrasi gagal');
        return false;
      }
      
      router.push('/login');
      return true;
    } catch (err) {
      console.error('Registration failed:', err);
      setError('Terjadi kesalahan saat registrasi');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      localStorage.removeItem('auth_token');
      router.push('/login');
      return true;
    } catch (err) {
      console.error('Logout failed:', err);
      return false;
    }
  };

  return {
    login,
    register,
    logout,
    error,
    loading,
  };
}
