window.addEventListener('DOMContentLoaded', event => {
    
    const filter_button = document.getElementById('filter-button'); // boton filtrar
    const feedback_carga = document.getElementById('mensaje_carga');
    
    
    filter_button.addEventListener('click', async (click_event) => {    
        feedback_carga.style.display = "block";
    });
})