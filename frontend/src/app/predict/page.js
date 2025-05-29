'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/navbar';
import AltPage from './altpage'; // Mengimpor komponen AltPage

const Predict = () => {
  const [inputs, setInputs] = useState(Array(30).fill('')); // Ubah dari fill('0') ke fill('')
  const [snr, setSnr] = useState('');
  const [isAltPageVisible, setIsAltPageVisible] = useState(false); // State untuk kontrol tampilan
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false); // State untuk menampilkan modal konfirmasi
  const router = useRouter();

  const handleInputChange = (index, value) => {
    // Validasi untuk memastikan format angka dengan maksimal 3 desimal
    if (value === '' || /^\d*\.?\d{0,3}$/.test(value)) {
      const newInputs = [...inputs];
      newInputs[index] = value;
      setInputs(newInputs);
    }
  };

  const handleSnrChange = (value) => {
    // Validasi untuk SNR dengan maksimal 3 desimal
    if (value === '' || /^\d*\.?\d{0,3}$/.test(value)) {
      setSnr(value);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validasi yang diperbaiki dengan support 3 desimal
    const hasEmptyInputs = inputs.some(input => input === '');
    const hasInvalidInputs = inputs.some(input => {
      if (input === '') return false;
      const numValue = parseFloat(input);
      return isNaN(numValue) || numValue < 0 || numValue > 10;
    });
    const hasInvalidSnr = snr === '' || isNaN(parseFloat(snr)) || parseFloat(snr) < 0 || parseFloat(snr) > 30;

    if (hasEmptyInputs || hasInvalidInputs || hasInvalidSnr) {
      alert("Please complete all inputs with valid values (P1-P30: 0-10, SNR: 0-30).");
      return;
    }

    // Tampilkan modal konfirmasi
    setIsConfirmModalVisible(true);
  };

  const handleConfirm = () => {
    // Simpan data prediksi ke localStorage
    const predictionData = {
      inputs: inputs,
      snr: snr,
      inputType: isAltPageVisible ? 'CSV/Excel' : 'Manual',
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString('en-GB'), // Format DD/MM/YYYY
      analysisTime: new Date().toLocaleString('en-GB')
    };

    // Simpan data untuk halaman result
    localStorage.setItem('currentPrediction', JSON.stringify(predictionData));

    // Tutup modal dan navigasi ke predict/results
    setIsConfirmModalVisible(false);
    router.push('/predict/results'); // PERBAIKAN: Ubah kembali ke '/predict/results'
  };

  const handleCancel = () => {
    // Jika dibatalkan, tutup modal konfirmasi
    setIsConfirmModalVisible(false);
  };

  const toggleAltPage = () => {
    setIsAltPageVisible(!isAltPageVisible); // Toggle antara input manual dan CSV upload
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-gradient-animation">
      <Navbar />
      
      {/* Background dengan overlay yang diperbaiki */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/predictbg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'fixed',
          filter: 'brightness(0.4)',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
      ></div>

      {/* Hero Section dengan design yang diperbaiki */}
      <div className="sm:text-4xl md:text-6xl lg:text-7xl mt-32 text-white font-bold text-center relative z-20 mb-8">
        <h1 className="drop-shadow-2xl">Predict Your Fiber Optic Network</h1>
        <p className="text-lg md:text-xl text-blue-200 font-light mt-4 max-w-2xl mx-auto px-4">
        </p>
      </div>

      <div className="absolute inset-0 w-full mt-28 animated-background bg-gradient-to-tl from-gray-800/80 via-neutral-800/80 to-indigo-800/80 z-0"></div>
      
      {/* Toggle Button dengan design yang diperbaiki */}
      <div className="text-center my-3 relative z-20">
        <button
          onClick={toggleAltPage}
          className="inline-flex items-center px-8 py-3 bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 transition-all duration-300 ease-in-out font-semibold text-lg rounded-full shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          {isAltPageVisible ? 'Use Manual Input' : 'Or Upload CSV'}
        </button>
      </div>

      {/* Kondisi untuk menampilkan input manual atau AltPage */}
      {isAltPageVisible ? (
        <AltPage /> // Komponen untuk upload CSV
      ) : (
        <div className="text-black relative z-20 w-full lg:w-4/5 xl:w-3/4 bg-white/95 backdrop-blur-lg py-8 px-8 rounded-2xl shadow-2xl mx-auto my-8 border border-white/20">
          {/* Header Section */}
          <div className="border-b border-gray-200 pb-6 mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
              <svg className="w-8 h-8 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Manual Input
            </h2>
            <p className="text-gray-600 text-base">
              Please enter values for P1 to P30 (0-10) with up to 3 decimal places, and SNR (0-30) with up to 3 decimal places.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Parameters Section */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-700 mb-6 flex items-center">
                <span className="w-2 h-6 bg-blue-500 rounded mr-3"></span>
                Parameters (P1-P30)
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[...Array(30).keys()].map(i => (
                  <div className="group" key={i}>
                    <label htmlFor={`P${i + 1}`} className="block text-sm font-semibold text-gray-700 mb-2">
                      {`P${i + 1}`}
                    </label>
                    <input
                      type="text"
                      id={`P${i + 1}`}
                      name={`P${i + 1}`}
                      value={inputs[i]}
                      onChange={(e) => handleInputChange(i, e.target.value)}
                      required
                      placeholder="0.000"
                      pattern="^\d*\.?\d{0,3}$"
                      title="Enter a number between 0-10 with up to 3 decimal places (e.g., 5.123)"
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 ease-in-out text-black bg-gray-50 hover:bg-white group-hover:border-gray-300"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* SNR Section */}
            <div className="mb-8 border-t pt-8">
              <h3 className="text-xl font-semibold text-gray-700 mb-6 flex items-center">
                <span className="w-2 h-6 bg-green-500 rounded mr-3"></span>
                Signal-to-Noise Ratio
              </h3>
              
              <div className="max-w-xs">
                <label htmlFor="snr" className="block text-sm font-semibold text-gray-700 mb-2">
                  SNR
                </label>
                <input
                  type="text"
                  id="snr"
                  value={snr}
                  onChange={(e) => handleSnrChange(e.target.value)}
                  required
                  placeholder="0.000"
                  pattern="^\d*\.?\d{0,3}$"
                  title="Enter SNR value between 0-30 with up to 3 decimal places (e.g., 25.123)"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-300 ease-in-out text-black bg-gray-50 hover:bg-white"
                />
              </div>
            </div>

            {/* Button Predict dengan design yang diperbaiki */}
            <div className="flex justify-center mt-8 pt-6 border-t">
              <button
                type="submit"
                className="group relative px-12 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg font-semibold rounded-xl transition-all duration-300 ease-in-out hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-green-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Start Prediction
                </span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Konfirmasi dengan scrollbar yang tetap di dalam kotak */}
      {isConfirmModalVisible && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full h-[600px] flex flex-col">
            {/* Modal Header - Fixed */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 rounded-t-2xl flex-shrink-0">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Confirm Your Data
              </h2>
              <p className="text-blue-100 mt-1">Please review your input values before proceeding</p>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">P1 to P30 Values:</h3>
                <div className="grid grid-cols-5 gap-3 mb-6 bg-gray-50 p-4 rounded-lg">
                  {inputs.map((input, index) => (
                    <div key={index} className="text-center bg-white p-2 rounded border">
                      <div className="text-xs text-gray-500 mb-1">P{index + 1}</div>
                      <div className="font-semibold text-gray-800 text-sm">
                        {input || 'Empty'}
                      </div>
                    </div>
                  ))}
                </div>
                
                <h3 className="text-lg font-semibold text-gray-800 mb-2">SNR:</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <span className="text-xl font-bold text-gray-800">{snr || 'Empty'}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer - Fixed */}
            <div className="flex-shrink-0 p-8 pt-0">
              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium"
                >
                  Edit Data
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-medium shadow-lg"
                >
                  Confirm & Predict
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Predict;
