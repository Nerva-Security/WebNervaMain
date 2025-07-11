// Variables generales
const infoButtons = document.querySelectorAll(".info-serv"); // Botones de información de servicios
let calendar; // Variable para el calendario 
const form = document.getElementById('event-form'); // Formulario para crear eventos

// Función para mostrar/ocultar detalles de los servicios con transición suave
document.addEventListener("DOMContentLoaded", () => {

    // Recorrer todos los botones de información
    infoButtons.forEach(button => {
        button.addEventListener("click", () => {
            // Encontrar el contenedor del servicio correspondiente
            const pack = button.closest(".serv-pack");
            const details = pack.querySelector(".pack-details");

            // Alternar la visibilidad de los detalles
            details.classList.toggle("visible");

            // Cambiar el texto del botón según el estado de visibilidad
            button.textContent = details.classList.contains("visible") ? "Ver menos" : "Saber más";
        });
    });
});

// Credenciales de Auth0
const config = {
    domain: "dev-h4b028ls1ve707b4.us.auth0.com", // Dominio de Auth0
    clientId: "FepmRVSIkZfNO2PSG6X72Y7McIzWtPfO", // ID del cliente de Auth0
    audience: "https://dev-h4b028ls1ve707b4.us.auth0.com/api/v2/" // Audiencia de la API de Auth0
};

let auth0Client = null;

// Inicializar el cliente de Auth0
async function initAuth0() {
    auth0Client = await createAuth0Client({
        domain: config.domain,
        client_id: config.clientId,
        audience: config.audience,
        cacheLocation: "localstorage"
    });

    // Redirección después del login
    if (window.location.search.includes("code=") && window.location.search.includes("state=")) {
        await auth0Client.handleRedirectCallback();
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    const isAuthenticated = await auth0Client.isAuthenticated();

    if (isAuthenticated) {
        const user = await auth0Client.getUser();
    }
}

// Iniciar sesión al pulsar "Seleccionar"
function configSeleccion() {
    const botones = document.querySelectorAll(".select-serv");
    botones.forEach(boton => {
        boton.addEventListener("click", async () => {
            await auth0Client.loginWithRedirect({
                redirect_uri: window.location.href
            });
        });
    });
}

// Iniciar sesión Auth0 al cargar la página
window.onload = async () => {
    await initAuth0();
    configSeleccion();
};

// Obtenemos los eventos del calendario desde el backend
fetch('/calendar/events')
    .then(async res => {
        if (!res.ok) {
            const errorData = await res.json().catch(() => null);
            throw new Error(errorData?.error || 'Error desconocido');
        }
        return res.json();
    })
    .catch(err => {
        const calendarDiv = document.querySelector('.serv-calendar');
        calendarDiv.innerHTML = `<p>Error cargando eventos.</p>`;
        console.error('Error cargando eventos:', err);
    });

// Configuración de FullCalendar (Para la visualización del calendario de Google)
document.addEventListener('DOMContentLoaded', function () {
    const calendarEl = document.getElementById('calendar'); // Elemento del calendario
    
    // Inicializar el calendario
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth', // Vista inicial del calendario
        fixedWeekCount: false, // No mostrar semanas vacías
        weekends: false, // Ocultar fines de semana
        locale: 'es',
        selectable: true, // Permitir seleccionar fechas
        events: '/calendar/events', // URL para obtener los eventos del calendario
        // Configuración de la barra de herramientas 
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        // Texto de los botones de la barra de herramientas
        buttonText: {
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
        },
        // Horario permitido para la selección de eventos
        slotMinTime: '09:00:00', 
        slotMaxTime: '19:00:00',

        // Horario laboral
        businessHours: [
            {
                daysOfWeek: [1, 2, 3, 4, 5],
                startTime: '09:00',
                endTime: '15:00'
            },
            {
                daysOfWeek: [1, 2, 3, 4, 5],
                startTime: '16:00',
                endTime: '18:00'
            }
        ],
        
        selectConstraint: 'businessHours',

        // Funciones para manejar eventos del calendario
        eventClick: function (info) {
            info.jsEvent.preventDefault();

            const eventId = info.event.id; // ID del evento
            const eventTitle = info.event.title; // Título del evento

            const confirmed = confirm(`¿Eliminar evento "${eventTitle}"`);
            if (!confirmed) return;

            // Realizar la petición DELETE al backend para eliminar el evento
            fetch(`/calendar/delete-event/${eventId}`, {
                method: 'DELETE'
            })
                .then(res => {
                    if (!res.ok) throw new Error('Error eliminando evento');
                    info.event.remove(); // Eliminar el evento del calendario
                    calendar.refetchEvents(); // Actualizar el calendario
                })
                .catch(err => {
                    alert('Error eliminando evento: ' + err.message);
                });
        },

        // Rellenar el campo de fecha al hacer click en una fecha del calendario y desplazar el formulario hacia esa fecha
        dateClick: function (info) {
            document.getElementById('event-date').value = info.dateStr;
            document.getElementById('serv-event-form').scrollIntoView({ behavior: 'smooth' });
        },

        // Personalizar el contenido de los eventos creados en el calendario
        eventContent: function (arg) {
            const horaInicio = arg.event.start
                ? arg.event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';
            const horaFin = arg.event.end
                ? arg.event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

            const titulo = arg.event.title || '';
            const descripcion = arg.event.extendedProps.description || '';

            let texto = `${horaInicio} - ${horaFin} | ${titulo} · ${descripcion}`; // Formato del texto del evento

            return { html: `${texto}` }; 
        }
    });

    calendar.render(); // Renderizar el calendario
});

