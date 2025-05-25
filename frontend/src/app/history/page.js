'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/navbar';

const History = () => {
  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Simulasi data history - dalam implementasi nyata, ambil dari API atau localStorage
    const mockHistoryData = [
      {
        id: 1,
        date: '21/05/2025',
        inputType: 'Manual',
        result: 'Normal',
        inputs: Array.from({length: 30}, (_, i) => (Math.random() * 10).toFixed(1)),
        snr: (Math.random() * 30).toFixed(1),
        confidence: (Math.random() * 20 + 80).toFixed(1),
        analysisTime: '21/05/2025, 14:30:25'
      },
      {
        id: 2,
        date: '21/05/2025',
        inputType: 'CSV',
        result: 'Fiber Cut',
        inputs: Array.from({length: 30}, (_, i) => (Math.random() * 10).toFixed(1)),
        snr: (Math.random() * 30).toFixed(1),
        confidence: (Math.random() * 20 + 80).toFixed(1),
        analysisTime: '21/05/2025, 16:45:12'
      },
      {
        id: 3,
        date: '20/05/2025',
        inputType: 'Manual',
        result: 'Signal Degradation',
        inputs: Array.from({length: 30}, (_, i) => (Math.random() * 10).toFixed(1)),
        snr: (Math.random() * 30).toFixed(1),
        confidence: (Math.random() * 20 + 80).toFixed(1),
        analysisTime: '20/05/2025, 09:15:33'
      }
    ];

    // Simulasi loading
    setTimeout(() => {
      setHistoryData(mockHistoryData);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleViewDetail = (historyItem) => {
    // Simpan data ke localStorage untuk diakses di halaman detail
    localStorage.setItem('historyDetail', JSON.stringify(historyItem));
    router.push(`/history/detail/${historyItem.id}`);
  };

  const getResultColor = (result) => {
    switch (result) {
      case 'Normal':
        return 'text-green-600 bg-green-100';
      case 'Fiber Cut':
        return 'text-red-600 bg-red-100';
      case 'Signal Degradation':
        return 'text-yellow-600 bg-yellow-100';
      case 'Power Loss':
        return 'text-orange-600 bg-orange-100';
      case 'Connector Issue':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-gradient-animation">
      <Navbar />
      
      {/* Background Image */}
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

      {/* Title */}
      <div className="sm:text-4xl md:text-6xl lg:text-7xl mt-32 text-white font-bold text-center relative z-20">
        <h1>OpticPredict</h1>
      </div>

      {/* Animated Background Overlay */}
      <div className="absolute inset-0 w-full mt-28 animated-background bg-gradient-to-tl from-gray-800 via-neutral-800 to-indigo-800 z-0"></div>
      
      {/* Main Content */}
      <div className="text-black relative z-20 w-full lg:w-4/5 bg-white py-6 px-8 rounded-lg shadow-lg mx-auto my-8">
        <h2 className="text-3xl font-bold mb-6 text-left">Prediction History</h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-lg text-gray-600">Loading history...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-400">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 px-4 py-3 text-left font-semibold">No</th>
                  <th className="border border-gray-400 px-4 py-3 text-left font-semibold">Tanggal</th>
                  <th className="border border-gray-400 px-4 py-3 text-left font-semibold">Input Type</th>
                  <th className="border border-gray-400 px-4 py-3 text-left font-semibold">Hasil Gangguan</th>
                  <th className="border border-gray-400 px-4 py-3 text-center font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {historyData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="border border-gray-400 px-4 py-3 text-center font-medium">
                      {index + 1}
                    </td>
                    <td className="border border-gray-400 px-4 py-3">
                      {item.date}
                    </td>
                    <td className="border border-gray-400 px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        item.inputType === 'Manual' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {item.inputType}
                      </span>
                    </td>
                    <td className="border border-gray-400 px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getResultColor(item.result)}`}>
                        {item.result}
                      </span>
                    </td>
                    <td className="border border-gray-400 px-4 py-3 text-center">
                      <button
                        onClick={() => handleViewDetail(item)}
                        className="px-4 py-2 bg-green-500 text-white text-sm rounded-md transition-all duration-300 ease-in-out hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-md"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {historyData.length === 0 && (
              <div className="text-center py-20 text-gray-500">
                <p className="text-xl">No prediction history found</p>
                <p className="text-sm mt-2">Start making predictions to see your history here</p>
              </div>
            )}
          </div>
        )}

        {/* Back Button */}
        <div className="flex justify-center mt-8">
          <button
            onClick={() => router.push('/predict')}
            className="px-8 py-3 bg-blue-500 text-white text-lg rounded-md transition-all duration-400 ease-in-out hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg"
          >
            Back to Predict
          </button>
        </div>
      </div>
    </div>
  );
};

export default History;
