# AGENTS.md

**Idioma de interacción**: Español para toda comunicación con el usuario.

## Commands

- `npm run check` — Run svelte-check (type checking via JSDoc, no .ts files)
- `npm run deploy` — Build + deploy to GitHub Pages (`gh-pages -d dist`)
- No test runner is configured.

## Tech Stack Quirks

- **Svelte 5 only** — Uses runes (`$state`, `$derived`, `$props`, `$bindable`, `$effect`). No SvelteKit, no legacy stores.
- **Tailwind v4** — Imported as `@import "tailwindcss"` in `app.css`, plugin is `@tailwindcss/vite` (not postcss).
- **Google Identity Services** — Loaded via `<script>` tag in `index.html`, not npm. Check `index.html` before adding any auth library.
- **JavaScript + JSDoc** — No `.ts` files. `checkJs: true` is set in `jsconfig.json`. Use `@type` and `@param` JSDoc annotations.
- **`verbatimModuleSyntax: true`** in jsconfig — Use `import type` for types.

## Architecture Notes

- **`src/lib/stores.svelte.js`** is the single source of truth for all app state. It uses module-level `$state` (not component-local). Child components receive data via props, not imports.
- **`AuthPanel`** is the only component that directly calls store actions (`signIn`, `signOut`, `fetchFromGmail`).
- `App.svelte` owns filter/sort state and the `filtered` derived list.
- **Preferences** are persisted to localStorage with `pgmail_` prefix (e.g., `pgmail_clientId`).

## External Integrations

- **Remote credentials**: `https://app.iedeoccidente.com/credenciales/credentials.php` — supports `web`, `installed`, or raw credential formats. Falls back to manual localStorage entry.
- **Gmail API**: Uses REST API directly (no SDK). Scope: `https://www.googleapis.com/auth/gmail.readonly`.
- **Offline/demo**: Loads static `/transacciones.json` when Gmail fetch fails.

## Deployment

- `vite.config.js` sets `base: "/prgmail/"` — this is required for GitHub Pages routing to work.

## Status Colors

`STATUS_COLORS` in `stores.svelte.js` maps: Aprobada/Rechazada/Pendiente/Cancelada/Reversada/Desconocido. `StatusCards.svelte` has matching `BG_TINTS` Tailwind gradients.

## UI

- Language: Spanish
- Currency format: `es-CO` locale
