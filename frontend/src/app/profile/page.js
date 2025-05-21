'use client';

import { useAuth } from '@/lib/AuthContext'; // Mengambil user dari context
import { useRouter } from 'next/navigation';

const Profile = () => {
  const { user, isLoading } = useAuth();  // Mengambil data user dan status loading dari context
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    // Jika user belum login, arahkan ke halaman login
    router.push('/login');
    return null; // Jangan tampilkan halaman jika user belum login
  }

  return (
    <div className="min-h-screen bg-gradient-to-tl from-gray-800 via-neutral-800 to-indigo-800 flex justify-center items-center">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg mx-4">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Profil Pengguna</h1>
        
        {/* Tampilkan nama dan email pengguna */}
        <div className="mb-4">
          <label htmlFor="name" className="block text-lg font-medium text-gray-700">Nama</label>
          <input
            type="text"
            id="name"
            value={user.name}  // Tampilkan nama pengguna
            readOnly
            className="text-black w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all duration-300 ease-in-out"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="email" className="block text-lg font-medium text-gray-700">Email</label>
          <input
            type="email"
            id="email"
            value={user.email}  // Tampilkan email pengguna
            readOnly
            className="text-black w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all duration-300 ease-in-out"
          />
        </div>

        {/* Tombol Logout */}
        <div className="flex justify-center mt-6">
          <button
            onClick={() => {
              // Handle logout (hapus token dan arahkan ke halaman login)
              localStorage.removeItem('token');
              sessionStorage.removeItem('token');
              router.push('/login');
            }}
            className="w-full py-3 bg-red-500 text-white text-lg font-bold rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 transition-all duration-300 ease-in-out"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
