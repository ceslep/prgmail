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
- `npm run deploy` — Build and deploy to GitHub Pages via `gh-pages -d dist`

No test runner is configured.

## Tech Stack

- **Svelte 5** (runes: `$state`, `$derived`, `$props`, `$bindable`, `$effect`) — NOT SvelteKit
- **Vite 8** with `@sveltejs/vite-plugin-svelte`
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin (imported as `@import "tailwindcss"` in `app.css`)
- **jsPDF + jspdf-autotable** for PDF export (landscape A4, styled summary cards + transaction table)
- **Google Identity Services** loaded via script tag in `index.html`
- JavaScript with JSDoc types (no `.ts` files), `checkJs: true` in jsconfig

## Architecture

### Data Flow

1. On mount, app tries to load OAuth credentials from remote server (`loadRemoteCredentials` → `app.iedeoccidente.com`)
2. Falls back to manual Client ID entry (persisted in localStorage)
3. User signs in via Google OAuth2 (gmail.readonly scope)
4. `fetchFromGmail()` → `processAllMessages()` pipeline: list message IDs → fetch each full message → parse → filter approved → dedup by date_iso → sort desc
5. Fallback: loads static `/transacciones.json` for offline/demo use

### Key Modules

- **`src/lib/stores.svelte.js`** — Central state module. All app state (report data, auth, preferences, fetch progress) as Svelte 5 module-level `$state`. Exports getter functions (`getReportState()`, `getAuth()`, `getPreferences()`, `getFetchProgress()`) and actions (`signIn`, `signOut`, `fetchFromGmail`, `loadStaticData`, `savePreference`). Preferences persisted to localStorage with `pgmail_` prefix.
- **`src/lib/gmail.js`** — Gmail REST API client (no SDK). Uses raw `fetch` against `https://gmail.googleapis.com/gmail/v1/users/me`. Handles pagination (`fetchAllMessageIds`), full message fetch with header extraction, and the complete `processAllMessages()` pipeline with progress callbacks. Auto-detects expired tokens (401 → "Token expirado").
- **`src/lib/parser.js`** — Transaction parsing ported from Python. Extracts amounts (COP/USD via regex), references, statuses (Spanish/English keywords mapped to: Aprobada/Rechazada/Pendiente/Cancelada/Reversada/Desconocido), dates, and business names. Handles base64url decoding and HTML stripping. Body extraction recurses MIME parts (text/plain priority, fallback to stripped text/html).
- **`src/lib/pdfExport.js`** — Uses jsPDF + jspdf-autotable for landscape A4 PDF export. Renders header band, summary cards, status pills, and full transaction table with per-status color coding.

### Component Tree

`App.svelte` owns all filter/sort state and computed `filtered` list (via `$derived.by`). Child components are presentational, receiving data via props. `AuthPanel` is the only component that directly calls store actions. `PdfPreviewModal` is rendered at root level, controlled by `showPdfPreview` state.

### Important Patterns

- **State access**: Store state exposed via getter functions (e.g., `getReportState()`) that return reactive `$state` objects. Components call getters once and read properties reactively.
- **No routing**: Single-page app with no router. All views are conditional renders in `App.svelte`.
- **Currency helper**: `fmtNum()` in stores formats numbers with `es-CO` locale. Duplicated in `pdfExport.js` (local copy).
- **Transaction type**: `@typedef` for `Transaction` and `ReportData` defined at top of `stores.svelte.js`.

### Deployment

`vite.config.js` sets `base: "/prgmail/"` for GitHub Pages. `gh-pages` is a devDependency.

### Status Color System

`STATUS_COLORS` in stores maps transaction statuses to hex colors (used in charts/UI). `pdfExport.js` has its own `STATUS_COLORS` mapped to RGB arrays for jsPDF. `StatusCards.svelte` has corresponding Tailwind gradient tints in `BG_TINTS`.
