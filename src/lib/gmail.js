// Gmail REST API client — browser-side, no SDK

import { extractBody, parseTransaction } from './parser.js'

const API = 'https://gmail.googleapis.com/gmail/v1/users/me'

async function gmailFetch(token, path, params = {}) {
  const url = new URL(`${API}${path}`)
  for (const [k, v] of Object.entries(params)) {
    if (v != null) url.searchParams.set(k, v)
  }
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 401) throw new Error('Token expirado. Inicia sesión de nuevo.')
  if (res.status === 429) throw new Error('Límite de tasa excedido. Espera un momento.')
  if (!res.ok) throw new Error(`Gmail API error: ${res.status} ${res.statusText}`)
  return res.json()
}

export async function fetchProfile(token) {
  return gmailFetch(token, '/profile')
}

export async function fetchAllMessageIds(token, query) {
  const messages = []
  let pageToken = null

  while (true) {
    const result = await gmailFetch(token, '/messages', {
      q: query,
      maxResults: 500,
      pageToken,
    })
    const batch = result.messages || []
    messages.push(...batch)
    pageToken = result.nextPageToken
    if (!pageToken) break
  }

  return messages
}

export async function fetchFullMessage(token, msgId) {
  const msg = await gmailFetch(token, `/messages/${msgId}`, { format: 'full' })
  const headers = {}
  for (const h of msg.payload?.headers || []) {
    headers[h.name] = h.value
  }

  let body = extractBody(msg.payload || {})
  if (!body) body = msg.snippet || ''

  return {
    id: msgId,
    subject: headers.Subject || '(sin asunto)',
    from: headers.From || '',
    date_str: headers.Date || '',
    body,
    snippet: msg.snippet || '',
  }
}

/**
 * Full pipeline: fetch messages → parse → filter → dedup → sort
 * @param {string} token - OAuth access token
 * @param {string} query - Gmail search query
 * @param {(p: {phase: string, current: number, total: number}) => void} onProgress
 * @returns {Promise<object>} Report data matching transacciones.json schema
 */
export async function processAllMessages(token, query, onProgress = () => {}) {
  // Phase 1: Get profile
  onProgress({ phase: 'Obteniendo perfil...', current: 0, total: 0 })
  const profile = await fetchProfile(token)
  const emailAccount = profile.emailAddress

  // Phase 2: List all message IDs
  onProgress({ phase: 'Buscando emails...', current: 0, total: 0 })
  const msgRefs = await fetchAllMessageIds(token, query)
  const totalMsgs = msgRefs.length

  if (totalMsgs === 0) {
    return {
      email_account: emailAccount,
      sender: query,
      generated_at: new Date().toLocaleString('sv-SE').replace('T', ' '),
      total_fetched: 0,
      total_approved: 0,
      total_unique: 0,
      transactions: [],
    }
  }

  // Phase 3: Fetch and parse each message
  const transactions = []
  for (let i = 0; i < msgRefs.length; i++) {
    onProgress({ phase: 'Procesando emails...', current: i + 1, total: totalMsgs })
    const msg = await fetchFullMessage(token, msgRefs[i].id)
    const tx = parseTransaction(msg)
    transactions.push(tx)
  }

  // Phase 4: Filter approved
  const approved = transactions.filter(t => t.status === 'Aprobada')

  // Phase 5: Dedup by date_iso
  const seen = new Set()
  const unique = []
  for (const t of approved) {
    if (t.date_iso && seen.has(t.date_iso)) continue
    if (t.date_iso) seen.add(t.date_iso)
    unique.push(t)
  }

  // Phase 6: Sort by date desc
  unique.sort((a, b) => (b.date_iso || '').localeCompare(a.date_iso || ''))

  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  const generated = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

  return {
    email_account: emailAccount,
    sender: query,
    generated_at: generated,
    total_fetched: totalMsgs,
    total_approved: approved.length,
    total_unique: unique.length,
    transactions: unique,
  }
}
