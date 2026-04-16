<script>
  import { fmtNum } from './stores.svelte.js'
  let { transactions = [] } = $props()

  let monthlyData = $derived.by(() => {
    const map = {}
    for (const t of transactions) {
      if (!t.date_iso || t.amount == null) continue
      const month = t.date_iso.substring(0, 7) // "YYYY-MM"
      map[month] = (map[month] || 0) + t.amount
    }
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12) // last 12 months
  })

  let maxAmount = $derived(Math.max(...monthlyData.map(([, v]) => v), 1))

  function formatMonth(ym) {
    const [y, m] = ym.split('-')
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    return `${months[parseInt(m) - 1]} ${y.slice(2)}`
  }
</script>

{#if monthlyData.length > 0}
  <div class="mb-8">
    <h3 class="text-lg font-semibold text-gray-200 mb-4">Totales Mensuales</h3>
    <div class="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
      <div class="space-y-3">
        {#each monthlyData as [month, amount], i}
          {@const pct = (amount / maxAmount) * 100}
          <div class="flex items-center gap-3 group">
            <span class="text-xs text-gray-400 w-16 text-right font-mono shrink-0">{formatMonth(month)}</span>
            <div class="flex-1 h-7 bg-white/5 rounded-lg overflow-hidden relative">
              <div
                class="h-full bg-gradient-to-r from-blue-600/80 to-indigo-500/80 rounded-lg transition-all duration-700 ease-out flex items-center"
                style="width: {pct}%; animation-delay: {i * 50}ms"
              >
                {#if pct > 25}
                  <span class="text-[11px] text-white/80 font-medium pl-3 whitespace-nowrap">${fmtNum(amount)}</span>
                {/if}
              </div>
              {#if pct <= 25}
                <span class="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-gray-500 font-medium">${fmtNum(amount)}</span>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}
