const express = require('express');
const db = require('./models');
const app = express();
// Rutas de la API
const api_path = '/api/v1';
const api_config = require('./config/api.config');
// Controladores de la API
const api_controllers = require('./controllers/api');

app.use(express.json());

/* /espacios

    tags:
        - espacios
    summary: Devuelve los espacios gestionados
    description: Devuelve una lista de espacios
    operationId: getEspacios
    responses:
        '200':
            $ref: '#/components/responses/ListaEspacios'
    security:
        - ApiKeyAuth: []
*/
app.get(api_path + '/espacios', async (req, res) => await api_controllers.espacio.getEspacios(req, res, db));

/* /espacios/{idEspacio}
 
    tags:
        - espacios
    summary: Devuelve los detalles de un espacio
    description: Devuelve un espacio
    operationId: getEspacioById
    parameters:
        - $ref: '#/components/parameters/idEspacio'
    responses:
        '200':
            $ref: '#/components/responses/Espacio'
    security:
        - ApiKeyAuth: []
*/
app.get(api_path + '/espacios/:idEspacio', async (req, res) => await api_controllers.espacio.getEspacioById(req, res, db));

/* /espacios/usuarios/{idUsuario}

        tags:
        - usuarios
    summary: Devuelve cierta información de cierto usuario por su id
    description: Dada una opción, devuelve información relacionada a esta opción del usuario con id = {idUsuario}
    operationId: getEspaciosOfUsuario
    parameters:
        - $ref: '#/components/parameters/idUsuario'
    requestBody:
        $ref: '#/components/requestBodies/InfoUsuario'
    responses:
        '200':
            $ref: '#/components/responses/UsuarioInfoData'
        '400':
            description: Id suministrado no válido
        '404':
            description: Usuario no encontrado
        '422':
            description: Datos no válidos
*/
app.post(api_path + '/espacios/usuarios/:idUsuario', async (req, res) => await api_controllers.espacio.getEspaciosOfUsuario(req, res, db));

/* /dispositivos

    tags:
        - dispositivos
    summary: Devuelve los dispositivos gestionados
    description: Devuelve una lista de dispositivos
    operationId: getDispositivos
    responses:
        '200':
            $ref: '#/components/responses/ListaDispositivos'
    security:
        - ApiKeyAuth: []
*/
app.get(api_path + '/dispositivos', async (req, res) => await api_controllers.dispositivo.getDispositivos(req, res, db));

/* /dispositivos

    tags:
        - dispositivos
    summary: Añade un nuevo dispositivo
    description: Añade una nuevo dispositivo al sistema
    operationId: creaDispositivo
    requestBody:
        $ref : '#/components/requestBodies/DispositivoNuevo'
    responses:
        '200':
            $ref: '#/components/responses/Dispositivo'
        '422':
            description: Datos no válidos
    security:
        - ApiKeyAuth: []
*/
app.post(api_path + '/dispositivos', async (req, res) => await api_controllers.dispositivo.creaDispositivo(req, res, db, api_config, api_path));

/* /dispositivos/{idDispositivo}

    tags:
        - dispositivos
    summary: Busca un dispositivo por su id
    description: Devuelve un dispositivo
    operationId: getDispositivoById
    parameters:
        - $ref: '#/components/parameters/idDispositivo'
    responses:
        '200':
            $ref: '#/components/responses/Dispositivo'
        '400':
            description: Id suministrado no válido
        '404':
            description: Dispositivo no encontrado
    security:
        - ApiKeyAuth: []
*/
app.get(api_path + '/dispositivos/:idDispositivo', async (req, res) => await api_controllers.dispositivo.getDispositivoById(req, res, db));

/* /dispositivos/{idDispositivo}

    tags:
        - dispositivos
    summary: Borra un dispositivo
    description: Borr un dispositivo
    operationId: deleteDispositivo
    parameters:
        - $ref: '#/components/parameters/idDispositivo'
    responses:
        '204':
            description: Operación exitosa
        '400':
            description: Id suministrado no válido
        '404':
            description: Dispositivo no encontrado
    security:
        - ApiKeyAuth: []
*/
app.delete(api_path + '/dispositivos/:idDispositivo', async (req, res) => await api_controllers.dispositivo.deleteDispositivo(req, res, db));

/* /ping

    tags:
        - dispositivos
    summary: Devuelve la hora
    description: Devuelve la hora actual al dispositivo
    operationId: getLocalTime
    responses:
        '200':
            $ref: '#/components/responses/TimestampActual'
*/
app.get(api_path + '/ping', async (req, res) => await api_controllers.dispositivo.getLocalTime(req, res, db));

/* /seguimiento

    tags:
        - seguimiento
    summary: Registra una asistencia en un espacio
    description: Registra una asistencia en un espacio
    operationId: registroAsistencia
    requestBody:
        $ref : '#/components/requestBodies/SeguimientoNuevo'
    responses:
        '200':
            $ref: '#/components/responses/ResultadoSeguimiento'
        '422':
            description: Datos no válidos
    security:
        - ApiKeyAuth: []
*/
app.post(api_path + '/seguimiento', async (req, res) => await api_controllers.seguimiento.registroAsistencia(req, res, db));


app.post(api_path + '/seguimiento/asistencias', async (req, res) => await api_controllers.seguimiento.getAsistencias(req, res, db));

