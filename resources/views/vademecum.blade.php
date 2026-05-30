@extends('layouts.app')

@section('content')
<div id="view-vademecum-consulta" class="view active">
    <div style="display: flex; justify-content: space-between; align-items: center;">
        <h2>Módulo 3: Consulta de Vademécum</h2>
        <div style="background: var(--white); padding: 5px 15px; border-radius: 20px; border: 1px solid var(--secondary);">
            <span style="color: var(--secondary);">●</span> Base de Datos Conectada
        </div>
    </div>

    <div class="grid">
        <div class="form-group">
            <h3>Búsqueda de Medicamento</h3>
            <div style="display: flex; gap: 10px;">
                <input type="text" id="search-vademecum" placeholder="Escanear Código de Barras o buscar Nombre Genérico..." style="flex: 1;">
                <button class="btn" style="width: auto;" onclick="window.buscarMedicamento()">Buscar</button>
            </div>
            <div class="card alert" style="margin-top: 15px;">
                <strong>Validador de Interacciones:</strong>
                <p style="font-size: 0.85rem;">Seleccione un producto para cruzar con el historial del paciente.</p>
            </div>
            
            <div id="med-details" style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 10px;">
                <p><strong>Propiedades:</strong> <span style="color: #666;">Analice para ver propiedades</span></p>
                <p><strong>Dosis Sugerida:</strong> <span style="color: #666;">--</span></p>
                <p><strong>Contraindicaciones:</strong> <span style="color: #666;">--</span></p>
            </div>
        </div>
        
        <div class="form-group">
            <h3>Control de Stock (Lotes)</h3>
            <div style="font-size: 0.9rem;">
                <p><strong>Lote Seleccionado:</strong> <span id="lote-id">---</span></p>
                <p><strong>Fecha Vencimiento:</strong> <span id="lote-vence" style="color: var(--accent);">--/--/----</span></p>
                <p><strong>Stock Actual:</strong> <span id="stock-cant" style="font-size: 1.2rem; font-weight: bold;">0</span></p>
            </div>
        </div>
    </div>
</div>

<div id="view-vademecum-gestion" class="view" style="display: none;">
    <header style="margin-bottom: 1rem;">
        <h1>Gestión de Inventario Farmacéutico</h1>
        <p style="color: #666;">Administración de stock, lotes y descripciones de medicamentos.</p>
    </header>

    <form id="form-medicamento" class="card" style="margin-bottom: 25px;" onsubmit="event.preventDefault(); window.guardarMedicamento();">
        <input type="hidden" id="med-id" value="0">
        <div class="grid" style="grid-template-columns: 2fr 1fr 1fr; gap: 15px;">
            <div>
                <label>Nombre del Medicamento:</label>
                <input type="text" id="med-nombre" placeholder="Ej: Amoxicilina 500mg" required>
            </div>
            <div>
                <label>Lote:</label>
                <input type="text" id="med-lote-input" placeholder="LT-2024" required>
            </div>
            <div>
                <label>Stock Inicial/Actual:</label>
                <input type="number" id="med-stock-input" placeholder="0" required>
            </div>
        </div>
        <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px;">
            <div>
                <label>Descripción / Composición:</label>
                <textarea id="med-descripcion" rows="2" placeholder="Detalles del fármaco..."></textarea>
            </div>
            <div>
                <label>Fecha de Vencimiento:</label>
                <input type="date" id="med-vence-input" required>
            </div>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 15px;">
            <button type="reset" class="btn" style="background: #95a5a6; width: 120px;">Limpiar</button>
            <button type="submit" class="btn" style="width: 200px;">Guardar en Inventario</button>
        </div>
    </form>

    <section class="card">
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="text-align: left; border-bottom: 2px solid #eee;">
                    <th style="padding: 12px;">Medicamento</th>
                    <th style="padding: 12px;">Lote</th>
                    <th style="padding: 12px;">Stock</th>
                    <th style="padding: 12px;">Vence</th>
                    <th style="padding: 12px;">Acciones</th>
                </tr>
            </thead>
            <tbody id="tabla-medicamentos-cuerpo">
                <!-- Cargado por AJAX -->
            </tbody>
        </table>
    </section>
</div>
@endsection