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
        'view-vademecum-gestion': '/vademecum',
        'view-reporte': '/reportes'
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
        // Inicializar el campo de fecha con la fecha de hoy
        const fechaInput = document.getElementById('fecha-triaje');
        if (fechaInput) {
            fechaInput.value = new Date().toISOString().split('T')[0];
        }
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
                    <button class="btn-small" onclick='window.prepararEdicionMed(${JSON.stringify(m).replace(/'/g, "&apos;")})' title="Editar">✏️</button>
                    <button onclick="window.eliminarMedicamento('${m.ID_Medicamento || m.ID_MEDICAMENTO || m.id_medicamento}')">🗑️</button>
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
async function eliminarMedicamento(id) {
    if (!confirm("⚠️ ADVERTENCIA: ¿Está seguro de dar de baja este medicamento?\n\nEl registro permanecerá en el sistema para fines de auditoría histórica, pero ya no aparecerá en el inventario activo ni podrá ser recetado.")) return;
    
    try {
        const response = await fetch('/medicamentos/eliminar', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
            },
            body: JSON.stringify({ id })
        });

        if (response.ok) {
            alert("Medicamento dado de baja correctamente.");
            listarMedicamentos();
        }
    } catch (e) { console.error("Error al eliminar:", e); }
}
window.eliminarMedicamento = eliminarMedicamento;

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

/**
 * LISTAR TRIAJES
 */
async function listarTriajes(fecha = null) {
    const tabla = document.getElementById('tabla-triaje-cuerpo');
    if (!tabla) return;
    try {
        const fechaSeleccionada = fecha || new Date().toISOString().split('T')[0];
        const response = await fetch(`/triaje/listar?fecha=${fechaSeleccionada}`); // Laravel recibirá esto vía Request query
        const triajes = await response.json();
        
        tabla.innerHTML = '';
        if (!Array.isArray(triajes)) return;

        triajes.forEach(t => {
            const tr = document.createElement('tr');
            // Fallback para nombres de columnas en MySQL
            tr.innerHTML = `
                <td>${t.Hora || t.HORA || '-'}</td>
                <td><strong>${t.DNI_CUI || t.dni_cui || t.DNI || ''}</strong></td>
                <td>${t.Paciente || t.PACIENTE || ''}</td>
                <td>${t.Temperatura || t.TEMPERATURA || '-'}°C</td>
                <td>${t.Presion_Arterial || t.PRESION_ARTERIAL || '-'}</td>
                <td>${t.Saturacion || t.SATURACION_O2 || t.Saturacion_O2 || '-'}%</td>
                <td>${t.FC || t.Frecuencia_Cardiaca || t.FRECUENCIA_CARDIACA || '-'}</td>
                <td>${t.Peso || t.PESO || '-'} kg</td>
                <td><small>${t.Notas_Observaciones || t.NOTAS_OBSERVACIONES || t.notas || '-'}</small></td>
                <td><small>${t.Atendido_Por || t.ATENDIDO_POR || '-'}</small></td>`;
            tabla.appendChild(tr);
        });
    } catch (e) { console.error("Error al listar triajes:", e); }
}
window.listarTriajes = listarTriajes;

/**
 * Cargar triajes por fecha seleccionada
 */
async function cargarTriajesPorFecha() {
    const fechaInput = document.getElementById('fecha-triaje');
    const fecha = fechaInput?.value;
    if (!fecha) {
        alert("Por favor seleccione una fecha.");
        return;
    }
    await listarTriajes(fecha);
}
window.cargarTriajesPorFecha = cargarTriajesPorFecha;

/**
 * Generar PDF de triajes
 */
