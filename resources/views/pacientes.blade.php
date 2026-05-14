@extends('layouts.app')

@section('content')
    <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <h1>Gestión de Pacientes</h1>
    </header>

    <form action="{{ url('/pacientes/guardar') }}" method="POST">
        @csrf <section class="card">
            <div class="form-group">
                <label>Consulta de Identidad (CU-01):</label>
                <div class="grid" style="grid-template-columns: 1fr auto; gap: 10px;">
                    <input type="text" id="dni-input" name="dni" placeholder="Ingrese DNI" maxlength="8">
                    <button type="button" class="btn" id="btn-reniec" onclick="consultarReniec()">Consultar RENIEC</button>
                </div>
            </div>

            <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="form-group">
                    <label>Nombres Completos:</label>
                    <input type="text" id="paciente-nombres" name="nombres" placeholder="Se llenará automáticamente" readonly required>
                </div>
                <div class="form-group">
                    <label>Apellidos Completos:</label>
                    <input type="text" id="paciente-apellidos" name="apellidos" placeholder="Se llenará automáticamente" readonly required>
                </div>
            </div>

            <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="form-group">
                    <label>Fecha de Nacimiento:</label>
                    <input type="date" name="fecha_nacimiento" required>
                </div>
                <div class="form-group">
                    <label>Sexo:</label>
                    <select name="sexo" style="padding:10px; border-radius:5px; border:1px solid #ccc;" required>
                        <option value="">Seleccione</option>
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                    </select>
                </div>
            </div>

            <div class="form-group">
                <label>Alergias Críticas y Antecedentes (CU-01):</label>
                <textarea id="paciente-alergias" name="alergias" placeholder="Ej: Alergia a la Penicilina, Hipertensión..."></textarea>
            </div>

            <div class="form-group">
                <h3>Trazabilidad Genética (Parentesco)</h3>
                <p style="font-size: 0.9rem; color: #666;">Relacionar con otros pacientes registrados en la base de datos local.</p>
                <div class="grid" style="grid-template-columns: 2fr 1fr 1fr; gap: 10px; align-items: end;">
                    <input type="text" name="familiar_dni" placeholder="DNI del Familiar">
                    <select name="parentesco_tipo" style="padding:10px; border-radius:5px; border:1px solid #ccc;">
                        <option value="">Tipo de Relación</option>
                        <option value="Madre">Madre</option>
                        <option value="Padre">Padre</option>
                        <option value="Hermano">Hermano/a</option>
                        <option value="Hijo">Hijo/a</option>
                    </select>
                    <button type="button" class="btn" style="background: var(--primary);">Vincular</button>
                </div>
            </div>
            
            <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
                <button type="submit" class="btn" style="width: 200px;">Guardar Paciente</button>
            </div>
        </section>
    </form>
@endsection