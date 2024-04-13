const express = require('express');
const db = require('./models');
const app = express();
// Rutas de la API
const api_config = require('./config/api.config');

// Controladores de la API
const api_controllers = require('./controllers/api');

const logger = require('./config/logger.config').child({"process": "api"});

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
app.get(api_config.path + '/espacios', authenticateClient, async (req, res) => await api_controllers.espacio.getEspacios(req, res, db));

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
app.get(api_config.path + '/espacios/:idEspacio', authenticateClient, async (req, res) => await api_controllers.espacio.getEspacioById(req, res, db));

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
app.post(api_config.path + '/espacios/usuarios/:idUsuario', authenticateClient, async (req, res) => await api_controllers.espacio.getEspaciosOfUsuario(req, res, db));

/* /espacios/actividades/{idActividad}
      tags:
        - espacios
        - actividades
      summary: Devuelve una lista de los espacios asociados a una actividad
      description: Devuelve una lista de espacios relacionados a la actividad con id = {idActividad}
      operationId: getEspaciosOfActividad
      parameters:
        - $ref: '#/components/parameters/idActividad'
      responses:
        '200':
          $ref: '#/components/responses/EspacioListaData'
        '400':
          description: Id suministrado no válido
        '404':
          description: Actividad no encontrada
*/
app.get(api_config.path + '/espacios/actividades/:idActividad', authenticateClient, async (req, res) => await api_controllers.espacio.getEspacioOfActividad(req, res, db));

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
app.get(api_config.path + '/dispositivos', authenticateClient, async (req, res) => await api_controllers.dispositivo.getDispositivos(req, res, db));

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
app.post(api_config.path + '/dispositivos', authenticateClient, async (req, res) => await api_controllers.dispositivo.creaDispositivo(req, res, db, api_config));

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
app.get(api_config.path + '/dispositivos/:idDispositivo', authenticateClient, async (req, res) => await api_controllers.dispositivo.getDispositivoById(req, res, db));

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
app.delete(api_config.path + '/dispositivos/:idDispositivo', authenticateClient, async (req, res) => await api_controllers.dispositivo.deleteDispositivo(req, res, db));

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
app.get(api_config.path + '/ping', authenticateClient, async (req, res) => await api_controllers.dispositivo.getLocalTime(req, res, db));

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
app.post(api_config.path + '/seguimiento', authenticateClient, async (req, res) => await api_controllers.seguimiento.registroAsistencia(req, res, db));

/* /seguimiento/asistencias
    tags:
        - seguimiento
      summary: Devuelve las asistencias del día
      description: Devuelve una lista de asistencias con sus estados y motivos
      operationId: getAsistencias
      requestBody:
        $ref : '#/components/requestBodies/FiltroAsistencia'
      responses:
        '200':
          $ref: '#/components/responses/Asistencia'
*/
app.post(api_config.path + '/seguimiento/asistencias', authenticateClient, async (req, res) => await api_controllers.seguimiento.getAsistencias(req, res, db));

/* /seguimiento/asistencias/{idAsistencia}
    tags:
        - seguimiento
      summary: Devuelve la información asociada a una asistencia
      description: Devuelve la información asociada a la asistencia con id = {idAsistencia}
      operationId: getAsistenciaById
      parameters:
        - $ref: '#/components/parameters/idAsistencia'
      responses:
        '200':
          $ref: '#/components/responses/Asistencia'
        '400':
          description: Id suministrado no válido
        '404':
          description: Asistencia no encontrada
*/
app.get(api_config.path + '/seguimiento/asistencias/:idAsistencia', authenticateClient, async (req, res) => await api_controllers.seguimiento.getAsistenciaById(req, res, db));

/* /seguimiento/asistencias/{idAsistencia}
    tags:
        - seguimiento
      summary: Modifica la información asociada a una asistencia
      description: Devuelve la información modificada asociada a la asistencia con id = {idAsistencia}
      operationId: updateAsistenciaById
      parameters:
        - $ref: '#/components/parameters/idAsistencia'
      responses:
        '200':
          $ref: '#/components/responses/Asistencia'
        '400':
          description: Id suministrado no válido
        '404':
          description: Asistencia no encontrada
*/
app.post(api_config.path + '/seguimiento/asistencias/:idAsistencia', authenticateClient, async (req, res) => await api_controllers.seguimiento.updateAsistenciaById(req, res, db));

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
app.post(api_config.path + '/ble', authenticateClient, async (req, res) => await api_controllers.seguimiento.getMacsBLE(req, res, db));

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
app.post(api_config.path + '/login', authenticateClient, async (req, res) => await api_controllers.usuario.authenticateUser(req, res, db));

