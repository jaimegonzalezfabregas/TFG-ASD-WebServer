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

    const fecha = document.getElementById('date-filter');
    const estado = $('#status-filter').select2();
    
    fecha.addEventListener('change', async (fecha_event) => { // Cuando cambia la fecha filtrar por fecha y estado
        tabla.clear();
        // Pedir datos de asistencias de la fecha a app
        let new_content = (await endpoint.post({ fecha: fecha.value })
            .res(async response => { 
                return (response.headers.get('Content-Type').includes('application/json')) ? response.json() : response.text();
            })).asistencias;
        console.log(new_content);
        for (let i = 0; i < new_content.length; i++) {
            let asist = new_content[i];
            let clases = asist.clase[0];
            if (asist.motivo == null) asist.motivo = ''; // asist.clase es un array de todas las clases que pueden ser, no sé si eso cambia algo. No
            for (let j = 1; j < asist.clase.length; j++) {clases += ', ' + asist.clase[j]}
            tabla.row.add([asist.hora, asist.espacio, clases, asist.docente, asist.estado, asist.motivo]);
        }
        tabla.draw(false);
        // Emitir un cambio en estado para que vuelva a filtrar el estado
        estado.trigger('change');
    });
    
    estado.on('change', (estado_event) => { // Cuando cambia el estado tiene que cambiar solo por estado, la fecha ya deberÃa estar filtrado
        if (estado.val() == 'Todas') {
            tabla.search((val, val1) => {
                return true;
            })
        }
        else {
            tabla.search((val, val1) => {
                return val1[4] == estado.val();
            })
        }
        tabla.draw(true);
    });
})