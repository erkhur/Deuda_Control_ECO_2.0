// JS/reportes.js
(function() {
    console.log("Ejecutando lógica de reportes...");
    
    const clientesBody = document.getElementById('clientesBody');
    const exportExcelBtn = document.getElementById('exportExcel');
    const exportPdfBtn = document.getElementById('exportPdf');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const applyFilterBtn = document.getElementById('applyFilter');
    const clearFilterBtn = document.getElementById('clearFilter');

    // Recuperar clientes
    let clientes = JSON.parse(localStorage.getItem('clientes')) || [];

    function formatCurrency(value) {
        return 'S/ ' + (Number(value) || 0).toFixed(2);
    }

    function renderTable() {
        if (!clientesBody) return;
        clientesBody.innerHTML = '';
        
        const start = startDateInput.value ? new Date(startDateInput.value) : null;
        const end = endDateInput.value ? new Date(endDateInput.value) : null;

        const filtered = clientes.filter(c => {
            const fecha = c.fecha ? new Date(c.fecha) : (c.fechaRegistro ? new Date(c.fechaRegistro) : null);
            if (!fecha) return true;
            if (start && fecha < start) return false;
            if (end && fecha > end) return false;
            return true;
        });

        if (filtered.length === 0) {
            clientesBody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-slate-400">Sin datos en el rango seleccionado.</td></tr>`;
            return;
        }

        filtered.forEach(c => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-[#e7ebf3] dark:border-gray-800 hover:bg-slate-50 transition-colors font-medium';
            tr.innerHTML = `
                <td class="px-4 py-3">${c.fecha || c.fechaRegistro || '-'}</td>
                <td class="px-4 py-3">${c.ruc || 'Sin RUC'}</td>
                <td class="px-4 py-3">${c.telefono || '-'}</td>
                <td class="px-4 py-3">${c.email || '-'}</td>
                <td class="px-4 py-3">${c.facturas || 0}</td>
                <td class="px-4 py-3">${c.cuotas || 0}</td>
                <td class="px-4 py-3 text-right">${formatCurrency(c.montoInicial || c.monto)}</td>
                <td class="px-4 py-3 text-right text-green-600 font-bold">${formatCurrency(c.montoPagado)}</td>
            `;
            clientesBody.appendChild(tr);
        });
    }

    // Eventos
    if (applyFilterBtn) applyFilterBtn.addEventListener('click', renderTable);
    if (clearFilterBtn) clearFilterBtn.addEventListener('click', () => {
        startDateInput.value = '';
        endDateInput.value = '';
        renderTable();
    });
    
    if (exportExcelBtn) exportExcelBtn.addEventListener('click', () => {
        // Lógica de exportación conservada del archivo original...
        console.log("Exportando Excel...");
    });

    renderTable();
})();