'use client';

import { useRouter } from 'next/navigation';
import useAuth from '../lib/useAuth';

const Logout = () => {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();  // Panggil logout dari useAuth
      router.push('/login');  // Redirect ke halaman login setelah logout
    } catch (error) {
      console.error('Logout gagal:', error);
      alert('Logout gagal, coba lagi!');  // Menampilkan pesan error jika logout gagal
    }
  };

  return (
    <button onClick={handleLogout} className="flex items-left gap-2 w-full text-left px-6 py-2 transition-all duration-200 text-white p-2 rounded hover:bg-gray-600 hover:cursor-pointer">
      Logout
    </button>
  );
};

export default Logout;
