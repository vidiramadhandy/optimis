'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../../components/navbar';
import Image from 'next/image';

export default function Home() {
  const [scrollY, setScrollY] = useState(0);

  const handleScroll = () => {
    setScrollY(window.scrollY);
  };

  useEffect(() => {
    // Menambahkan event listener saat component mount
    window.addEventListener('scroll', handleScroll);

    // Menghapus event listener saat component unmount
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Menetapkan brightness ke 1 hanya di posisi paling atas, dan 0 (gelap) saat scroll dimulai
  const brightnessAmount = scrollY > 0.175 ? 0.175 : 0.55;

  return (
    <div className="relative min-h-screen bg-black text-white">
      {/* Navbar */}
      <Navbar />

      {/* Background Image dengan efek brightness yang tergantung scroll */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/background.jpg')", // Ganti dengan gambar yang sesuai
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: `brightness(${brightnessAmount}) saturate(0.75) sepia(0.25) contrast(1.25)`, // Mengubah brightness
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          transition: 'filter 500ms ease-in-out', // Menambahkan transisi 500ms
        }}
      ></div>

      {/* Main Content - Judul dan Teks */}
      <div className="relative z-10 pt-32 pb-16 overflow-y-auto">
        {/* "pt-32" memberikan padding-top untuk memberi ruang dari navbar */}
        <main className="text-left px-6 md:px-12 lg:px-16 p-4">
          <div className="max-w-6xl mx-auto">
            {/* Judul */}
            <h1 className="text-9xl font-extrabold mb-8 text-white font-title ml-0 animate__animated animate__fadeInUp transition-all duration-300">
              About OptiPredict
            </h1>

            {/* Teks Penjelasan */}
            <div className="text-lg text-white leading-relaxed max-w-5xl mx-auto ml-0 animate__animated animate__fadeInUp">
              OptiPredict hadir sebagai solusi inovatif berbasis machine learning untuk pemeliharaan dan manajemen gangguan pada jaringan optik. Dengan memanfaatkan teknologi machine learning yang terintegrasi, OptiPredict memungkinkan pengguna menganalisis data otomatis serta memprediksi berbagai gangguan dengan tingkat akurasi yang tinggi.
              <br />
              <br />
              Topologi Dasar OptiPredict:
              <br />
              <Image
                src="/topology.jpg"
                alt="Image1"
                width={1000}
                height={600}
              />

              Penjelasan Topologi
              <br />
              Platform ini didukung dengan antarmuka pengguna yang responsif dan memungkinkan akses cepat pemantauan kondisi jaringan optik dengan laporan yang mudah dipahami. Fitur manajemen data dan pelaporan memungkinkan pengguna untuk menyimpan riwayat prediksi dan mengoptimalkan proses pengambilan keputusan terkait pemeliharaan jaringan, sehingga mencegah kerusakan sebelum terjadi.
            </div>
          </div>
        </main>
      </div>

      {/* Footer - Pastikan posisi relative untuk di bawah konten */}
      <footer className="relative z-10 mt-auto p-4 bg-black bg-opacity-50 text-center">
        <p>&copy; 2025 OptiPredict. All rights reserved.</p>
      </footer>
    </div>
  );
}
