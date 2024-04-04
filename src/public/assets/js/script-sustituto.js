window.addEventListener('DOMContentLoaded', event => {

    const table = document.getElementById('datatable');
    console.log(table);
    console.log(table.rows, table.rows.length);
    for (let i = 0; i < table.rows.length - 1; i++) {
        const sustituto_option = document.getElementById(`checkSustituto${i}`);
        const sustitutos = document.getElementById(`sustituto_filter${i}`);
    
        sustituto_option.addEventListener('click', click_event => {
            sustitutos.disabled = !sustituto_option.checked;
        });
    }
});