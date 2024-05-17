const wretch = require('wretch');
    
const endpoint = wretch(document.URL);

window.addEventListener('DOMContentLoaded', event => {
    let tabla = $('#datatable').DataTable({
        "language": {
            "sProcessing":    "Procesando...",
            "sLengthMenu":    "Mostrar _MENU_ entradas",
            "sZeroRecords":   "No se encontraron resultados",
            "sEmptyTable":    "Ningún dato disponible en esta tabla",
            "sInfo":          "Mostrando entradas de la _START_ a la _END_ de un total de _TOTAL_ entradas",
            "sInfoEmpty":     "No hay entradas disponibles",
            "sInfoFiltered":  "(filtrado de un total de _MAX_ entradas)",
            "sInfoPostFix":   "",
            "sSearch":        "Buscar: ",
            "sUrl":           "",
            "sInfoThousands":  ",",
            "sLoadingRecords": "Cargando...",
            "oPaginate": {
                "sFirst":    "Primero",
                "sLast":    "Último",
                "sNext":    "Siguiente",
                "sPrevious": "Anterior"
            },
            "oAria": {
                "sSortAscending":  ": Activar para ordenar la columna de manera ascendente",
                "sSortDescending": ": Activar para ordenar la columna de manera descendente"
            }
        }
    });

    const fecha_inicio = document.getElementById('date-filter-desde');
    const fecha_fin = document.getElementById('date-filter-hasta');

    let intervalo = {min: fecha_inicio.value, inicio: fecha_inicio.value, fin: fecha_fin.value, max: fecha_fin.value};

    fecha_inicio.addEventListener('change', async (fecha_event) => {
        let ini = fecha_inicio.value;
        
        await new Promise(resolve => setTimeout(resolve, 500)) // Esperar a otros cambios en los siguientes 500ms
        if (ini != fecha_inicio.value) return; // Si se ha vuelto a cambiar, no seguir
        
        if (ini < intervalo.min) { // Se amplia intervalo
            // Pedir datos de asistencias de la fecha a app, desde el mínimo nuevo al mínimo anterior
            let new_content = (await endpoint.post({ fecha: ini, fecha_max: intervalo.min })
                .res(async response => { 
                    return (response.headers.get('Content-Type').includes('application/json')) ? response.json() : response.text();
                })).asistencias;
            intervalo.min = ini;
            for (let i = 0; i < new_content.length; i++) {
                let asist = new_content[i];
                let clases = asist.clase[0];
                if (asist.motivo == null) asist.motivo = ''; // asist.clase es un array de todas las clases que pueden ser, no sé si eso cambia algo. No
                for (let j = 1; j < asist.clase.length; j++) {clases += ', ' + asist.clase[j]}
                tabla.row.add([asist.fecha, asist.hora, clases, asist.docente]);
            }
            tabla.draw(false);
        }
        else if (ini >= intervalo.min && ini <= intervalo.fin && ini != intervalo.inicio) {
            tabla.search((val, val1) => {
                let ISOdate = val1[0].split('/').reverse().join('-');
                return ISOdate >= ini && ISOdate <= intervalo.fin;
            });
            tabla.draw(true);
        }
        intervalo.inicio = ini;
    });

    fecha_fin.addEventListener('change', async (fecha_event) => {
        let fin = fecha_fin.value;
        
        await new Promise(resolve => setTimeout(resolve, 500)) // Esperar a otros cambios en los siguientes 500ms
        if (fin != fecha_fin.value) return; // Si se ha vuelto a cambiar, no seguir

        if (fin > intervalo.max) { // Se amplia intervalo
            // Pedir datos de asistencias de la fecha a app, desde el máximo anterior hasta el máximo nuevo
            let new_content = (await endpoint.post({ fecha: intervalo.max, fecha_max: fin })
                .res(async response => { 
                    return (response.headers.get('Content-Type').includes('application/json')) ? response.json() : response.text();
                })).asistencias;
            intervalo.max = fin;
            for (let i = 0; i < new_content.length; i++) {
                let asist = new_content[i];
                let clases = asist.clase[0];
                if (asist.motivo == null) asist.motivo = ''; // asist.clase es un array de todas las clases que pueden ser, no sé si eso cambia algo. No
                for (let j = 1; j < asist.clase.length; j++) {clases += ', ' + asist.clase[j]}
                tabla.row.add([asist.fecha, asist.hora, asist.espacio, clases, asist.docente]);
            }
            tabla.draw(false);
        }
        else if (fin <= intervalo.max && fin >= intervalo.inicio && fin != intervalo.fin) {
            tabla.search((val, val1) => {
                let ISOdate = val1[0].split('/').reverse().join('-');
                return ISOdate <= fin && ISOdate >= intervalo.inicio;
            });
            tabla.draw(true);
        }
        intervalo.fin = fin;
    });
})