const logger = require('./config/logger.config').child({"process": "horarios_parser"});

const csv = require('csv-parser');
const path = require('path');
const fs = require('fs');
const db = require('./models');
const moment = require('moment');
const readline = require('readline');

const tiempo_periodos = {
    1: {inicio: "2023-09-11 09:00:00", fin: "2023-12-21 21:00:00"},
    2: {inicio: "2024-01-22 09:00:00", fin: "2024-05-10 21:00:00"}
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

const fusiones = {};

async function parseFusiones(filename) {
    const results = [];
    const file_stream = fs.createReadStream(path.join(__dirname, filename), 'utf-8')
    .on('error', (error) => logger.error(`Error while trying to read file ${filename}: ${error}`));

    const rl = readline.createInterface({
        input: file_stream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        let clases = line.split(' - ');
        for (let i = 0; i < clases.length; i++) {
            fusiones[clases[i]] = clases.slice(0, i).concat(clases.slice(i + 1));
        }
    }
}

async function parseHorarios(filename) {
    const results = [];
    let keys = [];
    fs.createReadStream(path.join(__dirname, filename))
    .on('error', (error) => logger.error(`Error while trying to read file ${filename}: ${error}`))
    .pipe(csv({separator: ';'}))
    .on('headers', (headers) => keys = headers)
    .on('data', (data) => results.push(data))
    .on('end', async () => {
        parseFusiones('fusiones.txt');
        let clases_fusiones = {};
        let actividades_fusiones = {};
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

                    const clase = await db.sequelize.models.Clase.findOne({
                        where: {
                            asignatura_id: entidad_asignatura.dataValues.id,
                            grupo_id: entidad_grupo.dataValues.id
                        }
                    });
                    
                    let nombre_clase = entidad_asignatura.dataValues.nombre + ' ' + entidad_grupo.dataValues.curso + entidad_grupo.dataValues.letra;
                    // Si la clase se corresponde con alguna de las fusiones
                    if (Object.keys(fusiones).includes(nombre_clase)) {
                        // Y no se ha registrado antes en las posibles actividades
                        if (!Object.keys(actividades_fusiones).includes(nombre_clase)) {
                            actividades_fusiones[nombre_clase] = []; 
                        }
                        // Añadimos el nombre de esta clase para no tener que volver a buscarlo luego
                        clases_fusiones[clase.dataValues.id] = nombre_clase;  // id: nombre => guardar nombre, actividades_fusiones[nombre].push(actividad)
                    }                                      // clase -> nombre; if fusiones has nombre -> candidatos = actividades_fusiones[nombrefusion]
                    entidades_clase.push(clase);
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

                    let actividad_resultante = await db.sequelize.models.Actividad.create({
                        fecha_inicio: tiempo_periodos[periodo].inicio,
                        fecha_fin: tiempo_periodos[periodo].fin,
                        tiempo_inicio: ( hora_inicio.includes(':') ? moment(hora_inicio, 'HH:mm').format('HH:mm') : moment(hora_inicio, 'HH').format('HH:mm') ),
                        tiempo_fin: ( hora_fin && hora_fin.includes(':') ? moment(hora_fin, 'HH:mm').format('HH:mm') : moment(hora_fin, 'HH').format('HH:mm') ),
                        responsable_id: entidad_docente.id, //Tiene que ser declarado explícitamente por no poder ser nulo en la base de datos
                        es_todo_el_dia: 'No',
                        es_recurrente: 'Sí',
                        creadoPor: "CSVParser" 
                    });

                    let candidatos = [];
                    let actividad_fusion;
                    // Crear la relación entre la clase de la asignatura y las actividades que dará dicha clase.
                    for (let k = 0; k < entidades_clase.length; k++) {   
                        await entidades_clase[k].addCon_sesiones(actividad_resultante);
                        let fusiones_clase = clases_fusiones[entidades_clase[k].dataValues.id];
                        // Si tiene fusiones, hay que considerarlas
                        if (fusiones_clase) {
                            let nombre_clase = clases_fusiones[entidades_clase[k].dataValues.id];
                            // Buscamos para toda fusión de la clase
                            for (let m = 0; m < fusiones[nombre_clase].length; m++) {
                                let fusion_candidata = fusiones[nombre_clase][m];
                                if (actividades_fusiones[fusion_candidata]) {
                                    candidatos.push({nombre: fusion_candidata, actividades: []});
                                    for (let l = 0; l < actividades_fusiones[fusion_candidata].length; l++) {
                                        let cand = actividades_fusiones[fusion_candidata][l];
                                        if (moment(actividad_resultante.fecha_inicio).format('YYYY-MM-DD HH:mm') == moment(cand.fecha_inicio).format('YYYY-MM-DD HH:mm') && 
                                                moment(actividad_resultante.fecha_fin).format('YYYY-MM-DD HH:mm') == moment(cand.fecha_fin).format('YYYY-MM-DD HH:mm') &&
                                                actividad_resultante.tiempo_inicio == cand.tiempo_inicio && actividad_resultante.tiempo_fin == cand.tiempo_fin && 
                                                actividad_resultante.responsable_id == cand.responsable_id) {
                                            candidatos[m].actividades.push(cand);
                                        }
                                    }
                                }
                            }
                            actividades_fusiones[nombre_clase].push(actividad_resultante);
                        }
                    }

                    let rec_list = [];
                    dias = dias.split(',');
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

                    let comprobados_set = {};
                    for (let l = 0; l < candidatos.length; l++) {
                        let candidatos_act = candidatos[l].actividades;
                        for (let n = 0; n < candidatos_act.length; n++) {
                            let candidato = candidatos_act[n];
                            
                            if (comprobados_set[candidato.id]) continue;
                            else comprobados_set[candidato.id] = true;

                            let recs_cand = await db.sequelize.models.Recurrencia.findAll({
                                attributes: ['id', 'dia_semana'],
                                where: {
                                    actividad_id: candidato.id
                                },
                                order: ['dia_semana']
                            });
                            let interseccion = [];
                            let ia = 0, ib = 0;
                            while (ia != rec_list.length && ib != recs_cand.length) {
                                let ia_value = rec_list[ia].dataValues.dia_semana;
                                let ib_value = recs_cand[ib].dataValues.dia_semana;
                                if (ia_value < ib_value) {
                                    ia++;
                                }
                                else if (ia_value > ib_value) {
                                    ib++;
                                }
                                else { //Son la misma recurrencia
                                    interseccion.push({valor: ia_value, index_a: ia, index_b: ib});
                                    ia++;
                                    ib++;
                                }
                            }
                            if (interseccion.length == rec_list.length) {
                                if (interseccion.length == recs_cand.length) { // Todo se puede fusionar
                                    // eliminar rec_list
                                    for (let m = 0; m < rec_list.length; m++) {
                                        await db.sequelize.models.Recurrencia.destroy({
                                            where: {
                                                id: rec_list[m].dataValues.id
                                            }
                                        });
                                    }
                                    // añadir entidades_clase a candidato
                                    // eliminar la actividad_resultante
                                    for (let m = 0; m < entidades_clase.length; m++) {
                                        await entidades_clase[m].removeCon_sesiones(actividad_resultante);
                                        await entidades_clase[m].addCon_sesiones(candidato);
                                        let nombre_clase = clases_fusiones[entidades_clase[m].dataValues.id];
                                        actividades_fusiones[nombre_clase].pop();
                                    }
                                    
                                    await db.sequelize.models.Actividad.destroy({
                                        where: {
                                            id: actividad_resultante.dataValues.id
                                        }
                                    });
                                    // actividad_resultante = candidato
                                    actividad_resultante = candidato;
                                }
                                else { // rec_list contenido en recs_cand 
                                    // eliminar en recs_cand las recurrencias de rec_list que estén en este
                                    for (let m = 0; m < interseccion.length; m++) {
                                        await db.sequelize.models.Recurrencia.destroy({
                                            where: {
                                                id: recs_cand[interseccion[m].index_b].dataValues.id
                                            }
                                        });
                                    }
                                    // añadir las clases del candidato a actividad_resultante
                                    
                                    let clases_candidato = await db.sequelize.models.Clase.findAll({
                                        include: {
                                            model: db.sequelize.models.Actividad,
                                            as: 'con_sesiones',
                                            where: {
                                                id: candidato.dataValues.id
                                            }
                                        }
                                    });

                                    for (let m = 0; m < clases_candidato.length; m++) {
                                        if (!(await clases_candidato[m].hasCon_sesiones(actividad_resultante))) {
                                            await clases_candidato[m].addCon_sesiones(actividad_resultante);
                                            let nombre_clase = clases_fusiones[clases_candidato[m].dataValues.id];
                                            actividades_fusiones[nombre_clase].push(actividad_resultante);
                                        }
                                    }
                                    // añadir los espacios del candidato a actividad_resultante

                                    let espacios_candidato = await db.sequelize.models.Espacio.findAll({
                                        include: {
                                            model: db.sequelize.models.Actividad,
                                            as: 'ocupado_por',
                                            where: {
                                                id: candidato.dataValues.id
                                            }
                                        }
                                    });

                                    for (let m = 0; m < espacios_candidato.length; m++) {
                                        await actividad_resultante.addImpartida_en(espacios_candidato[m]);
                                    }
                                }
                            }
                            else if (interseccion.length == recs_cand.length) { // recs_cand contenido en rec_list
                                // eliminar en rec_list las recurrencias de recs_cand que estén en este
                                for (let m = 0; m < interseccion.length; m++) {
                                    await db.sequelize.models.Recurrencia.destroy({
                                        where: {
                                            id: rec_list[interseccion[m].index_a].dataValues.id
                                        }
                                    });
                                }
                                // actividad_resultante = candidato
                                actividad_resultante = candidato;
                                // añadir las clases de actividad_resultante al candidato
                                for (let m = 0; m < entidades_clase.length; m++) {
                                    await entidades_clase[m].addCon_sesiones(candidato);
                                }
                            }
                            else if (interseccion.length != 0) {
                                // Crear nueva actividad actividad_fusion
                                actividad_fusion = await db.sequelize.models.Actividad.create({
                                    fecha_inicio: actividad_resultante.fecha_inicio,
                                    fecha_fin: actividad_resultante.fecha_fin,
                                    tiempo_inicio: actividad_resultante.tiempo_inicio,
                                    tiempo_fin: actividad_resultante.tiempo_fin,
                                    responsable_id: actividad_resultante.responsable_id,
                                    es_todo_el_dia: actividad_resultante.es_todo_el_dia,
                                    es_recurrente: actividad_resultante.es_recurrente,
                                    creadoPor: actividad_resultante.creadoPor 
                                });

                                // Pasar las clases de actividad_resultante y candidato a la nueva actividad
                                let clases_candidato = await db.sequelize.models.Clase.findAll({
                                    include: {
                                        model: db.sequelize.models.Actividad,
                                        as: 'con_sesiones',
                                        where: {
                                            id: candidato.dataValues.id
                                        }
                                    }
                                });

                                let m = 0, n = 0;
                                while (m < clases_candidato.length || n < entidades_clase.length) {
                                    if (m < clases_candidato.length && !(await clases_candidato[m].hasCon_sesiones(actividad_fusion))) {
                                        await clases_candidato[m].addCon_sesiones(actividad_fusion);
                                        let nombre_clase = clases_fusiones[clases_candidato[m].dataValues.id];
                                        actividades_fusiones[nombre_clase].push(actividad_fusion);
                                    }
                                    if (n < entidades_clase.length && !(await entidades_clase[m].hasCon_sesiones(actividad_fusion))) {
                                        await entidades_clase[m].addCon_sesiones(actividad_fusion);
                                        let nombre_clase = clases_fusiones[clases_candidato[m].dataValues.id];
                                        actividades_fusiones[nombre_clase].push(actividad_fusion);
                                    }
                                    m++;
                                    n++;
                                }
                                
                                // Pasar los espacios del candidato a la nueva actividad
                                let espacios_candidato = await db.sequelize.models.Espacio.findAll({
                                    include: {
                                        model: db.sequelize.models.Actividad,
                                        as: 'ocupado_por',
                                        where: {
                                            id: candidato.dataValues.id
                                        }
                                    }
                                });

                                for (let m = 0; m < espacios_candidato.length; m++) {
                                    await actividad_resultante.addImpartida_en(espacios_candidato[m]);
                                }

                                // Quitar recurrencias de actividad_resultante y candidato, y crear recurrencias de la fusión
                                for (let m = 0; m < interseccion.length; m++) {
                                    await db.sequelize.models.Recurrencia.destroy({
                                        where: {
                                            id: recs_cand[interseccion[m].index_b].dataValues.id
                                        }
                                    });
                                    let rec_interseccion = await db.sequelize.models.Recurrencia.update(
                                        {actividad_id: actividad_fusion.id},
                                        { 
                                            where: {
                                                id: rec_list[interseccion[m].index_a].dataValues.id
                                            }
                                        }
                                    );
                                }
                            }
                            // Si no coinciden, nos da igual
                        }
                        
                    }

                    // Relacionar la actividad (o las actividades) con cada espacio
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

                        let esp_join_query = await db.sequelize.models.Join_Actividad_Espacio.findAll({
                            where: {
                                espacio_id: esp_entity.dataValues.id
                            }
                        })

                        // Relacionar la actividad con el espacio, comprobando para no duplicar la relación en las fusiones
                        if (!(await actividad_resultante.hasImpartida_en(esp_entity))) { 
                            await actividad_resultante.addImpartida_en(esp_entity);
                        }
                        if (actividad_fusion && !(await actividad_fusion.hasImpartida_en(esp_entity))) { 
                            await actividad_fusion.addImpartida_en(esp_entity);
                        }
                        
                    }

                    if (!(await actividad_resultante.hasImpartida_por(entidad_docente))) { 
                        await actividad_resultante.addImpartida_por(entidad_docente);
                    }
                    if (actividad_fusion && !(await actividad_resultante.hasImpartida_por(entidad_docente))) { 
                        await actividad_resultante.addImpartida_por(entidad_docente);
                    }
                }
                
                await transaction.commit();
            }
            catch (error) {
                logger.error(`Something went wrong while parsing: ${error}`);
                await transaction.rollback();
                return;
            }
        }
    });

    logger.info('Horarios insertados');
}


async function generarHorarios(archivo_fusiones, archivo_horario) {
    await parseFusiones(archivo_fusiones);
    await parseHorarios(archivo_horario);
}

module.exports = {
    generarHorarios
}

// Por línea de comandos (solo cuando este archivo se ejecute directamente, no como import)
// El primer parámetro es la ruta al archivo de fusiones, y el segundo la ruta al archivo del horario
if (require.main === module) {
    generarHorarios(process.argv[2], process.argv[3]);
}