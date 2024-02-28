const csv = require('csv-parser');
const path = require('path');
const fs = require('fs');
const db = require('./models');

const tiempo_periodos = {
    1: {inicio: "2023-09-11T09:00:00Z", fin: "2023-12-21T21:00:00Z"},
    2: {inicio: "2024-01-22T09:00:00Z", fin: "2024-05-10T21:00:00Z"}
}

const dias_int = {
    L: 1,
    M: 2,
    X: 3,
    J: 4,
    V: 5,
    S: 6,
    D: 7
}

async function parseHorarios(filename) {
    const results = [];
    fs.createReadStream(path.join(__dirname, filename))
    .on('error', (error) => console.log("Error while trying to read file %s: %s", filename, error))
    .pipe(csv({separator: ';'}))
    .on('data', (data) => results.push(data))
    .on('end', async () => {
        results.forEach(async (row) => {
            // Elementos de la fila
            const titulacion = row['Titulación'];
            const curso = parseInt(row['Curso'].split('º')[0]); // "Númeroº" => Int Número
            const codGEA = row['Cod.GEA'];
            const asignatura_siglas = (row['Asignatura'].split(' ('));
            const grupo = row['Grupo'];
            const departamentos = (row['Departamento'].split('/'));
            const periodo = row['Periodo'];
            const docencia = row['Docencia'];

            // Si Titulación no existe, se inserta
            const entidad_titulacion = await db.sequelize.models.titulacion.findOrCreate({
                where: {
                    id: titulacion
                },
                defaults: { 
                    id: titulacion
                }
            });

            // Curso y Grupo se aplican para hacer una instancia de la tabla Grupo
            const entidad_grupo = await db.sequelize.models.grupo.findOrCreate({
                where: {
                    curso: curso,
                    letra: grupo
                },
                defaults: { 
                    curso: curso,
                    letra: grupo
                }
            });

            // Cod.GEA con Asignatura se aplican para hacer una instancia de la tabla Asignatura
            // El nombre de dicha instancia es la primera parte de Asignatura, y las siglas la segunda parte (entre paréntesis)
            // El departamento de dicha instancia es el extraido de la fila, lo mismo con el periodo
            let nombre = asignatura_siglas[0];
            let siglas = asignatura_siglas[1].slice(0, asignatura_siglas[1].length - 1);
            
            for (let i = 0; i < departamentos.length; i++) { // Preguntar a Iván si merece la pena, o mejor guardar el string directamente
                let dep = departamentos[i];
                await db.sequelize.models.asignatura.findOrCreate({
                    where: {
                        id: codGEA,
                        nombre: nombre,
                        siglas: siglas,
                        departamento: dep,
                        periodo: periodo
                    },
                    defaults: { 
                        id: codGEA,
                        nombre: nombre,
                        siglas: siglas,
                        departamento: dep,
                        periodo: periodo
                    }
                });
            }
            
            // Docencia lleva mucho curro
            // Tratar el string como expresión regular para analizar las distintas partes de este
            // (Espacios) => (Días):(Hora_inicio)-(Hora_fin) (| ((Espacios) =>)? (Días):(Hora_inicio)-(Hora_fin))*
            let actividades = docencia.split(' | ');
            let espacios = null;
            let horarios = null;
            let tipo_esp = null;
            let num_esp = null;

            for (let j = 0; j < actividades.length; j++) {

                let actividad = actividades[j];
                let aux = '';

                if (actividad.contains('=> ')) {
                    aux = actividad.split('=> ');
                    espacios = aux[0];
                    horarios = aux[1];
                    aux = espacios.split(' ');
                    tipo_esp = aux[0];
                    num_esp = aux[1];
                }
                else {
                    horarios = actividad;
                }

                let espacios_procesados = [];

                if (num_esp.contains(',')) { // Separamos si hay más de un espacio
                    num_esp = num_esp.split(',');
                    num_esp.forEach((elem) => {
                        let edificio = 'FdI';
                        let trimmed = elem.trim(); // Quitamos espacios redundantes
                        
                        if (trimmed.contains('Mult.-')) { // Si es del estilo "Mult.-1208"
                            trimmed = trimmed.slice(6);
                            edificio = 'Multiusos';
                        }

                        parseInt(trimmed); // Pasamos a int

                        espacios_procesados.push({tipo: tipo_esp, edificio: edificio, numero: trimmed}); // Guardamos todo en un json
                    });  
                }
                else {
                    let edificio = 'FdI';
                    let trimmed = num_esp.trim(); // Quitamos espacios redundantes
                        
                    if (trimmed.contains('Mult.-')) { // Si es del estilo "Mult.-1208", separamos la información
                        trimmed = trimmed.slice(6);
                        edificio = 'Multiusos';
                    }

                    parseInt(trimmed); // Pasamos a int

                    espacios_procesados.push({tipo: tipo_esp, edificio: edificio, numero: trimmed}); // Guardamos todo en un json
                }

                // Separamos los días de las horas, y luego la hora de inicio con la hora de fin
                let [dias, horas] = horarios.split(':', 1);
                let [hora_inicio, hora_fin] = horas.split('-');

                const actividad_resultante = await db.sequelize.models.actividad.findOrCreate({ //porqué findOrCreate??
                    where: {
                        fecha_inicio: tiempo_periodos[periodo].inicio,
                        fecha_fin: tiempo_periodos[periodo].fin,
                        tiempo_inicio: hora_inicio,
                        tiempo_fin: hora_fin,
                        es_todo_el_dia: 'No',
                        es_recurrente: 'Sí',
                        creadoPor: "CSVParser"
                    },
                    defaults: { 
                        fecha_inicio: tiempo_periodos[periodo].inicio,
                        fecha_fin: tiempo_periodos[periodo].fin,
                        tiempo_inicio: hora_inicio,
                        tiempo_fin: hora_fin,
                        es_todo_el_dia: 'No',
                        es_recurrente: 'Sí',
                        creadoPor: "CSVParser" 
                    }
                });

                for (let l = 0; l < dias.length; l++) { // Crear una recurrencia por cada dia de la semana que se repita la actividad
                    let dia = dias[l];

                    await db.sequelize.models.recurrencia.create({dia_semana: dias_int[dia], actividad_id: actividad_resultante.id});
                }

                for (let k = 0; k < espacios_procesados.length; k++) { // Relacionar la actividad con cada espacio
                    let esp = espacios_procesados[k];

                    let esp_entity = await db.sequelize.models.espacio.findOne({ //Solo hay uno, pues hay un constraint unique para (tipo, numero, edificio)
                        attributes: ['id'],
                        where: {
                            tipo: esp.tipo,
                            numero: esp.numero,
                            edificio: esp.edificio
                        }
                    });

                    // Relacionar la actividad con el espacio
                    await actividad_resultante.addEspacio(esp_entity);

                }
            
            }
            // FALTA:
            // Crear la clase que relaciona la asignatura con el grupo (entidad_asignatura.add<algo, no me acuerdo>(entidad_grupo))
            // Crear la relación entre titulación y asignatura a través de plan, pero ni idea de como sacar qué plan corresponde.
            // Preguntar si el plan se debe sacar como el último en creación que haga referencia a la titulación, asumiendo que la titulación ya está creada siempre.
            // Crear la relación entre la clase de la asignatura y las actividades que dará dicha clase.

        })
    });
}

parseHorarios('Horario2324.csv');