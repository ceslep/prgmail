/** @typedef {{ date_iso: string|null, date_formatted: string, subject: string, amount: number|null, reference: string|null, status: string, snippet: string }} Transaction */
/** @typedef {{ email_account: string, sender: string, generated_at: string, total_fetched: number, total_approved: number, total_unique: number, transactions: Transaction[] }} ReportData */

import { processAllMessages } from './gmail.js'

export const STATUS_COLORS = {
  Aprobada: '#27ae60',
  Rechazada: '#e74c3c',
  Pendiente: '#f39c12',
  Cancelada: '#95a5a6',
  Reversada: '#8e44ad',
  Desconocido: '#7f8c8d',
}

// ---------- Report data state ----------
let reportState = $state({ data: null, loading: false, error: null })
export function getReportState() { return reportState }

// ---------- Auth state ----------
let authState = $state({
  accessToken: null,
  email: null,
  isSignedIn: false,
})
export function getAuth() { return authState }

// ---------- Remote credentials ----------
const CREDENTIALS_URL = 'https://app.iedeoccidente.com/credenciales/credentials.php'
let credentialsLoaded = $state(false)
export function isCredentialsLoaded() { return credentialsLoaded }

export async function loadRemoteCredentials() {
  try {
    const res = await fetch(CREDENTIALS_URL)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const creds = await res.json()
    // Support both "web" and "installed" credential formats
    const config = creds.web || creds.installed || creds
    if (config.client_id) {
      preferences.clientId = config.client_id
      credentialsLoaded = true
      return true
    }
    throw new Error('client_id not found in credentials')
  } catch (e) {
    console.warn('Remote credentials failed, using manual config:', e.message)
    return false
  }
}

// ---------- Preferences (persisted) ----------
let preferences = $state({
  clientId: localStorage.getItem('pgmail_clientId') || '',
  senderQuery: localStorage.getItem('pgmail_senderQuery') || 'from:info@pasarelapagosaval.com',
})
export function getPreferences() { return preferences }

export function savePreference(key, value) {
  preferences[key] = value
  localStorage.setItem(`pgmail_${key}`, value)
}

// ---------- Fetch progress ----------
let fetchProgress = $state({ active: false, phase: '', current: 0, total: 0 })
export function getFetchProgress() { return fetchProgress }

// ---------- Google Auth ----------
let tokenClient = null

export function initGoogleAuth() {
  if (!window.google?.accounts?.oauth2) return false
  if (!preferences.clientId) return false

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: preferences.clientId,
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
    callback: (response) => {
      if (response.error) {
        reportState.error = `Auth error: ${response.error}`
        return
      }
      authState.accessToken = response.access_token
      authState.isSignedIn = true
      // Fetch profile to get email
      fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: { Authorization: `Bearer ${response.access_token}` },
      })
        .then(r => r.json())
        .then(p => { authState.email = p.emailAddress })
        .catch(() => {})
    },
  })
  return true
}

export function signIn() {
  if (!tokenClient) {
    if (!initGoogleAuth()) {
      reportState.error = 'Configura Client ID primero'
      return
    }
  }
  tokenClient.requestAccessToken()
}

export function signOut() {
  if (authState.accessToken) {
    window.google?.accounts?.oauth2?.revoke?.(authState.accessToken)
  }
  authState.accessToken = null
  authState.email = null
  authState.isSignedIn = false
  reportState.data = null
}

// ---------- Data loading ----------
export async function loadStaticData() {
  reportState.loading = true
  reportState.error = null
  try {
    const res = await fetch('/transacciones.json')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    reportState.data = await res.json()
  } catch (e) {
    reportState.error = e.message
  } finally {
    reportState.loading = false
  }
}

export async function fetchFromGmail() {
  if (!authState.accessToken) {
    reportState.error = 'No autenticado'
    return
  }

  fetchProgress.active = true
  fetchProgress.phase = 'Iniciando...'
  fetchProgress.current = 0
  fetchProgress.total = 0
  reportState.error = null

  try {
    const data = await processAllMessages(
      authState.accessToken,
      preferences.senderQuery,
      (p) => {
        fetchProgress.phase = p.phase
        fetchProgress.current = p.current
        fetchProgress.total = p.total
      },
    )
    reportState.data = data
  } catch (e) {
    reportState.error = e.message
    if (e.message.includes('Token expirado')) {
      authState.isSignedIn = false
      authState.accessToken = null
    }
  } finally {
    fetchProgress.active = false
    reportState.loading = false
  }
}

// ---------- Utilities ----------
export function fmtNum(n) {
  return n.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
