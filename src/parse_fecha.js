const moment = require('moment');
const recTypeParser = {
    Diaria: 'days',
    Semanal: 'weeks',
    Mensual: 'months',
    Anual: 'years'
}

function getInicioDiferencia(act) {
    // Parseamos los tiempos de inicio y fin (en horas)
    let hora_inicio, minuto_inicio, diferencia_horas, diferencia_minutos;
    if (act.es_todo_el_dia == 'Sí') {
        hora_inicio = 0;
        minuto_inicio = 0;
        diferencia_horas = 24;
        diferencia_minutos = 0;
    }
    else {
        try {
            let split_point_ini = act.tiempo_inicio.indexOf(':');
            hora_inicio = parseInt(act.tiempo_inicio.substring(0, split_point_ini));
            minuto_inicio = parseInt(act.tiempo_inicio.substring(split_point_ini + 1));

            let split_point_fin = act.tiempo_fin.indexOf(':');
            let hora_fin = parseInt(act.tiempo_fin.substring(0, split_point_fin));
            let minuto_fin = parseInt(act.tiempo_fin.substring(split_point_fin + 1));
            diferencia_horas = hora_fin - hora_inicio;
            diferencia_minutos = minuto_fin - minuto_inicio;
        }
        catch (error) {
            console.log("Error while parsing tiempo_inicio: ", error);
            throw error;
        }
    }

    return [hora_inicio, minuto_inicio, diferencia_horas, diferencia_minutos];
}

function primeraRecurrencia(act, rec) {
    let [hora_inicio, minuto_inicio] = getInicioDiferencia(act);

    // Encontrar el primer evento
    let inicio = moment(act.fecha_inicio, 'YYYY-MM-DDTHH:mm');
    
    // Calibramos las horas y minutos
    let minuto_partida = inicio.minute();
    let minutos_hora = 60;
    let offset_minutos = (minuto_inicio < minuto_partida) ?  minutos_hora - (minuto_partida - minuto_inicio) : minuto_inicio - minuto_partida;
    inicio.add(offset_minutos, 'minutes');

    let hora_partida = inicio.hour();
    let horas_dia = 24;
    let offset_horas = (hora_inicio < hora_partida) ?  horas_dia - (hora_partida - hora_inicio) : hora_inicio - hora_partida;
    inicio.add(offset_horas, 'hours');

    let dias_semana, dias_mes, meses_anio;
    let dia_partida, mes_partida, offset_dias, offset_meses;
    switch (rec.tipo_recurrencia) { // Si la recurrencia es diaria, se puede omitir
        case 'Semanal':
            dia_partida = inicio.isoWeekday();
            dias_semana = 7;
            offset_dias = (rec.dia_semana < dia_partida) ?  dias_semana - (dia_partida - rec.dia_semana) : rec.dia_semana - dia_partida;
            inicio.add(offset_dias, 'days');
            break;
        case 'Mensual':
            dia_partida = inicio.date();
            dias_mes = inicio.daysInMonth();
            offset_dias = (rec.dia_mes < dia_partida) ? dias_mes - (dia_partida - rec.dia_mes) : rec.dia_mes - dia_partida;
            inicio.add(offset_dias, 'days');
            break;
        case 'Anual':
            dia_partida = inicio.date();
            dias_mes = inicio.daysInMonth();
            offset_dias = (rec.dia_mes < dia_partida) ? dias_mes - (dia_partida - rec.dia_mes) : rec.dia_mes - dia_partida;
            inicio.add(offset_dias, 'days');
        
            mes_partida = inicio.month();
            meses_anio = 12;
            let mes_anio_moment = rec.mes_anio - 1; // Para moment, el mes 5 es en realidad Junio, así pues, el 4 será Mayo. Esto se aplica a todos los meses
            offset_meses = (mes_anio_moment < mes_partida) ? meses_anio - (mes_partida - mes_anio_moment) : mes_anio_moment - mes_partida;
            inicio.add(offset_meses, 'months')
            break;
        default:
            break;
    }

    return inicio;
}

