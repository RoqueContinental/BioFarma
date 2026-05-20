<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class UserController extends Controller
{
    public function index()
    {
        try {
            $usuarios = DB::select('CALL sp_ListarUsuarios()');
            return response()->json($usuarios);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
            'nombre' => 'required|string',
            'rol' => 'required|in:admin,encargado,enfermero',
        ]);

        try {
            DB::statement('CALL sp_GuardarUsuario(?, ?, ?, ?)', [
                $request->username,
                $request->password,
                $request->nombre,
                $request->rol
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Usuario guardado/actualizado correctamente'
            ]);
        } catch (\Exception $e) {
            Log::error("Error al guardar usuario: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al procesar el usuario'
            ], 500);
        }
    }

    public function destroy(Request $request)
    {
        $request->validate(['id' => 'required|string']);

        try {
            $resultado = DB::select('CALL sp_EliminarUsuario(?)', [$request->id]);

            return response()->json([
                'status' => 'success',
                'message' => 'Usuario deshabilitado correctamente',
                'detalle' => $resultado[0]
            ]);
        } catch (\Exception $e) {
            Log::error("Error al eliminar usuario: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'No se pudo deshabilitar el usuario'
            ], 500);
        }
    }
}