// Acces centralise et type aux variables d'environnement Vite.
// Rappel : ces valeurs sont publiques (injectees au build, visibles dans le bundle).
// La securite ne repose donc PAS sur leur confidentialite mais sur :
//   - la restriction par domaine de la cle TomTom (portail TomTom)
//   - les RLS strictes cote Supabase (cle anon uniquement)

export const env = {
  tomtomKey: import.meta.env.VITE_TOMTOM_KEY ?? '',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
} as const

export function hasTomTomKey(): boolean {
  return env.tomtomKey.trim().length > 0
}

export function hasSupabase(): boolean {
  return env.supabaseUrl.trim().length > 0 && env.supabaseAnonKey.trim().length > 0
}
