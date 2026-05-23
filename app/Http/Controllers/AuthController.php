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

            if (!$userResult || count($userResult) === 0) {
                return response()->json(['status' => 'error', 'message' => 'Credenciales incorrectas.'], 401);
            }

            // DB::select devuelve una colección de objetos stdClass
            $userObj = (array) $userResult[0];
            
            // Normalizamos las llaves a minúsculas para evitar problemas de Case Sensitivity (Password vs password)
            $userArray = array_change_key_case($userObj, CASE_LOWER);
            $dbPassword = $userArray['password_hash'] ?? null;

            if ($request->password === $dbPassword) {
                // Limpiamos datos sensibles antes de enviar al frontend
                unset($userArray['password_hash'], $userArray['estado']);

                return response()->json([
                    'status' => 'success',
                    'message' => 'Inicio de sesión exitoso.',
                    'user' => $userArray
                ]);
            } else {
                return response()->json(['status' => 'error', 'message' => 'Credenciales incorrectas.'], 401);
            }
        } catch (\Exception $e) {
            Log::error("Login Error: " . $e->getMessage());
            return response()->json([
                'status' => 'error', 
                'message' => 'Error técnico: ' . $e->getMessage(),
                'hint' => 'Verifica que el procedimiento sp_ValidarUsuario exista en la BD BioFarma.'
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        
        return response()->json(['status' => 'success', 'message' => 'Sesión cerrada.']);
    }
}