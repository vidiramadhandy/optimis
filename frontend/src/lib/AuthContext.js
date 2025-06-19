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

  // Fungsi untuk mengambil data user berdasarkan token
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return null;
      }

      const response = await fetch('http://optipredict.my.id:5000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        return userData;
      } else {
        localStorage.removeItem('auth_token');
        setUser(null);
        return null;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Periksa status autentikasi saat aplikasi dimuat
  useEffect(() => {
    fetchUserData();
  }, []);

  // Fungsi login dengan remember me support
  const login = async (email, password, remember = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('http://optipredict.my.id:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, remember }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Login failed');
        throw new Error(data.message || 'Login failed');
      }
      
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        
        // Handle remember me logic
        if (remember) {
          localStorage.setItem('remembered_email', email);
          localStorage.setItem('should_remember', 'true');
          
          // Set token expiry yang lebih lama untuk remember me
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 30); // 30 hari
          localStorage.setItem('token_expiry', expiryDate.toISOString());
        } else {
          localStorage.removeItem('remembered_email');
          localStorage.removeItem('should_remember');
          
          // Set token expiry normal (1 hari)
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 1);
          localStorage.setItem('token_expiry', expiryDate.toISOString());
        }
        
        // Set user data
        if (data.id && data.name && data.email) {
          setUser(data);
        } else {
          await fetchUserData();
        }
        
        // Start inactivity timer setelah login
        resetInactivityTimer();
        
        return true;
      }
      
      setError('Token not found during responding');
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      setError(error.message || 'Error during login');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi register
  const register = async (userData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('http://optipredict.my.id:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  // Fungsi logout yang enhanced
  const logout = async (isAutoLogout = false) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await fetch('http://optipredict.my.id:5000/api/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear timer
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Hapus token dan user data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token_expiry');
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

  // Helper functions
  const clearRememberMe = () => {
    localStorage.removeItem('remembered_email');
    localStorage.removeItem('should_remember');
  };

  const getRememberedEmail = () => {
    const isRemembered = localStorage.getItem('should_remember') === 'true';
    const rememberedEmail = localStorage.getItem('remembered_email');
    
    return isRemembered ? rememberedEmail : null;
  };

  const isTokenExpired = () => {
    const expiry = localStorage.getItem('token_expiry');
    if (!expiry) return true;
    
    return new Date() > new Date(expiry);
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
