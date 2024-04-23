window.addEventListener('DOMContentLoaded', event => {

    const add_button = document.getElementById('add-nfc-button');
    const remove_button = document.getElementById('remove-nfc-button');
    let iteration = 1;
    
    add_button.addEventListener('click', () => {
        
        iteration++;

        let div = document.createElement("div");
        div.className = "form-floating mb-3";

        let input = document.createElement("input");
        input.type = "text";
        input.className = "form-control";
        input.pattern = "^\\d+$";
        input.name = `nfc${iteration}`;
        input.id = `nfc${iteration}`;

        let label = document.createElement("label");
        label.for = `nfc${iteration}`;
        label.textContent = "UID";

        div.appendChild(input);
        div.appendChild(label);
        
        add_button.parentNode.insertBefore(div, add_button);

        // Siempre que se ejecute esto, habrá como mínimo un campo que se pueda borrar
        remove_button.className = "btn btn-primary";
    });

    remove_button.addEventListener('click', () => {
        
        if (iteration > 1) {
            iteration--;
    
            deleteBefore(add_button);
        }

        if (iteration == 1) {
            remove_button.className = "btn btn-primary disabled";
        }
    });
});

function deleteBefore(referenceNode) {
    let parentNode = referenceNode.parentNode;
    let previousNode = referenceNode.previousSibling;

    if (previousNode) {
        parentNode.removeChild(previousNode);
    }
}