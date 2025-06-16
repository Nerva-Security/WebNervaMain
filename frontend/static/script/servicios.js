// Variables generales
const infoButtons = document.querySelectorAll(".info-serv");

//Función para mostrar/ocultar detalles de los servicios con transición suave
document.addEventListener("DOMContentLoaded", () => { 

    infoButtons.forEach(button => {
        button.addEventListener("click", () => {
            const pack = button.closest(".serv-pack");
            const details = pack.querySelector(".pack-details");

            details.classList.toggle("visible");
            button.textContent = details.classList.contains("visible") ? "Ver menos" : "Saber más";
        });
    });
});
