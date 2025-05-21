'use client';

import InputError from '@/components/InputError';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '../../lib/axios';
import useAuth from '@/lib/useAuth'; // Mengambil fungsi login dari context

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [shouldRemember, setShouldRemember] = useState(false); // Mendefinisikan state shouldRemember
  const router = useRouter();
  const { login } = useAuth();  // Mengambil fungsi login dari context

  const submitForm = async (event) => {
    event.preventDefault();

    setLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {  // Perhatikan port backend 5000
        email,
        password,
      });

      // Jika checkbox "Remember me" dicentang, simpan token di localStorage
      if (shouldRemember) {
        localStorage.setItem('token', response.data.token);
      } else {
        sessionStorage.setItem('token', response.data.token); // Menggunakan sessionStorage jika tidak dicentang
      }

      login(response.data.token);  // Memanggil fungsi login dari context untuk mengatur status login di context
      setSuccessMessage(response.data.message);
      router.push('/home');  // Redirect ke halaman home setelah login
    } catch (error) {
      console.error('Error during login:', error);
      if (error.response && error.response.data.error) {
        setErrors({ general: error.response.data.error });
      } else {
        setErrors({ general: 'Something went wrong. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-start bg-gray-100 relative">
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

      <div className="absolute inset-0 w-full lg:w-4/10 md:w-2/3 right-0 ml-auto animated-background bg-linear-to-tl from-pink-800 via-violet-800 to-gray-800 z-10"></div>

      <div className="text-gray-800 relative z-20 w-full justify-end lg:w-1/3 sm:w-1/2 bg-white p-8 rounded-lg shadow-lg ml-auto mr-10">
        <h2 className="text-3xl font-bold mb-6 text-center">Login to OptiPredict</h2>

        {/* Menampilkan pesan error jika login gagal */}
        {errors.general && (
          <div className="text-red-500 mb-4 text-center">
            <div>{errors.general}</div>
          </div>
        )}

        <form onSubmit={submitForm}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-lg font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="email"
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
              placeholder="password"
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
              onChange={(e) => setShouldRemember(e.target.checked)} // Mengatur state shouldRemember
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
