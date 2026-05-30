@extends('layouts.app')

@section('content')
<div id="view-diagnostico-registro" class="view active">
    <header style="margin-bottom: 1rem;">
        <h1>Evaluación y Diagnóstico Inteligente</h1>
        <p style="color: #666;">Asistente clínico potenciado por IA para generación de hipótesis médicas.</p>
    </header>

    <div class="card" style="margin-bottom: 20px; border-left: 5px solid var(--accent);">
        <div class="form-group">
            <label>Paciente a Evaluar:</label>
            <div class="grid" style="grid-template-columns: 1fr auto; gap: 10px;">
                <input type="text" id="diagnostico-dni" placeholder="Ingrese DNI del paciente para cargar triaje reciente" maxlength="8">
                <button type="button" class="btn" onclick="validarPacienteParaDiagnostico()">Cargar Datos</button>
            </div>
            <p id="diag-paciente-nombre" style="margin-top: 10px; font-weight: bold; color: var(--primary);"></p>
        </div>
    </div>

    <div class="form-group">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <label>Descripción de Síntomas y Observaciones:</label>
            <select id="diagnostico-idioma" style="padding: 5px; border-radius: 5px; background: white; border: 1px solid #ccc;">
                <option value="es">Idioma: Español</option>
                <option value="qu">Idioma: Quechua</option>
            </select>
        </div>
        <textarea id="diagnostico-sintomas" rows="6" placeholder="Describa detalladamente los síntomas relatados por el paciente, antecedentes relevantes y hallazgos del examen físico..."></textarea>
        <button class="btn" style="margin-top: 15px; background: var(--primary);" onclick="generarDiagnosticoIA()">
            ✨ GENERAR HIPÓTESIS MÉDICA (GEMINI AI)
        </button>
    </div>

    <div class="ia-response" id="contenedor-ia-respuesta" style="min-height: 150px; display: none;">
        <h4 style="margin-top: 0; color: var(--primary);">📋 Hipótesis Sugerida:</h4>
        <div id="ai-output" style="line-height: 1.6;">Procesando análisis...</div>
    </div>

    <div class="form-group" style="margin-top: 20px; border-top: 4px solid var(--secondary);">
        <h3>Tratamiento y Seguimiento (CU-07)</h3>
        <textarea id="diagnostico-tratamiento" rows="3" placeholder="Indicar medicación, dosis y recomendaciones de seguimiento..."></textarea>
        <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
            <button class="btn" style="width: 250px;" onclick="guardarDiagnosticoFinal()">Finalizar y Guardar Historia</button>
        </div>
    </div>
</div>

<div id="view-diagnostico-gestion" class="view" style="display: none;">
    <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h1>Historial Clínico Digital</h1>
        <div style="display: flex; gap: 10px;">
            <input type="text" id="search-historial-dni" placeholder="🔍 Buscar por DNI de paciente..." 
                   style="padding: 10px; width: 250px; border-radius: 5px; border: 1px solid #ccc;">
            <button class="btn" style="width: auto;" onclick="buscarHistorialClinico()">Consultar Historial</button>
        </div>
    </header>

    <section class="card">
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="text-align: left; border-bottom: 2px solid #eee;">
                    <th style="padding: 12px;">Fecha/Hora</th>
                    <th style="padding: 12px;">Paciente</th>
                    <th style="padding: 12px;">Médico/Enfermero</th>
                    <th style="padding: 12px;">Diagnóstico (Resumen)</th>
                    <th style="padding: 12px;">Acciones</th>
                </tr>
            </thead>
            <tbody id="tabla-historial-cuerpo">
                <tr>
                    <td colspan="5" style="text-align: center; color: #999; padding: 20px;">Use el buscador para cargar el historial de un paciente.</td>
                </tr>
            </tbody>
        </table>
    </section>

    <div id="detalle-historial-seleccionado" style="margin-top: 20px;"></div>
</div>
@endsection