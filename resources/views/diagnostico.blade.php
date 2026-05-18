@extends('layouts.app')

@section('content')
<section class="view active">
    <h2>Módulo 2.1: Consulta IA (GPT-4 Engine)</h2>
    
    <div class="form-group">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <label>Descripción de Síntomas:</label>
            <select style="padding: 5px; border-radius: 5px;">
                <option value="Español">Idioma: Español</option>
                <option value="Quechua">Idioma: Quechua</option>
            </select>
        </div>
        <textarea rows="6" placeholder="Describa detalladamente los síntomas relatados por el paciente..."></textarea>
        <button class="btn" style="margin-top: 15px; background: var(--primary);">
            ✨ GENERAR HIPÓTESIS MÉDICA (ONLINE)
        </button>
    </div>

    <div class="ia-response" style="min-height: 150px;">
        <h4 style="margin-top: 0;">Respuesta del Bio-Asistente:</h4>
        <p id="ai-output">Esperando entrada de datos para procesar con el modelo GPT-4...</p>
    </div>

    <div class="form-group" style="margin-top: 20px; border-top: 4px solid var(--secondary);">
        <h3>CU-07: Evolución y Seguimiento</h3>
        <textarea rows="3" placeholder="Añadir notas sobre la mejora o peligros detectados en este chequeo..."></textarea>
        <button class="btn" style="margin-top: 10px; width: auto;">Guardar Evolución Cronológica</button>
    </div>
    <div style="margin-top: 30px;">
        <h3>Historial de Consultas Recientes</h3>
        <div class="table-container">
            <table style="width: 100%;">
                <thead>
                    <tr style="background: #f8f9fa;">
                        <th>Fecha/Hora</th>
                        <th>Paciente</th>
                        <th>Idioma</th>
                        <th>Hipótesis (Resumen)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="4" style="text-align: center; color: #999;">Cargando historial desde SQL Server...</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</section>
@endsection