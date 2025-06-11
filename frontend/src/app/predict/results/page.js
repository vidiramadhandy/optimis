// frontend/src/app/predict/results/page.js - PERBAIKAN ERROR CONST VARIABLE
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

  // PERBAIKAN: Format data dari database dengan let instead of const
  const formatDatabaseData = (dbData) => {
    console.log('📊 Formatting database data:', dbData);
    
    // PERBAIKAN: Gunakan let instead of const untuk parameters
    let parameters = {};
    
    if (dbData.parameters) {
      // Jika sudah ada field parameters
      parameters = dbData.parameters;
    } else if (dbData.inputs) {
      // Parse dari inputs JSON
      try {
        let inputsData = [];
        if (typeof dbData.inputs === 'string') {
          inputsData = JSON.parse(dbData.inputs);
        } else if (Array.isArray(dbData.inputs)) {
          inputsData = dbData.inputs;
        }
        
        for (let i = 0; i < 30; i++) {
          const paramKey = `P${i + 1}`;
          parameters[paramKey] = i < inputsData.length ? parseFloat(inputsData[i]) || 0.0 : 0.0;
        }
      } catch (e) {
        console.log('Error parsing inputs from database:', e);
        // Default semua parameter ke 0
        for (let i = 0; i < 30; i++) {
          parameters[`P${i + 1}`] = 0.0;
        }
      }
    } else {
      // Default semua parameter ke 0 jika tidak ada data
      for (let i = 0; i < 30; i++) {
        parameters[`P${i + 1}`] = 0.0;
      }
    }

    const formattedData = {
      id: dbData.id,
      prediction_number: dbData.prediction_number || dbData.id,
      prediction: dbData.prediction || 'N/A',
      confidence: parseFloat(dbData.confidence) || 0.0,
      snr: parseFloat(dbData.snr) || 0.0,
      snr_normalized: parseFloat(dbData.snr_normalized) || 0.0,
      parameters: parameters,
      quality_assessment: dbData.quality_assessment || 'N/A',
      input_type: dbData.input_type || 'Manual',
      model_version: dbData.model_version || '2.0',
      created_at: dbData.created_at,
      timestamp: dbData.created_at || new Date().toISOString()
    };

    console.log('📊 Formatted database data:', {
      prediction: formattedData.prediction,
      confidence: formattedData.confidence,
      parametersCount: Object.keys(formattedData.parameters).length,
      nonZeroParams: Object.values(formattedData.parameters).filter(v => v !== 0).length
    });

    return formattedData;
  };

  // PERBAIKAN: Format data dari localStorage dengan let instead of const
  const formatLocalStorageData = (localData) => {
    console.log('📊 Formatting localStorage data:', localData);
    
    // PERBAIKAN: Gunakan let instead of const untuk parameters
    let parameters = {};
    
    if (localData.parameters) {
      parameters = localData.parameters;
    } else if (localData.inputs) {
      // Format inputs menjadi parameters P1-P30
      const inputs = Array.isArray(localData.inputs) ? localData.inputs : [];
      for (let i = 0; i < 30; i++) {
        const paramKey = `P${i + 1}`;
        parameters[paramKey] = i < inputs.length ? parseFloat(inputs[i]) || 0.0 : 0.0;
      }
    } else {
      // Default semua parameter ke 0
      for (let i = 0; i < 30; i++) {
        parameters[`P${i + 1}`] = 0.0;
      }
    }

    const formattedData = {
      id: localData.id,
      prediction_number: localData.prediction_number || localData.id,
      prediction: localData.prediction || localData.result || 'N/A',
      confidence: parseFloat(localData.confidence) || 0.0,
      snr: parseFloat(localData.snr) || 0.0,
      snr_normalized: parseFloat(localData.snr_normalized) || 0.0,
      parameters: parameters,
      quality_assessment: localData.quality_assessment || localData.qualityAssessment || 'N/A',
      input_type: localData.input_type || localData.inputType || 'Manual',
      model_version: localData.model_version || '2.0',
      timestamp: localData.timestamp || localData.analysisTime || new Date().toISOString()
    };

    console.log('📊 Formatted localStorage data:', {
      prediction: formattedData.prediction,
      confidence: formattedData.confidence,
      parametersCount: Object.keys(formattedData.parameters).length,
      nonZeroParams: Object.values(formattedData.parameters).filter(v => v !== 0).length
    });

    return formattedData;
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

  // PERBAIKAN: Load prediction data dengan prioritas database
  const loadPredictionResults = async (token) => {
    try {
      console.log('🔍 Loading prediction data...');
      setError(null);

      // Ambil data dari localStorage
      const currentPrediction = localStorage.getItem('currentPrediction');
      
      if (currentPrediction) {
        const predictionInfo = JSON.parse(currentPrediction);
        console.log('📊 Found prediction info in localStorage:', predictionInfo);
        
        // PERBAIKAN: Jika ada ID, prioritaskan data dari database
        if (predictionInfo.id) {
          console.log('🔍 Fetching data from database for ID:', predictionInfo.id);
          const databaseData = await fetchFromDatabase(predictionInfo.id, token);
          
          if (databaseData) {
            console.log('✅ Using database data');
            const formattedData = formatDatabaseData(databaseData);
            
            // Set data dari database
            setInputs(Object.values(formattedData.parameters));
            setSnr(formattedData.snr.toString());
            setPredictionResult(formattedData.prediction);
            setConfidence(convertConfidenceToPercentage(formattedData.confidence));
            setQualityAssessment(formattedData.quality_assessment);
            setInputType(formattedData.input_type);
            setAnalysisTime(new Date(formattedData.timestamp).toLocaleString('id-ID'));
            setDatabaseData(formattedData);
            setUserInfo(user);
          } else {
            console.log('⚠️ Database fetch failed, using localStorage data');
            const formattedData = formatLocalStorageData(predictionInfo);
            
            // Set data dari localStorage
            setInputs(Object.values(formattedData.parameters));
            setSnr(formattedData.snr.toString());
            setPredictionResult(formattedData.prediction);
            setConfidence(convertConfidenceToPercentage(formattedData.confidence));
            setQualityAssessment(formattedData.quality_assessment);
            setInputType(formattedData.input_type);
            setAnalysisTime(new Date(formattedData.timestamp).toLocaleString('id-ID'));
            setUserInfo(user);
          }
        } else {
          // Jika tidak ada ID, gunakan data dari localStorage (prediksi baru)
          console.log('📊 Using localStorage data for new prediction');
          const formattedData = formatLocalStorageData(predictionInfo);
          
          // Set data dari localStorage
          setInputs(Object.values(formattedData.parameters));
          setSnr(formattedData.snr.toString());
          setPredictionResult(formattedData.prediction);
          setConfidence(convertConfidenceToPercentage(formattedData.confidence));
          setQualityAssessment(formattedData.quality_assessment);
          setInputType(formattedData.input_type);
          setAnalysisTime(new Date(formattedData.timestamp).toLocaleString('id-ID'));
          setUserInfo(user);
        }
      } else {
        console.log('❌ No prediction data found');
        setError('Tidak ada data prediksi yang ditemukan');
      }
    } catch (error) {
      console.error('❌ Error loading prediction data:', error);
      setError('Gagal memuat data prediksi');
    } finally {
      setIsLoading(false);
    }
  };

  // PERBAIKAN: Fetch data dari database dengan endpoint yang benar
  const fetchFromDatabase = async (predictionId, token) => {
    try {
      console.log('🔍 Fetching from database, prediction ID:', predictionId);
      
      // PERBAIKAN: Gunakan endpoint history untuk mendapatkan data
      const response = await fetch('http://localhost:5000/api/predictions', {
        method: 'GET',
        headers: {
          'x-access-token': token,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Database response:', result);
        
        if (result.success && result.data && result.data.length > 0) {
          // Cari prediksi berdasarkan ID
          const prediction = result.data.find(p => p.id === predictionId);
          
          if (prediction) {
            console.log('✅ Found prediction in database:', prediction);
            return prediction;
          } else {
            console.log('⚠️ Prediction not found in database');
            return null;
          }
        } else {
          console.log('⚠️ No data in database response');
          return null;
        }
      } else {
        console.log('❌ Database request failed:', response.status);
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching from database:', error);
      return null;
    }
  };

  const handleBackToPredict = () => {
    localStorage.removeItem('currentPrediction');
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
      case 'excellent': case 'high': return 'bg-green-100 text-green-800';
      case 'good': case 'medium': return 'bg-blue-100 text-blue-800';
      case 'fair': case 'low': return 'bg-yellow-100 text-yellow-800';
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
                  <span className="font-semibold">Prediction ID:</span> #{databaseData.prediction_number || databaseData.id}
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
                {confidence ? `${confidence}%` : '0.0%'}
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

        {/* PERBAIKAN: Input Values Display dengan data yang benar */}
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
                  <div><strong>SNR Value:</strong> {parseFloat(snr || 0).toFixed(2)}</div>
                  <div><strong>Input Type:</strong> {inputType}</div>
                  {databaseData && (
                    <>
                      <div><strong>Created:</strong> {new Date(databaseData.timestamp).toLocaleString('id-ID')}</div>
                      <div><strong>Model Version:</strong> {databaseData.model_version}</div>
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
