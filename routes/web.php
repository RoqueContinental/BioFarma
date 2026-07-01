<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DiagnosticoController;
use App\Http\Controllers\MedicamentoController;
use App\Http\Controllers\PacienteController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TriajeController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/diagnostico/generar', [DiagnosticoController::class, 'generarIA']);

// Vistas Principales
Route::get('/', function () {
    return view('index');
})->name('login');
Route::get('/dashboard', function () {
    return view('dashboard');
})->name('dashboard');
Route::get('/pacientes', function () {
    return view('pacientes');
})->name('pacientes');
Route::get('/triaje', function () {
    return view('triaje');
})->name('triaje');
Route::get('/vademecum', function () {
    return view('vademecum');
})->name('vademecum');
Route::get('/diagnostico', function () {
    return view('diagnostico');
})->name('diagnostico');
Route::get('/reportes', function () {
    return view('reportes');
})->name('reportes');
Route::get('/usuarios', function () {
    return view('usuarios');
})->name('usuarios');

// Alias adicional por si el sistema busca en singular
Route::get('/reporte', function () {
    return view('reportes');
});

// Autenticación
Route::post('/api/login', [AuthController::class, 'login']);
Route::post('/api/logout', [AuthController::class, 'logout']);
Route::get('/logout', [AuthController::class, 'logout']); // Fallback para enlaces simples

// Gestión de Pacientes
Route::prefix('pacientes')->group(function () {
    Route::get('/listar', [PacienteController::class, 'index']);
    Route::get('/hoy', [PacienteController::class, 'pacientesHoy']);
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
    Route::get('/buscar/{criterio}', [MedicamentoController::class, 'buscar']);
    Route::post('/guardar', [MedicamentoController::class, 'guardar']);
    Route::post('/eliminar', [MedicamentoController::class, 'eliminar']);
});

// Gestión de Usuarios (Personal de Salud)
Route::prefix('usuarios')->group(function () {
    Route::get('/listar', [UserController::class, 'index']);
    Route::post('/guardar', [UserController::class, 'store']);
    Route::post('/eliminar', [UserController::class, 'destroy']);
});

// Gestión de Reportes
Route::prefix('reportes')->group(function () {
    Route::get('/data/{period}', [ReportController::class, 'getReportData']);
});

// Gestión de Diagnósticos y Recetas
Route::prefix('diagnosticos')->group(function () {
    Route::get('/buscar-paciente/{dni}', [DiagnosticoController::class, 'buscarPaciente']);
    Route::post('/generar-ia', [DiagnosticoController::class, 'generarIA']);
    Route::post('/guardar', [DiagnosticoController::class, 'guardar']);
    Route::get('/historial/{dni}', [DiagnosticoController::class, 'historial']);
    Route::get('/detalle/{id}', [DiagnosticoController::class, 'detalle']);
});
