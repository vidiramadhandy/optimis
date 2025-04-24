'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/navbar';
import AltPage from './altpage'; // Mengimpor komponen AltPage

const Predict = () => {
  const [inputs, setInputs] = useState(Array(30).fill(''));
  const [reflectance, setReflectance] = useState('');
  const [snr, setSnr] = useState('');
  const [loss, setLoss] = useState('');
  const [isAltPageVisible, setIsAltPageVisible] = useState(false); // State untuk kontrol tampilan
  const router = useRouter();

  const handleInputChange = (index, value) => {
    const newInputs = [...inputs];
    newInputs[index] = value;
    setInputs(newInputs);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validasi jika ada input kosong
    if (inputs.some(input => input === '') || reflectance === '' || snr === '' || loss === '') {
      alert("Please fill out all the inputs.");
      return;
    }

    console.log(inputs, reflectance, snr, loss); // Cetak seluruh input di konsol
    router.push('/results');
  };

  const toggleAltPage = () => {
    setIsAltPageVisible(!isAltPageVisible); // Toggle antara input manual dan CSV upload
  };

  return (
    <div className="relative min-h-screen bg-gradient-animation">
      <Navbar />
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/predictbg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'fixed',
          filter: 'brightness(0.5)',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
      ></div>

      <div className="sm:text-4xl md:text-6xl lg:text-7xl text-white font-bold mt-30 text-center relative z-20">
        <h1>Predict Your Fiber Optic Network</h1>
      </div>

      <div className="absolute inset-0 w-full mt-30 animated-background bg-gradient-to-bl from-gray-800 via-zinc-800 to-violet-950 z-0"></div>

      {/* Kondisi untuk menampilkan input manual atau AltPage */}
      {isAltPageVisible ? (
        <AltPage /> // Komponen untuk upload CSV
      ) : (
        <div className="text-black relative z-20 w-full lg:w-2/3 bg-white p-4 rounded-lg shadow-lg mx-auto my-8">
          <h2 className="text-3xl font-bold mb-2 text-left">Input</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-3 gap-6">
              {/* Input P1-P30 */}
              {[...Array(30).keys()].map(i => (
                <div className="mb-2" key={i}>
                  <label htmlFor={`P${i + 1}`} className="block text-lg font-medium text-gray-700">
                    {`P${i + 1}`}
                  </label>
                  <input
                    type="number"
                    id={`P${i + 1}`}
                    name={`P${i + 1}`}
                    value={inputs[i]}
                    onChange={(e) => handleInputChange(i, e.target.value)}
                    required
                    className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all duration-300 ease-in-out"
                  />
                </div>
              ))}

              {/* Input Reflectance */}
              <div className="mb-2">
                <label htmlFor="reflectance" className="block text-lg font-medium text-gray-700">
                  Reflectance
                </label>
                <input 
                  type="number"
                  id="reflectance"
                  value={reflectance}
                  onChange={(e) => setReflectance(e.target.value)}
                  required
                  className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all duration-300 ease-in-out"
                />
              </div>

              {/* Input SNR */}
              <div className="mb-2">
                <label htmlFor="snr" className="block text-lg font-medium text-gray-700">
                  SNR
                </label>
                <input 
                  type="number"
                  id="snr"
                  value={snr}
                  onChange={(e) => setSnr(e.target.value)}
                  required
                  className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all duration-300 ease-in-out"
                />
              </div>

              {/* Input Loss */}
              <div className="mb-2">
                <label htmlFor="loss" className="block text-lg font-medium text-gray-700">
                  Loss
                </label>
                <input 
                  type="number"
                  id="loss"
                  value={loss}
                  onChange={(e) => setLoss(e.target.value)}
                  required
                  className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all duration-300 ease-in-out"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 mt-4 bg-green-500 text-white text-lg rounded-md transition-all duration-400 ease-in-out hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-2xl cursor-pointer"
            >
              Predict!
            </button>
          </form>
        </div>
      )}

      {/* Hyperlink untuk memilih antara input manual atau upload CSV */}
      <div className="text-center my-4 relative z-20">
        <a
          href="#"
          onClick={toggleAltPage}
          className="text-blue-500 hover:text-blue-700 transition-all duration-500 ease-in-out font-semibold text-xl"
        >
          {isAltPageVisible ? 'Use Manual Input' : 'Or Upload CSV'}
        </a>
      </div>
    </div>
  );
};

export default Predict;
