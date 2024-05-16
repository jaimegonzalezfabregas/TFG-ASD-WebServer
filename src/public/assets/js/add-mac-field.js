window.addEventListener('DOMContentLoaded', event => {

    const add_button = document.getElementById('add-mac-button');
    const remove_button = document.getElementById('remove-mac-button');
    let iteration = 1;
    
    add_button.addEventListener('click', () => {
        
        iteration++;

        let div = document.createElement("div");
        div.className = "form-floating mb-3";

        let input = document.createElement("input");
        input.type = "text";
        input.className = "form-control";
        input.pattern = "^([0-9a-fA-F]{2}[:]){5}([0-9a-fA-F]{2})$";
        input.name = `mac${iteration}`;
        input.id = `mac${iteration}`;

        let label = document.createElement("label");
        label.for = `mac${iteration}`;
        label.textContent = "MAC";

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