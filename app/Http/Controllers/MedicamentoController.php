<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MedicamentoController extends Controller
{
    
    public function listar()
    {
        try {
            $medicamentos = DB::select('CALL sp_ListarMedicamentos()');
            return response()->json($medicamentos);
        } catch (\Exception $e) {
            Log::error("Error al listar medicamentos: " . $e->getMessage());
            return response()->json([
                'status' => 'error', 
                'message' => 'No se pudo cargar el inventario de medicamentos.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Busca un medicamento por ID, Código de Barras o Nombre para cargar en el formulario.
     */
    public function buscar($criterio)
    {
        try {
            // Llamamos al nuevo procedimiento almacenado
            $medicamento = DB::select("CALL sp_BuscarMedicamento(?)", [$criterio]);

            if (empty($medicamento)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No se encontró un medicamento con ese código.'
                ], 404);
            }

            return response()->json(['status' => 'success', 'data' => $medicamento[0]]);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Guarda un nuevo medicamento o actualiza uno existente.
     */
    public function guardar(Request $request)
    {
        $request->validate([
            'id' => 'nullable',
            'codigo_barras' => 'nullable|string',
            'nombre_generico' => 'required|string',
            'nombre_comercial' => 'nullable|string',
            'concentracion' => 'required|string',
            'presentacion' => 'required|string',
            'stock' => 'required|numeric',
            'vence' => 'required|date'
        ]);

        try {
            // Aseguramos que el ID se pase como null si es "0" o vacío para que el SP detecte inserción
            DB::statement('CALL sp_GuardarMedicamento(?, ?, ?, ?, ?, ?, ?, ?)', [
                ($request->id == "0" || empty($request->id)) ? null : $request->id,
                $request->codigo_barras ?? '',
                $request->nombre_generico,
                $request->nombre_comercial,
                $request->concentracion . ' mg', // Se añade la unidad automáticamente
                $request->presentacion,
                (int)$request->stock,         // Stock Actual
                $request->vence ?? null       // Fecha Vencimiento
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'El inventario ha sido actualizado correctamente.'
            ]);
        } catch (\Exception $e) {
            Log::error("Error crítico al guardar medicamento: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al guardar el medicamento en la base de datos.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Deshabilita un medicamento del sistema (baja lógica).
     */
    public function eliminar(Request $request)
    {
        try {
            if (!$request->has('id')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No se proporcionó un ID válido para la baja.'
                ], 400);
            }

            DB::statement('CALL sp_EliminarMedicamento(?)', [$request->id]);
            return response()->json(['status' => 'success', 'message' => 'Medicamento eliminado del sistema.']);
        } catch (\Exception $e) {
            Log::error("Error al eliminar medicamento: " . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'No se pudo procesar la eliminación.'], 500);
        }
    }
}
