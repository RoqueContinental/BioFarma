@extends('layouts.app')

@section('content')
<section class="view active">
    <h2>Dashboard Resumen Diario</h2>
    <div class="grid">
        <div class="card">
            <h3>Pacientes Atendidos</h3>
            <p id="total-pacientes" style="font-size: 2rem;">...</p>
        </div>
        <div class="card alert">
            <h3>Alertas Médicas</h3>
            <p style="font-size: 2rem; color: var(--accent);">2</p>
        </div>
        <div class="card">
            <h3>Estado Conectividad</h3>
            <p style="color: var(--secondary);">● Online (IA Activa)</p>
        </div>
    </div>
</section>

<script>
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            const response = await fetch('/pacientes/listar');
            const data = await response.json();
            document.getElementById('total-pacientes').textContent = Array.isArray(data) ? data.length : 0;
        } catch (error) {
            console.error("Error al cargar estadísticas:", error);
            document.getElementById('total-pacientes').textContent = '0';
        }
    });
</script>
@endsection