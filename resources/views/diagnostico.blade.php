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
            ✨ GENERAR HIPÓTESIS MÉDICA (Deepseek AI)
        </button>
    </div>

    <div class="ia-response" id="contenedor-ia-respuesta" style="min-height: 150px; display: none;">
        <h4 style="margin-top: 0; color: var(--primary);">📋 Hipótesis Sugerida:</h4>
        <div id="ai-output" style="line-height: 1.6;">Procesando análisis...</div>
    </div>

    <div class="form-group" style="margin-top: 20px; border-top: 4px solid var(--secondary);">
        <h3>Tratamiento y Seguimiento (CU-07)</h3>
        <textarea id="diagnostico-tratamiento" rows="3" placeholder="Indicar indicaciones generales, reposo, dieta..."></textarea>
        
        <div style="margin-top: 20px; background: #fdfefe; border: 1px solid #ddd; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.02);">
            <h4 style="margin-top: 0; color: var(--primary); display: flex; align-items: center; gap: 8px;">
                <span>💊</span> Prescribir Medicamento de Inventario (Receta)
            </h4>
            <div class="grid" style="grid-template-columns: 2fr 1.5fr 1fr auto; gap: 15px; align-items: flex-end;">
                <div>
                    <label style="font-weight: 600; font-size: 0.9em;">Medicamento:</label>
                    <select id="prescribir-med-select" onchange="verificarAlergiasMedicamento()" style="width: 100%; padding: 10px; border-radius: 4px; border: 1px solid #ccc; font-size: 0.9em; height: 40px; margin-top: 5px;">
                        <option value="">-- Seleccionar Medicamento --</option>
                    </select>
                </div>
                <div>
                    <label style="font-weight: 600; font-size: 0.9em;">Dosis / Indicación:</label>
                    <input type="text" id="prescribir-med-dosis" placeholder="Ej: 1 tab cada 8h" style="height: 40px; margin-top: 5px;">
                </div>
                <div>
                    <label style="font-weight: 600; font-size: 0.9em;">Cantidad:</label>
                    <input type="number" id="prescribir-med-cantidad" min="1" placeholder="10" style="height: 40px; margin-top: 5px;">
                </div>
                <div>
                    <button type="button" class="btn" style="width: auto; background: var(--primary); height: 40px; padding: 0 20px;" onclick="agregarMedicamentoAPreceta()">Añadir</button>
                </div>
            </div>
            
            <div id="alerta-alergia-med" style="margin-top: 15px; padding: 12px; background: #fdf2e9; border-left: 5px solid #e67e22; color: #d35400; display: none; font-size: 0.9em; font-weight: bold; border-radius: 4px;">
                ⚠️ ADVERTENCIA: El paciente reporta alergias crónicas relacionadas con este componente.
            </div>
            
            <div style="margin-top: 20px; overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
                    <thead>
                        <tr style="text-align: left; border-bottom: 2px solid #eee; background: #f8f9fa;">
                            <th style="padding: 10px;">Medicamento</th>
                            <th style="padding: 10px;">Dosis / Indicación</th>
                            <th style="padding: 10px;">Cantidad</th>
                            <th style="padding: 10px; text-align: center;">Alerta Alergia</th>
                            <th style="padding: 10px; text-align: center;">Acción</th>
                        </tr>
                    </thead>
                    <tbody id="lista-preceta-cuerpo">
                        <tr>
                            <td colspan="5" style="text-align: center; color: #999; padding: 15px;">Ningún medicamento agregado a la receta aún.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
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
                    <th style="padding: 12px; text-align: center;">Acciones</th>
                </tr>
            </thead>
            <tbody id="tabla-historial-cuerpo">
                <tr>
                    <td colspan="5" style="text-align: center; color: #999; padding: 20px;">Use el buscador para cargar el historial de un paciente.</td>
                </tr>
            </tbody>
        </table>
    </section>

    <div id="detalle-historial-seleccionado" class="card" style="margin-top: 20px; display: none; border-left: 5px solid var(--accent); background: rgba(255, 255, 255, 0.98);">
        <!-- Carga de detalles AJAX -->
    </div>
</div>
@endsection