'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Ganti useNavigate dengan useRouter dari next/router
import axios from 'axios';

const SignUp = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter(); // Inisialisasi useRouter untuk navigasi

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await axios.post(`${apiUrl}/register`, { name, email, password });
            setEmail('');
            setPassword('');
            setName('');
            router.push('/'); // Gunakan router.push untuk navigasi
        } catch (e) {
            setError('Something went wrong. Please try again.');
            console.log(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="absolute inset-0 w-full animated-background bg-linear-to-tl from-gray-800 via-neutral-800 to-indigo-800 flex items-center justify-center">
            <div className="text-gray-800 relative z-20 w-full max-w-md bg-white p-8 rounded-lg shadow-lg mx-4">
                <div className="text-4xl font-bold mb-4 text-center">
                    <h1>Sign Up for OptiPredict</h1>
                </div>
                <form onSubmit={handleSubmit}>
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

                    <div className="mb-6">
                        <label htmlFor="password" className="block text-lg font-medium text-gray-700">
                            Password
                        </label>
                        <input 
                            type="password" 
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="text-black w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all duration-300 ease-in-out"
                        />
                    </div>

                    {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

                    <button
                        type="submit"
                        className={`w-full py-3 mt-4 ${loading ? 'bg-gray-400' : 'bg-green-500'} text-white text-lg font-bold rounded-md hover:bg-emerald-600 focus:outline-none focus:ring-2 transition-all duration-300 ease-in-out cursor-pointer`}
                        disabled={loading}
                    >
                        {loading ? 'Signing Up...' : 'Sign Up!'}
                    </button>

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
