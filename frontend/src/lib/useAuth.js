// src/lib/useAuth.js - PERBAIKAN LENGKAP
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  // PERBAIKAN: Helper function untuk membuat URL API
  const createApiUrl = (endpoint) => {
    // Gunakan path relatif untuk memanfaatkan Apache proxy
    const normalizedEndpoint = endpoint.startsWith('/api/') ? endpoint : `/api/${endpoint}`;
    return normalizedEndpoint;
  };

  // PERBAIKAN: Fungsi untuk cek autentikasi dengan cookie authentication
  const checkAuth = async () => {
    try {
      setIsCheckingAuth(true);
      
      // PERBAIKAN: Gunakan path relatif dan cookie authentication
      const response = await fetch(createApiUrl('/api/auth/check'), {
        method: 'GET',
        credentials: 'include', // PENTING: untuk cookie authentication
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.authenticated && result.user) {
          setIsAuthenticated(true);
          setUser(result.user);
          setIsCheckingAuth(false);
          return true;
        }
      }
      
      // Jika tidak authenticated
      setIsAuthenticated(false);
      setUser(null);
      setIsCheckingAuth(false);
      return false;
      
    } catch (error) {
      console.error('Error checking authentication:', error);
      setIsAuthenticated(false);
      setUser(null);
      setIsCheckingAuth(false);
      return false;
    }
  };

  // Cek autentikasi saat hook pertama kali digunakan
  useEffect(() => {
    checkAuth();
  }, []);

  // PERBAIKAN: Fungsi login dengan cookie authentication
  const login = async (email, password, remember = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // PERBAIKAN: Gunakan path relatif untuk login
      const response = await fetch(createApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // PENTING: untuk cookie authentication
        body: JSON.stringify({ email, password, remember }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Login gagal');
        return false;
      }
      
      // PERBAIKAN: Backend menggunakan cookie, tidak perlu localStorage token
      if (data.user) {
        // Handle remember me logic di localStorage untuk UI saja
        if (remember) {
          localStorage.setItem('remembered_email', email);
          localStorage.setItem('should_remember', 'true');
        } else {
          localStorage.removeItem('remembered_email');
          localStorage.removeItem('should_remember');
        }
        
        // Set user data dari response
        setUser(data.user);
        setIsAuthenticated(true);
        
        router.push('/home');
        return true;
      }
      
      setError('User data tidak ditemukan dalam respons');
      return false;
    } catch (err) {
      console.error('Login failed:', err);
      setError('Terjadi kesalahan saat login');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // PERBAIKAN: Fungsi register dengan path relatif
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      // PERBAIKAN: Gunakan path relatif untuk register
      const response = await fetch(createApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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

  // PERBAIKAN: Fungsi logout dengan cookie authentication
  const logout = async () => {
    try {
      // PERBAIKAN: Gunakan path relatif untuk logout
      const response = await fetch(createApiUrl('/api/auth/logout'), {
        method: 'POST',
        credentials: 'include', // PENTING: untuk cookie authentication
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // PERBAIKAN: Hapus hanya data localStorage untuk UI, cookie dihapus oleh backend
      localStorage.removeItem('remembered_email');
      localStorage.removeItem('should_remember');
      
      setIsAuthenticated(false);
      setUser(null);
      router.push('/login');
      return true;
    } catch (err) {
      console.error('Logout failed:', err);
      // Tetap clear state meskipun request gagal
      setIsAuthenticated(false);
      setUser(null);
      router.push('/login');
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

  // PERBAIKAN: Fungsi tambahan untuk kompatibilitas dengan AuthContext
  const refreshAuth = async () => {
    return await checkAuth();
  };

  // Helper functions untuk remember me (hanya untuk UI)
  const getRememberedEmail = () => {
    if (typeof window === 'undefined') return null;
    
    const isRemembered = localStorage.getItem('should_remember') === 'true';
    const rememberedEmail = localStorage.getItem('remembered_email');
    
    return isRemembered ? rememberedEmail : null;
  };

  const clearRememberMe = () => {
    localStorage.removeItem('remembered_email');
    localStorage.removeItem('should_remember');
  };

  // PERBAIKAN: Fungsi untuk extend session (memanggil checkAuth)
  const extendSession = async () => {
    if (isAuthenticated) {
      return await checkAuth();
    }
    return false;
  };

  return {
    // Core authentication functions
    login,
    register,
    logout,
    checkAuth,
    requireAuth,
    
    // State
    error,
    loading,
    isAuthenticated,
    isCheckingAuth,
    user,
    
    // Additional helper functions
    refreshAuth,
    extendSession,
    getRememberedEmail,
    clearRememberMe,
    
    // Utility functions
    setError,
    setLoading
  };
}
