// Cargar las imágenes en la galería del blog 
function cargarGaleria() {
    fetch('/blog/entradas?page=1&limit=1000')
    .then(response => response.json())
    .then(entries => {
        const galeriaContainer = document.getElementById('galeria');
        galeriaContainer.innerHTML = '';

        entries.forEach(entry => {
            const imgElement = document.createElement('img');
            imgElement.src = entry.imagen;
            imgElement.alt = entry.titulo;
            imgElement.dataset.entryId = entry.id;

            imgElement.addEventListener('click', () => {
                window.location.href = `/blog.html#entrada-${entry.id}`;
            });

            galeriaContainer.appendChild(imgElement);
        });
    })
    .catch(error => console.error('Error al cargar la galería:', error));
}

// Cargar las imágenes al cargar la página
document.addEventListener('DOMContentLoaded', cargarGaleria);