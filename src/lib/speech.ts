// Guidage vocal via Web Speech API (SpeechSynthesis).
// iOS : la synthese doit etre "debloquee" par un premier appel dans un geste
// utilisateur (bouton Demarrer) -> primeSpeech().

let muted = false

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/** A appeler depuis un geste utilisateur pour autoriser la voix (iOS). */
export function primeSpeech(): void {
  if (!isSpeechSupported()) return
  const u = new SpeechSynthesisUtterance(' ')
  u.volume = 0
  window.speechSynthesis.speak(u)
}

export function setMuted(value: boolean): void {
  muted = value
  if (muted) cancelSpeech()
}

export function isMuted(): boolean {
  return muted
}

export function speak(text: string): void {
  if (!isSpeechSupported() || muted || !text) return
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'fr-FR'
  u.rate = 1.02
  // on n'empile pas les annonces en retard
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(u)
}

export function cancelSpeech(): void {
  if (isSpeechSupported()) window.speechSynthesis.cancel()
}
