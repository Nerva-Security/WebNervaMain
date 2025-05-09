const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 5000;

//Configuración Cloudinary - Multer - dotenv
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const dotenv = require('dotenv');
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'blog_nervasec', 
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 800, height: 600, crop: 'limit' }],
  },
});

const upload = multer({ storage: storage });

// Servir archivos estáticos (css, js, imágenes)
app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));

// Para manejar las solicitudes JSON
app.use(express.json());

// Ruta principal que sirve el index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'index.html'));
});

// Ruta para la sección "Acerca de" (acerca.html)
app.get('/acerca', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'acerca.html'));
});

// Ruta para la sección "Servicios" (servicios.html)
app.get('/servicios', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'servicios.html'));
});

// Ruta para la sección "Blog" (blog.html)
app.get('/blog', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'blog.html'));
});

// Ruta para la sección "Galería" (galeria.html)
app.get('/galeria', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'galeria.html'));
});

// Ruta para leer el archivo JSON
app.get('/blog/entradas', (req, res) => {
  fs.readFile(path.join(__dirname, 'blog.json'), 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al leer el archivo JSON');
    }

    if (data.trim() === '') {
      res.json([]);
    } else {
      res.json(JSON.parse(data));
    }
  });
});

// Ruta para crear una nueva entrada en el archivo JSON
app.post('/blog/entradas', (req, res) => {
  const newEntry = req.body;

  // Generar un ID único y aleatorio
  newEntry.id = Math.floor(Math.random() * 1000000000); 


  fs.readFile(path.join(__dirname, 'blog.json'), 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al leer el archivo JSON');
    }

    let entries = [];

    // Si el archivo no está vacío, parsear el JSON
    if (data.trim() !== '') {
      try {
        entries = JSON.parse(data);
      } catch (parseErr) {
        console.error('Error al parsear el JSON', parseErr);
        return res.status(500).send('Error al parsear el archivo JSON');
      }
    }

    // Agregar la nueva entrada
    entries.push(newEntry);

    // Escribir el archivo con formato JSON
    fs.writeFile(path.join(__dirname, 'blog.json'), JSON.stringify(entries, null, 2), (err) => {
      if (err) {
        console.error('Error al guardar la entrada en el archivo JSON', err);
        return res.status(500).send('Error al guardar la entrada en el archivo JSON');
      }
      res.status(201).json(newEntry);
    });
  });
});

// Ruta para eliminar una entrada del archivo JSON
app.delete('/blog/entradas/:id', (req, res) => {
  const entryId = req.params.id;
  fs.readFile(path.join(__dirname, 'blog.json'), 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al leer el archivo JSON');
    }
    let entries = JSON.parse(data);
    entries = entries.filter(entry => entry.id !== parseInt(entryId));
    fs.writeFile(path.join(__dirname, 'blog.json'), JSON.stringify(entries, null, 2), (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error al guardar el archivo JSON');
      }
      res.status(200).send('Entrada eliminada con éxito');
    });
  });
});


// Ruta para obtener una entrada específica por su ID
app.get('/blog/entradas/:id', (req, res) => {
  const entryId = req.params.id;
  fs.readFile(path.join(__dirname, 'blog.json'), 'utf8', (err, data) => {
    if (err) {
      console.error('Error al leer el archivo', err);
      return res.status(500).send('Error al leer el archivo JSON');
    }
    const entries = JSON.parse(data);
    const entry = entries.find(entry => entry.id === parseInt(entryId));

    if (entry) {
      res.json(entry);
    } else {
      res.status(404).json({ error: 'Entrada no encontrada' });
    }
  });
});

// Ruta para editar una entrada del blog
app.put('/blog/entradas/:id', (req, res) => {
  const entryId = req.params.id; 
  const updatedEntry = req.body; 

  // Leer el archivo de entradas
  fs.readFile(path.join(__dirname, 'blog.json'), 'utf8', (err, data) => {
    if (err) {
      console.error('Error al leer el archivo', err);
      return res.status(500).send('Error al leer el archivo JSON');
    }

    try {
      let entries = JSON.parse(data);
      
      // Encontrar la entrada a actualizar
      const entryIndex = entries.findIndex(entry => entry.id === parseInt(entryId));

      if (entryIndex !== -1) {
        entries[entryIndex] = {...updatedEntry}; 

        // Escribir de nuevo en el archivo JSON
        fs.writeFile(path.join(__dirname, 'blog.json'), JSON.stringify(entries, null, 2), (err) => {
          if (err) {
            console.error('Error al guardar el archivo', err);
            return res.status(500).send('Error al guardar el archivo JSON');
          }
          res.status(200).json(entries[entryIndex]);
        });
      } else {
        return res.status(404).json({ error: 'Entrada no encontrada' });
      }
    } catch (error) {
      console.error('Error al parsear el JSON:', error);
      return res.status(500).send('Error al parsear el archivo JSON');
    }
  });
});

// Ruta para subir imágenes a Cloudinary
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file || !req.file.path) {
    return res.status(400).json({ error: 'No se subió ninguna imagen' });
  }
  res.json({ imageUrl: req.file.path });
});


// Hacer que el servidor escuche en el puerto 5000
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
