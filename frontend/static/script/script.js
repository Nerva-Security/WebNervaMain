//===========================================
// CARGAR HEADER Y FOOTER EN TODOS LOS HTML
//===========================================

document.addEventListener("DOMContentLoaded", () => {
    // Definir el HTML del header
    const headerHTML = ` 
        <div class="logo">
          <img src="/static/img/logo-nerva.png" alt="Logo de la empresa">
        </div>
        <div class="header-menu">
          <nav>
              <ul>
                  <li><a href="/">Inicio</a></li>
                  <li><a href="/acerca">Acerca de</a></li>
                  <li><a href="/servicios">Servicios</a></li>
                  <li><a href="/blog">Blog</a></li>
                  <li><a href="/galeria">Galería</a></li>                
              </ul>
          </nav>
        </div>
    `;

    // Definir el HTML del footer
    const footerHTML = `
      <footer
      >
          <p>&copy; 2025 / NERVA SECURITY / Todos los derechos reservados.</p>
      </footer>
    `;

    // Insertar el header en el contenedor con id="header"
    document.getElementById("header").innerHTML = headerHTML;

    // Insertar el footer en el contenedor con id="footer"
    document.getElementById("footer").innerHTML = footerHTML;
});
