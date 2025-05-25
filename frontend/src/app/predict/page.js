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
    const newInputs = [...inputs];
    newInputs[index] = value;
    setInputs(newInputs);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validasi yang diperbaiki
    const hasEmptyInputs = inputs.some(input => input === '');
    const hasInvalidInputs = inputs.some(input => input !== '' && (parseFloat(input) < 0 || parseFloat(input) > 10));
    const hasInvalidSnr = snr === '' || parseFloat(snr) < 0 || parseFloat(snr) > 30;

    if (hasEmptyInputs || hasInvalidInputs || hasInvalidSnr) {
      alert("Silakan lengkapi semua input dengan nilai yang valid.");
      return;
    }

    // Tampilkan modal konfirmasi
    setIsConfirmModalVisible(true);
  };

  const handleConfirm = () => {
    // Jika data sudah dikonfirmasi, arahkan ke halaman hasil
    setIsConfirmModalVisible(false);
    router.push('/results');
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

      <div className="sm:text-4xl md:text-6xl lg:text-7xl mt-64 text-white font-bold text-center relative z-20">
        <h1>Predict Your Fiber Optic Network</h1>
      </div>

      <div className="absolute inset-0 w-full mt-56 animated-background bg-gradient-to-tl from-gray-800 via-neutral-800 to-indigo-800 z-0"></div>
      
      {/* Hyperlink untuk memilih antara input manual atau upload CSV */}
      <div className="text-center my-4 relative z-20">
        <a
          href="#"
          onClick={toggleAltPage}
          className="text-white hover:text-blue-500 transition-all duration-500 ease-in-out font-semibold text-xl"
        >
          {isAltPageVisible ? 'Use Manual Input' : 'Or Upload CSV'}
        </a>
      </div>

      {/* Kondisi untuk menampilkan input manual atau AltPage */}
      {isAltPageVisible ? (
        <AltPage /> // Komponen untuk upload CSV
      ) : (
        <div className="text-black relative z-20 w-full lg:w-2/3 bg-white py-4 px-8 rounded-lg shadow-lg mx-auto my-8">
          <h2 className="text-3xl font-bold mb-2 text-left">Input</h2>
          <p className="text-gray-500 text-sm mt-2">
            Please enter values for P1 to P30. These values should be between 0 and 10, and SNR should be between 0 and 30.
          </p>

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
                    min="0"
                    max="10"
                    step="0.1"
                    placeholder="0-10"
                    className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all duration-300 ease-in-out text-black"
                  />
                </div>
              ))}

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
                  min="0"
                  max="30"
                  step="0.1"
                  placeholder="0-30"
                  className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all duration-300 ease-in-out text-black"
                />
              </div>
            </div>

            {/* Button Predict centered */}
            <div className="flex justify-center mt-4">
              <button
                type="submit"
                className="w-1/4 p-3 bg-green-500 text-white text-lg rounded-md transition-all duration-400 ease-in-out hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-2xl cursor-pointer"
              >
                Predict!
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Konfirmasi */}
      {isConfirmModalVisible && (
        <div className="fixed inset-0 bg-gray-700 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-black">Confirm Your Data</h2>
            <div className="mb-4">
              <h3 className="text-lg text-black">P1 to P30 Values:</h3>
              <div className="grid grid-cols-3 gap-4 mb-8">
                {/* Menampilkan nilai P1 sampai P30 dalam grid */}
                {inputs.map((input, index) => (
                  <div key={index} className="text-center text-black">
                    <span>P{index + 1}: {input || 'Empty'}</span>
                  </div>
                ))}
              </div>
              <h3 className="text-lg mt-4 text-black">SNR:</h3>
              <pre className="text-black">{snr || 'Empty'}</pre>
            </div>
            <div className="flex justify-between">
              <button
                onClick={handleCancel}
                className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-700"
              >
                Edit Data
              </button>
              <button
                onClick={handleConfirm}
                className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-emerald-600"
              >
                Predict
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Predict;
