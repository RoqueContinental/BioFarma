async function login() {
    const user = document.getElementById('username')?.value;
    const pass = document.getElementById('password')?.value;
    if (!user || !pass) {
        alert("Error: Por favor, ingrese usuario y contraseña.");
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
            },
            body: JSON.stringify({ username: user, password: pass })
        });

        const data = await response.json();

        if (response.ok && data.status === 'success') {
            // Guardamos el usuario en localStorage para que el Dashboard lo reconozca
            localStorage.setItem('loggedInUser', JSON.stringify(data.user));
            window.location.href = '/dashboard';
        } else {
            alert("Error: " + (data.message || "Credenciales incorrectas o error de servidor."));
        }
    } catch (error) {
        console.error("Error en el login:", error);
        alert("❌ Error de servidor: No se pudo conectar con la base de datos.");
    }
}

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
        // Ajustado para usar la ruta de Laravel en lugar de un puerto externo
        const response = await fetch('/pacientes/guardar', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') 
            },
            body: JSON.stringify(datos)
        });

        if (response.ok) {
            const res = await response.json();
            alert(`✅ Paciente ${res.detalle.Resultado} correctamente.`);
            
            // Limpiar y resetear interfaz
            if (document.getElementById('form-registro-paciente')) {
                document.getElementById('form-registro-paciente').reset();
            }
            const btnGuardar = document.getElementById('btn-guardar-paciente');
            if (btnGuardar) btnGuardar.innerText = "Registrar Paciente";
            
            showView('view-gestion');
        } else {
            throw new Error("Error al guardar");
        }
    } catch (error) {
        console.error("Error en registro:", error);
        alert("❌ Error al procesar el registro.");
    }
}

/**
 * SISTEMA DE NAVEGACIÓN MODULAR
 */
function showView(viewId) {
    const currentPath = window.location.pathname;
    
    // Mapa de rutas para permitir navegación entre módulos
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

    // Si la vista solicitada pertenece a otra página, redirigir y guardar la intención
    if (pageMap[viewId] && currentPath !== pageMap[viewId]) {
        sessionStorage.setItem('pendingView', viewId);
        window.location.href = pageMap[viewId];
        return;
    }

    // Ocultar todas las vistas
    document.querySelectorAll('.view').forEach(v => {
        v.style.display = 'none';
        v.classList.remove('active');
    });

    // Mostrar la vista objetivo
    const target = document.getElementById(viewId);
    if (target) {
        target.style.display = viewId.includes('submenu') ? 'flex' : 'block';
        target.classList.add('active');
    }

    // Manejo de estados visuales según la vista
    actualizarEstadoSubmenus(viewId);

    // Carga automática de datos al entrar a las vistas de gestión
    if (viewId === 'view-triaje-gestion') {
        listarTriajes();
    }
    if (viewId === 'view-vademecum-gestion') {
        listarMedicamentos();
    }
    if (viewId === 'view-gestion') {
        listarPacientes();
    }
}
window.showView = showView;

function actualizarEstadoSubmenus(activeViewId) {
    const secciones = ['pacientes', 'triaje', 'diagnostico', 'vademecum'];
    secciones.forEach(sec => {
        const sm = document.getElementById(`submenu-${sec}`);
        const ar = document.getElementById(`arrow-${sec}`);
        if (!sm) return;

        if (activeViewId.includes(sec)) {
            sm.style.display = 'flex';
            if (ar) ar.textContent = '▲';
        } else {
            sm.style.display = 'none';
            if (ar) ar.textContent = '▼';
        }
    });
}

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
 * FUNCIONES DE VADEMECUM (Sincronizadas con app.js)
 */
