<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MedicamentoController extends Controller
{
    /**
     * Lista todos los medicamentos activos llamando al procedimiento almacenado sp_ListarMedicamentos.
     */
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
     * Guarda un nuevo medicamento o actualiza uno existente.
     */
    public function guardar(Request $request)
    {
        // El frontend envía: id, nombre, lote, stock, descripcion, vence
        $request->validate([
            'nombre' => 'required|string',
            'stock' => 'required|numeric'
        ]);

        try {
            // sp_GuardarMedicamento(p_ID, p_Nombre, p_Concentracion, p_Presentacion, p_Stock_Min)
            // Nota: Mapeamos los campos del formulario a los parámetros del SP disponible.
            DB::statement('CALL sp_GuardarMedicamento(?, ?, ?, ?, ?)', [
                ($request->id == "0" || empty($request->id)) ? null : $request->id,
                $request->nombre,
                $request->descripcion ?? 'N/A', // Usamos descripcion como concentracion
                'Genérico',                      // Valor por defecto para presentacion
                (int)$request->stock           // Usamos stock como stock_minimo
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'El inventario ha sido actualizado correctamente.'
            ]);
        } catch (\Exception $e) {
            Log::error("Error al guardar medicamento: " . $e->getMessage());
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
            DB::statement('CALL sp_EliminarMedicamento(?)', [$request->id]);
            return response()->json(['status' => 'success', 'message' => 'Medicamento eliminado del sistema.']);
        } catch (\Exception $e) {
            Log::error("Error al eliminar medicamento: " . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'No se pudo procesar la eliminación.'], 500);
        }
    }
}