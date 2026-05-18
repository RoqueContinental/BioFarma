<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inventario y Vademécum - MariFarma</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="bg-visuals"><div class="blob"></div><div class="grid-pattern"></div></div>
    <aside>
        <div class="user-profile">
            <img src="https://i.pravatar.cc/150?u=admin" alt="Admin" class="profile-img">
            <div class="user-info">
                <span class="user-name">Dra. Alejandra Palma</span>
                <span class="user-role">Administrador</span>
                <span class="user-date" id="current-date">Cargando fecha...</span>
            </div>
        </div>
        <h2>MariFarma Pro</h2>
        <nav>
            <ul>
                <li><a href="dashboard.html">Dashboard</a></li>
                <li><a href="pacientes.html">Gestión de Pacientes</a></li>
                <li><a href="triaje.html">Triaje de Signos</a></li>
                <li><a href="diagnostico.html">Diagnóstico e Historial</a></li>
                <li class="active-link"><a href="vademecum.html">Vademecum e Interacciones</a></li>
                <li><a href="reportes.html">Reportes Epidemiológicos</a></li>
                <li style="padding: 15px;"><select onchange="setLanguage(this.value)"><option>Español</option><option>Quechua</option></select></li>
                <li style="margin-top: 50px; opacity: 0.7;"><a href="index.html">Cerrar Sesión</a></li>
            </ul>
        </nav>
    </aside>
    <main>
        <section class="view active">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h2>Módulo 3: Vademécum e Inventario</h2>
                <div style="background: var(--white); padding: 5px 15px; border-radius: 20px; border: 1px solid var(--secondary);">
                    <span style="color: var(--secondary);">●</span> SQL Server Conectado
                </div>
            </div>

            <div class="grid">
                <div class="form-group">
                    <h3>Búsqueda de Medicamento.......</h3>
                    <input type="text" placeholder="Escanear Código de Barras o buscar Nombre Genérico/Comercial">
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

            <div class="form-group">
                <h3>Detalle de Receta / Salida</h3>
                <div class="grid" style="grid-template-columns: 2fr 1fr 2fr; gap: 10px;">
                    <input type="text" placeholder="Medicamento">
                    <input type="number" placeholder="Cant.">
                    <input type="text" placeholder="Indicaciones (Dosis/Frecuencia)">
                </div>
                <button class="btn" style="margin-top: 15px; width: auto;">+ Agregar a Receta</button>
                
                <div class="table-container" style="margin-top: 20px;">
                    <table style="width: 100%;">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Cant.</th>
                                <th>Indicaciones</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody><tr><td colspan="4" style="text-align:center;">No hay productos en la receta actual</td></tr></tbody>
                    </table>
                </div>
            </div>
        </section>
    </main>
</body>
</html>