'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const SignUp = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    const handleSubmit = (e) => {
        e.preventDefault();
        // Proses pendaftaran pengguna
        console.log({ name, email, password });
        // Redirect ke halaman login setelah pendaftaran berhasil
        router.push('/login');
    };

    return (
        <div className="relative min-h-screen bg-gray-100 flex items-center justify-center">
            {/* Background Image */}
            <div 
                className="absolute inset-0 z-0"
                style={{
                    backgroundColor: '#1e293b',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0, 
                }}
            ></div>

            {/* Form Sign Up */}
            <div className="text-gray-800 relative z-20 w-full max-w-md bg-white p-8 rounded-lg shadow-lg mx-4">
                <div className="text-4xl font-bold mb-4 text-center">
                    <h1>Sign Up for OptiPredict</h1>
                </div>
                <form onSubmit={handleSubmit}>
                    {/* Name Input */}
                    <div className="mb-6">
                        <label htmlFor="name" className="block text-lg font-medium text-gray-700">
                            Name
                        </label>
                        <input 
                            type="text" 
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="text-black w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all duration-300 ease-in-out"
                        />
                    </div>

                    {/* Email Input */}
                    <div className="mb-6">
                        <label htmlFor="email" className="block text-lg font-medium text-gray-700">
                            Email
                        </label>
                        <input 
                            type="email" 
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="text-black w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all duration-300 ease-in-out"
                        />
                    </div>

                    {/* Password Input */}
                    <div className="mb-6">
                        <label htmlFor="email" className="block text-lg font-medium text-gray-700">
                            Password
                        </label>
                        <input 
                            type="password" 
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    {/* Register Button */}
                    <button
                        type="submit"
                        className="w-full py-3 mt-4 bg-green-500 text-white text-lg font-bold rounded-md hover:bg-emerald-600 focus:outline-none focus:ring-2 transition-all duration-300 ease-in-out cursor-pointer"
                    >
                        Sign Up!
                    </button>

                    {/* Already have an account */}
                    <p className="mt-4 text-black text-center text-sm">
                        Already have an account? 
                        <a href="/login" className="text-blue-400 hover:text-blue-800">Log in here</a>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default SignUp;
