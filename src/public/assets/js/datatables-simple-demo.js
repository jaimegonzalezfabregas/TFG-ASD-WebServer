window.addEventListener('DOMContentLoaded', event => {
    // Simple-DataTables
    // https://github.com/fiduswriter/Simple-DataTables/wiki

    const datatablesSimple = document.getElementById('datatablesSimple');
    if (datatablesSimple) {
        new simpleDatatables.DataTable(datatablesSimple, {
            labels: {
                placeholder: "Buscar...",
                searchTitle: "Buscando en la tabla",
                pageTitle: "Página {page}",
                perPage: "entradas por página",
                noRows: "No se han encontrado entradas",
                info: "Mostrando entradas {start} - {end} de {rows}",
                noResults: "Ningún resultado encaja con la búsqueda"
            }
        });
    }
});
