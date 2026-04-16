import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const COLORS = {
  primary: [26, 35, 126],
  primaryLight: [57, 73, 171],
  success: [39, 174, 96],
  danger: [231, 76, 60],
  warning: [243, 156, 18],
  muted: [149, 165, 166],
  purple: [142, 68, 173],
  dark: [17, 24, 39],
  white: [255, 255, 255],
  gray: [156, 163, 175],
  grayLight: [229, 231, 235],
  grayDark: [75, 85, 99],
}

const STATUS_COLORS = {
  Aprobada: COLORS.success,
  Rechazada: COLORS.danger,
  Pendiente: COLORS.warning,
  Cancelada: COLORS.muted,
  Reversada: COLORS.purple,
  Desconocido: COLORS.grayDark,
}

function fmtNum(n) {
  return n.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/**
 * @param {object} opts
 * @param {object} opts.report - Report data (email_account, sender, generated_at, etc.)
 * @param {Array} opts.transactions - Filtered transactions to include
 * @param {string} [opts.filename]
 */
export async function exportToPdf({ report, transactions, filename = 'informe-financiero.pdf' }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 12
  let y = 0

  // ── Header band ──
  doc.setFillColor(...COLORS.primary)
  doc.rect(0, 0, pageW, 28, 'F')
  doc.setFillColor(...COLORS.primaryLight)
  doc.rect(0, 28, pageW, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...COLORS.white)
  doc.text('Informe Financiero', margin, 13)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Transacciones Aprobadas', margin, 20)

  // Right side info
  doc.setFontSize(8)
  const rightX = pageW - margin
  if (report.email_account) doc.text(`Cuenta: ${report.email_account}`, rightX, 10, { align: 'right' })
  if (report.sender) doc.text(`Remitente: ${report.sender}`, rightX, 15, { align: 'right' })
  if (report.generated_at) doc.text(`Generado: ${report.generated_at}`, rightX, 20, { align: 'right' })

  y = 36

  // ── Summary cards ──
  const amounts = transactions.filter(t => t.amount !== null).map(t => t.amount)
  const totalAmount = amounts.reduce((a, b) => a + b, 0)
  const avgAmount = amounts.length ? totalAmount / amounts.length : 0
  const dates = transactions.filter(t => t.date_iso).map(t => t.date_iso).sort()
  const dateStart = dates.length ? dates[0].substring(0, 10) : '—'
  const dateEnd = dates.length ? dates[dates.length - 1].substring(0, 10) : '—'

  const cards = [
    { label: 'Total Transacciones', value: String(transactions.length), color: [59, 130, 246] },
    { label: 'Monto Total', value: `$${fmtNum(totalAmount)}`, color: [16, 185, 129] },
    { label: 'Monto Promedio', value: `$${fmtNum(avgAmount)}`, color: [245, 158, 11] },
    { label: 'Periodo', value: `${dateStart}  —  ${dateEnd}`, color: [139, 92, 246] },
  ]

  const cardW = (pageW - margin * 2 - 9) / 4
  const cardH = 18

  cards.forEach((card, i) => {
    const cx = margin + i * (cardW + 3)

    // Card background
    doc.setFillColor(245, 247, 250)
    doc.roundedRect(cx, y, cardW, cardH, 2, 2, 'F')

    // Left color accent
    doc.setFillColor(...card.color)
    doc.rect(cx, y + 2, 1.2, cardH - 4, 'F')

    // Label
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.grayDark)
    doc.text(card.label.toUpperCase(), cx + 5, y + 6)

    // Value
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(card.value.length > 20 ? 9 : 11)
    doc.setTextColor(30, 30, 30)
    doc.text(card.value, cx + 5, y + 13)
  })

  y += cardH + 6

  // ── Status summary ──
  const statusCounts = {}
  for (const t of transactions) {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1
  }
  const statusEntries = Object.entries(statusCounts).sort((a, b) => b[1] - a[1])

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(30, 30, 30)
  doc.text('Resumen por Estado', margin, y + 4)
  y += 8

  const pillH = 8
  let px = margin
  for (const [status, count] of statusEntries) {
    const pct = transactions.length ? ((count / transactions.length) * 100).toFixed(1) : '0.0'
    const label = `${status}: ${count} (${pct}%)`
    const tw = doc.getTextWidth(label) + 8

    const sc = STATUS_COLORS[status] || COLORS.grayDark
    doc.setFillColor(sc[0], sc[1], sc[2])
    doc.roundedRect(px, y, tw, pillH, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...COLORS.white)
    doc.text(label, px + 4, y + 5.5)

    px += tw + 3
    if (px > pageW - margin - 30) {
      px = margin
      y += pillH + 2
    }
  }

  y += pillH + 8

  // ── Transaction table ──
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(30, 30, 30)
  doc.text('Detalle de Transacciones', margin, y)
  y += 4

  const tableData = transactions.map((t, i) => [
    String(i + 1),
    t.date_formatted || '—',
    t.business || 'Verificar en Gmail',
    t.amount !== null ? `$${fmtNum(t.amount)}` : '—',
    t.reference ? `#${t.reference}` : '—',
    t.status,
    (t.snippet || '').substring(0, 60),
  ])

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['#', 'Fecha', 'Empresa / Negocio', 'Monto', 'Referencia', 'Estado', 'Detalle']],
    body: tableData,
    theme: 'striped',
    styles: {
      fontSize: 6.5,
      cellPadding: { top: 2.5, right: 2, bottom: 2.5, left: 2 },
      lineColor: [210, 215, 225],
      lineWidth: 0.15,
      textColor: [55, 65, 81],
      overflow: 'ellipsize',
    },
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 7,
      cellPadding: { top: 3, right: 2, bottom: 3, left: 2 },
    },
    alternateRowStyles: {
      fillColor: [245, 247, 252],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center', textColor: COLORS.gray, fontSize: 6 },
      1: { cellWidth: 28, fontSize: 6.5 },
      2: { cellWidth: 50, fontSize: 6.5, fontStyle: 'bold', textColor: [40, 40, 40] },
      3: { cellWidth: 26, halign: 'right', fontStyle: 'bold', textColor: [16, 120, 80] },
      4: { cellWidth: 30, fontSize: 7, textColor: [37, 99, 235], font: 'helvetica', fontStyle: 'bold' },
      5: { cellWidth: 18, halign: 'center', fontSize: 6 },
      6: { cellWidth: 'auto', fontSize: 5.5, textColor: [130, 140, 155] },
    },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 5) {
        const sc = STATUS_COLORS[data.cell.raw] || COLORS.grayDark
        data.cell.styles.textColor = sc
        data.cell.styles.fontStyle = 'bold'
      }
      if (data.section === 'body' && data.column.index === 2) {
        if (data.cell.raw === 'Verificar en Gmail') {
          data.cell.styles.textColor = COLORS.gray
          data.cell.styles.fontStyle = 'italic'
        } else {
          data.cell.styles.textColor = [40, 40, 40]
          data.cell.styles.fontStyle = 'bold'
        }
      }
      // Subtle top border on rows for cleaner look
      if (data.section === 'body') {
        data.cell.styles.lineWidth = { top: 0.1, right: 0, bottom: 0, left: 0 }
        data.cell.styles.lineColor = [230, 233, 240]
      }
    },
    didDrawPage() {
      const pageNum = doc.internal.getNumberOfPages()
      // Thin line above footer
      doc.setDrawColor(210, 215, 225)
      doc.setLineWidth(0.3)
      doc.line(margin, pageH - 10, pageW - margin, pageH - 10)
      // Footer text
      doc.setFontSize(6.5)
      doc.setTextColor(...COLORS.gray)
      doc.text('Informe generado desde Gmail API — pgmail', margin, pageH - 6)
      doc.text(`Página ${pageNum}`, pageW - margin, pageH - 6, { align: 'right' })
    },
  })

  doc.save(filename)
}
