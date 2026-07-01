<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{ csrf-token() }">
    <title>MariFarma - Bio-Asistente Inteligente</title>
    <link rel="stylesheet" href="{{ asset('css/style.css') }}">
</head>
<body>

    <!-- Fondo dinámico tecnológico -->
    <div class="bg-visuals">
        <div class="blob"></div>
        <div class="blob"></div>
        <div class="grid-pattern"></div>
    </div>

    <div id="login-screen">
        <!-- Carrusel de fondo para Login -->
        <div class="login-carousel">
            <div class="carousel-slide"></div>
            <div class="carousel-slide"></div>
            <div class="carousel-slide"></div>
        </div>

        
        <div class="login-card">
            <div style="font-size: 3rem; margin-bottom: 10px;">🌿</div>
            <h1>MariFarma Pro</h1>
            <p style="color: #666; margin-bottom: 20px;">Sistema de Gestión Bio-Asistida</p>
            
            <input type="text" id="username" placeholder="USUARIO">
            <input type="password" id="password" placeholder="CONTRASEÑA">
            
            <div class="captcha-box">
                <span style="letter-spacing: 5px; user-select: none;">X 8 R 3 P</span>
                <input type="text" placeholder="Captcha" style="width: 80px; margin-left: 15px; margin-top: 0; padding: 5px;">
            </div>

            <button class="btn" onclick="login()">INGRESAR AL SISTEMA</button>
            
            <div class="login-footer-links">
                <a href="#">¿Olvidaste tu contraseña?</a>
                <span style="color: #ccc;">|</span>
                <a href="#">Ayuda</a>
            </div>
        </div>
    </div>
    <script src="{{ asset('js/script.js') }}"></script>
</body>
</html>