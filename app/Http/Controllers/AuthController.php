<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        try {
            // Llama al procedimiento almacenado para obtener los detalles del usuario
            $userResult = DB::select('CALL sp_ValidarUsuario(?)', [$request->username]);

            if (empty($userResult)) {
                return response()->json(['status' => 'error', 'message' => 'Credenciales incorrectas.'], 401);
            }

            $user = (array) $userResult[0]; // Convierte el objeto stdClass a array

            // Comparación de contraseña en texto plano
            if ($request->password === $user['Password']) {
                // Si las credenciales son correctas, eliminamos la contraseña
                // y el estado antes de enviarlo al frontend por seguridad.
                unset($user['Password']);
                unset($user['Estado']); 

                return response()->json([
                    'status' => 'success',
                    'message' => 'Inicio de sesión exitoso.',
                    'user' => $user
                ]);
            } else {
                return response()->json(['status' => 'error', 'message' => 'Credenciales incorrectas.'], 401);
            }
        } catch (\Exception $e) {
            Log::error("Error en el login: " . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'Error interno del servidor.'], 500);
        }
    }

    public function logout(Request $request)
    {
        // En este enfoque, el logout es principalmente del lado del cliente (limpiar localStorage).
        // Si tuvieras un sistema de sesiones o tokens en el backend, aquí lo invalidarías.
        // Por ahora, simplemente confirmamos la acción.
        return response()->json(['status' => 'success', 'message' => 'Sesión cerrada.']);
    }
}