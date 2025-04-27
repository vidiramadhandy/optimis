'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';  // Gunakan useRouter dari next/navigation untuk Next.js 13+
import axios from 'axios';

const SignUp = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const router = useRouter();  // Inisialisasi useRouter untuk navigasi

    const apiUrl = 'http://localhost:8000/api';  // Ganti dengan URL API backend Anda

    const [isClient, setIsClient] = useState(false);

    // Pastikan kode berikut hanya dijalankan di sisi klien
    useEffect(() => {
        setIsClient(true);  // Menandakan bahwa kita sudah di sisi klien
    }, []);

    const getCSRFToken = () => {
        // Ambil CSRF token dari cookie jika sudah di sisi klien
        const match = document.cookie.match(new RegExp('(^| )XSRF-TOKEN=([^;]+)'));
        return match ? match[2] : '';
    };

    // Mengatur CSRF token di header hanya jika sudah di sisi klien
    useEffect(() => {
        if (isClient) {
            const csrfToken = getCSRFToken();
            axios.defaults.headers.common['X-XSRF-TOKEN'] = csrfToken;
        }
    }, [isClient]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Mengirimkan permintaan POST untuk registrasi
            const response = await axios.post(`${apiUrl}/register`, { name, email, password });
            
            // Reset form setelah registrasi berhasil
            setEmail('');
            setPassword('');
            setName('');
            
            // Set success message
            setSuccessMessage('User successfully created!');
            
            // Tampilkan alert setelah user berhasil registrasi
            alert('User successfully created!');

            // Navigasi ke halaman login setelah registrasi berhasil
            router.push('/login');
        } catch (e) {
            // Menangani error dan menampilkan pesan yang sesuai
            if (e.response && e.response.data) {
                setError(e.response.data.message || 'Something went wrong. Please try again.');
            } else {
                setError('Something went wrong. Please try again.');
            }
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

                    {successMessage && <div className="text-green-500 text-sm mt-4">{successMessage}</div>}

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
