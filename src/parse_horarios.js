const csv = require('csv-parser');
const path = require('path');
const fs = require('fs');
const db = require('./models');
const moment = require('moment');

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
    let keys = [];
    fs.createReadStream(path.join(__dirname, filename))
    .on('error', (error) => console.log("Error while trying to read file %s: %s", filename, error))
    .pipe(csv({separator: ';'}))
    .on('headers', (headers) => keys = headers)
    .on('data', (data) => results.push(data))
    .on('end', async () => {
        for (let i = 0; i < results.length; i++) {
            
            while (results[i][keys[7]].includes('UPM') || results[i][keys[7]].includes('IMDEA')) { // Recursión externa a la UCM
                i++;
            }

            const row = results[i];
            // Elementos de la fila
            const titulacion = row[keys[0]];
            let curso = row[keys[1]];
            const codGEA = row[keys[2]];
            const asignatura_siglas = (row[keys[3]].split('('));
            const grupo = row[keys[4]];
            const departamentos = row[keys[5]];
            const periodo = row[keys[6]];
            const docencia = row[keys[7]];

            //console.log(JSON.stringify(row) + '\n', titulacion, curso, codGEA, asignatura_siglas, grupo, departamentos, periodo, docencia);


            // Traemos de la base de datos la titulación especificada
            const entidad_titulacion = await db.sequelize.models.Titulacion.findOne({
                where: {
                    siglas: titulacion
                }
            });

            // Traemos de la base de datos el plan de la titulación
            // DE MOMENTO EL MÁS RECIENTE POR FALTA DE INFORMACIÓN
            const entidad_plan = await db.sequelize.models.Plan.findOne({
                where: {
                    titulacion_id: entidad_titulacion.id
                },
                order: ['creadoEn']
            });

            // Cod.GEA con Asignatura se aplican para hacer una instancia de la tabla Asignatura
            // El nombre de dicha instancia es la primera parte de Asignatura, y las siglas la segunda parte (entre paréntesis)
            // El departamento de dicha instancia es el extraido de la fila, lo mismo con el periodo
            let nombre = asignatura_siglas[0].trim();
            let siglas = asignatura_siglas[1].slice(0, asignatura_siglas[1].length - 1);
            
            // Creamos la asignatura si no existe
            const [entidad_asignatura, asignatura_cr] = await db.sequelize.models.Asignatura.findOrCreate({
                where: {
                    id: codGEA,
                    nombre: nombre,
                    siglas: siglas
                },
                defaults: { 
                    id: codGEA,
                    nombre: nombre,
                    siglas: siglas,
                    departamento: departamentos,
                    periodo: periodo
                }
            });

            if (!asignatura_cr) {
                if (entidad_asignatura.dataValues.periodo != 'Anual' && entidad_asignatura.dataValues.periodo != periodo) {
                    await db.sequelize.models.Asignatura.update({periodo: 'Anual'}, { where: {id: codGEA}} );
                }
                if (!entidad_asignatura.dataValues.departamento.includes(departamentos)) { // Re: preguntar a Iván como va a ser el formato de verdad
                    if (departamentos.includes(entidad_asignatura.departamento)) {
                        await db.sequelize.models.Asignatura.update({departamento: departamentos}, { where: {id: codGEA}} );
                    }
                    else {
                        await db.sequelize.models.Asignatura.update({departamento: entidad_asignatura.dataValues.departamento + '/' + departamentos}, { where: {id: codGEA}} );
                    }
                }
            }

            await entidad_asignatura.setDe_plan(entidad_plan);

            if (curso === "Optativas") { //El único caso en el que esto sucede es para ADE-GI, donde solo pone Optativas, sin un curso asociado
                curso = '5';
            }
            let lista_cursos = (curso.match(/\d+/g)).map(num => parseInt(num));
            let entidades_clase = [];
            for (let j = 0; j < lista_cursos.length; j++) {
                let curso = lista_cursos[j];
                
                // Curso y Grupo se aplican para hacer una instancia de la tabla Grupo
                const [entidad_grupo, grupo_cr] = await db.sequelize.models.Grupo.findOrCreate({
                    where: {
                        curso: curso,
                        letra: grupo
                    },
                    defaults: { 
                        curso: curso,
                        letra: grupo
                    }
                });


                // Relacionar la asignatura con el grupo
                if (!(await entidad_asignatura.hasPara_grupos(entidad_grupo))) {
                    await entidad_asignatura.addPara_grupos(entidad_grupo);
                }
                
                entidades_clase.push(await db.sequelize.models.Clase.findOne({
                    where: {
                        asignatura_id: entidad_asignatura.dataValues.id,
                        grupo_id: entidad_grupo.dataValues.id
                    }
                }));
            }
            
            // Docente responsable de la actividad 
            // DE MOMENTO ALEATORIO POR FALTA DE INFORMACIÓN
            const x = (i % await db.sequelize.models.Docente.count()) + 1;
            const entidad_docente = await db.sequelize.models.Docente.findOne({
                where: {
                    id: x
                }
            });
            
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

                if (actividad.includes('=>')) {
                    aux = actividad.split('=>');
                    espacios = aux[0].trim();
                    horarios = aux[1].trim();
                    aux = espacios.split(' ');
                    tipo_esp = aux[0].trim();
                    num_esp = aux[1].trim();
                    //console.log(espacios, horarios, tipo_esp, num_esp);
                }
                else {
                    horarios = actividad;
                }

                let espacios_procesados = [];

                if (num_esp.includes(',')) { // Separamos si hay más de un espacio
                    num_esp = num_esp.split(',');
                    num_esp.forEach((elem) => {
                        let edificio = 'FdI';
                        let trimmed = elem.trim(); // Quitamos espacios redundantes
                        
                        if (trimmed.includes('Mult.-')) { // Si es del estilo "Mult.-1208"
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
                        
                    if (trimmed.includes('Mult.-')) { // Si es del estilo "Mult.-1208", separamos la información
                        trimmed = trimmed.slice(6);
                        edificio = 'Multiusos';
                    }

                    parseInt(trimmed); // Pasamos a int

                    espacios_procesados.push({tipo: tipo_esp, edificio: edificio, numero: trimmed}); // Guardamos todo en un json
                }

                // Separamos los días de las horas, y luego la hora de inicio con la hora de fin
                let split_point = horarios.indexOf(':');
                let dias = horarios.substring(0, split_point);
                let horas = horarios.substring(split_point + 1);
                let [hora_inicio, hora_fin] = horas.split('-');

                const actividad_resultante = await db.sequelize.models.Actividad.create({
                    fecha_inicio: tiempo_periodos[periodo].inicio,
                    fecha_fin: tiempo_periodos[periodo].fin,
                    tiempo_inicio: ( hora_inicio.includes(':') ? moment(hora_inicio, 'HH:mm').format('HH:mm') : moment(hora_inicio, 'HH').format('HH:mm') ),
                    tiempo_fin: (hora_fin && hora_fin.includes(':') ? moment(hora_fin, 'HH:mm').format('HH:mm') : moment(hora_fin, 'HH').format('HH:mm') ),
                    responsable_id: entidad_docente.id, //Tiene que ser declarado explícitamente en Sequelize v6
                    es_todo_el_dia: 'No',
                    es_recurrente: 'Sí',
                    creadoPor: "CSVParser" 
                });

                for (let l = 0; l < dias.length; l++) { // Crear una recurrencia por cada dia de la semana que se repita la actividad
                    let dia = dias[l];

                    await db.sequelize.models.Recurrencia.create({
                        tipo_recurrencia: 'Semanal',
                        dia_semana: dias_int[dia],
                        actividad_id: actividad_resultante.id
                    });
                }

                for (let k = 0; k < espacios_procesados.length; k++) { // Relacionar la actividad con cada espacio
                    let esp = espacios_procesados[k];

                    let esp_entity = await db.sequelize.models.Espacio.findOne({ //Solo hay uno, pues hay un constraint unique para (tipo, numero, edificio)
                        attributes: ['id'],
                        where: {
                            tipo: esp.tipo,
                            numero: esp.numero,
                            edificio: esp.edificio
                        }
                    });

                    // Relacionar la actividad con el espacio
                    await actividad_resultante.addImpartida_en(esp_entity);

                }

                // Crear la relación entre la clase de la asignatura y las actividades que dará dicha clase.
                for (let k = 0; k < entidades_clase.length; k++) {   
                    await entidades_clase[k].addCon_sesiones(actividad_resultante);
                }
            
            }
        }
    });
}

//IMPORTANTE, caso 803289, AC, que en un único grupo se da en otro periodo, se toma como anual??

parseHorarios('Horario2324.csv');