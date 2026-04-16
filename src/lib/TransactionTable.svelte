<script>
  import { STATUS_COLORS, fmtNum } from './stores.svelte.js'

  let { transactions = [], sortKey = 'date', sortAsc = false, onsort, onexport } = $props()

  let view = $state('table') // 'table' | 'cards'
  let page = $state(0)
  const PAGE_SIZE = 20

  let totalPages = $derived(Math.ceil(transactions.length / PAGE_SIZE))
  let paged = $derived(transactions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE))

  // Reset page when data changes
  $effect(() => {
    transactions.length // track
    page = 0
  })

  function arrow(key) {
    if (sortKey !== key) return ''
    return sortAsc ? ' \u25B2' : ' \u25BC'
  }

  const thClass = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 cursor-pointer select-none hover:text-gray-200 transition-colors whitespace-nowrap'
</script>

<div class="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-xl overflow-hidden mb-8">
  <!-- Toolbar -->
  <div class="no-print flex items-center justify-between px-5 py-3 border-b border-white/5">
    <div class="flex items-center gap-3">
      <!-- View tabs -->
      <div class="flex bg-white/5 rounded-lg p-0.5">
        <button
          onclick={() => view = 'table'}
          class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 {view === 'table' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm5-4v-2h-5v2h5zM9 10H4V8h5v2z" clip-rule="evenodd"/>
          </svg>
          Tabla
        </button>
        <button
          onclick={() => view = 'cards'}
          class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 {view === 'cards' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
          </svg>
          Tarjetas
        </button>
      </div>
      <span class="text-xs text-gray-600">{transactions.length} resultados</span>
    </div>

    {#if onexport}
      <button
        onclick={onexport}
        class="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
      >
        <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clip-rule="evenodd"/>
        </svg>
        Exportar PDF
      </button>
    {/if}
  </div>

  <!-- Empty state -->
  {#if transactions.length === 0}
    <div class="text-center py-16 text-gray-600">
      <svg class="w-12 h-12 mx-auto mb-3 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clip-rule="evenodd"/>
      </svg>
      No se encontraron transacciones
    </div>

  <!-- TABLE VIEW -->
  {:else if view === 'table'}
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-white/10 bg-white/[0.02]">
            <th class={thClass} onclick={() => onsort('index')}>#{arrow('index')}</th>
            <th class={thClass} onclick={() => onsort('date')}>Fecha{arrow('date')}</th>
            <th class={thClass} onclick={() => onsort('subject')}>Asunto{arrow('subject')}</th>
            <th class="{thClass} text-right" onclick={() => onsort('amount')}>Monto{arrow('amount')}</th>
            <th class={thClass} onclick={() => onsort('reference')}>Referencia{arrow('reference')}</th>
            <th class={thClass} onclick={() => onsort('status')}>Estado{arrow('status')}</th>
            <th class="{thClass} cursor-default hover:text-gray-500">Detalle</th>
          </tr>
        </thead>
        <tbody>
          {#each paged as t, i}
            {@const idx = page * PAGE_SIZE + i + 1}
            <tr class="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors group">
              <td class="px-4 py-3.5 text-gray-600 text-xs font-mono">{idx}</td>
              <td class="px-4 py-3.5 text-gray-300 whitespace-nowrap text-xs">{t.date_formatted}</td>
              <td class="px-4 py-3.5 text-gray-200 max-w-[220px] truncate">{t.subject}</td>
              <td class="px-4 py-3.5 text-right font-semibold font-mono text-emerald-400">
                {t.amount !== null ? '$' + fmtNum(t.amount) : '—'}
              </td>
              <td class="px-4 py-3.5 text-gray-500 font-mono text-xs">{t.reference || '—'}</td>
              <td class="px-4 py-3.5">
                <span
                  class="inline-block px-2.5 py-1 rounded-full text-[11px] font-medium text-white shadow-sm"
                  style="background: {STATUS_COLORS[t.status] || '#7f8c8d'}"
                >{t.status}</span>
              </td>
              <td class="px-4 py-3.5 max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap text-xs text-gray-700 group-hover:text-gray-400 transition-colors">
                {t.snippet}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

  <!-- CARDS VIEW -->
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
      {#each paged as t, i}
        {@const idx = page * PAGE_SIZE + i + 1}
        <div class="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-200 group">
          <!-- Card header -->
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="text-[10px] text-gray-600 font-mono">#{idx}</span>
              <span
                class="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
                style="background: {STATUS_COLORS[t.status] || '#7f8c8d'}"
              >{t.status}</span>
            </div>
            <span class="text-xs text-gray-500">{t.date_formatted}</span>
          </div>

          <!-- Amount (hero) -->
          <div class="text-2xl font-bold font-mono text-emerald-400 mb-2">
            {t.amount !== null ? '$' + fmtNum(t.amount) : '—'}
          </div>

          <!-- Subject -->
          <p class="text-sm text-gray-300 truncate mb-2">{t.subject}</p>

          <!-- Details row -->
          <div class="flex items-center justify-between pt-2 border-t border-white/5">
            <span class="text-[11px] text-gray-600 font-mono">{t.reference || 'Sin ref.'}</span>
          </div>

          <!-- Snippet (expandable on hover) -->
          <p class="mt-2 text-[11px] text-gray-700 group-hover:text-gray-500 transition-colors line-clamp-2 leading-relaxed">
            {t.snippet}
          </p>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Pagination -->
  {#if totalPages > 1}
    <div class="flex items-center justify-between px-5 py-3 border-t border-white/5">
      <button
        onclick={() => page = Math.max(0, page - 1)}
        disabled={page === 0}
        class="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
        Anterior
      </button>

      <div class="flex items-center gap-1">
        {#each Array(Math.min(totalPages, 7)) as _, idx}
          {@const p = totalPages <= 7 ? idx : (page <= 3 ? idx : (page >= totalPages - 4 ? totalPages - 7 + idx : page - 3 + idx))}
          <button
            onclick={() => page = p}
            class="w-8 h-8 text-xs rounded-lg transition-all {page === p ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/20' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}"
          >{p + 1}</button>
        {/each}
      </div>

      <button
        onclick={() => page = Math.min(totalPages - 1, page + 1)}
        disabled={page >= totalPages - 1}
        class="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Siguiente
        <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
        </svg>
      </button>
    </div>
  {/if}
</div>
