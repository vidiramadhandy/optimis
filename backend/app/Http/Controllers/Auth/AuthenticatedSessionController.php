<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthenticatedSessionController extends Controller
{
    /**
     * Handle an incoming authentication request.
     */
    public function store(Request $request)
    {
        // Validasi kredensial
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        // Cek apakah kredensial valid dan lakukan autentikasi
        if (Auth::attempt($credentials)) {
            // Regenerasi sesi untuk meningkatkan keamanan
            $request->session()->regenerate();

            // Ambil pengguna yang sudah terautentikasi
            $user = Auth::user();

            // Buat token untuk pengguna setelah login
            $token = $user->createToken('YourAppName')->plainTextToken;

            // Mengembalikan respons dengan token dan user
            return response()->json([
                'message' => 'Login successful.',
                'token' => $token,  // Menyertakan token dalam respons
                'user' => $user,
            ]);
        }

        // Jika kredensial salah
        throw ValidationException::withMessages([
            'email' => ['The provided credentials are incorrect.'],
        ]);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }
}
