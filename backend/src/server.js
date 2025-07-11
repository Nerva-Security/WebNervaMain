const express = require('express'); // Importar las dependencias necesarias
const path = require('path'); // Importar el módulo 'path' para manejar rutas de archivos
const fs = require('fs'); // Importar el módulo 'fs' para manejar el sistema de archivos
const fsp = require('fs').promises; // Importar el módulo 'fs' con promesas
const multer = require('multer'); // Importar multer para manejar la subida de archivos
const cloudinary = require('cloudinary').v2; // Importar Cloudinary para manejar el almacenamiento en la nube
const { CloudinaryStorage } = require('multer-storage-cloudinary'); // Importar CloudinaryStorage para manejar el almacenamiento en Cloudinary
const dotenv = require('dotenv'); // Importar dotenv para manejar variables de entorno
const { google } = require('googleapis'); // Importar Google APIs para manejar Google Calendar

dotenv.config(); // Cargar las variables de entorno desde el archivo .env

const app = express(); // Crear una instancia de Express
const PORT = 5000; // Puerto donde el servidor escuchará

// Configuración de Cloudinary y multer. Para la subida de imagenes a Cloudinary y almacenamiento en la nube
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

//Configuración de Google Calendar API
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];
const TOKEN_PATH = path.join(process.cwd(), 'token.json'); // Ruta donde se guardará el token de acceso
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json'); // Ruta donde se guardarán las credenciales de la API

// Inicializar el cliente de OAuth2 de Google
let oAuth2Client;

// Cargar las credenciales de la API de Google Calendar
fs.readFile(CREDENTIALS_PATH, (err, content) => {
  if (err) {
    console.error('Error al cargar credentials.json:', err);
    return;
  }
  const credentials = JSON.parse(content);
  const { client_secret, client_id, redirect_uris } = credentials.web;
  oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
});

// Función para autorizar al usuario con Google Calendar
async function authorize() {
  const content = await fsp.readFile(CREDENTIALS_PATH);
  const credentials = JSON.parse(content);
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  try {
    const token = await fsp.readFile(TOKEN_PATH, 'utf8');
    oAuth2Client.setCredentials(JSON.parse(token));
    return oAuth2Client;
  } catch (err) {
    return null;
  }
}

// Función para obtener eventos del calendario de Google
async function listEvents(auth) {
  const calendar = google.calendar({ version: 'v3', auth });
  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  });

  const items = res.data.items || [];

  // Transformar al formato que espera FullCalendar
  const events = items.map(event => ({
    id: event.id,
    description: event.description,
    title: event.summary,
    start: event.start.dateTime,
    end: event.end.dateTime,
  }));

  return events;
}


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
  const page = parseInt(req.query.page) || 1; // Página solicitada
  const limit = parseInt(req.query.limit) || 10; // Número de entradas por página

  // Leer el archivo JSON
  fs.readFile(path.join(__dirname, 'blog.json'), 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al leer el archivo JSON');
    }

    // Si el archivo no está vacío, parsear el JSON
    let entries = [];
    if (data.trim() !== '') {
      try {
        entries = JSON.parse(data);
      } catch (parseErr) {
        console.error('Error al parsear el JSON', parseErr);
        return res.status(500).send('Error al parsear el archivo JSON');
      }
    }

    // Manejar paginación
    const start = (page - 1) * limit;
    const paginatedEntries = entries.slice(start, start + limit);
    res.json(paginatedEntries);

  });
});

// Ruta para crear una nueva entrada en el archivo JSON
app.post('/blog/entradas', (req, res) => {
  const newEntry = req.body;

  // Generar un ID único y aleatorio
  newEntry.id = Math.floor(Math.random() * 1000000000);

  // Leer el archivo JSON y agregar la nueva entrada
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
    entries.unshift(newEntry);

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

  // Leer el archivo JSON 
  fs.readFile(path.join(__dirname, 'blog.json'), 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al leer el archivo JSON');
    }
    let entries = JSON.parse(data);
    entries = entries.filter(entry => entry.id !== parseInt(entryId));

    // Escribir el archivo JSON actualizado
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

  // Leer el archivo JSON para encontrar la entrada por ID
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
        entries[entryIndex] = { ...updatedEntry };

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

// Ruta para manejar la autenticación de Google Calendar
app.get('/auth', (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', 
  });
  res.redirect(authUrl);
});

// Ruta de callback para manejar la respuesta de Google después de la autenticación
app.get('/auth/callback', async (req, res) => {
  const code = req.query.code;
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    await fsp.writeFile(TOKEN_PATH, JSON.stringify(tokens));
    res.redirect('/servicios');
  } catch (err) {
    console.error('Error intercambiando el código:', err);
    res.status(500).send('Error en la autenticación');
  }
});

// Ruta para cargar los eventos de Google Calendar
app.get('/calendar/events', async (req, res) => {
  try {
    const auth = await authorize();
    if (!auth) return res.status(401).send('No autenticado con Google');
    const events = await listEvents(auth);
    res.json(events);
  } catch (error) {
    console.error('Error obteniendo eventos:', error);
    res.status(500).send('Error al obtener eventos');
  }
});

//Ruta para crear un nuevo evento en Google Calendar
app.post('/calendar/create-event', async (req, res) => {
  try {
    const auth = await authorize();
    if (!auth) return res.status(401).send('No autenticado con Google');

    const calendar = google.calendar({ version: 'v3', auth });
    const { title, date, description, startTime, endTime } = req.body;

    if (!title || !date || !description || !startTime || !endTime) {
      return res.status(400).json({ message: 'Faltan datos: title, date, description, startTime o endTime' });
    }

    // Crear el evento con los datos obtenidos
    const event = {
      summary: title,
      description: description || '',
      start: {
        dateTime: `${date}T${startTime}`,
        timeZone: 'Europe/Madrid',
      },
      end: {
        dateTime: `${date}T${endTime}`,
        timeZone: 'Europe/Madrid',
      },
    };

    // Insertar el evento en el calendario
    await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });
    
    res.status(200).json({ message: 'Evento creado correctamente' });
  } catch (error) {
    console.error('Error creando evento:', error);
    res.status(500).json({ message: 'Error al crear evento' });
  }
});

// Ruta para eliminar un evento de Google Calendar
app.delete('/calendar/delete-event/:id', async (req, res) => {
  try {
    const auth = await authorize();
    const calendar = google.calendar({ version: 'v3', auth });

    // Eliminar el evento
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: req.params.id
    });

    res.status(200).json({ message: 'Evento eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando evento:', error);
    res.status(500).json({ message: 'Error al eliminar evento' });
  }
});


// Servir archivos estáticos (css, js, imágenes)
app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));

// Hacer que el servidor escuche en el puerto 5000
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
