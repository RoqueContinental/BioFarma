<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PacienteController;
use App\Http\Controllers\TriajeController;
use App\Http\Controllers\MedicamentoController;

// Vistas Principales
Route::get('/', function () { return view('index'); })->name('login');
Route::get('/dashboard', function () { return view('dashboard'); });
Route::get('/pacientes', function () { return view('pacientes'); });
Route::get('/triaje', function () { return view('triaje'); });
Route::get('/vademecum', function () { return view('vademecum'); });
Route::get('/diagnostico', function () { return view('diagnostico'); });

// Autenticación
Route::post('/api/login', [AuthController::class, 'login']);
Route::post('/api/logout', [AuthController::class, 'logout']);

// Gestión de Pacientes
Route::prefix('pacientes')->group(function () {
    Route::get('/listar', [PacienteController::class, 'index']);
    Route::post('/guardar', [PacienteController::class, 'store']);
    Route::post('/eliminar', [PacienteController::class, 'destroy']); // Baja lógica (Estado=0)
    Route::get('/buscar/{dni}', [PacienteController::class, 'buscar']);
});

// Gestión de Triaje
Route::prefix('triaje')->group(function () {
    Route::get('/listar', [TriajeController::class, 'index']);
    Route::post('/guardar', [TriajeController::class, 'store']);
    Route::get('/historial/{dni}', [TriajeController::class, 'historial']);
});

// Gestión de Vademécum / Medicamentos
Route::prefix('medicamentos')->group(function () {
    Route::get('/listar', [MedicamentoController::class, 'listar']);
    Route::post('/guardar', [MedicamentoController::class, 'guardar']);
    Route::post('/eliminar', [MedicamentoController::class, 'eliminar']);
});