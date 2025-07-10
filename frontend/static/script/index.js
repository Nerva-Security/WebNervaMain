// Insertar las ultimas dos fotos de galeria en el index
function cargarImagenes () {
    fetch('/blog/entradas?page=1&limit=2')
    .then(response => response.json())
    .then(entries => {
        const galeriaInicio = document.getElementById('galeria-inicio');
        galeriaInicio.innerHTML = '';

        entries.forEach(entry => {
            const imgElement = document.createElement('img');
            imgElement.src = entry.imagen;
            imgElement.alt = entry.titulo;
            imgElement.dataset.entryId = entry.id;

            galeriaInicio.appendChild(imgElement);
        });
    })
    .catch(error => console.error('Error al cargar la galería:', error));
}

// Cargar las imágenes al cargar la página
document.addEventListener('DOMContentLoaded', cargarImagenes);

// Mostrar y ocultar el formulario de contacto
document.addEventListener('DOMContentLoaded', function () {
    const botonEmail = document.getElementById('email-icon');
    const formulario = document.getElementById('contact-form');

    botonEmail.addEventListener('click', () => {
        formulario.classList.toggle('mostrar');
    });
});