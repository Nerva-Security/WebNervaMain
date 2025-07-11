// Variables generales del blog
const addEntryButton = document.getElementById('add-entry'); // Botón para añadir una entrada
const blogForm = document.getElementById('blog-form'); // Formulario del blog
const blogFormContainer = document.querySelector('.blog-form'); // Contenedor del formulario
const blogCard = document.getElementById('blog-card'); // Contenedor de las entradas del blog

// Variables del formulario
const tituloInput = document.getElementById('titulo'); // Input para el título de la entrada
const contenidoInput = document.getElementById('contenido'); // Input para el contenido de la entrada
const imagenInput = document.getElementById('imagen'); // Input para la imagen de la entrada

// Variable para la fecha
const fecha = new Date().toLocaleString('es-ES', {
  dateStyle: 'medium',
});

// Variables para controlar el estado de edición
let isEditing = false; // Indica si estamos editando una entrada
let editingId = null; // ID de la entrada que estamos editando
let existingImage = null; // URL de la imagen existente (si la hay)

// Variables para manejar la paginación
const entryPagesSelect = document.getElementById('entry-pages'); // Selector para el número de entradas por página
const loadMoreButton = document.getElementById('load-more'); // Botón para cargar más entradas
let currentPage = 1; // Página actual de las entradas
let entriesPerPage = 10; // Número de entradas por página
let moreEntriesAvailable = true; // Indica si hay más entradas disponibles para cargar

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

// Seleccionar el número de entradas por página
entryPagesSelect.addEventListener('change', function () {
  entriesPerPage = parseInt(this.value);
  currentPage = 1;
  cargarEntradas(currentPage, entriesPerPage);
});

// Función para cargar las entradas del blog desde el servidor 
function cargarEntradas(page = 1, limit = 10) {
  fetch(`/blog/entradas?page=${page}&limit=${limit}`) 
    .then(response => response.json())
    .then(entries => { 
      if (page === 1) blogCard.innerHTML = '';
      entries.forEach(entry => {
        const entryElement = document.createElement('div');
        entryElement.classList.add('blog-entry');
        entryElement.setAttribute("id", `entrada-${entry.id}`);

        // Dividir el contenido en párrafos
        const parrafos = entry.contenido.split('\n').filter(p => p.trim() !== '');
        const primerParrafo = parrafos[0] ? `<p>${parrafos[0]}</p>` : '';
        const restoParrafos = parrafos.slice(1).map(p => `<p>${p}</p>`).join('');

        // Crear el contenido de la entrada y añadirla al contenedor
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
        blogCard.appendChild(entryElement);
      });

      // Manejar si hay más entradas disponibles
      moreEntriesAvailable = entries.length === limit;
      if (moreEntriesAvailable) {
        loadMoreButton.style.display = 'block';
      } else {
        loadMoreButton.style.display = 'none';
      }
    })
    .catch(error => {
      console.error('Error al cargar las entradas:', error);
      alert('Hubo un problema al cargar las entradas');
    });
}

// Cargar entradas al cargar la página
document.addEventListener('DOMContentLoaded', function () {
  // Scroll automático si hay un hash en la URL, sino, carga normal
      const hash = window.location.hash;
      if (hash) {
        cargarEntradas(1, 1000);
        setTimeout(() => {
          const entryElement = document.querySelector(hash);
          if (entryElement) {
            entryElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        }, 500); 
      } else {
        cargarEntradas(currentPage, entriesPerPage);
      }
});

// Crear o editar una entrada en el blog
blogForm.addEventListener('submit', function (event) {
  event.preventDefault();

  // Usar la imagen existente si no hay nueva imagen seleccionada
  let imageUrl = existingImage;

  // Si hay una nueva imagen seleccionada, subirla
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

        // Si estamos editando, usamos PUT, si no, usamos POST
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
              cargarEntradas(currentPage, entriesPerPage);
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
              cargarEntradas(currentPage, entriesPerPage);
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
          cargarEntradas(currentPage, entriesPerPage);
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
          cargarEntradas(currentPage, entriesPerPage);
        })
        .catch(() => {
          alert('Hubo un problema al crear la entrada');
        });
    }
  }
});

// Eliminar una entrada del blog
blogCard.addEventListener('click', function (event) {
  const deleteButton = event.target.closest('.delete-entry');
  if (deleteButton) {
    const entryId = deleteButton.dataset.id;
    fetch(`/blog/entradas/${entryId}`, {
      method: 'DELETE',
    })
      .then(response => response.text())
      .then(message => {
        alert(message);
        cargarEntradas(currentPage, entriesPerPage);
      })
      .catch(error => {
        console.error('Error al eliminar la entrada:', error);
      });
  }
});

// Editar una entrada del blog
blogCard.addEventListener('click', function (event) {
  const editButton = event.target.closest('.edit-entry');
  if (editButton) {
    const entryId = editButton.dataset.id;
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

  // Si se hace clic en el botón "Leer más"
  if (readMoreButton) {
    const entryElement = readMoreButton.closest('.blog-entry');
    const hiddenContent = entryElement.querySelector('.hidden-content');

    // Alternar la visibilidad del contenido
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

// Cargar más entradas al hacer clic en "Cargar más"
loadMoreButton.addEventListener('click', function () {
  currentPage++;
  cargarEntradas(currentPage, entriesPerPage);
});