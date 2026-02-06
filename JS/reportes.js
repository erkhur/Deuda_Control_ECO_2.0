// JS/reportes.js
(function() {
    const deudasBody = document.getElementById('deudasBody');
    const clientesListado = document.getElementById('clientesListado');
    const exportExcelBtn = document.getElementById('exportExcel');
    const exportPdfBtn = document.getElementById('exportPdf');
    const exportClientesBtn = document.getElementById('exportClientes');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const estadoFilter = document.getElementById('estadoFilter');
    const fechaFilter = document.getElementById('fechaFilter');
    const clienteFilter = document.getElementById('clienteFilter');
    const clientsList = document.getElementById('clientsList');
    const clienteListadoFilter = document.getElementById('clienteListadoFilter');
    const applyFilterBtn = document.getElementById('applyFilter');
    const clearFilterBtn = document.getElementById('clearFilter');
    const tableContainer = document.getElementById('tableContainer');
    const clientesListadoContainer = document.getElementById('clientesListado');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    const deudasCount = document.getElementById('deudasCount');

    const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
    const registroCuotas = JSON.parse(localStorage.getItem('registroCuotas')) || [];
    const cuotasPagadas = JSON.parse(localStorage.getItem('cuotasPagadas')) || [];
    let currentPage = 1;
    let lastTotalPages = 1;
    const pageSize = 10;

    function normalizarTexto(valor) {
        return (valor || '').toString().trim().toLowerCase();
    }


    function formatCurrency(value, moneda) {
        const symbol = moneda || 'S/';
        return `${symbol} ${(Number(value) || 0).toFixed(2)}`;
    }

    function poblarClientesList() {
        if (!clientsList) return;
        const set = new Set();
        clientes.forEach(c => {
            if (c.razonSocial) set.add(c.razonSocial);
            if (c.ruc) set.add(c.ruc);
            if (c.dni) set.add(c.dni);
            if (c.ce) set.add(c.ce);
        });
        registroCuotas.forEach(c => {
            if (c.nombreCliente) set.add(c.nombreCliente);
            if (c.rucDNI) set.add(c.rucDNI);
        });
        clientsList.innerHTML = '';
        Array.from(set).forEach(v => {
            const option = document.createElement('option');
            option.value = v;
            clientsList.appendChild(option);
        });
    }

    function getClienteMatch(key, nombre) {
        const keyNorm = normalizarTexto(key);
        const nombreNorm = normalizarTexto(nombre);

        return clientes.find(c => {
            const docs = [c.ruc, c.dni, c.ce].filter(Boolean).map(normalizarTexto);
            const razon = normalizarTexto(c.razonSocial);
            return (keyNorm && docs.includes(keyNorm)) || (nombreNorm && razon === nombreNorm);
        });
    }

    function buildComprobanteKey(serie, nro) {
        return `${serie || ''}-${nro || ''}`.trim();
    }

    function enriquecerCuota(cuota) {
        const cliente = getClienteMatch(cuota.rucDNI, cuota.nombreCliente);
        const serie = cuota.serieComprobante || '';
        const nro = cuota.nroComprobante || '';
        const comprobante = buildComprobanteKey(serie, nro);

        return {
            fechaEmision: cuota.fechaEmision || '-',
            comprobante,
            serie,
            nro,
            moneda: cuota.monedaComprobante || 'S/',
            montoTotal: Number(cuota.montoTotalComprobante || 0),
            cuotaNro: cuota.cuotaNro ?? '-',
            cuotaMonto: Number(cuota.cuotaMonto || 0),
            vencimiento: cuota.fechaVencimiento || '-',
            estadoCuota: cuota.estadoCuota || 'P',
            clienteNombre: cliente?.razonSocial || cuota.nombreCliente || 'N/A',
            clienteDoc: cliente?.ruc || cliente?.dni || cliente?.ce || cuota.rucDNI || '-',
            clienteTelefono: cliente?.telefono || '-',
            clienteEmail: cliente?.email || '-',
            clienteDireccion: cliente?.direccion || '-'
        };
    }

    function buscarPago(cuota) {
        return cuotasPagadas.find(p =>
            p.serieComprobante === cuota.serieComprobante &&
            p.nroComprobante === cuota.nroComprobante &&
            p.cuotaNro === cuota.cuotaNro
        );
    }

    function isIsoDate(value) {
        return /^\d{4}-\d{2}-\d{2}$/.test(value || '');
    }

    function toDateKey(value) {
        if (!value) return '';
        const text = value.toString().trim();
        if (isIsoDate(text)) return text;
        const isoWithTime = /^(\d{4}-\d{2}-\d{2})T/.exec(text);
        if (isoWithTime) return isoWithTime[1];
        const slash = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
        if (slash) return `${slash[3]}-${slash[2]}-${slash[1]}`;
        const dash = /^(\d{2})-(\d{2})-(\d{4})$/.exec(text);
        if (dash) return `${dash[3]}-${dash[2]}-${dash[1]}`;
        const d = new Date(text);
        if (Number.isNaN(d.getTime())) return '';
        return d.toISOString().split('T')[0];
    }

    function dentroRango(fechaStr) {
        if (!fechaStr || fechaStr === '-') return true;
        const startStr = startDateInput?.value || '';
        const endStr = endDateInput?.value || '';
        const key = toDateKey(fechaStr);
        if (!key) return true;
        if (startStr && key < startStr) return false;
        if (endStr && key > endStr) return false;
        return true;
    }

    function prepararDatos() {
        const estado = estadoFilter?.value || '';
        const fechaRef = fechaFilter?.value || 'emision';
        const query = normalizarTexto(clienteFilter?.value || '');
        const cuotasEnriquecidas = registroCuotas
            .map(enriquecerCuota)
            .filter(c => dentroRango(fechaRef === 'vencimiento' ? c.vencimiento : c.fechaEmision))
            .filter(c => !estado || c.estadoCuota === estado)
            .filter(c => !query || normalizarTexto(c.clienteNombre).includes(query) || normalizarTexto(c.clienteDoc).includes(query));

        const totalCuotasMap = cuotasEnriquecidas.reduce((acc, c) => {
            const key = c.comprobante;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        const totalesPorComprobante = cuotasEnriquecidas.reduce((acc, c) => {
            const key = c.comprobante;
            if (!acc[key]) {
                acc[key] = {
                    totalFactura: Number(c.montoTotal) || 0,
                    totalPagado: 0,
                    totalPorPagar: 0,
                    moneda: c.moneda
                };
            }
            if (c.estadoCuota === 'C') acc[key].totalPagado += Number(c.cuotaMonto) || 0;
            else acc[key].totalPorPagar += Number(c.cuotaMonto) || 0;
            return acc;
        }, {});

        return { cuotasEnriquecidas, totalCuotasMap, totalesPorComprobante };
    }

    function renderDeudas() {
        if (!deudasBody) return;
        deudasBody.innerHTML = '';

        const { cuotasEnriquecidas, totalCuotasMap, totalesPorComprobante } = prepararDatos();
        const total = cuotasEnriquecidas.length;
        const totalPages = Math.max(1, Math.ceil(total / pageSize));
        lastTotalPages = totalPages;
        if (currentPage > totalPages) currentPage = totalPages;
        const startIndex = (currentPage - 1) * pageSize;
        const ordenadas = [...cuotasEnriquecidas].sort((a, b) => {
            const nameA = normalizarTexto(a.clienteNombre);
            const nameB = normalizarTexto(b.clienteNombre);
            if (nameA !== nameB) return nameA.localeCompare(nameB);
            const compA = a.comprobante || '';
            const compB = b.comprobante || '';
            if (compA !== compB) return compA.localeCompare(compB);
            return (Number(a.cuotaNro) || 0) - (Number(b.cuotaNro) || 0);
        });
        const pageItems = ordenadas.slice(startIndex, startIndex + pageSize);

        if (total === 0) {
            deudasBody.innerHTML = '<tr><td colspan="11" class="p-8 text-center text-slate-400">Sin deudas en el rango seleccionado.</td></tr>';
            if (pageInfo) pageInfo.textContent = 'Página 1';
            if (deudasCount) deudasCount.textContent = 'Mostrando 0 registros';
            return;
        }

        const totalAbonadoPorCliente = cuotasEnriquecidas.reduce((acc, item) => {
            const key = `${item.clienteDoc}-${item.clienteNombre}`;
            if (!acc[key]) acc[key] = {};
            const pago = buscarPago({
                serieComprobante: item.serie,
                nroComprobante: item.nro,
                cuotaNro: item.cuotaNro
            });
            if (pago) {
                const moneda = pago.monedaPago || item.moneda || 'S/';
                acc[key][moneda] = (acc[key][moneda] || 0) + (Number(pago.montoPago) || 0);
            }
            return acc;
        }, {});

        const clientesRenderizados = new Set();

        pageItems.forEach(c => {
            const clienteKey = `${c.clienteDoc}-${c.clienteNombre}`;
            if (!clientesRenderizados.has(clienteKey)) {
                clientesRenderizados.add(clienteKey);
                const totales = totalAbonadoPorCliente[clienteKey] || {};
                const totalTexto = Object.keys(totales).length
                    ? Object.entries(totales).map(([moneda, monto]) => formatCurrency(monto, moneda)).join(' | ')
                    : formatCurrency(0, c.moneda);

                const trResumen = document.createElement('tr');
                trResumen.className = 'bg-slate-50 dark:bg-[#0f1724]';
                trResumen.innerHTML = `
                    <td class="px-4 py-2 text-xs font-bold text-slate-600" colspan="12">
                        ${c.clienteNombre} (${c.clienteDoc}) — Total Abonado: ${totalTexto}
                    </td>
                `;
                deudasBody.appendChild(trResumen);
            }

            const estadoClase = c.estadoCuota === 'P' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600';
            const tr = document.createElement('tr');
            tr.className = 'border-b border-[#e7ebf3] dark:border-gray-800 hover:bg-slate-50 transition-colors';
            tr.innerHTML = `
                <td class="px-4 py-3 w-[120px] whitespace-nowrap">${c.fechaEmision}</td>
                <td class="px-4 py-3 w-[180px] font-medium whitespace-nowrap">${c.clienteNombre}</td>
                <td class="px-4 py-3 w-[110px] whitespace-nowrap">${c.clienteDoc}</td>
                <td class="pl-[5px] pr-4 py-3 w-[120px] whitespace-nowrap">${c.comprobante}</td>
                <td class="px-4 py-3 w-[70px] whitespace-nowrap">${c.moneda}</td>
                <td class="px-4 py-3 w-[120px] text-right font-bold whitespace-nowrap">${formatCurrency(c.montoTotal, c.moneda)}</td>
                <td class="px-4 py-3 w-[90px] text-center whitespace-nowrap">${totalCuotasMap[c.comprobante] || 0}</td>
                <td class="px-4 py-3 w-[80px] text-center whitespace-nowrap">${c.cuotaNro}</td>
                <td class="px-4 py-3 w-[120px] text-right whitespace-nowrap">${formatCurrency(c.cuotaMonto, c.moneda)}</td>
                <td class="px-4 py-3 w-[110px] whitespace-nowrap">${c.vencimiento}</td>
                <td class="px-4 py-3 w-[90px] text-center">
                    <span class="px-2 py-1 rounded text-xs font-bold ${estadoClase}">
                        ${c.estadoCuota === 'P' ? 'Pendiente' : 'Pagada'}
                    </span>
                </td>
            `;
            deudasBody.appendChild(tr);
        });

        if (pageInfo) pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
        if (deudasCount) deudasCount.textContent = `Mostrando ${pageItems.length} de ${total} registros`;
    }

    function renderListadoPorCliente() {
        if (!clientesListado) return;
        clientesListado.innerHTML = '';

        const { cuotasEnriquecidas, totalCuotasMap } = prepararDatos();
        if (cuotasEnriquecidas.length === 0) {
            clientesListado.innerHTML = '<div class="p-6 bg-white dark:bg-[#1a2130] rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 text-center">Sin datos para listar.</div>';
            return;
        }

        const listadoQuery = normalizarTexto(clienteListadoFilter?.value || '');
        const grupos = new Map();
        cuotasEnriquecidas.forEach(c => {
            const key = `${c.clienteDoc}-${c.clienteNombre}`;
            if (!grupos.has(key)) {
                grupos.set(key, { cliente: c, items: [] });
            }
            const pago = buscarPago({
                serieComprobante: c.serie,
                nroComprobante: c.nro,
                cuotaNro: c.cuotaNro
            });
            grupos.get(key).items.push({ ...c, pago });
        });

        grupos.forEach(({ cliente, items }) => {
            const matchListado = !listadoQuery ||
                normalizarTexto(cliente.clienteNombre).includes(listadoQuery) ||
                normalizarTexto(cliente.clienteDoc).includes(listadoQuery);
            if (!matchListado) return;
            const totalAbonadoPorMoneda = items.reduce((acc, item) => {
                if (item.pago) {
                    const moneda = item.pago.monedaPago || item.moneda || 'S/';
                    acc[moneda] = (acc[moneda] || 0) + (Number(item.pago.montoPago) || 0);
                }
                return acc;
            }, {});

            const pendientesPorMoneda = items.reduce((acc, item) => {
                const key = item.comprobante;
                if (!acc._comprobantes) acc._comprobantes = {};
                if (!acc._comprobantes[key]) {
                    acc._comprobantes[key] = {
                        moneda: item.moneda || 'S/',
                        totalFactura: Number(item.montoTotal) || 0,
                        totalPagado: 0
                    };
                }
                const pago = buscarPago({
                    serieComprobante: item.serie,
                    nroComprobante: item.nro,
                    cuotaNro: item.cuotaNro
                });
                if (pago) acc._comprobantes[key].totalPagado += Number(pago.montoPago) || 0;
                return acc;
            }, {});

            Object.values(pendientesPorMoneda._comprobantes || {}).forEach(c => {
                const pendiente = Math.max(0, c.totalFactura - c.totalPagado);
                pendientesPorMoneda[c.moneda] = (pendientesPorMoneda[c.moneda] || 0) + pendiente;
            });

            const totalAbonadoTexto = Object.keys(totalAbonadoPorMoneda).length
                ? Object.entries(totalAbonadoPorMoneda).map(([m, v]) => formatCurrency(v, m)).join(' | ')
                : formatCurrency(0, 'S/');
            const totalPendienteTexto = Object.keys(pendientesPorMoneda).filter(k => k !== '_comprobantes').length
                ? Object.entries(pendientesPorMoneda).filter(([k]) => k !== '_comprobantes').map(([m, v]) => formatCurrency(v, m)).join(' | ')
                : formatCurrency(0, 'S/');

            const card = document.createElement('div');
            card.className = 'bg-white dark:bg-[#1a2130] rounded-2xl shadow-sm border border-[#e7ebf3] dark:border-gray-800 p-4';

            card.innerHTML = `
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                    <div>
                        <h3 class="text-base font-bold text-[#0d121b] dark:text-white">${cliente.clienteNombre}</h3>
                        <p class="text-xs text-slate-500">${cliente.clienteNombre} - ${cliente.clienteDoc}</p>
                    </div>
                    <div class="text-xs text-slate-500">${items.length} cuota(s)</div>
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y table-auto">
                        <thead class="bg-[#f8f9fc] dark:bg-[#0f1724] text-[10px] uppercase font-bold text-left text-[#4c669a] dark:text-gray-300">
                            <tr>
                                <th class="px-3 py-2">Fecha Comp.</th>
                                <th class="px-3 py-2">Comprobante</th>
                                <th class="px-3 py-2">Moneda</th>
                                <th class="px-3 py-2 text-right">Total</th>
                                <th class="px-3 py-2 text-center">Cuotas</th>
                                <th class="px-3 py-2 text-center">Cuota</th>
                                <th class="px-3 py-2 text-right">Monto Cuota</th>
                                <th class="px-3 py-2">Venc.</th>
                                <th class="px-3 py-2 text-center">Estado</th>
                                <th class="px-3 py-2">Fecha Pago</th>
                                <th class="px-3 py-2">Forma</th>
                                <th class="px-3 py-2">Operación</th>
                            </tr>
                        </thead>
                        <tbody class="text-xs text-slate-700 dark:text-slate-200">
                            ${items.map(item => {
                                const estadoClase = item.estadoCuota === 'P' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600';
                                return `
                                    <tr class="border-b border-slate-100 dark:border-slate-800">
                                        <td class="px-3 py-2">${item.fechaEmision}</td>
                                        <td class="px-3 py-2">${item.comprobante}</td>
                                        <td class="px-3 py-2">${item.moneda}</td>
                                        <td class="px-3 py-2 text-right font-semibold">${formatCurrency(item.montoTotal, item.moneda)}</td>
                                        <td class="px-3 py-2 text-center">${totalCuotasMap[item.comprobante] || 0}</td>
                                        <td class="px-3 py-2 text-center">${item.cuotaNro}</td>
                                        <td class="px-3 py-2 text-right font-semibold whitespace-nowrap">${formatCurrency(item.cuotaMonto, item.moneda)}</td>
                                        <td class="px-3 py-2">${item.vencimiento}</td>
                                        <td class="px-3 py-2 text-center"><span class="px-2 py-1 rounded text-[10px] font-bold ${estadoClase}">${item.estadoCuota === 'P' ? 'Pendiente' : 'Pagada'}</span></td>
                                        <td class="px-3 py-2">${item.pago?.fechaPago || '-'}</td>
                                        <td class="px-3 py-2">${item.pago?.formaPago || '-'}</td>
                                        <td class="px-3 py-2">${item.pago?.numOperacion || '-'}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="mt-3 flex items-center justify-end gap-4 text-xs font-semibold text-slate-600">
                    <div>
                        <span class="mr-2">Total Abonado:</span>
                        <span class="text-slate-900">${totalAbonadoTexto}</span>
                    </div>
                    <div>
                        <span class="mr-2">Total Pendiente:</span>
                        <span class="text-red-600">${totalPendienteTexto}</span>
                    </div>
                </div>
            `;

            clientesListado.appendChild(card);
        });
    }

    async function exportToPDF() {
        await exportDeudasAllToPDF();
    }

    function exportToExcel() {
        const { cuotasEnriquecidas, totalCuotasMap } = prepararDatos();
        if (!cuotasEnriquecidas.length) return;

        const fechaHora = new Date().toLocaleString();
        let csv = `Logo: Logo_CyM.jpeg\nReporte de Deudas\nGenerado: ${fechaHora}\n\n`;
        csv += 'Fecha Comprobante,Cliente,RUC/DNI,Comprobante,Moneda,Total Factura,Cant. Cuotas,Cuota Nro,Monto a Pagar,Vencimiento,Estado\n';

        const ordenadas = [...cuotasEnriquecidas].sort((a, b) => {
            const nameA = normalizarTexto(a.clienteNombre);
            const nameB = normalizarTexto(b.clienteNombre);
            if (nameA !== nameB) return nameA.localeCompare(nameB);
            const compA = a.comprobante || '';
            const compB = b.comprobante || '';
            if (compA !== compB) return compA.localeCompare(compB);
            return (Number(a.cuotaNro) || 0) - (Number(b.cuotaNro) || 0);
        });

        ordenadas.forEach(c => {
            const estadoText = c.estadoCuota === 'P' ? 'Pendiente' : 'Pagada';
            const row = [
                c.fechaEmision,
                c.clienteNombre,
                c.clienteDoc,
                c.comprobante,
                c.moneda,
                formatCurrency(c.montoTotal, c.moneda),
                totalCuotasMap[c.comprobante] || 0,
                c.cuotaNro,
                formatCurrency(c.cuotaMonto, c.moneda),
                c.vencimiento,
                estadoText
            ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
            csv += row + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `reporte_deudas_${Date.now()}.csv`);
        link.click();
    }

    async function exportListadoToPDF() {
        if (!window.jspdf || !window.html2canvas || !clientesListadoContainer) return;
        const { jsPDF } = window.jspdf;
        try {
            const canvas = await window.html2canvas(clientesListadoContainer, { scale: 1.2 });
            const imgData = canvas.toDataURL('image/jpeg', 0.8);
            const pdf = new jsPDF('l', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            const fechaHora = new Date().toLocaleString();

            const logoImg = new Image();
            logoImg.src = './Assests/Logo_CyM.jpeg';
            logoImg.onload = () => {
                try { pdf.addImage(logoImg, 'JPEG', 10, 5, 20, 12); } catch (e) {}
                pdf.text('Listado por Cliente - ' + fechaHora, 35, 12);
                pdf.addImage(imgData, 'JPEG', 0, 18, pdfWidth, pdfHeight);
                pdf.save(`listado_clientes_${Date.now()}.pdf`);
            };
            logoImg.onerror = () => {
                pdf.text('Listado por Cliente - ' + fechaHora, 10, 10);
                pdf.addImage(imgData, 'JPEG', 0, 15, pdfWidth, pdfHeight);
                pdf.save(`listado_clientes_${Date.now()}.pdf`);
            };
        } catch (error) {
            console.error('Error al generar PDF listado:', error);
        }
    }

    function exportListadoToExcel() {
        if (!clientesListadoContainer) return;
        const cards = clientesListadoContainer.querySelectorAll('table');
        if (!cards.length) return;

        const fechaHora = new Date().toLocaleString();
        let csv = `Logo: Logo_CyM.jpeg\nListado por Cliente\nGenerado: ${fechaHora}\n\n`;
        csv += 'Cliente,Documento,Fecha Comprobante,Comprobante,Moneda,Total,Cuotas,Cuota,Vencimiento,Estado,Fecha Pago,Forma,Operacion\\n';

        cards.forEach(table => {
            const card = table.closest('div');
            const header = card?.querySelector('h3')?.textContent?.trim() || '';
            const meta = card?.querySelector('p')?.textContent?.trim() || '';
            const rows = table.querySelectorAll('tbody tr');
            rows.forEach(row => {
                const cols = row.querySelectorAll('td');
                const rowData = Array.from(cols).map(c => `"${c.innerText.replace(/"/g, '""')}"`);
                csv += `"${header}","${meta}",${rowData.join(',')}\\n`;
            });
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `listado_clientes_${Date.now()}.csv`);
        link.click();
    }

    function renderAll() {
        currentPage = 1;
        renderDeudas();
        renderListadoPorCliente();
    }

    function renderDeudasAllRows() {
        const { cuotasEnriquecidas, totalCuotasMap } = prepararDatos();
        deudasBody.innerHTML = '';
        if (!cuotasEnriquecidas.length) return;

        const ordenadas = [...cuotasEnriquecidas].sort((a, b) => {
            const nameA = normalizarTexto(a.clienteNombre);
            const nameB = normalizarTexto(b.clienteNombre);
            if (nameA !== nameB) return nameA.localeCompare(nameB);
            const compA = a.comprobante || '';
            const compB = b.comprobante || '';
            if (compA !== compB) return compA.localeCompare(compB);
            return (Number(a.cuotaNro) || 0) - (Number(b.cuotaNro) || 0);
        });

        ordenadas.forEach(c => {
            const estadoClase = c.estadoCuota === 'P' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600';
            const tr = document.createElement('tr');
            tr.className = 'border-b border-[#e7ebf3] dark:border-gray-800';
            tr.innerHTML = `
                <td class="px-4 py-3 w-[120px] whitespace-nowrap">${c.fechaEmision}</td>
                <td class="px-4 py-3 w-[180px] font-medium whitespace-nowrap">${c.clienteNombre}</td>
                <td class="px-4 py-3 w-[110px] whitespace-nowrap">${c.clienteDoc}</td>
                <td class="pl-[5px] pr-4 py-3 w-[120px] whitespace-nowrap">${c.comprobante}</td>
                <td class="px-4 py-3 w-[70px] whitespace-nowrap">${c.moneda}</td>
                <td class="px-4 py-3 w-[120px] text-right font-bold whitespace-nowrap">${formatCurrency(c.montoTotal, c.moneda)}</td>
                <td class="px-4 py-3 w-[90px] text-center whitespace-nowrap">${totalCuotasMap[c.comprobante] || 0}</td>
                <td class="px-4 py-3 w-[80px] text-center whitespace-nowrap">${c.cuotaNro}</td>
                <td class="px-4 py-3 w-[120px] text-right whitespace-nowrap">${formatCurrency(c.cuotaMonto, c.moneda)}</td>
                <td class="px-4 py-3 w-[110px] whitespace-nowrap">${c.vencimiento}</td>
                <td class="px-4 py-3 w-[90px] text-center">
                    <span class="px-2 py-1 rounded text-xs font-bold ${estadoClase}">
                        ${c.estadoCuota === 'P' ? 'Pendiente' : 'Pagada'}
                    </span>
                </td>
            `;
            deudasBody.appendChild(tr);
        });
    }

    async function exportDeudasAllToPDF() {
        if (!window.jspdf || !window.html2canvas || !tableContainer) return;
        const prevPage = currentPage;
        renderDeudasAllRows();

        const { jsPDF } = window.jspdf;
        const element = tableContainer;
        try {
            const canvas = await window.html2canvas(element, { scale: 1.2 });
            const imgData = canvas.toDataURL('image/jpeg', 0.8);
            const pdf = new jsPDF('l', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            const fechaHora = new Date().toLocaleString();

            const logoImg = new Image();
            logoImg.src = './Assests/Logo_CyM.jpeg';
            logoImg.onload = () => {
                try { pdf.addImage(logoImg, 'JPEG', 10, 5, 20, 12); } catch (e) {}
                pdf.text('Reporte de Deudas - ' + fechaHora, 35, 12);
                pdf.addImage(imgData, 'JPEG', 0, 18, pdfWidth, pdfHeight);
                pdf.save(`reporte_deudas_${Date.now()}.pdf`);
                currentPage = prevPage;
                renderDeudas();
            };
            logoImg.onerror = () => {
                pdf.text('Reporte de Deudas - ' + fechaHora, 10, 10);
                pdf.addImage(imgData, 'JPEG', 0, 15, pdfWidth, pdfHeight);
                pdf.save(`reporte_deudas_${Date.now()}.pdf`);
                currentPage = prevPage;
                renderDeudas();
            };
        } catch (error) {
            console.error('Error al generar PDF:', error);
            currentPage = prevPage;
            renderDeudas();
        }
    }

    if (applyFilterBtn) applyFilterBtn.addEventListener('click', renderAll);
    if (clearFilterBtn) clearFilterBtn.addEventListener('click', () => {
        if (startDateInput) startDateInput.value = '';
        if (endDateInput) endDateInput.value = '';
        if (estadoFilter) estadoFilter.value = '';
        if (fechaFilter) fechaFilter.value = 'emision';
        if (clienteFilter) clienteFilter.value = '';
        if (clienteListadoFilter) clienteListadoFilter.value = '';
        renderAll();
    });

    if (exportPdfBtn) exportPdfBtn.addEventListener('click', exportToPDF);
    if (exportExcelBtn) exportExcelBtn.addEventListener('click', exportToExcel);
    if (exportClientesBtn) {
        exportClientesBtn.addEventListener('click', () => {
            // Exporta listado por cliente en PDF; si deseas Excel, cambia aquí a exportListadoToExcel()
            exportListadoToPDF();
        });
    }
    if (prevPageBtn) prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage -= 1;
            renderDeudas();
        }
    });
    if (nextPageBtn) nextPageBtn.addEventListener('click', () => {
        if (currentPage < lastTotalPages) {
            currentPage += 1;
            renderDeudas();
        }
    });
    if (clienteListadoFilter) clienteListadoFilter.addEventListener('input', renderListadoPorCliente);

    poblarClientesList();
    renderAll();
})();
