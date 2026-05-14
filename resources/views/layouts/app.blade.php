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
                <li><a href="{{ url('/dashboard') }}">Dashboard</a></li>
                <li class="active-link"><a href="{{ url('/pacientes') }}">Gestión de Pacientes</a></li>
                <li><a href="{{ url('/triaje') }}">Triaje de Signos</a></li>
                <li><a href="{{ url('/diagnostico') }}">Diagnóstico e Historial</a></li>
                <li><a href="{{ url('/vademecum') }}">Vademecum e Interacciones</a></li>
                <li><a href="{{ url('/reportes') }}">Reportes Epidemiológicos</a></li>
                <li style="padding: 15px;"><select onchange="setLanguage(this.value)"><option>Español</option><option>Quechua</option></select></li>
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