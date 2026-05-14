<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB; 
use Illuminate\Support\Facades\Log;

class PacienteController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'dni' => 'required|string|max:8',
            'nombres' => 'required|string',
            'apellidos' => 'required|string',
            'fechaNacimiento' => 'required|date',
            'sexo' => 'required|string|max:1',
        ]);

        try {
            $resultado = DB::select('EXEC sp_GuardarPaciente ?, ?, ?, ?, ?, ?, ?, ?', [
                $request->dni,
                $request->nombres,
                $request->apellidos,
                $request->fechaNacimiento,
                $request->sexo,
                $request->direccion ?? null,
                $request->telefono ?? null,
                $request->alergias ?? null
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Paciente procesado correctamente en BioFarma',
                'detalle' => $resultado[0]
            ]);

        } catch (\Exception $e) {
            // Si hay error (ej: DNI duplicado o falla de conexión)
            Log::error("Error al guardar paciente: " . $e->getMessage());
            
            return response()->json([
                'status' => 'error',
                'message' => 'Error al conectar con SQL Server',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}