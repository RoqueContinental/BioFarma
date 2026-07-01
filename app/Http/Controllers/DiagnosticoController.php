<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DiagnosticoController extends Controller
{
    /**
     * Busca al paciente y su triaje más reciente para iniciar la evaluación.
     * Si el procedimiento de historial no existe, se continúa sin él.
     */
    public function buscarPaciente($dni)
    {
        try {
            $resultado = DB::select('CALL sp_BuscarTriajeReciente(?)', [$dni]);
            $ultimos3Triajes = [];

            if (empty($resultado)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No se encontró un triaje reciente para este paciente. Por favor complete el módulo de Triaje primero.',
                ], 404);
            }

            $paciente = $resultado[0];
            $paciente->dni = $dni;
            if (! isset($paciente->DNI_CUI) || empty($paciente->DNI_CUI)) {
                $paciente->DNI_CUI = $dni;
            }
            if (! isset($paciente->DNI) || empty($paciente->DNI)) {
                $paciente->DNI = $dni;
            }
            if (! isset($paciente->dni_cui) || empty($paciente->dni_cui)) {
                $paciente->dni_cui = $dni;
            }

            return response()->json([
                'status' => 'success',
                'data' => $paciente,
                'ultimos3Triajes' => $ultimos3Triajes,
            ]);
        } catch (\Exception $e) {
            Log::error('Error al buscar paciente para diagnóstico: '.$e->getMessage());

            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Envía los síntomas y signos vitales del paciente a la API de Gemini
     * para generar una hipótesis médica sugerida en el idioma indicado.
     */
    public function generarIA(Request $request)
    {
        $request->validate([
            'dni' => 'required|string',
            'sintomas' => 'required|string',
            'idioma' => 'required|string|in:es,qu',
        ]);

        try {
            // Obtener el triaje más reciente
            $triajeResult = DB::select('CALL sp_BuscarTriajeReciente(?)', [$request->dni]);
            $ultimos3Triajes = [];

            if (empty($triajeResult)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Triaje no encontrado para el paciente.',
                ], 404);
            }

            $triaje = $triajeResult[0];
            $idiomaNombre = $request->idioma === 'qu' ? 'Quechua' : 'Español';

            // Construir sección con últimos 3 triajes
            $historialTriajes = '';
            if (!empty($ultimos3Triajes)) {
                $historialTriajes = "Historial de Últimos " . count($ultimos3Triajes) . " Triajes:\n";
                foreach ($ultimos3Triajes as $index => $t) {
                    $numTriaje = $index + 1;
                    $historialTriajes .= "\nTriaje #{$numTriaje} - {$t->FechaHoraFormateada}:\n";
                    $historialTriajes .= "- Temperatura: {$t->Temperatura} °C\n";
                    $historialTriajes .= "- Presión Arterial: {$t->Presion_Arterial}\n";
                    $historialTriajes .= "- Saturación O2: {$t->Saturacion_O2} %\n";
                    $historialTriajes .= "- Frecuencia Cardíaca: {$t->Frecuencia_Cardiaca} LPM\n";
                    $historialTriajes .= "- Peso: {$t->Peso} kg\n";
                    $historialTriajes .= "- Notas: ".(!empty($t->Notas_Observaciones) ? $t->Notas_Observaciones : 'Ninguna')."\n";
                }
                $historialTriajes .= "\n";
            }

            // Formar el prompt para Gemini
            $prompt = "Actúa como un asistente médico profesional para un centro de salud rural en Perú. Analiza los siguientes signos vitales y síntomas para generar una hipótesis diagnóstica y recomendaciones.\n\n"
                    ."Datos del Paciente (DNI: {$request->dni}):\n"
                    ."- Temperatura (actual): {$triaje->Temperatura} °C\n"
                    ."- Presión Arterial (actual): {$triaje->Presion_Arterial}\n"
                    ."- Saturación O2 (actual): {$triaje->Saturacion_O2} %\n"
                    ."- Frecuencia Cardíaca (actual): {$triaje->Frecuencia_Cardiaca} LPM\n"
                    ."- Peso (actual): {$triaje->Peso} kg\n"
                    ."- Notas de Observación de Triaje (actual): ".(isset($triaje->Notas_Observaciones) && !empty($triaje->Notas_Observaciones) ? $triaje->Notas_Observaciones : 'Ninguna')."\n"
                    .'- Alergias registradas: '.($triaje->Alergias_Cronicas ?? 'Ninguna')."\n\n"
                    .$historialTriajes
                    ."Síntomas y Observaciones Clínicas Actuales:\n"
                    ."{$request->sintomas}\n\n"
                    ."Instrucciones de Respuesta:\n"
                    ."1. Tu respuesta DEBE estar completamente en idioma {$idiomaNombre}.\n"
                    ."2. Analiza la evolución de los signos vitales en el historial de triajes para identificar tendencias.\n"
                    ."3. Proporciona una hipótesis diagnóstica clara.\n"
                    ."4. Proporciona recomendaciones de tratamiento o derivación si es grave.\n"
                    ."5. Organiza la información de forma estructurada con markdown.\n";

            $apiKey = config('services.deepseek.key');
            $model = config('services.deepseek.model', 'deepseek-1');
            $endpoint = rtrim(config('services.deepseek.endpoint', 'https://api.deepseek.ai/v1/generate'), '/');

            if (empty($apiKey)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'API Key de Deepseek no configurada en el servidor.',
                ], 500);
            }

            $url = $endpoint;

            $response = Http::withHeaders([
                'Authorization' => 'Bearer '.$apiKey,
                'Content-Type' => 'application/json',
            ])->timeout(15)->post($url, [
                'model' => $model,
                'prompt' => $prompt,
                'temperature' => 0.3,
                'max_tokens' => 300,
            ]);

            $responseBody = $response->body();
            $responseJson = null;
            try {
                $responseJson = $response->json();
            } catch (\Exception $e) {
                $responseJson = null;
            }

            if (! $response->ok()) {
                Log::error('Falla en la API de Deepseek: '.$responseBody);

                $errorType = $responseJson['error']['type'] ?? null;
                $errorMessage = $responseJson['error']['message'] ?? $responseBody;

                if ($errorType === 'insufficient_quota' || stripos($errorMessage, 'insufficient_quota') !== false || $response->status() === 402) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'No hay crédito suficiente en la cuenta de Deepseek. Revisa facturación y límite de uso.',
                        'debug' => $errorMessage,
                    ], 402);
                }

                return response()->json([
                    'status' => 'error',
                    'message' => 'No se pudo conectar con el servicio de IA de Deepseek.',
                    'debug' => $errorMessage,
                ], 502);
            }

            $hipotesis = 'No se pudo generar una respuesta clínica.';
            if (is_array($responseJson)) {
                $hipotesis = $responseJson['choices'][0]['text'] 
                    ?? $responseJson['result'] 
                    ?? $hipotesis;
            } else {
                if (!empty($responseBody) && is_string($responseBody)) {
                    $hipotesis = $responseBody;
                }
            }

            return response()->json([
                'status' => 'success',
                'hipotesis' => $hipotesis,
            ]);

        } catch (\Exception $e) {
            Log::error('Error en generación de IA: '.$e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'Ocurrió un error al procesar el análisis de IA: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Guarda el diagnóstico clínico y genera la receta (descontando stock de vademécum).
     */
    public function guardar(Request $request)
    {
        $request->validate([
            'dni' => 'required|string',
            'id_triaje' => 'required|string',
            'sintomas' => 'required|string',
            'hipotesis' => 'required|string',
            'idioma' => 'required|string|max:10',
            'receta' => 'nullable|array',
            'receta.*.id_medicamento' => 'required|string',
            'receta.*.dosis' => 'required|string',
            'receta.*.cantidad' => 'required|integer|min:1',
            'receta.*.alergia' => 'required|boolean',
        ]);

        try {
            $idConsulta = 'CON-'.date('ymdHis').'-'.rand(10, 99);
            $userId = session('user_id');

            // Si no hay sesión iniciada (ej: durante testing de API), asignamos el primer usuario administrador o 'admin'
            if (empty($userId)) {
                $userResult = DB::select('SELECT ID_Usuario FROM USUARIO LIMIT 1');
                $userId = ! empty($userResult) ? $userResult[0]->ID_Usuario : 'admin';
            }

            DB::beginTransaction();

            // 1. Guardar la consulta principal
            DB::statement('CALL sp_GuardarConsultaIA(?, ?, ?, ?, ?, ?, ?)', [
                $idConsulta,
                $request->dni,
                $userId,
                $request->id_triaje,
                $request->sintomas,
                $request->hipotesis,
                $request->idioma,
            ]);

            // 2. Guardar los medicamentos recetados (si existen)
            if ($request->has('receta') && is_array($request->receta)) {
                foreach ($request->receta as $item) {
                    DB::statement('CALL sp_GuardarDetalleReceta(?, ?, ?, ?, ?)', [
                        $idConsulta,
                        $item['id_medicamento'],
                        $item['dosis'],
                        (int) $item['cantidad'],
                        $item['alergia'] ? 1 : 0,
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Historia clínica y receta guardadas correctamente.',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al guardar diagnóstico final: '.$e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'Error al guardar en base de datos: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Lista el historial clínico de un paciente.
     */
    public function historial($dni)
    {
        try {
            $historial = DB::select('CALL sp_ListarHistorialClinico(?)', [$dni]);

            return response()->json([
                'status' => 'success',
                'data' => $historial,
            ]);
        } catch (\Exception $e) {
            Log::error('Error al cargar historial clínico: '.$e->getMessage());

            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Obtiene la receta asociada a una consulta específica.
     */
    public function detalle($id)
    {
        try {
            $detalle = DB::select('CALL sp_ObtenerDetalleHistorial(?)', [$id]);

            return response()->json([
                'status' => 'success',
                'data' => $detalle,
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener detalle de receta: '.$e->getMessage());

            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}
