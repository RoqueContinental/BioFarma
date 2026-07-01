import './bootstrap';
import '../css/app.css';


function updateUserProfileDisplay() {
    const userProfileContainer = document.getElementById('user-profile-info'); 
    const usernameDisplay = document.getElementById('logged-in-username');
    const fullnameDisplay = document.getElementById('logged-in-fullname');
    const roleDisplay = document.getElementById('logged-in-role');
    const loginFormContainer = document.getElementById('login-form-container'); 

    const rawData = localStorage.getItem('loggedInUser');
    const userData = rawData ? JSON.parse(rawData) : null;

    if (userData) {
        // Usamos los nombres de las columnas en minúsculas (debido a array_change_key_case en PHP)
        if (usernameDisplay) usernameDisplay.textContent = userData.username || 'Usuario';
        if (fullnameDisplay) fullnameDisplay.textContent = userData.nombre_completo || 'Nombre no disponible';
        if (roleDisplay) roleDisplay.textContent = (userData.rol || "enfermero").toUpperCase();

        if (userProfileContainer) {
            userProfileContainer.style.display = 'block'; 
        }
        if (loginFormContainer) {
            loginFormContainer.style.display = 'none'; 
        }
    } else {
        if (userProfileContainer) userProfileContainer.style.display = 'none';
        if (loginFormContainer) loginFormContainer.style.display = 'block';
    }
}
window.updateUserProfileDisplay = updateUserProfileDisplay;

function login(event) {
    if (event) event.preventDefault();
    const user = document.getElementById('username')?.value;
    const pass = document.getElementById('password')?.value;

    if (!user || !pass) {
        alert("⚠️ Por favor, ingrese usuario y contraseña.");
        return;
    }

    try {
        axios.post('/api/login', { username: user, password: pass })
            .then(response => {
                localStorage.setItem('loggedInUser', JSON.stringify(response.data.user));
                updateUserProfileDisplay(); 
                window.location.href = '/dashboard'; 
            })
            .catch(error => {
                console.error("Error en login:", error);
                let msg = "Error de servidor o red.";
                if (error.response) {
                    if (error.response.status === 419) msg = "La sesión ha expirado (CSRF). Recargue la página.";
                    else msg = error.response.data.message || msg;
                }
                const hint = error.response?.data?.hint ? `\n\nAyuda: ${error.response.data.hint}` : "";
                alert(`❌ Error: ${msg}${hint}`);
            });
    } catch (error) {
        console.error("Error crítico en la petición:", error);
    } 
}
window.login = login;


async function consultarReniec() {
    const dni = document.getElementById('dni-input').value.trim();
    const btn = document.getElementById('btn-reniec');
    
    if (!/^\d{8}$/.test(dni)) {
        alert("Por favor, ingrese un DNI válido de exactamente 8 dígitos numéricos.");
        return;
    }

    btn.disabled = true;
    const originalText = btn.innerText;
    btn.innerText = "Consultando...";

    try {
        // Nuevo endpoint de GraphPeru
        const url = `https://graphperu.daustinn.com/api/query/${dni}`;
        
        const response = await fetch(url).catch(err => {
            throw new Error("ERROR_RED_O_CORS");
        });
        
        if (response.status === 404) throw new Error("DNI no encontrado.");
        if (!response.ok) throw new Error(`Error del servidor: ${response.status}`);

        const data = await response.json();

        if (data && data.names) {
            // Mapeo directo: 'names' a nombres y 'surnames' a apellidos
            document.getElementById('paciente-nombres').value = data.names;
            document.getElementById('paciente-apellidos').value = data.surnames;
        } else {
            alert("No se encontraron datos para el DNI ingresado.");
        }
    } catch (error) {
        if (error.message === "ERROR_RED_O_CORS") {
            console.error("Error de CORS detectado. La API no permite peticiones directas desde el navegador.");
            alert("Error de conexión: La API bloqueó la petición (CORS). Intente usar un proxy o n8n.");
        } else {
            console.error("Detalle del error:", error.message);
            alert(error.message);
        }
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}
window.consultarReniec = consultarReniec;

async function registrarPaciente() {
    const datos = {
        dni: document.getElementById('dni-input').value,
        nombres: document.getElementById('paciente-nombres').value,
        apellidos: document.getElementById('paciente-apellidos').value,
        fechaNacimiento: document.getElementById('paciente-fecha-nac').value,
        sexo: document.getElementById('paciente-sexo').value,
        direccion: document.getElementById('paciente-direccion').value,
        telefono: document.getElementById('paciente-telefono').value,
        alergias: document.getElementById('paciente-alergias').value
    };

    try {
        const response = await axios.post('/pacientes/guardar', datos);

        if (response.status === 200) {
            alert("✅ " + response.data.message);
            document.getElementById('form-paciente')?.reset();
            ultimoPacienteEncontrado = null;
            // Si veníamos de Gestión, refrescamos la tabla automáticamente
            if (document.getElementById('view-gestion')) listarPacientes();
        } else {
            throw new Error("Error al guardar");
        }
    } catch (error) {
        if (error.response && error.response.status === 422) {
            const errores = Object.values(error.response.data.errors).flat().join('\n');
            alert("⚠️ Faltan datos obligatorios:\n" + errores);
        } else {
            console.error("Error en registro:", error);
            alert("❌ Error de servidor: " + (error.response?.data?.message || "No se pudo conectar con MySQL"));
        }
    }
}
window.registrarPaciente = registrarPaciente;

let chartPacientesInstance = null; // Para almacenar la instancia del gráfico de Chart.js

let ultimoPacienteEncontrado = null;

/**
 * MÓDULO 2: GESTIÓN DE PACIENTES LOCALES
 * Maneja la tabla de datos, la edición y la baja lógica.
 */
async function listarPacientes() {
    const tablaCuerpo = document.getElementById('tabla-pacientes-cuerpo');
    if (!tablaCuerpo) return;

    tablaCuerpo.innerHTML = '<tr><td colspan="6" style="text-align:center;">Cargando pacientes...</td></tr>';

    try {
        const response = await axios.get('/pacientes/listar');
        const pacientes = response.data;

        tablaCuerpo.innerHTML = '';

        pacientes.forEach(p => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${p.DNI_CUI}</td>
                <td>${p.Nombres}</td>
                <td>${p.Apellidos}</td>
                <td>${p.Telefono || '-'}</td>
                <td><span style="color:${p.Estado ? 'green' : 'red'}">${p.Estado ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                    <button onclick="window.verDetalles('${p.DNI_CUI}')" title="Ver Detalles" class="btn-small" style="background:#3498db; padding:5px 10px; color:white; border-radius:4px; border:none; cursor:pointer;">👁️</button>
                    <button onclick="window.prepararEdicion('${p.DNI_CUI}')" class="btn-small" style="background:var(--primary); padding:5px 10px; color:white; border-radius:4px; border:none; cursor:pointer;">✏️</button>
                    <button onclick="window.eliminarPacienteLocal('${p.DNI_CUI}')" class="btn-small" style="background:#e74c3c; padding:5px 10px; color:white; border-radius:4px; border:none; cursor:pointer;">🗑️</button>
                </td>
            `;
            tablaCuerpo.appendChild(row);
        });
    } catch (error) {
        console.error("Error al listar pacientes:", error);
        tablaCuerpo.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Error al cargar datos.</td></tr>';
    }
}
window.listarPacientes = listarPacientes;

/**
 * MÓDULO DASHBOARD: Listado de pacientes del día
 */
async function listarPacientesHoy() {
    const tablaCuerpo = document.getElementById('tabla-pacientes-hoy-cuerpo');
    if (!tablaCuerpo) return;

    try {
        const response = await axios.get('/pacientes/hoy');
        const pacientes = response.data;

        if (pacientes.length === 0) {
            tablaCuerpo.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px;">No hay pacientes registrados hoy.</td></tr>';
            return;
        }

        tablaCuerpo.innerHTML = '';
        pacientes.forEach(p => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="font-weight:bold;">${p.Hora}</td>
                <td>${p.DNI_CUI}</td>
                <td>${p.Nombres} ${p.Apellidos}</td>
            `;
            tablaCuerpo.appendChild(row);
        });
    } catch (error) {
        console.error("Error al cargar pacientes del día:", error);
        tablaCuerpo.innerHTML = '<tr><td colspan="3" style="color:red;">Error al cargar datos.</td></tr>';
    }
}
window.listarPacientesHoy = listarPacientesHoy;

/**
 * MÓDULO 2: VISUALIZACIÓN DETALLADA
 * Carga toda la información del paciente en un contenedor específico.
 */
async function verDetalles(dni) {
    try {
        const response = await axios.get(`/pacientes/buscar/${dni}`);
        if (response.data.status === 'success') {
            const p = response.data.data;
            const container = document.getElementById('detalle-paciente-info');
            if (container) {
                container.innerHTML = `
                    <div style="padding: 10px;">
                        <h2 style="color: var(--primary); border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 20px;">
                            Ficha Informativa: ${p.Nombres} ${p.Apellidos}
                        </h2>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                            <div>
                                <p><strong>DNI/CUI:</strong> ${p.DNI_CUI}</p>
                                <p><strong>Fecha de Nacimiento:</strong> ${p.Fecha_Nacimiento}</p>
                                <p><strong>Sexo:</strong> ${p.Sexo === 'M' ? 'Masculino' : 'Femenino'}</p>
                                <p><strong>Teléfono:</strong> ${p.Telefono || 'No registrado'}</p>
                            </div>
                            <div>
                                <p><strong>Dirección:</strong> ${p.Direccion || 'No registrada'}</p>
                                <p><strong>Estado:</strong> <span style="font-weight:bold; color:${p.Estado ? '#27ae60' : '#c0392b'}">${p.Estado ? 'ACTIVO' : 'INACTIVO'}</span></p>
                                <p><strong>Alergias Crónicas:</strong> ${p.Alergias_Cronicas || 'Ninguna reportada'}</p>
                            </div>
                        </div>
                        <div style="margin-top: 30px; border-top: 1px solid #eee; pt-15; text-align: right;">
                             <button onclick="window.prepararEdicion('${p.DNI_CUI}')" class="btn" style="background:var(--primary);">Actualizar Datos</button>
                        </div>
                    </div>
                `;
                window.showView('view-detalle');
            }
        }
    } catch (error) {
        console.error("Error al visualizar detalles:", error);
        alert("No se pudo cargar la información completa del paciente.");
    }
}
window.verDetalles = verDetalles;

async function prepararEdicion(dni) {
    try {
        const response = await axios.get(`/pacientes/buscar/${dni}`);
        if (response.data.status === 'success') {
            ultimoPacienteEncontrado = response.data.data;
            window.showView('view-registro'); // Saltamos al módulo de Registro
            window.cargarDatosEnFormulario();
        }
    } catch (error) {
        alert("Error al obtener datos del paciente.");
    }
}
window.prepararEdicion = prepararEdicion;

async function eliminarPacienteLocal(dni) {
    if (!confirm(`¿Está seguro de dar de baja al paciente con DNI ${dni}? No se borrará, pero quedará inactivo.`)) return;

    try {
        const response = await axios.post('/pacientes/eliminar', { dni });
        if (response.data.status === 'success') {
            alert("✅ " + response.data.message);
            listarPacientes(); // Refrescar la tabla
        }
    } catch (error) {
        alert("❌ Error al procesar la baja.");
    }
}
window.eliminarPacienteLocal = eliminarPacienteLocal;

/**
 * Filtro de búsqueda rápida en la tabla de gestión
 */
function filtrarPacientes() {
    const query = document.getElementById('search-paciente').value.toLowerCase();
    const rows = document.querySelectorAll('#tabla-pacientes-cuerpo tr');
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
    });
}
window.filtrarPacientes = filtrarPacientes;

