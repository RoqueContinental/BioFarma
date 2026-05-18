@extends('layouts.app')

@section('content')
<section class="view active">
    <h2>Módulo 2: Captura de Signos Vitales</h2>
    <div class="card" style="margin-bottom: 20px; border-left: 5px solid var(--accent);">
        <p><strong>Paciente Seleccionado:</strong> Juan Pérez García | <strong>DNI:</strong> 45678912</p>
    </div>
    
    <div class="form-group grid">
        <div class="field-box">
            <label>Temperatura (°C):</label>
            <input type="number" id="triaje-temp" step="0.1" placeholder="36.5">
        </div>
        <div class="field-box">
            <label>Presión Arterial:</label>
            <input type="text" placeholder="120/80">
        </div>
        <div class="field-box">
            <label>Saturación O2 (%):</label>
            <input type="number" placeholder="98">
        </div>
        <div class="field-box">
            <label>Frecuencia Cardíaca (LPM):</label>
            <input type="number" placeholder="72">
        </div>
    </div>
    
    <div class="form-group">
        <label>Notas de Observación Inicial:</label>
        <textarea rows="3" placeholder="Paciente presenta palidez, refiere mareos..."></textarea>
    </div>

    <div style="display: flex; justify-content: flex-end; gap: 15px;">
        <button class="btn" style="background: #95a5a6; width: 150px;">Limpiar</button>
        <button class="btn" style="width: 250px;" onclick="validateTriaje()">Finalizar Triaje y Pasar a IA</button>
    </div>
</section>
@endsection