function fechaFromActividadRecurrencia(act, rec) {
    let punto_fin = (act.fecha_fin) ? moment(act.fecha_fin) : null;
    let tipo_rec = recTypeParser[rec.tipo_recurrencia];
    let max_veces = act.maximo || 32; 
    let separacion = rec.separacion || 0;
    let [,, diferencia_horas, diferencia_minutos] = getInicioDiferencia(act);

    // Aplicar la recurrencia para sacar el resto de eventos
    let eventos_resultantes = [];
    let a_evento = primeraRecurrencia(act, rec);
    // Si no hay final, 32 veces. Si lo hay, todas las posibles (separado para que no compruebe siempre la misma condición)
    if (punto_fin == null){
        for (let i = 0; i < max_veces; i++) {
            let clon = a_evento.clone().add({hours: diferencia_horas, minutes: diferencia_minutos});
            eventos_resultantes.push({ inicio: a_evento.toISOString(true), fin: clon.toISOString(true)});
            a_evento.add(separacion + 1, tipo_rec);
        }
    }
    else {
        
        for (let i = 0; a_evento < punto_fin; i++) {
            let clon = a_evento.clone().add({hours: diferencia_horas, minutes: diferencia_minutos});
            eventos_resultantes.push({ inicio: a_evento.toISOString(true), fin: clon.toISOString(true)});
            a_evento.add(separacion + 1, tipo_rec);
        }
    }
    
    return eventos_resultantes;
}

function isInRecurrencia(act, rec, fecha) {
    let inicio = primeraRecurrencia(act, rec);
    let separacion = rec.separacion;
    let tipo_rec = recTypeParser[rec.tipo_recurrencia];
    let a_comparar = moment(fecha, 'YYYY-MM-DDTHH:mm');
    // Para que esté en la recurrencia, la diferencia entre la primera actividad y esta debe, en la unidad de separación,
    // debe ser divisible por la separación entre actividades impuesta por la recurrencia
    return (inicio.diff(a_comparar, tipo_rec) % separacion == 0);
}

function getLastEventOfRecurrencia(act, rec) {
    let inicio = primeraRecurrencia(act, rec);
    let separacion = rec.separacion;
    let tipo_rec = recTypeParser[rec.tipo_recurrencia];
    let ahora = moment.now();

    let last_event = 'Event not yet occurred';
    while (inicio.diff(ahora) < 0) {
        last_event = inicio.clone();
        inicio.add(separacion + 1, tipo_rec);
    }

    return last_event;
};

function getLastEventOfActividad(act, rec_list) {
    // Quedarse con la recurrencia que menos cerca esté de repetirse

    let next_rec;
    let next_left = null;
    let current = moment.now();

    rec_list.forEach(rec => {
        let event = getLastEventOfRecurrencia(act, rec);

        if (moment(event).isValid()) {  
            let left = moment(current).diff(moment(event));
            // No consideramos las iguales porque su tiempo restante es igual, así que darán lugar al mismo evento en tiempo
            console.log(left, left >= 0, next_left == null, left < next_left);
            if (left >= 0 && (next_left == null || left < next_left)) {
                next_left = left;
                next_rec = rec;
            }
        } 
    });

    console.log(next_rec);
    return (next_left == null) ? "Event not yet occurred" : getLastEventOfRecurrencia(act, next_rec);
}

function getFinActividad(act_instance, t_fin) {
    let t_inicio = act_instance.format('HH:mm');
    let [,, dif_horas, dif_mins] = getInicioDiferencia({ tiempo_inicio: t_inicio, tiempo_fin: t_fin, es_todo_el_dia: "No" });

    let act_end = act_instance.clone().add(dif_horas, 'hours').add(dif_mins, 'minutes');
    return act_end;
}

fechaFromActividadRecurrencia({fecha_inicio: "2024-03-07T16:45:11.647", fecha_fin: "2024-06-22T16:45:11.647", tiempo_inicio: '16:00', 
tiempo_fin: '17:40', es_todo_el_dia: 'No', es_recurrente: 'Sí', creadoPor: 'Galdo', responsable_id: 3},
{tipo_recurrencia: 'Semanal', dia_semana: 4, dia_mes: 22, mes_anio: 5, separacion: 1});

isInRecurrencia({fecha_inicio: "2024-03-07T16:45:11.647", fecha_fin: "2024-06-22T16:45:11.647", tiempo_inicio: '16:00', 
tiempo_fin: '17:40', es_todo_el_dia: 'No', es_recurrente: 'Sí', creadoPor: 'Galdo', responsable_id: 3},
{tipo_recurrencia: 'Semanal', dia_semana: 4, dia_mes: 22, mes_anio: 5, separacion: 1}, "2024-06-22T16:45:11.647");

getLastEventOfRecurrencia({fecha_inicio: "2024-03-07T16:45:11.647", fecha_fin: "2024-06-22T16:45:11.647", tiempo_inicio: '16:00', 
tiempo_fin: '17:40', es_todo_el_dia: 'No', es_recurrente: 'Sí', creadoPor: 'Galdo', responsable_id: 3},
{tipo_recurrencia: 'Mensual', dia_semana: 4, dia_mes: 22, mes_anio: 5, separacion: 1});



module.exports = {
    fechaFromActividadRecurrencia, isInRecurrencia, getLastEventOfRecurrencia, getLastEventOfActividad, getFinActividad
}