<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Gestión de Pacientes - MariFarma</title>
    <link rel="stylesheet" href="{{ asset('css/style.css') }}">
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
                <li class="{{ Request::is('dashboard') ? 'active-link' : '' }}">
                    <a href="{{ url('/dashboard') }}">Dashboard</a>
                </li>

                <li class="{{ Request::is('pacientes*') ? 'active-link' : '' }}">
                    <a href="javascript:void(0)" onclick="toggleSubmenu()" style="display: flex; justify-content: space-between; align-items: center;">
                        Gestión de Pacientes <span id="arrow-pacientes" style="font-size: 0.8em;">{{ Request::is('pacientes*') ? '▲' : '▼' }}</span>
                    </a>
                    <div id="submenu-pacientes" style="display: {{ Request::is('pacientes*') ? 'flex' : 'none' }}; padding-left: 20px; flex-direction: column; gap: 5px; margin-top: 5px;">
                        <button onclick="showView('view-registro')" style="background: none; border: none; color: white; cursor: pointer; text-align: left; font-size: 0.85em; opacity: 0.7; padding: 5px 0;">• Registro de pacientes</button>
                        <button onclick="showView('view-gestion')" style="background: none; border: none; color: white; cursor: pointer; text-align: left; font-size: 0.85em; opacity: 0.7; padding: 5px 0;">• Lista y Gestión Local</button>
                    </div>
                </li>

                <li class="{{ Request::is('triaje*') ? 'active-link' : '' }}"><a href="{{ url('/triaje') }}">Triaje de Signos</a></li>
                <li class="{{ Request::is('diagnostico*') ? 'active-link' : '' }}"><a href="{{ url('/diagnostico') }}">Diagnóstico e Historial</a></li>
                <li class="{{ Request::is('vademecum*') ? 'active-link' : '' }}"><a href="{{ url('/vademecum') }}">Vademecum e Interacciones</a></li>
                <li class="{{ Request::is('reportes*') ? 'active-link' : '' }}"><a href="{{ url('/reportes') }}">Reportes Epidemiológicos</a></li>
                <li style="padding: 15px;">
                    <select onchange="setLanguage(this.value)" style="width: 100%; padding: 5px; background: #34495e; color: white; border: 1px solid #555; border-radius: 4px;">
                        <option value="es">Español</option>
                        <option value="qu">Quechua</option>
                    </select>
                </li>
                <li style="margin-top: 50px; opacity: 0.7;"><a href="{{ url('/logout') }}">Cerrar Sesión</a></li>
            </ul>
        </nav>
    </aside>
    <main>
        @yield('content')
    </main>
    <script src="{{ asset('js/script.js') }}"></script>
</body>
</html>