/*  /usuarios
      tags:
        - usuarios
      summary: Devuelve una lista de usuarios
      description: Devuelve la lista de los usuarios de la base de datos
      operationId: getUsuarios
      responses:
        '200':
          $ref: '#/components/responses/ListaUsuarios'
*/
app.get(api_config.path + '/usuarios', authenticateClient, async (req, res) => await api_controllers.usuario.getUsuarios(req, res, db));

/* /usuarios
      tags:
        - usuarios
      summary: Crea un usuario en la base de datos
      description: Dados los datos de un usuario, y el usuario que intenta crear a dicho usuario, crea a un usuario en la base de datos.
      operationId: createUser
      requestBody:
        $ref: '#/components/requestBodies/CreateUsuario'
      responses:
        '201':
          description: Usuario creado con éxito
        '404':
          description: Usuario creador no válido
        '409':
          description: Usuario ya creado
        '422':
          description: Datos no válidos
*/
app.post(api_config.path + '/usuarios', authenticateClient, async (req, res) => await api_controllers.usuario.createUser(req, res, db));

/* /usuarios/:idUsuario

    tags:
      - usuarios
    summary: Devuelve los datos de un usuario por su id
    description: Devuelve los datos del usuario con id = {idUsuario}
    operationId: getUsuarioById
    parameters:
      - $ref: '#/components/parameters/idUsuario'
    responses:
      '200':
        $ref: '#/components/responses/Usuario'
      '400':
        description: Id suministrado no válido
      '404':
        description: Usuario no encontrado
*/
app.get(api_config.path + '/usuarios/:idUsuario', authenticateClient, async (req, res) => await api_controllers.usuario.getUsuarioById(req, res, db));

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
app.get(api_config.path + '/actividades/usuarios/:idUsuario', authenticateClient, async (req, res) => await api_controllers.actividad.getActividadesOfUsuario(req, res, db));

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
app.get(api_config.path + '/actividades/:idActividad', authenticateClient, async (req, res) => await api_controllers.actividad.getActividadById(req, res, db));

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
app.get(api_config.path + '/actividades/espacios/:idEspacio', authenticateClient, async (req, res) => await api_controllers.actividad.getActividadesOfEspacio(req, res, db));

/* /actividades/clases/:idClase
    tags:
        - actividades
        - clases
      summary: Devuelve una lista de actividades de una clase por su id
      description: Devuelve una lista de las actividades de la clase con id = {idClase}.  
      operationId: getActividadesOfClase
      parameters:
        - $ref: '#/components/parameters/idClase'
      responses:
        '200':
          $ref: '#/components/responses/ActividadListaData'
        '400':
          description: Id suministrado no válido
        '404':
          description: Clase no encontrada
*/
app.get(api_config.path + '/actividades/clases/:idClase', authenticateClient, async (req, res) => await api_controllers.actividad.getActividadesOfClase(req, res, db));

/* /excepciones
    tags:
        - excepciones
      summary: Crea una nueva excepción en la base de datos
      description: Dados los parámetros, genera una excepción para una actividad en la base de datos
      operationId: createExcepcion
      requestBody:
        $ref: '#/components/requestBodies/CreateExcepcion'
      responses:
        '200':
          description: Excepción creada con éxito
        '400':
          description: Id suministrado no válido
        '404':
          description: Actividad no encontrada
*/
app.post(api_config.path + '/excepciones', authenticateClient, async (req, res) => await api_controllers.excepcion.createExcepcion(req, res, db));

/* /excepciones/{idExcepcion}:

      tags:
        - excepciones
      summary: Devuelve información de una excepción por su id
      description: Devuelve información sobre la excepción con id = {idExcepcion}
      operationId: getExcepcionById
      parameters:
        - $ref: '#/components/parameters/idExcepcion'
      responses:
        '200':
          $ref: '#/components/responses/ExcepcionData'
        '400':
          description: Id suministrado no válido
        '404':
          description: Excepción no encontrada
*/
app.get(api_config.path + '/excepciones/:idExcepcion', authenticateClient, async (req, res) => api_controllers.excepcion.getExcepcionById(req, res, db));

