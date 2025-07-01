'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ExcelJS from 'exceljs';
import Navbar from '../../components/navbar';

const AltPage = () => {
  // State management
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // File processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [fileSize, setFileSize] = useState(0);
  const [processingStage, setProcessingStage] = useState('');
  const [isLargeDataset, setIsLargeDataset] = useState(false);

  // Loading spinner and progress
  const [uploadProgress, setUploadProgress] = useState(0);
  const [predictionProgress, setPredictionProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Network and error handling
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkError, setNetworkError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(3);

  // For resetting upload area
  const [uploadAreaKey, setUploadAreaKey] = useState(Date.now());

  const router = useRouter();

  // Error messages in English
  const ERROR_MESSAGES = {
    FILE_TOO_LARGE: (sizeMB) => `File too large (${sizeMB}MB). Maximum file size is 1GB.`,
    CSV_NOT_SUPPORTED: 'CSV files are not supported. Please upload an Excel file (.xlsx or .xls).',
    UNSUPPORTED_FORMAT: 'Unsupported file format. Only .xlsx or .xls files are allowed.',
    FAILED_TO_PROCESS: 'Failed to process file. Please check if the file is corrupted.',
    FAILED_TO_READ_EXCEL: 'Failed to read Excel file. Please ensure the file is not corrupted.',
    NO_FILE_SELECTED: 'Please upload a file first.',
    FLASK_SERVICE_UNAVAILABLE: 'Machine Learning service is not available. Please ensure the Flask server is running on port 5001.',
    CONNECTION_TIMEOUT: 'Request timeout. The file is too large or the server is not responding within 10 minutes. Try splitting the file into smaller parts.',
    CONNECTION_FAILED: 'Unable to connect to server. Please check your internet connection and ensure the backend server is running.',
    PREDICTION_FAILED: 'Prediction failed. Please try again.',
    NETWORK_OFFLINE: 'No internet connection. Please ensure your internet connection is stable before making predictions.',
    NETWORK_PREVIOUS_ERROR: 'Internet connection was interrupted previously. Please ensure stable connection before continuing.',
    ALL_ENDPOINTS_FAILED: 'All server endpoints failed. Please check network connection and ensure backend server is running.',
    CHUNK_UPLOAD_FAILED: (chunkIndex, totalChunks) => `Failed to upload chunk ${chunkIndex + 1}/${totalChunks}`,
    LARGE_DATASET_WARNING: (rowCount) => `This file has ${rowCount.toLocaleString()} rows and may take significant time to process.`,
    HTTP_ERROR: (status, statusText) => `HTTP ${status}: ${statusText}`,
    AUTHENTICATION_FAILED: 'Authentication failed. Please login again.',
    SERVER_ERROR: 'Server error occurred. Please try again later.'
  };

  // Timer for elapsed time
  useEffect(() => {
    let interval = null;
    if (loading && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [loading, startTime]);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setNetworkError(false);
      console.log('🟢 Internet connection available');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setNetworkError(true);
      console.log('🔴 Internet connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/auth/check', {
          headers: { 'x-access-token': token },
          credentials: 'include',
        });

        const result = await response.json();

        if (result.authenticated) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('auth_token');
          setErrorMsg(ERROR_MESSAGES.AUTHENTICATION_FAILED);
          router.push('/login');
        }
      } catch (error) {
        localStorage.removeItem('auth_token');
        setErrorMsg(ERROR_MESSAGES.AUTHENTICATION_FAILED);
        router.push('/login');
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Check Flask service with multiple endpoints
  const checkFlaskService = async () => {
    const endpoints = [
      '/api/health'
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Checking Flask service at: ${endpoint}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

        const response = await fetch(endpoint, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Flask service available at ${endpoint}:`, result);
          return true;
        } else {
          console.log(`❌ Flask service at ${endpoint} returned error:`, response.status);
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log(`⏰ Timeout checking ${endpoint}`);
        } else {
          console.log(`❌ Flask service at ${endpoint} not reachable:`, error.message);
        }
      }
    }

    return false;
  };

  // Retry mechanism with exponential backoff
  const retryWithBackoff = async (fn, retries = maxRetries) => {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0 && (error.name === 'AbortError' || error.message.includes('Failed to fetch'))) {
        const delay = Math.pow(2, maxRetries - retries) * 1000; // Exponential backoff
        console.log(`🔄 Retrying in ${delay/1000} seconds... (${maxRetries - retries + 1}/${maxRetries})`);
        
        setRetryCount(maxRetries - retries + 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return retryWithBackoff(fn, retries - 1);
      }
      throw error;
    }
  };

  // File processing function
  const processFile = useCallback(async (file) => {
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const fileSizeMB = file.size / (1024 * 1024);

    setFileSize(file.size);

    // Block CSV files
    if (fileExtension === 'csv') {
      setErrorMsg(ERROR_MESSAGES.CSV_NOT_SUPPORTED);
      setSelectedFile(null);
      setUploadedFileName('');
      setTotalRows(0);
      setEstimatedTime(0);
      setFileSize(0);
      return;
    }

    if (file.size > 1000 * 1024 * 1024) { // 1GB limit
      setErrorMsg(ERROR_MESSAGES.FILE_TOO_LARGE(fileSizeMB.toFixed(1)));
      return;
    }

    if (fileSizeMB > 50) {
      setIsLargeDataset(true);
    }

    setIsProcessing(true);
    setProcessProgress(0);
    setErrorMsg('');
    setProcessingStage('Reading file...');

    try {
      let rowCount = 0;

      if (['xlsx', 'xls'].includes(fileExtension)) {
        rowCount = await processExcel(file);
      } else {
        throw new Error(ERROR_MESSAGES.UNSUPPORTED_FORMAT);
      }

      setTotalRows(rowCount);

      // Estimate time based on row count
      const estimatedMinutes = Math.ceil(rowCount / 1000);
      setEstimatedTime(estimatedMinutes);

      setProcessingStage(`File processed successfully! ${rowCount.toLocaleString()} rows detected. Estimated processing time: ${estimatedMinutes} minutes.`);
      setProcessProgress(100);

    } catch (error) {
      setErrorMsg(error.message || ERROR_MESSAGES.FAILED_TO_PROCESS);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Process Excel file
  const processExcel = useCallback(async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const buffer = evt.target.result;
          const workbook = new ExcelJS.Workbook();

          await workbook.xlsx.load(buffer, {
            sharedStrings: 'cache',
            hyperlinks: 'ignore',
            styles: 'ignore'
          });

          const worksheet = workbook.worksheets[0];
          const rowCount = worksheet.rowCount - 1;
          resolve(rowCount);
        } catch (error) {
          reject(new Error(ERROR_MESSAGES.FAILED_TO_READ_EXCEL));
        }
      };
      reader.onerror = () => reject(new Error(ERROR_MESSAGES.FAILED_TO_READ_EXCEL));
      reader.readAsArrayBuffer(file);
    });
  }, []);

  // Handle file input
  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadedFileName(file.name);
      processFile(file);
    }
  }, [processFile]);

  // Handle drag and drop
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setUploadedFileName(file.name);
      processFile(file);
    }
  }, [processFile]);

  // Reset state & upload area
  const handleUploadAgain = useCallback(() => {
    setSelectedFile(null);
    setUploadedFileName("");
    setResults(null);
    setErrorMsg('');
    setTotalRows(0);
    setFileSize(0);
    setIsLargeDataset(false);
    setUploadProgress(0);
    setPredictionProgress(0);
    setEstimatedTime(0);
    setElapsedTime(0);
    setStartTime(null);
    setRetryCount(0);
    setNetworkError(false);
    setUploadAreaKey(Date.now());
  }, []);

  // Error recovery function
  const handleErrorRecovery = useCallback(() => {
    setErrorMsg('');
    setLoading(false);
    setUploadProgress(0);
    setPredictionProgress(0);
    setStartTime(null);
    setElapsedTime(0);
    setRetryCount(0);
  }, []);

  // Submit prediction with improved error handling
  const handleConfirmPredict = async () => {
    if (!selectedFile) {
      setErrorMsg(ERROR_MESSAGES.NO_FILE_SELECTED);
      return;
    }

    setProcessingStage('Checking Flask ML service...');
    const serviceAvailable = await checkFlaskService();

    if (!serviceAvailable) {
      setErrorMsg(ERROR_MESSAGES.FLASK_SERVICE_UNAVAILABLE);
      return;
    }

    setResults(null);
    setErrorMsg('');
    setLoading(true);
    setStartTime(Date.now());
    setUploadProgress(0);
    setPredictionProgress(0);
    setRetryCount(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const token = localStorage.getItem('auth_token');

      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(uploadInterval);
            return 100;
          }
          return prev + 2;
        });
      }, 200);

      // Multiple endpoints with timeout and retry
      const endpoints = [
        '/api/predict-file',
        '/api/predict-file'
      ];

      let response = null;
      let lastError = null;

      // Try each endpoint with timeout
      for (let i = 0; i < endpoints.length; i++) {
        try {
          console.log(`🔄 Trying endpoint ${i + 1}/${endpoints.length}: ${endpoints[i]}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            controller.abort();
            console.log(`⏰ Timeout for endpoint: ${endpoints[i]}`);
          }, 600000); // 10 minutes timeout for large datasets

          response = await fetch(endpoints[i], {
            method: 'POST',
            body: formData,
            headers: {
              ...(token && { 'x-access-token': token })
            },
            credentials: 'include',
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            console.log(`✅ Successfully connected to: ${endpoints[i]}`);
            break;
          } else {
            console.log(`❌ Endpoint ${endpoints[i]} returned status: ${response.status}`);
            lastError = new Error(ERROR_MESSAGES.HTTP_ERROR(response.status, response.statusText));
            response = null;
          }
        } catch (fetchError) {
          console.log(`❌ Failed to connect to ${endpoints[i]}:`, fetchError.message);
          lastError = fetchError;
          response = null;
          
          if (fetchError.name === 'AbortError') {
            console.log(`⏰ Request timeout for ${endpoints[i]}`);
          }
        }
      }

      clearInterval(uploadInterval);
      setUploadProgress(100);

      if (!response) {
        throw lastError || new Error(ERROR_MESSAGES.ALL_ENDPOINTS_FAILED);
      }

      // Simulate prediction progress
      const predictionInterval = setInterval(() => {
        setPredictionProgress(prev => {
          if (prev >= 90) {
            clearInterval(predictionInterval);
            return 90;
          }
          return prev + 1;
        });
      }, 1000);

      const result = await response.json();
      clearInterval(predictionInterval);
      setPredictionProgress(100);

      if (result.success) {
        setResults(result.results);
        setProcessingStage(`✅ Completed! Processed ${result.results.length.toLocaleString()} rows successfully.`);
      } else {
        setErrorMsg(result.message || ERROR_MESSAGES.PREDICTION_FAILED);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setErrorMsg(ERROR_MESSAGES.CONNECTION_TIMEOUT);
      } else if (err.message.includes('Failed to fetch')) {
        setErrorMsg(ERROR_MESSAGES.CONNECTION_FAILED);
      } else {
        setErrorMsg(err.message || ERROR_MESSAGES.PREDICTION_FAILED);
      }
      console.error('Prediction error:', err);
    } finally {
      setLoading(false);
      setStartTime(null);
    }
  };

  // Format time
  const formatTime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Loading Spinner Component
  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="loader"></div>
      <div className="mt-6 text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          🚀 Processing Large Dataset
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {totalRows.toLocaleString()} rows • {formatFileSize(fileSize)}
        </p>
        <div className="w-80 space-y-4">
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Upload Progress</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Prediction Progress</span>
              <span>{predictionProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${predictionProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
        <div className="mt-4 text-xs text-gray-500 space-y-1">
          <div>Elapsed: {formatTime(elapsedTime)}</div>
          {estimatedTime > 0 && (
            <div>Estimated: ~{estimatedTime} minutes</div>
          )}
          {retryCount > 0 && (
            <div className="text-blue-600 font-medium">
              🔄 Retry attempt: {retryCount}/{maxRetries}
            </div>
          )}
          <div className="text-yellow-600 font-medium">
            ⏳ Large datasets may take 30-60 minutes to process
          </div>
        </div>
      </div>
    </div>
  );

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-bl from-gray-800 via-zinc-800 to-violet-950">
        <div className="text-white text-xl">Checking authentication...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative min-h-screen bg-gradient-animation flex flex-col">
      <Navbar />
      <div className="absolute inset-0 z-0" style={{
        backgroundImage: "url('/predictbg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'fixed',
        filter: 'brightness(0.5)',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}></div>

      <div className="absolute inset-0 w-full -mt-41 animated-background bg-gradient-to-bl from-gray-800 via-zinc-800 to-violet-950 z-0"></div>

      <div className="text-black relative z-20 w-full lg:w-2/3 bg-white p-8 rounded-lg shadow-lg mx-auto my-8">
        <h2 className="text-3xl font-bold mb-6 text-left">Upload Dataset for Prediction</h2>
        <p className="text-gray-600 mb-4">
          Upload a file with columns: SNR, P1, P2, ..., P30 (format .xlsx or .xls)
        </p>

        {/* Network Status Warning */}
        {!isOnline && (
          <div className="mb-4 p-4 bg-red-100 text-red-800 rounded border border-red-300">
            <h4 className="font-bold mb-2">🔴 No Internet Connection</h4>
            <p className="text-sm">{ERROR_MESSAGES.NETWORK_OFFLINE}</p>
          </div>
        )}

        {networkError && isOnline && (
          <div className="mb-4 p-4 bg-yellow-100 text-yellow-800 rounded border border-yellow-300">
            <h4 className="font-bold mb-2">⚠️ Previous Connection Issue</h4>
            <p className="text-sm">{ERROR_MESSAGES.NETWORK_PREVIOUS_ERROR}</p>
          </div>
        )}

        {/* Large file warning */}
        <div className="mb-4 p-4 bg-amber-100 text-amber-800 rounded border border-amber-300">
          <h4 className="font-bold mb-2">⚠️ Important Notice:</h4>
          <ul className="text-sm space-y-1">
            <li>• Only Excel files (.xlsx, .xls) are supported</li>
            <li>• Files with more than 100K rows may take several minutes to process</li>
            <li>• For optimal performance, split files with more than 100K rows</li>
            <li>• Keep the browser tab open during processing</li>
            <li>• Ensure stable internet connection for large files</li>
          </ul>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {!results && (
              <div key={uploadAreaKey}>
                <div
                  className="border-2 border-dashed rounded-xl p-12 text-center transition-colors duration-300 border-gray-300 hover:border-gray-400"
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    id="fileInput"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isProcessing}
                  />

                  <label htmlFor="fileInput" className={`cursor-pointer ${isProcessing ? 'pointer-events-none' : ''}`}>
                    <div className="text-gray-500 mb-4 flex flex-col items-center">
                      {/* FILE ICON */}
                      <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 48 48" stroke="currentColor">
                        <rect x="8" y="6" width="34" height="40" rx="4" fill="#e0e7ef" stroke="#64748b" strokeWidth="2"/>
                        <path d="M15 14h14M15 22h12M15 30h8" stroke="#64748b" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M32 6v8a2 2 0 002 2h8" stroke="#64748b" strokeWidth="2" fill="none"/>
                      </svg>
                      <p className="text-lg">
                        {isProcessing ? 'Processing...' : 'Choose File or Drag & Drop'}
                      </p>
                      <p className="text-sm text-gray-400 mt-2">
                        Supported: .xlsx, .xls (Max: 1GB)
                      </p>
                    </div>
                  </label>
                </div>

                {/* File info */}
                {selectedFile && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2">📁 File Information:</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><strong>File:</strong> {uploadedFileName}</div>
                      <div><strong>Size:</strong> {formatFileSize(fileSize)}</div>
                      <div><strong>Rows:</strong> {totalRows.toLocaleString()}</div>
                      <div><strong>Estimated Time:</strong> {estimatedTime > 0 ? `~${estimatedTime} minutes` : 'Calculating...'}</div>
                    </div>
                    {totalRows > 100000 && (
                      <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded text-sm">
                        <strong>⚠️ Large Dataset:</strong> {ERROR_MESSAGES.LARGE_DATASET_WARNING(totalRows)}
                      </div>
                    )}
                  </div>
                )}

                {/* Progress bar for file processing */}
                {isProcessing && (
                  <div className="mt-6">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Reading File...</span>
                      <span>{Math.round(processProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-blue-600 h-4 rounded-full transition-all duration-1000"
                        style={{ width: `${processProgress}%` }}
                      ></div>
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-sm text-blue-600 font-medium">{processingStage}</p>
                    </div>
                  </div>
                )}

                {/* Enhanced Error message */}
                {errorMsg && (
                  <div className="mt-4 p-4 bg-red-100 text-red-700 rounded border border-red-300">
                    <div className="flex justify-between items-start">
                      <div>
                        <strong>Error:</strong> {errorMsg}
                      </div>
                      <button
                        onClick={handleErrorRecovery}
                        className="ml-4 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Close
                      </button>
                    </div>
                    {errorMsg.includes('timeout') && (
                      <div className="mt-2 text-sm">
                        <strong>Suggestions:</strong>
                        <ul className="list-disc list-inside mt-1">
                          <li>Check your internet connection</li>
                          <li>Try splitting the file into smaller parts (&lt; 50MB)</li>
                          <li>Ensure the backend server is running properly</li>
                          <li>Wait a few minutes and try again</li>
                        </ul>
                      </div>
                    )}
                    {errorMsg.includes('connection') && (
                      <div className="mt-2 text-sm">
                        <strong>Troubleshooting:</strong>
                        <ul className="list-disc list-inside mt-1">
                          <li>Verify internet connection is stable</li>
                          <li>Check if backend server is accessible</li>
                          <li>Try refreshing the page</li>
                          <li>Contact administrator if problem persists</li>
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex justify-center gap-4 mt-6">
                  {selectedFile && totalRows > 0 && !isProcessing && (
                    <>
                      <button
                        onClick={handleUploadAgain}
                        className="bg-gray-500 hover:bg-gray-600 cursor-pointer text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-300"
                      >
                        Upload Different File
                      </button>
                      <button
                        onClick={handleConfirmPredict}
                        disabled={!isOnline}
                        className={`px-6 py-3 rounded-lg font-semibold transition-colors duration-300 ${
                          isOnline 
                            ? 'btn-gradient text-white hover:opacity-90' 
                            : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        }`}
                      >
                        {isOnline 
                          ? `Start Prediction (${totalRows.toLocaleString()} rows)`
                          : 'No Internet Connection'
                        }
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Results */}
        {results && results.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">
              ✅ Prediction Complete! ({results.length.toLocaleString()} rows processed)
            </h3>

            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{results.length.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Predictions</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {results.filter(r => r.prediction === 'Normal').length.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Normal</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {results.filter(r => r.prediction && r.prediction !== 'Normal').length.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Faults Detected</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {results.filter(r => r.error).length.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Errors</div>
              </div>
            </div>

            {/* Sample results table */}
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="min-w-full text-sm border border-gray-300">
                <thead className="sticky top-0 bg-gray-200">
                  <tr>
                    <th className="p-2 border border-gray-300 font-semibold">#</th>
                    <th className="p-2 border border-gray-300 font-semibold">Prediction</th>
                    <th className="p-2 border border-gray-300 font-semibold">Confidence (%)</th>
                    <th className="p-2 border border-gray-300 font-semibold">SNR</th>
                    <th className="p-2 border border-gray-300 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.slice(0, 100).map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="border border-gray-300 p-2 text-center">{row.row}</td>
                      <td className="border border-gray-300 p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          row.prediction === 'Normal' ? 'bg-green-100 text-green-800' :
                          row.prediction ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {row.prediction || 'N/A'}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        {row.confidence !== undefined ? `${row.confidence}%` : '-'}
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        {row.snr_raw !== undefined ? row.snr_raw : '-'}
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        {row.error ? (
                          <span className="text-red-500 text-xs">Error</span>
                        ) : (
                          <span className="text-green-500 text-xs">✓</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {results.length > 100 && (
              <div className="mt-4 p-3 bg-blue-100 text-blue-800 rounded text-center">
                <p className="text-sm">Showing first 100 results of {results.length.toLocaleString()} total predictions.</p>
              </div>
            )}

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleUploadAgain}
                className="bg-gray-500 hover:bg-gray-600 cursor-pointer text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-300"
              >
                Upload Different File
              </button>
              <button
                onClick={() => router.push('/history')}
                className="bg-blue-800 text-white rounded-lg py-3 px-6 font-semibold hover:bg-blue-900 cursor-pointer transition-all duration-200"
              >
                View History
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AltPage;
