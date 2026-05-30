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
                Rol ENUM('admin', 'encargado', 'enfermero') NOT NULL DEFAULT 'enfermero',
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
                    INSERT INTO PACIENTE (ID_Paciente, DNI_CUI, Nombres, Apellidos, Fecha_Nacimiento, Sexo, Direccion, Telefono, Alergias_Cronicas, Estado)
                    VALUES (UUID(), p_DNI_CUI, p_Nombres, p_Apellidos, p_Fecha_Nacimiento, p_Sexo, p_Direccion, p_Telefono, p_Alergias_Cronicas, 1);
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
                IN p_Username VARCHAR(50),
                IN p_Password VARCHAR(255),
                IN p_Nombre_Completo VARCHAR(100),
                IN p_Rol ENUM('admin', 'encargado', 'enfermero')
            )
            BEGIN
                IF EXISTS (SELECT 1 FROM USUARIO WHERE Username = p_Username) THEN
                    UPDATE USUARIO 
                    SET Password = p_Password,
                        Nombre_Completo = p_Nombre_Completo,
                        Rol = p_Rol
                    WHERE Username = p_Username;
                ELSE
                    INSERT INTO USUARIO (ID_Usuario, Username, Password, Nombre_Completo, Rol, Estado)
                    VALUES (p_Username, p_Username, p_Password, p_Nombre_Completo, p_Rol, 1);
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
                IN p_ID_Usuario VARCHAR(50)
            )
            BEGIN
                DECLARE v_ID_Paciente CHAR(36);
                SELECT ID_Paciente INTO v_ID_Paciente FROM PACIENTE WHERE DNI_CUI = p_DNI LIMIT 1;
                
                IF v_ID_Paciente IS NOT NULL THEN
                    INSERT INTO TRIAJE (ID_Triaje, ID_Paciente, ID_Usuario, Temperatura, Presion_Arterial, Saturacion_O2, Frecuencia_Cardiaca, Peso)
                    VALUES (UUID(), v_ID_Paciente, p_ID_Usuario, p_Temp, p_Presion, p_Saturacion, p_FC, p_Peso);
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
                    CONCAT(P.Nombres, ' ', P.Apellidos) as Paciente,
                    T.Temperatura, 
                    T.Presion_Arterial, 
                    T.Saturacion_O2, 
                    T.Frecuencia_Cardiaca, 
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
                    M.ID_Medicamento, 
                    M.Nombre_Generico, 
                    M.Concentracion, 
                    COALESCE(L.Codigo_Lote, 'S/L') as Lote,
                    COALESCE(L.Cantidad_Actual, 0) as Stock,
                    L.Fecha_Vencimiento
                FROM MEDICAMENTO M
                LEFT JOIN LOTE_STOCK L ON M.ID_Medicamento = L.ID_Medicamento
                WHERE M.Estado = 1
                ORDER BY M.Nombre_Generico ASC;
            END;
            """,
            # sp_GuardarMedicamento
            "DROP PROCEDURE IF EXISTS sp_GuardarMedicamento;",
            """
            CREATE PROCEDURE sp_GuardarMedicamento(
                IN p_ID CHAR(36),
                IN p_Nombre VARCHAR(255),
                IN p_Concentracion VARCHAR(100),
                IN p_Presentacion VARCHAR(100),
                IN p_Stock_Min INT
            )
            BEGIN
                IF p_ID IS NOT NULL AND EXISTS (SELECT 1 FROM MEDICAMENTO WHERE ID_Medicamento = p_ID) THEN
                    UPDATE MEDICAMENTO 
                    SET Nombre_Generico = p_Nombre, 
                        Concentracion = p_Concentracion,
                        Presentacion = p_Presentacion,
                        Stock_Minimo = p_Stock_Min
                    WHERE ID_Medicamento = p_ID;
                ELSE
                    INSERT INTO MEDICAMENTO (ID_Medicamento, Codigo_Barras, Nombre_Generico, Nombre_Comercial, Concentracion, Presentacion, Stock_Minimo, Estado)
                    VALUES (UUID(), UUID(), p_Nombre, p_Nombre, p_Concentracion, p_Presentacion, p_Stock_Min, 1);
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
            """
        ]

        print("Instalando procedimientos almacenados en BioFarma...")
        for sql in procedimientos:
            cursor.execute(sql)
        
        conn.commit()
        print("✅ ¡Base de datos configurada correctamente!")

    except Error as e:
        print(f"❌ Error al configurar la base de datos: {e}")
    finally:
        if conn.is_connected():
            cursor.close()
            cerrar_conexion(conn)

if __name__ == "__main__":
    configurar_base_de_datos()