async function listarMedicamentos() {
    const tabla = document.getElementById('tabla-medicamentos-cuerpo');
    if (!tabla) return;
    try {
        const response = await fetch('/medicamentos/listar');
        if (!response.ok) throw new Error("Error al obtener medicamentos");
        const meds = await response.json();
        
        tabla.innerHTML = '';
        if (!Array.isArray(meds)) return;

        meds.forEach(m => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${m.Nombre_Generico}</td>
                <td>${m.Concentracion}</td>
                <td>${m.Lote || 'N/A'}</td>
                <td>${m.Stock}</td>
                <td>${m.Fecha_Vencimiento || '-'}</td>
                <td>
                    <button class="btn-small" onclick='window.prepararEdicionMed(${JSON.stringify(m)})'>✏️</button>
                    <button onclick="window.eliminarMedicamento(${m.ID_Medicamento})">🗑️</button>
                </td>`;
            tabla.appendChild(tr);
        });
    } catch (e) { console.error(e); }
}
window.listarMedicamentos = listarMedicamentos;

/**
 * LISTAR PACIENTES
 */
async function listarPacientes() {
    const tabla = document.getElementById('tabla-pacientes-cuerpo');
    if (!tabla) return;
    try {
        const response = await fetch('/pacientes/listar');
        const pacientes = await response.json();
        
        tabla.innerHTML = '';
        if (!Array.isArray(pacientes)) return;

        if (pacientes.length === 0) {
            tabla.innerHTML = '<tr><td colspan="5" class="text-center">No hay pacientes registrados.</td></tr>';
            return;
        }

        pacientes.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.DNI_CUI}</td>
                <td>${p.Apellidos}, ${p.Nombres}</td>
                <td>${p.Sexo}</td>
                <td>${p.Telefono || '-'}</td>
                <td>
                    <button class="btn-small" style="background:#3498db; color:white;" onclick="window.prepararEdicion('${p.DNI_CUI}')" title="Editar">✏️</button>
                    <button class="btn-small" style="background:#e74c3c; color:white;" onclick="window.eliminarPaciente('${p.DNI_CUI}')" title="Desactivar">🗑️</button>
                </td>`;
            tabla.appendChild(tr);
        });
    } catch (e) { console.error("Error al listar pacientes:", e); }
}
window.listarPacientes = listarPacientes;

/**
 * FILTRADO LOCAL EN LA TABLA
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

/**
 * BUSCAR PACIENTE EN DB Y MOSTRAR DETALLES (MÓDULO GESTIÓN)
 */
async function buscarPacienteLocal() {
    const dni = document.getElementById('search-paciente').value.trim();
    if (!dni) return alert("Por favor, ingrese un DNI en el buscador.");

    try {
        const response = await fetch(`/pacientes/buscar/${dni}`);
        const res = await response.json();
        
        if (res.status === 'success') {
            mostrarDetallePaciente(res.data);
        } else {
            alert("Paciente no encontrado en la base de datos.");
        }
    } catch (e) { alert("Error al buscar el paciente."); }
}
window.buscarPacienteLocal = buscarPacienteLocal;

function mostrarDetallePaciente(p) {
    const container = document.getElementById('detalle-paciente-info');
    if (!container) return;

    container.innerHTML = `
        <div style="padding: 15px;">
            <h2 style="color: var(--primary); border-bottom: 2px solid #eee; padding-bottom: 10px;">Ficha: ${p.Nombres} ${p.Apellidos}</h2>
            <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                <div>
                    <p><strong>DNI:</strong> ${p.DNI_CUI}</p>
                    <p><strong>Nacimiento:</strong> ${p.Fecha_Nacimiento}</p>
                    <p><strong>Sexo:</strong> ${p.Sexo === 'M' ? 'Masculino' : 'Femenino'}</p>
                </div>
                <div>
                    <p><strong>Teléfono:</strong> ${p.Telefono || '-'}</p>
                    <p><strong>Dirección:</strong> ${p.Direccion || '-'}</p>
                    <p><strong>Alergias:</strong> ${p.Alergias_Cronicas || 'Ninguna'}</p>
                </div>
            </div>
        </div>`;
    showView('view-detalle');
}

/**
 * PREPARAR EDICIÓN DE PACIENTE (UPGRADE)
 */
async function prepararEdicion(dni) {
    try {
        const response = await fetch(`/pacientes/buscar/${dni}`);
        const res = await response.json();
        if (res.status === 'success') {
            const p = res.data;
            // Cambiamos a la vista de registro
            showView('view-registro');
            // Llenamos el formulario
            document.getElementById('dni-input').value = p.DNI_CUI;
            document.getElementById('paciente-nombres').value = p.Nombres;
            document.getElementById('paciente-apellidos').value = p.Apellidos;
            document.getElementById('paciente-fecha-nac').value = p.Fecha_Nacimiento;
            document.getElementById('paciente-sexo').value = p.Sexo;
            document.getElementById('paciente-direccion').value = p.Direccion || '';
            document.getElementById('paciente-telefono').value = p.Telefono || '';
            document.getElementById('paciente-alergias').value = p.Alergias_Cronicas || '';
            
            // Cambiamos visualmente el botón
            const btn = document.getElementById('btn-guardar-paciente');
            if (btn) btn.innerText = "Guardar Cambios";
        }
    } catch (e) { alert("Error al cargar datos para edición."); }
}
window.prepararEdicion = prepararEdicion;

/**
 * ELIMINAR PACIENTE (Baja Lógica)
 */
