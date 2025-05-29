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
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const brightnessAmount = scrollY > 0.175 ? 0.175 : 0.55;

  return (
    <div className="relative min-h-screen bg-black text-white">
      {/* Navbar */}
      <Navbar />

      {/* Background Image dengan efek brightness yang tergantung scroll */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/background.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: `brightness(${brightnessAmount}) saturate(0.75) sepia(0.25) contrast(1.25)`,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          transition: 'filter 500ms ease-in-out',
        }}
      ></div>

      {/* Main Content */}
      <div className="relative z-10 pt-24 pb-16 overflow-y-auto">
        <main className="px-6 md:px-12 lg:px-20 xl:px-24">
          <div className="max-w-7xl mx-auto">
            
            {/* Hero Section */}
            <section className="mb-16">
              <h1 className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-extrabold mb-12 text-white font-title leading-tight animate__animated animate__fadeInUp">
                About<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  OptiPredict
                </span>
              </h1>
            </section>

            {/* Introduction Section */}
            <section className="mb-20">
              <div className="bg-black bg-opacity-40 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white border-opacity-10 shadow-2xl">
                <h2 className="text-2xl md:text-3xl font-bold mb-6 text-cyan-300">
                  Solusi Inovatif untuk Jaringan Optik
                </h2>
                <p className="text-lg md:text-xl text-gray-200 leading-relaxed">
                  OptiPredict hadir sebagai solusi inovatif berbasis machine learning untuk pemeliharaan dan manajemen gangguan pada jaringan optik. Dengan memanfaatkan teknologi machine learning yang terintegrasi, OptiPredict memungkinkan pengguna menganalisis data otomatis serta memprediksi berbagai gangguan dengan tingkat akurasi yang tinggi.
                </p>
              </div>
            </section>

            {/* Topology Section */}
            <section className="mb-20">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                  Topologi Dasar OptiPredict
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 mx-auto rounded-full"></div>
              </div>
              
              <div className="bg-white bg-opacity-95 rounded-2xl p-6 md:p-8 shadow-2xl">
                <div className="relative overflow-hidden rounded-xl">
                  <Image
                    src="/topology.jpg"
                    alt="Topologi Dasar OptiPredict"
                    width={1200}
                    height={700}
                    className="w-full h-auto object-contain"
                    priority
                  />
                </div>
              </div>
            </section>

            {/* Features Section */}
            <section className="mb-16">
              <div className="bg-black bg-opacity-40 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white border-opacity-10 shadow-2xl">
                <h2 className="text-2xl md:text-3xl font-bold mb-6 text-cyan-300">
                  Penjelasan Topologi
                </h2>
                <p className="text-lg md:text-xl text-gray-200 leading-relaxed">
                  Platform ini didukung dengan antarmuka pengguna yang responsif dan memungkinkan akses cepat pemantauan kondisi jaringan optik dengan laporan yang mudah dipahami. Fitur manajemen data dan pelaporan memungkinkan pengguna untuk menyimpan riwayat prediksi dan mengoptimalkan proses pengambilan keputusan terkait pemeliharaan jaringan, sehingga mencegah kerusakan sebelum terjadi.
                </p>
              </div>
            </section>

            {/* Key Features Grid */}
            <section className="mb-16">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 shadow-lg">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">Machine Learning</h3>
                  <p className="text-blue-100">Teknologi ML terintegrasi untuk analisis prediktif yang akurat</p>
                </div>

                <div className="bg-gradient-to-br from-cyan-600 to-cyan-800 rounded-xl p-6 shadow-lg">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-2xl">📊</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">Analisis Otomatis</h3>
                  <p className="text-cyan-100">Pemrosesan data otomatis untuk monitoring real-time</p>
                </div>

                <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-6 shadow-lg md:col-span-2 lg:col-span-1">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-2xl">🔧</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">Pemeliharaan Prediktif</h3>
                  <p className="text-purple-100">Mencegah kerusakan sebelum terjadi dengan prediksi akurat</p>
                </div>
              </div>
            </section>

          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="relative z-10 mt-auto">
        <div className="bg-black bg-opacity-60 backdrop-blur-sm border-t border-white border-opacity-10">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 xl:px-24 py-8">
            <div className="text-center">
              <p className="text-gray-300">&copy; 2025 OptiPredict. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
