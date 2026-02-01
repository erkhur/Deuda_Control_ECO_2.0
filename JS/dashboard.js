document.addEventListener("DOMContentLoaded", () => {
  // --- LÓGICA ORIGINAL DE USUARIOS Y SESIÓN ---
  let clientes = JSON.parse(localStorage.getItem("clientes")) || [];

  const nombreEl = document.getElementById("nombreUsuario");
  const rolEl = document.getElementById("rolUsuario");

  let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
  let usuarioActual =
    JSON.parse(localStorage.getItem("usuarioActual")) ||
    usuarios.find((u) => u.logeado === true);

  if (usuarioActual) {
    nombreEl.textContent = usuarioActual.nombre;
    rolEl.textContent = usuarioActual.rol || "Administrador";
  } else {
    nombreEl.textContent = "Super Admin";
    rolEl.textContent = "Administrador";
  }

  const avatarBtn = document.getElementById("avatarBtn");
  const menuUsuario = document.getElementById("menuUsuario");
  const cerrarSesionBtn = document.getElementById("cerrarSesion");

  if (avatarBtn) {
    avatarBtn.addEventListener("click", () => {
      menuUsuario.classList.toggle("hidden");
    });
  }

  if (cerrarSesionBtn) {
    cerrarSesionBtn.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }

  document.addEventListener("click", (e) => {
    if (avatarBtn && !avatarBtn.contains(e.target) && menuUsuario && !menuUsuario.contains(e.target)) {
      menuUsuario.classList.add("hidden");
    }
  });

  // --- LÓGICA ORIGINAL DE CLIENTES (BASE DE DATOS) ---
  if (clientes.length === 0) {
    const clientesFicticios = [
      { ruc: "20523027655", razonSocial: "Inversiones Andinas SAC", direccion: "Av. Los Incas 123 - Lima", nombreContacto: "Carlos Pérez", telefono: "987654321", email: "carlos.perez@andinas.com", estado: "Activo", fechaRegistro: new Date().toLocaleString() },
      { ruc: "10456789012", razonSocial: "Servicios Globales SRL", direccion: "Jr. Amazonas 456 - Trujillo", nombreContacto: "María López", telefono: "912345678", email: "maria.lopez@globales.com", estado: "Activo", fechaRegistro: new Date().toLocaleString() },
      { ruc: "10234567891", razonSocial: "Constructora El Sol", direccion: "Av. Primavera 789 - Arequipa", nombreContacto: "José Ramírez", telefono: "999888777", email: "jose.ramirez@elsol.com", estado: "Inactivo", fechaRegistro: new Date().toLocaleString() },
      { ruc: "10987654321", razonSocial: "Distribuidora Norte", direccion: "Calle Real 321 - Huancayo", nombreContacto: "Ana Torres", telefono: "955667788", email: "ana.torres@norte.com", estado: "Activo", fechaRegistro: new Date().toLocaleString() },
      { ruc: "10765432109", razonSocial: "Agroexportadora Verde", direccion: "Av. Agricultura 654 - Chiclayo", nombreContacto: "Luis Fernández", telefono: "944332211", email: "luis.fernandez@verde.com", estado: "Activo", fechaRegistro: new Date().toLocaleString() },
      { ruc: "10543210987", razonSocial: "Tecnologías del Sur", direccion: "Av. Grau 987 - Cusco", nombreContacto: "Patricia Gómez", telefono: "933221144", email: "patricia.gomez@tecsur.com", estado: "Inactivo", fechaRegistro: new Date().toLocaleString() },
      { ruc: "10321098765", razonSocial: "Consultores Empresariales", direccion: "Jr. San Martín 741 - Piura", nombreContacto: "Ricardo Díaz", telefono: "922334455", email: "ricardo.diaz@consultores.com", estado: "Activo", fechaRegistro: new Date().toLocaleString() },
      { ruc: "10109876543", razonSocial: "Farmacia Central", direccion: "Av. Central 852 - Lima", nombreContacto: "Sofía Herrera", telefono: "911223344", email: "sofia.herrera@farmaciacentral.com", estado: "Activo", fechaRegistro: new Date().toLocaleString() },
      { ruc: "10912345678", razonSocial: "Transportes Rápidos", direccion: "Av. Panamericana 963 - Ica", nombreContacto: "Miguel Castro", telefono: "977665544", email: "miguel.castro@rapidos.com", estado: "Inactivo", fechaRegistro: new Date().toLocaleString() },
      { ruc: "10876543219", razonSocial: "Hotel Los Andes", direccion: "Av. Libertad 159 - Cajamarca", nombreContacto: "Elena Vargas", telefono: "966554433", email: "elena.vargas@losandes.com", estado: "Activo", fechaRegistro: new Date().toLocaleString() }
    ];
    localStorage.setItem("clientes", JSON.stringify(clientesFicticios));
  }

  // --- MEJORA: LÓGICA DE CARGA DINÁMICA DE DEUDAS ---
  const navDeudas = document.getElementById("navDeudas");
  const mainContent = document.getElementById("mainContent");

  if (navDeudas && mainContent) {
    navDeudas.addEventListener("click", async (e) => {
      e.preventDefault();

      // Efecto visual de selección en el menú
      document.querySelectorAll('aside nav a').forEach(el => el.classList.remove('active-nav'));
      navDeudas.classList.add('active-nav');

      try {
        // 1. Cargar el HTML de deudas
        const response = await fetch('deudas.html');
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const nuevoContenido = doc.querySelector('main').innerHTML;
        
        // 2. Inyectar en el contenedor principal
        mainContent.innerHTML = nuevoContenido;

        // 3. Forzar ejecución limpia de deudas.js (Mejora anti-caché)
        // Eliminamos si existe un script previo para evitar duplicados
        const scriptPrevio = document.getElementById("script-dinamico-deudas");
        if (scriptPrevio) scriptPrevio.remove();

        const scriptNuevo = document.createElement("script");
        scriptNuevo.id = "script-dinamico-deudas";
        // Añadimos un timestamp (?v=...) para que el navegador siempre lea la versión nueva
        scriptNuevo.src = "./JS/deudas.js?v=" + Date.now(); 
        document.body.appendChild(scriptNuevo);

        console.log("Módulo de deudas cargado y deudas.js ejecutado.");

      } catch (err) {
        console.error("Error al cargar el módulo de deudas:", err);
      }
    });
  }
});