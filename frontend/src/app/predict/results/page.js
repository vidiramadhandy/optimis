'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/navbar';

const Results = () => {
  const [inputs, setInputs] = useState(Array(30).fill(''));
  const [snr, setSnr] = useState('');
  const [predictionResult, setPredictionResult] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Simulasi pengambilan data dari localStorage atau props
    // Dalam implementasi nyata, data ini bisa didapat dari API atau state management
    const mockInputs = Array.from({length: 30}, (_, i) => (Math.random() * 10).toFixed(1));
    const mockSnr = (Math.random() * 30).toFixed(1);
    
    setInputs(mockInputs);
    setSnr(mockSnr);
    
    // Simulasi prediksi - ganti dengan API call yang sebenarnya
    setTimeout(() => {
      const predictions = ['Fiber Cut', 'Normal Operation', 'Signal Degradation', 'Power Loss', 'Connector Issue'];
      const randomPrediction = predictions[Math.floor(Math.random() * predictions.length)];
      setPredictionResult(randomPrediction);
      setIsLoading(false);
    }, 2000);
  }, []);

  const handleBackToPredict = () => {
    router.push('/predict');
  };

  const handleHome = () => {
    router.push('/');
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
        <h1>Optic Predict</h1>
      </div>

      {/* Animated Background Overlay */}
      <div className="absolute inset-0 w-full mt-28 animated-background bg-gradient-to-tl from-gray-800 via-neutral-800 to-indigo-800 z-0"></div>
      
      {/* Main Content */}
      <div className="text-black relative z-20 w-full lg:w-4/5 bg-white py-6 px-8 rounded-lg shadow-lg mx-auto my-8">
        
        {/* Input Values Display */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-left">Input Values</h2>
          
          {/* Grid untuk P1-P30 */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            {inputs.map((input, index) => (
              <div key={index} className="border border-gray-300 p-3 rounded-md text-center bg-gray-50">
                <div className="text-sm font-medium text-gray-600 mb-1">P{index + 1}</div>
                <div className="text-lg font-semibold text-black">
                  {isLoading ? '...' : input}
                </div>
              </div>
            ))}
            
            {/* SNR Box */}
            <div className="border border-gray-300 p-3 rounded-md text-center bg-gray-50">
              <div className="text-sm font-medium text-gray-600 mb-1">SNR</div>
              <div className="text-lg font-semibold text-black">
                {isLoading ? '...' : snr}
              </div>
            </div>
          </div>
        </div>

        {/* Prediction Result */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-left">Prediction Result</h2>
          
          <div className="border-2 border-gray-400 p-6 rounded-lg bg-gray-50 min-h-[200px] flex flex-col justify-center">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Gangguan:</h3>
              
              {isLoading ? (
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-lg text-gray-600">Processing prediction...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`text-3xl font-bold p-4 rounded-lg ${
                    predictionResult === 'Fiber Cut' ? 'bg-red-100 text-red-800' :
                    predictionResult === 'Normal Operation' ? 'bg-green-100 text-green-800' :
                    predictionResult === 'Signal Degradation' ? 'bg-yellow-100 text-yellow-800' :
                    predictionResult === 'Power Loss' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {predictionResult}
                  </div>
                  
                  {/* Additional Information */}
                  <div className="text-sm text-gray-600 mt-4 p-4 bg-white rounded border">
                    <p className="mb-2">
                      <strong>Confidence Level:</strong> {(Math.random() * 20 + 80).toFixed(1)}%
                    </p>
                    <p className="mb-2">
                      <strong>Analysis Time:</strong> {new Date().toLocaleString()}
                    </p>
                    <p>
                      <strong>Recommendation:</strong> 
                      {predictionResult === 'Fiber Cut' && ' Immediate maintenance required. Check physical cable connections.'}
                      {predictionResult === 'Normal Operation' && ' Network is operating within normal parameters.'}
                      {predictionResult === 'Signal Degradation' && ' Monitor signal quality and consider preventive maintenance.'}
                      {predictionResult === 'Power Loss' && ' Check power supply and backup systems.'}
                      {predictionResult === 'Connector Issue' && ' Inspect and clean fiber optic connectors.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handleBackToPredict}
            className="px-8 py-3 bg-blue-500 text-white text-lg rounded-md transition-all duration-400 ease-in-out hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg"
          >
            Predict Again
          </button>
          
          <button
            onClick={handleHome}
            className="px-8 py-3 bg-gray-500 text-white text-lg rounded-md transition-all duration-400 ease-in-out hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 shadow-lg"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Results;
