// frontend/src/app/register/page.js - PERBAIKAN LENGKAP
'use client';

import InputError from '@/components/InputError';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const router = useRouter();

    const submitForm = async (event) => {
        event.preventDefault();

        // Validasi password confirmation
        if (password !== passwordConfirmation) {
            setErrors({ password_confirmation: 'Passwords do not match' });
            return;
        }

        // Validasi input
        if (!name.trim() || !email.trim() || !password.trim()) {
            setErrors({ general: 'All fields are required' });
            return;
        }

        setLoading(true);
        setErrors({});
        setSuccessMessage('');

        try {
            // ✅ PERBAIKI URL - PASTIKAN BENAR
            const API_URL = 'https://optipredict-backend-d0gmgaercxhbfc0.centralus-01.azurewebsites.net';
            
            console.log('📤 Sending registration request to:', `${API_URL}/api/auth/register`);
            console.log('📤 Data:', { name, email, password });
            
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ 
                    name: name.trim(), 
                    email: email.trim().toLowerCase(), 
                    password: password 
                }),
            });

            console.log('📥 Response status:', response.status);
            console.log('📥 Response ok:', response.ok);
            console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

            // ✅ GET RESPONSE TEXT FIRST UNTUK DEBUGGING
            const responseText = await response.text();
            console.log('📥 Raw response text:', responseText);

            // ✅ CHECK IF RESPONSE IS EMPTY
            if (!responseText.trim()) {
                throw new Error('Empty response from server');
            }

            // ✅ CHECK IF RESPONSE IS HTML (ERROR PAGE)
            if (responseText.trim().startsWith('<')) {
                throw new Error('Server returned HTML instead of JSON. Check backend logs.');
            }

            // ✅ TRY TO PARSE JSON
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('❌ JSON parse error:', parseError);
                console.error('❌ Response text that failed to parse:', responseText);
                throw new Error(`Invalid JSON response: ${parseError.message}`);
            }

            console.log('📥 Parsed data:', data);

            if (response.ok && data.success) {
                setSuccessMessage(data.message || 'User successfully registered!');
                setTimeout(() => {
                    router.push('/login');
                }, 2000);
            } else {
                const errorMessage = data.message || data.error || 'Registration failed';
                setErrors({ general: errorMessage });
            }

        } catch (error) {
            console.error('❌ Error during registration:', error);
            
            if (error.message.includes('Empty response')) {
                setErrors({ general: 'Server tidak merespons. Silakan coba lagi.' });
            } else if (error.message.includes('HTML instead of JSON')) {
                setErrors({ general: 'Server error. Silakan coba lagi nanti.' });
            } else if (error.message.includes('Invalid JSON')) {
                setErrors({ general: 'Response server tidak valid. Silakan coba lagi.' });
            } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
                setErrors({ general: 'Tidak dapat terhubung ke server. Periksa koneksi internet.' });
            } else {
                setErrors({ general: error.message || 'Something went wrong. Please try again.' });
            }
        } finally {
            setLoading(false);
        }
    };

    // ✅ ENHANCED TEST CONNECTION FUNCTION
    const testConnection = async () => {
        try {
            setSuccessMessage('Testing connection...');
            setErrors({});
            
            const API_URL = 'https://optipredict-backend-d0gmgaercxhbfc0.centralus-01.azurewebsites.net';
            
            console.log('🔍 Testing connection to:', `${API_URL}/api/health`);
            
            const response = await fetch(`${API_URL}/api/health`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });
            
            console.log('📥 Health check response status:', response.status);
            console.log('📥 Health check response ok:', response.ok);
            
            const responseText = await response.text();
            console.log('📥 Health check raw response:', responseText);
            
            if (responseText.trim()) {
                try {
                    const data = JSON.parse(responseText);
                    setSuccessMessage(`✅ Connection successful: ${data.status || 'OK'}`);
                } catch (parseError) {
                    setSuccessMessage(`✅ Connection successful but response not JSON: ${responseText.substring(0, 100)}...`);
                }
            } else {
                setErrors({ general: '❌ Connection failed: Empty response' });
            }
        } catch (error) {
            console.error('❌ Connection test error:', error);
            setErrors({ general: `❌ Connection failed: ${error.message}` });
        }
    };

    return (
        <div className="min-h-screen relative">
            {/* Advanced Gradient Morph Background */}
            <div className="gradient-bg bg-gray-800">
                <div className="gradients-container">
                    <div className="g1"></div>
                    <div className="g2"></div>
                    <div className="g3"></div>
                    <div className="g4"></div>
                    <div className="g5"></div>
                </div>
            </div>

            {/* Content Layer */}
            <div className="relative z-10 flex items-center justify-center min-h-screen">
                <div className="text-gray-800 w-full max-w-md bg-white/95 backdrop-blur-sm p-8 rounded-lg shadow-xl mx-4">
                    <div className="text-3xl font-bold mb-6 text-center">
                        <h1>Sign Up for OptiPredict</h1>
                    </div>

                    {/* ✅ ENHANCED TEST CONNECTION BUTTON */}
                    <div className="mb-4">
                        <button
                            type="button"
                            onClick={testConnection}
                            className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
                        >
                            Test Connection
                        </button>
                    </div>

                    <form onSubmit={submitForm}>
                        <div className="mb-4">
                            <label htmlFor="name" className="block text-lg font-medium text-gray-700 mb-2">
                                Name
                            </label>
                            <input 
                                type="text" 
                                id="name"
                                value={name}
                                placeholder="Name"
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="text-black w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-300 ease-in-out"
                            />
                            <InputError messages={errors.name} className="mt-2" />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="email" className="block text-lg font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <input 
                                type="email" 
                                id="email"
                                value={email}
                                placeholder="Email"
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="text-black w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-300 ease-in-out"
                            />
                            <InputError messages={errors.email} className="mt-2" />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="password" className="block text-lg font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input 
                                type="password" 
                                id="password"
                                value={password}
                                placeholder="Password"
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="text-black w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-300 ease-in-out"
                            />
                            <InputError messages={errors.password} className="mt-2" />
                        </div>

                        <div className="mb-6">
                            <label htmlFor="passwordConfirmation" className="block text-lg font-medium text-gray-700 mb-2">
                                Confirm Password
                            </label>
                            <input 
                                type="password" 
                                id="passwordConfirmation"
                                placeholder="Confirm your Password"
                                value={passwordConfirmation}
                                onChange={(e) => setPasswordConfirmation(e.target.value)}
                                required
                                className="text-black w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-300 ease-in-out"
                            />
                            <InputError messages={errors.password_confirmation} className="mt-2" />
                        </div>

                        {errors.general && (
                            <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 rounded-md">
                                {errors.general}
                            </div>
                        )}

                        <button
                            type="submit"
                            className={`btn-gradient w-full py-3 text-lg font-bold rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer ${
                                loading ? 'opacity-50' : ''
                            }`}
                            disabled={loading}
                        >
                            {loading ? 'Signing Up...' : 'Sign Up!'}
                        </button>

                        {successMessage && (
                            <div className="text-green-500 text-sm mt-4 p-3 bg-green-50 rounded-md">
                                {successMessage}
                            </div>
                        )}

                        <div className="flex text-sm text-gray-600 items-center justify-center mt-6">
                            Already registered?
                            <Link
                                href="/login"
                                className="underline text-sm text-gray-600 hover:text-gray-900 transition-colors ml-1">
                                Sign in here
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;
