const logger = require('./config/logger.config').child({"process": "horarios_parser"});

const csv = require('csv-parser');
const path = require('path');
const fs = require('fs');
const db = require('./models');
const moment = require('moment');
const iana_timezone = Intl.DateTimeFormat().resolvedOptions().timeZone; // Europe/Madrid

const tiempo_periodos = {
    1: {inicio: "2023-09-11T09:00:00", fin: "2023-12-21T21:00:00"},
    2: {inicio: "2024-01-22T09:00:00", fin: "2024-05-10T21:00:00"}
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

const tipo_espacios = {
    "Aula": "Aula",
    "Lab.": "Laboratorio"
}

//TODO asumir que las fusiones ya existen y comprobar que los horarios coincidan en lugar de crearlas
//TODO pasar las horas a UTC antes de guardarlas en la base de datos

async function parseHorarios(filename) {
    const results = [];
    let keys = [];
    fs.createReadStream(path.join(__dirname, filename))
    .on('error', (error) => logger.error(`Error while trying to read file ${filename}: ${error}`))
    .pipe(csv({separator: ';'}))
    .on('headers', (headers) => keys = headers)
    .on('data', (data) => results.push(data))
    .on('end', async () => {
        let actividades_borradas = 0;

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

            const transaction = await db.sequelize.transaction();

            try {
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
                let actividades = docencia.split('|');
                let espacios = null;
                let horarios = null;
                let tipo_esp = null;
                let dias = null;
                let num_esp = null;

                for (let j = 0; j < actividades.length; j++) {

                    let actividad = actividades[j].trim();
                    let aux = '';

                    if (actividad.includes('=>')) {
                        aux = actividad.split('=>');
                        espacios = aux[0].trim();
                        horarios = aux[1].trim();
                        let index = espacios.indexOf(' ');
                        tipo_esp = espacios.substring(0, index);
                        num_esp = espacios.substring(index + 1);
                    }
                    else {
                        horarios = actividad;
                    }

                    let espacios_procesados = [];

                    if (num_esp.includes(',')) { // Separamos si hay más de un espacio
                        let parsed_esp = num_esp.split(',');
                        parsed_esp.forEach((elem) => {
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

                    let split_point = 0;
                    let horas = horarios;
                    // Si no se especifican los días, y hay actividades antes, se pillan los días anteriores
                    if (horarios.match(/[a-z]+:/gi)) {
                        split_point = horarios.indexOf(':');
                        dias = horarios.substring(0, split_point);
                        horas = horarios.substring(split_point + 1);
                    }
                    else if (j == 0) {
                        throw 'No se ha especificado día al principio de una serie de recursiones';
                    }
                    
                    let [hora_inicio, hora_fin] = horas.split('-');

                    // Si existe una misma actividad, con las mismas recurrencias y la misma asociación con clase, está repetida
                    // Obtener todas las actividades que compartan parámetros con la recién creada
                    let checkDup = await db.sequelize.models.Actividad.findAll({
                        where: {
                            fecha_inicio: tiempo_periodos[periodo].inicio,
                            fecha_fin: tiempo_periodos[periodo].fin,    
                            tiempo_inicio: ( hora_inicio.includes(':') ? moment(hora_inicio, 'HH:mm').format('HH:mm') : moment(hora_inicio, 'HH').format('HH:mm') ),
                            tiempo_fin: ( hora_fin && hora_fin.includes(':') ? moment(hora_fin, 'HH:mm').format('HH:mm') : moment(hora_fin, 'HH').format('HH:mm') ),
                            responsable_id: entidad_docente.id,
                            es_todo_el_dia: 'No',
                            es_recurrente: 'Sí'
                        }
                    });

                    const actividad_resultante = await db.sequelize.models.Actividad.create({
                        fecha_inicio: tiempo_periodos[periodo].inicio,
                        fecha_fin: tiempo_periodos[periodo].fin,
                        tiempo_inicio: ( hora_inicio.includes(':') ? moment(hora_inicio, 'HH:mm').format('HH:mm') : moment(hora_inicio, 'HH').format('HH:mm') ),
                        tiempo_fin: ( hora_fin && hora_fin.includes(':') ? moment(hora_fin, 'HH:mm').format('HH:mm') : moment(hora_fin, 'HH').format('HH:mm') ),
                        responsable_id: entidad_docente.id, //Tiene que ser declarado explícitamente en Sequelize v6
                        es_todo_el_dia: 'No',
                        es_recurrente: 'Sí',
                        creadoPor: "CSVParser" 
                    });
                    
                    let dupeOf = [];
                    let dupeEspComp = [];
                    let esp_entities = [];

                    // Considerar que la actividad pueda estar repetida por parámetros de actividad
                    if (checkDup.length > 0) {
                        checkDup.forEach(dupe => { 
                            dupeOf.push(dupe);
                            dupeEspComp.push([]);
                        });
                    }

                    // Crear la relación entre la clase de la asignatura y las actividades que dará dicha clase.
                    for (let k = 0; k < entidades_clase.length; k++) {   
                        // Si es posible que esté duplicada, considerar el caso en el que tengan la misma asociación con clases
                        for (let l = 0; l < dupeOf.length; l++) {
                            // Comprobar si se comparten las relaciones con clases. Si no se comparten, descartar el candidato
                            if (!(await entidades_clase[k].hasCon_sesiones(dupeOf[l]))) {
                                dupeOf.splice(l, 1);
                                dupeEspComp.splice(l, 1);
                                l--;
                                break;
                            }
                        }

                        await entidades_clase[k].addCon_sesiones(actividad_resultante);
                    }

                    // Relacionar la actividad con cada espacio
                    for (let k = 0; k < espacios_procesados.length; k++) { 
                        let esp = espacios_procesados[k];

                        let esp_entity = await db.sequelize.models.Espacio.findOne({ //Solo hay uno, pues hay un constraint unique para (tipo, numero, edificio)
                            attributes: ['id'],
                            where: {
                                tipo: tipo_espacios[esp.tipo],
                                numero: esp.numero,
                                edificio: esp.edificio
                            }
                        });

                        // Relacionar la actividad con el espacio
                        await actividad_resultante.addImpartida_en(esp_entity);
                        
                        if (dupeOf.length > 0) {
                            esp_entities.push(esp_entity);

                            for (let l = 0; l < dupeOf.length; l++) {
                                let orig_esp = await db.sequelize.models.Join_Actividad_Espacio.findOne({ 
                                    where: {
                                        actividad_id: dupeOf[l].dataValues.id,
                                        espacio_id: esp_entity.dataValues.id
                                    }
                                });

                                if (orig_esp == null) dupeEspComp[l].push(esp_entities.length - 1);
                            }
                        }
                    }

                    let rec_list = [];
                    for (let l = 0; l < dias.length; l++) { // Crear una recurrencia por cada dia de la semana que se repita la actividad
                        let dia = dias[l];

                        rec_list.push(await db.sequelize.models.Recurrencia.create({
                            tipo_recurrencia: 'Semanal',
                            separacion: 0, // se saltan 0 eventos hasta que vuelva a suceder
                            maximo: null,
                            dia_semana: dias_int[dia],
                            semana_mes: null,
                            dia_mes: null,
                            mes_anio: null,
                            actividad_id: actividad_resultante.id
                        }));
                    } 

                    // En el peor caso de que siga pudiendo haber una copia de la actividad, comprobar sus recurrencias
                    for (let k = 0; k < dupeOf.length; k++) {
                        // Obtener todas las recurrencias del candidato
                        const orig_recs = await db.sequelize.models.Recurrencia.findAll({
                            attributes: ['tipo_recurrencia', 'separacion', 'maximo', 'dia_semana', 'semana_mes', 'dia_mes', 'mes_anio'],
                            where: {
                                actividad_id: dupeOf[k].dataValues.id
                            }
                        });

                        let keepComparing = (rec_list.length == orig_recs.length) || (rec_list.length < orig_recs.length && dupeEspComp[k].length == 0);

                        // Si no tienen la misma longitud no son la misma actividad
                        if (!keepComparing) {
                            // Pero una puede estar contenida en la otra, y si esta contiene a la copia, 
                            // podemos pasarle las recurrencias que no tenga la copia a dicha copia. Para esto, deben tener los mismos espacios
                            if (dupeEspComp[k].length == 0) {
                                let orig_id = dupeOf[k].dataValues.id;
                                for (let l = 0; l < rec_list.length; l++) { 
                                    let comp_rec = rec_list[l];
                                    let hasMatch = false;
                                    
                                    for (let m = 0; m < orig_recs.length; m++) {
                                        hasMatch = (comp_rec.dataValues.tipo_recurrencia === orig_recs[m].dataValues.tipo_recurrencia &&
                                            comp_rec.dataValues.separacion === orig_recs[m].dataValues.separacion &&
                                            comp_rec.dataValues.maximo === orig_recs[m].dataValues.maximo &&
                                            comp_rec.dataValues.dia_semana === orig_recs[m].dataValues.dia_semana &&
                                            comp_rec.dataValues.semana_mes === orig_recs[m].dataValues.semana_mes &&
                                            comp_rec.dataValues.dia_mes === orig_recs[m].dataValues.dia_mes &&
                                            comp_rec.dataValues.mes_anio === orig_recs[m].dataValues.mes_anio);
        
                                        if (hasMatch) { 
                                            break;
                                        }
                                    }
                                    
                                    // Si esta recurrencia no está en el candidato, añadirla al candidato y quitarla de la lista de recurrencias
                                    if (!hasMatch) {
                                        await rec_list[l].update({
                                            actividad_id: orig_id
                                        });
                                        rec_list.splice(l, 1);
                                        l--;
                                    }
                                }
                            }
                            else {
                                dupeOf.splice(k, 1); 
                                dupeEspComp.splice(k, 1);
                                k--;
                            }
                        }

                        // Mientras no se haya descartado al candidato, comparar cada una de las recurrencias
                        for (let l = 0; l < rec_list.length && keepComparing; l++) { 
                            let comp_rec = rec_list[l];
                            let hasMatch = false;
                            
                            for (let m = 0; m < orig_recs.length && keepComparing; m++) {
                                hasMatch = (comp_rec.dataValues.tipo_recurrencia === orig_recs[m].dataValues.tipo_recurrencia &&
                                    comp_rec.dataValues.separacion === orig_recs[m].dataValues.separacion &&
                                    comp_rec.dataValues.maximo === orig_recs[m].dataValues.maximo &&
                                    comp_rec.dataValues.dia_semana === orig_recs[m].dataValues.dia_semana &&
                                    comp_rec.dataValues.semana_mes === orig_recs[m].dataValues.semana_mes &&
                                    comp_rec.dataValues.dia_mes === orig_recs[m].dataValues.dia_mes &&
                                    comp_rec.dataValues.mes_anio === orig_recs[m].dataValues.mes_anio);

                                if (hasMatch) { 
                                    break;
                                }
                            }
                            
                            // Si esta recurrencia no está en el candidato, descartar el candidato
                            if (!hasMatch) {
                                keepComparing = false;
                                dupeOf.splice(k, 1); 
                                dupeEspComp.splice(k, 1);
                                k--;
                            }
                        }
                    }

                    // En caso de que verdaderamente sea una copia, destruimos todo lo creado de la actividad
                    if (dupeOf.length > 0) {

                        for (let k = 0; k < dupeOf.length; k++) {
                            for (let l = 0; l < dupeEspComp[k].length; l++) {
                                await dupeOf[k].addImpartida_en(esp_entities[dupeEspComp[k][l]]);
                            }
                        }

                        for (let k = 0; k < esp_entities.length; k++) {
                            await db.sequelize.models.Join_Actividad_Espacio.destroy({
                                where: {
                                    espacio_id: esp_entities[k].dataValues.id,
                                    actividad_id: actividad_resultante.dataValues.id
                                }
                            });
                        }

                        for (let k = 0; k < rec_list.length; k++) {
                            await db.sequelize.models.Recurrencia.destroy({
                                where: {
                                    id: rec_list[k].dataValues.id
                                }
                            })
                        }

                        for (let k = 0; k < entidades_clase.length; k++) {
                            await db.sequelize.models.Join_Actividad_Clase.destroy({
                                where: {
                                    actividad_id: actividad_resultante.dataValues.id,
                                    clase_id: entidades_clase[k].dataValues.id
                                }
                            })
                        }

                        await db.sequelize.models.Actividad.destroy({
                            where: {
                                id: actividad_resultante.dataValues.id
                            }
                        });

                        actividades_borradas++;
                        continue;
                    }   

                    await actividad_resultante.addImpartida_por(entidad_docente);

                }
                await transaction.commit();
            }
            catch (error) {
                logger.error(`Something went wrong when parsing: ${error}`);
                await transaction.rollback();
            }
        }
    });

    logger.info('Horarios insertados');
}

parseHorarios('Horario2324.csv');
//parseHorarios('prueba.csv');
