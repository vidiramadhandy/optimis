'use client';

import { useAuth } from '@/hooks/useAuth'; // Impor useAuth untuk menggunakan logika autentikasi
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // Impor useRouter untuk redirect
import { useEffect, useState } from 'react';

const Navbar = () => {
  const { user, logout } = useAuth();  // Ambil user dan logout dari useAuth
  const pathname = usePathname();
  const router = useRouter();
  const [isHidden, setIsHidden] = useState(false); // Untuk mengatur visibility navbar
  const [lastScrollY, setLastScrollY] = useState(0); // Untuk menyimpan posisi scroll terakhir
  const [isDropdownVisible, setIsDropdownVisible] = useState(false); // Menyembunyikan dan menampilkan dropdown saat hover

  const navItems = [
    { name: 'Home', path: '/home' },
    { name: 'Predict', path: '/predict' },
    { name: 'History', path: '/history' },
  ];

  // Fungsi logout dan redirect ke halaman login
  const handleLogout = async () => {
    await logout();  // Panggil fungsi logout dari useAuth
    router.push('/login'); // Redirect ke halaman login setelah logout
  };

  // Memeriksa apakah pengguna sudah login berdasarkan user dari useAuth
  useEffect(() => {
    setIsDropdownVisible(false);  // Menyembunyikan dropdown jika halaman berubah
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY) {
        setIsHidden(true); // Menyembunyikan navbar saat scroll ke bawah
      } else {
        setIsHidden(false); // Menampilkan navbar saat scroll ke atas
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  // Fungsi untuk mengecek apakah item saat ini aktif
  const isActive = (path) => pathname === path;

  // Fungsi untuk menyembunyikan dropdown ketika halaman aktif
  const handleMouseEnter = () => {
    setIsDropdownVisible(true); // Menampilkan dropdown ketika mouse berada di hamburger
  };

  const handleMouseLeave = () => {
    setIsDropdownVisible(false); // Menyembunyikan dropdown saat mouse keluar
  };

  return (
    <nav
      className={`fixed top-10 left-0 right-0 mx-8 px-6 py-2 z-50 flex items-center justify-between bg-gray-800 bg-opacity-80 rounded-2xl shadow-xl transform transition-all duration-300 ease-in-out ${isHidden ? 'translate-y-20 opacity-0' : 'translate-y-0 opacity-100'}`}
    >
      {/* Menu Toggle Button - Hamburger Icon */}
      <div
        className="relative"
        onMouseEnter={handleMouseEnter} // Menampilkan dropdown saat hover pada hamburger
        onMouseLeave={handleMouseLeave} // Menyembunyikan dropdown saat pointer keluar
      >
        <button className="cursor-pointer p-2">
          <img src="/menu.svg" alt="Menu" className="h-6" />
        </button>

        {/* Dropdown Menu */}
        <div
          className={`bg-gray-800 bg-opacity-90 p-4 rounded-lg shadow-lg mt-1 absolute -translate-y-1/24 -translate-x-6 left-0 top-full z-20 w-48 transform transition-all duration-200 ease-in-out ${isDropdownVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onMouseEnter={handleMouseEnter} // Menjaga dropdown tetap muncul saat hover pada dropdown
          onMouseLeave={handleMouseLeave} // Menyembunyikan dropdown saat pointer keluar dari dropdown
        >
          {/* Navbar Items */}
          {navItems.map((item) => (
            <div
              key={item.name}
              className={`flex items-center gap-2 w-full text-left px-6 py-2 transition-all duration-200 
                          ${isActive(item.path) ? 'opacity-50 cursor-default' : 'hover:bg-gray-600 cursor-pointer'}`}
            >
              {/* Menyembunyikan item yang aktif */}
              {!isActive(item.path) && (
                <Link href={item.path}>
                  {item.name}
                </Link>
              )}
            </div>
          ))}
          <hr className="my-3" />
          {/* Login / Logout Item */}
          <div
            className={`flex items-center gap-2 w-full text-left px-6 py-2 cursor-pointer transition-all duration-200 
                        ${user ? 'hover:bg-gray-600' : ''}`}
            onClick={user ? handleLogout : null}
          >
            {user ? 'Logout' : <Link href="/login">Login</Link>}
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
