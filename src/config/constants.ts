// Constantes applicatives partagees.

// Centre de la Metropole de Lyon (perimetre de lancement).
export const LYON_CENTER = { lng: 4.8357, lat: 45.764 } as const
export const LYON_DEFAULT_ZOOM = 12

// Styles de carte TomTom Orbis (clair minimal, facon Apple Maps).
// Le style est charge via l'API TomTom ; la cle est ajoutee dynamiquement.
// Endpoint documente : https://developer.tomtom.com/ (Orbis Maps styles).
export const TOMTOM_ORBIS_STYLE_LIGHT =
  'https://api.tomtom.com/maps/orbis/assets/styles/0.2/style.json?apiVersion=1&map=basic_street-light'
