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
  const router = useRouter();

  const { isAuthenticated, isCheckingAuth, user } = useAuth();

  // Pastikan komponen sudah mounted (client-side)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Cek autentikasi dan fetch data
  useEffect(() => {
    if (!mounted) return;

    const checkDetailedAuth = async () => {
      try {
        console.log('🔍 Starting auth check for history page...');
        
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
        console.error('❌ Error during auth check:', error);
        setAuthStatus('unauthenticated');
      }
    };

    if (!isCheckingAuth && mounted) {
      checkDetailedAuth();
    }
  }, [isCheckingAuth, mounted]);

  // Handle redirect setelah auth status diketahui
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      console.log('🔄 Redirecting to login...');
      router.push('/login');
    }
  }, [authStatus, router]);

  const fetchHistoryData = async (token) => {
    try {
      console.log('🔍 Fetching history data for user...');

      const response = await fetch('http://localhost:5000/api/predictions?limit=20', {
        method: 'GET',
        headers: {
          'x-access-token': token,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ History data loaded:', result);
        
        if (result.success && result.data) {
          setHistoryData(result.data);
        }
      } else {
        console.log('❌ Failed to fetch history data:', response.status);
        setError('Gagal mengambil data history');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      setError('Terjadi kesalahan saat mengambil data history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePrediction = async (predictionId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus prediksi ini?')) {
      return;
    }

    try {
      setDeleteLoading(prev => ({ ...prev, [predictionId]: true }));
      
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`http://localhost:5000/api/prediction/${predictionId}`, {
        method: 'DELETE',
        headers: {
          'x-access-token': token,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        // Hapus dari state local
        setHistoryData(prev => prev.filter(item => item.id !== predictionId));
        alert('Prediksi berhasil dihapus');
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error deleting prediction:', error);
      alert('Terjadi kesalahan saat menghapus prediksi');
    } finally {
      setDeleteLoading(prev => ({ ...prev, [predictionId]: false }));
    }
  };

  const handleDeleteAllPredictions = async () => {
    try {
      setIsLoading(true);
      
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('http://localhost:5000/api/predictions/all', {
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
        alert(`Berhasil menghapus ${result.deleted_count} prediksi`);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error deleting all predictions:', error);
      alert('Terjadi kesalahan saat menghapus semua prediksi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetail = (predictionId) => {
    // Simpan ID prediksi untuk ditampilkan di results dengan token
    const token = localStorage.getItem('auth_token');
    
    const predictionDetail = {
      id: predictionId,
      fromHistory: true,
      token: token // Pastikan token tersimpan untuk results page
    };
    localStorage.setItem('currentPrediction', JSON.stringify(predictionDetail));
    router.push('/predict/results');
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
    if (!result) return 'bg-gray-100 text-gray-800';
    
    const prediction = typeof result === 'string' ? result : result.prediction;
    
    switch (prediction) {
      case 'Fiber Cut': return 'bg-red-100 text-red-800';
      case 'Normal Operation': return 'bg-green-100 text-green-800';
      case 'Signal Degradation': return 'bg-yellow-100 text-yellow-800';
      case 'Power Loss': return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  // Loading state
  if (!mounted || isCheckingAuth || authStatus === 'checking' || isLoading) {
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

        {/* Action Buttons */}
        {historyData.length > 0 && (
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => router.push('/predict')}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Prediction
            </button>
            <button
              onClick={() => setShowDeleteAllModal(true)}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center"
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
            <p className="text-gray-500 mb-6">Start by making your first fiber optic network prediction.</p>
            <button
              onClick={() => router.push('/predict')}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Make Prediction
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {historyData.map((prediction) => {
              const predictionResult = prediction.prediction_result 
                ? (typeof prediction.prediction_result === 'string' 
                   ? JSON.parse(prediction.prediction_result) 
                   : prediction.prediction_result)
                : null;

              return (
                <div key={prediction.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        Prediction #{prediction.id}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(prediction.created_at).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getQualityColor(prediction.quality_assessment)}`}>
                      {prediction.quality_assessment?.toUpperCase() || 'N/A'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Prediction</div>
                      <div className={`text-lg font-bold p-2 rounded ${getPredictionColor(predictionResult)}`}>
                        {predictionResult?.prediction || 'N/A'}
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Confidence</div>
                      <div className="text-lg font-bold text-blue-600">
                        {((prediction.confidence_score || 0) * 100).toFixed(1)}%
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Input Type</div>
                      <div className="text-lg font-semibold text-gray-800 capitalize">
                        {prediction.input_type || 'Manual'}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Model Version:</span> {prediction.model_version || '1.0.0'}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetail(prediction.id)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm flex items-center"
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
                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
      </div>

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
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllPredictions}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
