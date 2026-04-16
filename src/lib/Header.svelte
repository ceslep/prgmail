<script>
  let { emailAccount = '', sender = '', generatedAt = '', isSignedIn = false, userEmail = '' } = $props()
</script>

<header class="relative overflow-hidden bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-900 border-b border-white/5">
  <!-- Mesh gradient blobs -->
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    <div class="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
    <div class="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-600/5 rounded-full blur-3xl"></div>
  </div>

  <div class="relative max-w-[1400px] mx-auto px-6 py-10 md:px-10 md:py-14">
    <div class="flex items-start justify-between">
      <div>
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/25">
            <svg class="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
            </svg>
          </div>
          <h1 class="text-2xl md:text-3xl font-bold text-white tracking-tight">Informe Financiero</h1>
        </div>
        <p class="text-sm text-gray-400 ml-13">Transacciones Aprobadas</p>
      </div>

      {#if isSignedIn && userEmail}
        <div class="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
          <div class="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></div>
          <span class="text-xs text-gray-400">{userEmail}</span>
        </div>
      {/if}
    </div>

    {#if emailAccount || sender || generatedAt}
      <div class="mt-5 ml-13 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        {#if emailAccount}<span>Cuenta: {emailAccount}</span>{/if}
        {#if sender}<span>Remitente: {sender}</span>{/if}
        {#if generatedAt}<span>Generado: {generatedAt}</span>{/if}
      </div>
    {/if}
  </div>
</header>
