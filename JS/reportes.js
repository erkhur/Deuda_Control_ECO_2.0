document.addEventListener('DOMContentLoaded', () => {
    const clientesBody = document.getElementById('clientesBody');
    const exportExcelBtn = document.getElementById('exportExcel');
    const exportPdfBtn = document.getElementById('exportPdf');
    const tableContainer = document.getElementById('tableContainer');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const applyFilterBtn = document.getElementById('applyFilter');
    const clearFilterBtn = document.getElementById('clearFilter');
    const goDashboardBtn = document.getElementById('goDashboard');
    const logoutBtn = document.getElementById('logoutBtn');

    // Load clientes from localStorage or derive from usuarios
    let clientes = JSON.parse(localStorage.getItem('clientes')) || null;
    const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];

    if (!clientes) {
        // Build a default clientes list from usuarios (if any)
        clientes = usuarios.map((u, idx) => ({
            id: idx + 1,
            ruc: u.ruc || u.nombre || 'Sin RUC',
            telefono: u.telefono || '-',
            email: u.email || '-',
            facturas: u.facturas || 0,
            cuotas: u.cuotas || u.cantidadCuotas || 0,
            montoInicial: u.montoInicial || u.monto || 0.00,
            montoPagado: u.montoPagado || u.montoPagado || 0.00,
            // try to use a date from user or default to today
            fecha: u.fecha || new Date().toISOString().split('T')[0]
        }));
        // If still empty, add some sample data to show the UI
        if (clientes.length === 0) {
            clientes = [
                { id: 1, ruc: '20123456789', telefono: '987654321', email: 'contacto@uno.com', facturas: 3, cuotas: 12, montoInicial: 2000.00, montoPagado: 1250.50, fecha: '2025-12-01' },
                { id: 2, ruc: '10455677899', telefono: '966112233', email: 'info@comercial.com', facturas: 1, cuotas: 1, montoInicial: 500.00, montoPagado: 450.00, fecha: '2026-01-15' },
                { id: 3, ruc: '20566788900', telefono: '999887766', email: 'ventas@xyz.com', facturas: 5, cuotas: 6, montoInicial: 3500.00, montoPagado: 3200.75, fecha: '2025-11-20' }
            ];
        }
        // Persist the derived clientes so next time it's available
        localStorage.setItem('clientes', JSON.stringify(clientes));
    }

    function formatCurrency(value) {
        const num = Number(value) || 0;
        return 'S/ ' + num.toFixed(2);
    }

    function getVisibleClientes() {
        // apply date range filter if set
        const start = startDateInput && startDateInput.value ? new Date(startDateInput.value) : null;
        const end = endDateInput && endDateInput.value ? new Date(endDateInput.value) : null;
        if (!start && !end) return clientes;

        return clientes.filter(c => {
            const fecha = c.fecha ? new Date(c.fecha) : null;
            if (!fecha) return false;
            if (start && fecha < start) return false;
            if (end && fecha > end) return false;
            return true;
        });
    }

    function renderTable() {
        clientesBody.innerHTML = '';
        const list = getVisibleClientes();
        if (list.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td class="px-4 py-6 text-center text-[#4c669a]" colspan="8">No hay clientes para el rango seleccionado.</td>`;
            clientesBody.appendChild(tr);
            return;
        }
        list.forEach(c => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-[#e7ebf3] dark:border-gray-800';
            tr.innerHTML = `
                <td class="px-4 py-3">${escapeHtml(c.fecha)}</td>
                <td class="px-4 py-3">${escapeHtml(c.ruc)}</td>
                <td class="px-4 py-3">${escapeHtml(c.telefono)}</td>
                <td class="px-4 py-3">${escapeHtml(c.email)}</td>
                <td class="px-4 py-3">${c.facturas}</td>
                <td class="px-4 py-3">${c.cuotas || 0}</td>
                <td class="px-4 py-3 text-right">${formatCurrency(c.montoInicial)}</td>
                <td class="px-4 py-3 text-right">${formatCurrency(c.montoPagado)}</td>
            `;
            clientesBody.appendChild(tr);
        });
    }

    function escapeHtml(text) {
        if (text === null || text === undefined) return '';
        return String(text)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
    }

    // Export to CSV (Excel can open CSV)
    function exportToCSV() {
    const headers = ['Fecha','RUC/DNI','Telefono','Email','Facturas','Cuotas','Monto Inicial (S/)','Monto Pagado (S/)'];
    const rows = getVisibleClientes().map(c => [c.fecha, c.ruc, c.telefono, c.email, c.facturas, c.cuotas || 0, Number(c.montoInicial).toFixed(2), Number(c.montoPagado).toFixed(2)]);
        let csvContent = headers.join(',') + '\n';
        rows.forEach(r => {
            // Escape commas by wrapping fields in quotes
            csvContent += r.map(field => `"${String(field).replace(/"/g,'""')}"`).join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'clientes.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    // Export visible table to PDF using html2canvas + jsPDF
    async function exportToPDF() {
        try {
            // Temporarily remove rounded corners/shadows so PDF looks clean
            const originalClass = tableContainer.className;
            tableContainer.classList.add('p-6');
            // If a date filter is applied, we create a temporary clone containing only visible rows
            const visible = getVisibleClientes();
            let targetNode = tableContainer;
            if (visible.length !== clientes.length) {
                // clone table and replace tbody with visible rows for clean export
                targetNode = tableContainer.cloneNode(true);
                const tbody = targetNode.querySelector('tbody');
                tbody.innerHTML = '';
                visible.forEach(c => {
                    const tr = document.createElement('tr');
                    tr.className = 'border-b border-[#e7ebf3] dark:border-gray-800';
                    tr.innerHTML = `
                        <td class="px-4 py-3">${escapeHtml(c.fecha)}</td>
                        <td class="px-4 py-3">${escapeHtml(c.ruc)}</td>
                        <td class="px-4 py-3">${escapeHtml(c.telefono)}</td>
                        <td class="px-4 py-3">${escapeHtml(c.email)}</td>
                        <td class="px-4 py-3">${c.facturas}</td>
                        <td class="px-4 py-3">${c.cuotas || 0}</td>
                        <td class="px-4 py-3 text-right">${formatCurrency(c.montoInicial)}</td>
                        <td class="px-4 py-3 text-right">${formatCurrency(c.montoPagado)}</td>
                    `;
                    tbody.appendChild(tr);
                });
                // temporarily append to body for rendering
                targetNode.style.position = 'absolute';
                targetNode.style.left = '-9999px';
                document.body.appendChild(targetNode);
            }

            const canvas = await html2canvas(targetNode, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('l', 'pt', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            // calculate dimensions to fit width
            const imgProps = {
                width: canvas.width,
                height: canvas.height
            };
            const ratio = Math.min(pdfWidth / imgProps.width, pdfHeight / imgProps.height);
            const imgWidth = imgProps.width * ratio;
            const imgHeight = imgProps.height * ratio;

            pdf.addImage(imgData, 'PNG', 20, 20, imgWidth - 40, imgHeight - 40);
            pdf.save('clientes.pdf');
            // cleanup
            if (targetNode !== tableContainer) targetNode.remove();
            tableContainer.className = originalClass;
        } catch (err) {
            console.error('Error generando PDF', err);
            alert('Ocurrió un error al generar el PDF.');
        }
    }

    // Attach events
    if (exportExcelBtn) exportExcelBtn.addEventListener('click', exportToCSV);
    if (exportPdfBtn) exportPdfBtn.addEventListener('click', exportToPDF);
    if (applyFilterBtn) applyFilterBtn.addEventListener('click', renderTable);
    if (clearFilterBtn) {
        clearFilterBtn.addEventListener('click', () => {
            if (startDateInput) startDateInput.value = '';
            if (endDateInput) endDateInput.value = '';
            renderTable();
        });
    }
    if (goDashboardBtn) goDashboardBtn.addEventListener('click', () => { window.location.href = 'dashboard.html'; });
    if (logoutBtn) logoutBtn.addEventListener('click', () => {
        // mark all usuarios as logged out and redirect to index
        const usuariosLocal = JSON.parse(localStorage.getItem('usuarios')) || [];
        const updated = usuariosLocal.map(u => ({ ...u, logeado: false }));
        localStorage.setItem('usuarios', JSON.stringify(updated));
        // optional: remove any current session key
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });

    renderTable();
});
