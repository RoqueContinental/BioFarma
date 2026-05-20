USE BioFarma;

-- Limpiar usuarios previos para evitar duplicados en la prueba
DELETE FROM USUARIO;

-- 1. Administrador
CALL sp_GuardarUsuario(
    'admin', 
    'admin123', 
    'Administrador del Sistema', 
    'admin'
);

-- 2. Encargado Técnico
CALL sp_GuardarUsuario(
    'tecnico01', 
    'tec123', 
    'Juan Pérez - Encargado Técnico', 
    'encargado'
);

-- 3. Enfermero
CALL sp_GuardarUsuario(
    'enfermero01', 
    'enf123', 
    'Ana Gómez - Enfermería', 
    'enfermero'
);

SELECT ID_Usuario, Username, Nombre_Completo, Rol, Estado FROM USUARIO;