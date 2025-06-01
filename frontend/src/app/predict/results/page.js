// frontend/src/app/predict/results/page.js - KODE LENGKAP DENGAN PERBAIKAN
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/useAuth';
import Navbar from '@/components/navbar';

const Results = () => {
  const [inputs, setInputs] = useState(Array(30).fill(''));
  const [snr, setSnr] = useState('');
  const [predictionResult, setPredictionResult] = useState('');
  const [confidence, setConfidence] = useState('');
  const [qualityAssessment, setQualityAssessment] = useState('');
  const [inputType, setInputType] = useState('');
  const [analysisTime, setAnalysisTime] = useState('');
  const [databaseData, setDatabaseData] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authStatus, setAuthStatus] = useState('checking');
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Gunakan useAuth hook
  const { isAuthenticated, isCheckingAuth, user } = useAuth();

  // PERBAIKAN: Fungsi untuk konversi confidence yang lebih robust
  const convertConfidenceToPercentage = (confidenceValue) => {
    console.log('🔍 Original confidence value:', confidenceValue, 'Type:', typeof confidenceValue);
    
    if (!confidenceValue && confidenceValue !== 0) return '0.0';
    
    let numValue = parseFloat(confidenceValue);
    
    // Jika nilai NaN, return 0
    if (isNaN(numValue)) return '0.0';
    
    // PERBAIKAN: Jika nilai dalam format desimal (0-1), konversi ke persentase
    if (numValue >= 0 && numValue <= 1) {
      const percentage = (numValue * 100).toFixed(1);
      console.log('✅ Converted decimal to percentage:', percentage);
      return percentage;
    }
    
    // Jika nilai sudah dalam format persentase (> 1 dan <= 100), gunakan langsung
    if (numValue > 1 && numValue <= 100) {
      const percentage = numValue.toFixed(1);
      console.log('✅ Already percentage format:', percentage);
      return percentage;
    }
    
    // Jika nilai > 100, kemungkinan sudah dalam format persentase tapi salah
    if (numValue > 100) {
      const percentage = (numValue / 100).toFixed(1);
      console.log('✅ Converted large number to percentage:', percentage);
      return percentage;
    }
    
    // Fallback
    return '0.0';
  };

  // PERBAIKAN: Fungsi untuk mendapatkan warna confidence yang lebih baik
  const getConfidenceColor = (confidencePercentage) => {
    const numValue = parseFloat(confidencePercentage);
    if (numValue >= 95) return 'text-green-600 font-bold';
    if (numValue >= 90) return 'text-green-500 font-bold';
    if (numValue >= 80) return 'text-blue-600 font-bold';
    if (numValue >= 70) return 'text-yellow-600 font-bold';
    if (numValue >= 50) return 'text-orange-600 font-bold';
    return 'text-red-600 font-bold';
  };

  // PERBAIKAN: Fungsi untuk mendapatkan label confidence
  const getConfidenceLabel = (confidencePercentage) => {
    const numValue = parseFloat(confidencePercentage);
    if (numValue >= 95) return 'Excellent';
    if (numValue >= 90) return 'Very High';
    if (numValue >= 80) return 'High';
    if (numValue >= 70) return 'Good';
    if (numValue >= 50) return 'Medium';
    return 'Low';
  };

  // Pastikan komponen sudah mounted (client-side)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Cek autentikasi dan load data
  useEffect(() => {
    if (!mounted) return;

    const checkAuthAndLoadData = async () => {
      try {
        console.log('🔍 Starting auth check for results page...');
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const token = localStorage.getItem('auth_token');
        console.log('Token exists in localStorage:', !!token);
        
        if (!token) {
          console.log('❌ No token found, setting unauthenticated');
          setAuthStatus('unauthenticated');
          return;
        }

        console.log('🔍 Verifying token with backend...');
        const response = await fetch('http://localhost:5000/api/auth/check', {
          method: 'GET',
          headers: {
            'x-access-token': token,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          
          if (result.authenticated) {
            console.log('✅ User authenticated successfully');
            setAuthStatus('authenticated');
            await loadPredictionResults(token);
          } else {
            localStorage.removeItem('auth_token');
            setAuthStatus('unauthenticated');
          }
        } else {
          localStorage.removeItem('auth_token');
          setAuthStatus('unauthenticated');
        }
      } catch (error) {
        console.error('❌ Error during auth check:', error);
        setAuthStatus('unauthenticated');
      }
    };

    if (!isCheckingAuth && mounted) {
      checkAuthAndLoadData();
    }
  }, [isCheckingAuth, mounted]);

  // Handle redirect setelah auth status diketahui
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      console.log('🔄 Redirecting to login...');
      router.push('/login');
    }
  }, [authStatus, router]);

  const loadPredictionResults = async (token) => {
    try {
      // Ambil data dari localStorage
      const currentPrediction = localStorage.getItem('currentPrediction');
      
      if (currentPrediction) {
        const predictionData = JSON.parse(currentPrediction);
        console.log('📊 Loading prediction data:', predictionData);
        
        // Set data dari localStorage terlebih dahulu
        setInputs(predictionData.inputs || Array(30).fill(''));
        setSnr(predictionData.snr || '');
        setInputType(predictionData.inputType || 'Manual');
        setAnalysisTime(predictionData.analysisTime || new Date().toLocaleString('id-ID'));
        setPredictionResult(predictionData.result || '');
        
        // PERBAIKAN: Konversi confidence dari localStorage dengan logging detail
        const rawConfidence = predictionData.confidence;
        console.log('🔍 Raw confidence from localStorage:', rawConfidence);
        const convertedConfidence = convertConfidenceToPercentage(rawConfidence);
        console.log('✅ Final converted confidence:', convertedConfidence);
        setConfidence(convertedConfidence);
        
        setQualityAssessment(predictionData.qualityAssessment || '');
        setUserInfo(predictionData.userInfo || user);
        
        // Jika ada ID dan fromHistory, ambil data dari database
        if (predictionData.id && predictionData.fromHistory) {
          await fetchDatabaseData(predictionData.id, token);
        } else {
          setIsLoading(false);
        }
      } else {
        console.log('❌ No prediction data found, redirecting to predict');
        router.push('/predict');
      }
    } catch (error) {
      console.error('Error loading prediction results:', error);
      setError('Gagal memuat hasil prediksi');
      setIsLoading(false);
    }
  };

  const fetchDatabaseData = async (predictionId, token) => {
    try {
      console.log('🔍 Fetching database data for prediction ID:', predictionId);
      
      const response = await fetch(`http://localhost:5000/api/prediction/${predictionId}`, {
        method: 'GET',
        headers: {
          'x-access-token': token,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Database data loaded:', result);
        
        if (result.success && result.data) {
          setDatabaseData(result.data);
          
          // Update state dengan data dari database
          const dbData = result.data;
          
          // Ambil input parameters dari database
          const dbInputs = [];
          for (let i = 1; i <= 30; i++) {
            dbInputs.push(dbData[`p${i}`] || '0');
          }
          setInputs(dbInputs);
          setSnr(dbData.snr || '');
          
          // Ambil hasil prediksi dari database
          if (dbData.prediction_result) {
            const predResult = typeof dbData.prediction_result === 'string' 
              ? JSON.parse(dbData.prediction_result) 
              : dbData.prediction_result;
            setPredictionResult(predResult.prediction || '');
          }
          
          // PERBAIKAN: Konversi confidence dari database dengan logging detail
          const dbConfidenceScore = dbData.confidence_score || 0;
          console.log('🔍 Raw confidence from database:', dbConfidenceScore);
          const convertedDbConfidence = convertConfidenceToPercentage(dbConfidenceScore);
          console.log('✅ Final converted database confidence:', convertedDbConfidence);
          setConfidence(convertedDbConfidence);
          
          setQualityAssessment(dbData.quality_assessment || '');
          setInputType(dbData.input_type || 'Manual');
          
          if (dbData.created_at) {
            setAnalysisTime(new Date(dbData.created_at).toLocaleString('id-ID'));
          }
        }
      } else {
        console.log('❌ Failed to fetch database data:', response.status);
      }
    } catch (error) {
      console.error('Error fetching database data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToPredict = () => {
    router.push('/predict');
  };

  const handleHistory = () => {
    router.push('/history');
  };

  const getRecommendation = (result) => {
    switch (result) {
      case 'Normal':
        return 'Network is operating within normal parameters. Continue regular monitoring.';
      case 'Fiber Tapping':
        return 'Potential security breach detected. Immediate investigation required.';
      case 'Bad Splice':
        return 'Splice connection issue detected. Schedule maintenance to repair splice.';
      case 'Bending Event':
        return 'Fiber bending detected. Check cable routing and support structures.';
      case 'Dirty Connector':
        return 'Connector contamination detected. Clean connectors and inspect connections.';
      case 'Fiber Cut':
        return 'Fiber break detected. Immediate repair required to restore service.';
      case 'PC Connector':
        return 'PC connector issue detected. Inspect and replace connector if necessary.';
      case 'Reflector':
        return 'Reflection event detected. Check for improper terminations or connections.';
      default:
        return 'Please consult with technical team for further analysis.';
    }
  };

  const getQualityColor = (quality) => {
    switch (quality?.toLowerCase()) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPredictionColor = (result) => {
    switch (result) {
      case 'Normal': return 'bg-green-100 text-green-800';
      case 'Fiber Tapping': return 'bg-red-100 text-red-800';
      case 'Bad Splice': return 'bg-orange-100 text-orange-800';
      case 'Bending Event': return 'bg-yellow-100 text-yellow-800';
      case 'Dirty Connector': return 'bg-purple-100 text-purple-800';
      case 'Fiber Cut': return 'bg-red-100 text-red-800';
      case 'PC Connector': return 'bg-blue-100 text-blue-800';
      case 'Reflector': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Loading state
  if (!mounted || isCheckingAuth || authStatus === 'checking' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {authStatus === 'checking' ? 'Checking authentication...' : 'Loading prediction results from database...'}
          </p>
        </div>
      </div>
    );
  }

  // Jika tidak terautentikasi, jangan render komponen
  if (authStatus === 'unauthenticated') {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ {error}</div>
          <button
            onClick={() => router.push('/predict')}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Back to Predict
          </button>
        </div>
      </div>
    );
  }

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
        <h1>Prediction Results</h1>
        {userInfo && (
          <p className="text-lg md:text-xl text-blue-200 font-light mt-4">
            Analysis for: {userInfo.name || user?.name}
          </p>
        )}
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
            {databaseData && (
              <>
                <div>
                  <span className="font-semibold">Prediction ID:</span> #{databaseData.id}
                </div>
                <div>
                  <span className="font-semibold">Model Version:</span> {databaseData.model_version}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Prediction Result Summary */}
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <h2 className="text-2xl font-bold mb-4 text-center">🎯 Analysis Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Prediction Result */}
            <div className="text-center p-4 bg-white rounded-lg shadow">
              <div className="text-sm font-medium text-gray-600 mb-2">Prediction Result</div>
              <div className={`text-xl font-bold p-3 rounded-lg ${getPredictionColor(predictionResult)}`}>
                {predictionResult || 'Processing...'}
              </div>
            </div>

            {/* PERBAIKAN: Confidence Score dengan konversi yang benar dan styling yang lebih baik */}
            <div className="text-center p-4 bg-white rounded-lg shadow">
              <div className="text-sm font-medium text-gray-600 mb-2">Confidence Level</div>
              <div className={`text-4xl font-bold ${getConfidenceColor(confidence)} mb-2`}>
                {confidence ? `${confidence}%` : 'Calculating...'}
              </div>
              {confidence && (
                <div className="text-sm text-gray-600">
                  {getConfidenceLabel(confidence)}
                </div>
              )}
            </div>

            {/* Quality Assessment */}
            <div className="text-center p-4 bg-white rounded-lg shadow">
              <div className="text-sm font-medium text-gray-600 mb-2">Quality Assessment</div>
              <div className={`text-lg font-bold p-2 rounded-lg ${getQualityColor(qualityAssessment)}`}>
                {qualityAssessment ? qualityAssessment.toUpperCase() : 'Evaluating...'}
              </div>
            </div>
          </div>
        </div>

        {/* Input Values Display */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-left">📊 Input Parameters</h2>
          
          {/* Grid untuk P1-P30 */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            {inputs.map((input, index) => (
              <div key={index} className="border border-gray-300 p-3 rounded-md text-center bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="text-sm font-medium text-gray-600 mb-1">P{index + 1}</div>
                <div className="text-lg font-semibold text-black">
                  {typeof input === 'number' ? input.toFixed(3) : parseFloat(input || 0).toFixed(3)}
                </div>
              </div>
            ))}
            
            {/* SNR Box */}
            <div className="border-2 border-green-400 p-3 rounded-md text-center bg-green-50 hover:bg-green-100 transition-colors">
              <div className="text-sm font-medium text-green-700 mb-1">SNR</div>
              <div className="text-lg font-semibold text-green-800">
                {typeof snr === 'number' ? snr.toFixed(2) : parseFloat(snr || 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Analysis */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-left">🔍 Detailed Analysis</h2>
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Recommendation:</h3>
                <p className="text-gray-600 leading-relaxed">
                  {getRecommendation(predictionResult)}
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Analysis Details:</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Confidence Level:</strong> 
                    <span className={`ml-2 ${getConfidenceColor(confidence)}`}>
                      {confidence}% ({getConfidenceLabel(confidence)})
                    </span>
                  </div>
                  <div><strong>Quality Assessment:</strong> {qualityAssessment}</div>
                  {databaseData && (
                    <>
                      <div><strong>Created:</strong> {new Date(databaseData.created_at).toLocaleString('id-ID')}</div>
                      {databaseData.user_name && (
                        <div><strong>Analyzed by:</strong> {databaseData.user_name}</div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handleBackToPredict}
            className="px-8 py-3 bg-blue-500 text-white text-lg rounded-md transition-all duration-400 ease-in-out hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg hover:cursor-pointer"
          >
            Predict Again
          </button>
          
          <button
            onClick={handleHistory}
            className="px-8 py-3 bg-gray-500 text-white text-lg rounded-md transition-all duration-400 ease-in-out hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 shadow-lg hover:cursor-pointer"
          >
            View History
          </button>
        </div>
      </div>
    </div>
  );
};

export default Results;
