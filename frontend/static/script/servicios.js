// Variables generales
const infoButtons = document.querySelectorAll(".info-serv");
let calendar;
const form = document.getElementById('event-form');

// Función para mostrar/ocultar detalles de los servicios con transición suave
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

// Configuración de Auth0
const config = {
    domain: "dev-h4b028ls1ve707b4.us.auth0.com",
    clientId: "FepmRVSIkZfNO2PSG6X72Y7McIzWtPfO",
    audience: "https://dev-h4b028ls1ve707b4.us.auth0.com/api/v2/"
};

let auth0Client = null;

// Inicializar Auth0
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

// Iniciar al cargar la página
window.onload = async () => {
    await initAuth0();
    configSeleccion();
};

// API de Google Calendar
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

// Configuración de FullCalendar
document.addEventListener('DOMContentLoaded', function () {
    const calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        fixedWeekCount: false,
        weekends: false,
        locale: 'es',
        selectable: true,
        events: '/calendar/events',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        buttonText: {
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
        },

        slotMinTime: '09:00:00',
        slotMaxTime: '19:00:00',

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
        eventClick: function (info) {
            info.jsEvent.preventDefault();

            const eventId = info.event.id;
            const eventTitle = info.event.title;

            const confirmed = confirm(`¿Eliminar evento "${eventTitle}"`);
            if (!confirmed) return;

            fetch(`/calendar/delete-event/${eventId}`, {
                method: 'DELETE'
            })
                .then(res => {
                    if (!res.ok) throw new Error('Error eliminando evento');
                    info.event.remove();
                    calendar.refetchEvents();
                })
                .catch(err => {
                    alert('Error eliminando evento: ' + err.message);
                });
        },
        dateClick: function (info) {
            document.getElementById('event-date').value = info.dateStr;
            document.getElementById('serv-event-form').scrollIntoView({ behavior: 'smooth' });
        },

        eventContent: function (arg) {
            const horaInicio = arg.event.start
                ? arg.event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';
            const horaFin = arg.event.end
                ? arg.event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

            const titulo = arg.event.title || '';
            const descripcion = arg.event.extendedProps.description || '';

            let texto = `${horaInicio} - ${horaFin} | ${titulo} · ${descripcion}`;

            return { html: `${texto}` };
        }
    });

    calendar.render();
});

// Función para no permitir seleccionar horas fuera del horario laboral
const endHourSelect = document.getElementById('end-hour');
const endMinuteSelect = document.getElementById('end-minute');

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
    const day = selectedDate.getUTCDay();

    if (day === 0 || day === 6) {
        alert("No se pueden seleccionar sábados ni domingos.");
        dateInput.value = "";
    }
});

// Çrear un nuevo evento en el calendario
form.addEventListener('submit', function (e) {
    e.preventDefault();

    const title = document.getElementById('event-title').value;

    const date = form.date.value;
    const description = document.getElementById('event-description').value;

    const startHour = document.getElementById('start-hour').value;
    const startMinute = document.getElementById('start-minute').value;
    const startTime = `${startHour}:${startMinute}`;

    const endHour = endHourSelect.value;
    const endMinute = endMinuteSelect.value;
    const endTime = `${endHour}:${endMinute}`;

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
            calendar.refetchEvents();
            form.reset();
            alert('Evento creado correctamente');
        })
        .catch(err => alert('Error: ' + err.message));
});