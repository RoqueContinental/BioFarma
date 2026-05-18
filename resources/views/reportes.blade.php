@extends('layouts.app')

@section('content')
<section class="view active">
    <h2>Módulo 8: Reportes Epidemiológicos</h2>
    <div class="form-group">
        <h3>Consolidado Semanal de Diagnósticos</h3>
        <div style="display: flex; gap: 15px; align-items: flex-end; margin-bottom: 20px;">
            <div class="field-box">
                <label>Rango de Fecha:</label>
                <input type="text" value="Últimos 7 días" readonly style="background: #f0f0f0;">
            </div>
            <button class="btn" style="width: auto;" onclick="generateReport()">Generar Reporte Estadístico</button>
        </div>

        <div id="report-content" style="display: none;">
            <div class="grid">
                <div class="card">
                    <h4>Enfermedades Comunes</h4>
                    <div class="chart-container">
                        <div class="bar-row"><span>Gripe</span><div class="bar" style="width: 80%; background: #2ecc71;"></div><span>24</span></div>
                        <div class="bar-row"><span>Infección</span><div class="bar" style="width: 45%; background: #3498db;"></div><span>12</span></div>
                        <div class="bar-row"><span>Gastritis</span><div class="bar" style="width: 30%; background: #f1c40f;"></div><span>8</span></div>
                    </div>
                </div>
                <div class="card alert">
                    <h4>Alertas de Tendencia</h4>
                    <p style="font-size: 0.9rem;">Se detecta un incremento del <strong>12%</strong> en cuadros respiratorios respecto a la semana anterior en la zona rural.</p>
                </div>
            </div>

            <div class="table-container" style="margin-top: 20px;">
                <table style="width: 100%;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th>Código CIE-10</th>
                            <th>Diagnóstico</th>
                            <th>Casos</th>
                            <th>Tendencia</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>J11.1</td><td>Influenza</td><td>24</td><td style="color: var(--accent);">↑ 12%</td></tr>
                        <tr><td>K29.7</td><td>Gastritis Aguda</td><td>15</td><td style="color: var(--secondary);">↓ 5%</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <div id="empty-report" style="text-align: center; padding: 40px; color: #999;">
            <p>Haga clic en "Generar Reporte" para consolidar los diagnósticos de SQL Server.</p>
        </div>
    </div>
</section>
@endsection