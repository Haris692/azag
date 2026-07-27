# AZAG — Brief de contexte projet

> Document à coller dans Claude Code au démarrage du projet. Il définit la vision, la stack, l'architecture, les règles de qualité et le découpage en phases. **Claude Code : lis tout ce document avant d'écrire la moindre ligne. Ne code rien tant que la Phase 0 (setup + validation d'archi) n'est pas actée.**

---

## 1. Vision produit

**AZAG** est une webapp (PWA mobile-first) de navigation routière communautaire, dans l'esprit de Waze, mais **sans création de compte**. L'utilisateur ouvre l'app, obtient un itinéraire optimal en temps réel, et peut signaler / confirmer des événements de circulation (police, accident, danger, bouchon, véhicule arrêté, objet sur la route) en un geste.

**Périmètre de lancement : le Grand Lyon** (Métropole de Lyon). L'architecture ne doit pas empêcher une extension nationale ultérieure, mais tout le MVP est calibré et testé sur cette zone.

**Principes directeurs :**
- **Zéro friction** : pas de compte, pas de login, pas de mot de passe. On ouvre, on roule.
- **Anonyme mais fiable** : un identifiant technique anonyme par appareil (`device_uuid` en localStorage) sert uniquement au rate-limiting et à la réputation. Aucune donnée personnelle.
- **La confiance émerge de la corrélation** : un signalement devient « confirmé » quand plusieurs appareils indépendants le corroborent au même endroit et au même moment.
- **Fluidité avant tout** : l'app doit rester fluide sur un smartphone Android d'entrée de gamme. La performance est une exigence, pas une option.
- **Design haut de gamme, sobre, intemporel** : direction claire minimale, façon Apple Maps.

---

## 2. Stack technique

| Brique | Choix | Rôle |
|---|---|---|
| Front | **React + Vite + TypeScript** | PWA mobile-first |
| Carte (rendu) | **MapLibre GL JS** | moteur de rendu carte vectorielle |
| Tuiles carte | **TomTom** (tuiles Orbis Maps) | fond de carte clair minimal |
| Routing + trafic | **TomTom Routing API** (option trafic activée) | itinéraire le plus rapide en temps réel |
| Backend / données | **Supabase** (Postgres + **PostGIS** + **Realtime**) | signalements communautaires |
| Hébergement front | **GitHub Pages** (impératif — voir §2.1) | déploiement PWA statique |
| Voix | **Web Speech API** | guidage vocal turn-by-turn |
| Géoloc | **Geolocation API** (`watchPosition`) | suivi position |

**Notes importantes sur TomTom :**
- Free tier (à revérifier à l'ouverture du compte, la tarification est révisée à partir de juillet 2026) : ~50 000 requêtes *tile* + ~2 500 requêtes *non-tile* par jour, usage commercial autorisé, sans carte bancaire.
- **Le routing consomme le quota *non-tile* (~2 500/j)**, pas le quota tuiles. → Optimiser : ne recalculer un itinéraire que si la position dévie réellement du tracé (seuil de déviation), mettre en cache, débouncer.
- La clé API TomTom **ne doit jamais être commitée en clair** dans le repo. Utiliser une variable d'environnement Vite (`VITE_TOMTOM_KEY`) et documenter le `.env.example`. Restreindre la clé par domaine dans le portail TomTom.

### 2.1 Contraintes d'hébergement GitHub Pages (à gérer dès la Phase 0)

L'app est hébergée sur **GitHub Pages** (statique pur). Cela impose :

1. **`base` path Vite** : si le repo n'est pas servi à la racine (`user.github.io/azag/`), configurer `base: '/azag/'` dans `vite.config.ts`. Sinon, page blanche au déploiement (tous les assets pointent au mauvais endroit). Vérifier aussi que le service worker et le manifest PWA utilisent le bon scope/base.
2. **Routing SPA & deep links** : GitHub Pages renvoie un 404 sur le rechargement d'une URL profonde. Utiliser `HashRouter`, ou le hack `404.html` qui redirige vers `index.html`. Choisir et documenter la solution.
3. **Pas de secret runtime** : Pages ne sert que du statique, donc **toutes les clés sont injectées au build** par Vite (`VITE_...`) et finissent dans le bundle JS public. Conséquences :
   - Clé Supabase `anon` : acceptable **uniquement** parce que les RLS sont strictes (§4). Jamais de `service_role`.
   - Clé TomTom : **restriction par domaine dans le portail TomTom OBLIGATOIRE** (pas optionnelle), puisque la clé est visible dans le bundle. Restreindre au domaine `*.github.io` (et au domaine custom si utilisé).
4. **Déploiement** : mettre en place un workflow **GitHub Actions** qui build le projet Vite et publie `dist/` sur la branche `gh-pages` (ou via l'action officielle Pages). Documenter la commande de déploiement.
5. **Pas de headers custom** : impossible de définir des HTTP headers (CSP, COOP/COEP…) sur Pages. Si un besoin de header apparaît (ex : cross-origin isolation pour un worker particulier), le noter comme limite connue.

**Notes Supabase :**
- Utiliser le MCP Supabase si disponible pour piloter le schéma.
- La clé publique `anon` est OK côté client **à condition** que les Row Level Security (RLS) policies soient strictes (voir §4).
- **Aucune clé `service_role` côté client, jamais.**

---

## 3. Architecture fonctionnelle

```
┌─────────────────────────────────────────────┐
│                 PWA (client)                 │
│  React + Vite + TS                           │
│  ┌────────────┐  ┌──────────────────────┐   │
│  │ MapLibre   │  │ Moteur de navigation │   │
│  │ (rendu)    │  │ (guidage, recalcul)  │   │
│  └─────┬──────┘  └──────────┬───────────┘   │
│        │ tuiles             │ routes         │
│        ▼                    ▼                │
│   TomTom Tiles        TomTom Routing (trafic)│
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │ Couche signalements communautaires   │   │
│  │  - lecture Realtime (rayon autour)   │   │
│  │  - écriture signalement / vote       │   │
│  └───────────────┬──────────────────────┘   │
└──────────────────┼──────────────────────────┘
                   ▼
          Supabase (Postgres + PostGIS + Realtime)
          - table reports
          - fonctions RPC de corrélation
          - purge TTL (cron pg_cron)
```

**Fusion des deux sources de trafic :**
- Les bouchons « officiels » proviennent de TomTom (routing tient déjà compte du trafic).
- Les signalements communautaires (police, accident, danger…) s'affichent **par-dessus** la carte.
- Évolution V2 : re-pénaliser un itinéraire TomTom avec les signalements maison (dynamic re-routing communautaire).

---

## 4. Schéma de données (Supabase / PostGIS)

**Table `reports`** (pas de table `users`) :

| colonne | type | note |
|---|---|---|
| `id` | uuid pk | défaut `gen_random_uuid()` |
| `type` | text | enum applicatif : `police`, `accident`, `hazard`, `traffic`, `stopped_vehicle`, `object_on_road` |
| `geom` | geography(Point,4326) | position PostGIS (index GIST) |
| `created_at` | timestamptz | défaut `now()` |
| `expires_at` | timestamptz | TTL selon type (voir plus bas) |
| `device_uuid` | uuid | appareil émetteur (anonyme) |
| `confirms` | int | compteur, défaut 0 |
| `denies` | int | compteur, défaut 0 |
| `status` | text | `pending` / `confirmed` / `expired` (calculé) |

**Table `report_votes`** (pour éviter qu'un même device vote deux fois) :

| colonne | type |
|---|---|
| `report_id` | uuid fk |
| `device_uuid` | uuid |
| `vote` | text (`confirm` / `deny`) |
| `created_at` | timestamptz |
| PK composite | (`report_id`, `device_uuid`) |

**TTL par type (durée de vie de base, prolongeable par confirmations) :**
- `police` : 30 min
- `accident` : 60 min
- `hazard` / `object_on_road` : 30 min
- `stopped_vehicle` : 20 min
- `traffic` (bouchon) : 15 min

**Row Level Security (RLS) — strict :**
- `INSERT` autorisé pour le rôle `anon` **uniquement via une fonction RPC** `create_report()` qui applique le rate-limiting (voir §5) et fixe `expires_at` côté serveur.
- `SELECT` autorisé (lecture des signalements actifs dans un rayon) via RPC `reports_nearby(lat, lon, radius_m)`.
- Votes via RPC `vote_report(report_id, vote)` qui applique la logique de corrélation.
- **Écriture directe en table interdite** : tout passe par des fonctions `security definer` contrôlées.
- Cron `pg_cron` : passage en `expired` + purge des lignes anciennes.

---

## 5. Algorithme de corrélation & anti-abus (cœur du produit)

**Objectif : un signalement n'est affiché « plein / confirmé » que s'il est plausible.** La plausibilité vient de la corroboration par appareils indépendants.

**Règles (déterministes, pas d'IA au MVP) :**

1. **Création** (`create_report`) :
   - Rate-limit : un `device_uuid` ne peut pas créer plus d'1 signalement / 30 s, ni plus de N/heure.
   - Anti-doublon : si un signalement du **même type** existe déjà à **< 100 m** et **< 10 min**, on ne crée PAS un doublon → on l'enregistre comme **confirmation** du signalement existant (+1 `confirm`, +1 device distinct).
   - Le signalement naît en statut `pending`.

2. **Passage en `confirmed`** :
   - Un signalement passe `confirmed` dès que **≥ 2 `device_uuid` distincts** l'ont créé/confirmé dans un rayon de **100 m** et une fenêtre de **10 min**.
   - Affichage : `pending` = icône semi-transparente / plus petite ; `confirmed` = icône pleine, plus visible.

3. **Confirm / Deny** (`vote_report`) :
   - Les conducteurs qui passent près d'un signalement peuvent voter « toujours là » (`confirm`) ou « plus là » (`deny`).
   - Un même `device_uuid` = un seul vote par signalement (table `report_votes`).
   - Chaque `confirm` **prolonge** `expires_at` (ex : +10 min, plafonné).
   - Chaque `deny` **réduit** `expires_at`. Au-delà d'un ratio de denies (ex : `denies >= confirms + 2`), le signalement est supprimé/expiré immédiatement.

4. **Réputation de device (anti-troll élégant, sans compte) :**
   - Table/logique de score par `device_uuid` : +1 quand un de ses signalements est confirmé par d'autres, −1 quand contredit (deny majoritaire).
   - Un device à réputation négative voit ses signalements pesés plus faiblement (ex : ne compte que pour 0.5 dans le seuil de corrélation) ou soumis à un rate-limit plus strict.
   - **Ne jamais bannir « en dur » sur IP** — l'IP n'est pas fiable (CGNAT mobile : plusieurs users = même IP ; un user en mouvement change d'IP). Le `device_uuid` est le bon signal.

5. **IA — hors scope MVP.** Documenter comme évolution V2 : détection de patterns de spam, prédiction de bouchons à partir de l'historique, déduplication sémantique. Ne rien implémenter maintenant.

---

## 6. Exigences de performance mobile (NON NÉGOCIABLES)

L'app doit rester fluide sur un Android d'entrée de gamme. Claude Code doit respecter et documenter ces règles :

1. **Ne jamais bloquer le thread principal.** Calculs lourds (corrélation locale, parsing) hors du rendu ; utiliser `requestAnimationFrame`, débounce, workers si besoin.
2. **Throttling GPS** : ne pas réagir à chaque événement `watchPosition`. Filtrer par distance minimale parcourue et/ou intervalle. Pas de recalcul d'itinéraire tant que la déviation < seuil (ex : 40 m).
3. **Rendu carte maîtrisé** : limiter le nombre de marqueurs affichés (clustering ou filtrage aux signalements dans le viewport + petit buffer). Retirer du DOM/de la carte ce qui sort de l'écran.
4. **Realtime borné** : ne s'abonner qu'aux signalements dans un rayon autour de la position, pas à toute la France. Se désabonner/réabonner quand on se déplace beaucoup.
5. **Batterie & écran** : `WakeLock API` pour garder l'écran allumé en navigation, mais le relâcher dès qu'on quitte le mode nav. Réduire la fréquence des animations quand l'app passe en arrière-plan.
6. **Budget de démarrage** : first load rapide (code splitting, lazy-load des écrans secondaires). PWA installable, service worker pour le cache des assets et des tuiles récentes.
7. **Cible mesurable** : viser un rendu carte stable à ~60 fps sur mobile milieu de gamme, et un TTI raisonnable. Documenter les mesures.

---

## 7. Design system — clair minimal (façon Apple Maps)

**Direction artistique : sobre, épuré, blanc dominant, très fort contraste pour la lisibilité en conduite. Intemporel, pas de gadget.**

- **Palette :**
  - Fond / carte : blancs et gris très clairs, routes en gris doux, eau en bleu désaturé léger.
  - Accent principal : une couleur unique forte pour l'itinéraire actif et les CTA (à définir — un bleu profond ou une teinte signature AZAG).
  - Couleurs sémantiques des signalements : rouge (danger/accident), orange (bouchon), bleu (police), jaune (objet/véhicule arrêté). Sobres, pas criardes.
- **Typographie :** une grotesque propre et très lisible (Inter, ou équivalent). Grandes tailles pour les instructions de navigation (lisibles d'un coup d'œil).
- **Composants clés :**
  - Bandeau d'instruction turn-by-turn en haut (flèche + rue + distance), très gros, très lisible.
  - Carte plein écran.
  - Bouton flottant de signalement (FAB) en bas, ouvrant une feuille (bottom sheet) avec les grandes icônes de types de signalement, accessibles au pouce.
  - Bottom sheet d'itinéraire (ETA, distance, alternative) au repos.
  - Cartons de confirm/deny discrets quand on approche d'un signalement.
- **Motion :** transitions douces, pas d'animations gratuites. Feedback tactile immédiat sur les actions.
- **Accessibilité :** contrastes AA minimum, zones tactiles ≥ 44px, mode conduite « gros boutons ».
- **Logotype :** « AZAG » en capitales, typo grotesque nette. Possibilité d'intégrer discrètement une pointe de curseur/navigation dans le **G**. Favicon + icônes PWA à générer.

> Avant de coder l'UI, consulter le skill `frontend-design` s'il est disponible dans l'environnement.

---

## 8. Découpage en phases (avec validation entre chaque)

**Workflow imposé : à la fin de chaque phase, s'arrêter, résumer ce qui a été fait, et attendre ma validation avant de passer à la suivante.** (Haris travaille systématiquement en « montre le résultat, attends l'accord ».)

- **Phase 0 — Setup & archi.** Scaffolding React+Vite+TS, PWA de base, structure de dossiers, `.env.example`, connexion Supabase, compte/clé TomTom, MapLibre affichant une carte claire centrée sur Lyon. **Config GitHub Pages complète (§2.1) : `base` path Vite, stratégie de routing SPA, workflow GitHub Actions de déploiement vers `gh-pages`, restriction de la clé TomTom par domaine.** Design tokens posés. → Validation.
- **Phase 1 — Carte & géoloc.** Position utilisateur en temps réel (throttlée), suivi, recentrage, style de carte clair minimal finalisé. → Validation.
- **Phase 2 — Routing.** Saisie destination, calcul d'itinéraire le plus rapide via TomTom (trafic activé), tracé sur la carte, ETA/distance, recalcul sur déviation (optimisé quota). → Validation.
- **Phase 3 — Guidage.** Turn-by-turn visuel (bandeau) + vocal (Web Speech), WakeLock, mode conduite. → Validation.
- **Phase 4 — Signalements (backend).** Schéma Supabase/PostGIS, RPC `create_report` / `reports_nearby` / `vote_report`, RLS strictes, TTL + cron de purge, algorithme de corrélation ≥ 2 devices + réputation. → Validation.
- **Phase 5 — Signalements (front).** FAB + bottom sheet de signalement, affichage des signalements (pending/confirmed), Realtime borné au rayon, confirm/deny à l'approche. → Validation.
- **Phase 6 — Polish & perf.** Passage complet des exigences §6, audit perf mobile, service worker/cache, icônes PWA, finitions design. → Validation.

---

## 9. Consignes pour Claude Code

- **Découpe le travail en sous-agents quand c'est réellement utile** (ex : un agent sur le moteur de routing/navigation pendant qu'un autre pose le design system et les composants UI ; un agent backend Supabase/PostGIS en parallèle du front carte). L'objectif est un travail parallèle **orienté résultat**, pas d'empiler des outils pour le plaisir. Chaque sous-agent doit avoir un périmètre clair et rendre un livrable testable.
- **Utilise les MCP disponibles** (Supabase notamment) pour piloter le schéma et les migrations proprement.
- **Respecte les exigences de performance (§6) comme des contraintes de premier ordre**, pas comme un polish final : elles influencent l'archi dès le départ.
- **Sécurité** : jamais de secret commité (TomTom key, Supabase service_role). `.env` + `.env.example`. RLS strictes. Restreindre la clé TomTom par domaine.
- **Qualité de code** : TypeScript strict, composants découpés, pas de dette inutile. Tester chaque phase avant de la présenter.
- **Style d'écriture** (docs, commentaires, commits) : pas de tirets cadratins (em-dashes). Mix FR/EN naturel du vocabulaire tech accepté.
- **Respecte le workflow par phases (§8)** : montre le résultat, attends la validation, ne fonce pas jusqu'au bout sans checkpoint.

---

*Fin du brief AZAG. Claude Code : commence par confirmer ta compréhension de l'archi et propose le plan de Phase 0 avant de coder.*
