<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;

// Route untuk registrasi
Route::post('/register', [RegisteredUserController::class, 'store']);

// Route untuk login
Route::post('/login', [AuthenticatedSessionController::class, 'store']);

// Route yang dilindungi oleh middleware auth:sanctum
Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});
