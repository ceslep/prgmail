<script>
	import { fade, scale } from 'svelte/transition';

	let { open, report, transactions, onclose, ondownload } = $props();

	const statusColors = {
		'Aprobada': '#27ae60',
		'Rechazada': '#e74c3c',
		'Pendiente': '#f39c12',
		'Cancelada': '#95a5a6',
		'Reversada': '#8e44ad',
		'Desconocido': '#7f8c8d'
	};

	function fmt(n) {
		return n.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}

	let totalCount = $derived(transactions?.length ?? 0);

	let totalAmount = $derived(
		(transactions ?? []).reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
	);

	let avgAmount = $derived(totalCount > 0 ? totalAmount / totalCount : 0);

	let dateRange = $derived.by(() => {
		if (!transactions || transactions.length === 0) return 'N/A';
		const dates = transactions.map((t) => t.date_iso).sort();
		return `${dates[0]} - ${dates[dates.length - 1]}`;
	});

	let statusSummary = $derived.by(() => {
		if (!transactions || transactions.length === 0) return [];
		const counts = {};
		for (const t of transactions) {
			const s = t.status || 'Desconocido';
			counts[s] = (counts[s] || 0) + 1;
		}
		return Object.entries(counts).map(([status, count]) => ({
			status,
			count,
			pct: ((count / transactions.length) * 100).toFixed(1)
		}));
	});

	function handleKeydown(e) {
		if (e.key === 'Escape') {
			onclose?.();
		}
	}

	function handleOverlayClick(e) {
		if (e.target === e.currentTarget) {
			onclose?.();
		}
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 backdrop-blur-sm p-4 md:p-8"
		transition:fade={{ duration: 200 }}
		onkeydown={handleKeydown}
		onclick={handleOverlayClick}
	>
		<div
			class="relative w-full max-w-4xl my-4"
			transition:scale={{ duration: 250, start: 0.95, opacity: 0 }}
		>
			<!-- Close button -->
			<button
				onclick={onclose}
				class="absolute -top-2 -right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-gray-300 shadow-lg transition-colors hover:bg-gray-700 hover:text-white cursor-pointer"
				aria-label="Cerrar"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
					<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
				</svg>
			</button>

			<!-- Paper document -->
			<div class="rounded-lg bg-white shadow-2xl shadow-black/50 overflow-hidden" style="font-family: system-ui, -apple-system, sans-serif;">

				<!-- Header band -->
				<div class="px-8 py-6" style="background: linear-gradient(135deg, #1a237e 0%, #283593 50%, #1565c0 100%);">
					<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
						<div>
							<h1 class="text-2xl font-bold text-white tracking-wide">Informe Financiero</h1>
							<p class="text-blue-200 text-sm mt-1 font-medium">Transacciones Aprobadas</p>
						</div>
						<div class="text-right text-sm space-y-1">
							<p class="text-blue-100">
								<span class="text-blue-300">Cuenta:</span> {report?.email_account ?? 'N/A'}
							</p>
							<p class="text-blue-100">
								<span class="text-blue-300">Remitente:</span> {report?.sender ?? 'N/A'}
							</p>
							<p class="text-blue-100">
								<span class="text-blue-300">Generado:</span> {report?.generated_at ?? 'N/A'}
							</p>
						</div>
					</div>
				</div>

				<!-- Content area -->
				<div class="px-8 py-6 space-y-6">

					<!-- Summary metric cards -->
					<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
						<div class="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
							<p class="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Transacciones</p>
							<p class="mt-1 text-2xl font-bold text-gray-800">{totalCount}</p>
						</div>
						<div class="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
							<p class="text-xs font-semibold uppercase tracking-wider text-gray-500">Monto Total</p>
							<p class="mt-1 text-2xl font-bold text-gray-800">${fmt(totalAmount)}</p>
						</div>
						<div class="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
							<p class="text-xs font-semibold uppercase tracking-wider text-gray-500">Monto Promedio</p>
							<p class="mt-1 text-2xl font-bold text-gray-800">${fmt(avgAmount)}</p>
						</div>
						<div class="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
							<p class="text-xs font-semibold uppercase tracking-wider text-gray-500">Periodo</p>
							<p class="mt-1 text-sm font-bold text-gray-800 leading-tight">{dateRange}</p>
						</div>
					</div>

					<!-- Status summary -->
					{#if statusSummary.length > 0}
						<div>
							<h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">Resumen por Estado</h2>
							<div class="flex flex-wrap gap-2">
								{#each statusSummary as item, si (item.status + '-' + si)}
									<span
										class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
										style="background-color: {statusColors[item.status] ?? statusColors['Desconocido']}"
									>
										{item.status}: {item.count} ({item.pct}%)
									</span>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Transaction detail table -->
					<div>
						<h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">Detalle de Transacciones</h2>
						<div class="overflow-x-auto rounded-lg border border-gray-200">
							<table class="w-full text-sm">
								<thead>
									<tr class="bg-gray-100 text-left">
										<th class="px-3 py-2.5 font-semibold text-gray-600 text-center w-10">#</th>
										<th class="px-3 py-2.5 font-semibold text-gray-600">Fecha</th>
										<th class="px-3 py-2.5 font-semibold text-gray-600">Empresa / Negocio</th>
										<th class="px-3 py-2.5 font-semibold text-gray-600 text-right">Monto</th>
										<th class="px-3 py-2.5 font-semibold text-gray-600">Referencia</th>
										<th class="px-3 py-2.5 font-semibold text-gray-600 text-center">Estado</th>
									</tr>
								</thead>
								<tbody>
									{#each transactions ?? [] as tx, i (tx.reference ? `${tx.reference}-${i}` : i)}
										<tr class="border-t border-gray-100 {i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50/50">
											<td class="px-3 py-2 text-center text-gray-400 font-mono text-xs">{i + 1}</td>
											<td class="px-3 py-2 text-gray-700 whitespace-nowrap">{tx.date_formatted ?? tx.date_iso}</td>
											<td class="px-3 py-2">
	<span class="text-gray-400 italic text-xs" title="Consulta el email original en Gmail para ver el detalle">Verificar en Gmail</span>
</td>
											<td class="px-3 py-2 text-gray-800 font-semibold text-right whitespace-nowrap tabular-nums">${fmt(parseFloat(tx.amount) || 0)}</td>
											<td class="px-3 py-2">
												<span class="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 font-mono text-xs font-semibold px-2 py-0.5 rounded-md" title={tx.reference ?? ''}>
													{tx.reference ?? '-'}
												</span>
											</td>
											<td class="px-3 py-2 text-center">
												<span
													class="inline-block rounded-full px-2 py-0.5 text-xs font-semibold text-white"
													style="background-color: {statusColors[tx.status] ?? statusColors['Desconocido']}"
												>
													{tx.status ?? 'Desconocido'}
												</span>
											</td>
										</tr>
									{:else}
										<tr>
											<td colspan="6" class="px-3 py-8 text-center text-gray-400">No hay transacciones para mostrar</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				</div>

				<!-- Footer -->
				<div class="border-t border-gray-200 bg-gray-50 px-8 py-3">
					<p class="text-center text-xs text-gray-400">
						Informe generado desde Gmail API &mdash; pgmail
					</p>
				</div>
			</div>

			<!-- Bottom action bar -->
			<div class="mt-4 flex items-center justify-end gap-3">
				<button
					onclick={onclose}
					class="rounded-lg border border-gray-600 bg-gray-800 px-5 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 hover:text-white cursor-pointer"
				>
					Cerrar
				</button>
				<button
					onclick={ondownload}
					class="rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:brightness-110 cursor-pointer"
					style="background: linear-gradient(135deg, #1565c0 0%, #1a237e 100%);"
				>
					<span class="flex items-center gap-2">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
						</svg>
						Descargar PDF
					</span>
				</button>
			</div>
		</div>
	</div>
{/if}
