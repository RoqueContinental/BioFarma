<?php

use App\Http\Controllers\PacienteController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;


Route::get('/', function () {
    return view('index');
});

Route::get('/dashboard', function () {
    return view('dashboard');
});

Route::get('/pacientes', function () {
    return view('pacientes');
});

Route::get('/triaje', function () {
    return view('triaje'); 
});

Route::get('/diagnostico', function () {
    return view('diagnostico');
});

Route::get('/vademecum', function () {
    return view('vademecum');
});

Route::get('/reportes', function () {
    return view('reportes');
});

// Rutas de Autenticación
Route::post('/api/login', [AuthController::class, 'login']);
Route::post('/api/logout', [AuthController::class, 'logout']);

Route::get('/pacientes/listar', [PacienteController::class, 'index']);
Route::get('/pacientes/hoy', [PacienteController::class, 'pacientesHoy']);
Route::post('/pacientes/guardar', [PacienteController::class, 'store']);
Route::get('/pacientes/buscar/{dni}', [PacienteController::class, 'buscar']);
Route::post('/pacientes/eliminar', [PacienteController::class, 'destroy']);

// Rutas de Triaje
Route::post('/triaje/guardar', [PacienteController::class, 'guardarTriaje']);
Route::get('/triaje/listar/{fecha}', [PacienteController::class, 'listarTriajeFecha']);
Route::get('/triaje/historial/{dni}', [PacienteController::class, 'historialTriajeDNI']);

// Rutas de Gestión de Usuarios
Route::get('/usuarios/listar', [UserController::class, 'index']);
Route::post('/usuarios/guardar', [UserController::class, 'store']);
Route::post('/usuarios/eliminar', [UserController::class, 'destroy']);

Route::get('/logout', function () {
    return redirect('/');
});