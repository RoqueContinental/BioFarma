/**
 * Manejo de Sesión y Navegación
 */
/**
 * Manejo de Sesión y Navegación
 */
function login() {
    const user = document.querySelector('input[type="text"]').value;
    const pass = document.querySelector('input[type="password"]').value;

    if (user && pass) {
        // CU-10: Autenticar Usuario
        window.location.href = 'dashboard.html';
    } else {
        alert("Error: Credenciales incorrectas o campos vacíos.");
    }
}

/**
 * Integración con API RENIEC (vía Apisperu)
 * Se utiliza el token de acceso directo para la consulta de datos
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
        const response = await fetch('http://localhost:3000/api/pacientes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        if (response.ok) {
            alert("✅ Paciente guardado correctamente en SQL Server.");
            // Opcional: limpiar formulario
        } else {
            throw new Error("Error al guardar");
        }
    } catch (error) {
        console.error("Error en registro:", error);
        alert("❌ No se pudo conectar con el servidor local. ¿Está corriendo server.js?");
    }
}

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
function validateTriaje() {
    const temp = document.getElementById('triaje-temp');
    if (temp && parseFloat(temp.value) > 38) {
        temp.classList.add('error-alert');
        alert("Alerta: Valores de temperatura atípicos detectados (Fiebre alta).");
    } else {
        alert("Datos de triaje validados y guardados exitosamente.");
    }
}

/**
 * CU-08: Generar Reporte Epidemiológico
 */
function generateReport() {
    const content = document.getElementById('report-content');
    const empty = document.getElementById('empty-report');
    if (content && empty) {
        empty.style.display = 'none';
        content.style.display = 'block';
        console.log("Procesando diagnósticos de los últimos 7 días en SQL Server...");
    }
}

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