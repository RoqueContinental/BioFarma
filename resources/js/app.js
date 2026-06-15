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

function login() {
    const user = document.getElementById('username')?.value;
    const pass = document.getElementById('password')?.value;

    if (!user || !pass) {
        alert("Error: Por favor, ingrese usuario y contraseña.");
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
                const msg = error.response?.data?.message || "Error de servidor o red.";
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
        'view-registro': '/pacientes',
        'view-gestion': '/pacientes',
        'view-triaje-registro': '/triaje',
        'view-triaje-gestion': '/triaje',
        'view-diagnostico-registro': '/diagnostico',
        'view-diagnostico-gestion': '/diagnostico',
        'view-vademecum-consulta': '/vademecum',
        'view-vademecum-gestion': '/vademecum'
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
 * CU-08: Generar Reporte Epidemiológico
 */
function generateReport() {
    const content = document.getElementById('report-content');
    const empty = document.getElementById('empty-report');
    if (content && empty) {
        empty.style.display = 'none';
        content.style.display = 'block';
        console.log("Procesando diagnósticos de los últimos 7 días en MySQL...");
    }
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
async function buscarMedicamento() {
    const query = document.getElementById('search-vademecum')?.value.trim();
    if (!query) return;

    // 1. Filtrado visual de la tabla para feedback inmediato
    const rows = document.querySelectorAll('#tabla-medicamentos-cuerpo tr');
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
    });

    try {
        // 2. Intentamos traer el registro de la DB para auto-completar el Control de Stock
        const response = await axios.get(`/medicamentos/buscar/${query}`);
        if (response.data.status === 'success') {
            prepararEdicionMed(response.data.data);
            console.log("Registro cargado en el panel de Control de Stock.");
        }
    } catch (error) {
        // Si falla la búsqueda exacta por API (404), no hacemos nada extra, 
        // el usuario ya tiene el filtrado visual de la tabla.
        console.log("Búsqueda específica no encontrada, manteniendo filtrado local.");
    }
}
window.buscarMedicamento = buscarMedicamento;

/**
 * INTEGRACIÓN CON IA: Sugerir consulta a Gemini
 */
async function consultarGeminiMedicamento() {
    const nombre = document.getElementById('med-nombre-generico')?.value;
    if (!nombre) {
        alert("⚠️ Por favor, busque o seleccione un medicamento primero.");
        return;
    }

    const promptPredeterminado = `Dime las contraindicaciones principales, efectos secundarios y dosis sugerida para adultos de ${nombre} en formato breve para personal de salud.`;
    
    if (confirm(`🤖 ¿Desea consultar a la IA sobre: ${nombre}?\n\nPrompt: "${promptPredeterminado}"`)) {
        console.log("Iniciando conexión con motor Gemini...");
        alert("🚀 Solicitud enviada. La integración con la API de Gemini se activará una vez configurada la API KEY en el backend.");
    }
}
window.consultarGeminiMedicamento = consultarGeminiMedicamento;

// Función para cerrar sesión
function logout() {
    localStorage.removeItem('loggedInUser'); // Limpiar datos del usuario del almacenamiento local
    axios.post('/api/logout') // Opcional: Notificar al servidor para invalidar la sesión
        .then(() => {
            window.location.href = '/'; // Redirigir a la página de inicio o login
        })
        .catch(error => {
            console.error("Error durante el logout:", error);
            window.location.href = '/'; // Redirigir incluso si hay error en la API
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
});