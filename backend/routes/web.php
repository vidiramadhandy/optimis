<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthenticatedSessionController;

Route::get('/', function () {
    return ['Laravel' => app()->version()];
});

Route::group(['middleware' => ['web']], function () {
    return ['/home'];
});

// Perbaiki ini untuk mengarah ke metode `store`
Route::post('/user/login', [AuthenticatedSessionController::class, 'store'])->middleware('web');

Route::get('/sanctum/csrf-cookie', function () {
    return response()->json(['message' => 'CSRF cookie set']);
});

require __DIR__.'/auth.php';