/* /excepciones/actividades/{idActividad}:

      tags:
        - excepciones
        - actividades
      summary: Devuelve una lista de excepciones de una actividad por su id
      description: Devuelve la lista de excepciones asociadas a la actividad con id = {idActividad}
      operationId: getExcepcionesOfActividad
      parameters:
        - $ref: '#/components/parameters/idActividad'
      responses:
        '200':
          $ref: '#/components/responses/ExcepcionListaData'
        '400':
          description: Id suministrado no válido
        '404':
          description: Actividad no encontrada
*/
app.get(api_config.path + '/excepciones/actividades/:idActividad', authenticateClient, async (req, res) => api_controllers.excepcion.getExcepcionesOfActividad(req, res, db));

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
app.get(api_config.path + '/clases/:idClase', authenticateClient, async (req, res) => api_controllers.clase.getClaseById(req, res, db));

/* /clases/compose
    tags:
        - clases
        - asignaturas
        - grupos
      summary: Devuelve el id de la clase asociada a una asignatura y un grupo
      description: Devuelve la clase a la que hacen referencia una tupla (idAsignatura, idGrupo)
      operationId: getClaseByAsignaturaGrupo
      requestBody:
        $ref: '#/components/requestBodies/ComposeClase'
      responses:
        '200':
          $ref: '#/components/responses/ClaseId'
        '400':
          description: Id suministrado no válido
        '404':
          description: Clase no encontrada
*/
app.post(api_config.path + '/clases/compose', authenticateClient, async (req, res) => api_controllers.clase.getClaseOfAsignaturaGrupo(req, res, db));

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
app.get(api_config.path + '/asignaturas/:idAsignatura',  authenticateClient, async (req, res) => api_controllers.asignatura.getAsignaturaById(req, res, db));

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
app.get(api_config.path + '/grupos/:idGrupo', authenticateClient, async (req, res) => api_controllers.grupo.getGrupoById(req, res, db));

/* /grupos/compose
    tags:
        - grupos
      summary: Devulve el id del grupo asociado a un curso y una letra
      description: Devuelve el grupo al que hacen referencia una tupla (curso, letra)
      operationId: getGrupoByCursoLetra
      requestBody:
        $ref: '#/components/requestBodies/ComposeGrupo'
      responses:
        '200':
          $ref: '#/components/responses/GrupoId'
        '400':
          description: Datos suministrados no válidos
        '404':
          description: Grupo no encontrado
*/
app.post(api_config.path + '/grupos/compose', authenticateClient, async (req, res) => api_controllers.grupo.getGrupoByCursoLetra(req, res, db));

/* /recurrencias/:idRecurrencia
    tags:
        - recurrencias
      summary: Devuelve información de una recurrencia por su id
      description: Devuelve información de la recurrencia con id = {idRecurrencia}
      operationId: getRecurrenciaById
      parameters:
        - $ref: '#/components/parameters/idRecurrencia'
      responses:
        '200':
          $ref: '#/components/responses/RecurrenciaData'
        '400':
          description: Id suministrado no válido
        '404':
          description: Clase no encontrada
*/
app.get(api_config.path + '/recurrencias/:idRecurrencia', authenticateClient, async (req, res) => api_controllers.recurrencia.getRecurrenciaById(req, res, db));

/* /recurrencias/actividades/:idActividad
    tags:
        - recurrencias
        - actividades
      summary: Devuelve la lista de recurrencias asociadas a una actividad
      description: Devuelve la lista de recurrencias de la actividad con id = {idActividad}.
      operationId: getRecurrenciaByActividad
      parameters:
        - $ref: '#/components/parameters/idActividad'
      responses:
        '200':
          $ref: '#/components/responses/RecurrenciaListaData'
        '400':
          description: Id suministrado no válido
        '404':
          description: Clase no encontrada
*/
app.get(api_config.path + '/recurrencias/actividades/:idActividad', authenticateClient, async (req, res) => api_controllers.recurrencia.getRecurrenciaByActividad(req, res, db));

app.listen(api_config.port, api_config.host, () => {
  const port_spec = (api_config.port_spec) ? ':' + api_config.port : '';
  logger.info(`Api listening on port ${api_config.port} at ${api_config.protocol}://${api_config.host}${port_spec}${api_config.path}`);
});

function authenticateClient(req, res, next) {
  for (let i = 0; i < api_config.secrets.length; i++) {
    if (req.header('X-Token') == api_config.secrets[i]) {
      next();
      logger.info(`Accepted with token ${i}`);
      return true;
    }
  }
  return false;
}