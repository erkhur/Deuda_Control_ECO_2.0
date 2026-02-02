// JS/reportes.js
(function() {
    console.log("Ejecutando lógica de reportes...");

    const clientesBody = document.getElementById('clientesBody');
    const registroBody = document.getElementById('registroBody');
    const exportExcelBtn = document.getElementById('exportExcel');
    const exportPdfBtn = document.getElementById('exportPdf');
    const exportExcelDetalleBtn = document.getElementById('exportExcelDetalle');
    const exportPdfDetalleBtn = document.getElementById('exportPdfDetalle');
    const estadoFilter = document.getElementById('estadoFilter');
    const clienteFilter = document.getElementById('clienteFilter');
    const clientsList = document.getElementById('clientsList');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const applyFilterBtn = document.getElementById('applyFilter');
    const clearFilterBtn = document.getElementById('clearFilter');
    const tabResumen = document.getElementById('tabResumen');
    const tabDetalle = document.getElementById('tabDetalle');
    const clientesContainer = document.getElementById('clientesContainer');
    const registroContainer = document.getElementById('registroContainer');

    // Recuperar datos
    let clientes = JSON.parse(localStorage.getItem('clientes')) || [];
    let registroCuotas = JSON.parse(localStorage.getItem('registroCuotas')) || [];
    let currentFilteredClientes = [];
    let currentFilteredRegistro = [];

    function formatCurrency(value) {
        return 'S/ ' + (Number(value) || 0).toFixed(2);
    }

    function renderClientesTable() {
        if (!clientesBody) return;
        clientesBody.innerHTML = '';

        const start = startDateInput.value ? new Date(startDateInput.value) : null;
        const end = endDateInput.value ? new Date(endDateInput.value) : null;

        const clienteQ = clienteFilter && clienteFilter.value ? clienteFilter.value.trim().toLowerCase() : '';

        const filtered = clientes.filter(c => {
            const fecha = c.fecha ? new Date(c.fecha) : (c.fechaRegistro ? new Date(c.fechaRegistro) : null);
            if (!fecha) return false; // ensure clients have a date for resumen filtering
            if (start && fecha < start) return false;
            if (end && fecha > end) return false;
            if (clienteQ) {
                const hay = ((c.razonSocial || c.nombreCliente || c.nombre || '') + ' ' + (c.ruc || c.rucDni || '') + ' ' + (c.clienteId || '')).toLowerCase();
                if (!hay.includes(clienteQ)) return false;
            }
            return true;
        });

        currentFilteredClientes = filtered;

        if (filtered.length === 0) {
            clientesBody.innerHTML = `<tr><td colspan="9" class="p-8 text-center text-slate-400">Sin datos en el rango seleccionado.</td></tr>`;
            return;
        }

        filtered.forEach(c => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-[#e7ebf3] dark:border-gray-800 hover:bg-slate-50 transition-colors font-medium';
            tr.innerHTML = `
                <td class="px-4 py-3">${c.fecha || c.fechaRegistro || '-'}</td>
                <td class="px-4 py-3"><div class="whitespace-nowrap overflow-hidden" style="max-width:320px;text-overflow:ellipsis">${c.razonSocial || c.nombreCliente || c.nombre || '-'}</div></td>
                <td class="px-4 py-3"><div class="whitespace-nowrap overflow-hidden" style="max-width:160px;text-overflow:ellipsis">${c.ruc || c.rucDni || 'Sin RUC'}</div></td>
                <td class="px-4 py-3">${c.telefono || '-'}</td>
                <td class="px-4 py-3">${c.email || '-'}</td>
                <td class="px-4 py-3">${c.facturas || 0}</td>
                <td class="px-4 py-3">${c.cuotas || 0}</td>
                <td class="px-4 py-3 text-right"><div class="whitespace-nowrap overflow-hidden" style="max-width:140px;text-overflow:ellipsis;text-align:right">${formatCurrency(c.montoInicial || c.monto)}</div></td>
                <td class="px-4 py-3 text-right text-green-600 font-bold"><div class="whitespace-nowrap overflow-hidden" style="max-width:140px;text-overflow:ellipsis;text-align:right">${formatCurrency(c.montoPagado)}</div></td>
            `;
            clientesBody.appendChild(tr);
        });
    }

    function renderRegistroTable() {
        if (!registroBody) return;
        registroBody.innerHTML = '';

        const start = startDateInput.value ? new Date(startDateInput.value) : null;
        const end = endDateInput.value ? new Date(endDateInput.value) : null;

        const clienteQ = clienteFilter && clienteFilter.value ? clienteFilter.value.trim().toLowerCase() : '';
        const estadoQ = estadoFilter && estadoFilter.value ? estadoFilter.value : '';

        const filtered = registroCuotas.filter(r => {
            const fecha = r.fechaEmision ? new Date(r.fechaEmision) : null;
            if (!fecha) return false;
            if (start && fecha < start) return false;
            if (end && fecha > end) return false;
            if (estadoQ) {
                if ((r.estadoCuota || '').toString() !== estadoQ) return false;
            }
            if (clienteQ) {
                const hay = ((r.nombreCliente || '') + ' ' + (r.rucDni || r.ruc || '') + ' ' + (r.clienteId || '')).toLowerCase();
                if (!hay.includes(clienteQ)) return false;
            }
            return true;
        });

        currentFilteredRegistro = filtered;

        if (filtered.length === 0) {
            registroBody.innerHTML = `<tr><td colspan="11" class="p-8 text-center text-slate-400">Sin cuotas en el rango seleccionado.</td></tr>`;
            return;
        }

        filtered.forEach(r => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-[#e7ebf3] dark:border-gray-800 hover:bg-slate-50 transition-colors font-medium';
            tr.innerHTML = `
                <td class="px-4 py-3">${r.fechaEmision || '-'}</td>
                <td class="px-4 py-3">${r.nombreCliente || r.razonSocial || '-'}</td>
                <td class="px-4 py-3">${r.rucDni || r.ruc || '-'}</td>
                <td class="px-4 py-3">${r.serieComprobante || '-'}</td>
                <td class="px-4 py-3">${r.nroComprobante || '-'}</td>
                <td class="px-4 py-3">${r.monedaComprobante || '-'}</td>
                <td class="px-4 py-3 text-right"><div class="whitespace-nowrap overflow-hidden" style="max-width:140px;text-overflow:ellipsis;text-align:right">${formatCurrency(r.montoTotalComprobante)}</div></td>
                <td class="px-4 py-3">${r.cuotaNro || '-'}</td>
                <td class="px-4 py-3 text-right"><div class="whitespace-nowrap overflow-hidden" style="max-width:140px;text-overflow:ellipsis;text-align:right">${formatCurrency(r.cuotaMonto)}</div></td>
                <td class="px-4 py-3">${r.fechaVencimiento || '-'}</td>
                <td class="px-4 py-3">${r.estadoCuota || '-'}</td>
            `;
            registroBody.appendChild(tr);
        });
    }

    // CSV export helper
    function exportToCsv(filename, rows) {
        if (!rows || !rows.length) return;
        const headers = Object.keys(rows[0]);
        const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g,'""')}"`).join(','))).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Simple PDF export via html2canvas + jsPDF if available
    async function exportElementToPdf(element, filename) {
        if (!element) return;
        if (window.html2canvas && window.jspdf) {
            const canvas = await window.html2canvas(element, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new window.jspdf.jsPDF('l', 'pt', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(filename);
        } else {
            alert('html2canvas/jsPDF no están disponibles para exportar PDF.');
        }
    }

    // Exports and UI
    function populateClientDatalist() {
        if (!clientsList) return;
        clientsList.innerHTML = '';
        clientes.forEach(c => {
            const opt = document.createElement('option');
            opt.value = `${(c.razonSocial || c.nombreCliente || c.nombre || '')} ${c.ruc || c.rucDni || ''}`.trim();
            clientsList.appendChild(opt);
        });
    }

    function applyFiltersAndRender() {
        clientes = JSON.parse(localStorage.getItem('clientes')) || [];
        registroCuotas = JSON.parse(localStorage.getItem('registroCuotas')) || [];
        populateClientDatalist();
        renderClientesTable();
        renderRegistroTable();
    }

    if (applyFilterBtn) applyFilterBtn.addEventListener('click', () => {
        applyFiltersAndRender();
    });

    if (clearFilterBtn) clearFilterBtn.addEventListener('click', () => {
        startDateInput.value = '';
        endDateInput.value = '';
        if (estadoFilter) estadoFilter.value = '';
        if (clienteFilter) clienteFilter.value = '';
        applyFiltersAndRender();
    });

    if (exportExcelBtn) exportExcelBtn.addEventListener('click', () => {
        // Export clientes summary as CSV using current filtered data
        const rows = (currentFilteredClientes.length ? currentFilteredClientes : (JSON.parse(localStorage.getItem('clientes')) || [])).map(c => ({
            fecha: c.fecha || c.fechaRegistro || '',
            razonSocial: c.razonSocial || c.nombreCliente || c.nombre || '',
            rucDni: c.ruc || c.rucDni || '',
            telefono: c.telefono || '',
            email: c.email || '',
            facturas: c.facturas || 0,
            cuotas: c.cuotas || 0,
            montoInicial: c.montoInicial || c.monto || 0,
            montoPagado: c.montoPagado || 0
        }));
        exportToCsv('reportes_clientes.csv', rows);
    });

    if (exportExcelDetalleBtn) exportExcelDetalleBtn.addEventListener('click', () => {
        const rowsSource = (currentFilteredRegistro.length ? currentFilteredRegistro : (JSON.parse(localStorage.getItem('registroCuotas')) || []));
        const rows = rowsSource.map(r => ({
            fechaEmision: r.fechaEmision || '',
            razonSocial: r.nombreCliente || r.razonSocial || '',
            rucDni: r.rucDni || r.ruc || '',
            serieComprobante: r.serieComprobante || '',
            nroComprobante: r.nroComprobante || '',
            monedaComprobante: r.monedaComprobante || '',
            montoTotalComprobante: r.montoTotalComprobante || 0,
            cuotaNro: r.cuotaNro || '',
            cuotaMonto: r.cuotaMonto || 0,
            fechaVencimiento: r.fechaVencimiento || '',
            estadoCuota: r.estadoCuota || ''
        }));
        exportToCsv('reportes_registro_cuotas.csv', rows);
    });

    if (exportPdfBtn) exportPdfBtn.addEventListener('click', () => {
        exportElementToPdf(document.getElementById('clientesContainer'), 'reportes_clientes.pdf');
    });

    if (exportPdfDetalleBtn) exportPdfDetalleBtn.addEventListener('click', () => {
        exportElementToPdf(document.getElementById('registroContainer'), 'reportes_registro_cuotas.pdf');
    });

    // Tab switching
    if (tabResumen) tabResumen.addEventListener('click', () => {
        clientesContainer.classList.remove('hidden');
        registroContainer.classList.add('hidden');
        tabResumen.classList.add('bg-primary');
        tabResumen.classList.remove('bg-white');
        tabResumen.classList.add('text-white');
        tabDetalle.classList.remove('bg-primary');
        tabDetalle.classList.add('bg-white');
        tabDetalle.classList.remove('text-white');
    });

    if (tabDetalle) tabDetalle.addEventListener('click', () => {
        clientesContainer.classList.add('hidden');
        registroContainer.classList.remove('hidden');
        tabDetalle.classList.add('bg-primary');
        tabDetalle.classList.remove('bg-white');
        tabDetalle.classList.add('text-white');
        tabResumen.classList.remove('bg-primary');
        tabResumen.classList.add('bg-white');
        tabResumen.classList.remove('text-white');
    });

    // listen for external updates
    window.addEventListener('reportes:refresh', () => {
        clientes = JSON.parse(localStorage.getItem('clientes')) || [];
        registroCuotas = JSON.parse(localStorage.getItem('registroCuotas')) || [];
        populateClientDatalist();
        renderClientesTable();
        renderRegistroTable();
    });

    // wire quick filters
    if (estadoFilter) estadoFilter.addEventListener('change', () => { renderRegistroTable(); });
    if (clienteFilter) clienteFilter.addEventListener('input', () => { renderClientesTable(); renderRegistroTable(); });

    // Initial setup & render
    populateClientDatalist();
    renderClientesTable();
    renderRegistroTable();
})();

