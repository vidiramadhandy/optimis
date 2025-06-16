'use client'; // Menandakan bahwa ini adalah client component

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

        setLoading(true);
        setErrors({});
        setSuccessMessage('');

        try {
            const response = await fetch('http://20.189.116.138:5000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password, password_confirmation: passwordConfirmation }),
            });

            const data = await response.json();

            if (response.ok) {
            setSuccessMessage('User successfully registered!');
            router.push('/login');
            } else {
            // Handle specific error for email already taken
            if (data.message === 'Email already taken') {
                setErrors({ general: 'Email already registered. Please use a different email.' });
            } else {
                setErrors(data.error ? { general: data.error } : { general: 'Something went wrong. Please try again.' });
            }
            }
        } catch (error) {
            console.error('Error during registration:', error);
            setErrors({ general: 'Something went wrong. Please try again.' });
        } finally {
            setLoading(false);
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

                        <div className="flex text-sm text-gray-600items-center justify-center mt-6">
                            Already registered?
                            <Link
                                href="/login"
                                className="underline text-sm text-gray-600 hover:text-gray-900 transition-colors">
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
