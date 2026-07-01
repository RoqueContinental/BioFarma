import mysql.connector
from mysql.connector import Error
import sys
import os

# Importamos la conexión desde la ubicación definida en el contexto
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(script_dir, '..', '..'))
controller_path = os.path.join(project_root, 'app', 'Http', 'Controllers')
sys.path.append(controller_path)
try:
    from conexion import obtener_conexion, cerrar_conexion
except ImportError:
    print("Error: No se encontró conexion.py en app/Http/Controllers/")
    sys.exit(1)

def configurar_base_de_datos():
    conn = obtener_conexion()
    if not conn:
        return

    try:
        cursor = conn.cursor()

        # 1. Crear el esquema de tablas si no existe
        print("Verificando integridad del esquema en BioFarma...")
        
        tablas = [
            """
            CREATE TABLE IF NOT EXISTS USUARIO (
                ID_Usuario VARCHAR(50) NOT NULL,
                Username VARCHAR(50) NOT NULL,
                Password VARCHAR(255) NOT NULL,
                Nombre_Completo VARCHAR(100) NOT NULL,
                Rol ENUM('admin', 'tecnico', 'enfermero') NOT NULL DEFAULT 'enfermero',
                Estado TINYINT(1) DEFAULT 1,
                PRIMARY KEY (ID_Usuario),
                UNIQUE (Username)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """,
            """
            CREATE TABLE IF NOT EXISTS PACIENTE (
                ID_Paciente CHAR(36) NOT NULL,
                DNI_CUI VARCHAR(20) NOT NULL,
                Nombres VARCHAR(100) NOT NULL,
                Apellidos VARCHAR(100) NOT NULL,
                Fecha_Nacimiento DATE NOT NULL,
                Sexo ENUM('M', 'F') NOT NULL,
                Direccion VARCHAR(255),
                Telefono VARCHAR(20),
                Alergias_Cronicas TEXT,
                Estado TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (ID_Paciente),
                UNIQUE (DNI_CUI)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """,
            """
            CREATE TABLE IF NOT EXISTS MEDICAMENTO (
                ID_Medicamento CHAR(36) NOT NULL,
                Codigo_Barras VARCHAR(50) NOT NULL,
                Nombre_Generico VARCHAR(255) NOT NULL,
                Nombre_Comercial VARCHAR(255),
                Concentracion VARCHAR(100) NOT NULL,
                Presentacion VARCHAR(100) NOT NULL,
                Stock_Minimo INT DEFAULT 0,
                Stock_Actual INT DEFAULT 0,
                Fecha_Vencimiento DATE,
                Estado TINYINT(1) DEFAULT 1,
                PRIMARY KEY (ID_Medicamento),
                UNIQUE (Codigo_Barras)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """,
            """
                CREATE TABLE IF NOT EXISTS TRIAJE (
                    ID_Triaje CHAR(36) NOT NULL,
                    ID_Paciente CHAR(36) NOT NULL,
                    ID_Usuario VARCHAR(50) NOT NULL,
                    Fecha_Hora DATETIME DEFAULT CURRENT_TIMESTAMP,
                    Temperatura DECIMAL(4,2),
                    Presion_Arterial VARCHAR(20),
                    Saturacion_O2 DECIMAL(5,2),
                    Frecuencia_Cardiaca INT,
                    Peso DECIMAL(6,2),
                    Notas_Observaciones TEXT,
                    PRIMARY KEY (ID_Triaje),
                    FOREIGN KEY (ID_Paciente) REFERENCES PACIENTE(ID_Paciente),
                    FOREIGN KEY (ID_Usuario) REFERENCES USUARIO(ID_Usuario)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """,
            """
            CREATE TABLE IF NOT EXISTS CONSULTA_IA (
                ID_Consulta CHAR(36) NOT NULL,
                ID_Paciente CHAR(36) NOT NULL,
                ID_Usuario VARCHAR(50) NOT NULL,
                ID_Triaje CHAR(36),
                Sintomas_Texto TEXT,
                Hipotesis_Diagnostica TEXT,
                Idioma_Uso VARCHAR(10),
                Fecha_Consulta DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (ID_Consulta),
                FOREIGN KEY (ID_Usuario) REFERENCES USUARIO(ID_Usuario),
                FOREIGN KEY (ID_Paciente) REFERENCES PACIENTE(ID_Paciente),
                FOREIGN KEY (ID_Triaje) REFERENCES TRIAJE(ID_Triaje)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """,
            """
            CREATE TABLE IF NOT EXISTS DETALLE_RECETA (
                ID_Detalle CHAR(36) NOT NULL,
                ID_Consulta CHAR(36) NOT NULL,
                ID_Medicamento CHAR(36) NOT NULL,
                Dosis_Sugerida TEXT,
                Cantidad_Entregada INT,
                Validacion_Alergia TINYINT(1),
                PRIMARY KEY (ID_Detalle),
                FOREIGN KEY (ID_Consulta) REFERENCES CONSULTA_IA(ID_Consulta),
                FOREIGN KEY (ID_Medicamento) REFERENCES MEDICAMENTO(ID_Medicamento)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """,
            """
            CREATE TABLE IF NOT EXISTS LOTE_STOCK (
                ID_Lote CHAR(36) NOT NULL,
                ID_Medicamento CHAR(36) NOT NULL,
                Codigo_Lote VARCHAR(100) NOT NULL,
                Cantidad_Actual INT DEFAULT 0,
                Fecha_Vencimiento DATE,
                Fecha_Ingreso DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (ID_Lote),
                UNIQUE (ID_Medicamento, Codigo_Lote),
                FOREIGN KEY (ID_Medicamento) REFERENCES MEDICAMENTO(ID_Medicamento)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """,
            """
            CREATE TABLE IF NOT EXISTS PARENTESCO (
                ID_Parentesco CHAR(36) NOT NULL,
                ID_Paciente_Origen CHAR(36) NOT NULL,
                ID_Paciente_Familiar CHAR(36) NOT NULL,
                Tipo_Vinculo VARCHAR(50) NOT NULL,
                PRIMARY KEY (ID_Parentesco),
                UNIQUE (ID_Paciente_Origen, ID_Paciente_Familiar),
                FOREIGN KEY (ID_Paciente_Origen) REFERENCES PACIENTE(ID_Paciente),
                FOREIGN KEY (ID_Paciente_Familiar) REFERENCES PACIENTE(ID_Paciente),
                CONSTRAINT CK_Parentesco_Distinto CHECK (ID_Paciente_Origen <> ID_Paciente_Familiar)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """,
            """
            CREATE TABLE IF NOT EXISTS sessions (
                id VARCHAR(255) NOT NULL,
                user_id BIGINT UNSIGNED NULL,
                ip_address VARCHAR(45) NULL,
                user_agent TEXT NULL,
                payload LONGTEXT NOT NULL,
                last_activity INT NOT NULL,
                PRIMARY KEY (id),
                KEY sessions_user_id_index (user_id),
                KEY sessions_last_activity_index (last_activity)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """
        ]

        for sql in tablas:
            cursor.execute(sql)

        # 2. Definición de Procedimientos Almacenados
        # Nota: En Python ejecutamos cada bloque por separado, por lo que no usamos DELIMITER //
        procedimientos = [
            # sp_GuardarPaciente (Upsert)
            "DROP PROCEDURE IF EXISTS sp_GuardarPaciente;",
            """
            CREATE PROCEDURE sp_GuardarPaciente(
                IN p_DNI_CUI VARCHAR(20),
                IN p_Nombres VARCHAR(100),
                IN p_Apellidos VARCHAR(100),
                IN p_Fecha_Nacimiento DATE,
                IN p_Sexo ENUM('M', 'F'),
                IN p_Direccion VARCHAR(255),
                IN p_Telefono VARCHAR(20),
                IN p_Alergias_Cronicas TEXT
            )
            BEGIN
                IF EXISTS (SELECT 1 FROM PACIENTE WHERE DNI_CUI = p_DNI_CUI) THEN
                    UPDATE PACIENTE
                    SET Nombres = p_Nombres,
                        Apellidos = p_Apellidos,
                        Fecha_Nacimiento = p_Fecha_Nacimiento,
                        Sexo = p_Sexo,
                        Direccion = COALESCE(p_Direccion, Direccion),
                        Telefono = COALESCE(p_Telefono, Telefono),
                        Alergias_Cronicas = COALESCE(p_Alergias_Cronicas, Alergias_Cronicas)
                    WHERE DNI_CUI = p_DNI_CUI;
                    SELECT 'Actualizado' AS Resultado;
                ELSE
                    /* Usamos el DNI como ID Plano para facilitar pruebas */
                    INSERT INTO PACIENTE (ID_Paciente, DNI_CUI, Nombres, Apellidos, Fecha_Nacimiento, Sexo, Direccion, Telefono, Alergias_Cronicas, Estado)
                    VALUES (p_DNI_CUI, p_DNI_CUI, p_Nombres, p_Apellidos, p_Fecha_Nacimiento, p_Sexo, p_Direccion, p_Telefono, p_Alergias_Cronicas, 1);
                    SELECT 'Registrado' AS Resultado;
                END IF;
            END;
            """,
            # sp_ListarPacientes
            "DROP PROCEDURE IF EXISTS sp_ListarPacientes;",
            """
            CREATE PROCEDURE sp_ListarPacientes()
            BEGIN
                SELECT ID_Paciente, DNI_CUI, Nombres, Apellidos, Fecha_Nacimiento, Sexo, Telefono, Estado
                FROM PACIENTE WHERE Estado = 1 ORDER BY Apellidos ASC;
            END;
            """,
            # sp_EliminarPaciente (Baja Lógica)
            "DROP PROCEDURE IF EXISTS sp_EliminarPaciente;",
            """
            CREATE PROCEDURE sp_EliminarPaciente(IN p_DNI_CUI VARCHAR(20))
            BEGIN
                UPDATE PACIENTE SET Estado = 0 WHERE DNI_CUI = p_DNI_CUI;
                SELECT 'Eliminado' AS Resultado;
            END;
            """,
            # sp_BuscarPacientePorDNI
            "DROP PROCEDURE IF EXISTS sp_BuscarPacientePorDNI;",
            """
            CREATE PROCEDURE sp_BuscarPacientePorDNI(IN p_DNI_CUI VARCHAR(20))
            BEGIN
                SELECT * FROM PACIENTE WHERE DNI_CUI = p_DNI_CUI;
            END;
            """,
            # sp_ValidarUsuario (Para el sistema de login)
            "DROP PROCEDURE IF EXISTS sp_ValidarUsuario;",
            """
            CREATE PROCEDURE sp_ValidarUsuario(IN p_Username VARCHAR(50))
            BEGIN
                SELECT ID_Usuario, Username, Password, Nombre_Completo, Rol, Estado
                FROM USUARIO 
                WHERE Username = p_Username AND Estado = 1;
            END;
            """,
            # sp_ListarUsuarios
            "DROP PROCEDURE IF EXISTS sp_ListarUsuarios;",
            """
            CREATE PROCEDURE sp_ListarUsuarios()
            BEGIN
                SELECT ID_Usuario, Username, Nombre_Completo, Rol, Estado
                FROM USUARIO ORDER BY Rol ASC, Nombre_Completo ASC;
            END;
            """,
            # sp_EliminarUsuario (Baja Lógica)
            "DROP PROCEDURE IF EXISTS sp_EliminarUsuario;",
            """
            CREATE PROCEDURE sp_EliminarUsuario(IN p_ID_Usuario CHAR(36))
            BEGIN
                UPDATE USUARIO SET Estado = 0 WHERE ID_Usuario = p_ID_Usuario;
                SELECT 'Usuario deshabilitado' AS Resultado;
            END;
            """,
            # sp_GuardarUsuario (Para registrar o actualizar encargados/admins)
            "DROP PROCEDURE IF EXISTS sp_GuardarUsuario;",
            """
            CREATE PROCEDURE sp_GuardarUsuario(
                IN p_ID_Usuario VARCHAR(50),
                IN p_Username VARCHAR(50),
                IN p_Password VARCHAR(255),
                IN p_Nombre_Completo VARCHAR(100),
                IN p_Rol ENUM('admin', 'tecnico', 'enfermero')
            )
            BEGIN
                IF EXISTS (SELECT 1 FROM USUARIO WHERE ID_Usuario = p_ID_Usuario) THEN
                    UPDATE USUARIO 
                    SET Username = p_Username,
                        Password = p_Password,
                        Nombre_Completo = p_Nombre_Completo,
                        Rol = p_Rol
                    WHERE ID_Usuario = p_ID_Usuario;
                ELSE
                    INSERT INTO USUARIO (ID_Usuario, Username, Password, Nombre_Completo, Rol, Estado)
                    VALUES (p_ID_Usuario, p_Username, p_Password, p_Nombre_Completo, p_Rol, 1);
                END IF;
            END;
            """,
            # sp_GuardarTriaje
            "DROP PROCEDURE IF EXISTS sp_GuardarTriaje;",
            """
            CREATE PROCEDURE sp_GuardarTriaje(
                IN p_DNI VARCHAR(20),
                IN p_Temp DECIMAL(4,2),
                IN p_Presion VARCHAR(20),
                IN p_Saturacion DECIMAL(5,2),
                IN p_FC INT,
                IN p_Peso DECIMAL(6,2),
                IN p_Notas TEXT,
                IN p_ID_Usuario VARCHAR(50)
            )
            BEGIN
                DECLARE v_ID_Paciente VARCHAR(50);
                DECLARE v_ID_Triaje VARCHAR(50);
                SELECT ID_Paciente INTO v_ID_Paciente FROM PACIENTE WHERE DNI_CUI = p_DNI LIMIT 1;
                SET v_ID_Triaje = CONCAT('TR-', p_DNI, '-', DATE_FORMAT(NOW(), '%y%m%d%H%i%s'));
                
                IF v_ID_Paciente IS NOT NULL THEN
                    INSERT INTO TRIAJE (ID_Triaje, ID_Paciente, ID_Usuario, Temperatura, Presion_Arterial, Saturacion_O2, Frecuencia_Cardiaca, Peso, Notas_Observaciones)
                    VALUES (v_ID_Triaje, v_ID_Paciente, p_ID_Usuario, p_Temp, p_Presion, p_Saturacion, p_FC, p_Peso, p_Notas);
                    SELECT 'Registrado' AS Resultado;
                ELSE
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Paciente no encontrado.';
                END IF;
            END;
            """,
            # sp_ListarTriajePorFecha
            "DROP PROCEDURE IF EXISTS sp_ListarTriajePorFecha;",
            """
            CREATE PROCEDURE sp_ListarTriajePorFecha(IN p_Fecha DATE)
            BEGIN
                SELECT 
                    T.ID_Triaje, 
                    P.DNI_CUI, 
                    CONCAT(P.Nombres, ' ', P.Apellidos) AS Paciente,
                    T.Temperatura,
                    T.Presion_Arterial, 
                    T.Saturacion_O2 AS Saturacion,
                    T.Frecuencia_Cardiaca AS FC,
                    T.Peso,
                    T.Notas_Observaciones,
                    DATE_FORMAT(T.Fecha_Hora, '%H:%i') as Hora,
                    U.Nombre_Completo as Atendido_Por
                FROM TRIAJE T
                JOIN PACIENTE P ON T.ID_Paciente = P.ID_Paciente
                JOIN USUARIO U ON T.ID_Usuario = U.ID_Usuario
                WHERE DATE(T.Fecha_Hora) = p_Fecha
                ORDER BY T.Fecha_Hora DESC;
            END;
            """,
            # sp_BuscarTriajePorDNI
            "DROP PROCEDURE IF EXISTS sp_BuscarTriajePorDNI;",
            """
            CREATE PROCEDURE sp_BuscarTriajePorDNI(IN p_DNI VARCHAR(20))
            BEGIN
                SELECT T.*, 
                       DATE_FORMAT(T.Fecha_Hora, '%d/%m/%Y %H:%i') as Fecha_Formateada,
                       U.Nombre_Completo as Personal_Salud
                FROM TRIAJE T
                JOIN PACIENTE P ON T.ID_Paciente = P.ID_Paciente
                JOIN USUARIO U ON T.ID_Usuario = U.ID_Usuario
                WHERE P.DNI_CUI = p_DNI
                ORDER BY T.Fecha_Hora DESC;
            END;
            """,
            # sp_ListarMedicamentos (Con stock consolidado)
            "DROP PROCEDURE IF EXISTS sp_ListarMedicamentos;",
            """
            CREATE PROCEDURE sp_ListarMedicamentos()
            BEGIN
                SELECT 
                    ID_Medicamento,
                    Codigo_Barras,
                    Nombre_Generico,
                    Nombre_Comercial,
                    Concentracion,
                    Presentacion,
                    Stock_Actual AS Stock,
                    Fecha_Vencimiento,
                    Estado
                FROM MEDICAMENTO
                WHERE Estado = 1
                ORDER BY Nombre_Generico ASC;
            END;
            """,
            # sp_GuardarMedicamento
            "DROP PROCEDURE IF EXISTS sp_GuardarMedicamento;",
            """
            CREATE PROCEDURE sp_GuardarMedicamento(
                IN p_ID CHAR(36),
                IN p_Codigo_Barras VARCHAR(50),
                IN p_Nombre_Generico VARCHAR(255),
                IN p_Nombre_Comercial VARCHAR(255),
                IN p_Concentracion VARCHAR(100),
                IN p_Presentacion VARCHAR(100),
                IN p_Stock_Actual INT,
                IN p_Fecha_Vence DATE
            )
            BEGIN
                IF p_ID IS NOT NULL AND p_ID <> '' AND p_ID <> '0' AND EXISTS (SELECT 1 FROM MEDICAMENTO WHERE ID_Medicamento = p_ID) THEN
                    UPDATE MEDICAMENTO 
                    SET Codigo_Barras = p_Codigo_Barras,
                        Nombre_Generico = p_Nombre_Generico, 
                        Nombre_Comercial = p_Nombre_Comercial,
                        Concentracion = p_Concentracion,
                        Presentacion = p_Presentacion,
                        Stock_Actual = p_Stock_Actual,
                        Fecha_Vencimiento = p_Fecha_Vence
                    WHERE ID_Medicamento = p_ID;
                ELSE
                    INSERT INTO MEDICAMENTO (ID_Medicamento, Codigo_Barras, Nombre_Generico, Nombre_Comercial, Concentracion, Presentacion, Stock_Minimo, Stock_Actual, Fecha_Vencimiento, Estado)
                    VALUES (CONCAT('M-', FLOOR(RAND()*899999)+100000), p_Codigo_Barras, p_Nombre_Generico, p_Nombre_Comercial, p_Concentracion, p_Presentacion, 10, p_Stock_Actual, p_Fecha_Vence, 1);
                END IF;
            END;
            """,
            # sp_EliminarMedicamento
            "DROP PROCEDURE IF EXISTS sp_EliminarMedicamento;",
            """
            CREATE PROCEDURE sp_EliminarMedicamento(IN p_ID CHAR(36))
            BEGIN
                UPDATE MEDICAMENTO SET Estado = 0 WHERE ID_Medicamento = p_ID;
                SELECT 'Medicamento desactivado' AS Resultado;
            END;
            """,
            # sp_BuscarMedicamento
            "DROP PROCEDURE IF EXISTS sp_BuscarMedicamento;",
            """
            CREATE PROCEDURE sp_BuscarMedicamento(IN p_Criterio VARCHAR(255))
            BEGIN
                SELECT * FROM MEDICAMENTO 
                WHERE ID_Medicamento = p_Criterio 
                   OR Codigo_Barras = p_Criterio 
                   OR Nombre_Generico LIKE CONCAT('%', p_Criterio, '%') 
                   OR Nombre_Comercial LIKE CONCAT('%', p_Criterio, '%')
                LIMIT 1;
            END;
            """,
            # sp_BuscarTriajeReciente
            "DROP PROCEDURE IF EXISTS sp_BuscarTriajeReciente;",
            """
            CREATE PROCEDURE sp_BuscarTriajeReciente(IN p_DNI VARCHAR(20))
            BEGIN
                SELECT T.ID_Triaje, T.Temperatura, T.Presion_Arterial, T.Saturacion_O2, T.Frecuencia_Cardiaca, T.Peso, T.Notas_Observaciones, T.Fecha_Hora,
                       P.ID_Paciente, CONCAT(P.Nombres, ' ', P.Apellidos) AS Paciente, P.Alergias_Cronicas
                FROM TRIAJE T
                JOIN PACIENTE P ON T.ID_Paciente = P.ID_Paciente
                WHERE P.DNI_CUI = p_DNI
                ORDER BY T.Fecha_Hora DESC
                LIMIT 1;
            END;
            """,
            # sp_BuscarUltimos3Triajes
            "DROP PROCEDURE IF EXISTS sp_BuscarUltimos3Triajes;",
            """
            CREATE PROCEDURE sp_BuscarUltimos3Triajes(IN p_DNI VARCHAR(20))
            BEGIN
                SELECT T.ID_Triaje, T.Temperatura, T.Presion_Arterial, T.Saturacion_O2, T.Frecuencia_Cardiaca, T.Peso, T.Notas_Observaciones,
                       DATE_FORMAT(T.Fecha_Hora, '%d/%m/%Y %H:%i') AS FechaHoraFormateada
                FROM TRIAJE T
                JOIN PACIENTE P ON T.ID_Paciente = P.ID_Paciente
                WHERE P.DNI_CUI = p_DNI
                ORDER BY T.Fecha_Hora DESC
                LIMIT 3;
            END;
            """,
            # sp_GuardarConsultaIA
            "DROP PROCEDURE IF EXISTS sp_GuardarConsultaIA;",
            """
            CREATE PROCEDURE sp_GuardarConsultaIA(
                IN p_ID_Consulta CHAR(36),
                IN p_DNI VARCHAR(20),
                IN p_ID_Usuario VARCHAR(50),
                IN p_ID_Triaje CHAR(36),
                IN p_Sintomas TEXT,
                IN p_Hipotesis TEXT,
                IN p_Idioma VARCHAR(10)
            )
            BEGIN
                DECLARE v_ID_Paciente VARCHAR(50);
                SELECT ID_Paciente INTO v_ID_Paciente FROM PACIENTE WHERE DNI_CUI = p_DNI LIMIT 1;
                
                INSERT INTO CONSULTA_IA (ID_Consulta, ID_Paciente, ID_Usuario, ID_Triaje, Sintomas_Texto, Hipotesis_Diagnostica, Idioma_Uso, Fecha_Consulta)
                VALUES (p_ID_Consulta, v_ID_Paciente, p_ID_Usuario, p_ID_Triaje, p_Sintomas, p_Hipotesis, p_Idioma, NOW());
            END;
            """,
            # sp_GuardarDetalleReceta
            "DROP PROCEDURE IF EXISTS sp_GuardarDetalleReceta;",
            """
            CREATE PROCEDURE sp_GuardarDetalleReceta(
                IN p_ID_Consulta CHAR(36),
                IN p_ID_Medicamento CHAR(36),
                IN p_Dosis TEXT,
                IN p_Cantidad INT,
                IN p_Alergia TINYINT(1)
            )
            BEGIN
                DECLARE v_ID_Detalle VARCHAR(50);
                SET v_ID_Detalle = CONCAT('DET-', FLOOR(RAND()*899999)+100000);
                
                INSERT INTO DETALLE_RECETA (ID_Detalle, ID_Consulta, ID_Medicamento, Dosis_Sugerida, Cantidad_Entregada, Validacion_Alergia)
                VALUES (v_ID_Detalle, p_ID_Consulta, p_ID_Medicamento, p_Dosis, p_Cantidad, p_Alergia);
                
                -- Actualizar stock del medicamento
                UPDATE MEDICAMENTO 
                SET Stock_Actual = GREATEST(0, Stock_Actual - p_Cantidad)
                WHERE ID_Medicamento = p_ID_Medicamento;
            END;
            """,
            # sp_ListarHistorialClinico
            "DROP PROCEDURE IF EXISTS sp_ListarHistorialClinico;",
            """
            CREATE PROCEDURE sp_ListarHistorialClinico(IN p_DNI VARCHAR(20))
            BEGIN
                SELECT C.ID_Consulta, C.Fecha_Consulta, C.Sintomas_Texto, C.Hipotesis_Diagnostica, C.Idioma_Uso,
                       CONCAT(P.Nombres, ' ', P.Apellidos) AS Paciente, P.DNI_CUI AS DNI,
                       U.Nombre_Completo AS Medico,
                       T.Temperatura, T.Presion_Arterial
                FROM CONSULTA_IA C
                JOIN PACIENTE P ON C.ID_Paciente = P.ID_Paciente
                JOIN USUARIO U ON C.ID_Usuario = U.ID_Usuario
                LEFT JOIN TRIAJE T ON C.ID_Triaje = T.ID_Triaje
                WHERE P.DNI_CUI = p_DNI
                ORDER BY C.Fecha_Consulta DESC;
            END;
            """,
            # sp_ObtenerDetalleHistorial
            "DROP PROCEDURE IF EXISTS sp_ObtenerDetalleHistorial;",
            """
            CREATE PROCEDURE sp_ObtenerDetalleHistorial(IN p_ID_Consulta CHAR(36))
            BEGIN
                SELECT D.ID_Detalle, D.Dosis_Sugerida, D.Cantidad_Entregada, D.Validacion_Alergia,
                       M.Nombre_Generico, M.Nombre_Comercial, M.Concentracion, M.Presentacion
                FROM DETALLE_RECETA D
                JOIN MEDICAMENTO M ON D.ID_Medicamento = M.ID_Medicamento
                WHERE D.ID_Consulta = p_ID_Consulta;
            END;
            """,
            
            # sp_ReportePacientesPorDia
            "DROP PROCEDURE IF EXISTS sp_ReportePacientesPorDia;",
            """
            CREATE PROCEDURE sp_ReportePacientesPorDia()
            BEGIN
                SELECT 
                    DATE(created_at) AS fecha,
                    COUNT(*) AS total
                FROM PACIENTE
                WHERE Estado = 1
                GROUP BY DATE(created_at)
                ORDER BY fecha ASC
                LIMIT 7;
            END;
            """,
            
            # sp_ReportePacientesPorSemana
            "DROP PROCEDURE IF EXISTS sp_ReportePacientesPorSemana;",
            """
            CREATE PROCEDURE sp_ReportePacientesPorSemana()
            BEGIN
                SELECT 
                    YEARWEEK(created_at, 1) AS semana,
                    COUNT(*) AS total
                FROM PACIENTE
                WHERE Estado = 1
                GROUP BY YEARWEEK(created_at, 1)
                ORDER BY semana ASC
                LIMIT 8;
            END;
            """,
            
            # sp_ReportePacientesPorMes
            "DROP PROCEDURE IF EXISTS sp_ReportePacientesPorMes;",
            """
            CREATE PROCEDURE sp_ReportePacientesPorMes()
            BEGIN
                SELECT 
                    DATE_FORMAT(created_at, '%Y-%m') AS mes,
                    COUNT(*) AS total
                FROM PACIENTE
                WHERE Estado = 1
                GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                ORDER BY mes ASC
                LIMIT 12;
            END;
            """,
            
            # sp_ReportePacientesPorAnio
            "DROP PROCEDURE IF EXISTS sp_ReportePacientesPorAnio;",
            """
            CREATE PROCEDURE sp_ReportePacientesPorAnio()
            BEGIN
                SELECT 
                    YEAR(created_at) AS anio,
                    COUNT(*) AS total
                FROM PACIENTE
                WHERE Estado = 1
                GROUP BY YEAR(created_at)
                ORDER BY anio ASC
                LIMIT 5;
            END;
            """,
            
            # sp_ReporteConsultasPorPeriodo
            "DROP PROCEDURE IF EXISTS sp_ReporteConsultasPorPeriodo;",
            """
            CREATE PROCEDURE sp_ReporteConsultasPorPeriodo(IN p_periodo VARCHAR(10))
            BEGIN
                IF p_periodo = 'dia' THEN
                    SELECT 'Hoy' AS periodo, COUNT(*) AS total
                    FROM CONSULTA_IA
                    WHERE DATE(Fecha_Consulta) = CURDATE();
                ELSEIF p_periodo = 'semana' THEN
                    SELECT 
                        CASE 
                            WHEN DATE(Fecha_Consulta) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 'Esta Semana'
                            ELSE 'Semana Anterior'
                        END AS periodo,
                        COUNT(*) AS total
                    FROM CONSULTA_IA
                    WHERE DATE(Fecha_Consulta) >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
                    GROUP BY periodo;
                ELSEIF p_periodo = 'mes' THEN
                    SELECT 
                        CASE 
                            WHEN MONTH(Fecha_Consulta) = MONTH(CURDATE()) AND YEAR(Fecha_Consulta) = YEAR(CURDATE()) THEN 'Este Mes'
                            ELSE 'Mes Anterior'
                        END AS periodo,
                        COUNT(*) AS total
                    FROM CONSULTA_IA
                    WHERE Fecha_Consulta >= DATE_SUB(CURDATE(), INTERVAL 2 MONTH)
                    GROUP BY periodo;
                ELSEIF p_periodo = 'anio' THEN
                    SELECT 
                        CASE 
                            WHEN YEAR(Fecha_Consulta) = YEAR(CURDATE()) THEN 'Este Año'
                            ELSE 'Año Anterior'
                        END AS periodo,
                        COUNT(*) AS total
                    FROM CONSULTA_IA
                    WHERE Fecha_Consulta >= DATE_SUB(CURDATE(), INTERVAL 2 YEAR)
                    GROUP BY periodo;
                END IF;
            END;
            """
        ]

        print("Instalando procedimientos almacenados en BioFarma...")
        for sql in procedimientos:
            cursor.execute(sql)
        
        conn.commit()
        print("Success: Base de datos configurada correctamente!")

    except Error as e:
        print(f"Error: Error al configurar la base de datos: {e}")
    finally:
        if conn.is_connected():
            cursor.close()
            cerrar_conexion(conn)

if __name__ == "__main__":
    configurar_base_de_datos()