'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/useAuth';
import Navbar from '../../components/navbar';

const History = () => {
  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authStatus, setAuthStatus] = useState('checking');
  const [mounted, setMounted] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState({});
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

  // State untuk modal sukses
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successAlertMessage, setSuccessAlertMessage] = useState('');

  const router = useRouter();
  const { isAuthenticated, isCheckingAuth, user } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const checkDetailedAuth = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 100));
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setAuthStatus('unauthenticated');
          return;
        }
        const response = await fetch('/api/auth/check', {
          method: 'GET',
          headers: {
            'x-access-token': token,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.authenticated) {
            setAuthStatus('authenticated');
            await fetchHistoryData(token);
          } else {
            localStorage.removeItem('auth_token');
            setAuthStatus('unauthenticated');
          }
        } else {
          localStorage.removeItem('auth_token');
          setAuthStatus('unauthenticated');
        }
      } catch (error) {
        setAuthStatus('unauthenticated');
      }
    };

    if (!isCheckingAuth && mounted) {
      checkDetailedAuth();
    }
  }, [isCheckingAuth, mounted]);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login');
    }
  }, [authStatus, router]);

  const fetchHistoryData = async (token) => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await fetch('/api/predictions?limit=20', {
        method: 'GET',
        headers: {
          'x-access-token': token,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(15000)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setHistoryData(result.data);
        } else {
          setHistoryData([]);
        }
      } else {
        let errorMessage = 'Failed to fetch history data';
        try {
          const errorResult = await response.json();
          errorMessage = errorResult.message || errorMessage;
        } catch {}
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('auth_token');
          setAuthStatus('unauthenticated');
          return;
        }
        setError(`${errorMessage} (Status: ${response.status})`);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        setError('Request timeout - Please check your connection and try again');
      } else if (error.message.includes('Failed to fetch')) {
        setError('Network error - Please check if the backend server is running on port 5000');
      } else {
        setError(`An error occurred: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('auth_token');
    if (token) {
      await fetchHistoryData(token);
    } else {
      setAuthStatus('unauthenticated');
    }
  };

  // MODAL ALERT: Otomatis hilang setelah 3 detik
  useEffect(() => {
    if (showSuccessAlert) {
      const timer = setTimeout(() => setShowSuccessAlert(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessAlert]);

  // Delete all predictions dengan modal alert
  const handleDeleteAllPredictions = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/predictions/all', {
        method: 'DELETE',
        headers: {
          'x-access-token': token,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      if (result.success) {
        setHistoryData([]);
        setShowDeleteAllModal(false);
        setSuccessAlertMessage(`Successfully deleted ${result.deleted_count} predictions. Prediction numbers have been reset.`);
        setShowSuccessAlert(true);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      alert('An error occurred while deleting all predictions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePrediction = async (predictionId) => {
    if (!confirm('Are you sure you want to delete this prediction?')) {
      return;
    }
    try {
      setDeleteLoading(prev => ({ ...prev, [predictionId]: true }));
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/prediction/${predictionId}`, {
        method: 'DELETE',
        headers: {
          'x-access-token': token,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      if (result.success) {
        setHistoryData(prev => prev.filter(item => item.id !== predictionId));
        setSuccessAlertMessage('Prediction successfully deleted');
        setShowSuccessAlert(true);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      alert('An error occurred during prediction deletion');
    } finally {
      setDeleteLoading(prev => ({ ...prev, [predictionId]: false }));
    }
  };

  const handleViewDetail = (predictionId) => {
    const token = localStorage.getItem('auth_token');
    const predictionDetail = {
      id: predictionId,
      fromHistory: true,
      token: token
    };
    localStorage.setItem('currentPrediction', JSON.stringify(predictionDetail));
    router.push('/predict/results');
  };

  const formatConfidence = (prediction) => {
    let confidenceValue = null;
    if (prediction.confidence !== undefined && prediction.confidence !== null) {
      confidenceValue = prediction.confidence;
    } else if (prediction.confidence_score !== undefined && prediction.confidence_score !== null) {
      confidenceValue = prediction.confidence_score;
    } else {
      return '0.0';
    }
    const numValue = parseFloat(confidenceValue);
    if (isNaN(numValue)) return '0.0';
    if (numValue >= 0 && numValue <= 1) {
      return (numValue * 100).toFixed(1);
    }
    return numValue.toFixed(1);
  };

  const getPredictionResult = (prediction) => {
    if (prediction.prediction && prediction.prediction !== 'N/A') {
      return prediction.prediction;
    }
    if (prediction.prediction_result) {
      try {
        const parsed = typeof prediction.prediction_result === 'string' 
          ? JSON.parse(prediction.prediction_result) 
          : prediction.prediction_result;
        return parsed.prediction || 'N/A';
      } catch (e) {}
    }
    return 'N/A';
  };

  const getParameters = (prediction) => {
    let parameters = {};
    if (prediction.inputs) {
      try {
        let inputsData = [];
        if (typeof prediction.inputs === 'string') {
          inputsData = JSON.parse(prediction.inputs);
        } else if (Array.isArray(prediction.inputs)) {
          inputsData = prediction.inputs;
        }
        for (let i = 0; i < 30; i++) {
          const paramKey = `P${i + 1}`;
          parameters[paramKey] = i < inputsData.length ? parseFloat(inputsData[i]) || 0.0 : 0.0;
        }
      } catch (e) {
        for (let i = 0; i < 30; i++) {
          parameters[`P${i + 1}`] = 0.0;
        }
      }
    } else if (prediction.parameters) {
      parameters = prediction.parameters;
    } else {
      for (let i = 0; i < 30; i++) {
        parameters[`P${i + 1}`] = 0.0;
      }
    }
    return parameters;
  };

  const getQualityColor = (quality) => {
    switch (quality?.toLowerCase()) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPredictionColor = (prediction) => {
    switch (prediction) {
      case 'Normal': return 'bg-green-100 text-green-800';
      case 'Fiber Tapping': return 'bg-red-100 text-red-800';
      case 'Bad Splice': return 'bg-orange-100 text-orange-800';
      case 'Bending Event': return 'bg-yellow-100 text-yellow-800';
      case 'Dirty Connector': return 'bg-purple-100 text-purple-800';
      case 'Fiber Cut': return 'bg-red-100 text-red-800';
      case 'PC Connector': return 'bg-blue-100 text-blue-800';
      case 'Reflector': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  if (!mounted || isCheckingAuth || authStatus === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {authStatus === 'checking' ? 'Checking authentication...' : 'Loading prediction history...'}
          </p>
        </div>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return null;
  }

  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 mt-20">
          <div className="text-center py-12">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-red-600 mb-2">Failed to Load History</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleRetry}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/predict')}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 cursor-pointer transition-colors"
              >
                Back to Predict
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 mt-20">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading prediction history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8 mt-20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📊 Prediction History
          </h1>
          <p className="text-gray-600">
            Your fiber optic network analysis history
          </p>
          {user && (
            <p className="text-sm text-gray-500 mt-2">
              History for: {user.name}
            </p>
          )}
        </div>

        {historyData.length > 0 && (
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => router.push('/predict')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer flex items-center transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Prediction
            </button>
            <button
              onClick={() => setShowDeleteAllModal(true)}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 cursor-pointer transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete All History
            </button>
          </div>
        )}

        {historyData.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Predictions Yet</h3>
            <p className="text-gray-500 mb-4">Start by making your first fiber optic network prediction</p>
            <button
              onClick={() => router.push('/predict')}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-colors"
            >
              Make Your First Prediction
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {historyData.map((prediction) => {
              const predictionResult = getPredictionResult(prediction);
              const confidence = formatConfidence(prediction);
              const parameters = getParameters(prediction);
              const predictionNumber = prediction.prediction_number || prediction.id;

              return (
                <div key={prediction.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        Prediction
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(prediction.created_at).toLocaleString('id-ID')}
                      </p>
                    </div>
                    {/* <span className={`px-3 py-1 rounded-full text-sm font-medium ${getQualityColor(prediction.quality_assessment)}`}>
                      {prediction.quality_assessment?.toUpperCase() || 'N/A'}
                    </span> */}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Prediction</div>
                      <div className={`text-lg font-bold p-2 rounded ${getPredictionColor(predictionResult)}`}>
                        {predictionResult}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Confidence</div>
                      <div className="text-lg font-bold text-blue-600">
                        {confidence}%
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Input Type</div>
                      <div className="text-lg font-semibold text-gray-800 capitalize">
                        {prediction.input_type || 'Manual'}
                      </div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">📊 Input Parameters</h4>
                    <div className="grid grid-cols-5 gap-2 text-xs">
                      {Object.entries(parameters).slice(0, 10).map(([key, value]) => (
                        <div key={key} className="text-center p-1 bg-gray-100 rounded">
                          <div className="font-medium text-gray-600">{key}</div>
                          <div className="text-gray-800">{typeof value === 'number' ? value.toFixed(3) : value}</div>
                        </div>
                      ))}
                    </div>
                    {Object.keys(parameters).length > 10 && (
                      <div className="text-center mt-2">
                        <span className="text-xs text-gray-500">... and {Object.keys(parameters).length - 10} more parameters</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Model Version:</span> {prediction.model_version || '2.0'}
                      {prediction.snr && (
                        <span className="ml-4">
                          <span className="font-medium">SNR:</span> {parseFloat(prediction.snr).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetail(prediction.id)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm flex items-center cursor-pointer"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Details
                      </button>
                      <button
                        onClick={() => handleDeletePrediction(prediction.id)}
                        disabled={deleteLoading[prediction.id]}
                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center cursor-pointer"
                      >
                        {deleteLoading[prediction.id] ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Delete All */}
        {showDeleteAllModal && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 className="text-xl font-bold text-gray-800">Confirm Delete All</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete all prediction history? This action cannot be undone and will permanently remove all your prediction data.
              </p>
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setShowDeleteAllModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAllPredictions}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 cursor-pointer transition-colors"
                >
                  Delete All & Reset Numbers
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Success Alert */}
        {showSuccessAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full text-center animate-fade-in">
              <div className="flex flex-col items-center">
                <svg className="w-12 h-12 text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" stroke="currentColor" fill="none"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4"/>
                </svg>
                <h3 className="text-lg font-bold mb-2 text-green-700">Success</h3>
                <div className="text-gray-700 mb-4">{successAlertMessage}</div>
                <button
                  className="px-6 py-2 cursor-pointer btn-gradient text-white rounded-lg transition"
                  onClick={() => setShowSuccessAlert(false)}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default History;
