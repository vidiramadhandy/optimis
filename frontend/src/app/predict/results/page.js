'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/navbar';

const Results = () => {
  const [inputs, setInputs] = useState(Array(30).fill(''));
  const [snr, setSnr] = useState('');
  const [predictionResult, setPredictionResult] = useState('');
  const [confidence, setConfidence] = useState('');
  const [inputType, setInputType] = useState('');
  const [analysisTime, setAnalysisTime] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Ambil data dari localStorage yang disimpan dari halaman predict
    const currentPrediction = localStorage.getItem('currentPrediction');
    
    if (currentPrediction) {
      const predictionData = JSON.parse(currentPrediction);
      
      // Set data input dari predict
      setInputs(predictionData.inputs);
      setSnr(predictionData.snr);
      setInputType(predictionData.inputType);
      setAnalysisTime(predictionData.analysisTime);
      
      // Simulasi prediksi berdasarkan data input
      setTimeout(() => {
        // Simulasi algoritma prediksi berdasarkan nilai input
        const predictions = ['Fiber Cut', 'Normal Operation', 'Signal Degradation', 'Power Loss', 'Connector Issue'];
        
        // Simulasi logika prediksi berdasarkan nilai SNR dan parameter
        let prediction;
        const snrValue = parseFloat(predictionData.snr);
        const avgParams = predictionData.inputs.reduce((sum, val) => sum + parseFloat(val), 0) / 30;
        
        if (snrValue < 10 || avgParams < 3) {
          prediction = 'Fiber Cut';
        } else if (snrValue > 25 && avgParams > 7) {
          prediction = 'Normal Operation';
        } else if (snrValue < 15) {
          prediction = 'Signal Degradation';
        } else if (avgParams < 4) {
          prediction = 'Power Loss';
        } else {
          prediction = 'Connector Issue';
        }
        
        setPredictionResult(prediction);
        
        // Generate confidence level berdasarkan konsistensi data
        const confidenceLevel = Math.min(95, Math.max(75, 85 + (snrValue / 30) * 10));
        setConfidence(confidenceLevel.toFixed(1));
        
        // Update history dengan hasil prediksi
        const existingHistory = JSON.parse(localStorage.getItem('predictionHistory') || '[]');
        if (existingHistory.length > 0) {
          existingHistory[0].result = prediction;
          existingHistory[0].confidence = confidenceLevel.toFixed(1);
          localStorage.setItem('predictionHistory', JSON.stringify(existingHistory));
        }
        
        setIsLoading(false);
      }, 2000);
    } else {
      // Jika tidak ada data, redirect ke predict
      router.push('/predict');
    }
  }, [router]);

  const handleBackToPredict = () => {
    router.push('/predict');
  };

  const handleHistory = () => {
    router.push('/history');
  };

  const getRecommendation = (result) => {
    switch (result) {
      case 'Fiber Cut':
        return 'Immediate maintenance required. Check physical cable connections.';
      case 'Normal Operation':
        return 'Network is operating within normal parameters.';
      case 'Signal Degradation':
        return 'Monitor signal quality and consider preventive maintenance.';
      case 'Power Loss':
        return 'Check power supply and backup systems.';
      case 'Connector Issue':
        return 'Inspect and clean fiber optic connectors.';
      default:
        return 'Please consult with technical team for further analysis.';
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
        <h1>Optic Predict</h1>
      </div>

      {/* Animated Background Overlay */}
      <div className="absolute inset-0 w-full mt-28 animated-background bg-gradient-to-tl from-gray-800 via-neutral-800 to-indigo-800 z-0"></div>
      
      {/* Main Content */}
      <div className="text-black relative z-20 w-full lg:w-4/5 bg-white py-6 px-8 rounded-lg shadow-lg mx-auto my-8">
        
        {/* Prediction Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-bold mb-3">Prediction Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">Input Type:</span> 
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                inputType === 'Manual' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-purple-100 text-purple-800'
              }`}>
                {inputType}
              </span>
            </div>
            <div>
              <span className="font-semibold">Analysis Time:</span> {analysisTime}
            </div>
          </div>
        </div>

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
                      <strong>Confidence Level:</strong> {confidence}%
                    </p>
                    <p className="mb-2">
                      <strong>Analysis Time:</strong> {analysisTime}
                    </p>
                    <p>
                      <strong>Recommendation:</strong> {getRecommendation(predictionResult)}
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
            onClick={handleHistory}
            className="px-8 py-3 bg-gray-500 text-white text-lg rounded-md transition-all duration-400 ease-in-out hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 shadow-lg"
          >
            History
          </button>
        </div>
      </div>
    </div>
  );
};

export default Results;
