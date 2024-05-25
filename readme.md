# Automatización de Seguimiento Docente (Aplicación de Gestión y API REST)
Este repositorio contiene el Frontend y el Backend diseñados para el TFG de Automatización del Seguimiento Docente.
Los procesos en sí son ``app.js`` y ``api.js`` para la Aplicación de Gestión y la API REST respectivamente. La API REST está documentada en el archivo ``api.yaml``.
A su vez, el proceso que se encarga de determinar cuando no se registra una asistencia está programado en el archivo ``no_asistenciador.js``.
Para un correcto funcionamiento de la aplicación, estos tres procesos deben estar en ejecución.

La visualización del proyecto es desde su directorio raíz. Para ejecutar código, se requiere la instalación de Node Package Manager (NPM).
Antes de ejecutar por primera vez el código, es necesario ejecutar el comando `npm i` desde el directorio raíz del proyecto. 
Para ejecutar un archivo se utiliza el comando `node .\src\XX` (donde XX es el nombre del archivo a ejecutar).

El archivo ``.env.example`` contiene los campos aceptados para la ejecución como un ejemplo. Sin un archivo ``.env`` no se asegura la correcta ejecución del proyecto.

Se incluyen además comandos relativos a la ejecución de migraciones y seeders:
- `npm run migrate`
    Ejecuta la función up de las migraciones del proyecto
- `npm run undo-migrate`
    Ejecuta la función down de las migraciones del proyecto
- `npm run seed`
    Ejecuta la función up de un conjunto de seeders del proyecto
- `npm run undo-seed`
    Ejecuta la función down de un conjunto de seeders del proyecto

El conjunto de seeders del proyecto a ejecutar se decide mediante las variables `NODE_ENV` y `TEST_CASE` del fichero ``.env``.
- Para un entorno de desarrollo, se ejecutan los seeders de la carpeta ``seeders/dev``
- Para un entorno de testing, se ejecutan los seeders de la carpeta especificada en `TEST_CASE` dentro de ``/seeders/test_cases`` 

## Funcionalidades de la Aplicación de Gestión
- Formulario de inscripción simple
- Formulario de inscripción avanzada
- Formulario de cancelación de clases
- Formulario de justificación de faltas
- Vista de estadísticas de faltas
- Vista de asistencias
- Registro de firmas
- Generación de correos de aviso
- Registro de MACs para un usuario
- Registro de NFCs para un usuario

## Funcionalidades de la API REST
- Registro de asistencia por Bluetooth
- Registro de asistencia por NFC
- Registro de asistencia por PLA
- Inscripción, modificación y eliminación de nodos IoT
- Generación de QR de formulario para un espacio

## Funcionalidades futuras
- Reprogramación e intercambio de clases programadas
- Informe en PDF de asistencias
- Avisos de sutitución
