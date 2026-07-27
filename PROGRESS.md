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

## Phase 1 - Carte & geoloc  [EN COURS]

Fait :
- Fond de carte minimaliste : CARTO Positron (clair, epure, gratuit, sans cle) en
  remplacement du raster OSM brut. Bascule auto sur TomTom Orbis clair si cle presente.
- Position utilisateur : marqueur pastille + halo pulsant + fleche de cap (facon
  Apple Maps / Waze). Fleche orientee au cap GPS si fiable, sinon derivee du deplacement ;
  masquee a l'arret.
- Suivi GPS throttle (watchPosition, filtre anti-jitter MIN_MOVE 2 m).
- Auto-centrage au premier fix (zoom 16), bouton de recentrage flottant, mode suivi
  coupe si l'utilisateur manipule la carte, reactive au clic.
- Verifie en browser : geoloc fonctionnelle, auto-zoom sur position reelle, fleche orientee.

- Cle TomTom configuree (GitHub Secret VITE_TOMTOM_KEY), deja restreinte au domaine github.io.
  Fond TomTom Orbis actif en prod ; style retenu pour l'instant : basic_street-light
  (colore, valide par Haris "on reste comme ca"). En local : fallback CARTO (referer localhost non autorise).
- Bug taille canvas MapLibre corrige (ResizeObserver + resize on load).

Note : style Orbis charge via chemin de version wildcard '0.*'.
## Phase 2 - Routing  [A VENIR]
## Phase 3 - Guidage  [A VENIR]
## Phase 4 - Signalements backend  [A VENIR]
## Phase 5 - Signalements front  [A VENIR]
## Phase 6 - Polish & perf  [A VENIR]
