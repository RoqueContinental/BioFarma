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

            if (! $userResult || count($userResult) === 0) {
                Log::warning('Intento de login fallido: Usuario no encontrado -> '.$request->username);

                return response()->json(['status' => 'error', 'message' => 'Credenciales incorrectas.'], 401);
            }

            if (! isset($userResult[0])) {
                return response()->json(['status' => 'error', 'message' => 'Usuario no válido.'], 401);
            }

            // DB::select devuelve una colección de objetos stdClass
            $userObj = (array) $userResult[0];

            // Normalizamos las llaves a minúsculas
            $userArray = array_change_key_case($userObj, CASE_LOWER);
            $dbPassword = $userArray['password'] ?? null;

            if ($request->password === $dbPassword) {
                // Limpiamos datos sensibles antes de enviar al frontend
                unset($userArray['password'], $userArray['estado']);

                // Persistimos todos los datos del usuario en la sesión
                session([
                    'user_role' => $userArray['rol'],
                    'user_id' => $userArray['id_usuario'],
                    'user_username' => $userArray['username'],
                    'user_nombre_completo' => $userArray['nombre_completo'],
                ]);

                return response()->json([
                    'status' => 'success',
                    'message' => 'Inicio de sesión exitoso.',
                    'user' => $userArray,
                ]);
            } else {
                Log::warning('Intento de login fallido: Contraseña incorrecta para el usuario -> '.$request->username);

                return response()->json(['status' => 'error', 'message' => 'Credenciales incorrectas.'], 401);
            }
        } catch (\Exception $e) {
            Log::error('Login Error: '.$e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'Error técnico: '.$e->getMessage(),
                'hint' => 'Verifica que el procedimiento sp_ValidarUsuario exista en la BD BioFarma.',
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        $request->session()->flush();

        if ($request->expectsJson()) {
            return response()->json(['status' => 'success', 'message' => 'Sesión cerrada.']);
        }

        return redirect()->route('login');
    }
}
