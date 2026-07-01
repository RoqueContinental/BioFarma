<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class DiagnosticoTest extends TestCase
{
    private $testDni = '99999999';
    private $testUserId = 'USR-DIAG99';
    private $testUsername = 'test_user_diagnostico';
    private $testMedId = 'M-TEST99';

    protected function setUp(): void
    {
        parent::setUp();
        DB::beginTransaction();

        // Crear datos necesarios para las pruebas
        // 1. Crear Usuario
        DB::statement('CALL sp_GuardarUsuario(?, ?, ?, ?, ?)', [
            $this->testUserId,
            $this->testUsername,
            'password_hash',
            'Test Personal Salud',
            'enfermero'
        ]);

        // 2. Crear Paciente
        DB::statement('CALL sp_GuardarPaciente(?, ?, ?, ?, ?, ?, ?, ?)', [
            $this->testDni,
            'Juan',
            'Perez Test',
            '1990-01-01',
            'M',
            'Av. Principal 123',
            '987654321',
            'Paracetamol, Aspirina'
        ]);

        // 3. Crear Medicamento
        DB::statement('CALL sp_GuardarMedicamento(?, ?, ?, ?, ?, ?, ?, ?)', [
            $this->testMedId,
            '99999999999',
            'Ibuprofeno',
            'Ibupres',
            '400 mg',
            'Tableta',
            100,
            '2028-12-31'
        ]);
        $med = DB::select("SELECT ID_Medicamento FROM MEDICAMENTO WHERE Codigo_Barras = '99999999999'")[0];
        $this->testMedId = $med->ID_Medicamento;

        // 4. Crear Triaje
        DB::statement('CALL sp_GuardarTriaje(?, ?, ?, ?, ?, ?, ?, ?)', [
            $this->testDni,
            38.5,
            '120/80',
            98.0,
            80,
            70.5,
            'Paciente sin notas',
            $this->testUserId
        ]);
    }

    protected function tearDown(): void
    {
        DB::rollBack();
        parent::tearDown();
    }

    /**
     * Test de buscar paciente con triaje reciente.
     */
    public function test_buscar_paciente_con_triaje(): void
    {
        $response = $this->get("/diagnosticos/buscar-paciente/{$this->testDni}");

        $response->assertStatus(200)
                 ->assertJson([
                     'status' => 'success'
                 ])
                 ->assertJsonStructure([
                     'data' => [
                         'ID_Triaje',
                         'Temperatura',
                         'Presion_Arterial',
                         'Paciente',
                         'Alergias_Cronicas'
                     ]
                 ]);
    }

    /**
     * Test de buscar paciente inexistente.
     */
    public function test_buscar_paciente_inexistente(): void
    {
        $response = $this->get('/diagnosticos/buscar-paciente/00000000');

        $response->assertStatus(404)
                 ->assertJson([
                     'status' => 'error',
                     'message' => 'No se encontró un triaje reciente para este paciente. Por favor complete el módulo de Triaje primero.'
                 ]);
    }

    /**
     * Test de generación de diagnóstico con IA de OpenAI (Mockeado).
     */
    public function test_generar_diagnostico_ia(): void
    {
        // Mockear llamada HTTP a Deepseek
        Http::fake([
            'api.deepseek.ai/*' => Http::response([
                'choices' => [
                    [
                        'text' => 'Diagnóstico IA: Faringitis aguda. Se sugiere descanso e hidratación.'
                    ]
                ]
            ], 200)
        ]);

        // Establecer la clave desde la configuración de servicios para la prueba
        config(['services.deepseek.key' => 'test_api_key_deepseek']);

        $response = $this->postJson('/diagnosticos/generar-ia', [
            'dni' => $this->testDni,
            'sintomas' => 'Dolor de garganta severo, fiebre y dificultad para tragar.',
            'idioma' => 'es'
        ]);

        $response->assertStatus(200)
                 ->assertJson([
                     'status' => 'success',
                     'hipotesis' => 'Diagnóstico IA: Faringitis aguda. Se sugiere descanso e hidratación.'
                 ]);
    }

    /**
     * Test de guardar diagnóstico final y receta de medicamentos.
     */
    public function test_guardar_diagnostico_y_receta(): void
    {
        // Buscar el triaje del paciente creado
        $triaje = DB::select('CALL sp_BuscarTriajeReciente(?)', [$this->testDni])[0];

        $response = $this->postJson('/diagnosticos/guardar', [
            'dni' => $this->testDni,
            'id_triaje' => $triaje->ID_Triaje,
            'sintomas' => 'Dolor de cabeza y fiebre alta.',
            'hipotesis' => 'Gripe común con fiebre.',
            'idioma' => 'es',
            'receta' => [
                [
                    'id_medicamento' => $this->testMedId,
                    'dosis' => '1 tableta cada 8 horas por 3 días',
                    'cantidad' => 10,
                    'alergia' => false
                ]
            ]
        ]);

        $response->assertStatus(200)
                 ->assertJson([
                     'status' => 'success',
                     'message' => 'Historia clínica y receta guardadas correctamente.'
                 ]);

        // Verificar descuento en stock
        $meds = DB::select('CALL sp_BuscarMedicamento(?)', [$this->testMedId]);
        $this->assertEquals(90, $meds[0]->Stock_Actual);
    }

    /**
     * Test de listar historial clínico.
     */
    public function test_listar_historial_clinico(): void
    {
        // Guardar un diagnóstico primero
        $triaje = DB::select('CALL sp_BuscarTriajeReciente(?)', [$this->testDni])[0];
        DB::statement('CALL sp_GuardarConsultaIA(?, ?, ?, ?, ?, ?, ?)', [
            'CON-TEST99',
            $this->testDni,
            $this->testUserId,
            $triaje->ID_Triaje,
            'Dolor corporal',
            'Estrés y cansancio',
            'es'
        ]);

        $response = $this->get("/diagnosticos/historial/{$this->testDni}");

        $response->assertStatus(200)
                 ->assertJson([
                     'status' => 'success'
                 ])
                 ->assertJsonStructure([
                     'data' => [
                         '*' => [
                             'ID_Consulta',
                             'Fecha_Consulta',
                             'Sintomas_Texto',
                             'Hipotesis_Diagnostica',
                             'Medico',
                             'Temperatura',
                             'Presion_Arterial'
                         ]
                     ]
                 ]);
    }
}
