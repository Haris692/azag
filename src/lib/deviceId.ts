// Identifiant technique anonyme par appareil.
// Sert UNIQUEMENT au rate-limiting et a la reputation cote backend.
// Aucune donnee personnelle. Persiste en localStorage.

const STORAGE_KEY = 'azag.device_uuid'

export function getDeviceId(): string {
  let id = localStorage.getItem(STORAGE_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, id)
  }
  return id
}
