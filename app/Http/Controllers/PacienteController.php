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
            'dni' => 'required|string|max:20',
            'nombres' => 'required|string',
            'apellidos' => 'required|string',
            'fechaNacimiento' => 'required|date',
            'sexo' => 'required|string',
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

    public function guardarTriaje(Request $request)
    {
        $request->validate([
            'dni' => 'required|string|max:20',
            'temp' => 'required|numeric', // Cambiado de temperatura a temp para coincidir con JS
            'presion' => 'required|string',
            'saturacion' => 'required|numeric',
            'fc' => 'required|integer',
            'peso' => 'required|numeric',
            'id_usuario' => 'required'
        ]);

        try {
            DB::select('CALL sp_GuardarTriaje(?, ?, ?, ?, ?, ?, ?)', [
                $request->dni, 
                $request->temp, 
                $request->presion,
                $request->saturacion, $request->fc, $request->peso, $request->id_usuario
            ]);
            return response()->json(['status' => 'success', 'message' => 'Triaje registrado correctamente.']);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => 'Error al guardar triaje: ' . $e->getMessage()], 500);
        }
    }

    public function listarTriajeFecha(Request $request)
    {
        try {
            $fecha = $request->query('fecha', date('Y-m-d'));
            $triajes = DB::select('CALL sp_ListarTriajePorFecha(?)', [$fecha]);
            return response()->json($triajes);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    public function historialTriajeDNI($dni)
    {
        try {
            $historial = DB::select('CALL sp_BuscarTriajePorDNI(?)', [$dni]);
            if (empty($historial)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No se encontró historial para este DNI'
                ], 404);
            }
            return response()->json([
                'status' => 'success',
                'data' => $historial
            ]);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}