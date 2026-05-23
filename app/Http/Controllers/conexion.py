import mysql.connector
from mysql.connector import Error

def obtener_conexion():
    """
    Establece una conexión con la base de datos MySQL.
    Asegúrate de cambiar estos valores por tus credenciales locales.
    """
    try:
        conexion = mysql.connector.connect(
            host='localhost',
            user='root',      
            password='Samsung_852',      
            database='BioFarma'
        )

        if conexion.is_connected():
            print("Conexión exitosa a MySQL")
            return conexion

    except Error as e:
        print(f"Error al conectar a MySQL: {e}")
        return None

def cerrar_conexion(conexion):
    """Cierra la conexión de forma segura."""
    if conexion and conexion.is_connected():
        conexion.close()
        print("Conexión cerrada.")

if __name__ == "__main__":
    # Prueba de conexión
    conn = obtener_conexion()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT DATABASE();")
            db_name = cursor.fetchone()
            print(f"Confirmado: Estás conectado a la base de datos: {db_name[0]}")
        finally:
            cursor.close()
            cerrar_conexion(conn)