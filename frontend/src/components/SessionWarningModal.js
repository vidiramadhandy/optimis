// src/components/SessionWarningModal.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';

const SessionWarningModal = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 menit
  const { user, extendSession, getRemainingTime } = useAuth();

  useEffect(() => {
    if (!user) return;

    const checkSession = () => {
      const remaining = getRemainingTime();
      const fiveMinutes = 5 * 60 * 1000; // 5 menit

      if (remaining <= fiveMinutes && remaining > 0) {
        setShowWarning(true);
        setCountdown(Math.floor(remaining / 1000));
      } else {
        setShowWarning(false);
      }
    };

    const interval = setInterval(checkSession, 1000);
    return () => clearInterval(interval);
  }, [user, getRemainingTime]);

  const handleExtendSession = () => {
    extendSession();
    setShowWarning(false);
  };

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Sesi Akan Berakhir
        </h3>
        <p className="text-gray-600 mb-4">
          Sesi Anda akan berakhir dalam {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')} menit. 
          Apakah Anda ingin melanjutkan?
        </p>
        <div className="flex space-x-4">
          <button
            onClick={handleExtendSession}
            className="btn-gradient px-4 py-2 rounded-md flex-1"
          >
            Lanjutkan Sesi
          </button>
          <button
            onClick={() => setShowWarning(false)}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md flex-1"
          >
            Biarkan Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionWarningModal;
