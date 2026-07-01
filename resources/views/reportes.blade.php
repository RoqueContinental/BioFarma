@extends('layouts.app')

@section('content')
<!-- Cargar Chart.js y jsPDF desde CDN -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>

<section id="view-reporte" class="view active">
    <div class="report-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
        <div>
            <h1 style="color: var(--primary); margin: 0;">📊 Reporte Epidemiológico</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Análisis dinámico de pacientes y consultas.</p>
        </div>
        
        <div class="filter-group" style="background: #f8f9fa; padding: 10px; border-radius: 8px; border: 1px solid #ddd; display: flex; gap: 10px; align-items: center;">
            <span style="font-weight: bold; font-size: 0.9rem;">Filtrar por:</span>
            <button class="btn-small" onclick="generateReport('dia')">Hoy</button>
            <button class="btn-small" onclick="generateReport('semana')">Semana</button>
            <button class="btn-small" onclick="generateReport('mes')">Mes</button>
            <button class="btn-small" onclick="generateReport('anio')">Año</button>
            <button class="btn" style="background: var(--primary);" onclick="downloadPDF()">📄 Descargar PDF</button>
        </div>
    </div>

    <!-- Estado inicial vacío -->
    <div id="empty-report" class="text-center" style="padding: 50px; background: #fff; border-radius: 12px; border: 2px dashed #ccc;">
        <div style="font-size: 3rem; margin-bottom: 10px;">📈</div>
        <p>Seleccione un período de tiempo para visualizar las estadísticas epidemiológicas.</p>
    </div>

    <!-- Contenido del Reporte -->
    <div id="report-content" style="display:none; transition: opacity 0.3s ease;">
        <!-- Área del Gráfico -->
        <div class="card" id="chart-container" style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-bottom: 30px;">
            <h3 style="margin-top: 0; color: #333;">Conteo de Pacientes Registrados</h3>
            <div style="height: 350px; position: relative;">
                <canvas id="chart-pacientes"></canvas>
            </div>
        </div>

        <!-- Área de la Tabla -->
        <div class="card" id="table-container" style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h3 style="margin-top: 0; color: #333;">Resumen de Consultas Médicas</h3>
            <table class="tabla-app" style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f1f1f1;">
                        <th style="text-align: left; padding: 12px;">Periodo / Fecha</th>
                        <th style="text-align: right; padding: 12px;">Total Consultas</th>
                    </tr>
                </thead>
                <tbody id="tabla-reporte-consultas-cuerpo">
                    <!-- Se llena dinámicamente -->
                </tbody>
            </table>
        </div>
    </div>
</section>

<script>
    let currentPeriod = 'semana';
    let chartPacientesInstance = null;

    // Función para descargar PDF
    async function downloadPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Título
        doc.setFontSize(18);
        doc.text('Reporte Epidemiológico - MariFarma Pro', 20, 20);
        
        // Fecha
        doc.setFontSize(10);
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 20, 30);
        
        // Capturar el gráfico como imagen
        const chartCanvas = document.getElementById('chart-pacientes');
        const chartImg = chartCanvas.toDataURL('image/png');
        doc.addImage(chartImg, 'PNG', 20, 40, 170, 100);
        
        // Capturar la tabla
        const table = document.getElementById('tabla-reporte-consultas-cuerpo');
        let y = 150;
        doc.setFontSize(12);
        doc.text('Resumen de Consultas Médicas:', 20, y);
        y += 10;
        
        // Encabezados de tabla
        doc.setFillColor(241, 241, 241);
        doc.roundedRect(20, y, 170, 10, 3, 3, 'F');
        doc.setFontSize(10);
        doc.text('Periodo / Fecha', 25, y + 7);
        doc.text('Total Consultas', 165, y + 7, { align: 'right' });
        y += 15;
        
        // Filas de la tabla
        const rows = table.querySelectorAll('tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length === 2) {
                doc.text(cells[0].innerText, 25, y);
                doc.text(cells[1].innerText, 165, y, { align: 'right' });
                y += 8;
            }
        });
        
        // Guardar
        doc.save(`reporte_${currentPeriod}_${new Date().toISOString().split('T')[0]}.pdf`);
    }

    // Función para generar reporte
    function generateReport(period) {
        currentPeriod = period;
        loadReportChart(period);
    }

    // Función para cargar gráfico
    async function loadReportChart(period = 'semana') {
        const content = document.getElementById('report-content');
        const empty = document.getElementById('empty-report');
        const chartCanvas = document.getElementById('chart-pacientes');
        const tablaCuerpo = document.getElementById('tabla-reporte-consultas-cuerpo');

        if (!content || !empty || !chartCanvas || !tablaCuerpo) {
            console.warn("Elementos del reporte no encontrados. No se puede cargar el gráfico.");
            return;
        }

        empty.style.display = 'none';
        content.style.display = 'block';

        if (chartPacientesInstance) {
            chartPacientesInstance.destroy();
        }

        try {
            const response = await fetch(`/reportes/data/${period}`);
            const reportData = await response.json();
            
            if (reportData.status !== 'success') {
                throw new Error(reportData.message || 'Error al obtener datos');
            }

            let labels = reportData.labels;
            let data = reportData.data;
            let tableData = reportData.tableData;

            if (labels.length === 0) {
                labels = ['Sin Datos'];
                data = [0];
                tableData = [{ period: 'No hay datos', total: 0 }];
            }

            const ctx = chartCanvas.getContext('2d');
            chartPacientesInstance = new Chart(ctx, {
                type: 'bar',
                data: { 
                    labels, 
                    datasets: [{ 
                        label: 'Pacientes Registrados', 
                        data, 
                        backgroundColor: 'rgba(75, 192, 192, 0.6)', 
                        borderColor: 'rgba(75, 192, 192, 1)', 
                        borderWidth: 1 
                    }] 
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    scales: { 
                        y: { 
                            beginAtZero: true, 
                            title: { 
                                display: true, 
                                text: 'Número de Pacientes' 
                            } 
                        }, 
                        x: { 
                            title: { 
                                display: true, 
                                text: 'Periodo' 
                            } 
                        } 
                    }, 
                    plugins: { 
                        legend: { 
                            display: true, 
                            position: 'top', 
                        }, 
                        tooltip: { 
                            callbacks: { 
                                label: function(context) { 
                                    return `${context.dataset.label}: ${context.raw}`; 
                                } 
                            } 
                        } 
                    } 
                }
            });

            tablaCuerpo.innerHTML = '';
            tableData.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td style="text-align: left; padding: 12px;">${item.period}</td><td style="text-align: right; padding: 12px;">${item.total}</td>`;
                tablaCuerpo.appendChild(tr);
            });
        } catch (error) {
            console.error("Error al obtener datos del reporte:", error);
            alert("No se pudieron cargar los datos del reporte.");
        }
    }

    // Cargar reporte por defecto al cargar la página
    document.addEventListener('DOMContentLoaded', () => {
        if (window.location.pathname === '/reportes') {
            loadReportChart('semana');
        }
    });
</script>
@endsection
