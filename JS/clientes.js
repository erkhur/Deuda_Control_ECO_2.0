// JS/clientes.js
(function() {
  let currentPage = 1;
  const clientesPorPagina = 8;
  let filtroBusqueda = "";

  function inicializar() {
    renderClientes();
    
    const inputBusqueda = document.getElementById("inputBusqueda");
    if (inputBusqueda) {
      inputBusqueda.addEventListener("input", (e) => {
        filtroBusqueda = e.target.value;
        renderClientes(1);
      });
    }

    const btnRegistro = document.getElementById("registroCliente");
    if (btnRegistro) {
      btnRegistro.addEventListener("click", () => abrirModal());
    }

    const btnExport = document.getElementById("exportarClientes");
    if (btnExport) {
        btnExport.addEventListener("click", () => exportarAExcel());
    }
  }

  function renderClientes(page = 1) {
    const tabla = document.getElementById("tablaClientes");
    const footer = document.getElementById("footerPaginacion");
    let clientes = JSON.parse(localStorage.getItem("clientes")) || [];

    if (filtroBusqueda.trim() !== "") {
      const texto = filtroBusqueda.toLowerCase();
      clientes = clientes.filter(c => 
        (c.ruc || c.dni || c.ce || "").toLowerCase().includes(texto) || 
        c.razonSocial.toLowerCase().includes(texto) || 
        c.nombreContacto.toLowerCase().includes(texto)
      );
    }

    clientes.sort((a, b) => a.razonSocial.localeCompare(b.razonSocial));
    const totalClientes = clientes.length;
    const totalPaginas = Math.ceil(totalClientes / clientesPorPagina);
    currentPage = page;

    if (totalClientes === 0) {
      tabla.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-slate-400">No hay clientes registrados.</td></tr>';
      if(footer) footer.innerHTML = "";
      return;
    }

    const inicio = (page - 1) * clientesPorPagina;
    const fin = inicio + clientesPorPagina;
    const clientesPagina = clientes.slice(inicio, fin);

    tabla.innerHTML = clientesPagina.map(cliente => `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="px-6 py-4 text-sm text-slate-500 font-medium">
            <span class="text-[10px] text-slate-400 block">${cliente.tipoDoc || 'RUC'}</span>
            ${cliente.ruc || cliente.dni || cliente.ce}
        </td>
        <td class="px-6 py-4 text-sm font-bold text-slate-900">${cliente.razonSocial}</td>
        <td class="px-6 py-4 text-sm text-slate-500">${cliente.direccion}</td>
        <td class="px-6 py-4 text-sm font-medium">${cliente.nombreContacto}</td>
        <td class="px-6 py-4 text-sm text-slate-500">${cliente.email}<br><span class="text-xs">+51 ${cliente.telefono}</span></td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${cliente.estado === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}">
            ${cliente.estado}
          </span>
        </td>
        <td class="px-6 py-4 text-right">
            <button onclick="actualizarCliente('${cliente.ruc || cliente.dni || cliente.ce}')" class="p-1 text-slate-400 hover:text-primary"><span class="material-symbols-outlined text-[18px]">edit</span></button>
        </td>
      </tr>
    `).join("");

    actualizarMetricas(clientes);
  }

  function abrirModal(clienteExistente = null) {
    const overlay = document.createElement("div");
    overlay.className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm";
    
    overlay.innerHTML = `
      <div class="bg-white dark:bg-[#1a212f] w-full max-w-[640px] rounded-xl shadow-2xl overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b">
          <div class="flex items-center gap-3">
            <h2 class="text-xl font-bold">${clienteExistente ? 'Actualizar' : 'Nuevo'} Cliente</h2>
            <div class="h-6 w-px bg-slate-200"></div>
            <label class="text-xs font-bold text-slate-500">TIPO DOC:</label>
            <select id="modalTipoDoc" class="text-xs border-none bg-slate-100 rounded-md focus:ring-0 font-bold" ${clienteExistente ? 'disabled' : ''}>
                <option value="RUC" ${clienteExistente?.tipoDoc === 'RUC' ? 'selected' : ''}>RUC</option>
                <option value="DNI" ${clienteExistente?.tipoDoc === 'DNI' ? 'selected' : ''}>DNI</option>
                <option value="CE" ${clienteExistente?.tipoDoc === 'CE' ? 'selected' : ''}>CE</option>
            </select>
          </div>
          <button id="cerrarModal" class="text-slate-400 hover:text-slate-600"><span class="material-symbols-outlined">close</span></button>
        </div>
        <div class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-1">
                    <label id="labelDoc" class="text-[10px] font-bold text-slate-400 uppercase">RUC</label>
                    <input id="modalNumDoc" type="text" value="${clienteExistente ? (clienteExistente.ruc || clienteExistente.dni || clienteExistente.ce) : ''}" ${clienteExistente ? 'disabled' : ''} class="form-input rounded-lg border-slate-200" placeholder="Ingrese número">
                </div>
                <div class="flex flex-col gap-1">
                    <label class="text-[10px] font-bold text-slate-400 uppercase">Estado</label>
                    <select id="modalEstado" class="form-select rounded-lg border-slate-200">
                        <option value="Activo" ${clienteExistente?.estado === 'Activo' ? 'selected' : ''}>Activo</option>
                        <option value="Inactivo" ${clienteExistente?.estado === 'Inactivo' ? 'selected' : ''}>Inactivo</option>
                    </select>
                </div>
            </div>
            <input id="modalRazon" value="${clienteExistente ? clienteExistente.razonSocial : ''}" class="form-input w-full rounded-lg border-slate-200" placeholder="Razón Social / Nombre Legal">
            <input id="modalDireccion" value="${clienteExistente ? clienteExistente.direccion : ''}" class="form-input w-full rounded-lg border-slate-200" placeholder="Dirección">
            <input id="modalContacto" value="${clienteExistente ? clienteExistente.nombreContacto : ''}" class="form-input w-full rounded-lg border-slate-200" placeholder="Nombre de Contacto">
            <div class="grid grid-cols-2 gap-4">
                <input id="modalTelf" value="${clienteExistente ? clienteExistente.telefono : ''}" class="form-input rounded-lg border-slate-200" placeholder="Teléfono">
                <input id="modalEmail" value="${clienteExistente ? clienteExistente.email : ''}" class="form-input rounded-lg border-slate-200" placeholder="Email">
            </div>
        </div>
        <div class="px-6 py-4 bg-slate-50 flex justify-end gap-3">
          <button id="cancelarModal" class="px-6 py-2 rounded-lg text-sm font-semibold">Cancelar</button>
          <button id="guardarCliente" class="bg-primary text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm">Guardar Cliente</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const selectTipo = overlay.querySelector("#modalTipoDoc");
    const labelDoc = overlay.querySelector("#labelDoc");
    const numDocInput = overlay.querySelector("#modalNumDoc");

    // Lógica de cambio de etiquetas dinámicas
    selectTipo.addEventListener("change", () => {
        labelDoc.textContent = selectTipo.value;
    });

    // Forzar etiqueta inicial en edición
    if(clienteExistente) labelDoc.textContent = clienteExistente.tipoDoc || 'RUC';

    const cerrar = () => overlay.remove();
    overlay.querySelector("#cerrarModal").onclick = cerrar;
    overlay.querySelector("#cancelarModal").onclick = cerrar;

    overlay.querySelector("#guardarCliente").onclick = () => {
      const tipoDoc = selectTipo.value;
      const numDoc = numDocInput.value.trim();
      const razonSocial = document.getElementById("modalRazon").value.trim();
      const estado = document.getElementById("modalEstado").value;
      
      // --- VALIDACIONES DE NEGOCIO ---
      const isNumeric = /^\d+$/.test(numDoc);
      
      if (tipoDoc === "DNI") {
          if (!isNumeric || numDoc.length !== 8 || numDoc === "00000000") {
              return Swal.fire("Atención", "Número de DNI erróneo", "error");
          }
      } else if (tipoDoc === "RUC") {
          const startValid = numDoc.startsWith("10") || numDoc.startsWith("20");
          if (!isNumeric || numDoc.length !== 11 || numDoc === "00000000000" || !startValid) {
              return Swal.fire("Atención", "Número de RUC eróneo", "error");
          }
      } else if (tipoDoc === "CE") {
          if (!isNumeric || numDoc.length > 11 || parseInt(numDoc) < 1) {
              return Swal.fire("Atención", "Carnet de Extranjeria inválido", "error");
          }
      }

      if(razonSocial.length < 5) return Swal.fire("Error", "Razón social muy corta.", "error");

      let clientes = JSON.parse(localStorage.getItem("clientes")) || [];
      
      const nuevoObjeto = {
          tipoDoc,
          ruc: tipoDoc === "RUC" ? numDoc : null,
          dni: tipoDoc === "DNI" ? numDoc : null,
          ce: tipoDoc === "CE" ? numDoc : null,
          razonSocial, 
          estado, 
          direccion: document.getElementById("modalDireccion").value, 
          nombreContacto: document.getElementById("modalContacto").value, 
          telefono: document.getElementById("modalTelf").value, 
          email: document.getElementById("modalEmail").value
      };

      if(clienteExistente) {
          clientes = clientes.map(c => (c.ruc || c.dni || c.ce) === numDoc ? {...nuevoObjeto, fechaRegistro: c.fechaRegistro} : c);
      } else {
          if(clientes.some(c => (c.ruc || c.dni || c.ce) === numDoc)) return Swal.fire("Error", "El documento ya existe registrado.", "error");
          nuevoObjeto.fechaRegistro = new Date().toLocaleString();
          clientes.push(nuevoObjeto);
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
      const cliente = clientes.find(c => (c.ruc || c.dni || c.ce) === docId);
      if(cliente) abrirModal(cliente);
  };

  inicializar();
})();