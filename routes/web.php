<?php

use App\Http\Controllers\PacienteController;
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

Route::get('/pacientes/listar', [PacienteController::class, 'index']);
Route::post('/pacientes/guardar', [PacienteController::class, 'store']);
Route::get('/pacientes/buscar/{dni}', [PacienteController::class, 'buscar']);
Route::post('/pacientes/eliminar', [PacienteController::class, 'destroy']);

Route::get('/logout', function () {
    return redirect('/');
});