'use client';

import { useEffect, useState } from 'react';
import { redirect, useRouter } from 'next/navigation';
import AuthSessionStatus from '../AuthSessionStatus';
import { useAuth } from '@/hooks/auth';

const Login = () => {
  const router = useRouter();

  const { login } = useAuth({
    middleware: 'guest',
    redirectIfAuthenticated: '/home',
  })

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shouldRemember, setShouldRemember] = useState(false); // Untuk remember me
  const [errors, setErrors] = useState([]); // Menampilkan error jika login gagal
  const [status, setStatus] = useState(null); // Status untuk menampilkan pesan status
  const [loading, setLoading] = useState(false); // Untuk menangani status loading

  // Menggunakan useEffect untuk menangani status reset
  useEffect(() => {
    if (router.query?.reset?.length > 0 && errors.length === 0) {
      setStatus(atob(router.query.reset)); // Decode pesan reset
    } else {
      setStatus(null);
    }
  }, [router.query, errors]);

  // Set CSRF token untuk Laravel Sanctum
  const setCsrfToken = async () => {
    await fetch('http://localhost:8000/sanctum/csrf-cookie', {
      method: 'GET',
      credentials: 'include',
    });
  };

  // Fungsi untuk submit form login
  const submitForm = async (event) => {
    event.preventDefault();
  
    setErrors([]); // Reset errors sebelum melakukan login
    setStatus(null); // Reset status
    setLoading(true);
  
    // Panggil setCsrfToken sebelum mengirim permintaan login
    await setCsrfToken();
  
    try {
      // Kirim permintaan POST ke API login
      const response = await fetch('http://localhost:8000/api/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          remember: shouldRemember,
        }),
        credentials: 'include', // Kirimkan cookie bersama permintaan
      });
  
      if (!response.ok) {
        // Jika status bukan 200, anggap sebagai error
        const errorText = await response.text();  // Mengambil respons sebagai teks
        setErrors([`Error: ${response.status} - ${errorText}`]); // Tampilkan status code dan teks error
        return;
      }
  
      // Jika status code OK, coba parse JSON
      //const data = await response.json();
  
      // Menangani respons dari server
      localStorage.setItem('auth_token', data.token); // Simpan token di localStorage
      router.push('/home');
    } catch (error) {
      console.error("Fetch error:", error);
      setErrors(['An error occurred. Please try again.']);
    }
  
    setLoading(false);
  };
  

  return (
    <div className="min-h-screen flex items-center justify-start bg-gray-100 relative">
      {/* Video Background */}
      <video
        className="absolute inset-0 z-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        style={{
          filter: 'brightness(0.5)',
        }}
      >
        <source src="/background.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Aksen Biru di Sisi Kanan */}
      <div className="absolute inset-0 w-full lg:w-4/10 md:w-2/3 right-0 ml-auto animated-background bg-linear-to-tl from-pink-800 via-violet-800 to-gray-800 z-10"></div>

      {/* Form Login */}
      <div className="text-gray-800 relative z-20 w-full justify-end lg:w-1/3 sm:w-1/2 bg-white p-8 rounded-lg shadow-lg ml-auto mr-10">
        <h2 className="text-3xl font-bold mb-6 text-center">Login to OptiPredict</h2>
        
        {/* Menampilkan pesan error jika login gagal */}
        {errors.length > 0 && (
          <div className="text-red-500 mb-4 text-center">
            {errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        )}

        {/* Menampilkan status jika ada */}
        <AuthSessionStatus className="mb-4" status={status} />

        <form onSubmit={submitForm}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-lg font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all duration-300 ease-in-out"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-lg font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all duration-300 ease-in-out"
            />
          </div>

          {/* Checkbox Remember Me */}
          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id="remember"
              checked={shouldRemember}
              onChange={(e) => setShouldRemember(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="remember" className="text-sm text-gray-700">Remember me</label>
          </div>

          <button
            type="submit"
            className="w-full py-3 mt-4 bg-green-500 text-white text-lg rounded-md transition-all duration-400 ease-in-out hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
          >
            {loading ? 'Logging In...' : 'Login'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <a href="/register" className="text-blue-400 hover:underline hover:text-blue-800 cursor-pointer">
            Sign up here
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
