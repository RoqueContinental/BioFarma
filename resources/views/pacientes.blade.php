@extends('layouts.app')

@section('content')
    {{-- Selector de Módulos (Simulación de navegación lateral) --}}
    <nav style="margin-bottom: 20px; display: flex; gap: 10px;">
        <button onclick="showView('view-registro')" class="btn" style="background: var(--primary);">Módulo 1: Registro de pacientes</button>
        <button onclick="showView('view-gestion')" class="btn" style="background: #34495e;">Módulo 2: Gestión de pacientes locales</button>
    </nav>

    <!-- MÓDULO 1: REGISTRO DE PACIENTES -->
    <div id="view-registro" class="view active">
        <header style="margin-bottom: 1rem;">
            <h1>Registro de Pacientes</h1>
            <p style="color: #666;">Ingrese los datos del paciente o consulte vía RENIEC.</p>
        </header>

        <form id="form-paciente" onsubmit="event.preventDefault(); registrarPaciente();">
            @csrf 
            <section class="card">
                <div class="form-group">
                <label>Consulta de Identidad (CU-01):</label>
                <div class="grid" style="grid-template-columns: 1fr auto auto; gap: 10px;">
                    <input type="text" id="dni-input" name="dni" placeholder="Ingrese DNI" maxlength="8">
                    <button type="button" class="btn" id="btn-reniec" onclick="consultarReniec()">Consultar RENIEC</button>
                    <button type="button" class="btn" style="background: #6c757d;" onclick="buscarPacienteLocal()">Buscar Local</button>
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
                    <input type="date" id="paciente-fecha-nac" name="fecha_nacimiento" required>
                </div>
                <div class="form-group">
                    <label>Sexo:</label>
                    <select id="paciente-sexo" name="sexo" style="padding:10px; border-radius:5px; border:1px solid #ccc;" required>
                        <option value="">Seleccione</option>
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                    </select>
                </div>
            </div>

            <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="form-group">
                    <label>Dirección:</label>
                    <input type="text" id="paciente-direccion" name="direccion" placeholder="Av. Siempre Viva 123">
                </div>
                <div class="form-group">
                    <label>Teléfono:</label>
                    <input type="text" id="paciente-telefono" name="telefono" placeholder="987654321">
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
    </div>

    <!-- MÓDULO 2: GESTIÓN DE PACIENTES LOCALES -->
    <div id="view-gestion" class="view" style="display: none;">
        <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h1>Gestión de Pacientes Locales</h1>
            <input type="text" id="search-paciente" onkeyup="window.filtrarPacientes()" 
                   placeholder="🔍 Buscar por nombre o DNI..." 
                   style="padding: 10px; width: 300px; border-radius: 5px; border: 1px solid #ccc;">
        </header>

        <section class="card">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="text-align: left; border-bottom: 2px solid #eee;">
                        <th style="padding: 12px;">DNI</th>
                        <th style="padding: 12px;">Nombres</th>
                        <th style="padding: 12px;">Apellidos</th>
                        <th style="padding: 12px;">Teléfono</th>
                        <th style="padding: 12px;">Estado</th>
                        <th style="padding: 12px;">Acciones</th>
                    </tr>
                </thead>
                <tbody id="tabla-pacientes-cuerpo">
                    <!-- Cargado por AJAX -->
                </tbody>
            </table>
        </section>
    </div>

    <!-- CONTENEDOR DE INFORMACIÓN DETALLADA -->
    <div id="view-detalle" class="view" style="display: none;">
        <button onclick="showView('view-gestion')" class="btn" style="margin-bottom: 15px; background: #95a5a6;">⬅️ Volver a la Lista</button>
        <section class="card" id="detalle-paciente-info">
            <!-- Aquí se inyectará la ficha completa del paciente -->
        </section>
    </div>

    <style>
        .view { animation: fadeIn 0.2s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        
        /* Aseguramos que el estilo de JS prevalezca */
        .view[style*="display: none"] { display: none !important; }
        .view:not([style*="display: none"]) { display: block !important; }

        #tabla-pacientes-cuerpo tr:hover { background: #f9f9f9; }
        #tabla-pacientes-cuerpo td { padding: 12px; border-bottom: 1px solid #eee; }
        
        .btn-small { transition: transform 0.1s; border: none; cursor: pointer; }
        .btn-small:hover { transform: scale(1.1); }
    </style>
@endsection