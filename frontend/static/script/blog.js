// Variables generales del blog
const addEntryButton = document.getElementById('add-entry');
const blogForm = document.getElementById('blog-form');
const blogFormContainer = document.querySelector('.blog-form');
const blogCard = document.getElementById('blog-card');

// Variables del formulario
const tituloInput = document.getElementById('titulo');
const contenidoInput = document.getElementById('contenido');
const imagenInput = document.getElementById('imagen');

// Variable para la fecha
const fecha = new Date().toLocaleString('es-ES', {
  dateStyle: 'medium',
});

// Variables para controlar el estado de edición
let isEditing = false;
let editingId = null;
let existingImage = null;

// Función para reiniciar el formulario
function resetForm() {
  blogForm.reset();
  blogFormContainer.style.display = 'none';
  let isEditing = false;
  let editingId = null;
  let existingImage = null;
}

// Ocultar el formulario por defecto al cargar la página
blogFormContainer.style.display = 'none';

// Mostrar el formulario al hacer clic en "Añadir entrada"
addEntryButton.addEventListener('click', function () {
  blogFormContainer.style.display = 'block';
  isEditing = false;
  editingId = null;
  existingImage = null;
  blogForm.reset();

  // Limpiar la vista previa de la imagen
  const imgPreview = document.getElementById('img-preview');
  imgPreview.innerHTML = ''; 
});