function cargarDatosEnFormulario() {
    if (ultimoPacienteEncontrado) {
        const p = ultimoPacienteEncontrado;
        document.getElementById('paciente-nombres').value = p.Nombres;
        document.getElementById('paciente-apellidos').value = p.Apellidos;
        document.getElementById('paciente-fecha-nac').value = p.Fecha_Nacimiento;
        document.getElementById('paciente-sexo').value = p.Sexo;
        document.getElementById('paciente-direccion').value = p.Direccion || '';
        document.getElementById('paciente-telefono').value = p.Telefono || '';
        document.getElementById('paciente-alergias').value = p.Alergias_Cronicas || '';
        alert(`✏️ Editando a: ${p.Nombres} ${p.Apellidos}`);
    }
}
window.cargarDatosEnFormulario = cargarDatosEnFormulario;

/**
 * SISTEMA DE NAVEGACIÓN MODULAR
 */
function showView(viewId) {
    const currentPath = window.location.pathname;
    
    // Mapa de vistas por página para evitar redirecciones incorrectas
    const pageMap = {
        'view-registro': 'pacientes',
        'view-gestion': 'pacientes',
        'view-triaje-registro': 'triaje',
        'view-triaje-gestion': 'triaje',
        'view-diagnostico-registro': 'diagnostico',
        'view-diagnostico-gestion': 'diagnostico',
        'view-vademecum-consulta': 'vademecum',
        'view-vademecum-gestion': 'vademecum',
        'view-reporte': 'reportes'
    };

    if (pageMap[viewId] && currentPath !== pageMap[viewId]) {
        sessionStorage.setItem('pendingView', viewId);
        window.location.href = pageMap[viewId]; 
        return;
    }

    // 1. Ocultar todas las vistas
    document.querySelectorAll('.view').forEach(v => {
        v.style.display = 'none';
        v.classList.remove('active');
    });

    // 2. Mostrar la vista seleccionada
    const target = document.getElementById(viewId);
    if (target) {
        target.style.display = 'block';
        target.classList.add('active');
    }

    // 3. Actualizar resaltado en el menú lateral
    document.querySelectorAll('aside nav ul li').forEach(li => li.classList.remove('active-link'));
    if (viewId === 'view-registro') {
        document.getElementById('menu-registro')?.classList.add('active-link');
    } else if (viewId === 'view-gestion' || viewId === 'view-detalle') {
        document.getElementById('menu-gestion')?.classList.add('active-link');
    }

    if (viewId === 'view-triaje-registro') {
        document.getElementById('menu-triaje-registro')?.classList.add('active-link');
    } else if (viewId === 'view-triaje-gestion') {
        document.getElementById('menu-triaje-gestion')?.classList.add('active-link');
        listarTriajesHoy(); // Carga inicial por defecto
    }

    if (viewId === 'view-diagnostico-registro') {
        document.getElementById('menu-diagnostico-registro')?.classList.add('active-link');
    } else if (viewId === 'view-diagnostico-gestion') {
        document.getElementById('menu-diagnostico-gestion')?.classList.add('active-link');
    }

    if (viewId === 'view-vademecum-gestion') {
        listarMedicamentos();
    }

    if (viewId === 'view-reporte') {
        listarMedicamentos();
    }

    // Mantener submenús de Triaje abiertos si estamos en una de sus subvistas
    const submenus = {
        'view-triaje': { id: 'submenu-triaje', arrow: 'arrow-triaje' },
        'view-diagnostico': { id: 'submenu-diagnostico', arrow: 'arrow-diagnostico' },
        'view-vademecum': { id: 'submenu-vademecum', arrow: 'arrow-vademecum' }
    };

    const activeSub = Object.keys(submenus).find(key => viewId.startsWith(key));
    if (activeSub) {
        const sm = document.getElementById(submenus[activeSub].id);
        const ar = document.getElementById(submenus[activeSub].arrow);
        if (sm) sm.style.display = 'flex';
        if (ar) ar.textContent = '▲';
    }
    
    if (viewId === 'view-usuarios') {
        listarUsuarios();
    }

    // Cargar datos del día si entramos al dashboard
    if (viewId === 'view-dashboard' || document.getElementById('view-dashboard')?.classList.contains('active')) {
        listarPacientesHoy();
    }

    // 4. Cargar datos si es el módulo de gestión
    if (viewId === 'view-gestion') listarPacientes();
}
window.showView = showView;