async function generarPDFTriajes() {
    const fechaInput = document.getElementById('fecha-triaje');
    const fecha = fechaInput?.value || new Date().toISOString().split('T')[0];
    
    try {
        const response = await fetch(`/triaje/listar?fecha=${fecha}`);
        const triajes = await response.json();
        
        if (!Array.isArray(triajes) || triajes.length === 0) {
            alert("No hay triajes para generar el PDF en esta fecha.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        // Título
        doc.setFontSize(18);
        doc.text("Reporte de Triajes", 20, 20);
        
        doc.setFontSize(10);
        doc.text(`Fecha: ${new Date(fecha).toLocaleDateString('es-ES')}`, 20, 30);

        // Encabezados de la tabla - Anchuras ajustadas para landscape
        const headers = ["Hora", "DNI", "Paciente", "Temp (°C)", "PA", "Sat O2 (%)", "FC", "Peso (kg)", "Notas", "Atendido Por"];
        const colWidths = [18, 22, 45, 15, 18, 15, 10, 15, 55, 35];
        let yPos = 40;

        // Dibujar encabezados
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        let xPos = 20;
        headers.forEach((header, index) => {
            doc.text(header, xPos, yPos);
            xPos += colWidths[index];
        });
        yPos += 7;
        doc.setFont(undefined, 'normal');

        // Dibujar filas
        triajes.forEach(t => {
            if (yPos > 190) { // Si se pasa de la página en landscape, agregar una nueva
                doc.addPage();
                yPos = 20;
                // Volver a dibujar encabezados en la nueva página
                doc.setFontSize(10);
                doc.setFont(undefined, 'bold');
                let xPosNew = 20;
                headers.forEach((header, index) => {
                    doc.text(header, xPosNew, yPos);
                    xPosNew += colWidths[index];
                });
                yPos += 7;
                doc.setFont(undefined, 'normal');
            }

            const row = [
                t.Hora || t.HORA || '-',
                t.DNI_CUI || t.dni_cui || t.DNI || '',
                t.Paciente || t.PACIENTE || '',
                t.Temperatura || t.TEMPERATURA || '-',
                t.Presion_Arterial || t.PRESION_ARTERIAL || '-',
                t.Saturacion || t.SATURACION_O2 || t.Saturacion_O2 || '-',
                t.FC || t.Frecuencia_Cardiaca || t.FRECUENCIA_CARDIACA || '-',
                t.Peso || t.PESO || '-',
                t.Notas_Observaciones || t.NOTAS_OBSERVACIONES || t.notas || '-',
                t.Atendido_Por || t.ATENDIDO_POR || '-'
            ];

            let x = 20;
            row.forEach((cell, index) => {
                const text = String(cell);
                // Truncar texto si es muy largo
                const maxChars = colWidths[index] / 2;
                const displayText = text.length > maxChars ? text.substring(0, maxChars - 2) + '...' : text;
                doc.text(displayText, x, yPos);
                x += colWidths[index];
            });
            yPos += 6;
        });

        // Guardar PDF
        const fechaFormateada = fecha.replace(/-/g, '');
        doc.save(`triajes_${fechaFormateada}.pdf`);
    } catch (e) {
        console.error("Error generando PDF de triajes:", e);
        alert("Ocurrió un error al generar el PDF.");
    }
}
window.generarPDFTriajes = generarPDFTriajes;

/**
 * BUSCAR EN VADEMECUM (Para el botón faltante)
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
        const response = await fetch(`/medicamentos/buscar/${query}`);
        const res = await response.json();
        if (response.ok && res.status === 'success') {
            const m = res.data;
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
            const response = await fetch('/diagnosticos/generar-ia', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                },
                body: JSON.stringify({
                    dni: '00000000', // DNI ficticio para vademecum
                    sintomas: `Información clínica sobre el medicamento: ${nombre}. ${promptPredeterminado}`,
                    idioma: 'es'
                })
            });

            const res = await response.json();
            const respDiv = document.getElementById('med-gemini-resp');
            if (response.ok && res.status === 'success') {
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
        const response = await fetch(`/diagnosticos/buscar-paciente/${dni}`);
        const res = await response.json();
        if (response.ok && res.status === 'success') {
            const p = res.data;
            const resolvedDni = p.DNI_CUI || p.DNI || p.dni || p.dni_cui || dni;
            const paciente = {
                ...p,
                dni: resolvedDni,
                DNI_CUI: p.DNI_CUI || resolvedDni,
                DNI: p.DNI || resolvedDni,
                dni_cui: p.dni_cui || resolvedDni,
            };
            window.diagnosticoPaciente = paciente;
            console.log('Paciente IA cargado:', paciente);
            
            const notasTriaje = paciente.Notas_Observaciones || paciente.NOTAS_OBSERVACIONES || paciente.notas || 'Ninguna';
            const msg = `✅ Paciente identificado: ${p.Paciente}\nTemperatura: ${p.Temperatura}°C | Presión Arterial: ${p.Presion_Arterial}\n` + 
                        `Notas de Triaje: ${notasTriaje}\n` +
                        `Alergias Registradas: ${p.Alergias_Cronicas || 'Ninguna'}`;
            alert(msg);
            
            if (display) {
                display.innerHTML = `<strong>Paciente identificado:</strong> ${p.Paciente}<br>` + 
                                    `<small style="color: #666;">Signos vitales cargados desde el triaje del ${p.Fecha_Hora}</small><br>` +
                                    `<span style="color: #3498db;">Notas de Triaje: ${notasTriaje}</span><br>` +
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
        const response = await fetch('/medicamentos/listar');
        const meds = await response.json();
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
        const dniPayload = window.diagnosticoPaciente.DNI_CUI || window.diagnosticoPaciente.DNI || window.diagnosticoPaciente.dni || window.diagnosticoPaciente.dni_cui || document.getElementById('diagnostico-dni')?.value.trim();
        if (!dniPayload) {
            console.error('No se encontró DNI en el paciente para la solicitud IA', window.diagnosticoPaciente);
            outputDiv.innerHTML = '<span style="color: red;">❌ Error: no se pudo obtener el DNI del paciente.</span>';
            return;
        }

        const payload = {
            dni: dniPayload,
            sintomas: sintomasText,
            idioma: idioma
        };
        console.log('Enviar solicitud IA con payload:', payload);

        const response = await fetch('/diagnosticos/generar-ia', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
            },
            body: JSON.stringify(payload)
        });

        const text = await response.text();
        let res;
        try {
            res = JSON.parse(text);
        } catch (err) {
            console.error('Respuesta no JSON de IA:', text);
            outputDiv.innerHTML = `<span style="color: red;">❌ Error del servidor: respuesta inválida.</span>`;
            return;
        }

        if (response.ok && res.status === 'success') {
            outputDiv.innerHTML = res.hipotesis.replace(/\n/g, '<br>');
        } else {
            outputDiv.innerHTML = `<span style="color: red;">❌ Error al generar diagnóstico: ${res.message || 'Servicio no disponible'}${res.debug ? ' (' + res.debug + ')' : ''}</span>`;
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
        const response = await fetch('/diagnosticos/guardar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
            },
            body: JSON.stringify(payload)
        });

        const res = await response.json();
        if (response.ok && res.status === 'success') {
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
        const response = await fetch(`/diagnosticos/historial/${dni}`);
        const res = await response.json();

        tbody.innerHTML = '';
        if (response.ok && res.status === 'success' && res.data.length > 0) {
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
        const response = await fetch(`/diagnosticos/detalle/${id}`);
        const res = await response.json();

        let recetaHtml = '';
        if (response.ok && res.status === 'success' && res.data.length > 0) {
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
        const responseConsulta = await fetch(`/diagnosticos/historial/${dni}`);
        const resConsulta = await responseConsulta.json();
        
        let sintomasTexto = '';
        let hipotesisTexto = '';
        
        if (responseConsulta.ok && resConsulta.status === 'success') {
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

async function guardarMedicamento() {
    const id = document.getElementById('med-id').value;
    const body = {
        id,
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
        const response = await fetch('/medicamentos/guardar', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content 
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (response.ok) {
            alert("✅ " + (data.message || "Inventario actualizado correctamente."));
            document.getElementById('form-medicamento')?.reset();
            document.getElementById('med-id').value = "0";
            listarMedicamentos();
        } else if (response.status === 422) {
            // Manejo de errores de validación (campos requeridos)
            const errores = Object.values(data.errors).flat().join('\n');
            alert("⚠️ Por favor complete los campos correctamente:\n\n" + errores);
        } else {
            alert("❌ Error: " + (data.message || "No se pudo guardar el medicamento."));
        }
    } catch (error) {
        console.error("Error al guardar:", error);
        alert("❌ Error de red o servidor.");
    }
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
        fc: document.getElementById('triaje-fc')?.value || document.getElementById('triaje-frecuencia')?.value,
        peso: document.getElementById('triaje-peso')?.value,
        notas: document.getElementById('triaje-notas')?.value,
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
 * CU-02: Validar Paciente para Triaje
 */
async function validarPacienteParaTriaje() {
    const dniInput = document.getElementById('triaje-dni');
    const dni = dniInput?.value.trim();
    const display = document.getElementById('paciente-seleccionado-nombre');

    if (!dni || dni.length < 8) {
        alert("Por favor, ingrese un DNI válido de 8 dígitos.");
        return;
    }

    try {
        const response = await fetch(`/pacientes/buscar/${dni}`);
        const res = await response.json();
        if (response.ok && res.status === 'success') {
            const p = res.data;
            const nombreCompleto = `${p.Nombres} ${p.Apellidos}`;
            if (display) {
                display.innerHTML = `✅ Paciente identificado: <strong>${nombreCompleto}</strong>`;
            }
            alert(`✅ Paciente encontrado: ${nombreCompleto}`);
        } else {
            alert("Error: " + (res.message || "Paciente no registrado. Por favor registre al paciente primero."));
            if (display) {
                display.innerHTML = "";
            }
        }
    } catch (error) {
        console.error("Error validando paciente para triaje:", error);
        alert("Ocurrió un error al buscar el paciente.");
    }
}
window.validarPacienteParaTriaje = validarPacienteParaTriaje;

/**
 * CU-02: Buscar Historial de Triaje
 */
async function buscarHistorialTriaje() {
    const dniInput = document.getElementById('search-triaje-dni');
    const dni = dniInput?.value.trim();
    const display = document.getElementById('historial-triaje-resultado');

    if (!dni || dni.length < 8) {
        alert("Por favor, ingrese un DNI válido de 8 dígitos.");
        return;
    }

    try {
        const response = await fetch(`/triaje/historial/${dni}`);
        const res = await response.json();
        if (response.ok && res.status === 'success') {
            const historial = res.data;
            let html = '<h3>Historial de Triajes</h3><table style="width: 100%; border-collapse: collapse; margin-top: 1rem;"><thead><tr style="background: #f1f1f1;"><th style="padding: 10px;">Fecha y Hora</th><th style="padding: 10px;">Temperatura</th><th style="padding: 10px;">Presión Arterial</th><th style="padding: 10px;">Saturación O2</th><th style="padding: 10px;">FC</th><th style="padding: 10px;">Peso</th><th style="padding: 10px;">Notas</th></tr></thead><tbody>';
            historial.forEach(t => {
                html += `<tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px;">${t.Fecha_Formateada || t.Fecha_Hora || 'N/A'}</td>
                    <td style="padding: 10px;">${t.Temperatura || 'N/A'}°C</td>
                    <td style="padding: 10px;">${t.Presion_Arterial || 'N/A'}</td>
                    <td style="padding: 10px;">${t.Saturacion_O2 || t.Saturacion || 'N/A'}%</td>
                    <td style="padding: 10px;">${t.Frecuencia_Cardiaca || t.FC || 'N/A'}</td>
                    <td style="padding: 10px;">${t.Peso || 'N/A'} kg</td>
                    <td style="padding: 10px;">${t.Notas_Observaciones || 'N/A'}</td>
                </tr>`;
            });
            html += '</tbody></table>';
            if (display) {
                display.innerHTML = html;
            }
        } else {
            if (display) {
                display.innerHTML = `<p style="color: #e74c3c;">${res.message || "No se encontró historial de triaje para este paciente."}</p>`;
            }
            alert("Error: " + (res.message || "No se encontró historial de triaje para este paciente."));
        }
    } catch (error) {
        console.error("Error buscando historial de triaje:", error);
        alert("Ocurrió un error al buscar el historial.");
    }
}
window.buscarHistorialTriaje = buscarHistorialTriaje;

/**
 * CU-08: Generar Reporte Epidemiológico (Carga y renderiza el gráfico y la tabla)
 * @param {string} period - El período de tiempo para el reporte ('dia', 'semana', 'mes', 'año').
 */
let chartPacientesInstance = null; // Para almacenar la instancia del gráfico de Chart.js

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
    //     const response = await fetch(`/api/reportes/pacientes?period=${period}`);
    //     const reportData = await response.json();
    //     labels = reportData.labels;
    //     data = reportData.data;
    //     tableData = reportData.tableData;
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
window.loadReportChart = loadReportChart;

function generateReport(period) {
    console.log(`Generando reporte para el período: ${period}`);
    loadReportChart(period); // Llama a la nueva función con el período
}
window.generateReport = generateReport;

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

    // Si la vista actual es el reporte, cargar el gráfico automáticamente
    if (window.location.pathname === '/reportes' && document.getElementById('view-reporte')) {
        loadReportChart('semana'); // Cargar por defecto la semana
    }
});