<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TriajeController extends Controller
{
    /**
     * Lista los triajes realizados en una fecha específica (por defecto hoy).
     */
    public function index(Request $request)
    {
        try {
            $fecha = $request->query('fecha', date('Y-m-d'));
            $triajes = DB::select('CALL sp_ListarTriajePorFecha(?)', [$fecha]);

            return response()->json($triajes);
        } catch (\Exception $e) {
            Log::error('Error al listar triajes: '.$e->getMessage());

            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Guarda un nuevo registro de triaje.
     */
    public function store(Request $request)
    {
        $request->validate([
            'dni' => 'required|string|max:20',
            'temp' => 'required|numeric',
            'presion' => 'required|string',
            'saturacion' => 'required|numeric',
            'fc' => 'required|integer',
            'peso' => 'required|numeric',
            'notas' => 'nullable|string',
            'id_usuario' => 'required',
        ]);

        try {
            DB::select('CALL sp_GuardarTriaje(?, ?, ?, ?, ?, ?, ?, ?)', [
                $request->dni,
                $request->temp,
                $request->presion,
                $request->saturacion,
                $request->fc,
                $request->peso,
                $request->notas,
                $request->id_usuario,
            ]);

            return response()->json(['status' => 'success', 'message' => 'Triaje registrado correctamente.']);
        } catch (\Exception $e) {
            Log::error('Error al guardar triaje: '.$e->getMessage());

            return response()->json(['status' => 'error', 'message' => 'Error al guardar triaje: '.$e->getMessage()], 500);
        }
    }

    /**
     * Obtiene el historial de triajes de un paciente por su DNI.
     */
    public function historial($dni)
    {
        try {
            $historial = DB::select('CALL sp_BuscarTriajePorDNI(?)', [$dni]);
            if (empty($historial)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No se encontró historial para este DNI',
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'data' => $historial,
            ]);
        } catch (\Exception $e) {
            Log::error('Error al buscar historial de triaje: '.$e->getMessage());

            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}