// Función para no permitir seleccionar horas fuera del horario laboral
const endHourSelect = document.getElementById('end-hour'); 
const endMinuteSelect = document.getElementById('end-minute');

// Configurar el selector de hora de fin, deshabilitando las horas fuera del horario laboral
endHourSelect.addEventListener('change', () => {
    if (endHourSelect.value === '18') {
        endMinuteSelect.value = '00';
        Array.from(endMinuteSelect.options).forEach(option => {
            option.disabled = option.value !== '00';
        });
    } else {
        Array.from(endMinuteSelect.options).forEach(option => {
            option.disabled = false;
        });
    }
});

// Función para no permitir seleccionar sábados y domingos
const dateInput = document.getElementById('event-date');

dateInput.addEventListener('input', () => {
    const selectedDate = new Date(dateInput.value);
    const day = selectedDate.getUTCDay(); // Obtener el día de la semana (0 = Domingo, 6 = Sábado)

    if (day === 0 || day === 6) {
        alert("No se pueden seleccionar sábados ni domingos.");
        dateInput.value = "";
    }
});

// Crear un nuevo evento en el calendario
form.addEventListener('submit', function (e) {
    e.preventDefault(); // Prevenir el envío del formulario por defecto

    const title = document.getElementById('event-title').value; // Título del evento

    const date = form.date.value; // Fecha del evento 
    const description = document.getElementById('event-description').value; // Descripción del evento

    const startHour = document.getElementById('start-hour').value; // Horas de inicio 
    const startMinute = document.getElementById('start-minute').value; // Minutos de inicio
    const startTime = `${startHour}:${startMinute}`; // Formato de hora de inicio

    const endHour = endHourSelect.value; // Horas de fin
    const endMinute = endMinuteSelect.value; // Minutos de fin
    const endTime = `${endHour}:${endMinute}`; // Formato de hora de fin

    // Enviar los datos del evento al backend para crear un nuevo evento
    fetch('/calendar/create-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title,
            date,
            description,
            startTime: `${startTime}:00`,
            endTime: `${endTime}:00`,
        })
    })
        .then(res => {
            if (!res.ok) throw new Error('Error creando evento');
            calendar.refetchEvents(); // Actualizar el calendario con los nuevos eventos
            form.reset(); // Limpiar el formulario
            alert('Evento creado correctamente');
        })
        .catch(err => alert('Error: ' + err.message));
});