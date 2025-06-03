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
                <p className="text-lg md:text-xl text-gray-200 leading-relaxed">
                  OptiPredict comes as an innovative machine learning-based solution for maintenance and fault management on optical networks. By utilizing integrated machine learning technology, OptiPredict allows users to automatically analyze data and predict various disturbances with a high level of accuracy.
                </p>
              </div>
            </section>

            {/* Topology Section */}
            <section className="mb-20">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                  OptiPredict Basic Topology
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
                <p className="text-lg md:text-xl text-gray-200 leading-relaxed">
                  The platform is supported with a responsive user interface and allows quick access to optical network condition monitoring with easy-to-understand reports. Data management and reporting features allow users to keep a history of predictions and optimize the decision-making process regarding network maintenance, thus preventing damage before it occurs.
                </p>
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