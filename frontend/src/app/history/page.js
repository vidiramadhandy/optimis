'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/navbar';

const History = () => {
  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Load history data from localStorage with duplicate removal
    const loadHistory = () => {
      try {
        const savedHistory = localStorage.getItem('predictionHistory');
        if (savedHistory) {
          const parsedHistory = JSON.parse(savedHistory);
          
          // Remove duplicates automatically
          const uniqueHistory = removeDuplicateEntries(parsedHistory);
          
          // Update localStorage with cleaned data
          if (uniqueHistory.length !== parsedHistory.length) {
            localStorage.setItem('predictionHistory', JSON.stringify(uniqueHistory));
          }
          
          setHistoryData(uniqueHistory);
        } else {
          setHistoryData([]);
        }
      } catch (error) {
        console.error('Error loading history:', error);
        setHistoryData([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, []);

  // Function to remove duplicate entries
  const removeDuplicateEntries = (historyArray) => {
    const uniqueItems = [];
    const seenKeys = new Set();

    for (const item of historyArray) {
      // Create unique key based on inputs, SNR, result, and date
      const uniqueKey = `${JSON.stringify(item.inputs)}_${item.snr}_${item.result}_${item.date}_${item.inputType}`;
      
      // Check if this exact combination already exists
      if (!seenKeys.has(uniqueKey)) {
        seenKeys.add(uniqueKey);
        uniqueItems.push(item);
      }
    }

    // Sort by timestamp (newest first)
    return uniqueItems.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  // Function to manually clean duplicates
  const cleanDuplicates = () => {
    const originalLength = historyData.length;
    const cleanedHistory = removeDuplicateEntries(historyData);
    
    setHistoryData(cleanedHistory);
    localStorage.setItem('predictionHistory', JSON.stringify(cleanedHistory));
    
    const removedCount = originalLength - cleanedHistory.length;
    if (removedCount > 0) {
      alert(`Removed ${removedCount} duplicate entries`);
    } else {
      alert('No duplicates found');
    }
  };

  // Function to clear all history
  const clearAllHistory = () => {
    if (confirm('Are you sure you want to clear all prediction history? This action cannot be undone.')) {
      setHistoryData([]);
      localStorage.removeItem('predictionHistory');
    }
  };

  // Function to delete single item
  const deleteItem = (itemId) => {
    if (confirm('Are you sure you want to delete this prediction?')) {
      const updatedHistory = historyData.filter(item => item.id !== itemId);
      setHistoryData(updatedHistory);
      localStorage.setItem('predictionHistory', JSON.stringify(updatedHistory));
    }
  };

  const handleViewDetail = (historyItem) => {
    // Save data to localStorage for detail page
    localStorage.setItem('selectedHistoryItem', JSON.stringify(historyItem));
    router.push('/history/detail');
  };

  const getResultColor = (result) => {
    switch (result) {
      case 'Normal':
        return 'text-green-600 bg-green-100';
      case 'Fiber Tapping':
        return 'text-purple-600 bg-purple-100';
      case 'Bad Splice':
        return 'text-orange-600 bg-orange-100';
      case 'Bending':
        return 'text-yellow-600 bg-yellow-100';
      case 'Dirty Connector':
        return 'text-blue-600 bg-blue-100';
      case 'Fiber Cut':
        return 'text-red-600 bg-red-100';
      case 'PC Connector':
        return 'text-indigo-600 bg-indigo-100';
      case 'Reflector':
        return 'text-gray-600 bg-gray-100';
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
        <h1>OptiPredict History</h1>
      </div>

      {/* Animated Background Overlay */}
      <div className="absolute inset-0 w-full mt-28 animated-background bg-gradient-to-tl from-gray-800 via-neutral-800 to-indigo-800 z-0"></div>
      
      {/* Main Content */}
      <div className="text-black relative z-20 w-full lg:w-4/5 bg-white py-6 px-8 rounded-lg shadow-lg mx-auto my-8">
        
        {/* Header with action buttons */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-left">Prediction History</h2>
          
          {historyData.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={cleanDuplicates}
                className="px-4 py-2 bg-orange-500 text-white text-sm rounded-md hover:bg-orange-600 transition-colors duration-300"
                title="Remove duplicate entries"
              >
                Clean Duplicates
              </button>
              <button
                onClick={clearAllHistory}
                className="px-4 py-2 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors duration-300"
                title="Clear all history"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-lg text-gray-600">Loading history...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {historyData.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <p className="text-xl">No prediction history found</p>
                <p className="text-sm mt-2">Start making predictions to see your history here</p>
                <button
                  onClick={() => router.push('/predict')}
                  className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-300"
                >
                  Make Your First Prediction
                </button>
              </div>
            ) : (
              <>
                {/* Show total count */}
                <div className="mb-4 text-sm text-gray-600">
                  Total predictions: {historyData.length}
                </div>
                
                <table className="w-full border-collapse border border-gray-400">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-400 px-4 py-3 text-left font-semibold">No</th>
                      <th className="border border-gray-400 px-4 py-3 text-left font-semibold">Date</th>
                      <th className="border border-gray-400 px-4 py-3 text-left font-semibold">Input Type</th>
                      <th className="border border-gray-400 px-4 py-3 text-left font-semibold">Fault Result</th>
                      <th className="border border-gray-400 px-4 py-3 text-left font-semibold">Confidence</th>
                      <th className="border border-gray-400 px-4 py-3 text-center font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyData.map((item, index) => (
                      <tr key={`${item.id}-${index}`} className="hover:bg-gray-50 transition-colors duration-200">
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
                        <td className="border border-gray-400 px-4 py-3 font-semibold">
                          {item.confidence}%
                        </td>
                        <td className="border border-gray-400 px-4 py-3 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleViewDetail(item)}
                              className="px-3 py-1 bg-green-500 text-white text-sm rounded-md transition-all duration-300 ease-in-out hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                              View
                            </button>
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="px-3 py-1 bg-red-500 text-white text-sm rounded-md transition-all duration-300 ease-in-out hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
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
