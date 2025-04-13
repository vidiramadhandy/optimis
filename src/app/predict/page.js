'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/navbar';

const Predict = () => {
  const [osnr1, setOsnr1] = useState('');
  const [osnr2, setOsnr2] = useState('');
  const [osnr3, setOsnr3] = useState('');
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Proses prediksi setelah mengisi input
    console.log({ osnr1, osnr2, osnr3 });
    // Alihkan ke halaman hasil prediksi atau proses lainnya
    router.push('/results'); // Ganti dengan URL hasil prediksi
  };

  return (
    <div className="relative min-h-screen bg-gray-100">
      {/* Navbar */}
      <Navbar />

      {/* Gambar latar belakang */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/predictbg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position:'fixed',
          filter: 'brightness(0.5)',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
      ></div>

      {/* Konten Judul */}
      <div className="sm:text-4xl md:text-6xl lg:text-7xl text-white font-bold mt-36 text-center relative z-20 ">
        <h1>Predict Your Fiber Optic Network</h1>
      </div>

      <div className="absolute inset-0 w-full mt-30 bg-gray-800 z-10"></div>

      {/* Form Predict */}
      <div className="text-black relative z-20 w-full lg:w-2/3 bg-white p-4 rounded-lg shadow-lg mx-auto my-8">
        <h2 className="text-3xl font-bold mb-6 text-left">Input</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="osnr1" className="block text-lg font-medium text-gray-700">
              OSNR (Input Value 1)
            </label>
            <input
              type="number"
              id="osnr1"
              name="osnr1"
              value={osnr1}
              onChange={(e) => setOsnr1(e.target.value)}
              required
              className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all duration-300 ease-in-out"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="osnr2" className="block text-lg font-medium text-gray-700">
              OSNR (Input Value 2)
            </label>
            <input
              type="number"
              id="osnr2"
              name="osnr2"
              value={osnr2}
              onChange={(e) => setOsnr2(e.target.value)}
              required
              className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all duration-300 ease-in-out"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="osnr3" className="block text-lg font-medium text-gray-700">
              OSNR (Input Value 3)
            </label>
            <input
              type="number"
              id="osnr3"
              name="osnr3"
              value={osnr3}
              onChange={(e) => setOsnr3(e.target.value)}
              required
              className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all duration-300 ease-in-out"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 mt-4 bg-green-500 text-white text-lg rounded-md transition-all duration-400 ease-in-out hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-2xl cursor-pointer"
          >
            Predict!
          </button>
        </form>
      </div>
    </div>
  );
};

export default Predict;