// Función para cargar las entradas del blog desde el servidor
function cargarEntradas() {
  fetch('/blog/entradas')
    .then(response => response.json())
    .then(entries => {
      blogCard.innerHTML = '';
      entries.forEach(entry => {
        const entryElement = document.createElement('div');
        entryElement.classList.add('blog-entry');
        entryElement.setAttribute("id", `entrada-${entry.id}`);

        // Dividir el contenido en párrafos
        const parrafos = entry.contenido.split('\n').filter(p => p.trim() !== '');
        const primerParrafo = parrafos[0] ? `<p>${parrafos[0]}</p>` : '';
        const restoParrafos = parrafos.slice(1).map(p => `<p>${p}</p>`).join('');

        entryElement.innerHTML = `
          <img src="${entry.imagen}" class="entry-img">
          <div class="entry-content">
            <h2>${entry.titulo}</h2>
            <p class="entry-fecha">${entry.fecha}</p>
            <div class="entry-txt">
                ${primerParrafo}
                <div class="hidden-content" style="display: none;">${restoParrafos}</div>
              </div>
            <button class="edit-entry" data-id="${entry.id}"><i class="fa-solid fa-pencil"></i></button>
            <button class="delete-entry" data-id="${entry.id}"><i class="fa-solid fa-trash"></i></button>
            <button class="read-more"><i class="fa-solid fa-eye"></i></button>
          </div>
          `;
        blogCard.insertBefore(entryElement, blogCard.firstChild);
      });

      // Scroll automático si hay un hash en la URL
      const hash = window.location.hash;
      if (hash) {
        const entryElement = document.querySelector(hash);
        if (entryElement) {
          entryElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }

    })
    .catch(error => {
      console.error('Error al cargar las entradas:', error);
      alert('Hubo un problema al cargar las entradas');
    });
}

// Cargar entradas al cargar la página
document.addEventListener('DOMContentLoaded', cargarEntradas);

// Crear o editar una entrada en el blog
blogForm.addEventListener('submit', function (event) {
  event.preventDefault();

  // Usar la imagen existente si no hay nueva imagen seleccionada
  let imageUrl = existingImage;

  if (imagenInput.files.length > 0) {
    const formData = new FormData();
    formData.append('image', imagenInput.files[0]);

    subirImagen(formData)
      .then(url => {
        if (!url) return; 

        imageUrl = url; 

        // Crear o actualizar la entrada con la imagen obtenida
        const entry = {
          titulo: tituloInput.value,
          contenido: contenidoInput.value,
          fecha: fecha,
          imagen: imageUrl, 
        };

        if (isEditing) {
          // Editar entrada con PUT
          fetch(`/blog/entradas/${editingId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...entry, id: editingId }),
          })
            .then(response => response.json())
            .then(() => {
              alert('Entrada actualizada con éxito');
              resetForm();
              cargarEntradas();
              cargarGaleria();
            })
            .catch(() => {
              alert('Hubo un problema al actualizar la entrada');
            });
        } else {
          // Crear nueva entrada con POST
          fetch('/blog/entradas', {
            method: 'POST',
            body: JSON.stringify(entry),
            headers: {
              'Content-Type': 'application/json',
            },
          })
            .then(response => response.json())
            .then(() => {
              alert('Entrada guardada con éxito');
              resetForm();
              cargarEntradas();
              cargarGaleria();
            })
            .catch(() => {
              alert('Hubo un problema al crear la entrada');
            });
        }
      })
      .catch(() => {
        alert('Hubo un problema al subir la imagen');
      });
  } else {
    // Si no hay nueva imagen, usamos la imagen existente
    const entry = {
      titulo: tituloInput.value,
      contenido: contenidoInput.value,
      fecha: fecha,
      imagen: imageUrl, // Usamos la imagen existente
    };

    if (isEditing) {
      // Editar entrada con PUT
      fetch(`/blog/entradas/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...entry, id: editingId }),
      })
        .then(response => response.json())
        .then(() => {
          alert('Entrada actualizada con éxito');
          resetForm();
          cargarEntradas();
        })
        .catch(() => {
          alert('Hubo un problema al actualizar la entrada');
        });
    } else {
      // Crear nueva entrada con POST
      fetch('/blog/entradas', {
        method: 'POST',
        body: JSON.stringify(entry),
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then(response => response.json())
        .then(() => {
          alert('Entrada guardada con éxito');
          resetForm();
          cargarEntradas();
        })
        .catch(() => {
          alert('Hubo un problema al crear la entrada');
        });
    }
  }
});

// Eliminar una entrada del blog
blogCard.addEventListener('click', function (event) {
  if (event.target.classList.contains('delete-entry')) {
    const entryId = event.target.dataset.id;
    fetch(`/blog/entradas/${entryId}`, {
      method: 'DELETE',
    })
      .then(response => response.text())
      .then(message => {
        alert(message);
        cargarEntradas();
      })
      .catch(error => {
        console.error('Error al eliminar la entrada:', error);
      });
  }
});

// Editar una entrada del blog
blogCard.addEventListener('click', function (event) {
  if (event.target.classList.contains('edit-entry')) {
    const entryId = event.target.dataset.id;
    fetch(`/blog/entradas/${entryId}`)
      .then(response => response.json())
      .then(entry => {
        // Rellenar el formulario con los datos actuales de la entrada
        tituloInput.value = entry.titulo;
        contenidoInput.value = entry.contenido;
        blogFormContainer.style.display = 'block';

        // Activar modo edición
        isEditing = true;
        editingId = entry.id;
        existingImage = entry.imagen;

        // Mostrar la imagen existente
        const imgPreview = document.getElementById('img-preview');
        imgPreview.innerHTML = `
        <img src="${entry.imagen}" alt="Imagen de la entrada" class="img-preview">`;	
      })
      .catch(error => {
        console.error('Error al cargar la entrada para editar:', error);
        alert('Hubo un problema al cargar la entrada para editar');
      });
  }
});

// Mostrar u ocultar el contenido con el botón "Leer más"
blogCard.addEventListener('click', function (event) {
  const readMoreButton = event.target.closest('.read-more');

  if (readMoreButton) {
    const entryElement = readMoreButton.closest('.blog-entry');
    const hiddenContent = entryElement.querySelector('.hidden-content');

    if (hiddenContent.style.display === 'none') {
      hiddenContent.style.display = 'block';
      readMoreButton.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
    } else {
      hiddenContent.style.display = 'none';
      readMoreButton.innerHTML = '<i class="fa-solid fa-eye"></i>';
    }
  }
});

// Función para subir la imagen a Cloudinary
function subirImagen(formData) {
  return fetch('/upload', {
    method: 'POST',
    body: formData,
  })
    .then(response => response.json())
    .then(data => {
      return data.imageUrl; // URL de la imagen subida
    })
    .catch(error => {
      console.error('Error al subir la imagen:', error);
      alert('Hubo un problema al subir la imagen');
      return null;
    });
}