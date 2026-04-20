<script>
  let {
    search = $bindable(''),
    dateFrom = $bindable(''),
    dateTo = $bindable(''),
    amountMin = $bindable(''),
    amountMax = $bindable(''),
    statusFilter = $bindable(''),
    statuses = [],
    filteredCount = 0,
    totalCount = 0,
    onclear,
  } = $props()
</script>

<div class="no-print backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl mb-5">
  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 items-end">
    <!-- Search -->
    <div class="col-span-2 sm:col-span-1 flex flex-col gap-1.5">
      <label for="f-search" class="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Buscar</label>
      <div class="relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
        </svg>
        <input
          id="f-search"
          type="text"
          bind:value={search}
          placeholder="Asunto, referencia..."
          class="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25 transition-all"
        />
      </div>
    </div>

    <!-- Date from -->
    <div class="flex flex-col gap-1.5">
      <label for="f-datefrom" class="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Fecha desde</label>
      <input
        id="f-datefrom"
        type="date"
        bind:value={dateFrom}
        class="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25 transition-all [color-scheme:dark]"
      />
    </div>

    <!-- Date to -->
    <div class="flex flex-col gap-1.5">
      <label for="f-dateto" class="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Fecha hasta</label>
      <input
        id="f-dateto"
        type="date"
        bind:value={dateTo}
        class="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25 transition-all [color-scheme:dark]"
      />
    </div>

    <!-- Amount min -->
    <div class="flex flex-col gap-1.5">
      <label for="f-amtmin" class="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Monto min</label>
      <input
        id="f-amtmin"
        type="number"
        bind:value={amountMin}
        placeholder="0"
        class="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25 transition-all"
      />
    </div>

    <!-- Amount max -->
    <div class="flex flex-col gap-1.5">
      <label for="f-amtmax" class="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Monto max</label>
      <input
        id="f-amtmax"
        type="number"
        bind:value={amountMax}
        placeholder="999999"
        class="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25 transition-all"
      />
    </div>

    <!-- Status -->
    <div class="flex flex-col gap-1.5">
      <label for="f-status" class="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Estado</label>
      <select
        id="f-status"
        bind:value={statusFilter}
        class="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25 transition-all appearance-none"
      >
        <option value="">Todos</option>
        {#each statuses as s (s)}
          <option value={s}>{s}</option>
        {/each}
      </select>
    </div>
  </div>

  <!-- Bottom row: clear + count -->
  <div class="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
    <button
      onclick={onclear}
      class="px-4 py-2 text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all"
    >Limpiar filtros</button>
    <span class="text-xs text-gray-500">{filteredCount} de {totalCount} transacciones</span>
  </div>
</div>
