<script>
  import { onMount } from 'svelte'
  import { getReportState, getAuth, initGoogleAuth, loadRemoteCredentials, loadStaticData } from './lib/stores.svelte.js'
  import { exportToPdf } from './lib/pdfExport.js'
  import Header from './lib/Header.svelte'
  import AuthPanel from './lib/AuthPanel.svelte'
  import HighlightCards from './lib/HighlightCards.svelte'
  import StatusCards from './lib/StatusCards.svelte'
  import MonthlyChart from './lib/MonthlyChart.svelte'
  import Filters from './lib/Filters.svelte'
  import TransactionTable from './lib/TransactionTable.svelte'
  import PdfPreviewModal from './lib/PdfPreviewModal.svelte'

  const report = getReportState()
  const auth = getAuth()

  let search = $state('')
  let dateFrom = $state('')
  let dateTo = $state('')
  let amountMin = $state('')
  let amountMax = $state('')
  let statusFilter = $state('')
  let sortKey = $state('date')
  let sortAsc = $state(false)
  let exporting = $state(false)
  let showPdfPreview = $state(false)

  onMount(async () => {
    await loadRemoteCredentials()
    initGoogleAuth()
    if (!report.data) {
      await loadStaticData()
    }
  })

  let transactions = $derived(report.data?.transactions ?? [])
  let statuses = $derived([...new Set(transactions.map(t => t.status))].sort())

  let filtered = $derived.by(() => {
    const s = search.toLowerCase()
    const minAmt = parseFloat(amountMin) || 0
    const maxAmt = parseFloat(amountMax) || Infinity

    let result = transactions.filter(t => {
      const dateStr = (t.date_iso || '').substring(0, 10)
      const amount = t.amount || 0
      const text = `${t.subject} ${t.reference || ''} ${t.snippet}`.toLowerCase()

      if (s && !text.includes(s)) return false
      if (dateFrom && dateStr < dateFrom) return false
      if (dateTo && dateStr > dateTo) return false
      if (amount < minAmt) return false
      if (amount > maxAmt) return false
      if (statusFilter && t.status !== statusFilter) return false
      return true
    })

    result.sort((a, b) => {
      let va, vb
      if (sortKey === 'date') { va = a.date_iso || ''; vb = b.date_iso || '' }
      else if (sortKey === 'amount') { va = a.amount || 0; vb = b.amount || 0 }
      else if (sortKey === 'subject') { va = a.subject.toLowerCase(); vb = b.subject.toLowerCase() }
      else if (sortKey === 'reference') { va = (a.reference || '').toLowerCase(); vb = (b.reference || '').toLowerCase() }
      else if (sortKey === 'status') { va = a.status; vb = b.status }
      else { va = 0; vb = 0 }

      if (va < vb) return sortAsc ? -1 : 1
      if (va > vb) return sortAsc ? 1 : -1
      return 0
    })

    return result
  })

  function handleSort(key) {
    if (sortKey === key) {
      sortAsc = !sortAsc
    } else {
      sortKey = key
      sortAsc = true
    }
  }

  function clearFilters() {
    search = ''
    dateFrom = ''
    dateTo = ''
    amountMin = ''
    amountMax = ''
    statusFilter = ''
  }

  function handleExport() {
    showPdfPreview = true
  }

  async function handleDownloadPdf() {
    exporting = true
    try {
      await exportToPdf({ report: report.data, transactions: filtered })
    } catch (e) {
      console.error('PDF export error:', e)
    } finally {
      exporting = false
      showPdfPreview = false
    }
  }
</script>

{#if report.loading && !report.data}
  <!-- Loading skeleton -->
  <div class="min-h-screen flex flex-col items-center justify-center gap-4">
    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 animate-pulse"></div>
    <p class="text-sm text-gray-500">Cargando datos...</p>
  </div>
{:else if report.error && !report.data}
  <!-- Error state -->
  <div class="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
    <div class="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
      <svg class="w-6 h-6 text-red-400" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
      </svg>
    </div>
    <p class="text-sm text-red-400">{report.error}</p>
    <p class="text-xs text-gray-600">Inicia sesión con Google para consultar emails directamente</p>
  </div>
{:else}
  <div id="report-content">
    <Header
      emailAccount={report.data?.email_account || ''}
      sender={report.data?.sender || ''}
      generatedAt={report.data?.generated_at || ''}
      isSignedIn={auth.isSignedIn}
      userEmail={auth.email || ''}
    />

    <main class="max-w-[1400px] mx-auto px-4 py-8 md:px-10">
      <!-- Auth Panel (no-print) -->
      <div class="no-print">
        <AuthPanel />
      </div>

      {#if report.error}
        <div class="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {report.error}
        </div>
      {/if}

      {#if report.data}
        <HighlightCards {transactions} />
        <StatusCards {transactions} />
        <MonthlyChart {transactions} />

        <h3 class="text-lg font-semibold text-gray-200 mb-4">Detalle de Transacciones</h3>
        <Filters
          bind:search
          bind:dateFrom
          bind:dateTo
          bind:amountMin
          bind:amountMax
          bind:statusFilter
          {statuses}
          filteredCount={filtered.length}
          totalCount={transactions.length}
          onclear={clearFilters}
        />
        <TransactionTable
          transactions={filtered}
          {sortKey}
          {sortAsc}
          onsort={handleSort}
          onexport={handleExport}
        />
      {:else}
        <!-- Empty state: no data yet -->
        <div class="flex flex-col items-center justify-center py-24 gap-4">
          <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <svg class="w-8 h-8 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
            </svg>
          </div>
          <p class="text-gray-500 text-sm">Configura tu Client ID e inicia sesión para consultar emails</p>
        </div>
      {/if}
    </main>
  </div>

  <footer class="text-center py-8 text-gray-700 text-xs border-t border-white/5">
    Informe generado desde Gmail API &nbsp;|&nbsp; pgmail
  </footer>
{/if}

<PdfPreviewModal
  open={showPdfPreview}
  report={report.data}
  transactions={filtered}
  onclose={() => showPdfPreview = false}
  ondownload={handleDownloadPdf}
/>
