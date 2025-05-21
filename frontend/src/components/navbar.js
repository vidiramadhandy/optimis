'use client';

import { useAuth } from '@/lib/AuthContext'; // Mengambil login dan logout dari context
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const Navbar = () => {
  const { user, logout, isLoading } = useAuth(); // Mengambil data user dan logout dari context
  const pathname = usePathname();
  const router = useRouter();

  const [isHidden, setIsHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  const navItems = [
    { name: 'Profile', path: '/profile' },
    { name: 'Home', path: '/home' },
    { name: 'Predict', path: '/predict' },
    { name: 'History', path: '/history' },
  ];

  const handleLogout = async () => {
    try {
      await logout(); // Memanggil logout dari context untuk menghapus token
      router.push('/login'); // Redirect ke halaman login setelah logout
    } catch (error) {
      console.error('Gagal logout:', error);
      router.push('/login'); // Jika ada error, tetap redirect ke halaman login
    }
  };

  useEffect(() => {
    setIsDropdownVisible(false);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsHidden(currentScrollY > lastScrollY && currentScrollY > 100);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const isActive = (path) => pathname === path;
  const toggleDropdown = () => setIsDropdownVisible((prev) => !prev);

  return (
    <nav
      className={`fixed top-10 left-0 right-0 mx-8 px-6 py-2 z-50 flex items-center justify-between bg-gray-800 bg-opacity-80 rounded-2xl shadow-xl transform transition-all duration-300 ease-in-out
      ${isHidden ? 'translate-y-20 opacity-0' : 'translate-y-0 opacity-100'}`}
    >
      {/* Menampilkan nama pengguna jika sudah login */}
      <div className="flex items-center gap-2">
        {isLoading ? (
          <div className="w-10 h-10 rounded-full bg-gray-500 animate-pulse" />
        ) : user ? (
          <>
            <Link href="/profile">
              <span className="text-white">{user.name}</span> {/* Menampilkan nama pengguna */}
            </Link>
          </>
        ) : (
          <span className="text-white">Belum login</span>
        )}
      </div>

      {/* Menu Toggle Button - Hamburger Icon */}
      <div className="relative">
        <button
          onClick={toggleDropdown}
          className="cursor-pointer p-2 focus:outline-none"
          aria-label="Toggle menu"
        >
          <img src="/menu.svg" alt="Menu" className="h-6" />
        </button>

        {/* Dropdown Menu */}
        <div
          className={`bg-gray-800 bg-opacity-90 p-4 rounded-lg shadow-lg mt-1 absolute top-full left-0 z-20 w-48 transform transition-all duration-200 ease-in-out
          ${isDropdownVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          {navItems.map((item) => (
            <div
              key={item.name}
              className={`flex items-center gap-2 w-full text-left px-6 py-2 transition-all duration-200 text-white
              ${isActive(item.path) ? 'opacity-50 cursor-default' : 'hover:bg-gray-600 cursor-pointer'}`}
            >
              <Link href={item.path} onClick={() => setIsDropdownVisible(false)}>
                {item.name}
              </Link>
            </div>
          ))}

          <hr className="my-3" />

          {/* Login / Logout Item */}
          <div
            className={`flex items-center gap-2 w-full text-left px-6 py-2 cursor-pointer transition-all duration-200 text-white
            ${user ? 'hover:bg-gray-600' : ''}`}
            onClick={user ? handleLogout : () => router.push('/login')}
          >
            {isLoading ? (
              <span>Loading...</span> // Tampilkan "Loading..." saat status autentikasi sedang diperiksa
            ) : user ? (
              <span className="text-red-400">Logout</span> // Jika user sudah login, tampilkan "Logout"
            ) : (
              <span className="text-green-400">Login</span> // Jika user belum login, tampilkan "Login"
            )}
          </div>
        </div>
      </div>

      {/* Logo di kanan */}
      <div className="flex items-center space-x-4 ml-auto">
        <Link href="https://telkomuniversity.ac.id/en/school-of-electrical-engineering/?lang=en" target="_blank">
          <img src="/fte.png" alt="Logo FTE" className="h-6" />
        </Link>
        <Link href="https://telkomuniversity.ac.id/en" target="_blank">
          <img src="/telyu.png" alt="Logo Telyu" className="h-6" />
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
