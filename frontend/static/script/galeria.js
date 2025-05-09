// Cargar las imágenes en la galería del blog 
fetch('/blog/entradas')
    .then(response => response.json())
    .then(entries => {
        const galeriaContainer = document.getElementById('galeria');
        galeriaContainer.innerHTML = '';

        entries.forEach(entry => {
            const imgElement = document.createElement('img');
            imgElement.src = entry.imagen;
            imgElement.alt = entry.titulo;
            imgElement.dataset.entryId = entry.id; 

            galeriaContainer.insertBefore(imgElement, galeriaContainer.firstChild);
        });
    })
    .catch(error => console.error('Error al cargar la galería:', error));

// Cargar las imágenes al cargar la página
document.addEventListener('DOMContentLoaded', cargarGaleria);