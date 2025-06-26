// Variables generales
const infoButtons = document.querySelectorAll(".info-serv");

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

document.addEventListener('DOMContentLoaded', function () {
    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        selectable: true,
        events: '/calendar/events',
        headerToolbar: {
            left: 'prev,next today addEventButton',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'

        },

        buttonText: {
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
        },

        customButtons: {
            addEventButton: {
                text: 'Añadir Evento',
                click: function () {
                    const title = prompt('Título del evento:');
                    if (!title) return;

                    const dateStr = prompt('Fecha del evento (YYYY-MM-DD):');
                    if (!dateStr) return;

                    const startTime = prompt('Hora de inicio (HH:MM, 24h):');
                    if (!startTime) return;

                    const endTime = prompt('Hora de fin (HH:MM, 24h):');
                    if (!endTime) return;

                    fetch('/calendar/create-event', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title: title,
                            date: dateStr,
                            startTime: `${startTime}:00`,
                            endTime: `${endTime}:00`
                        })
                    })
                        .then(res => {
                            if (!res.ok) throw new Error('Error creando evento');
                            calendar.refetchEvents();
                        })
                        .catch(err => alert('Error: ' + err.message));
                }
            },
        },

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

        
    });

    calendar.render();
});
