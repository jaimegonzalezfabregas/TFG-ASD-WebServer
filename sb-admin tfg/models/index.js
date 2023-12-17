//Archivo para hacer un único require y obtener todos los requires siguientes en esta carpeta

module.exports = {
    Docente: require('./docente.js'),
    Actividad: require('./actividad.js'),
    Espacio: require('./espacio.js'),
    Asignatura: require('./asignatura.js'),
    Grupo: require('./grupo.js'),
    Plan: require('./plan.js'),
    Titulacion: require('./titulacion.js'),
    Asistencia: require('./asistencia.js'),
    Excepcion: require('./excepcion.js'),
    Recurrencia: require('./recurrencia.js'),
    Relaciones: require('./relaciones_db.js'),
    Rel_Dispositivos: require('./relaciones_dispositivos.js'),
    Dispositivo: require('./dispositivo.js')
}