/**
 * SISTEMA DE MENÚ DESPLEGABLE
 */
function toggleSubmenu() {
    const submenu = document.getElementById('submenu-pacientes');
    const arrow = document.getElementById('arrow-pacientes');
    if (!submenu) return;
    
    const isHidden = window.getComputedStyle(submenu).display === 'none';
    if (isHidden) {
        submenu.style.display = 'flex';
        arrow.textContent = '▲';
    } else {
        submenu.style.display = 'none';
        arrow.textContent = '▼';
    }
}
window.toggleSubmenu = toggleSubmenu;

/**
 * SISTEMA DE MENÚ DESPLEGABLE TRIAJE
 */
function toggleSubmenuTriaje() {
    const submenu = document.getElementById('submenu-triaje');
    const arrow = document.getElementById('arrow-triaje');
    if (!submenu) return;
    
    const isHidden = window.getComputedStyle(submenu).display === 'none';
    if (isHidden) {
        submenu.style.display = 'flex';
        if (arrow) arrow.textContent = '▲';
    } else {
        submenu.style.display = 'none';
        if (arrow) arrow.textContent = '▼';
    }
}
window.toggleSubmenuTriaje = toggleSubmenuTriaje;

/**
 * SISTEMA DE MENÚ DESPLEGABLE DIAGNÓSTICO
 */
function toggleSubmenuDiagnostico() {
    const submenu = document.getElementById('submenu-diagnostico');
    const arrow = document.getElementById('arrow-diagnostico');
    if (!submenu) return;
    
    const isHidden = window.getComputedStyle(submenu).display === 'none';
    if (isHidden) {
        submenu.style.display = 'flex';
        if (arrow) arrow.textContent = '▲';
    } else {
        submenu.style.display = 'none';
        if (arrow) arrow.textContent = '▼';
    }
}
window.toggleSubmenuDiagnostico = toggleSubmenuDiagnostico;

function toggleSubmenuVademecum() {
    const submenu = document.getElementById('submenu-vademecum');
    const arrow = document.getElementById('arrow-vademecum');
    if (!submenu) return;
    
    const isHidden = window.getComputedStyle(submenu).display === 'none';
    if (isHidden) {
        submenu.style.display = 'flex';
        if (arrow) arrow.textContent = '▲';
    } else {
        submenu.style.display = 'none';
        if (arrow) arrow.textContent = '▼';
    }
}
window.toggleSubmenuVademecum = toggleSubmenuVademecum;


async function validarPacienteParaTriaje() {
    const dniInput = document.getElementById('triaje-dni');
    const dni = dniInput?.value.trim();
    const display = document.getElementById('paciente-seleccionado-nombre');

    if (!dni || dni.length < 8) {
        alert("Por favor, ingrese un DNI válido.");
        return;
    }

    try {
        const response = await axios.get(`/pacientes/buscar/${dni}`);
        if (response.data.status === 'success') {
            const p = response.data.data;
            // Normalizamos nombres/apellidos sin importar la capitalización de la BD
            const nombres = p.Nombres || p.NOMBRES || p.nombres || '';
            const apellidos = p.Apellidos || p.APELLIDOS || p.apellidos || '';
            
            const mensaje = `✅ Paciente identificado: ${nombres} ${apellidos}`;
            alert(mensaje);
            
            if (display) {
                display.textContent = `${nombres} ${apellidos}`;
                display.style.color = "var(--primary)";
            }
        }
    } catch (error) {
        if (display) display.textContent = "";
        if (confirm("❌ Paciente no encontrado en el sistema. ¿Desea ir al módulo de Registro de Pacientes ahora?")) {
            showView('view-registro');
        }
    }
}
window.validarPacienteParaTriaje = validarPacienteParaTriaje;

async function registrarTriaje() {
    const rawUser = localStorage.getItem('loggedInUser');
    const userData = rawUser ? JSON.parse(rawUser) : null;
    if (!userData || !userData.id_usuario) return alert("❌ Error: No se detectó sesión de usuario.");

    const datos = {
        dni: document.getElementById('triaje-dni')?.value,
        temp: document.getElementById('triaje-temp')?.value,
        presion: document.getElementById('triaje-presion')?.value,
        saturacion: document.getElementById('triaje-saturacion')?.value || document.getElementById('triaje-sat')?.value,
        fc: document.getElementById('triaje-fc')?.value || document.getElementById('triaje-frecuencia')?.value,
        peso: document.getElementById('triaje-peso')?.value || document.getElementById('triaje-weight')?.value,
        id_usuario: userData.id_usuario
    };

    try {
        const response = await axios.post('/triaje/guardar', datos);
        alert("✅ " + response.data.message);
        document.getElementById('form-triaje')?.reset();
        // Flujo de trabajo adecuado: Ir a la lista (lectura) tras el registro
        showView('view-triaje-gestion');
    } catch (error) {
        alert("❌ Error: " + (error.response?.data?.message || "No se pudo registrar el triaje"));
    }
}
window.registrarTriaje = registrarTriaje;

