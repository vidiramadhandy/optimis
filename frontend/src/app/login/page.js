'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import InputError from '@/components/InputError';
import AuthSessionStatus from '../AuthSessionStatus'; // Komponen untuk menampilkan status
import Loader from '@/components/loader';  // Import Loader component

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shouldRemember, setShouldRemember] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fungsi untuk submit form login
  const submitForm = async (event) => {
    event.preventDefault();

    setErrors({});  // Reset errors
    setStatus(null); // Reset status
    setLoading(true);  // Set loading state to true

    // Validasi input form
    if (!email || !password) {
      setErrors({ general: "Please fill in all fields" });
      setLoading(false);  // Set loading to false after validation fails
      return;
    }

    try {
      console.log('Attempting to login with:', email);  // Log email yang dikirim untuk login

      const response = await fetch('http://localhost:8000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          remember: shouldRemember,
        }),
        credentials: 'include',  // Pastikan cookies (session_id) dikirim
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorObject = JSON.parse(errorText);
        console.log('Login failed:', errorObject.error);  // Log error jika login gagal
        setErrors({ general: errorObject.error });
        setLoading(false);
        return;
      }

      const contentType = response.headers.get("Content-Type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        console.log('Login response data:', data);  // Log data response dari server

        if (data.message === "Login successful") {
          console.log('Login successful! Redirecting to home...');
          router.push('/home'); // Redirect ke halaman home setelah login berhasil
        } else {
          setErrors({ general: 'Login failed, please try again' });
        }
      } else {
        setErrors({ general: 'Unexpected response format. Expected JSON.' });
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setErrors({ general: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);  // Set loading to false once the request completes
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-start bg-gray-100 relative">
      <video
        className="absolute inset-0 z-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        style={{ filter: 'brightness(0.5)' }}
      >
        <source src="/background.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className="absolute inset-0 w-full lg:w-4/10 md:w-2/3 right-0 ml-auto animated-background bg-linear-to-tl from-pink-800 via-violet-800 to-gray-800 z-10"></div>

      <div className="text-gray-800 relative z-20 w-full justify-end lg:w-1/3 sm:w-1/2 bg-white p-8 rounded-lg shadow-lg ml-auto mr-10">
        <h2 className="text-3xl font-bold mb-6 text-center">Login to OptiPredict</h2>

        {/* Menampilkan pesan error jika login gagal */}
        {errors.general && (
          <div className="text-red-500 mb-4 text-center">
            <div>{errors.general}</div>
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
            <InputError messages={errors.email} className="mt-2" />
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
            <InputError messages={errors.password} className="mt-2" />
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
            className="w-full py-3 mt-4 justify-center items-center flex bg-green-500 text-white text-lg rounded-md transition-all duration-400 ease-in-out hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
          >
            {loading ? (
              <><Loader /> {/* Animasi Loader */}</>
            ) : (
              'Login'
            )}
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
