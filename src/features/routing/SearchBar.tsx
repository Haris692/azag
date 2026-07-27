import { useEffect, useRef, useState } from 'react'
import { searchPlaces } from './tomtomApi'
import type { Place } from './types'
import type { LngLat } from '../../lib/geo'
import styles from './SearchBar.module.css'

type Props = {
  near: LngLat | null
  onSelect: (place: Place) => void
  disabled?: boolean
}

/** Barre de recherche de destination avec suggestions debouncees. */
export default function SearchBar({ near, onSelect, disabled }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Place[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<number | null>(null)

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    const q = query.trim()
    if (q.length < 3) {
      setResults([])
      return
    }
    setLoading(true)
    debounceRef.current = window.setTimeout(async () => {
      try {
        const r = await searchPlaces(q, near ?? undefined)
        setResults(r)
        setOpen(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 320)
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [query, near])

  const choose = (p: Place) => {
    onSelect(p)
    setQuery(p.name)
    setOpen(false)
    setResults([])
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.field}>
        <svg className={styles.icon} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          className={styles.input}
          type="text"
          inputMode="search"
          placeholder="Ou allez-vous ?"
          value={query}
          disabled={disabled}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
        />
        {query && (
          <button
            className={styles.clear}
            aria-label="Effacer"
            onClick={() => {
              setQuery('')
              setResults([])
              setOpen(false)
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {open && (results.length > 0 || loading) && (
        <ul className={styles.list}>
          {loading && results.length === 0 && (
            <li className={styles.hint}>Recherche...</li>
          )}
          {results.map((p) => (
            <li key={p.id}>
              <button className={styles.item} onClick={() => choose(p)}>
                <span className={styles.name}>{p.name}</span>
                {p.address && <span className={styles.addr}>{p.address}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
