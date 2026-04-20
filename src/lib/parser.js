// Transaction parsing — ported from generate_report.py

const RE_AMOUNT = /(?:\$\s?[\d.,]+|COP\s?[\d.,]+|[\d.,]+\s?COP|USD\s?[\d.,]+|[\d.,]+\s?USD)/i

const RE_REFERENCE = /(?:(?:referencia|ref\.?|reference|transacci[oó]n|transaction|ticket|recibo|receipt|CUS|id)[\s:#.\-]+)([A-Za-z0-9]{4,30})/i

const STATUS_MAP = [
  ['aprobad', 'Aprobada'],
  ['aprobado', 'Aprobada'],
  ['aprobada', 'Aprobada'],
  ['exitos', 'Aprobada'],
  ['successful', 'Aprobada'],
  ['approved', 'Aprobada'],
  ['rechazad', 'Rechazada'],
  ['rechazado', 'Rechazada'],
  ['rechazada', 'Rechazada'],
  ['declined', 'Rechazada'],
  ['failed', 'Rechazada'],
  ['fallid', 'Rechazada'],
  ['fallido', 'Rechazada'],
  ['fallida', 'Rechazada'],
  ['pendiente', 'Pendiente'],
  ['pending', 'Pendiente'],
  ['en proceso', 'Pendiente'],
  ['processing', 'Pendiente'],
  ['cancelad', 'Cancelada'],
  ['cancelado', 'Cancelada'],
  ['cancelada', 'Cancelada'],
  ['cancelled', 'Cancelada'],
  ['canceled', 'Cancelada'],
  ['reversad', 'Reversada'],
  ['reversado', 'Reversada'],
  ['reversada', 'Reversada'],
  ['reversed', 'Reversada'],
]

export function base64urlDecode(data) {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(base64 + padding)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new TextDecoder('utf-8').decode(bytes)
}

export function stripHtml(html) {
  let text = html
  text = text.replace(/<style[^>]*>.*?<\/style>/gis, '')
  text = text.replace(/<script[^>]*>.*?<\/script>/gis, '')
  text = text.replace(/<[^>]+>/g, ' ')
  // Decode HTML entities via DOM
  const ta = document.createElement('textarea')
  ta.innerHTML = text
  text = ta.value
  text = text.replace(/\s+/g, ' ').trim()
  return text
}

export function extractBody(payload) {
  const mime = payload.mimeType || ''
  const parts = payload.parts || []

  // Priority 1: text/plain at this level
  if (mime === 'text/plain') {
    const data = payload.body?.data
    if (data) return base64urlDecode(data)
  }

  // Priority 2: recurse into parts for text/plain
  for (const part of parts) {
    const text = extractBody(part)
    if (text) return text
  }

  // Priority 3: text/html at this level (stripped)
  if (mime === 'text/html') {
    const data = payload.body?.data
    if (data) return stripHtml(base64urlDecode(data))
  }

  // Priority 4: text/html in parts
  for (const part of parts) {
    if (part.mimeType === 'text/html') {
      const data = part.body?.data
      if (data) return stripHtml(base64urlDecode(data))
    }
  }

  return ''
}

export function parseAmount(text) {
  const match = RE_AMOUNT.exec(text)
  if (!match) return null

  let raw = match[0]
  let cleaned = raw.replace(/[A-Za-z$\s]/g, '')

  if (cleaned.includes(',') && cleaned.includes('.')) {
    // Both separators present: last one is decimal
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      // 1.234,56 → European/Colombian style
      cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    } else {
      // 1,234.56 → US style
      cleaned = cleaned.replace(/,/g, '')
    }
  } else if (cleaned.includes('.')) {
    // Only dots: check if used as thousand separator (e.g., 300.000 or 1.234.567)
    const dotParts = cleaned.split('.')
    const allGroupsOf3 = dotParts.slice(1).every(p => p.length === 3)
    if (dotParts.length > 2 || (dotParts.length === 2 && allGroupsOf3 && dotParts[1].length === 3)) {
      // Dots are thousand separators
      cleaned = cleaned.replace(/\./g, '')
    }
    // else: single dot with non-3 decimals → treat as decimal point (e.g., 300000.50)
  } else if (cleaned.includes(',')) {
    const parts = cleaned.split(',')
    if (parts.length === 2 && parts[1].length === 2) {
      cleaned = cleaned.replace(',', '.')
    } else {
      cleaned = cleaned.replace(/,/g, '')
    }
  }

  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

export function parseReference(text) {
  const match = RE_REFERENCE.exec(text)
  return match ? match[1] : ''
}

const RE_BUSINESS = /(?:empresa|comercio|establecimiento|business)[\s:]+([^\n\r]+?)(?=\s*(?:valor|monto|cantidad|moneda|detalle|ref\.?|referencia|estado|tipo|transaction|payment|$))/i

export function parseBusiness(text) {
  const match = RE_BUSINESS.exec(text)
  if (match) return match[1].trim().substring(0, 80)
  return null
}

export function detectStatus(text) {
  const lower = text.toLowerCase()
  for (const [keyword, status] of STATUS_MAP) {
    if (lower.includes(keyword)) return status
  }
  return 'Desconocido'
}

export function parseDate(dateStr) {
  if (!dateStr) return null
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return null
    return d
  } catch {
    return null
  }
}

function pad(n) { return String(n).padStart(2, '0') }

export function parseTransaction(msg) {
  const combined = `${msg.subject} ${msg.body}`
  const dt = parseDate(msg.date_str)
  const amount = parseAmount(combined)
  const reference = parseReference(combined)
  const status = detectStatus(combined)
  const business = parseBusiness(combined)

  let date_iso = null
  let date_formatted = msg.date_str || ''
  if (dt) {
    date_iso = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`
    date_formatted = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`
  }

  return {
    date_iso,
    date_formatted,
    subject: msg.subject,
    amount,
    reference: reference || null,
    status,
    business,
    snippet: (msg.snippet || '').substring(0, 300),
  }
}
