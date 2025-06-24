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
