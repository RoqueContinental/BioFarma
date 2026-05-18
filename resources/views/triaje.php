<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Triaje - MariFarma</title>
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
                <li class="active-link"><a href="triaje.html">Triaje de Signos</a></li>
                <li><a href="diagnostico.html">Diagnóstico e Historial</a></li>
                <li><a href="vademecum.html">Vademecum e Interacciones</a></li>
                <li><a href="reportes.html">Reportes Epidemiológicos</a></li>
                <li style="padding: 15px;"><select onchange="setLanguage(this.value)"><option>Español</option><option>Quechua</option></select></li>
                <li style="margin-top: 50px; opacity: 0.7;"><a href="index.html">Cerrar Sesión</a></li>
            </ul>
        </nav>
    </aside>
    <main>
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
                <button class="btn" style="width: 250px;">Finalizar Triaje y Pasar a IA</button>
            </div>
        </section>
    </main>
    <script src="script.js"></script>
</body>
</html>