'use client';

import { createContext, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Buat context untuk autentikasi
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Fungsi untuk mengambil data user berdasarkan token
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return null;
      }

      const response = await fetch('http://localhost:5000/api/auth/me', {
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

  // Fungsi login
  const login = async (email, password, remember) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, remember }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login gagal');
      }
      
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        
        // Jika data user sudah ada dalam respons login
        if (data.id && data.name && data.email) {
          setUser(data);
        } else {
          // Jika tidak, ambil data user dengan token yang baru
          await fetchUserData();
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // Fungsi logout
  const logout = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await fetch('http://localhost:5000/api/auth/logout', {
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
      localStorage.removeItem('auth_token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, fetchUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
