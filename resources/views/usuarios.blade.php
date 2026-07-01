@extends('layouts.app')

@section('content')
    <!-- MÓDULO 1: LISTA Y GESTIÓN DE USUARIOS -->
    <div id="view-usuarios" class="view active">
        <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h1>Administración de Usuarios</h1>
            <button type="button" class="btn" style="background: var(--primary);" onclick="mostrarFormularioCrear()">➕ Nuevo Usuario</button>
        </header>

        <section class="card">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="text-align: left; border-bottom: 2px solid #eee;">
                        <th style="padding: 12px;">ID</th>
                        <th style="padding: 12px;">Username</th>
                        <th style="padding: 12px;">Nombre Completo</th>
                        <th style="padding: 12px;">Rol</th>
                        <th style="padding: 12px;">Estado</th>
                        <th style="padding: 12px;">Acciones</th>
                    </tr>
                </thead>
                <tbody id="tabla-usuarios-cuerpo">
                    <!-- Cargado por AJAX -->
                </tbody>
            </table>
        </section>
    </div>

    <!-- MÓDULO 2: FORMULARIO DE CREAR/EDITAR USUARIO -->
    <div id="view-form-usuario" class="view" style="display: none;">
        <header style="margin-bottom: 1rem;">
            <button onclick="mostrarListaUsuarios()" class="btn" style="margin-bottom: 15px; background: #95a5a6;">⬅️ Volver a la Lista</button>
            <h1 id="titulo-form-usuario">Nuevo Usuario</h1>
        </header>

        <form id="form-usuario" onsubmit="event.preventDefault(); guardarUsuario();">
            @csrf
            <input type="hidden" id="es-edicion" name="es_edicion" value="0">
            <section class="card">
                <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div class="form-group">
                        <label>ID Usuario:</label>
                        <input type="text" id="usuario-id-usuario" name="id_usuario" required>
                    </div>
                    <div class="form-group">
                        <label>Username:</label>
                        <input type="text" id="usuario-username" name="username" required>
                    </div>
                </div>
                <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div class="form-group">
                        <label>Nombre Completo:</label>
                        <input type="text" id="usuario-nombre-completo" name="nombre_completo" required>
                    </div>
                    <div class="form-group">
                        <label>Rol:</label>
                        <select id="usuario-rol" name="rol" style="padding:10px; border-radius:5px; border:1px solid #ccc;" required>
                            <option value="">Seleccione</option>
                            <option value="admin">Administrador</option>
                            <option value="tecnico">Técnico</option>
                            <option value="enfermero">Enfermero</option>
                        </select>
                    </div>
                </div>
                <div class="form-group" id="grupo-password">
                    <label>Contraseña:</label>
                    <input type="password" id="usuario-password" name="password" placeholder="Ingrese contraseña">
                </div>
                <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
                    <button type="submit" class="btn" style="width: 200px;">Guardar Usuario</button>
                </div>
            </section>
        </form>
    </div>

    <style>
        .view { animation: fadeIn 0.2s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .view[style*="display: none"] { display: none !important; }
        .view:not([style*="display: none"]) { display: block !important; }
        #tabla-usuarios-cuerpo tr:hover { background: #f9f9f9; }
        #tabla-usuarios-cuerpo td { padding: 12px; border-bottom: 1px solid #eee; }
        .btn-small { transition: transform 0.1s; border: none; cursor: pointer; padding: 5px 10px; border-radius: 4px; }
        .btn-small:hover { transform: scale(1.1); }
        .btn-edit { background: #3498db; color: white; }
        .btn-disable { background: #e74c3c; color: white; }
        .btn-password { background: #2ecc71; color: white; }
    </style>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            cargarUsuarios();
        });

        function cargarUsuarios() {
            fetch('/usuarios/listar')
                .then(response => response.json())
                .then(data => {
                    const tbody = document.getElementById('tabla-usuarios-cuerpo');
                    tbody.innerHTML = '';
                    
                    // Ordenar por rol
                    const ordenRoles = ['admin', 'tecnico', 'enfermero'];
                    data.sort((a, b) => ordenRoles.indexOf(a.Rol) - ordenRoles.indexOf(b.Rol));
                    
                    data.forEach(usuario => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${usuario.ID_Usuario}</td>
                            <td>${usuario.Username}</td>
                            <td>${usuario.Nombre_Completo}</td>
                            <td><span style="padding: 3px 8px; border-radius: 4px; background: ${usuario.Rol === 'admin' ? '#e74c3c' : usuario.Rol === 'tecnico' ? '#f39c12' : '#3498db'}; color: white; font-size: 0.8em;">${usuario.Rol}</span></td>
                            <td><span style="padding: 3px 8px; border-radius: 4px; background: ${usuario.Estado === 1 ? '#2ecc71' : '#95a5a6'}; color: white; font-size: 0.8em;">${usuario.Estado === 1 ? 'Activo' : 'Deshabilitado'}</span></td>
                            <td>
                                <button class="btn-small btn-edit" onclick="editarUsuario('${usuario.ID_Usuario}')">✏️ Editar</button>
                                <button class="btn-small btn-password" onclick="cambiarPassword('${usuario.ID_Usuario}')">🔑 Contraseña</button>
                                ${usuario.Estado === 1 ? `<button class="btn-small btn-disable" onclick="deshabilitarUsuario('${usuario.ID_Usuario}')">🚫 Deshabilitar</button>` : ''}
                            </td>
                        `;
                        tbody.appendChild(tr);
                    });
                })
                .catch(error => console.error('Error:', error));
        }

        function mostrarListaUsuarios() {
            document.getElementById('view-usuarios').style.display = 'block';
            document.getElementById('view-form-usuario').style.display = 'none';
            document.getElementById('form-usuario').reset();
            document.getElementById('es-edicion').value = '0';
            // Habilitar campo ID para nuevo usuario
            document.getElementById('usuario-id-usuario').removeAttribute('readonly');
        }

        function mostrarFormularioCrear() {
            document.getElementById('titulo-form-usuario').textContent = 'Nuevo Usuario';
            document.getElementById('grupo-password').style.display = 'block';
            document.getElementById('usuario-password').setAttribute('required', 'required');
            document.getElementById('usuario-id-usuario').removeAttribute('readonly');
            document.getElementById('es-edicion').value = '0';
            document.getElementById('view-usuarios').style.display = 'none';
            document.getElementById('view-form-usuario').style.display = 'block';
        }

        function editarUsuario(id_usuario) {
            fetch('/usuarios/listar')
                .then(response => response.json())
                .then(data => {
                    const usuario = data.find(u => u.ID_Usuario === id_usuario);
                    if (usuario) {
                        document.getElementById('titulo-form-usuario').textContent = 'Editar Usuario';
                        document.getElementById('es-edicion').value = '1';
                        document.getElementById('usuario-id-usuario').value = usuario.ID_Usuario;
                        document.getElementById('usuario-id-usuario').setAttribute('readonly', 'readonly'); // ID no editable
                        document.getElementById('usuario-username').value = usuario.Username;
                        document.getElementById('usuario-nombre-completo').value = usuario.Nombre_Completo;
                        document.getElementById('usuario-rol').value = usuario.Rol;
                        document.getElementById('grupo-password').style.display = 'block';
                        document.getElementById('usuario-password').removeAttribute('required');
                        document.getElementById('usuario-password').placeholder = 'Deje vacío para mantener la contraseña actual';
                        document.getElementById('view-usuarios').style.display = 'none';
                        document.getElementById('view-form-usuario').style.display = 'block';
                    }
                });
        }

        function cambiarPassword(id_usuario) {
            const nuevaPassword = prompt('Ingrese la nueva contraseña:');
            if (nuevaPassword) {
                fetch('/usuarios/listar')
                    .then(response => response.json())
                    .then(data => {
                        const usuario = data.find(u => u.ID_Usuario === id_usuario);
                        if (usuario) {
                            fetch('/usuarios/guardar', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                                },
                                body: JSON.stringify({
                                    id_usuario: usuario.ID_Usuario,
                                    username: usuario.Username,
                                    nombre_completo: usuario.Nombre_Completo,
                                    rol: usuario.Rol,
                                    password: nuevaPassword,
                                    es_edicion: 1
                                })
                            })
                            .then(response => response.json())
                            .then(data => {
                                alert(data.message);
                                if (data.status === 'success') {
                                    cargarUsuarios();
                                }
                            });
                        }
                    });
            }
        }

        function deshabilitarUsuario(id_usuario) {
            if (confirm('¿Está seguro de deshabilitar este usuario?')) {
                fetch('/usuarios/eliminar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                    },
                    body: JSON.stringify({ id: id_usuario })
                })
                .then(response => response.json())
                .then(data => {
                    alert(data.message);
                    if (data.status === 'success') {
                        cargarUsuarios();
                    }
                });
            }
        }

        function guardarUsuario() {
            const formData = new FormData(document.getElementById('form-usuario'));
            const data = Object.fromEntries(formData.entries());
            
            // Preparamos los datos para enviar al controller
            const datos = {
                id_usuario: data.id_usuario,
                username: data.username,
                nombre_completo: data.nombre_completo,
                rol: data.rol,
                es_edicion: data.es_edicion
            };
            
            // Si hay password (para nuevo usuario o cambio de password), lo incluimos
            if (data.password) {
                datos.password = data.password;
            }
            
            fetch('/usuarios/guardar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify(datos)
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                if (data.status === 'success') {
                    mostrarListaUsuarios();
                    cargarUsuarios();
                }
            });
        }
    </script>
@endsection
