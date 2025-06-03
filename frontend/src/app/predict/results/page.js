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
  const [historySaved, setHistorySaved] = useState(false); // Prevent double save
  const router = useRouter();

  useEffect(() => {
    // Get data from localStorage saved from predict page
    const currentPrediction = localStorage.getItem('currentPrediction');
    
    if (currentPrediction) {
      const predictionData = JSON.parse(currentPrediction);
      
      // Set input data from predict
      setInputs(predictionData.inputs);
      setSnr(predictionData.snr);
      setInputType(predictionData.inputType);
      setAnalysisTime(predictionData.analysisTime);
      
      // Simulate prediction based on input data
      setTimeout(() => {
        // Prediction logic simulation based on SNR values and parameters
        let prediction;
        const snrValue = parseFloat(predictionData.snr);
        const avgParams = predictionData.inputs.reduce((sum, val) => sum + parseFloat(val || 0), 0) / 30;
        const maxParam = Math.max(...predictionData.inputs.map(val => parseFloat(val || 0)));
        const minParam = Math.min(...predictionData.inputs.map(val => parseFloat(val || 0)));
        const paramVariance = maxParam - minParam;
        
        console.log('Debug values:', {
          snrValue,
          avgParams,
          maxParam,
          minParam,
          paramVariance
        });

        // IMPROVED prediction logic with more balanced conditions
        if (snrValue > 25 && avgParams > 7 && paramVariance < 2) {
          prediction = 'Normal';
        } else if (snrValue < 5 || avgParams < 1) {
          prediction = 'Fiber Cut';
        } else if (snrValue >= 5 && snrValue < 12 && paramVariance > 4) {
          prediction = 'Bad Splice';
        } else if (snrValue >= 12 && snrValue < 18 && avgParams < 5) {
          prediction = 'Bending';
        } else if (snrValue >= 10 && snrValue < 20 && maxParam < 4) {
          prediction = 'Dirty Connector';
        } else if (snrValue >= 18 && snrValue <= 25 && paramVariance > 6) {
          prediction = 'Fiber Tapping';
        } else if (snrValue >= 8 && snrValue < 15 && avgParams >= 5 && avgParams <= 7) {
          prediction = 'PC Connector';
        } else if (snrValue >= 15 && snrValue < 25 && paramVariance >= 3 && paramVariance <= 6) {
          prediction = 'Reflector';
        } else {
          // Fallback logic based on ranges
          if (snrValue < 10) {
            prediction = avgParams < 3 ? 'Fiber Cut' : 'Bad Splice';
          } else if (snrValue < 20) {
            if (avgParams < 4) {
              prediction = 'Bending';
            } else if (maxParam < 4) {
              prediction = 'Dirty Connector';
            } else {
              prediction = 'PC Connector';
            }
          } else {
            prediction = paramVariance > 5 ? 'Fiber Tapping' : 'Reflector';
          }
        }
        
        console.log('Final prediction:', prediction);
        setPredictionResult(prediction);
        
        // Generate confidence level based on data consistency
        const confidenceLevel = Math.min(95, Math.max(75, 85 + (snrValue / 30) * 10));
        setConfidence(confidenceLevel.toFixed(1));
        
        // Save to history only once
        if (!historySaved) {
          saveToHistory(predictionData, prediction, confidenceLevel.toFixed(1));
          setHistorySaved(true);
        }
        
        setIsLoading(false);
      }, 2000);
    } else {
      // If no data, redirect to predict
      router.push('/predict');
    }
  }, [router, historySaved]);

  // Function to save to history (prevent duplicates)
  const saveToHistory = (inputData, result, confidenceLevel) => {
    const historyItem = {
      id: Date.now(),
      date: new Date().toLocaleDateString('en-GB'), // Format DD/MM/YYYY
      inputType: inputData.inputType,
      result: result,
      confidence: confidenceLevel,
      inputs: inputData.inputs,
      snr: inputData.snr,
      timestamp: new Date().toISOString()
    };
    
    // Get existing history
    const existingHistory = JSON.parse(localStorage.getItem('predictionHistory') || '[]');
    
    // Check if this prediction already exists (prevent duplicates)
    const isDuplicate = existingHistory.some(item => 
      item.timestamp === historyItem.timestamp || 
      (Math.abs(new Date(item.timestamp) - new Date(historyItem.timestamp)) < 5000) // 5 seconds tolerance
    );
    
    if (!isDuplicate) {
      // Add new item at the beginning of array
      const updatedHistory = [historyItem, ...existingHistory];
      
      // Limit history to maximum 50 items
      const limitedHistory = updatedHistory.slice(0, 50);
      
      // Save back to localStorage
      localStorage.setItem('predictionHistory', JSON.stringify(limitedHistory));
      console.log('History saved successfully');
    } else {
      console.log('Duplicate entry prevented');
    }
  };

  const handleBackToPredict = () => {
    // Clear current prediction to prevent reuse
    localStorage.removeItem('currentPrediction');
    router.push('/predict');
  };

  const handleHistory = () => {
    router.push('/history');
  };

  const getMaintenanceRecommendation = (result) => {
    switch (result) {
      case 'Normal':
        return 'Perform routine maintenance every 6 months. Monitor network parameters regularly and conduct preventive connector cleaning.';
      
      case 'Fiber Tapping':
        return 'Immediately conduct physical inspection along the cable route. Check for unauthorized devices attached to the cable. Enhance physical security and real-time monitoring.';
      
      case 'Bad Splice':
        return 'Identify splice location using OTDR. Perform re-splicing with calibrated fusion splicer. Ensure cleaving angle <1° and splice loss <0.1dB.';
      
      case 'Bending':
        return 'Check minimum bend radius (>30mm for single mode). Reposition cable with proper cable management. Use bend-insensitive fiber if necessary.';
      
      case 'Dirty Connector':
        return 'Clean end-face using lint-free wipes and 99% IPA. Inspect with fiber microscope (400x magnification). Ensure no contaminants on core area.';
      
      case 'Fiber Cut':
        return 'Localize break point with OTDR. Perform emergency splicing or install temporary patch cable. For permanent repair, use fusion splicing with protective sleeve.';
      
      case 'PC Connector':
        return 'Check physical contact on end-face. Perform re-polishing if necessary. Ensure insertion loss <0.3dB and return loss >40dB. Replace connector if permanently damaged.';
      
      case 'Reflector':
        return 'Identify reflection source using OTDR trace analysis. Check for APC/PC connector mismatch. Install optical isolator if needed to reduce back-reflection.';
      
      default:
        return 'Conduct in-depth analysis with technical team. Use combination of OTDR, power meter, and visual fault locator for comprehensive diagnosis.';
    }
  };

  const getPredictionColor = (result) => {
    switch (result) {
      case 'Normal':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Fiber Tapping':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Bad Splice':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Bending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Dirty Connector':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Fiber Cut':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'PC Connector':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'Reflector':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
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
        <h1>OptiPredict</h1>
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
          
          {/* Grid for P1-P30 */}
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
          
          <div className="border-2 border-gray-300 p-6 rounded-lg bg-gray-50">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Fault Type:</h3>
              
              {isLoading ? (
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-lg text-gray-600">Processing prediction...</span>
                </div>
              ) : (
                <div className={`text-2xl font-bold p-4 rounded-lg border-2 ${getPredictionColor(predictionResult)}`}>
                  {predictionResult}
                </div>
              )}
            </div>
            
            {!isLoading && (
              <div className="border-2 border-gray-300 p-4 rounded-lg bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="font-semibold text-gray-700">Confidence Level:</span>
                    <span className="ml-2 text-lg font-bold text-blue-600">{confidence}%</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Analysis Time:</span>
                    <span className="ml-2">{analysisTime}</span>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-bold text-gray-700 mb-2">Maintenance Recommendation:</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {getMaintenanceRecommendation(predictionResult)}
                  </p>
                </div>
              </div>
            )}
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
