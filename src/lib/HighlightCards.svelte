<script>
  import { fmtNum } from './stores.svelte.js'
  let { transactions = [] } = $props()

  let total = $derived(transactions.length)
  let amounts = $derived(transactions.filter(t => t.amount !== null).map(t => t.amount))
  let totalAmount = $derived(amounts.reduce((a, b) => a + b, 0))
  let avgAmount = $derived(amounts.length ? totalAmount / amounts.length : 0)

  let dates = $derived(transactions.filter(t => t.date_iso).map(t => t.date_iso).sort())
  let dateStart = $derived(dates.length ? dates[0].substring(0, 10) : '—')
  let dateEnd = $derived(dates.length ? dates[dates.length - 1].substring(0, 10) : '—')

  const cards = [
    { label: 'Total Transacciones', color: 'from-blue-500 to-blue-600', border: 'border-l-blue-500' },
    { label: 'Monto Total', color: 'from-emerald-500 to-emerald-600', border: 'border-l-emerald-500' },
    { label: 'Monto Promedio', color: 'from-amber-500 to-orange-500', border: 'border-l-amber-500' },
    { label: 'Periodo', color: 'from-violet-500 to-purple-600', border: 'border-l-violet-500' },
  ]
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
  {#each cards as card, i}
    <div
      class="backdrop-blur-xl bg-white/5 border border-white/10 border-l-4 {card.border} rounded-2xl p-5 shadow-xl hover:scale-[1.02] transition-all duration-300 animate-fade-up"
      style="animation-delay: {i * 80}ms"
    >
      <div class="text-[11px] text-gray-500 uppercase tracking-widest mb-2">{card.label}</div>
      <div class="text-2xl font-bold text-white">
        {#if i === 0}{total}
        {:else if i === 1}${fmtNum(totalAmount)}
        {:else if i === 2}${fmtNum(avgAmount)}
        {:else}<span class="text-lg">{dateStart} — {dateEnd}</span>
        {/if}
      </div>
    </div>
  {/each}
</div>
