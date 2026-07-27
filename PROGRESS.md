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
## Phase 2 - Routing  [FAIT - a valider]

Fait et verifie en prod (browser) :
- Client API TomTom : searchPlaces (geocoding/POI, biais autour de la position) +
  calculateRoute (routeType=fastest, traffic=true).
- SearchBar : saisie destination, suggestions debouncees (320ms, min 3 car), nom + adresse.
- Trace itineraire sur la carte : couche ligne accent + casing blanc (routeLayer), cadrage auto (fitBounds).
- RouteSheet : ETA (duree), distance, heure d'arrivee, badge delai trafic, bouton annuler.
- useRouting : recalcul sur deviation reelle (>45m, 2 fixes consecutifs, cooldown 12s) pour
  proteger le quota non-tile. Depart = position utilisateur (fallback centre carte).
- Bouton de position remonte au-dessus de la feuille quand un itineraire est actif.

Test valide : "Gare Part-Dieu" -> suggestions -> trace + "27 min / 11,5 km / arrivee 11:33" -> X reinitialise.
## Phase 3 - Guidage  [FAIT - a valider]

Fait et verifie en prod (browser) :
- Instructions turn-by-turn recuperees (instructionsType=text, fr-FR) dans calculateRoute.
- routeProgressMeters : progression le long du trace -> prochaine manoeuvre + distance.
- useNavigation : step courant, annonces vocales Web Speech a 2 seuils (loin 260m / imminent 45m),
  detection d'arrivee (<25m). primeSpeech() au tap Demarrer (deblocage voix iOS).
- GuidanceBanner : bandeau haut fort contraste (icone manoeuvre + grande distance + rue) + bouton mute.
- ManeuverIcon : icones de manoeuvres (tout droit, gauche/droite, leger, serre, u-turn, rond-point, arrivee, depart).
- useWakeLock : ecran maintenu allume pendant la nav, relache a l'arret / re-acquis au retour au premier plan.
- Mode conduite : apercu (bouton Demarrer + ETA) -> navigation (bandeau + restant + Terminer).

Test valide : recherche Aeroport St-Exupery -> apercu 25 min/28,7 km -> Demarrer -> bandeau
"90 m / Avenue des Freres Perret" + suivi -> Terminer reinitialise.

A confirmer sur iPhone reel : voix (audio) + WakeLock, non verifiables par screenshot.

Ajouts Phase 3+ (verifies en prod) :
- Alternatives d'itineraire : calculateRoutes (maxAlternatives=2), cartes selectionnables
  dans l'apercu (temps/distance/trafic, triees par temps), alternatives grisees sur la carte,
  masquees en navigation.
- Camera 3e personne en navigation : pitch 58, orientation sur le cap (bearing=heading),
  zoom rue, position placee en bas d'ecran (offset), reset a plat a l'arret.
  L'orientation au cap n'est visible qu'en mouvement (cap inconnu a l'arret).

## Phase bonus - Moteur d'apprentissage d'itineraire  [FAIT - a valider]

Deroge au brief (IA hors MVP), a la demande de Haris. 100% on-device, prive.

Fait et verifie (logique en node + UI en prod) :
- Feature % autoroute par trajet (sectionType=motorway -> highwayShare).
- Contexte : heure, matin/soir/nuit, week-end, jours feries FR (calcul Meeus/Butcher).
- Modele : ranking pairwise en ligne (SGD, 8 features avec interactions autoroute x contexte),
  poids clippes, persistes en localStorage (azag.route_model.v1). Prior = le plus rapide.
- Apprend au tap Demarrer (choix confirme). Pre-selectionne l'itineraire suggere + explication.
- RouteSheet : badge "Suggere pour toi · <raison>" sur l'option apprise (si divergence du + rapide).
- Test node : apres 6 choix autoroute le matin -> bascule sur autoroute ; le soir (non appris)
  reste au + rapide (pas de generalisation abusive). UI : badge + pre-selection verifies en prod.

Limites connues : s'ameliore avec l'usage (pas magique des la 1re fois) ; "evenements" reels
(concerts/matchs) non couverts (pas de source gratuite) -> incidents TomTom possibles plus tard ;
meteo non integree (choix Haris : cote apprentissage + heure/date d'abord).
## Phase 4 - Signalements backend  [A VENIR]
## Phase 5 - Signalements front  [A VENIR]
## Phase 6 - Polish & perf  [A VENIR]
