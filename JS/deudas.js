// JS/deudas.js

function inicializarModuloDeudas() {
    // Referencias de Cabecera
    const inputCliente = document.getElementById("inputCliente");
    const listaClientes = document.getElementById("listaClientes");
    const formComprobante = document.getElementById("formComprobante");
    const fechaEmision = document.getElementById("fechaEmision");
    const serieComprobante = document.getElementById("serieComprobante");
    const nroComprobante = document.getElementById("nroComprobante");
    const monedaComprobante = document.getElementById("monedaComprobante");
    const montoTotal = document.getElementById("montoTotalComprobante");
    const cuotasNroTotal = document.getElementById("cuotasNroInput");
    const btnGenerar = document.getElementById("btnGenerarCuotas");

    // Referencias Modal e Iteración
    const modal = document.getElementById("modalCuotas");
    const cuotaMontoInput = document.getElementById("cuotaMontoInput");
    const cuotaFechaInput = document.getElementById("cuotaFechaInput");
    const btnContinuar = document.getElementById("btnSiguienteCuota");
    const txtPendiente = document.getElementById("txtPendienteModal");
    const tituloModal = document.getElementById("tituloModalCuota");

    // Referencias Grid Resumen
    const seccionResumen = document.getElementById("seccionResumen");
    const tablaCuerpo = document.getElementById("tablaResumenCuerpo");

    // Variables de Control de Estado
    let cuotasIteracion = [];
    let nroCuotaActual = 1;
    let acumuladoCuotas = 0;
    const clientesDB = JSON.parse(localStorage.getItem("clientes")) || [];

    // 1. Cargar Clientes Reales - FILTRADO POR ESTADO "Activo"
    listaClientes.innerHTML = "";
    // Se adiciona el filtro .filter(c => c.estado === "Activo") solicitado
    clientesDB.filter(c => c.estado === "Activo").forEach(c => {
        const option = document.createElement("option");
        option.value = c.razonSocial;
        listaClientes.appendChild(option);
    });

    inputCliente.addEventListener("input", () => {
        // Al validar la existencia, también verificamos que sea un cliente activo
        const existe = clientesDB.some(c => c.razonSocial === inputCliente.value && c.estado === "Activo");
        existe ? formComprobante.classList.remove("hidden") : formComprobante.classList.add("hidden");
    });

    // 2. Validaciones de Cabecera
    fechaEmision.addEventListener("change", () => {
        const hoy = new Date().toISOString().split('T')[0];
        if (fechaEmision.value && fechaEmision.value > hoy) {
            Swal.fire("Fecha Invalida", "La fecha no puede ser futura.", "error");
            fechaEmision.value = "";
        }
    });

    serieComprobante.addEventListener("blur", () => {
        serieComprobante.value = serieComprobante.value.toUpperCase();
    });

    nroComprobante.addEventListener("input", (e) => {
        if (e.target.value < 0) e.target.value = "";
    });

    montoTotal.addEventListener("input", (e) => {
        let val = e.target.value;
        if (val < 0) e.target.value = 0;
        if (val.includes(".") && val.split(".")[1].length > 2) {
            e.target.value = parseFloat(val).toFixed(2);
        }
    });

    // 3. Inicio del Proceso de Cronograma
    btnGenerar.onclick = () => {
        const registroCuotasDB = JSON.parse(localStorage.getItem("registroCuotas")) || [];
        const serie = serieComprobante.value.toUpperCase();
        const numero = nroComprobante.value;

        // Validar vacíos
        if (!fechaEmision.value || !serie || !numero || !montoTotal.value || !cuotasNroTotal.value) {
            Swal.fire("Campos Incompletos", "Por favor llene todos los datos.", "warning");
            return;
        }

        // Validar Unicidad Serie + Número
        const duplicado = registroCuotasDB.some(r => r.serieComprobante === serie && r.nroComprobante === numero);
        if (duplicado) {
            Swal.fire("Comprobante ya Registrado", "", "error");
            serieComprobante.value = ""; nroComprobante.value = "";
            return;
        }

        // Resetear iteración
        nroCuotaActual = 1;
        acumuladoCuotas = 0;
        cuotasIteracion = [];
        tablaCuerpo.innerHTML = "";
        seccionResumen.classList.add("hidden");

        abrirModalCuota();
    };

    function abrirModalCuota() {
        tituloModal.textContent = `DATOS DE CUOTA ${nroCuotaActual} / ${cuotasNroTotal.value}`;
        const pendiente = parseFloat(montoTotal.value) - acumuladoCuotas;
        txtPendiente.textContent = `${monedaComprobante.value} ${pendiente.toFixed(2)}`;
        
        cuotaMontoInput.value = (nroCuotaActual == cuotasNroTotal.value) ? pendiente.toFixed(2) : "";
        cuotaFechaInput.value = "";
        modal.style.display = "flex";
    }

    // 4. Lógica de Continuar (Iteración de cuotas)
    btnContinuar.onclick = () => {
        let monto = parseFloat(cuotaMontoInput.value);
        let fecha = cuotaFechaInput.value;
        const totalComprobante = parseFloat(montoTotal.value);

        // Validar Monto
        if (isNaN(monto) || monto <= 0 || (cuotaMontoInput.value.split(".")[1] || "").length > 2) {
            Swal.fire("Dato Inválido", "Monto de cuota incorrecto.", "error");
            return;
        }

        // Validar Fecha (Mayor a emisión y mayor a cuota anterior)
        const fechaMinima = nroCuotaActual === 1 ? fechaEmision.value : cuotasIteracion[nroCuotaActual - 2].fechaVencimiento;
        if (!fecha || fecha <= fechaMinima) {
            Swal.fire("Dato Inválido", "La fecha debe ser posterior a la emisión o cuota previa.", "error");
            return;
        }

        // Ajuste automático en la última cuota
        if (nroCuotaActual == cuotasNroTotal.value) {
            const sumaTotal = parseFloat((acumuladoCuotas + monto).toFixed(2));
            if (sumaTotal !== totalComprobante) {
                monto = totalComprobante - acumuladoCuotas;
                Swal.fire("Ultima cuota se ajustó al Total Comprobante", "", "info");
            }
        } else if (parseFloat((acumuladoCuotas + monto).toFixed(2)) >= totalComprobante) {
            Swal.fire("Dato Inválido", "El monto acumulado no puede superar el total.", "error");
            return;
        }

        // Guardar temporalmente e imprimir en Grid
        cuotasIteracion.push({ cuotaNro: nroCuotaActual, fechaVencimiento: fecha, cuotaMonto: monto.toFixed(2) });
        
        const fila = `<tr><td class="border p-3">Cuota ${nroCuotaActual}</td><td class="border p-3">${fecha}</td><td class="border p-3">${monedaComprobante.value} ${monto.toFixed(2)}</td></tr>`;
        tablaCuerpo.insertAdjacentHTML('beforeend', fila);

        acumuladoCuotas += monto;

        if (nroCuotaActual < cuotasNroTotal.value) {
            nroCuotaActual++;
            abrirModalCuota();
        } else {
            modal.style.display = "none";
            seccionResumen.classList.remove("hidden");
        }
    };

    // 5. Botones Finales (Guardar y Cancelar)
    document.getElementById("btnCancelarRegistro").onclick = () => {
        Swal.fire({
            title: "¿SEGURO QUE DESEA CANCELAR?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: "SÍ",
            cancelButtonText: "NO"
        }).then((result) => {
            if (result.isConfirmed) location.reload();
        });
    };

    document.getElementById("btnGuardarRegistro").onclick = () => {
        const registroCuotasDB = JSON.parse(localStorage.getItem("registroCuotas")) || [];
        const clienteObj = clientesDB.find(c => c.razonSocial === inputCliente.value);

        cuotasIteracion.forEach(c => {
            registroCuotasDB.push({
                rucDNI: clienteObj.ruc || clienteObj.razonSocial,
                nombreCliente: clienteObj.razonSocial,
                fechaEmision: fechaEmision.value,
                serieComprobante: serieComprobante.value.toUpperCase(),
                nroComprobante: nroComprobante.value,
                monedaComprobante: monedaComprobante.value,
                montoTotalComprobante: parseFloat(montoTotal.value).toFixed(2),
                cuotaNro: c.cuotaNro,
                cuotaMonto: c.cuotaMonto,
                fechaVencimiento: c.fechaVencimiento,
                estadoCuota: "P"
            });
        });

        localStorage.setItem("registroCuotas", JSON.stringify(registroCuotasDB));
        Swal.fire({ icon: 'success', title: 'Registro Guardado', showConfirmButton: false, timer: 1500 });
        
        limpiarYReiniciarFormulario();
    };

    function limpiarYReiniciarFormulario() {
        inputCliente.value = "";
        fechaEmision.value = "";
        serieComprobante.value = "";
        nroComprobante.value = "";
        montoTotal.value = "";
        cuotasNroTotal.value = "";
        formComprobante.classList.add("hidden");
        seccionResumen.classList.add("hidden");
        tablaCuerpo.innerHTML = "";
        inputCliente.focus();
    }
}

// Inicialización
if (document.readyState === "complete" || document.readyState === "interactive") {
    inicializarModuloDeudas();
} else {
    document.addEventListener("DOMContentLoaded", inicializarModuloDeudas);
}