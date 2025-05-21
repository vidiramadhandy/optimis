'use client';

import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios'; // Pastikan axios diimpor jika diperlukan

const AuthContext = createContext();

// Hook untuk mengakses AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (token) {
      fetchUserData(token); // Ambil data pengguna jika token ada
    } else {
      setIsLoading(false);  // Set loading false jika tidak ada token
    }
  }, []);

  const fetchUserData = async (token) => {
    try {
      const response = await axios.get('http://localhost:5000/api/users/profile', {
        headers: {
          Authorization: `Bearer ${token}`,  // Pastikan token dikirim di header Authorization
        },
      });

      setUser(response.data); // Menyimpan data pengguna yang berhasil diambil
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUser(null);  // Jika terjadi error, reset user menjadi null
    } finally {
      setIsLoading(false); // Set loading ke false setelah selesai
    }
  };

  const login = (token) => {
    localStorage.setItem('token', token);
    sessionStorage.setItem('token', token);
    fetchUserData(token); // Ambil data pengguna setelah login berhasil
  };

  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setUser(null); // Reset user setelah logout
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
