# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**prgmail** — A Svelte 5 SPA that reads Gmail transaction notification emails (via Gmail REST API with OAuth2) and renders a financial report dashboard. Parses payment gateway emails (Pasarela Pagos Aval) to extract amounts, references, statuses, and dates. Deployed to GitHub Pages at `/prgmail/`.

UI language is Spanish. Currency formatting uses Colombian locale (`es-CO`).

## Commands

- `npm run dev` — Start Vite dev server
- `npm run build` — Production build to `dist/`
- `npm run preview` — Preview production build
- `npm run check` — Run svelte-check type checking

No test runner is configured.

## Tech Stack

- **Svelte 5** (runes: `$state`, `$derived`, `$props`, `$bindable`, `$effect`) — NOT SvelteKit
- **Vite 8** with `@sveltejs/vite-plugin-svelte`
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin (imported as `@import "tailwindcss"` in `app.css`)
- **html2pdf.js** for PDF export (dynamically imported)
- **Google Identity Services** loaded via script tag in `index.html`
- JavaScript with JSDoc types (no `.ts` files), `checkJs: true` in jsconfig

## Architecture

### Data Flow

1. On mount, app tries to load OAuth credentials from remote server (`loadRemoteCredentials`)
2. Falls back to manual Client ID entry (persisted in localStorage)
3. User signs in via Google OAuth2 (gmail.readonly scope)
4. `fetchFromGmail()` → `processAllMessages()` pipeline: list message IDs → fetch each full message → parse → filter approved → dedup by date → sort
5. Fallback: loads static `/transacciones.json` for offline/demo use

### Key Modules

- **`src/lib/stores.svelte.js`** — Central state module. Contains all app state (report data, auth, preferences, fetch progress) as Svelte 5 module-level `$state`. Exports getter functions (`getReportState()`, `getAuth()`, etc.) and actions (`signIn`, `signOut`, `fetchFromGmail`, `loadStaticData`). Preferences persisted to localStorage with `pgmail_` prefix.
- **`src/lib/gmail.js`** — Gmail REST API client (no SDK). Handles pagination, full message fetch, and the complete processing pipeline with progress callbacks.
- **`src/lib/parser.js`** — Transaction parsing ported from Python. Extracts amounts (COP/USD), references, statuses (Spanish/English keywords mapped to: Aprobada/Rechazada/Pendiente/Cancelada/Reversada/Desconocido), dates. Handles base64url decoding and HTML stripping.
- **`src/lib/pdfExport.js`** — Wraps html2pdf.js for landscape A4 PDF export of the report.

### Component Tree

`App.svelte` owns all filter/sort state and computed `filtered` list. Child components are presentational, receiving data via props. `AuthPanel` is the only component that directly calls store actions.

### Deployment

`vite.config.js` sets `base: "/prgmail/"` for GitHub Pages. `gh-pages` is a devDependency.

### Status Color System

`STATUS_COLORS` in stores maps transaction statuses to hex colors. `StatusCards.svelte` has corresponding Tailwind gradient tints in `BG_TINTS`.