/* /ble

    tags:
        - seguimiento
    summary: Devuelve una lista de MACs de dispositivos BLE
    description: Develve la lista de MACs de dispositivos BLE para las actividades docentes a llevar a cabo en un espacio en una ventana de tiempo.
    operationId: getMacsBLE
    parameters:
        - in: query
            name: espacioId
            schema:
                type: integer
                format: int64
            required: true
            description: Id del espacio para filtrar la búsqueda
        - in: query
            name: comienzo
            schema:
                type: string
                format: date-time
            required: false
            description: Fecha y hora de comienzo para la la búsqueda. Si no se especifica, la ventana el comienzo serán 30 minutos antes de la hora actual del servidor al recibir la petición.
        - in: query
            name: fin
            schema:
                type: string
                format: date-time
            required: false
            description: Fecha y hora de fin para la la búsqueda. Si no se especifica, la ventana el comienzo serán 30 minutos después de la hora actual del servidor al recibir la petición.
    responses:
        '200':
            $ref: '#/components/responses/ListaMACsUsuarios'
        '400':
            description: Id suministrado no válido
        '404':
            description: Espacio no encontrado
        '422':
            description: Datos no válidos
    security:
        - ApiKeyAuth: []
*/
app.get(api_path + '/ble', async (req, res) => await api_controllers.seguimiento.getMacsBLE(req, res, db));

/* /login

    tags:
        - usuarios
    summary: Devuelve los parámetros de un usuario
    description: Dados un email y una contraseña válidas y en base de datos, devuelve los parámetros del usuario asociado
    operationId: authenticateUser
    requestBody:
            $ref : '#/components/requestBodies/LoginUsuario'
    responses:
        '200':
            $ref: '#/components/responses/UsuarioData'
        '422':
            description: Datos no válidos
    security:
        - ApiKeyAuth: []
    */
app.post(api_path + '/login', async (req, res) => await api_controllers.usuario.authenticateUser(req, res, db));

/* /actividades/usuarios/:idUsuario
 
    tags:
        - actividades
        - usuarios
    summary: Devuelve una lista de las actividades de un usuario por su id
    description: Devuelve una lista de las actividades del usuario con id = {idUsuario}.
    operationId: getActividadesOfUsuario
    parameters:
        - $ref: '#/components/parameters/idUsuario'
    responses:
        '200':
          $ref: '#/components/responses/ActividadUsuarioInfoData'
        '400':
          description: Id suministrado no válido
        '404':
          description: Usuario no encontrado
    */
app.get(api_path + '/actividades/usuarios/:idUsuario', async (req, res) => await api_controllers.actividad.getActividadesOfUsuario(req, res, db));

/* /actividades/:idActividad

    tags:
        - actividades
    summary: Devuelve información sobre una actividad por su id
    description: Devuelve un json con parámetros informativos de la actividad con id = {idActividad}ç
    operationId: getActividadById
    parameters:
        - $ref: '#/components/parameters/idActividad'
    responses:
        '200':
          $ref: '#/components/responses/Actividad'
        '400':
          description: Id suministrado no válido
        '404':
          description: Actividad no encontrada
    */
app.get(api_path + '/actividades/:idActividad', async (req, res) => await api_controllers.actividad.getActividadById(req, res, db));

/* /actividades/espacios/:idEspacio

    tags:
        - actividades
        - espacios
    summary: Devuelve una lista de las actividades de un espacio por su id
    description: Devuelve una lista de las actividades del usuario con id = {idEspacio}.
    operationId: getActividadesOfEspacio
    parameters:
        - $ref: '#/components/parameters/idEspacio'
    responses:
        '200':
          $ref: '#/components/responses/ActividadEspacioInfoData'
        '400':
          description: Id suministrado no válido
        '404':
          description: Espacio no encontrado
*/
app.get(api_path + '/actividades/espacios/:idEspacio', async (req, res) => await api_controllers.actividad.getActividadesOfEspacio(req, res, db));

/* /clases/:idClase

    tags:
        - clases
    summary: Devuelve información sobre una clase por su id
    description: Devuelve la asignatura y el grupo al que hace referencia la clase con id = {idClase}
    operationId: getClaseById
    parameters:
        - $ref: '#/components/parameters/idClase'
    responses:
        '200':
          $ref: '#/components/responses/ClaseData'
        '400':
          description: Id suministrado no válido
        '404':
          description: Clase no encontrada      
*/
app.get(api_path + '/clases/:idClase', async (req, res) => api_controllers.clase.getClaseById(req, res, db));

/* /asignaturas/:idAsignatura

    tags:
        - asignaturas
    summary: Devuelve información de una asignatura por su id
    description: Devuelve información de la asignatura con id = {idAsignatura}
    operationId: getAsignaturaById
    parameters:
        - $ref: '#/components/parameters/idAsignatura'
    responses:
        '200':
          $ref: '#/components/responses/AsignaturaData'
        '400':
          description: Id suministrado no válido
        '404':
          description: Asignatura no encontrada      
*/
app.get(api_path + '/asignaturas/:idAsignatura',  async (req, res) => api_controllers.asignatura.getAsignaturaById(req, res, db));

/* /grupos/:idGrupo

    tags:
        - grupos
    summary: Devuelve información de un grupo por su id
    description: Devuelve información del grupo con id = {idAsignatura}
    operationId: getGrupoById
    parameters:
        - $ref: '#/components/parameters/idGrupo'
    responses:
        '200':
            $ref: '#/components/responses/GrupoData'
        '400':
            description: Id suministrado no válido
        '404':
            description: Grupo no encontrado      
*/
app.get(api_path + '/grupos/:idGrupo', async (req, res) => api_controllers.grupo.getGrupoById(req, res, db));

app.listen(api_config.port, () => {
    console.log(`Api listening on port ${api_config.port}`)
});