async function listarTriajesHoy() {
    const fecha = new Date().toISOString().split('T')[0];
    const tabla = document.getElementById('tabla-triaje-cuerpo');
    if (!tabla) return;

    try {
        const response = await axios.get(`/triaje/listar?fecha=${fecha}`);
        const triajes = Array.isArray(response.data) ? response.data : [];
        tabla.innerHTML = '';

        triajes.forEach(t => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${t.Hora || t.HORA || t.hora || '-'}</td>
                <td>${t.DNI_CUI || t.dni_cui || t.DNI || ''}</td>
                <td>${t.Paciente || t.PACIENTE || ''}</td>
                <td>${t.Temperatura || t.TEMPERATURA || t.temp || '-'}°C</td>
                <td>${t.Presion_Arterial || t.PRESION_ARTERIAL || t.presion || '-'}</td>
                <td>${t.Saturacion || t.SATURACION || t.saturacion || '-'}%</td>
                <td>
                    <button onclick="window.buscarHistorialTriaje('${t.DNI_CUI}')" class="btn-small">Ver Historial</button>
                </td>
            `;
            tabla.appendChild(row);
        });
    } catch (error) {
        console.error("Error listando triajes:", error);
    }
}
window.listarTriajesHoy = listarTriajesHoy;

async function buscarHistorialTriaje(dniInput = null) {
    const dni = dniInput || document.getElementById('search-triaje-dni')?.value;
    const contenedor = document.getElementById('historial-triaje-resultado');
    
    if (!dni) return alert("Ingrese un DNI");

    try {
        const response = await axios.get(`/triaje/historial/${dni}`);
        const datos = response.data.data;
        
        let html = `<h3>Historial de ${dni}</h3><table class="table"><thead><tr><th>Fecha</th><th>Temp</th><th>Presión</th><th>Peso</th></tr></thead><tbody>`;
        datos.forEach(h => {
            html += `<tr><td>${h.Fecha_Formateada}</td><td>${h.Temperatura}</td><td>${h.Presion_Arterial}</td><td>${h.Peso}kg</td></tr>`;
        });
        html += '</tbody></table>';
        if (contenedor) contenedor.innerHTML = html;
    } catch (error) {
        alert("❌ No se encontró historial para este paciente.");
    }
}
window.buscarHistorialTriaje = buscarHistorialTriaje;

/**
 * CU-04: Seleccionar Interfaz de Idioma
 */
function setLanguage(lang) {
    console.log(`Cambiando interfaz a: ${lang}`);
    // En Laravel, esto dispararía una petición al middleware de localización
    alert(`Idioma cambiado a ${lang}. El sistema está traduciendo etiquetas...`);
}
window.setLanguage = setLanguage;

/**
 * CU-02/05: Validar Triaje de Signos Vitales
 */
function validateTriaje() {
    const temp = document.getElementById('triaje-temp');
    if (temp && parseFloat(temp.value) > 38) {
        temp.classList.add('error-alert');
        alert("Alerta: Valores de temperatura atípicos detectados (Fiebre alta).");
    } else {
        alert("Datos de triaje validados y guardados exitosamente.");
    }
}
window.validateTriaje = validateTriaje;

/**
 * CU-08: Generar Reporte Epidemiológico (Carga y renderiza el gráfico y la tabla)
 * @param {string} period - El período de tiempo para el reporte ('dia', 'semana', 'mes', 'año').
 */
async function loadReportChart(period = 'semana') {
    const content = document.getElementById('report-content');
    const empty = document.getElementById('empty-report');
    const chartCanvas = document.getElementById('chart-pacientes');
    const tablaCuerpo = document.getElementById('tabla-reporte-consultas-cuerpo');

    if (!content || !empty || !chartCanvas || !tablaCuerpo) {
        console.warn("Elementos del reporte no encontrados. No se puede cargar el gráfico.");
        return;
    }

    // Mostrar el contenido del reporte y ocultar el mensaje vacío
    empty.style.display = 'none';
    content.style.display = 'block';

    // Destruir la instancia anterior del gráfico si existe para evitar duplicados
    if (chartPacientesInstance) {
        chartPacientesInstance.destroy();
    }

    // --- Simulación de datos (aquí iría tu llamada a la API para obtener datos reales) ---
    let labels = [];
    let data = [];
    let tableData = [];

    // En un escenario real, harías una llamada a la API aquí, por ejemplo:
    // try {
    //     const response = await axios.get(`/api/reportes/pacientes?period=${period}`);
    //     labels = response.data.labels;
    //     data = response.data.data;
    //     tableData = response.data.tableData;
    // } catch (error) {
    //     console.error("Error al obtener datos del reporte:", error);
    //     alert("No se pudieron cargar los datos del reporte.");
    //     return;
    // }

    // Datos de ejemplo para demostración
    switch (period) {
        case 'dia':
            labels = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];
            data = [5, 12, 8, 15, 10, 7];
            tableData = [
                { period: 'Hoy', total: 57 },
                { period: 'Ayer', total: 45 }
            ];
            break;
        case 'semana':
            labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
            data = [20, 35, 28, 45, 30, 15, 10];
            tableData = [
                { period: 'Esta Semana', total: 183 },
                { period: 'Semana Anterior', total: 160 }
            ];
            break;
        case 'mes':
            labels = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
            data = [80, 120, 90, 150];
            tableData = [
                { period: 'Este Mes', total: 440 },
                { period: 'Mes Anterior', total: 380 }
            ];
            break;
        case 'año':
            labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            data = [300, 400, 350, 500, 450, 600, 550, 700, 650, 800, 750, 900];
            tableData = [
                { period: 'Este Año', total: 7000 },
                { period: 'Año Anterior', total: 6200 }
            ];
            break;
        default:
            labels = ['N/A'];
            data = [0];
            tableData = [{ period: 'No hay datos', total: 0 }];
            break;
    }

    // Configuración del gráfico
    const ctx = chartCanvas.getContext('2d');
    chartPacientesInstance = new Chart(ctx, {
        type: 'bar', // Puedes cambiar a 'line', 'pie', etc.
        data: { labels, datasets: [{ label: 'Pacientes Registrados', data, backgroundColor: 'rgba(75, 192, 192, 0.6)', borderColor: 'rgba(75, 192, 192, 1)', borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, title: { display: true, text: 'Número de Pacientes' } }, x: { title: { display: true, text: 'Periodo' } } }, plugins: { legend: { display: true, position: 'top', }, tooltip: { callbacks: { label: function(context) { return `${context.dataset.label}: ${context.raw}`; } } } } }
    });

    // Llenar la tabla
    tablaCuerpo.innerHTML = '';
    tableData.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td style="text-align: left; padding: 12px;">${item.period}</td><td style="text-align: right; padding: 12px;">${item.total}</td>`;
        tablaCuerpo.appendChild(tr);
    });

}   

window.generateReport = generateReport;

/**
 * MÓDULO: GESTIÓN DE USUARIOS (MONITOREO)
 */
