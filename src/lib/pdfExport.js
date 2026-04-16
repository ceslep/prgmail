export async function exportToPdf(elementId, filename = 'informe-financiero.pdf') {
  const { default: html2pdf } = await import('html2pdf.js')
  const element = document.getElementById(elementId)
  if (!element) throw new Error('Element not found: ' + elementId)

  return html2pdf()
    .set({
      margin: [8, 8, 8, 8],
      filename,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#111827' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
    })
    .from(element)
    .save()
}
