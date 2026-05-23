<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB; 
use Illuminate\Support\Facades\Log;

class PacienteController extends Controller
{
    public function index()
    {
        try {
            $pacientes = DB::select('CALL sp_ListarPacientes()');
            return response()->json($pacientes);
        } catch (\Exception $e) {
            Log::error("Error al listar pacientes: " . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    public function pacientesHoy()
    {
        try {
            // Intentamos llamar a un procedimiento o hacer una consulta directa por fecha
            // Asumimos que la tabla tiene un campo 'created_at' o similar para la fecha de registro
            $pacientes = DB::select("SELECT DNI_CUI, Nombres, Apellidos, DATE_FORMAT(created_at, '%H:%i') as Hora 
                                     FROM PACIENTE 
                                     WHERE DATE(created_at) = CURDATE() AND Estado = 1 
                                     ORDER BY created_at DESC");
            return response()->json($pacientes);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

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
            $resultado = DB::select('CALL sp_GuardarPaciente(?, ?, ?, ?, ?, ?, ?, ?)', [
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
                'message' => 'Operación completada en el módulo de Registro/Actualización',
                'detalle' => $resultado[0]
            ]);

        } catch (\Exception $e) {
            // Si hay error (ej: DNI duplicado o falla de conexión)
            Log::error("Error al guardar paciente: " . $e->getMessage());
            
            return response()->json([
                'status' => 'error',
                'message' => 'Error al conectar con MySQL (BioFarma)',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function buscar($dni)
    {
        try {
            $paciente = DB::select('CALL sp_BuscarPacientePorDNI(?)', [$dni]);

            if (empty($paciente)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Paciente no encontrado en la base de datos local'
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'data' => $paciente[0]
            ]);
        } catch (\Exception $e) {
            Log::error("Error al buscar paciente: " . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy(Request $request)
    {
        $request->validate(['dni' => 'required|string']);

        try {
            $resultado = DB::select('CALL sp_EliminarPaciente(?)', [$request->dni]);

            return response()->json([
                'status' => 'success',
                'message' => 'Paciente dado de baja correctamente (Inactivo)',
                'detalle' => $resultado[0]
            ]);
        } catch (\Exception $e) {
            Log::error("Error al eliminar paciente: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'No se pudo procesar la baja en BioFarma'
            ], 500);
        }
    }
}