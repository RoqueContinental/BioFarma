<?php

use App\Http\Controllers\PacienteController;
use Illuminate\Support\Facades\Route;


Route::get('/', function () {
    return redirect('/registro-pacientes');
});

// Ambos módulos conviven en la misma vista, controlados por la lógica de navegación en JS
Route::get('/registro-pacientes', function () {
    return view('pacientes');
});

Route::get('/pacientes/listar', [PacienteController::class, 'index']);
Route::post('/pacientes/guardar', [PacienteController::class, 'store']);
Route::get('/pacientes/buscar/{dni}', [PacienteController::class, 'buscar']);
Route::post('/pacientes/eliminar', [PacienteController::class, 'destroy']);