async function eliminarPaciente(dni) {
    if (!confirm(`¿Está seguro de desactivar al paciente con DNI ${dni}? Esta acción quedará registrada en la auditoría.`)) return;
    
    try {
        const response = await fetch('/pacientes/eliminar', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
            },
            body: JSON.stringify({ dni })
        });

        if (response.ok) {
            alert("Paciente desactivado correctamente.");
            listarPacientes();
        }
    } catch (e) { console.error("Error al eliminar:", e); }
}
window.eliminarPaciente = eliminarPaciente;

/**
 * LISTAR TRIAJES (Hoy)
 */
async function listarTriajes() {
    const tabla = document.getElementById('tabla-triaje-cuerpo');
    if (!tabla) return;
    try {
        const hoy = new Date().toISOString().split('T')[0];
        const response = await fetch(`/triaje/listar?fecha=${hoy}`); // Laravel recibirá esto vía Request query
        const triajes = await response.json();
        
        tabla.innerHTML = '';
        if (!Array.isArray(triajes)) return;

        triajes.forEach(t => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${t.Hora}</td>
                <td><strong>${t.DNI_CUI}</strong><br>${t.Paciente}</td>
                <td>${t.Temperatura}°C</td>
                <td>${t.Presion_Arterial}</td>
                <td><small>${t.Atendido_Por}</small></td>`;
            tabla.appendChild(tr);
        });
    } catch (e) { console.error("Error al listar triajes:", e); }
}
window.listarTriajes = listarTriajes;

/**
 * BUSCAR EN VADEMECUM (Para el botón faltante)
 */
function buscarMedicamento() {
    const query = document.getElementById('search-vademecum')?.value.toLowerCase();
    const rows = document.querySelectorAll('#tabla-medicamentos-cuerpo tr');
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
    });
}
window.buscarMedicamento = buscarMedicamento;

async function guardarMedicamento() {
    const id = document.getElementById('med-id').value;
    const body = {
        id,
        nombre: document.getElementById('med-nombre').value,
        lote: document.getElementById('med-lote-input').value,
        stock: document.getElementById('med-stock-input').value,
        descripcion: document.getElementById('med-descripcion').value,
        vence: document.getElementById('med-vence-input').value
    };
    await fetch('/medicamentos/guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content },
        body: JSON.stringify(body)
    });
    listarMedicamentos();
}
window.guardarMedicamento = guardarMedicamento;

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

/**
 * CU-04: Seleccionar Interfaz de Idioma
 */
function setLanguage(lang) {
    console.log(`Cambiando interfaz a: ${lang}`);
    // En Laravel, esto dispararía una petición al middleware de localización
    alert(`Idioma cambiado a ${lang}. El sistema está traduciendo etiquetas...`);
}

/**
 * CU-02/05: Validar Triaje de Signos Vitales
 */
async function guardarTriaje() {
    const userStr = localStorage.getItem('loggedInUser');
    if (!userStr) {
        alert("Sesión expirada. Por favor vuelva a loguearse.");
        return;
    }
    
    const user = JSON.parse(userStr);
    const temp = document.getElementById('triaje-temp')?.value;
    
    if (temp && parseFloat(temp) > 38) {
        if (!confirm("Se ha detectado fiebre alta. ¿Desea continuar con el registro?")) return;
    }

    const datos = {
        dni: document.getElementById('triaje-dni')?.value,
        temp: temp,
        presion: document.getElementById('triaje-presion')?.value,
        saturacion: document.getElementById('triaje-saturacion')?.value,
        fc: document.getElementById('triaje-fc')?.value,
        peso: document.getElementById('triaje-peso')?.value,
        id_usuario: user.id_usuario // Vinculación con el usuario en sesión (normalizado a minúsculas)
    };

    if (!datos.dni || !datos.temp) {
        alert("DNI y Temperatura son obligatorios.");
        return;
    }

    try {
        const response = await fetch('/triaje/guardar', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
            },
            body: JSON.stringify(datos)
        });

        if (response.ok) {
            alert("✅ Triaje registrado y vinculado al personal de salud.");
            showView('view-triaje-gestion');
        } else {
            const err = await response.json();
            alert("Error: " + err.message);
        }
    } catch (e) {
        console.error("Error guardando triaje:", e);
    }
}
window.guardarTriaje = guardarTriaje;

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

// Simulación de carga inicial
document.addEventListener('DOMContentLoaded', () => {
    console.log("MariFarma Pro Engine v1.0 - Perfil cargado");
    
    // Ejecutar vista pendiente tras redirección
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
});