async function listarUsuarios() {
    const tablaCuerpo = document.getElementById('tabla-usuarios-cuerpo');
    if (!tablaCuerpo) return;

    try {
        const response = await axios.get('/usuarios/listar');
        const usuarios = response.data;
        tablaCuerpo.innerHTML = '';

        usuarios.forEach(u => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${u.Username}</td>
                <td>${u.Nombre_Completo}</td>
                <td><span class="badge">${u.Rol}</span></td>
                <td><span style="color:${u.Estado ? 'green' : 'red'}">${u.Estado ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                    <button onclick="window.eliminarUsuario('${u.ID_Usuario}')" class="btn-small" style="background:#e74c3c; color:white; border:none; cursor:pointer; padding:5px 10px; border-radius:4px;">Deshabilitar</button>
                </td>
            `;
            tablaCuerpo.appendChild(row);
        });
    } catch (error) {
        console.error("Error al listar usuarios:", error);
    }
}
window.listarUsuarios = listarUsuarios;

async function registrarUsuario() {
    const datos = {
        username: document.getElementById('user-username').value,
        password: document.getElementById('user-pass').value,
        nombre: document.getElementById('user-nombre').value,
        rol: document.getElementById('user-rol').value
    };

    try {
        const response = await axios.post('/usuarios/guardar', datos);
        alert("✅ " + response.data.message);
        listarUsuarios();
        document.getElementById('form-usuario').reset();
    } catch (error) {
        alert("❌ Error al guardar usuario");
    }
}
window.registrarUsuario = registrarUsuario;

async function eliminarUsuario(id) {
    if (!confirm("¿Desea deshabilitar este usuario?")) return;
    try {
        await axios.post('/usuarios/eliminar', { id });
        listarUsuarios();
    } catch (error) {
        alert("❌ Error al deshabilitar");
    }
}
window.eliminarUsuario = eliminarUsuario;

/**
 * MÓDULO: VADEMÉCUM E INVENTARIO
 */
async function listarMedicamentos() {
    const tabla = document.getElementById('tabla-medicamentos-cuerpo');
    if (!tabla) return;

    tabla.innerHTML = '<tr><td colspan="5" style="text-align:center;">Cargando inventario...</td></tr>';

    try {
        const response = await axios.get('/medicamentos/listar');
        const meds = Array.isArray(response.data) ? response.data : [];
        tabla.innerHTML = '';

        meds.forEach(m => {
            const tr = document.createElement('tr');
            const nomGen = m.Nombre_Generico || m.NOMBRE_GENERICO || m.nombre_generico || '';
            const nomCom = m.Nombre_Comercial || m.NOMBRE_COMERCIAL || m.nombre_comercial || '';
            const conc = m.Concentracion || m.CONCENTRACION || '';
            
            tr.innerHTML = `
                <td><strong>${nomGen}</strong> <small style="color:#666;">(${nomCom})</small><br>
                    <small>${conc}</small></td>
                <td>${m.Presentacion || m.PRESENTACION || ''}</td>
                <td><span style="font-weight:bold; color:${(m.Stock || m.STOCK || m.stock || 0) < 10 ? 'red' : 'inherit'}">${m.Stock || m.STOCK || m.stock || 0}</span></td>
                <td>${m.Fecha_Vencimiento || m.FECHA_VENCIMIENTO || m.fecha_vencimiento || '-'}</td>
                <td>
                    <button onclick='window.prepararEdicionMed(${JSON.stringify(m).replace(/'/g, "&apos;")})' class="btn-small" style="background:var(--primary); color:white; border:none; padding:5px; border-radius:4px; cursor:pointer;">✏️</button>
                    <button onclick="window.eliminarMedicamento('${m.ID_Medicamento || m.ID_MEDICAMENTO || m.id_medicamento}')" class="btn-small" style="background:#e74c3c; color:white; border:none; padding:5px; border-radius:4px; cursor:pointer;">🗑️</button>
                </td>
            `;
            tabla.appendChild(tr);
        });
    } catch (error) {
        tabla.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Error al conectar con el inventario.</td></tr>';
    }
}
window.listarMedicamentos = listarMedicamentos;

async function guardarMedicamento() {
    const datos = {
        id: document.getElementById('med-id').value,
        codigo_barras: document.getElementById('med-barras').value,
        nombre_generico: document.getElementById('med-nombre-generico').value,
        nombre_comercial: document.getElementById('med-nombre-comercial').value,
        concentracion: document.getElementById('med-concentracion').value,
        unidad: document.getElementById('med-unidad')?.value || 'mg',
        presentacion: document.getElementById('med-presentacion').value,
        stock: document.getElementById('med-stock-input').value,
        vence: document.getElementById('med-vence-input').value
    };

    try {
        const response = await axios.post('/medicamentos/guardar', datos);
        alert("✅ " + (response.data.message || "Inventario actualizado correctamente."));
        document.getElementById('form-medicamento')?.reset();
        document.getElementById('med-id').value = "0";
        listarMedicamentos();
    } catch (error) {
        if (error.response && error.response.status === 422) {
            // Error de validación de Laravel (campos faltantes o inválidos)
            const errores = Object.values(error.response.data.errors).flat().join('\n');
            alert("⚠️ Por favor verifique los datos ingresados:\n\n" + errores);
        } else {
            console.error("Error al guardar medicamento:", error);
            alert("❌ Error: " + (error.response?.data?.message || "No se pudo conectar con el servidor."));
        }
    }
}
window.guardarMedicamento = guardarMedicamento;

function prepararEdicionMed(m) {
    // Normalización de ID para asegurar que se capture sin importar el case de la BD
    document.getElementById('med-id').value = m.ID_Medicamento || m.ID_MEDICAMENTO || m.id_medicamento || 0;
    document.getElementById('med-barras').value = m.Codigo_Barras || m.CODIGO_BARRAS || m.codigo_barras || '';
    document.getElementById('med-nombre-generico').value = m.Nombre_Generico || m.NOMBRE_GENERICO || m.nombre_generico || '';
    document.getElementById('med-nombre-comercial').value = m.Nombre_Comercial || m.NOMBRE_COMERCIAL || m.nombre_comercial || '';
    // Regex corregida para permitir puntos decimales en la concentración
    const conc = m.Concentracion || m.CONCENTRACION || m.concentracion || '';
    document.getElementById('med-concentracion').value = conc.toString().replace(/[^0-9.]/g, '');
    
    // Extraer unidad (mg, ml, etc.) y asignarla al select
    const unitMatch = conc.toString().match(/(mg|ml|g|mcg|UI)/i);
    const unitEl = document.getElementById('med-unidad');
    if (unitEl && unitMatch) unitEl.value = unitMatch[0].toLowerCase();

    document.getElementById('med-presentacion').value = m.Presentacion || m.PRESENTACION || m.presentacion || 'Tableta';
    document.getElementById('med-stock-input').value = m.Stock || m.STOCK || m.stock || 0;
    document.getElementById('med-vence-input').value = m.Fecha_Vencimiento || m.FECHA_VENCIMIENTO || m.fecha_vencimiento || '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.prepararEdicionMed = prepararEdicionMed;

async function eliminarMedicamento(id) {
    if (!confirm("⚠️ ADVERTENCIA: ¿Está seguro de dar de baja este medicamento?\n\nEl registro permanecerá en el sistema para fines de auditoría histórica, pero ya no aparecerá en el inventario activo ni podrá ser recetado.")) return;
    try {
        await axios.post('/medicamentos/eliminar', { id });
        listarMedicamentos();
    } catch (error) { alert("❌ Error al eliminar."); }
}
window.eliminarMedicamento = eliminarMedicamento;

/**
 * BUSCAR EN VADEMECUM (Filtro local)
 */
/**
 * BUSCAR EN VADEMECUM (Con actualización completa de Ficha de Stock)
 */
async function buscarMedicamento() {
    const query = document.getElementById('search-vademecum')?.value.trim();
    if (!query) return;

    // Filtrado visual preventivo en la tabla
    const rows = document.querySelectorAll('#tabla-medicamentos-cuerpo tr');
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
    });

    try {
        const response = await axios.get(`/medicamentos/buscar/${query}`);
        if (response.data.status === 'success') {
            const m = response.data.data;
            const detailBox = document.getElementById('med-details');
            
            const codEl = document.getElementById('stock-codigo');
            const genEl = document.getElementById('stock-nombre-generico');
            const comEl = document.getElementById('stock-nombre-comercial');
            const cantEl = document.getElementById('stock-cant');
            const venceEl = document.getElementById('lote-vence');
            const presEl = document.getElementById('stock-presentacion');
            const concEl = document.getElementById('stock-concentracion');

            if (detailBox) {
                detailBox.innerHTML = `
                    <button class="btn" style="width: 100%; background: #8e44ad;" onclick="window.consultarGeminiMedicamento('${m.Nombre_Generico}')">CONSULTAR A GEMINI</button>
                    <div style="margin-top: 15px; border-top: 1px dashed #ccc; padding-top: 10px; font-size: 0.9em;">
                        <p><strong>Estado:</strong> <span style="color: #27ae60; font-weight: bold;">Cargado del inventario</span></p>
                        <p><strong>Presentación:</strong> <span>${m.Presentacion}</span></p>
                        <p><strong>Concentración:</strong> <span>${m.Concentracion}</span></p>
                    </div>
                `;
            }

            if (codEl) codEl.textContent = m.Codigo_Barras || '----------';
            if (genEl) genEl.textContent = m.Nombre_Generico || '-';
            if (comEl) comEl.textContent = m.Nombre_Comercial || '-';
            if (cantEl) cantEl.textContent = m.Stock_Actual || m.Stock || 0;
            if (venceEl) venceEl.textContent = m.Fecha_Vencimiento || '--/--/----';
            if (presEl) presEl.textContent = m.Presentacion || '-';
            if (concEl) concEl.textContent = m.Concentracion || '-';
        }
    } catch (e) { console.error("Error al buscar medicamento:", e); }
}
window.buscarMedicamento = buscarMedicamento;

/**
 * INTEGRACIÓN CON IA: Sugerir consulta a Gemini
 */
async function consultarGeminiMedicamento(nombreOverride = null) {
    const nombre = nombreOverride || document.getElementById('med-nombre-generico')?.value;
    if (!nombre) {
        alert("⚠️ Por favor, busque o seleccione un medicamento primero.");
        return;
    }

    const promptPredeterminado = `Dime las contraindicaciones principales, efectos secundarios y dosis sugerida para adultos de ${nombre} en formato breve para personal de salud.`;
    
    if (confirm(`🤖 ¿Desea consultar a la IA sobre: ${nombre}?\n\nPrompt: "${promptPredeterminado}"`)) {
        const responseContainer = document.getElementById('med-details');
        if (responseContainer) {
            responseContainer.innerHTML += `
                <div id="med-gemini-resp" style="margin-top: 15px; background: #f5eef8; border: 1px solid #8e44ad; padding: 10px; border-radius: 5px; font-style: italic; color: #6c3483;">
                    Consultando a Gemini...
                </div>
            `;
        }

        try {
            const response = await axios.post('/diagnosticos/generar-ia', {
                dni: '00000000', // DNI ficticio para vademecum
                sintomas: `Información clínica sobre el medicamento: ${nombre}. ${promptPredeterminado}`,
                idioma: 'es'
            });

            const res = response.data;
            const respDiv = document.getElementById('med-gemini-resp');
            if (res.status === 'success') {
                if (respDiv) respDiv.innerHTML = `<strong>Respuesta Gemini:</strong><br>${res.hipotesis.replace(/\n/g, '<br>')}`;
            } else {
                if (respDiv) respDiv.innerHTML = `<span style="color: red;">Error: ${res.message || 'No disponible'}</span>`;
            }
        } catch (error) {
            const respDiv = document.getElementById('med-gemini-resp');
            if (respDiv) respDiv.innerHTML = '<span style="color: red;">Error al consultar Gemini.</span>';
        }
    }
}
window.consultarGeminiMedicamento = consultarGeminiMedicamento;

/**
 * ESTADO CLÍNICO GLOBAL PARA MÓDULO DE DIAGNÓSTICO
 */
window.recetaTemporal = [];
window.diagnosticoPaciente = null;
window.medicamentosVademecum = [];

/**
 * MÓDULO DIAGNÓSTICO: Validar Paciente y Cargar Datos
 */
async function validarPacienteParaDiagnostico() {
    const dniInput = document.getElementById('diagnostico-dni');
    const dni = dniInput?.value.trim();
    const display = document.getElementById('diag-paciente-nombre');

    if (!dni || dni.length < 8) {
        alert("Por favor, ingrese un DNI válido de 8 dígitos.");
        return;
    }

    try {
        const response = await axios.get(`/diagnosticos/buscar-paciente/${dni}`);
        const res = response.data;
        if (res.status === 'success') {
            const p = res.data;
            window.diagnosticoPaciente = p;
            
            const msg = `✅ Paciente identificado: ${p.Paciente}\nTemperatura: ${p.Temperatura}°C | Presión Arterial: ${p.Presion_Arterial}\n` + 
                        `Alergias Registradas: ${p.Alergias_Cronicas || 'Ninguna'}`;
            alert(msg);
            
            if (display) {
                display.innerHTML = `<strong>Paciente identificado:</strong> ${p.Paciente}<br>` + 
                                    `<small style="color: #666;">Signos vitales cargados desde el triaje del ${p.Fecha_Hora}</small><br>` +
                                    `<span style="color: #e67e22; font-weight: bold;">Alergias: ${p.Alergias_Cronicas || 'Ninguna'}</span>`;
            }

            // Cargar medicamentos activos en el select de la receta
            await window.cargarMedicamentosRecetaSelect();
        } else {
            alert("Error: " + (res.message || "No se pudo validar el paciente."));
        }
    } catch (error) {
        console.error("Error validando paciente:", error);
        if (confirm("❌ Paciente sin triaje reciente. ¿Desea ir al módulo de Triaje ahora?")) {
            showView('view-triaje-registro');
        }
    }
}
window.validarPacienteParaDiagnostico = validarPacienteParaDiagnostico;

/**
 * Cargar medicamentos activos en select de receta
 */
async function cargarMedicamentosRecetaSelect() {
    const select = document.getElementById('prescribir-med-select');
    if (!select) return;

    try {
        const response = await axios.get('/medicamentos/listar');
        const meds = response.data;
        window.medicamentosVademecum = meds;

        select.innerHTML = '<option value="">-- Seleccionar Medicamento --</option>';
        meds.forEach(m => {
            const nomGen = m.Nombre_Generico || m.NOMBRE_GENERICO || m.nombre_generico;
            const nomCom = m.Nombre_Comercial || m.NOMBRE_COMERCIAL || m.nombre_comercial || '';
            const conc = m.Concentracion || m.CONCENTRACION || '';
            const id = m.ID_Medicamento || m.ID_MEDICAMENTO || m.id_medicamento;
            const label = `${nomGen} (${nomCom}) - ${conc} (Stock: ${m.Stock || m.stock || 0})`;
            
            const option = document.createElement('option');
            option.value = id;
            option.textContent = label;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Error al cargar medicamentos para receta:", error);
    }
}
window.cargarMedicamentosRecetaSelect = cargarMedicamentosRecetaSelect;

/**
 * Verificar alergia del paciente al seleccionar medicamento
 */
function verificarAlergiasMedicamento() {
    const select = document.getElementById('prescribir-med-select');
    const medId = select?.value;
    const alertBox = document.getElementById('alerta-alergia-med');
    if (!alertBox) return;

    if (!medId || !window.diagnosticoPaciente) {
        alertBox.style.display = 'none';
        return;
    }

    const med = window.medicamentosVademecum.find(m => 
        (m.ID_Medicamento || m.ID_MEDICAMENTO || m.id_medicamento) === medId
    );
    const alergias = (window.diagnosticoPaciente.Alergias_Cronicas || '').toLowerCase().trim();

    if (med && alergias) {
        const nomGen = (med.Nombre_Generico || med.NOMBRE_GENERICO || '').toLowerCase();
        const nomCom = (med.Nombre_Comercial || med.NOMBRE_COMERCIAL || '').toLowerCase();

        if (alergias.includes(nomGen) || (nomCom && alergias.includes(nomCom))) {
            alertBox.style.display = 'block';
            alertBox.textContent = `⚠️ ADVERTENCIA: El paciente reporta alergias crónicas relacionadas con: ${med.Nombre_Generico}.`;
            return;
        }
    }
    alertBox.style.display = 'none';
}
window.verificarAlergiasMedicamento = verificarAlergiasMedicamento;

/**
 * Agregar medicamento a la receta temporal
 */
function agregarMedicamentoAPreceta() {
    const select = document.getElementById('prescribir-med-select');
    const dosisInput = document.getElementById('prescribir-med-dosis');
    const cantidadInput = document.getElementById('prescribir-med-cantidad');

    const medId = select?.value;
    const dosis = dosisInput?.value.trim();
    const cantidad = parseInt(cantidadInput?.value);

    if (!medId || !dosis || isNaN(cantidad) || cantidad <= 0) {
        alert("Por favor complete todos los campos de prescripción (Medicamento, Dosis y Cantidad).");
        return;
    }

    const med = window.medicamentosVademecum.find(m => 
        (m.ID_Medicamento || m.ID_MEDICAMENTO || m.id_medicamento) === medId
    );

    if (!med) return;

    const stockActual = med.Stock || med.stock || 0;
    if (cantidad > stockActual) {
        alert(`⚠️ Stock insuficiente. Solo quedan ${stockActual} unidades disponibles en inventario.`);
        return;
    }

    const alergias = (window.diagnosticoPaciente?.Alergias_Cronicas || '').toLowerCase().trim();
    const nomGen = (med.Nombre_Generico || med.NOMBRE_GENERICO || '').toLowerCase();
    const nomCom = (med.Nombre_Comercial || med.NOMBRE_COMERCIAL || '').toLowerCase();
    const tieneAlergia = alergias.includes(nomGen) || (nomCom && alergias.includes(nomCom));

    // Validar si ya está en la receta
    const existeIndex = window.recetaTemporal.findIndex(item => item.id_medicamento === medId);
    if (existeIndex > -1) {
        window.recetaTemporal[existeIndex].cantidad = cantidad;
        window.recetaTemporal[existeIndex].dosis = dosis;
    } else {
        window.recetaTemporal.push({
            id_medicamento: medId,
            nombre: med.Nombre_Generico || med.NOMBRE_GENERICO,
            dosis: dosis,
            cantidad: cantidad,
            alergia: tieneAlergia ? true : false
        });
    }

    // Resetear campos
    if (dosisInput) dosisInput.value = '';
    if (cantidadInput) cantidadInput.value = '';
    if (select) select.value = '';
    document.getElementById('alerta-alergia-med').style.display = 'none';

    window.renderizarTablaPreceta();
}
window.agregarMedicamentoAPreceta = agregarMedicamentoAPreceta;

/**
 * Renderizar tabla de preceta
 */
function renderizarTablaPreceta() {
    const tbody = document.getElementById('lista-preceta-cuerpo');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (window.recetaTemporal.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999; padding: 15px;">Ningún medicamento agregado a la receta aún.</td></tr>';
        return;
    }

    window.recetaTemporal.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="padding: 10px;"><strong>${item.nombre}</strong></td>
            <td style="padding: 10px;">${item.dosis}</td>
            <td style="padding: 10px;">${item.cantidad}</td>
            <td style="padding: 10px; text-align: center; color: ${item.alergia ? '#e67e22' : '#27ae60'}; font-weight: bold;">
                ${item.alergia ? '⚠️ SÍ (Alerta)' : '✅ No detectada'}
            </td>
            <td style="padding: 10px; text-align: center;">
                <button type="button" class="btn-small" style="background:#e74c3c; color:white; border:none; border-radius:4px; padding:5px 10px; cursor:pointer;" onclick="window.removerMedicamentoDePreceta(${index})">Eliminar</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}
window.renderizarTablaPreceta = renderizarTablaPreceta;

/**
 * Quitar medicamento de preceta
 */
function removerMedicamentoDePreceta(index) {
    window.recetaTemporal.splice(index, 1);
    window.renderizarTablaPreceta();
}
window.removerMedicamentoDePreceta = removerMedicamentoDePreceta;

/**
 * Llamar a Gemini AI para generar Diagnóstico e Hipótesis
 */
async function generarDiagnosticoIA() {
    const sintomasText = document.getElementById('diagnostico-sintomas')?.value.trim();
    const idioma = document.getElementById('diagnostico-idioma')?.value || 'es';
    const responseContainer = document.getElementById('contenedor-ia-respuesta');
    const outputDiv = document.getElementById('ai-output');

    if (!window.diagnosticoPaciente) {
        alert("Por favor, cargue los datos de un paciente primero.");
        return;
    }

    if (!sintomasText) {
        alert("Por favor, describa los síntomas y observaciones del paciente.");
        return;
    }

    if (responseContainer && outputDiv) {
        responseContainer.style.display = 'block';
        outputDiv.innerHTML = '<span style="color: #666;">🤖 Analizando signos vitales y síntomas con Gemini AI... por favor espere...</span>';
    }

    try {
        const response = await axios.post('/diagnosticos/generar-ia', {
            dni: window.diagnosticoPaciente.DNI_CUI,
            sintomas: sintomasText,
            idioma: idioma
        });

        const res = response.data;
        if (res.status === 'success') {
            outputDiv.innerHTML = res.hipotesis.replace(/\n/g, '<br>');
        } else {
            outputDiv.innerHTML = `<span style="color: red;">❌ Error al generar diagnóstico: ${res.message || 'Servicio no disponible'}</span>`;
        }
    } catch (error) {
        console.error("Error en generación de IA:", error);
        outputDiv.innerHTML = '<span style="color: red;">❌ Error de conexión al servidor de IA.</span>';
    }
}
window.generarDiagnosticoIA = generarDiagnosticoIA;

/**
 * Guardar diagnóstico final y receta en BD
 */
async function guardarDiagnosticoFinal() {
    if (!window.diagnosticoPaciente) {
        alert("Por favor valide e identifique a un paciente primero.");
        return;
    }

    const sintomas = document.getElementById('diagnostico-sintomas')?.value.trim();
    const hipotesis = document.getElementById('ai-output')?.innerText.trim() || document.getElementById('ai-output')?.textContent.trim();
    const tratamiento = document.getElementById('diagnostico-tratamiento')?.value.trim();
    const idioma = document.getElementById('diagnostico-idioma')?.value || 'es';

    if (!sintomas) {
        alert("Por favor complete los síntomas del paciente.");
        return;
    }

    if (!hipotesis || hipotesis.includes('Analizando') || hipotesis.includes('Error')) {
        alert("Por favor genere la hipótesis diagnóstica mediante Gemini AI.");
        return;
    }

    const payload = {
        dni: window.diagnosticoPaciente.DNI_CUI,
        id_triaje: window.diagnosticoPaciente.ID_Triaje,
        sintomas: sintomas,
        hipotesis: hipotesis + (tratamiento ? `\n\nTratamiento e indicaciones adicionales:\n${tratamiento}` : ''),
        idioma: idioma,
        receta: window.recetaTemporal
    };

    try {
        const response = await axios.post('/diagnosticos/guardar', payload);
        const res = response.data;
        if (res.status === 'success') {
            alert("✅ " + res.message);
            // Limpiar formulario
            document.getElementById('diagnostico-sintomas').value = '';
            document.getElementById('diagnostico-tratamiento').value = '';
            document.getElementById('ai-output').innerHTML = 'Procesando análisis...';
            document.getElementById('contenedor-ia-respuesta').style.display = 'none';
            document.getElementById('diag-paciente-nombre').textContent = '';
            document.getElementById('diagnostico-dni').value = '';
            window.recetaTemporal = [];
            window.diagnosticoPaciente = null;
            window.renderizarTablaPreceta();
            
            // Redirigir a historial clínico
            showView('view-diagnostico-gestion');
        } else {
            alert("Error al guardar: " + (res.message || "Falla en el servidor"));
        }
    } catch (error) {
        console.error("Error al guardar consulta:", error);
        alert("❌ Error de servidor: no se pudo guardar el diagnóstico.");
    }
}
window.guardarDiagnosticoFinal = guardarDiagnosticoFinal;

/**
 * Buscar historial clínico por DNI
 */
async function buscarHistorialClinico() {
    const dni = document.getElementById('search-historial-dni')?.value.trim();
    const tbody = document.getElementById('tabla-historial-cuerpo');
    if (!tbody) return;

    if (!dni || dni.length < 8) {
        alert("Por favor, ingrese un DNI válido de 8 dígitos.");
        return;
    }

    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Cargando historial clínico...</td></tr>';

    try {
        const response = await axios.get(`/diagnosticos/historial/${dni}`);
        const res = response.data;

        tbody.innerHTML = '';
        if (res.status === 'success' && res.data.length > 0) {
            res.data.forEach(c => {
                const tr = document.createElement('tr');
                const fecha = new Date(c.Fecha_Consulta).toLocaleString('es-ES');
                const diagResumen = (c.Hipotesis_Diagnostica || '').substring(0, 80) + '...';
                
                tr.innerHTML = `
                    <td style="padding: 12px;">${fecha}</td>
                    <td style="padding: 12px;">${c.Paciente}</td>
                    <td style="padding: 12px;">${c.Medico}</td>
                    <td style="padding: 12px;">${diagResumen}</td>
                    <td style="padding: 12px; text-align: center;">
                        <button type="button" class="btn-small" style="background:var(--primary); color:white; border:none; border-radius:4px; padding:5px 12px; cursor:pointer;" onclick="window.verDetallesHistorial('${c.ID_Consulta}', '${c.Fecha_Consulta}', '${c.Medico}')">Ver Detalle</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999; padding: 20px;">No se encontraron registros de historial clínico para este DNI.</td></tr>';
        }
    } catch (error) {
        console.error("Error al buscar historial clínico:", error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red; padding: 20px;">Error al conectar con el servidor.</td></tr>';
    }
}
window.buscarHistorialClinico = buscarHistorialClinico;

