<?php

use App\Http\Controllers\PacienteController;
use Illuminate\Support\Facades\Route;

// Ruta raíz: Redirige automáticamente a pacientes o muestra una bienvenida
Route::get('/', function () {
    return redirect('/pacientes');
});

Route::get('/pacientes', function () {
    return view('pacientes');
});

Route::post('/pacientes/guardar', [PacienteController::class, 'store']);