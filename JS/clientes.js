// JS/clientes.js
(function() {
  let currentPage = 1;
  const clientesPorPagina = 8;
  let filtroBusqueda = "";

  function inicializar() {
    renderClientes(1);
    
    // Búsqueda
    const inputBusqueda = document.getElementById("inputBusqueda");
    if (inputBusqueda) {
      inputBusqueda.addEventListener("input", (e) => {
        filtroBusqueda = e.target.value;
        renderClientes(1);
      });
    }

    // Registro
    const btnRegistro = document.getElementById("registroCliente");
    if (btnRegistro) {
      btnRegistro.addEventListener("click", () => abrirModal());
    }

    // Exportación - Vinculación Garantizada
    const btnExport = document.getElementById("exportarClientes");
    if (btnExport) {
        btnExport.onclick = function() {
            procesarExportacionExcel();
        };
    }
  }

  function procesarExportacionExcel() {
    let clientes = JSON.parse(localStorage.getItem("clientes")) || [];
    if (clientes.length === 0) {
      return Swal.fire("Sin datos", "No hay clientes registrados para exportar.", "info");
    }

    // Orden Alfabetico para el archivo
    clientes.sort((a, b) => a.razonSocial.localeCompare(b.razonSocial));

    const datosParaExcel = clientes.map(c => ({
      "Documento": c.ruc,
      "Razón Social": c.razonSocial,
      "Dirección": c.direccion,
      "Contacto": c.nombreContacto || '-',
      "Email": c.email || '-',
      "Teléfono": c.telefono,
      "Estado": c.estado
    }));

    try {
        const worksheet = XLSX.utils.json_to_sheet(datosParaExcel);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes");
        XLSX.writeFile(workbook, "Reporte_Clientes.xlsx");
    } catch (error) {
        console.error("Error al exportar:", error);
        Swal.fire("Error", "No se pudo generar el archivo Excel. Verifique que la librería XLSX esté cargada.", "error");
    }
  }

  function renderClientes(page = 1) {
    const tabla = document.getElementById("tablaClientes");
    const footer = document.getElementById("footerPaginacion");
    let clientes = JSON.parse(localStorage.getItem("clientes")) || [];

    if (filtroBusqueda.trim() !== "") {
      const texto = filtroBusqueda.toLowerCase();
      clientes = clientes.filter(c => 
        (c.ruc || "").toLowerCase().includes(texto) || 
        c.razonSocial.toLowerCase().includes(texto) || 
        c.nombreContacto.toLowerCase().includes(texto)
      );
    }

    clientes.sort((a, b) => a.razonSocial.localeCompare(b.razonSocial));
    
    const totalCount = clientes.length;
    const totalPaginas = Math.ceil(totalCount / clientesPorPagina);
    currentPage = page;

    if (totalCount === 0) {
      tabla.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-slate-400">No hay clientes registrados.</td></tr>';
      if(footer) footer.innerHTML = "";
      return;
    }

    const inicio = (currentPage - 1) * clientesPorPagina;
    const fin = inicio + clientesPorPagina;
    const clientesPagina = clientes.slice(inicio, fin);

    tabla.innerHTML = clientesPagina.map(cliente => `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="px-6 py-4 text-sm text-slate-500 font-medium">${cliente.ruc}</td>
        <td class="px-6 py-4 text-sm font-bold text-slate-900">${cliente.razonSocial}</td>
        <td class="px-6 py-4 text-sm text-slate-500">${cliente.direccion}</td>
        <td class="px-6 py-4 text-sm font-medium">${cliente.nombreContacto || '-'}</td>
        <td class="px-6 py-4 text-sm text-slate-500">${cliente.email || '-'}<br><span class="text-xs text-slate-400">+51 ${cliente.telefono}</span></td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${cliente.estado === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}">
            ${cliente.estado}
          </span>
        </td>
        <td class="px-6 py-4 text-right">
            <button onclick="actualizarCliente('${cliente.ruc}')" class="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all" title="Editar">
                <span class="material-symbols-outlined text-[18px]">edit</span>
            </button>
        </td>
      </tr>
    `).join("");

    renderPaginacion(totalCount, totalPaginas);
    actualizarMetricas(clientes);
  }

  function renderPaginacion(totalCount, totalPages) {
    const footer = document.getElementById("footerPaginacion");
    if (!footer) return;
    const infoText = `<p class="text-xs font-medium text-slate-500">Mostrando ${Math.min(currentPage * clientesPorPagina, totalCount)} de ${totalCount} clientes</p>`;
    let buttons = `<div class="flex gap-1">
      <button onclick="cambiarPagina(${currentPage - 1})" class="size-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30" ${currentPage === 1 ? 'disabled' : ''}>
        <span class="material-symbols-outlined text-[18px]">chevron_left</span>
      </button>`;
    for (let i = 1; i <= totalPages; i++) {
        buttons += `<button onclick="cambiarPagina(${i})" class="size-8 flex items-center justify-center rounded-lg border ${i === currentPage ? 'border-primary bg-primary text-white font-bold' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'} text-xs">${i}</button>`;
    }
    buttons += `<button onclick="cambiarPagina(${currentPage + 1})" class="size-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30" ${currentPage === totalPages ? 'disabled' : ''}>
        <span class="material-symbols-outlined text-[18px]">chevron_right</span>
      </button></div>`;
    footer.innerHTML = infoText + buttons;
  }

  window.cambiarPagina = function(newPage) { renderClientes(newPage); };

  function abrirModal(clienteExistente = null) {
    const overlay = document.createElement("div");
    overlay.className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm";
    
    overlay.innerHTML = `
      <div class="bg-white dark:bg-[#1a212f] w-full max-w-[640px] rounded-xl shadow-2xl overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b">
          <div class="flex items-center gap-3">
            <h2 class="text-xl font-bold">${clienteExistente ? 'Actualizar' : 'Nuevo'} Cliente</h2>
            ${!clienteExistente ? `<div class="h-6 w-px bg-slate-200"></div><label class="text-xs font-bold text-slate-500">TIPO DOC:</label>
            <select id="modalTipoDoc" class="text-xs border-none bg-slate-100 rounded-md font-bold">
                <option value="DNI">DNI</option>
                <option value="RUC" selected>RUC</option>
                <option value="CE">CE</option>
            </select>` : ''}
          </div>
          <button id="cerrarModal" class="text-slate-400 hover:text-slate-600"><span class="material-symbols-outlined">close</span></button>
        </div>
        <div class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-1">
                    <label id="labelDoc" class="text-[10px] font-bold text-slate-400 uppercase">${clienteExistente ? 'NRO DOCUMENTO' : 'RUC'}</label>
                    <input id="modalNumDoc" type="text" value="${clienteExistente ? clienteExistente.ruc : ''}" ${clienteExistente ? 'disabled' : ''} class="form-input rounded-lg border-slate-200 h-12" placeholder="Número">
                </div>
                <div class="flex flex-col gap-1">
                    <label class="text-[10px] font-bold text-slate-400 uppercase">Estado</label>
                    <select id="modalEstado" class="form-select rounded-lg border-slate-200 h-12">
                        <option value="Activo" ${clienteExistente?.estado === 'Activo' ? 'selected' : ''}>Activo</option>
                        <option value="Inactivo" ${clienteExistente?.estado === 'Inactivo' ? 'selected' : ''}>Inactivo</option>
                    </select>
                </div>
            </div>
            <input id="modalRazon" value="${clienteExistente ? clienteExistente.razonSocial : ''}" class="form-input w-full rounded-lg border-slate-200 h-12" placeholder="Razón Social">
            <input id="modalDireccion" value="${clienteExistente ? clienteExistente.direccion : ''}" class="form-input w-full rounded-lg border-slate-200 h-12" placeholder="Dirección">
            <input id="modalContacto" value="${clienteExistente ? clienteExistente.nombreContacto : ''}" class="form-input w-full rounded-lg border-slate-200 h-12" placeholder="Nombre de Contacto">
            <div class="grid grid-cols-2 gap-4">
                <input id="modalTelf" value="${clienteExistente ? clienteExistente.telefono : ''}" class="form-input rounded-lg border-slate-200 h-12" placeholder="Teléfono">
                <input id="modalEmail" value="${clienteExistente ? clienteExistente.email : ''}" class="form-input rounded-lg border-slate-200 h-12" placeholder="Email">
            </div>
        </div>
        <div class="px-6 py-4 bg-slate-50 flex justify-end gap-3">
          <button id="cancelarModal" class="px-6 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button>
          <button id="guardarCliente" class="bg-primary text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm">Guardar Cliente</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    const selectTipo = overlay.querySelector("#modalTipoDoc");
    const labelDoc = overlay.querySelector("#labelDoc");
    const modalEstado = overlay.querySelector("#modalEstado");

    if (selectTipo) {
      selectTipo.addEventListener("change", () => { labelDoc.textContent = selectTipo.value; });
    }

    modalEstado.addEventListener("change", (e) => {
        if (clienteExistente && clienteExistente.estado === "Activo" && e.target.value === "Inactivo") {
            const cuotas = JSON.parse(localStorage.getItem("registroCuotas")) || [];
            const tieneDeuda = cuotas.some(c => c.rucDNI === clienteExistente.ruc && c.estadoCuota === "P");
            if (tieneDeuda) {
                Swal.fire({
                    icon: 'warning', title: 'Acción Bloqueada', text: 'No se puede cambiar de estado, cliente tiene deuda pendiente', confirmButtonColor: '#135bec'
                });
                e.target.value = "Activo";
            }
        }
    });

    const cerrar = () => overlay.remove();
    overlay.querySelector("#cerrarModal").onclick = cerrar;
    overlay.querySelector("#cancelarModal").onclick = cerrar;

    overlay.querySelector("#guardarCliente").onclick = () => {
      const numDoc = document.getElementById("modalNumDoc").value.trim();
      const razonSocial = document.getElementById("modalRazon").value.trim();
      
      if (!clienteExistente) {
          const tipo = selectTipo.value;
          const isNum = /^\d+$/.test(numDoc);
          if (tipo === "DNI" && (!isNum || numDoc.length !== 8 || numDoc === "00000000")) return Swal.fire("Atención", "Número de DNI erróneo", "error");
          if (tipo === "RUC" && (!isNum || numDoc.length !== 11 || !(numDoc.startsWith("10")||numDoc.startsWith("20")))) return Swal.fire("Atención", "Número de RUC eróneo", "error");
          if (tipo === "CE" && (!isNum || numDoc.length > 11 || parseInt(numDoc) < 1)) return Swal.fire("Atención", "Carnet de Extranjeria inválido", "error");
      }

      if(razonSocial.length < 5) return Swal.fire("Error", "Razón social muy corta.", "error");

      let clientes = JSON.parse(localStorage.getItem("clientes")) || [];
      const obj = { ruc: numDoc, razonSocial, direccion: document.getElementById("modalDireccion").value, nombreContacto: document.getElementById("modalContacto").value, telefono: document.getElementById("modalTelf").value, email: document.getElementById("modalEmail").value, estado: modalEstado.value };

      if(clienteExistente) {
          clientes = clientes.map(c => c.ruc === clienteExistente.ruc ? {...obj, fechaRegistro: c.fechaRegistro} : c);
      } else {
          if(clientes.some(c => c.ruc === numDoc)) return Swal.fire("Error", "El documento ya existe registrado.", "error");
          obj.fechaRegistro = new Date().toLocaleString();
          clientes.push(obj);
      }

      localStorage.setItem("clientes", JSON.stringify(clientes));
      Swal.fire("Éxito", "Cliente procesado.", "success").then(() => { cerrar(); renderClientes(currentPage); });
    };
  }

  function actualizarMetricas(clientes) {
    document.getElementById("totalClientes").textContent = clientes.length;
    document.getElementById("clientesActivos").textContent = clientes.filter(c => c.estado === "Activo").length;
    document.getElementById("clientesInactivos").textContent = clientes.filter(c => c.estado === "Inactivo").length;
  }

  window.actualizarCliente = function(docId) {
      const clientes = JSON.parse(localStorage.getItem("clientes")) || [];
      const cliente = clientes.find(c => c.ruc === docId);
      if(cliente) abrirModal(cliente);
  };

  inicializar();
})();