/**
 * Cargar y renderizar ficha detallada de consulta e ítems de receta
 */
async function verDetallesHistorial(id, fechaStr, medico) {
    const detailPanel = document.getElementById('detalle-historial-seleccionado');
    if (!detailPanel) return;

    detailPanel.style.display = 'block';
    detailPanel.innerHTML = '<span style="color: #666;">Cargando detalles de consulta y receta...</span>';
    
    try {
        const response = await axios.get(`/diagnosticos/detalle/${id}`);
        const res = response.data;

        let recetaHtml = '';
        if (res.status === 'success' && res.data.length > 0) {
            recetaHtml = `
                <div style="margin-top: 15px; border-top: 1px dashed #ccc; padding-top: 10px;">
                    <h4 style="color: var(--primary); margin: 0 0 10px 0;">💊 Medicación Recetada:</h4>
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
                        <thead>
                            <tr style="text-align: left; border-bottom: 1px solid #ddd; background: #f8f9fa;">
                                <th style="padding: 8px;">Medicamento</th>
                                <th style="padding: 8px;">Dosis / Indicación</th>
                                <th style="padding: 8px;">Cantidad</th>
                                <th style="padding: 8px; text-align: center;">Alerta Alergia</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            res.data.forEach(item => {
                const nomGen = item.Nombre_Generico || item.nombre_generico || '';
                const nomCom = item.Nombre_Comercial || item.nombre_comercial ? `(${item.Nombre_Comercial || item.nombre_comercial})` : '';
                recetaHtml += `
                    <tr>
                        <td style="padding: 8px;"><strong>${nomGen}</strong> <small style="color: #666;">${nomCom}</small><br><small>${item.Concentracion} - ${item.Presentacion}</small></td>
                        <td style="padding: 8px;">${item.Dosis_Sugerida}</td>
                        <td style="padding: 8px;">${item.Cantidad_Entregada}</td>
                        <td style="padding: 8px; text-align: center; color: ${item.Validacion_Alergia ? '#e67e22' : '#27ae60'}; font-weight: bold;">
                            ${item.Validacion_Alergia ? '⚠️ Alerta de Alergia' : '✅ Ok'}
                        </td>
                    </tr>
                `;
            });
            recetaHtml += '</tbody></table></div>';
        } else {
            recetaHtml = '<div style="margin-top: 15px; padding: 10px; background: #eee; border-radius: 4px; font-style: italic; color: #666;">No se recetaron medicamentos en esta consulta.</div>';
        }

        // Obtener la descripción completa consultando el DNI actual
        const dni = document.getElementById('search-historial-dni').value.trim();
        const responseConsulta = await axios.get(`/diagnosticos/historial/${dni}`);
        const resConsulta = responseConsulta.data;
        
        let sintomasTexto = '';
        let hipotesisTexto = '';
        
        if (resConsulta.status === 'success') {
            const con = resConsulta.data.find(x => x.ID_Consulta === id);
            if (con) {
                sintomasTexto = con.Sintomas_Texto || '';
                hipotesisTexto = con.Hipotesis_Diagnostica || '';
            }
        }

        detailPanel.innerHTML = `
            <div style="position: relative; padding: 10px;">
                <button type="button" style="position: absolute; right: 0; top: 0; background: #e74c3c; color: white; border: none; padding: 5px 12px; border-radius: 4px; cursor: pointer; font-weight: bold;" onclick="document.getElementById('detalle-historial-seleccionado').style.display='none'">Cerrar</button>
                <h3 style="color: var(--primary); margin-top: 0; border-bottom: 2px solid #eee; padding-bottom: 10px;">Ficha de Historial Clínico</h3>
                <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
                    <div>
                        <p><strong>Fecha Consulta:</strong> ${new Date(fechaStr).toLocaleString('es-ES')}</p>
                    </div>
                    <div>
                        <p><strong>Atendido por:</strong> ${medico}</p>
                    </div>
                </div>
                
                <div style="margin-top: 15px; background: #fcfcfc; padding: 12px; border-radius: 6px; border: 1px solid #ddd; margin-bottom: 15px;">
                    <h4 style="margin: 0 0 8px 0; color: #666;">🔍 Síntomas y Observaciones:</h4>
                    <p style="margin: 0; white-space: pre-wrap; font-size: 0.95em;">${sintomasTexto || 'No registrado.'}</p>
                </div>

                <div style="margin-top: 15px; background: #f4faf7; padding: 15px; border-radius: 6px; border-left: 4px solid var(--secondary); margin-bottom: 15px;">
                    <h4 style="margin: 0 0 8px 0; color: var(--primary);">📋 Diagnóstico e Hipótesis Médica:</h4>
                    <p style="margin: 0; white-space: pre-wrap; line-height: 1.6; font-size: 0.95em;">${hipotesisTexto || 'No registrado.'}</p>
                </div>

                ${recetaHtml}
            </div>
        `;

    } catch (error) {
        console.error("Error al cargar detalles de receta:", error);
        detailPanel.innerHTML = '<span style="color: red;">Error al cargar los detalles de la consulta.</span>';
    }
}
window.verDetallesHistorial = verDetallesHistorial;

// Función para cerrar sesión
function logout() {
    localStorage.removeItem('loggedInUser'); // Limpiar datos del usuario del almacenamiento local
    axios.post('/api/logout') // Opcional: Notificar al servidor para invalidar la sesión
        .then(() => {
            window.location.href = './'; // Redirigir usando ruta relativa
        })
        .catch(error => {
            console.error("Error durante el logout:", error);
            window.location.href = './'; 
        });
}
window.logout = logout;

// Simulación de carga inicial
document.addEventListener('DOMContentLoaded', () => {
    console.log("MariFarma Pro Engine v1.0 - Perfil cargado");
    
    updateUserProfileDisplay();

    // Manejo de vistas pendientes por redirección de página
    const pendingView = sessionStorage.getItem('pendingView');
    if (pendingView) {
        sessionStorage.removeItem('pendingView');
        showView(pendingView);
    }

    // Actualizar fecha en el perfil (CU-04 / Contexto Regional)
    const dateEl = document.getElementById('current-date');
    if (dateEl) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.textContent = new Date().toLocaleDateString('es-ES', options);
    }
    // Si el contenedor del dashboard existe, cargar los pacientes del día automáticamente
    if (document.getElementById('tabla-pacientes-hoy-cuerpo')) {
        listarPacientesHoy();
    }
    // Carga automática inicial si los contenedores de tabla están presentes
    if (document.getElementById('tabla-triaje-cuerpo')) listarTriajesHoy();
    if (document.getElementById('tabla-medicamentos-cuerpo')) listarMedicamentos();
    if (document.getElementById('tabla-pacientes-cuerpo')) listarPacientes();

    // Si la vista actual es el reporte, cargar el gráfico automáticamente
    if (window.location.pathname === '/reportes' && document.getElementById('view-reporte')) {
        loadReportChart('semana'); // Cargar por defecto la semana
    }
});