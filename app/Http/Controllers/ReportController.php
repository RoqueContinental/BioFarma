<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReportController extends Controller
{
    public function getReportData($period)
    {
        try {
            // Obtener datos de pacientes según el período
            $pacientesData = [];
            $labels = [];
            $data = [];

            switch ($period) {
                case 'dia':
                    $result = DB::select('CALL sp_ReportePacientesPorDia()');
                    foreach ($result as $row) {
                        $labels[] = date('d/m', strtotime($row->fecha));
                        $data[] = $row->total;
                    }
                    break;
                case 'semana':
                    $result = DB::select('CALL sp_ReportePacientesPorSemana()');
                    foreach ($result as $row) {
                        $labels[] = 'Sem ' . substr($row->semana, -2);
                        $data[] = $row->total;
                    }
                    break;
                case 'mes':
                    $result = DB::select('CALL sp_ReportePacientesPorMes()');
                    $meses = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                    foreach ($result as $row) {
                        $mesNum = (int)substr($row->mes, -2);
                        $labels[] = $meses[$mesNum];
                        $data[] = $row->total;
                    }
                    break;
                case 'anio':
                    $result = DB::select('CALL sp_ReportePacientesPorAnio()');
                    foreach ($result as $row) {
                        $labels[] = $row->anio;
                        $data[] = $row->total;
                    }
                    break;
            }

            // Obtener datos de consultas
            $consultasData = DB::select('CALL sp_ReporteConsultasPorPeriodo(?)', [$period]);
            $tableData = [];
            foreach ($consultasData as $row) {
                $tableData[] = [
                    'period' => $row->periodo,
                    'total' => $row->total
                ];
            }

            return response()->json([
                'status' => 'success',
                'labels' => $labels,
                'data' => $data,
                'tableData' => $tableData
            ]);
        } catch (\Exception $e) {
            Log::error("Error al obtener datos del reporte: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
