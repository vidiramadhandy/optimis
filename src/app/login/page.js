'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Logika login, setelah login berhasil arahkan ke halaman home
    console.log({ email, password });
    router.push('/'); // Redirect ke halaman home setelah login berhasil
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 relative">
      {/* Gambar Latar Belakang dengan margin negatif untuk menggeser ke kiri */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/loginbg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          marginLeft: '-15%', // Geser gambar latar ke kiri dengan margin negatif
          filter: 'brightness(0.5)', // Mengatur kecerahan gambar agar form lebih terlihat
        }}
      ></div>

      {/* Aksen Biru di Sisi Kanan, di belakang form */}
      <div className="absolute inset-0 right-0 ml-auto w-4/10 bg-gray-800 bg-opacity-50 z-10"></div>

      {/* Form Login, diposisikan di sebelah kanan */}
      <div className="text-gray-800 relative z-20 w-full lg:w-1/3 sm:w-1/2 bg-white p-8 rounded-lg shadow-lg ml-auto mr-10">
        <h2 className="text-3xl font-bold mb-6 text-center">Login to OptiPredict</h2>
        <form onSubmit={handleSubmit}>
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

          <button
            type="submit"
            className="w-full py-3 mt-4 bg-green-500 text-white text-lg rounded-md transition-all duration-400 ease-in-out hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
          >
            Login
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <a href="/signup" className="text-blue-400 hover:underline hover:text-blue-800 cursor-pointer">
            Sign up here
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
