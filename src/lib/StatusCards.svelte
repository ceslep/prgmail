<script>
  import { STATUS_COLORS } from './stores.svelte.js'
  let { transactions = [] } = $props()

  const BG_TINTS = {
    Aprobada: 'from-emerald-500/10 to-emerald-600/5',
    Rechazada: 'from-red-500/10 to-red-600/5',
    Pendiente: 'from-amber-500/10 to-amber-600/5',
    Cancelada: 'from-gray-500/10 to-gray-600/5',
    Reversada: 'from-purple-500/10 to-purple-600/5',
    Desconocido: 'from-gray-500/10 to-gray-600/5',
  }

  let counts = $derived.by(() => {
    const c = {}
    for (const t of transactions) {
      c[t.status] = (c[t.status] || 0) + 1
    }
    return Object.entries(c).sort((a, b) => b[1] - a[1])
  })

  let total = $derived(transactions.length)
</script>

<h3 class="text-lg font-semibold text-gray-200 mb-4">Resumen por Estado</h3>
<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
  {#each counts as [status, count], i}
    {@const pct = total ? (count / total * 100).toFixed(1) : '0.0'}
    <div
      class="backdrop-blur-xl bg-gradient-to-br {BG_TINTS[status] || BG_TINTS.Desconocido} border border-white/10 rounded-2xl p-5 text-center shadow-xl hover:-translate-y-1 transition-all duration-300 animate-fade-up"
      style="animation-delay: {i * 60}ms"
    >
      <div class="text-3xl font-bold" style="color: {STATUS_COLORS[status] || '#7f8c8d'}">{count}</div>
      <div class="text-sm text-gray-400 mt-1">{status}</div>
      <div class="text-xs text-gray-600 mt-0.5">{pct}%</div>
    </div>
  {/each}
</div>
