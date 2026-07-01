<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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

        // Validar campos obligatorios
        $request->validate([
            'id_usuario' => 'required|string',
            'username' => 'required|string',
            'nombre_completo' => 'required|string',
            'rol' => 'required|in:admin,tecnico,enfermero',
        ]);

        // Primero, obtenemos la lista de usuarios para verificar si es una actualización
        $usuariosExistentes = DB::select('CALL sp_ListarUsuarios()');
        $usuarioExistente = collect($usuariosExistentes)->firstWhere('ID_Usuario', $request->id_usuario);

        $idUsuario = $request->id_usuario;
        $username = $request->username;
        $nombreCompleto = $request->nombre_completo;
        $rol = $request->rol;
        $password = $request->password;

        if ($usuarioExistente) {
            // Es actualización
            if (!$password) {
                // Si no se proporciona, mantenemos la contraseña existente
                $password = $usuarioExistente->Password;
            }
        } else {
            // Es creación, la contraseña es obligatoria
            $request->validate([
                'password' => 'required|string',
            ]);
        }

        try {
            DB::statement('CALL sp_GuardarUsuario(?, ?, ?, ?, ?)', [
                $idUsuario,
                $username,
                $password,
                $nombreCompleto,
                $rol
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
