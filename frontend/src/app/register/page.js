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
    const router = useRouter();  // Inisialisasi useRouter untuk navigasi

    const submitForm = async (event) => {
        event.preventDefault();

        // Validasi password confirmation
        if (password !== passwordConfirmation) {
            setErrors({ password_confirmation: 'Passwords do not match' });
            return;
        }

        setLoading(true);
        setErrors({});  // Clear previous errors
        setSuccessMessage('');  // Clear previous success message

        try {
            const response = await fetch('http://localhost:8000/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password, password_confirmation: passwordConfirmation }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage('User successfully registered!');
                router.push('/login'); // Redirect to login page after registration
            } else {
                setErrors(data.error ? { general: data.error } : { general: 'Something went wrong. Please try again.' });
            }
        } catch (error) {
            console.error('Error during registration:', error);
            setErrors({ general: 'Something went wrong. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="absolute inset-0 w-full animated-background bg-linear-to-tl from-gray-800 via-neutral-800 to-indigo-800 flex items-center justify-center">
            <div className="text-gray-800 relative z-20 w-full max-w-md bg-white p-8 rounded-lg shadow-lg mx-4">
                <div className="text-3xl font-bold mb-2 text-center">
                    <h1>Sign Up for OptiPredict</h1>
                </div>

                <form onSubmit={submitForm}>
                    <div className="mt-2">
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
                        <InputError messages={errors.name} className="mt-2" />
                    </div>

                    <div className="mt-2">
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
                        <InputError messages={errors.email} className="mt-2" />
                    </div>

                    <div className="mt-2">
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
                        <InputError messages={errors.password} className="mt-2" />
                    </div>

                    <div className="mt-2">
                        <label htmlFor="passwordConfirmation" className="block text-lg font-medium text-gray-700">
                            Confirm Password
                        </label>
                        <input 
                            type="password" 
                            id="passwordConfirmation"
                            value={passwordConfirmation}
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                            required
                            className="text-black w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all duration-300 ease-in-out"
                        />
                        <InputError messages={errors.password_confirmation} className="mt-2" />
                    </div>

                    {errors.general && (
                        <div className="text-red-500 text-sm mt-4">{errors.general}</div>
                    )}

                    <button
                        type="submit"
                        className={`w-full py-3 mt-4 ${loading ? 'bg-gray-400' : 'bg-green-500'} text-white text-lg font-bold rounded-md hover:bg-emerald-600 focus:outline-none focus:ring-2 transition-all duration-300 ease-in-out cursor-pointer`}
                        disabled={loading}
                    >
                        {loading ? 'Signing Up...' : 'Sign Up!'}
                    </button>

                    {successMessage && <div className="text-green-500 text-sm mt-4">{successMessage}</div>}

                    <div className="flex items-center justify-start mt-4">
                        <Link
                            href="/login"
                            className="underline text-sm text-gray-600 hover:text-gray-900">
                             Already registered?
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
