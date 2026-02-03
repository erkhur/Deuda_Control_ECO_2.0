document.addEventListener("DOMContentLoaded", () => {
  const mainContent = document.getElementById("mainContent");
  const navDashboard = document.getElementById("navDashboard");
  const navClientes = document.getElementById("navClientes");
  const navDeudas = document.getElementById("navDeudas");
  const navReportes = document.getElementById("navReportes");

  // --- LÓGICA DE USUARIOS Y SESIÓN ---
  const nombreEl = document.getElementById("nombreUsuario");
  const rolEl = document.getElementById("rolUsuario");
  let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
  let usuarioActual = JSON.parse(localStorage.getItem("usuarioActual")) || usuarios.find((u) => u.logeado === true);

  if (usuarioActual) {
    nombreEl.textContent = usuarioActual.nombre;
    rolEl.textContent = usuarioActual.rol || "Administrador";
  }

  // --- FUNCIÓN DE CÁLCULO DE MÉTRICAS DINÁMICAS ---
  function actualizarMetricasDashboard() {
    const registroCuotas = JSON.parse(localStorage.getItem("registroCuotas")) || [];
    const cuotasPagadas = JSON.parse(localStorage.getItem("cuotasPagadas")) || [];
    
    const fechaActual = new Date();
    const mesActualIdx = fechaActual.getMonth(); // 0-11
    const anioActual = fechaActual.getFullYear();
    const mesesLetras = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    
    // 1. Mostrar Mes Actual
    const txtMes = document.getElementById("txtMesActual");
    if(txtMes) txtMes.textContent = "Resumen actualizado de tus cuentas por cobrar mes de: " + mesesLetras[mesActualIdx];

    // 2. Total Clientes con Deuda (Estado P)
    const clientesConDeuda = [...new Set(registroCuotas
      .filter(c => c.estadoCuota === "P")
      .map(c => c.nombreCliente)
    )];
    const cardClientes = document.getElementById("cardTotalClientes");
    if(cardClientes) cardClientes.textContent = clientesConDeuda.length;

    // Helper para validar si una fecha pertenece al mes/año actual
    const esMesActual = (fechaStr) => {
      const d = new Date(fechaStr + "T00:00:00");
      return d.getMonth() === mesActualIdx && d.getFullYear() === anioActual;
    };

    // 3. Monto Pagado (Bimoneda) del mes actual
    let pagadoSoles = 0;
    let pagadoDolares = 0;
    
    cuotasPagadas.forEach(p => {
      if(esMesActual(p.fechaVencimiento)) {
        if(p.monedaPago === "S/.") pagadoSoles += parseFloat(p.montoPago);
        if(p.monedaPago === "US$") pagadoDolares += parseFloat(p.montoPago);
      }
    });

    const divPagado = document.getElementById("cardMontoPagado");
    if(divPagado) divPagado.innerHTML = `S/. ${pagadoSoles.toFixed(2)} <br> US$ ${pagadoDolares.toFixed(2)}`;

    // 4. Monto Pendiente (Bimoneda) del mes actual
    let pendienteSoles = 0;
    let pendienteDolares = 0;

    registroCuotas.forEach(r => {
      if(r.estadoCuota === "P" && esMesActual(r.fechaVencimiento)) {
        if(r.monedaComprobante === "S/.") pendienteSoles += parseFloat(r.cuotaMonto);
        if(r.monedaComprobante === "US$") pendienteDolares += parseFloat(r.cuotaMonto);
      }
    });

    const divPendiente = document.getElementById("cardMontoPendiente");
    if(divPendiente) divPendiente.innerHTML = `S/. ${pendienteSoles.toFixed(2)} <br> US$ ${pendienteDolares.toFixed(2)}`;

    // 5. Cartera Total Mes (Soles y US$)
    const cardTotal = document.getElementById("cardMontoTotalMes");
    if(cardTotal) {
      const totalSolesMes = pagadoSoles + pendienteSoles;
      const totalDolaresMes = pagadoDolares + pendienteDolares;
      cardTotal.innerHTML = `S/ ${totalSolesMes.toFixed(2)} <br> US$ ${totalDolaresMes.toFixed(2)}`;
    }

    // 6. CARTERA TOTAL ACUMULADO (Sin validación de mes)
    let totalAcumuladoSoles = 0;
    let totalAcumuladoDolares = 0;

    registroCuotas.forEach(r => {
      if(r.estadoCuota === "P") {
        if(r.monedaComprobante === "S/.") totalAcumuladoSoles += parseFloat(r.cuotaMonto);
        if(r.monedaComprobante === "US$") totalAcumuladoDolares += parseFloat(r.cuotaMonto);
      }
    });

    const cardTotalAcumulado = document.getElementById("cardMontoTotalAcumulado");
    if(cardTotalAcumulado) {
      cardTotalAcumulado.innerHTML = `S/ ${totalAcumuladoSoles.toFixed(2)} <br> US$ ${totalAcumuladoDolares.toFixed(2)}`;
    }
  }

  // --- NAVEGACIÓN DINÁMICA ---
  
  // Opción Dashboard (Home)
  if (navDashboard) {
    navDashboard.addEventListener("click", () => {
      window.location.href = "dashboard.html"; 
    });
  }

  // LÓGICA DE CARGA DINÁMICA DE CLIENTES (Adicionado)
  if (navClientes && mainContent) {
    navClientes.addEventListener("click", async (e) => {
      e.preventDefault();
      document.querySelectorAll('aside nav a').forEach(el => el.classList.remove('active-nav'));
      navClientes.classList.add('active-nav');
      try {
        const response = await fetch('clientes.html');
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        mainContent.innerHTML = doc.querySelector('main').innerHTML;

        const scriptPrevio = document.getElementById("script-dinamico-clientes");
        if (scriptPrevio) scriptPrevio.remove();

        const scriptNuevo = document.createElement("script");
        scriptNuevo.id = "script-dinamico-clientes";
        scriptNuevo.src = "./JS/clientes.js?v=" + Date.now(); 
        document.body.appendChild(scriptNuevo);
      } catch (err) { console.error("Error al cargar clientes:", err); }
    });
  }

  // LÓGICA DE CARGA DINÁMICA DE DEUDAS
  if (navDeudas && mainContent) {
    navDeudas.addEventListener("click", async (e) => {
      e.preventDefault();
      document.querySelectorAll('aside nav a').forEach(el => el.classList.remove('active-nav'));
      navDeudas.classList.add('active-nav');
      try {
        const response = await fetch('deudas.html');
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        mainContent.innerHTML = doc.querySelector('main').innerHTML;

        const scriptPrevio = document.getElementById("script-dinamico-deudas");
        if (scriptPrevio) scriptPrevio.remove();

        const scriptNuevo = document.createElement("script");
        scriptNuevo.id = "script-dinamico-deudas";
        scriptNuevo.src = "./JS/deudas.js?v=" + Date.now(); 
        document.body.appendChild(scriptNuevo);
      } catch (err) { console.error("Error cargando deudas:", err); }
    });
  }

  // LÓGICA DE CARGA DINÁMICA DE REPORTES
  if (navReportes && mainContent) {
    navReportes.addEventListener("click", async (e) => {
      e.preventDefault();
      document.querySelectorAll('aside nav a').forEach(el => el.classList.remove('active-nav'));
      navReportes.classList.add('active-nav');
      try {
        const response = await fetch('reportes.html');
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        mainContent.innerHTML = doc.querySelector('main').innerHTML;

        const scriptPrevio = document.getElementById("script-dinamico-reportes");
        if (scriptPrevio) scriptPrevio.remove();

        const scriptNuevo = document.createElement("script");
        scriptNuevo.id = "script-dinamico-reportes";
        scriptNuevo.src = "./JS/reportes.js?v=" + Date.now(); 
        document.body.appendChild(scriptNuevo);
      } catch (err) { console.error("Error al cargar reportes:", err); }
    });
  }

  // --- EVENTOS DE INTERFAZ (Sesión y Avatar) ---
  const avatarBtn = document.getElementById("avatarBtn");
  const menuUsuario = document.getElementById("menuUsuario");
  const cerrarSesionBtn = document.getElementById("cerrarSesion");

  if (avatarBtn) avatarBtn.addEventListener("click", () => menuUsuario.classList.toggle("hidden"));
  if (cerrarSesionBtn) cerrarSesionBtn.addEventListener("click", () => window.location.href = "index.html");

  document.addEventListener("click", (e) => {
    if (avatarBtn && !avatarBtn.contains(e.target) && menuUsuario && !menuUsuario.contains(e.target)) {
      menuUsuario.classList.add("hidden");
    }
  });

  // Inicialización de métricas al cargar el Dashboard
  if (document.getElementById("cardTotalClientes")) {
    actualizarMetricasDashboard();
  }
});
