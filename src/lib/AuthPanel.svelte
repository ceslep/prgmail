<script>
  import { getAuth, getPreferences, savePreference, initGoogleAuth, signIn, signOut, fetchFromGmail, getFetchProgress, isCredentialsLoaded } from './stores.svelte.js'

  const auth = getAuth()
  const prefs = getPreferences()
  const progress = getFetchProgress()

  let showSettings = $state(false)
  let clientIdInput = $state(prefs.clientId)
  let queryInput = $state(prefs.senderQuery)
  let remoteLoaded = $derived(isCredentialsLoaded())

  function saveClientId() {
    savePreference('clientId', clientIdInput)
    initGoogleAuth()
  }

  function saveQuery() {
    savePreference('senderQuery', queryInput)
  }

  function handleSignIn() {
    initGoogleAuth()
    signIn()
  }
</script>

<div class="mb-8">
  <!-- Auth bar -->
  <div class="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 shadow-2xl">
    <div class="flex flex-wrap items-center gap-4">
      <!-- Left: Auth status -->
      <div class="flex items-center gap-3 flex-1 min-w-0">
        {#if auth.isSignedIn}
          <div class="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse"></div>
          <span class="text-sm text-gray-300 truncate">{auth.email || 'Conectado'}</span>
        {:else}
          <div class="w-2.5 h-2.5 rounded-full bg-gray-600"></div>
          <span class="text-sm text-gray-500">No conectado</span>
        {/if}
      </div>

      <!-- Center: Action buttons -->
      <div class="flex items-center gap-3">
        {#if auth.isSignedIn}
          <button
            onclick={fetchFromGmail}
            disabled={progress.active}
            class="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/25"
          >
            {#if progress.active}
              <span class="inline-flex items-center gap-2">
                <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-25"></circle>
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="3" stroke-linecap="round" class="opacity-75"></path>
                </svg>
                Procesando...
              </span>
            {:else}
              Consultar Gmail
            {/if}
          </button>
          <button
            onclick={signOut}
            class="px-4 py-2.5 text-sm text-gray-400 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-all duration-200"
          >Cerrar sesión</button>
        {:else}
          <button
            onclick={handleSignIn}
            disabled={!prefs.clientId}
            class="px-5 py-2.5 bg-white text-gray-900 text-sm font-medium rounded-xl hover:bg-gray-100 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg flex items-center gap-2"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Iniciar sesión con Google
          </button>
        {/if}

        <button
          onclick={() => showSettings = !showSettings}
          class="p-2.5 text-gray-400 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-all duration-200"
          title="Configuración"
        >
          <svg class="w-5 h-5 transition-transform duration-300" class:rotate-90={showSettings} viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Progress bar -->
    {#if progress.active}
      <div class="mt-4 space-y-2">
        <div class="flex justify-between text-xs text-gray-400">
          <span>{progress.phase}</span>
          {#if progress.total > 0}
            <span>{progress.current} / {progress.total}</span>
          {/if}
        </div>
        <div class="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
            style="width: {progress.total > 0 ? (progress.current / progress.total * 100) : 100}%; {progress.total === 0 ? 'animation: pulse 1.5s ease-in-out infinite' : ''}"
          ></div>
        </div>
      </div>
    {/if}

    <!-- Settings panel (collapsible) -->
    {#if showSettings}
      <div class="mt-5 pt-5 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-2">
          <label for="client-id" class="text-xs font-medium text-gray-400 uppercase tracking-wider">Google Cloud Client ID</label>
          {#if remoteLoaded}
            <div class="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <div class="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span class="text-sm text-emerald-400">Credenciales cargadas desde servidor</span>
            </div>
            <p class="text-xs text-gray-600">Client ID obtenido automáticamente desde servidor remoto</p>
          {:else}
            <div class="flex gap-2">
              <input
                id="client-id"
                type="text"
                bind:value={clientIdInput}
                placeholder="xxxxx.apps.googleusercontent.com"
                class="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25 transition-all"
              />
              <button
                onclick={saveClientId}
                class="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-sm text-gray-300 rounded-xl border border-white/10 transition-all"
              >Guardar</button>
            </div>
            <p class="text-xs text-gray-600">Google Cloud Console → APIs → Credentials → OAuth 2.0 (Web application)</p>
          {/if}
        </div>
        <div class="space-y-2">
          <label for="sender-query" class="text-xs font-medium text-gray-400 uppercase tracking-wider">Query de búsqueda</label>
          <div class="flex gap-2">
            <input
              id="sender-query"
              type="text"
              bind:value={queryInput}
              placeholder="from:info@example.com"
              class="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25 transition-all"
            />
            <button
              onclick={saveQuery}
              class="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-sm text-gray-300 rounded-xl border border-white/10 transition-all"
            >Guardar</button>
          </div>
          <p class="text-xs text-gray-600">Usa sintaxis de búsqueda de Gmail (from:, subject:, after:, etc.)</p>
        </div>
      </div>
    {/if}
  </div>
</div>
