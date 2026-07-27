# AZAG - Avancement

Suivi par phases (cf. brief section 8). A la fin de chaque phase : resume + validation avant la suite.

## Phase 0 - Setup & archi  [EN COURS - a valider]

Fait :
- Scaffolding React + Vite + TypeScript strict
- PWA de base (vite-plugin-pwa, manifest, service worker autoUpdate)
- Config GitHub Pages : `base: '/azag/'`, `HashRouter` (pas de 404 au reload)
- Workflow GitHub Actions : build Vite + deploy Pages, secrets VITE_* injectes au build
- Gestion secrets : `.env.example` documente, `src/config/env.ts` type, note restriction cle TomTom par domaine
- Design tokens poses (palette claire facon Apple Maps, Inter, spacing, radius)
- MapLibre : carte centree sur Lyon ; style Orbis clair si cle TomTom, sinon fallback OSM
- `device_uuid` anonyme (localStorage) initialise au boot
- Structure de dossiers : config / features/map / lib / ui/theme

Decisions actees :
- Repo dedie `azag` -> base `/azag/`
- Routing SPA : HashRouter
- Repo GitHub cree des la Phase 0

A faire avant validation finale (cote Haris) :
- Ouvrir un compte TomTom, generer une cle, la restreindre par domaine
- Creer le projet Supabase (URL + anon key)
- Renseigner les GitHub Secrets du repo
- Activer GitHub Pages (source : GitHub Actions)

## Phase 1 - Carte & geoloc  [A VENIR]
## Phase 2 - Routing  [A VENIR]
## Phase 3 - Guidage  [A VENIR]
## Phase 4 - Signalements backend  [A VENIR]
## Phase 5 - Signalements front  [A VENIR]
## Phase 6 - Polish & perf  [A VENIR]
