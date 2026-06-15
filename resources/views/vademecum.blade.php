
@extends('layouts.app')

@section('content')
<div id="view-vademecum-consulta" class="view active">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
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
            <h3>Control de Stock</h3>
            <div style="font-size: 0.9rem;">
                <p><strong>Fecha Vencimiento:</strong> <span id="lote-vence" style="color: var(--accent);">--/--/----</span></p>
                <p><strong>Stock Actual:</strong> <span id="stock-cant" style="font-size: 1.2rem; font-weight: bold;">0</span></p>
            </div>
        </div>
    </div>
</div>

<hr style="margin: 40px 0; border: 0; border-top: 1px solid #eee;">

<div id="view-vademecum-gestion" class="view">
    <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <div>
            <h1 style="margin: 0;">Gestión de Inventario Farmacéutico</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Administración de stock, lotes y descripciones de medicamentos.</p>
        </div>
        <button onclick="listarMedicamentos()" class="btn" style="background: var(--secondary);">
            Mostrar Listado
        </button>
    </header>

    <form id="form-medicamento" class="card" style="margin-bottom: 25px;" onsubmit="event.preventDefault(); window.guardarMedicamento();">
        <input type="hidden" id="med-id" value="0">
        
        <div class="grid" style="grid-template-columns: 1fr 2fr 2fr; gap: 15px;">
            <div>
                <label>Cód. Barras:</label>
                <input type="text" id="med-barras" placeholder="789...">
            </div>
            <div>
                <label>Nombre Genérico:</label>
                <input type="text" id="med-nombre-generico" placeholder="Ej: Paracetamol" required>
            </div>
            <div>
                <label>Nombre Comercial:</label>
                <input type="text" id="med-nombre-comercial" placeholder="Ej: Dolex">
            </div>
        </div>

        <div class="grid" style="grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-top: 10px;">
            <div>
                <label>Concentración (mg/ml):</label>
                <input type="number" id="med-concentracion" placeholder="500" required>
            </div>
            <div>
                <label>Presentación:</label>
                <select id="med-presentacion" required style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ccc;">
                    <option value="Tableta">Tableta</option>
                    <option value="Jarabe">Jarabe</option>
                    <option value="Inyectable">Inyectable</option>
                    <option value="Crema">Crema</option>
                    <option value="Oftálmico">Oftálmico</option>
                </select>
            </div>
            <div>
                <label>Stock Actual:</label>
                <input type="number" id="med-stock-input" placeholder="0" required>
            </div>
        </div>

        <div class="grid" style="grid-template-columns: 1fr; gap: 15px; margin-top: 10px;">
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
                    <th style="padding: 12px;">Medicamento (Genérico / Comercial)</th>
                    <th style="padding: 12px;">Presentación</th>
                    <th style="padding: 12px;">Stock</th>
                    <th style="padding: 12px;">Vence</th>
                    <th style="padding: 12px;">Acciones</th>
                </tr>
            </thead>
            <tbody id="tabla-medicamentos-cuerpo">
                </tbody>
        </table>
    </section>
</div>
@endsection
