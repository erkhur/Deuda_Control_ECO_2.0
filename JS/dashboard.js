document.addEventListener("DOMContentLoaded", () => {
  // Verificar si ya existen clientes en LocalStorage
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

  // Mostrar/ocultar menú al hacer clic en el ícono
  avatarBtn.addEventListener("click", () => {
    menuUsuario.classList.toggle("hidden");
  });

  // Cerrar sesión
  cerrarSesionBtn.addEventListener("click", () => {
    // Opcional: limpiar datos de sesión/localStorage
    // localStorage.removeItem("usuarios");

    // Redirigir a index.html
    window.location.href = "index.html";
  });

  // Cerrar menú si se hace clic fuera
  document.addEventListener("click", (e) => {
    if (!avatarBtn.contains(e.target) && !menuUsuario.contains(e.target)) {
      menuUsuario.classList.add("hidden");
    }
  });

  if (clientes.length === 0) {
    const clientesFicticios = [
      {
        ruc: "20523027655",
        razonSocial: "Inversiones Andinas SAC",
        direccion: "Av. Los Incas 123 - Lima",
        nombreContacto: "Carlos Pérez",
        telefono: "987654321",
        email: "carlos.perez@andinas.com",
        estado: "Activo",
        fechaRegistro: new Date().toLocaleString(),
      },
      {
        ruc: "10456789012",
        razonSocial: "Servicios Globales SRL",
        direccion: "Jr. Amazonas 456 - Trujillo",
        nombreContacto: "María López",
        telefono: "912345678",
        email: "maria.lopez@globales.com",
        estado: "Activo",
        fechaRegistro: new Date().toLocaleString(),
      },
      {
        ruc: "10234567891",
        razonSocial: "Constructora El Sol",
        direccion: "Av. Primavera 789 - Arequipa",
        nombreContacto: "José Ramírez",
        telefono: "999888777",
        email: "jose.ramirez@elsol.com",
        estado: "Inactivo",
        fechaRegistro: new Date().toLocaleString(),
      },
      {
        ruc: "10987654321",
        razonSocial: "Distribuidora Norte",
        direccion: "Calle Real 321 - Huancayo",
        nombreContacto: "Ana Torres",
        telefono: "955667788",
        email: "ana.torres@norte.com",
        estado: "Activo",
        fechaRegistro: new Date().toLocaleString(),
      },
      {
        ruc: "10765432109",
        razonSocial: "Agroexportadora Verde",
        direccion: "Av. Agricultura 654 - Chiclayo",
        nombreContacto: "Luis Fernández",
        telefono: "944332211",
        email: "luis.fernandez@verde.com",
        estado: "Activo",
        fechaRegistro: new Date().toLocaleString(),
      },
      {
        ruc: "10543210987",
        razonSocial: "Tecnologías del Sur",
        direccion: "Av. Grau 987 - Cusco",
        nombreContacto: "Patricia Gómez",
        telefono: "933221144",
        email: "patricia.gomez@tecsur.com",
        estado: "Inactivo",
        fechaRegistro: new Date().toLocaleString(),
      },
      {
        ruc: "10321098765",
        razonSocial: "Consultores Empresariales",
        direccion: "Jr. San Martín 741 - Piura",
        nombreContacto: "Ricardo Díaz",
        telefono: "922334455",
        email: "ricardo.diaz@consultores.com",
        estado: "Activo",
        fechaRegistro: new Date().toLocaleString(),
      },
      {
        ruc: "10109876543",
        razonSocial: "Farmacia Central",
        direccion: "Av. Central 852 - Lima",
        nombreContacto: "Sofía Herrera",
        telefono: "911223344",
        email: "sofia.herrera@farmaciacentral.com",
        estado: "Activo",
        fechaRegistro: new Date().toLocaleString(),
      },
      {
        ruc: "10912345678",
        razonSocial: "Transportes Rápidos",
        direccion: "Av. Panamericana 963 - Ica",
        nombreContacto: "Miguel Castro",
        telefono: "977665544",
        email: "miguel.castro@rapidos.com",
        estado: "Inactivo",
        fechaRegistro: new Date().toLocaleString(),
      },
      {
        ruc: "10876543219",
        razonSocial: "Hotel Los Andes",
        direccion: "Av. Libertad 159 - Cajamarca",
        nombreContacto: "Elena Vargas",
        telefono: "966554433",
        email: "elena.vargas@losandes.com",
        estado: "Activo",
        fechaRegistro: new Date().toLocaleString(),
      },
    ];

    localStorage.setItem("clientes", JSON.stringify(clientesFicticios));
    console.log("Clientes ficticios cargados en LocalStorage.");
  }

  // --- Report generation helpers ---
  function formatCurrency(value) {
    const num = Number(value) || 0;
    return 'S/ ' + num.toFixed(2);
  }

  function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getAllClientes() {
    return JSON.parse(localStorage.getItem('clientes')) || clientes || [];
  }

  function exportAllCSV() {
    const headers = ['RUC/DNI','Razon Social','Telefono','Email','Estado','Fecha Registro','Direccion','Contacto','Facturas','Cuotas','Monto Inicial (S/)','Monto Pagado (S/)'];
    const rows = getAllClientes().map(c => [
      c.ruc || '',
      c.razonSocial || '',
      c.telefono || '',
      c.email || '',
      c.estado || '',
      c.fecha || c.fechaRegistro || '',
      c.direccion || '',
      c.nombreContacto || '',
      c.facturas || 0,
      c.cuotas || 0,
      Number(c.montoInicial || c.monto || 0).toFixed(2),
      Number(c.montoPagado || 0).toFixed(2)
    ]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach(r => {
      csvContent += r.map(field => `"${String(field).replace(/"/g,'""')}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clientes_detallado.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function exportAllPDF() {
    try {
      const data = getAllClientes();
      // build temporary table
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.padding = '16px';
      container.style.background = '#fff';
      container.style.color = '#000';
      const table = document.createElement('table');
      table.style.borderCollapse = 'collapse';
      table.style.width = '100%';
      const thead = document.createElement('thead');
      thead.innerHTML = `
        <tr>
          <th style="border:1px solid #e6e6e6;padding:8px">RUC/DNI</th>
          <th style="border:1px solid #e6e6e6;padding:8px">Razon Social</th>
          <th style="border:1px solid #e6e6e6;padding:8px">Telefono</th>
          <th style="border:1px solid #e6e6e6;padding:8px">Email</th>
          <th style="border:1px solid #e6e6e6;padding:8px">Estado</th>
          <th style="border:1px solid #e6e6e6;padding:8px">Fecha Registro</th>
          <th style="border:1px solid #e6e6e6;padding:8px">Direccion</th>
          <th style="border:1px solid #e6e6e6;padding:8px">Contacto</th>
          <th style="border:1px solid #e6e6e6;padding:8px">Facturas</th>
          <th style="border:1px solid #e6e6e6;padding:8px">Cuotas</th>
          <th style="border:1px solid #e6e6e6;padding:8px">Monto Inicial (S/)</th>
          <th style="border:1px solid #e6e6e6;padding:8px">Monto Pagado (S/)</th>
        </tr>
      `;
      table.appendChild(thead);
      const tbody = document.createElement('tbody');
      data.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="border:1px solid #e6e6e6;padding:8px">${escapeHtml(c.ruc || '')}</td>
          <td style="border:1px solid #e6e6e6;padding:8px">${escapeHtml(c.razonSocial || '')}</td>
          <td style="border:1px solid #e6e6e6;padding:8px">${escapeHtml(c.telefono || '')}</td>
          <td style="border:1px solid #e6e6e6;padding:8px">${escapeHtml(c.email || '')}</td>
          <td style="border:1px solid #e6e6e6;padding:8px">${escapeHtml(c.estado || '')}</td>
          <td style="border:1px solid #e6e6e6;padding:8px">${escapeHtml(c.fecha || c.fechaRegistro || '')}</td>
          <td style="border:1px solid #e6e6e6;padding:8px">${escapeHtml(c.direccion || '')}</td>
          <td style="border:1px solid #e6e6e6;padding:8px">${escapeHtml(c.nombreContacto || '')}</td>
          <td style="border:1px solid #e6e6e6;padding:8px">${c.facturas || 0}</td>
          <td style="border:1px solid #e6e6e6;padding:8px">${c.cuotas || 0}</td>
          <td style="border:1px solid #e6e6e6;padding:8px;text-align:right">${formatCurrency(c.montoInicial || c.monto || 0)}</td>
          <td style="border:1px solid #e6e6e6;padding:8px;text-align:right">${formatCurrency(c.montoPagado || 0)}</td>
        `;
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      container.appendChild(table);
      document.body.appendChild(container);

      const canvas = await html2canvas(container, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('l', 'pt', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = { width: canvas.width, height: canvas.height };
      const ratio = Math.min(pdfWidth / imgProps.width, pdfHeight / imgProps.height);
      const imgWidth = imgProps.width * ratio;
      const imgHeight = imgProps.height * ratio;
      pdf.addImage(imgData, 'PNG', 20, 20, imgWidth - 40, imgHeight - 40);
      pdf.save('clientes_detallado.pdf');

      container.remove();
    } catch (err) {
      console.error('Error generating PDF from dashboard', err);
      alert('Ocurrió un error al generar el PDF.');
    }
  }

  // Bind report button
  const btnReporte = document.getElementById('btnReporteDetallado');
  if (btnReporte) {
    btnReporte.addEventListener('click', async () => {
      btnReporte.disabled = true;
      const originalText = btnReporte.textContent;
      btnReporte.textContent = 'Generando reportes...';
      try {
        // CSV (start immediately)
        exportAllCSV();
        // PDF (await because it's heavier)
        await exportAllPDF();
      } catch (e) {
        console.error(e);
        alert('Error al generar reportes.');
      } finally {
        btnReporte.disabled = false;
        btnReporte.textContent = originalText;
      }
    });
  }
});
