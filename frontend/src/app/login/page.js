'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import InputError from '@/components/InputError';
import AuthSessionStatus from '../AuthSessionStatus';
import { useAuth } from '@/lib/AuthContext';

const Login = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shouldRemember, setShouldRemember] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load remembered email saat component mount
  useEffect(() => {
    // Pastikan kode hanya berjalan di client side
    if (typeof window !== 'undefined') {
      const rememberedEmail = localStorage.getItem('remembered_email');
      const isRemembered = localStorage.getItem('should_remember') === 'true';
      
      console.log('Loading remember me data:');
      console.log('Remembered email:', rememberedEmail);
      console.log('Is remembered:', isRemembered);
      
      if (rememberedEmail && isRemembered) {
        setEmail(rememberedEmail);
        setShouldRemember(true);
        console.log('Remember me data loaded successfully');
      }
    }
  }, []);

  const submitForm = async (event) => {
    event.preventDefault();
    setErrors({});
    setStatus(null);
    setLoading(true);

    // Validasi dasar
    if (!email || !password) {
      setErrors({ general: "Email dan password harus diisi" });
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting login with remember:', shouldRemember);
      
      // Handle remember me logic SEBELUM login
      if (shouldRemember) {
        localStorage.setItem('remembered_email', email);
        localStorage.setItem('should_remember', 'true');
        console.log('Remember me data saved before login');
      } else {
        localStorage.removeItem('remembered_email');
        localStorage.removeItem('should_remember');
        console.log('Remember me data cleared before login');
      }

      // Gunakan fungsi login dari AuthContext
      const success = await login(email, password, shouldRemember);
      
      if (success) {
        console.log('Login successful');
        router.push('/home');
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrors({ general: error.message || 'Terjadi kesalahan saat login. Silakan coba lagi.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle perubahan checkbox remember me
  const handleRememberChange = (e) => {
    const isChecked = e.target.checked;
    setShouldRemember(isChecked);
    
    console.log('Remember checkbox changed:', isChecked);
    
    if (isChecked && email) {
      // Simpan email jika checkbox dicentang dan email sudah ada
      localStorage.setItem('remembered_email', email);
      localStorage.setItem('should_remember', 'true');
      console.log('Remember me enabled and email saved');
    } else if (!isChecked) {
      // Hapus data jika checkbox tidak dicentang
      localStorage.removeItem('remembered_email');
      localStorage.removeItem('should_remember');
      console.log('Remember me disabled and data cleared');
    }
  };

  // Handle perubahan email
  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    
    // Update localStorage jika remember me aktif
    if (shouldRemember) {
      localStorage.setItem('remembered_email', newEmail);
      console.log('Email updated in localStorage:', newEmail);
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

      <div className="absolute inset-0 w-full lg:w-4/10 md:w-2/3 right-0 ml-auto animated-background bg-linear-to-tl from-emerald-800 via-violet-800 to-gray-800 z-10"></div>

      <div className="text-gray-800 relative z-20 w-full justify-end lg:w-1/3 sm:w-1/2 bg-white p-8 rounded-lg shadow-lg ml-auto mr-10">
        <h2 className="text-3xl font-bold mb-6 text-center">Login to OptiPredict</h2>

        {errors.general && (
          <div className="text-red-500 mb-4 text-center">
            <div>{errors.general}</div>
          </div>
        )}

        <AuthSessionStatus className="mb-4" status={status} />

        <form onSubmit={submitForm}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-lg font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="email"
              value={email}
              onChange={handleEmailChange}
              required
              className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300"
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
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
            <InputError messages={errors.password} className="mt-2" />
          </div>

          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id="remember"
              checked={shouldRemember}
              onChange={handleRememberChange}
              className="mr-2"
            />
            <label htmlFor="remember" className="text-sm text-gray-700">Remember me</label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 text-white text-lg rounded-md btn-gradient"
          >
            {loading ? 'Logging In...' : 'Login'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <a href="/register" className="text-gray-500 hover:underline hover:text-gray-900 transition-colors">
            Sign up here
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
