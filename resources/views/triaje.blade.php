@extends('layouts.app')

@section('content')
<div id="view-triaje-registro" class="view active">
    <header style="margin-bottom: 1rem;">
        <h1>Registro de Triaje</h1>
        <p style="color: #666;">Captura de signos vitales para evaluación médica.</p>
    </header>

    <form id="form-triaje" onsubmit="event.preventDefault(); guardarTriaje();">
        <div class="card" style="margin-bottom: 20px; border-left: 5px solid var(--accent);">
            <div class="form-group">
                <label>Identificar Paciente:</label>
                <div class="grid" style="grid-template-columns: 1fr auto; gap: 10px;">
                    <input type="text" id="triaje-dni" placeholder="Ingrese DNI del paciente" maxlength="8">
                    <button type="button" class="btn" onclick="validarPacienteParaTriaje()">Validar Paciente</button>
                </div>
                <p id="paciente-seleccionado-nombre" style="margin-top: 10px; font-weight: bold; color: var(--primary);"></p>
            </div>
        </div>
        
        <div class="form-group grid">
            <div class="field-box">
                <label>Temperatura (°C):</label>
                <input type="number" id="triaje-temp" step="0.1" placeholder="36.5" required>
            </div>
            <div class="field-box">
                <label>Presión Arterial:</label>
                <input type="text" id="triaje-presion" placeholder="120/80" required>
            </div>
            <div class="field-box">
                <label>Saturación O2 (%):</label>
                <input type="number" id="triaje-saturacion" placeholder="98" required>
            </div>
            <div class="field-box">
                <label>Frecuencia Cardíaca (LPM):</label>
                <input type="number" id="triaje-fc" placeholder="72" required>
            </div>
            <div class="field-box">
                <label>Peso (kg):</label>
                <input type="number" id="triaje-peso" step="0.1" placeholder="70.5" required>
            </div>
        </div>
        
        <div class="form-group">
            <label>Notas de Observación Inicial:</label>
            <textarea id="triaje-notas" rows="3" placeholder="Paciente presenta palidez, refiere mareos..."></textarea>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 15px;">
            <button type="reset" class="btn" style="background: #95a5a6; width: 150px;">Limpiar</button>
            <button type="submit" class="btn" style="width: 250px;">Guardar Triaje</button>
        </div>
    </form>
</div>

<div id="view-triaje-gestion" class="view" style="display: none;">
    <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 10px;">
        <h1>Gestión de Triajes</h1>
        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <input type="text" id="search-triaje-dni" placeholder="🔍 Buscar historial por DNI..." style="padding: 10px; width: 250px; border-radius: 5px; border: 1px solid #ccc;">
            <button class="btn" style="width: auto;" onclick="window.buscarHistorialTriaje()">Consultar</button>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
            <label for="fecha-triaje" style="font-weight: 500;">Fecha:</label>
            <input type="date" id="fecha-triaje" style="padding: 10px; border-radius: 5px; border: 1px solid #ccc; font-size: 1rem;">
            <button class="btn" style="background: var(--primary);" onclick="window.cargarTriajesPorFecha()">Aceptar</button>
            <button class="btn" style="background: #27ae60;" onclick="window.generarPDFTriajes()">📄 Generar PDF</button>
        </div>
    </header>

    <section class="card">
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="text-align: left; border-bottom: 2px solid #eee;">
                    <th style="padding: 12px;">Hora</th>
                    <th style="padding: 12px;">DNI</th>
                    <th style="padding: 12px;">Paciente</th>
                    <th style="padding: 12px;">Temp</th>
                    <th style="padding: 12px;">P.A.</th>
                    <th style="padding: 12px;">Sat. O2</th>
                    <th style="padding: 12px;">FC</th>
                    <th style="padding: 12px;">Peso</th>
                    <th style="padding: 12px;">Notas</th>
                    <th style="padding: 12px;">Atendido Por</th>
                </tr>
            </thead>
            <tbody id="tabla-triaje-cuerpo">
                <!-- Cargado por AJAX -->
            </tbody>
        </table>
    </section>

    <div id="historial-triaje-resultado" style="margin-top: 30px;"></div>
</div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
@endsection