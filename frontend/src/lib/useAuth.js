// src/lib/useAuth.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  // Fungsi untuk cek autentikasi
  const checkAuth = async () => {
    try {
      setIsCheckingAuth(true);
      
      // Ambil token dari localStorage (sesuaikan dengan nama yang Anda gunakan)
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        setIsAuthenticated(false);
        setIsCheckingAuth(false);
        return false;
      }

      // Verifikasi token dengan backend
      const response = await fetch('http://20.189.116.138:5000/api/auth/check', {
        method: 'GET',
        headers: {
          'x-access-token': token
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.authenticated) {
          setIsAuthenticated(true);
          setUser(result.user);
          setIsCheckingAuth(false);
          return true;
        }
      }
      
      // Jika token tidak valid
      localStorage.removeItem('auth_token');
      setIsAuthenticated(false);
      setIsCheckingAuth(false);
      return false;
      
    } catch (error) {
      console.error('Error checking authentication:', error);
      localStorage.removeItem('auth_token');
      setIsAuthenticated(false);
      setIsCheckingAuth(false);
      return false;
    }
  };

  // Cek autentikasi saat hook pertama kali digunakan
  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://20.189.116.138:5000/api/auth/login', {
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
        
        // Simpan data user jika ada
        if (data.id && data.name && data.email) {
          const userData = {
            id: data.id,
            name: data.name,
            email: data.email
          };
          localStorage.setItem('userData', JSON.stringify(userData));
          setUser(userData);
        }
        
        setIsAuthenticated(true);
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
      
      const response = await fetch('http://20.189.116.138:5000/api/auth/register', {
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
      const response = await fetch('http://20.189.116.138:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      localStorage.removeItem('auth_token');
      localStorage.removeItem('userData');
      setIsAuthenticated(false);
      setUser(null);
      router.push('/login');
      return true;
    } catch (err) {
      console.error('Logout failed:', err);
      return false;
    }
  };

  // Fungsi untuk redirect ke login jika tidak terautentikasi
  const requireAuth = () => {
    if (!isCheckingAuth && !isAuthenticated) {
      router.push('/login');
      return false;
    }
    return true;
  };

  return {
    login,
    register,
    logout,
    checkAuth,
    requireAuth,
    error,
    loading,
    isAuthenticated,
    isCheckingAuth,
    user,
  };
}
