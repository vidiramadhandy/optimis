<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Laravel\Sanctum\HasApiTokens;

class RegisteredUserController extends Controller
{
    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request)
    {
        // Validasi input dari form registrasi
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'confirmed', Password::defaults()],
        ]);

        // Membuat pengguna baru di database
        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        // Meng-trigger event Registered (opsional)
        event(new Registered($user));

        // Buat token untuk pengguna setelah registrasi
        $token = $user->createToken('YourAppName')->plainTextToken;

        // Mengembalikan respons dengan token dan data pengguna
        return response()->json([
            'message' => 'User registered successfully.',
            'token' => $token,  // Menyertakan token dalam respons
            'user' => $user,
        ], 201);
    }
}
