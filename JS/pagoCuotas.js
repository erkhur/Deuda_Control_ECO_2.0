// JS/pagoCuota.js
(function() {
    let cuotaEnProceso = null;

    // DELEGACIÓN DE EVENTOS GLOBAL
    document.addEventListener("click", function(e) {
        
        // 1. NAVEGACIÓN A PAGOS
        if (e.target && e.target.id === "btnNavPago") {
            const viewReg = document.getElementById("viewRegistro");
            const viewPag = document.getElementById("viewPago");
            const btnReg = document.getElementById("btnNavRegistro");
            const btnPag = document.getElementById("btnNavPago");

            if (viewPag) {
                viewReg.classList.add("hidden");
                viewPag.classList.remove("hidden");
                btnPag.classList.replace("btn-inactive", "btn-active");
                btnReg.classList.replace("btn-active", "btn-inactive");
                actualizarBuscadorClientesConPendientes();
            }
        }

        // 2. REGRESAR A REGISTRO
        if (e.target && e.target.id === "btnNavRegistro") {
            document.getElementById("viewPago").classList.add("hidden");
            document.getElementById("viewRegistro").classList.remove("hidden");
            document.getElementById("btnNavRegistro").classList.replace("btn-inactive", "btn-active");
            document.getElementById("btnNavPago").classList.replace("btn-active", "btn-inactive");
        }

        // 3. CERRAR MODAL DE PAGO
        if (e.target && e.target.id === "btnCerrarModalPago") {
            document.getElementById("modalPagarCuota").style.display = "none";
        }

        // 4. BOTÓN "PAGAR" DENTRO DEL MODAL
        if (e.target && e.target.id === "btnConfirmarPago") {
            ejecutarAccionDePago();
        }
    });

    function actualizarBuscadorClientesConPendientes() {
        const registroDB = JSON.parse(localStorage.getItem("registroCuotas")) || [];
        const clientesP = [...new Set(registroDB.filter(c => c.estadoCuota === "P").map(c => c.nombreCliente))];
        const lista = document.getElementById("listaClientesPago");
        if (lista) {
            lista.innerHTML = "";
            clientesP.forEach(n => {
                const opt = document.createElement("option");
                opt.value = n;
                lista.appendChild(opt);
            });
        }
        document.getElementById("inputClientePago").value = "";
        document.getElementById("seccionGridPagos").classList.add("hidden");
    }

    // BUSCADOR DE CLIENTES EN PAGO
    document.addEventListener("input", function(e) {
        if (e.target && e.target.id === "inputClientePago") {
            renderizarGridCobranzas(e.target.value);
        }

        // Lógica automática para Efectivo
        if (e.target && e.target.id === "pagoForma") {
            const opInput = document.getElementById("pagoOperacion");
            if (e.target.value === "E") {
                opInput.value = "00000000"; opInput.readOnly = true;
            } else {
                opInput.value = ""; opInput.readOnly = false;
            }
        }
    });

    // FUNCIÓN PARA RENDERIZAR EL GRID (CENTRALIZADA PARA ACTUALIZACIÓN)
    function renderizarGridCobranzas(nombreCliente) {
        const registroDB = JSON.parse(localStorage.getItem("registroCuotas")) || [];
        const grid = document.getElementById("seccionGridPagos");
        const tabla = document.getElementById("tablaPagosCuerpo");
        
        const pendientes = registroDB.filter(c => c.nombreCliente === nombreCliente && c.estadoCuota === "P");

        if (pendientes.length > 0) {
            grid.classList.remove("hidden");
            tabla.innerHTML = "";
            pendientes.forEach(c => {
                const fila = `
                    <tr class="border-b hover:bg-slate-50 transition-colors font-bold">
                        <td class="p-3 font-bold text-slate-500">${c.fechaEmision}</td>
                        <td class="p-3 text-blue-800 font-bold">${c.serieComprobante}-${c.nroComprobante}</td>
                        <td class="p-3">${c.monedaComprobante}</td>
                        <td class="p-3">${c.montoTotalComprobante}</td>
                        <td class="p-3 text-slate-500">Cuota ${c.cuotaNro}</td>
                        <td class="p-3 text-blue-900 font-extrabold">${c.cuotaMonto}</td>
                        <td class="p-3 text-red-600 font-bold">${c.fechaVencimiento}</td>
                        <td class="p-3 text-center">
                            <button onclick="prepararFormularioPago('${c.serieComprobante}', '${c.nroComprobante}', ${c.cuotaNro})" 
                                    class="bg-[#3b82f6] text-white px-5 py-1.5 rounded-lg text-[10px] font-bold uppercase shadow-sm">Pagar</button>
                        </td>
                    </tr>`;
                tabla.insertAdjacentHTML('beforeend', fila);
            });
        } else { grid.classList.add("hidden"); }
    }

    window.prepararFormularioPago = function(serie, numero, nro) {
        const registroDB = JSON.parse(localStorage.getItem("registroCuotas")) || [];
        
        const tienePendientePrevio = registroDB.some(c => 
            c.serieComprobante === serie && c.nroComprobante === numero && c.cuotaNro < nro && c.estadoCuota === "P"
        );

        if (tienePendientePrevio) {
            Swal.fire("Acción no permitida", "Debe cancelar las cuotas anteriores primero.", "warning");
            return;
        }

        cuotaEnProceso = registroDB.find(c => c.serieComprobante === serie && c.nroComprobante === numero && c.cuotaNro === nro);
        
        document.getElementById("resNombre").textContent = cuotaEnProceso.nombreCliente;
        document.getElementById("resComp").textContent = `${serie}-${numero}`;
        document.getElementById("resNro").textContent = nro;
        document.getElementById("resMonto").textContent = `${cuotaEnProceso.monedaComprobante} ${cuotaEnProceso.cuotaMonto}`;
        document.getElementById("pagoMonto").value = cuotaEnProceso.cuotaMonto;
        document.getElementById("pagoFecha").value = new Date().toISOString().split('T')[0];
        
        document.getElementById("modalPagarCuota").style.display = "flex";
    };

    function ejecutarAccionDePago() {
        const fechaPago = document.getElementById("pagoFecha").value;
        const montoPago = parseFloat(document.getElementById("pagoMonto").value);
        const formaPago = document.getElementById("pagoForma").value;
        const nroOp = document.getElementById("pagoOperacion").value;
        const hoy = new Date().toISOString().split('T')[0];

        if (!fechaPago || fechaPago > hoy || fechaPago < cuotaEnProceso.fechaEmision) {
            Swal.fire("Dato Inválido", "Fecha incorrecta o menor a la de emisión", "error"); return;
        }
        if (isNaN(montoPago) || montoPago <= 0 || montoPago > parseFloat(cuotaEnProceso.cuotaMonto)) {
            Swal.fire("Dato Inválido", "Monto incorrecto o excede cuota", "error"); return;
        }
        if (!nroOp) {
            Swal.fire("Dato Inválido", "Ingrese Nro de Operación", "error"); return;
        }

        const pagosDB = JSON.parse(localStorage.getItem("cuotasPagadas")) || [];
        if (formaPago !== "E" && pagosDB.some(p => p.formaPago === formaPago && p.numOperacion === nroOp)) {
            Swal.fire("Número de Operacion Existe", "", "error"); return;
        }

        // GRABACIÓN DUAL
        pagosDB.push({
            rucDNI: cuotaEnProceso.rucDNI, nombreCliente: cuotaEnProceso.nombreCliente, fechaEmision: cuotaEnProceso.fechaEmision,
            serieComprobante: cuotaEnProceso.serieComprobante, nroComprobante: cuotaEnProceso.nroComprobante,
            montoTotalComprobante: cuotaEnProceso.montoTotalComprobante, cuotaNro: cuotaEnProceso.cuotaNro,
            fechaPago: fechaPago, monedaPago: cuotaEnProceso.monedaComprobante, montoPago: montoPago.toFixed(2),
            formaPago: formaPago, numOperacion: nroOp
        });
        localStorage.setItem("cuotasPagadas", JSON.stringify(pagosDB));

        const registroDB = JSON.parse(localStorage.getItem("registroCuotas"));
        const item = registroDB.find(c => c.serieComprobante === cuotaEnProceso.serieComprobante && c.nroComprobante === cuotaEnProceso.nroComprobante && c.cuotaNro === cuotaEnProceso.cuotaNro);
        item.estadoCuota = "C";
        localStorage.setItem("registroCuotas", JSON.stringify(registroDB));

        Swal.fire("Pago Exitoso", "Cuota cancelada correctamente.", "success").then(() => {
            document.getElementById("modalPagarCuota").style.display = "none";
            // ACTUALIZACIÓN DEL GRID: Refresca la tabla del cliente actual para que la cuota pagada desaparezca
            renderizarGridCobranzas(cuotaEnProceso.nombreCliente);
        });
    }
})();
