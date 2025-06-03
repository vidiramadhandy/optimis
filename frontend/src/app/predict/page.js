'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/useAuth';
import Navbar from '../../components/navbar';
import AltPage from './altpage';

const Predict = () => {
  const [inputs, setInputs] = useState(Array(30).fill(''));
  const [snr, setSnr] = useState('');
  const [isAltPageVisible, setIsAltPageVisible] = useState(false);
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState('checking');
  const [mounted, setMounted] = useState(false);
  const [inputErrors, setInputErrors] = useState(Array(30).fill(false));
  const [snrError, setSnrError] = useState(false);
  const [allEmptyError, setAllEmptyError] = useState(false);
  const router = useRouter();

  const { isAuthenticated, isCheckingAuth, user } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const checkDetailedAuth = async () => {
      try {
        console.log('🔍 Starting detailed auth check...');
        
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
          } else {
            console.log('❌ User not authenticated according to backend');
            localStorage.removeItem('auth_token');
            setAuthStatus('unauthenticated');
          }
        } else {
          console.log('❌ Auth check failed with status:', response.status);
          localStorage.removeItem('auth_token');
          setAuthStatus('unauthenticated');
        }
      } catch (error) {
        console.error('❌ Error during auth check:', error);
        setAuthStatus('unauthenticated');
      }
    };

    if (!isCheckingAuth && mounted) {
      checkDetailedAuth();
    }
  }, [isCheckingAuth, mounted]);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      console.log('🔄 Redirecting to login...');
      router.push('/login');
    }
  }, [authStatus, router]);

  if (!mounted || isCheckingAuth || authStatus === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-600">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return null;
  }

  // Validasi untuk P1-P30 (0-1) dan SNR (0-30)
  const validateInput = (value, min = 0, max = 1, isSnr = false) => {
    if (value === '') return { isValid: true, message: '' };
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return { isValid: false, message: 'Must be a number' };
    }
    
    const actualMax = isSnr ? 30 : max;
    if (numValue < min || numValue > actualMax) {
      return { isValid: false, message: `Must be between ${min} and ${actualMax}` };
    }
    return { isValid: true, message: '' };
  };

  // Validasi bahwa tidak semua P1-P30 kosong
  // const validateNotAllEmpty = (inputsArray) => {
  //   const nonEmptyInputs = inputsArray.filter(input => input !== '' && parseFloat(input) > 0);
  //   return nonEmptyInputs.length > 0;
  // };

  // Handle input change untuk P1-P30
  const handleInputChange = (index, value) => {
    const newInputs = [...inputs];
    newInputs[index] = value;
    setInputs(newInputs);

    // Validasi individual
    // const validation = validateInput(value, 0, 1);
    // const newErrors = [...inputErrors];
    // newErrors[index] = !validation.isValid;
    // setInputErrors(newErrors);

    // // Validasi tidak semua kosong
    // const notAllEmpty = validateNotAllEmpty(newInputs);
    // setAllEmptyError(!notAllEmpty);
  };

  // Handle SNR change
  const handleSnrChange = (value) => {
    setSnr(value);
    
    const validation = validateInput(value, 0, 30, true);
    setSnrError(!validation.isValid);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let hasErrors = false;
    const newInputErrors = Array(30).fill(false);
    
    // Validasi individual P1-P30
    for (let i = 0; i < 30; i++) {
      if (inputs[i] !== '') {
        const validation = validateInput(inputs[i], 0, 1);
        if (!validation.isValid) {
          newInputErrors[i] = true;
          hasErrors = true;
        }
      }
    }
    
    // Validasi tidak semua P1-P30 kosong
    // const notAllEmpty = validateNotAllEmpty(inputs);
    // if (!notAllEmpty) {
    //   setAllEmptyError(true);
    //   hasErrors = true;
    //   alert("At least one parameter (P1-P30) must have a value greater than 0");
    //   return;
    // } else {
    //   setAllEmptyError(false);
    // }
    
    // Validasi SNR
    let snrHasError = false;
    if (snr === '') {
      snrHasError = true;
      hasErrors = true;
    } else {
      const validation = validateInput(snr, 0, 30, true);
      if (!validation.isValid) {
        snrHasError = true;
        hasErrors = true;
      }
    }

    setInputErrors(newInputErrors);
    setSnrError(snrHasError);

    if (hasErrors) {
      alert("Please check your inputs:\n- P1-P30: numbers between 0 and 1 (at least one must be > 0)\n- SNR: number between 0 and 30 (required)");
      return;
    }

    setIsConfirmModalVisible(true);
  };

  const handleConfirm = async () => {
    try {
      setIsConfirmModalVisible(false);
      setIsLoading(true);
      
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        alert('Token tidak ditemukan. Silakan login terlebih dahulu.');
        setAuthStatus('unauthenticated');
        return;
      }
      
      // Konversi input: kosong menjadi 0, yang ada nilai tetap sebagai float
      const processedInputs = inputs.map(input => {
        if (input === '' || input === null || input === undefined) {
          return 0;
        }
        return parseFloat(input);
      });
      
      const predictionData = {
        inputs: processedInputs,
        snr: parseFloat(snr),
        inputType: isAltPageVisible ? 'CSV' : 'Manual'
      };

      console.log('📤 Sending prediction request...');

      const response = await fetch('http://localhost:5000/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token
        },
        body: JSON.stringify(predictionData)
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          alert('Sesi Anda telah berakhir. Silakan login kembali.');
          localStorage.removeItem('auth_token');
          setAuthStatus('unauthenticated');
          return;
        } else {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      }

      const result = await response.json();

      if (result.success) {
        console.log('✅ Prediction successful!');
        
        const predictionResult = {
          inputs: inputs,
          snr: snr,
          inputType: predictionData.inputType,
          result: result.data.prediction,
          confidence: result.data.confidence,
          qualityAssessment: result.data.quality_assessment,
          id: result.data.id,
          userId: result.data.user_id,
          userInfo: result.data.user_info,
          modelInfo: result.data.model_info,
          timestamp: result.data.timestamp || new Date().toISOString(),
          date: new Date().toLocaleDateString('id-ID'),
          analysisTime: new Date().toLocaleString('id-ID')
        };

        localStorage.setItem('currentPrediction', JSON.stringify(predictionResult));

        const existingHistory = JSON.parse(localStorage.getItem('predictionHistory') || '[]');
        existingHistory.unshift(predictionResult);
        localStorage.setItem('predictionHistory', JSON.stringify(existingHistory));

        router.push('/predict/results');
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Error melakukan prediksi:', error);
      alert('Terjadi kesalahan saat melakukan prediksi. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsConfirmModalVisible(false);
  };

  const toggleAltPage = () => {
    setIsAltPageVisible(!isAltPageVisible);
  };

  return (
    <>
      <div className="relative min-h-screen flex flex-col justify-between bg-gradient-animation">
        <Navbar />
        
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

        <div className="sm:text-4xl md:text-6xl lg:text-7xl mt-32 text-white font-bold text-center relative z-20 mb-8">
          <h1 className="drop-shadow-2xl">Predict Your Fiber Optic Network</h1>
          <p className="text-lg md:text-xl text-blue-200 font-light mt-4 max-w-2xl mx-auto px-4">
            {user ? `Welcome, ${user.name}!` : 'Welcome to OptiPredict!'}
          </p>
        </div>

        <div className="absolute inset-0 w-full mt-28 animated-background bg-gradient-to-tl from-gray-800/80 via-neutral-800/80 to-indigo-800/80 z-0"></div>
        
        <div className="text-center my-3 relative z-20">
          <button
            onClick={toggleAltPage}
            className="inline-flex items-center px-8 py-3 bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 transition-all duration-300 ease-in-out font-semibold text-lg rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            {isAltPageVisible ? 'Use Manual Input' : 'Or Upload CSV'}
          </button>
        </div>

        {isAltPageVisible ? (
          <AltPage />
        ) : (
          <div className="text-black relative z-20 w-full lg:w-4/5 xl:w-3/4 bg-white/95 backdrop-blur-lg py-8 px-8 rounded-2xl shadow-2xl mx-auto my-8 border border-white/20">
            <div className="border-b border-gray-200 pb-6 mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
                <svg className="w-8 h-8 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Manual Input
              </h2>
              <p className="text-gray-600 text-base">
                Enter values for P1 to P30 (0.0-1.0) and SNR (0.0-30.0).
              </p>
              {allEmptyError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm font-medium">
                    ⚠️ At least one parameter P1-P30 must have a value greater than 0
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit}>
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
                        type="number"
                        id={`P${i + 1}`}
                        name={`P${i + 1}`}
                        value={inputs[i]}
                        onChange={(e) => handleInputChange(i, e.target.value)}
                        min="0"
                        max="1"
                        step="any"
                        placeholder="0.0 - 1.0"
                        className={`w-full p-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ease-in-out text-black bg-gray-50 hover:bg-white group-hover:border-gray-300 ${
                          inputErrors[i] || allEmptyError
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                            : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
                        }`}
                      />
                      {inputErrors[i] && (
                        <p className="text-red-500 text-xs mt-1">Please enter a valid number (0-1)</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-8 border-t pt-8">
                <h3 className="text-xl font-semibold text-gray-700 mb-6 flex items-center">
                  <span className="w-2 h-6 bg-green-500 rounded mr-3"></span>
                  Signal-to-Noise Ratio - Range: 0.0 to 30.0
                </h3>
                
                <div className="max-w-xs">
                  <label htmlFor="snr" className="block text-sm font-semibold text-gray-700 mb-2">
                    SNR (Required)
                  </label>
                  <input
                    type="number"
                    id="snr"
                    value={snr}
                    onChange={(e) => handleSnrChange(e.target.value)}
                    required
                    min="0"
                    max="30"
                    step="any"
                    placeholder="0.0 - 30.0"
                    className={`w-full p-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ease-in-out text-black bg-gray-50 hover:bg-white ${
                      snrError 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                        : 'border-gray-200 focus:border-green-500 focus:ring-green-200'
                    }`}
                  />
                  {snrError && (
                    <p className="text-red-500 text-xs mt-1">Please enter a valid number (0-30)</p>
                  )}
                </div>
              </div>

              <div className="flex justify-center mt-8 pt-6 border-t">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative px-12 py-4 btn-gradient text-white text-lg font-semibold rounded-xl transition-all duration-300 ease-in-out hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-green-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span className="flex items-center">
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Start Prediction
                      </>
                    )}
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}

        {isConfirmModalVisible && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full h-[600px] flex flex-col">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 rounded-t-2xl flex-shrink-0">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Confirm Your Data
                </h2>
                <p className="text-blue-100 mt-1">Review your input values (empty fields will be treated as 0)</p>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">P1 to P30 Values:</h3>
                  <div className="grid grid-cols-5 gap-3 mb-6 bg-gray-50 p-4 rounded-lg">
                    {inputs.map((input, index) => (
                      <div key={index} className="text-center bg-white p-2 rounded border">
                        <div className="text-xs text-gray-500 mb-1">P{index + 1}</div>
                        <div className={`font-semibold text-xs ${input === '' ? 'text-gray-400' : 'text-gray-800'}`}>
                          {input === '' ? '0' : input}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">SNR:</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <span className="text-xl font-bold text-gray-800">
                      {snr || 'Empty'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 p-8 pt-0">
                <div className="flex flex-col sm:flex-row gap-4 justify-end">
                  <button
                    onClick={handleCancel}
                    className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium cursor-pointer"
                  >
                    Edit Data
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isLoading}
                    className="px-6 py-3 btn-gradient text-white rounded-lg font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isLoading ? 'Processing...' : 'Confirm & Predict'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
    </>
  );
};

export default Predict;
