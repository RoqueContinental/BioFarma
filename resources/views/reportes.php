<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reportes Epidemiológicos - MariFarma</title>
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
                <li><a href="vademecum.html">Vademecum e Interacciones</a></li>
                <li class="active-link"><a href="reportes.html">Reportes Epidemiológicos</a></li>
                <li style="padding: 15px;"><select onchange="setLanguage(this.value)"><option>Español</option><option>Quechua</option></select></li>
                <li style="margin-top: 50px; opacity: 0.7;"><a href="index.html">Cerrar Sesión</a></li>
            </ul>
        </nav>
    </aside>
    <main>
        <section class="view active">
            <h2>Módulo 8: Reportes Epidemiológicos</h2>
            <div class="form-group">
                <h3>Consolidado Semanal de Diagnósticos</h3>
                <div style="display: flex; gap: 15px; align-items: flex-end; margin-bottom: 20px;">
                    <div class="field-box">
                        <label>Rango de Fecha:</label>
                        <input type="text" value="Últimos 7 días" readonly style="background: #f0f0f0;">
                    </div>
                    <button class="btn" style="width: auto;" onclick="generateReport()">Generar Reporte Estadístico</button>
                </div>

                <div id="report-content" style="display: none;">
                    <div class="grid">
                        <div class="card">
                            <h4>Enfermedades Comunes</h4>
                            <div class="chart-container">
                                <div class="bar-row"><span>Gripe</span><div class="bar" style="width: 80%; background: #2ecc71;"></div><span>24</span></div>
                                <div class="bar-row"><span>Infección</span><div class="bar" style="width: 45%; background: #3498db;"></div><span>12</span></div>
                                <div class="bar-row"><span>Gastritis</span><div class="bar" style="width: 30%; background: #f1c40f;"></div><span>8</span></div>
                            </div>
                        </div>
                        <div class="card alert">
                            <h4>Alertas de Tendencia</h4>
                            <p style="font-size: 0.9rem;">Se detecta un incremento del <strong>12%</strong> en cuadros respiratorios respecto a la semana anterior en la zona rural.</p>
                        </div>
                    </div>

                    <div class="table-container" style="margin-top: 20px;">
                        <table style="width: 100%;">
                            <thead>
                                <tr style="background: #f8f9fa;">
                                    <th>Código CIE-10</th>
                                    <th>Diagnóstico</th>
                                    <th>Casos</th>
                                    <th>Tendencia</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td>J11.1</td><td>Influenza</td><td>24</td><td style="color: var(--accent);">↑ 12%</td></tr>
                                <tr><td>K29.7</td><td>Gastritis Aguda</td><td>15</td><td style="color: var(--secondary);">↓ 5%</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div id="empty-report" style="text-align: center; padding: 40px; color: #999;">
                    <p>Haga clic en "Generar Reporte" para consolidar los diagnósticos de SQL Server.</p>
                </div>
            </div>
        </section>
    </main>
    <script src="script.js"></script>
</body>
</html>