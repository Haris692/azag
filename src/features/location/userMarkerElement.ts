import './userMarker.css'

/** Cree l'element DOM du marqueur utilisateur (pastille + fleche de cap). */
export function createUserMarkerElement(): {
  el: HTMLElement
  setHeadingKnown: (known: boolean) => void
} {
  const el = document.createElement('div')
  el.className = 'az-puck az-puck--noheading'
  el.innerHTML = `
    <div class="az-puck__halo"></div>
    <div class="az-puck__arrow"></div>
    <div class="az-puck__core"></div>
  `
  return {
    el,
    setHeadingKnown: (known: boolean) => {
      el.classList.toggle('az-puck--noheading', !known)
    },
  }
}
