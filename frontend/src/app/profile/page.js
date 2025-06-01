'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const Profile = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('userData');
      sessionStorage.removeItem('auth_token');
      
      setTimeout(() => {
        router.push('/login');
      }, 500);
    } catch (error) {
      console.error('Error during logout:', error);
      setIsLoggingOut(false);
    }
  };

  const handleBack = () => {
    router.push('/home'); // Perbaikan: arahkan ke halaman home
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-teal-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-zinc-900 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          
          {/* Header dengan tombol kembali - Perbaikan posisi */}
          <div className="relative bg-gradient-to-r from-gray-800 to-indigo-800 px-6 py-6 pb-16">
            <button
              onClick={handleBack}
              className="absolute left-4 top-4 p-2 rounded-full bg-white/20 hover:bg-white/30 cursor-pointer transition-colors duration-200"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-white text-center mt-2">User Profile</h1>
          </div>

          {/* Avatar Section - Perbaikan posisi */}
          <div className="relative -mt-8 flex justify-center mb-4">
            <div className={`w-20 h-20 rounded-full ${getAvatarColor(user.name)} flex items-center justify-center border-4 border-white shadow-lg`}>
              <span className="text-xl font-bold text-white">
                {getInitials(user.name)}
              </span>
            </div>
          </div>

          {/* Profile Content */}
          <div className="px-6 py-4">
            
            {/* User Info Cards */}
            <div className="space-y-4 mb-6">
              
              {/* Name Card */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <label className="text-sm font-medium text-gray-600">Full Name</label>
                </div>
                <p className="text-lg font-semibold text-gray-800">{user.name}</p>
              </div>

              {/* Email Card */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <label className="text-sm font-medium text-gray-600">Email Address</label>
                </div>
                <p className="text-lg font-semibold text-gray-800">{user.email}</p>
              </div>

              {/* Member Since */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <label className="text-sm font-medium text-gray-600">Member Since</label>
                </div>
                <p className="text-lg font-semibold text-gray-800">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'January 2025'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              
              {/* Edit Profile Button */}
              <button
                onClick={() => router.push('/profile/edit')}
                className="w-full py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 cursor-pointer transition-colors duration-200 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 cursor-pointer transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging out...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Quick Actions
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => router.push('/predict')}
              className="p-4 bg-green-50 rounded-xl border border-green-200 hover:bg-green-100 cursor-pointer transition-colors duration-200"
            >
              <div className="text-center">
                <svg className="w-8 h-8 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <p className="text-sm font-medium text-green-700">New Prediction</p>
              </div>
            </button>
            
            <button
              onClick={() => router.push('/history')}
              className="p-4 bg-purple-50 rounded-xl border border-purple-200 hover:bg-purple-100 cursor-pointer transition-colors duration-200"
            >
              <div className="text-center">
                <svg className="w-8 h-8 text-purple-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-purple-700">View History</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
