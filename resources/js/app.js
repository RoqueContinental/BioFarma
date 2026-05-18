/**
 * Manejo de Sesión y Navegación
 */
import './bootstrap';
import '../css/app.css';


function login() {
    const user = document.getElementById('username')?.value;
    const pass = document.getElementById('password')?.value;

    if (user === 'admin' && pass === '123456') {
        window.location.href = '/dashboard';
    } else {
        alert("Error: Credenciales incorrectas o campos vacíos.");
    }
}
window.login = login;

/**
 * MÓDULO 1: REGISTRO DE PACIENTES
 * Maneja la consulta a RENIEC y el guardado de datos.
 */
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
            document.querySelector('form').reset();
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
    // Si no estamos en la página de pacientes, redirigimos primero
    if (window.location.pathname !== '/pacientes') {
        window.location.href = '/pacientes';
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
    
    if (submenu.style.display === 'none' || submenu.style.display === '') {
        submenu.style.display = 'flex';
        arrow.textContent = '▲';
    } else {
        submenu.style.display = 'none';
        arrow.textContent = '▼';
    }
}
window.toggleSubmenu = toggleSubmenu;

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

// Simulación de carga inicial
document.addEventListener('DOMContentLoaded', () => {
    console.log("MariFarma Pro Engine v1.0 - Perfil cargado");
    
    // Actualizar fecha en el perfil (CU-04 / Contexto Regional)
    const dateEl = document.getElementById('current-date');
    if (dateEl) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.textContent = new Date().toLocaleDateString('es-ES', options);
    }
});