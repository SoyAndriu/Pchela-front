// Utilidad para exportar tablas a PDF con jsPDF + autoTable
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Exporta una tabla a PDF
 * @param {Object} opts
 * @param {string} opts.title - Título del PDF
 * @param {string[]} opts.columns - Encabezados de columnas
 * @param {Array<Array<string|number>>} opts.rows - Filas (cada fila es un array de celdas)
 * @param {string} [opts.fileName] - Nombre del archivo (sin extensión)
 * @param {('portrait'|'landscape')} [opts.orientation='portrait'] - Orientación del PDF
 * @param {Object} [opts.meta] - Metadatos extra (por ejemplo rango)
 */
export function exportTablePDF({ title = 'Reporte', columns = [], rows = [], fileName = 'reporte', orientation = 'portrait', meta = {} } = {}) {
  // Si hay muchas columnas, forzar landscape
  const orient = orientation || (columns.length > 6 ? 'landscape' : 'portrait');
  const doc = new jsPDF({ orientation: orient, unit: 'pt', format: 'a4' });

  const marginX = 40;
  let y = 40;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(String(title), marginX, y);
  y += 16;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const metaEntries = Object.entries(meta || {}).filter(([, v]) => v != null && v !== '');
  if (metaEntries.length) {
    const lines = metaEntries.map(([k, v]) => `${k}: ${v}`);
    lines.forEach((ln) => { doc.text(String(ln), marginX, y); y += 14; });
    y += 4;
  }

  // Tabla
  autoTable(doc, {
    head: [columns],
    body: rows.map(r => r.map(v => (v == null ? '' : String(v)))),
    startY: y,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [219, 39, 119] }, // rosa
    theme: 'striped',
    margin: { left: marginX, right: marginX },
    didDrawPage: (data) => {
      // Footer con número de página
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.getHeight ? pageSize.getHeight() : pageSize.height;
      const pageWidth = pageSize.getWidth ? pageSize.getWidth() : pageSize.width;
      doc.setFontSize(9);
      doc.setTextColor('#6b7280');
      doc.text(`Página ${doc.internal.getNumberOfPages()}`, pageWidth - marginX - 60, pageHeight - 10);
    }
  });

  const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
  doc.save(`${fileName || 'reporte'}_${ts}.pdf`);
}

export default exportTablePDF;
