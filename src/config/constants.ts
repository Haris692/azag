// Constantes applicatives partagees.

// Centre de la Metropole de Lyon (perimetre de lancement).
export const LYON_CENTER = { lng: 4.8357, lat: 45.764 } as const
export const LYON_DEFAULT_ZOOM = 12

// Style de carte TomTom Orbis clair minimal (facon Apple Maps).
// TomTom renvoie un style MapLibre v8 complet dont les sous-ressources
// (tuiles vectorielles, sprite, glyphs) contiennent deja la cle : il suffit
// de pointer MapLibre sur cette URL. Le segment de version est '0.*' (wildcard,
// resout vers la derniere 0.x ; les versions figees renvoient un 400).
export const TOMTOM_ORBIS_STYLE_LIGHT =
  'https://api.tomtom.com/maps/orbis/assets/styles/0.*/style.json?apiVersion=1&map=basic_street-light'
