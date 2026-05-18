@extends('layouts.app')

@section('content')
<div class="dashboard-container" style="padding: 30px;">
    <div class="header" style="margin-bottom: 30px;">
        <h1 style="color: #2c3e50; margin: 0;">Panel Principal</h1>
        <p style="color: #7f8c8d;">Resumen operativo del sistema BioFarma.</p>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px;">
        <div style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-left: 5px solid #3498db;">
            <h3 style="margin: 0; color: #7f8c8d; font-size: 0.9em; text-transform: uppercase;">Pacientes Activos</h3>
            <p style="font-size: 28px; font-weight: bold; color: #2c3e50; margin: 10px 0;">Consultando...</p>
            <a href="{{ url('/pacientes') }}" style="color: #3498db; text-decoration: none; font-size: 0.85em;">Gestionar lista →</a>
        </div>

        <div style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-left: 5px solid #2ecc71;">
            <h3 style="margin: 0; color: #7f8c8d; font-size: 0.9em; text-transform: uppercase;">Triajes Realizados</h3>
            <p style="font-size: 28px; font-weight: bold; color: #2c3e50; margin: 10px 0;">0</p>
            <a href="{{ url('/triaje') }}" style="color: #2ecc71; text-decoration: none; font-size: 0.85em;">Ver registros →</a>
        </div>
    </div>
</div>

<script>
    // Al cargar el dashboard, podemos disparar una petición al PacienteController
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            const response = await fetch('/pacientes/listar');
            const data = await response.json();
            const count = Array.isArray(data) ? data.length : 0;
            document.querySelector('.dashboard-container p').textContent = count;
        } catch (e) {
            console.error("Error cargando contador:", e);
        }
    });
</script>
@endsection