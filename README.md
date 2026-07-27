# AZAG

PWA de navigation routiere communautaire, temps reel, sans compte. Perimetre de lancement : Grand Lyon.

## Stack

- React + Vite + TypeScript (strict)
- MapLibre GL JS (rendu carte)
- TomTom (tuiles Orbis + Routing avec trafic)
- Supabase (Postgres + PostGIS + Realtime)
- Web Speech API (guidage vocal), Geolocation API
- Hebergement : GitHub Pages (statique)

## Demarrage

```bash
npm install
cp .env.example .env.local   # puis remplir les cles
npm run dev
```

Sans cle TomTom, l'app tourne avec un fond de carte de secours (OSM raster) centre sur Lyon.

## Variables d'environnement

Voir `.env.example`. Toutes les variables `VITE_*` sont injectees au build et
**visibles en clair dans le bundle** (GitHub Pages = statique). Consequences :

- **Cle TomTom** : restriction par domaine OBLIGATOIRE dans le portail TomTom
  (autoriser `*.github.io` + domaine custom eventuel).
- **Supabase** : cle `anon` uniquement, jamais `service_role`. La securite
  repose sur des RLS strictes cote Postgres.

## Deploiement

Push sur `main` declenche le workflow `.github/workflows/deploy.yml` :
build Vite puis publication sur GitHub Pages.

Configurer les GitHub Secrets du repo : `VITE_TOMTOM_KEY`, `VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`.

- **base path** : `/azag/` (repo dedie, cf. `vite.config.ts`).
- **routing SPA** : `HashRouter` (URLs en `/#/...`), donc pas de 404 au reload
  sur Pages, pas de hack `404.html` necessaire.

## Architecture

Voir `AZAG_CONTEXT (1).md` (brief complet) et `PROGRESS.md` (avancement par phase).

```
src/
  config/     env + constantes (centre Lyon, styles carte)
  features/
    map/      MapLibre : MapView, MapScreen, style
  lib/        utilitaires (device_uuid anonyme)
  ui/theme/   design tokens
```
