<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IA Diagnóstico - MariFarma</title>
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
                <li class="active-link"><a href="diagnostico.html">Diagnóstico e Historial</a></li>
                <li><a href="vademecum.html">Vademecum e Interacciones</a></li>
                <li><a href="reportes.html">Reportes Epidemiológicos</a></li>
                <li style="padding: 15px;"><select onchange="setLanguage(this.value)"><option>Español</option><option>Quechua</option></select></li>
                <li style="margin-top: 50px; opacity: 0.7;"><a href="index.html">Cerrar Sesión</a></li>
            </ul>
        </nav>
    </aside>
    <main>
        <section class="view active">
            <h2>Módulo 2.1: Consulta IA (GPT-4 Engine)</h2>
            
            <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <label>Descripción de Síntomas:</label>
                    <select style="padding: 5px; border-radius: 5px;">
                        <option value="Español">Idioma: Español</option>
                        <option value="Quechua">Idioma: Quechua</option>
                    </select>
                </div>
                <textarea rows="6" placeholder="Describa detalladamente los síntomas relatados por el paciente..."></textarea>
                <button class="btn" style="margin-top: 15px; background: var(--primary);">
                    ✨ GENERAR HIPÓTESIS MÉDICA (ONLINE)
                </button>
            </div>

            <div class="ia-response" style="min-height: 150px;">
                <h4 style="margin-top: 0;">Respuesta del Bio-Asistente:</h4>
                <p id="ai-output">Esperando entrada de datos para procesar con el modelo GPT-4...</p>
            </div>

            <div class="form-group" style="margin-top: 20px; border-top: 4px solid var(--secondary);">
                <h3>CU-07: Evolución y Seguimiento</h3>
                <textarea rows="3" placeholder="Añadir notas sobre la mejora o peligros detectados en este chequeo..."></textarea>
                <button class="btn" style="margin-top: 10px; width: auto;">Guardar Evolución Cronológica</button>
            </div>
            <div style="margin-top: 30px;">
                <h3>Historial de Consultas Recientes</h3>
                <div class="table-container">
                    <table style="width: 100%;">
                        <thead>
                            <tr style="background: #f8f9fa;">
                                <th>Fecha/Hora</th>
                                <th>Paciente</th>
                                <th>Idioma</th>
                                <th>Hipótesis (Resumen)</th>
                            </tr>
                        </thead>
                        <tbody><tr><td colspan="4" style="text-align: center; color: #999;">Cargando historial desde SQL Server...</td></tr></tbody>
                    </table>
                </div>
            </div>
        </section>
    </main>
</body>
</html>