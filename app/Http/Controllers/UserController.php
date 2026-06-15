<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
    {
        if (session('user_role') !== 'admin') {
            return response()->json([
                'status' => 'error', 
                'message' => 'Acceso denegado. Se requiere privilegios de Administrador.'
            ], 403);
        }

        try {
            $usuarios = DB::select('CALL sp_ListarUsuarios()');
            return response()->json($usuarios);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        if (session('user_role') !== 'admin') {
            return response()->json([
                'status' => 'error', 
                'message' => 'No tiene autorización para crear o modificar personal.'
            ], 403);
        }

        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
            'nombre' => 'required|string',
            'rol' => 'required|in:admin,tecnico,enfermero',
        ]);

        try {
            DB::statement('CALL sp_GuardarUsuario(?, ?, ?, ?)', [
                $request->username,
                $request->password, // Encriptar antes de guardar
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
        if (session('user_role') !== 'admin') {
            return response()->json([
                'status' => 'error', 
                'message' => 'Solo el administrador puede deshabilitar cuentas de usuario.'
            ], 403);
        }

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