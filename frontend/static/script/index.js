/* Cargar imágenes de las galería: 
Inserta las últimas dos fotos de galeria en "galeria-inicio" */ 
function cargarImagenes () {
    fetch('/blog/entradas?page=1&limit=2') // Petición al backend
    .then(response => response.json()) // Convertir la respuesta a JSON
    .then(entries => {
        const galeriaInicio = document.getElementById('galeria-inicio'); // Obtener el contenedor de la galería 
        galeriaInicio.innerHTML = ''; // Limpiar el contenido previo

        // Recorrer las entradas y crear elementos de imagen
        entries.forEach(entry => {
            const imgElement = document.createElement('img');
            imgElement.src = entry.imagen;
            imgElement.alt = entry.titulo;
            imgElement.dataset.entryId = entry.id;

            // Insertar la imagen en el contenedor de la galería
            galeriaInicio.appendChild(imgElement);
        });
    })
    .catch(error => console.error('Error al cargar la galería:', error));
}

// Cargar las imágenes al cargar la página: Ejecuta la función cargarImagenes
document.addEventListener('DOMContentLoaded', cargarImagenes);

// Mostrar y ocultar el formulario de contacto
document.addEventListener('DOMContentLoaded', function () {

    // Obtener el botón y el formulario
    const botonEmail = document.getElementById('email-icon'); 
    const formulario = document.getElementById('contact-form');

    // Mostrar el formulario al hacer clic en el botón
    botonEmail.addEventListener('click', () => {
        formulario.classList.toggle('mostrar');
    });
});