'use client';

import { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  
  // Refs untuk auto logout
  const timeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  
  // Konstanta untuk timeout (1 jam = 3600000 ms)
  const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 jam
  const WARNING_TIME = 5 * 60 * 1000; // 5 menit sebelum logout

  // PERBAIKAN: Konfigurasi API Base URL yang sesuai dengan backend
  const getApiBaseUrl = () => {
    // Gunakan path relatif untuk memanfaatkan Apache proxy
    return '';
  };

  // PERBAIKAN: Helper function untuk membuat URL API
  const createApiUrl = (endpoint) => {
    const baseUrl = getApiBaseUrl();
    // Pastikan endpoint dimulai dengan /api/
    const normalizedEndpoint = endpoint.startsWith('/api/') ? endpoint : `/api/${endpoint}`;
    return `${baseUrl}${normalizedEndpoint}`;
  };

  // Fungsi untuk reset timer inactivity
  const resetInactivityTimer = () => {
    lastActivityRef.current = Date.now();
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout hanya jika user sedang login
    if (user) {
      timeoutRef.current = setTimeout(() => {
        handleAutoLogout();
      }, INACTIVITY_TIMEOUT);
    }
  };

  // Fungsi untuk handle auto logout
  const handleAutoLogout = () => {
    console.log('Auto logout due to inactivity');
    logout(true); // Parameter true untuk menandakan auto logout
  };

  // Fungsi untuk track user activity
  const trackUserActivity = () => {
    resetInactivityTimer();
  };

  // Setup event listeners untuk track activity
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, trackUserActivity, true);
    });

    // Cleanup event listeners
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, trackUserActivity, true);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [user]);

  // Start inactivity timer saat user login
  useEffect(() => {
    if (user) {
      resetInactivityTimer();
    } else {
      // Clear timer saat user logout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  }, [user]);

  // PERBAIKAN: Fungsi untuk check auth status yang sesuai dengan backend
  const checkAuthStatus = async () => {
    try {
      // PERBAIKAN: Gunakan endpoint /api/auth/check yang sudah ada di backend
      const response = await fetch(createApiUrl('/api/auth/check'), {
        method: 'GET',
        credentials: 'include', // PENTING: untuk cookie authentication
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          resetInactivityTimer();
          return true;
        }
      }
      
      // Jika tidak authenticated, clear user data
      setUser(null);
      return false;
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // PERBAIKAN: Fungsi untuk mengambil data user (tidak diperlukan karena sudah ada di checkAuthStatus)
  const fetchUserData = async () => {
    return await checkAuthStatus();
  };

  // Periksa status autentikasi saat aplikasi dimuat
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // PERBAIKAN: Fungsi login yang sesuai dengan backend cookie authentication
  const login = async (email, password, remember = false) => {
    try {
      setIsLoading(true);
      setError(null);

      // PERBAIKAN: Gunakan path relatif yang akan di-proxy oleh Apache
      const response = await fetch(createApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include', // PENTING: untuk cookie authentication
        body: JSON.stringify({ email, password, remember }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Login failed');
        throw new Error(data.message || 'Login failed');
      }
      
      // PERBAIKAN: Backend menggunakan cookie authentication, tidak perlu localStorage token
      if (data.user) {
        // Handle remember me logic di localStorage untuk UI
        if (remember) {
          localStorage.setItem('remembered_email', email);
          localStorage.setItem('should_remember', 'true');
        } else {
          localStorage.removeItem('remembered_email');
          localStorage.removeItem('should_remember');
        }
        
        // Set user data dari response
        setUser(data.user);
        
        // Start inactivity timer setelah login
        resetInactivityTimer();
        
        return true;
      }
      
      setError('User data not found in response');
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      setError(error.message || 'Error during login');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // PERBAIKAN: Fungsi register yang sesuai dengan backend
  const register = async (userData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // PERBAIKAN: Gunakan path relatif untuk register
      const response = await fetch(createApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Registrasi failed');
        return false;
      }
      
      router.push('/login');
      return true;
    } catch (err) {
      console.error('Registration failed:', err);
      setError('Error during registration');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // PERBAIKAN: Fungsi logout yang sesuai dengan backend cookie authentication
  const logout = async (isAutoLogout = false) => {
    try {
      // PERBAIKAN: Gunakan path relatif untuk logout
      await fetch(createApiUrl('/api/auth/logout'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // PENTING: untuk cookie authentication
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear timer
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // PERBAIKAN: Hapus hanya data localStorage, cookie akan dihapus oleh backend
      localStorage.removeItem('remembered_email');
      localStorage.removeItem('should_remember');
      setUser(null);
      
      // Show notification jika auto logout
      if (isAutoLogout) {
        alert('You have been logged out due to inactivity');
      }
      
      router.push('/login');
    }
  };

  // Fungsi untuk get remaining time
  const getRemainingTime = () => {
    if (!user) return 0;
    
    const timeSinceLastActivity = Date.now() - lastActivityRef.current;
    const remainingTime = INACTIVITY_TIMEOUT - timeSinceLastActivity;
    
    return Math.max(0, remainingTime);
  };

  // Fungsi untuk extend session
  const extendSession = () => {
    if (user) {
      resetInactivityTimer();
      console.log('Session extended');
    }
  };

  // Helper functions untuk remember me (hanya untuk UI, bukan authentication)
  const clearRememberMe = () => {
    localStorage.removeItem('remembered_email');
    localStorage.removeItem('should_remember');
  };

  const getRememberedEmail = () => {
    if (typeof window === 'undefined') return null;
    
    const isRemembered = localStorage.getItem('should_remember') === 'true';
    const rememberedEmail = localStorage.getItem('remembered_email');
    
    return isRemembered ? rememberedEmail : null;
  };

  // PERBAIKAN: Token expiry check tidak diperlukan karena backend menggunakan cookie
  const isTokenExpired = () => {
    // Dengan cookie authentication, backend akan handle expiry
    return false;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register,
      logout, 
      isLoading, 
      error,
      fetchUserData,
      checkAuthStatus,
      clearRememberMe,
      getRememberedEmail,
      isTokenExpired,
      getRemainingTime,
      extendSession,
      resetInactivityTimer
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
