window.addEventListener('DOMContentLoaded', event => {

    const fecha = document.getElementById('meeting_time');
    let clases = document.getElementById('clase_filter');

    // Guardamos todas las clases por fecha
    const clases_fecha = {};
    for (const option of clases.options) {
        const fechaValue = option.getAttribute('fecha');
        if (!clases_fecha[fechaValue]) {
            clases_fecha[fechaValue] = [];
        }
        clases_fecha[fechaValue].push(option);
    }
        
    // Quitar las opciones del select (y todo lo que contenga)
    clases.innerHTML = '';

    // Añadir las opciones de la fecha al select
    const optionsToShow = clases_fecha[fecha.value] || [];
    for (const option of optionsToShow) {
        clases.appendChild(option);
    }

    fecha.addEventListener('change', change_event => {
        
        // Quitar las opciones del select (y todo lo que contenga)
        clases.innerHTML = '';

        // Añadir las opciones de la fecha al select
        const optionsToShow = clases_fecha[fecha.value] || [];
        for (const option of optionsToShow) {
            clases.appendChild(option);
        }
    });
});