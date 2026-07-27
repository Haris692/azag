type Props = { maneuver: string; size?: number }

/** Categorise un code manoeuvre TomTom en type d'icone. */
function iconType(m: string): string {
  const u = m.toUpperCase()
  if (u.includes('UTURN')) return 'uturn'
  if (u.includes('ROUNDABOUT')) return 'roundabout'
  if (u.includes('ARRIVE') || u.includes('WAYPOINT')) return 'arrive'
  if (u === 'DEPART') return 'depart'
  if (u.includes('SHARP_LEFT')) return 'sharp-left'
  if (u.includes('SHARP_RIGHT')) return 'sharp-right'
  if (u.includes('TURN_LEFT')) return 'left'
  if (u.includes('TURN_RIGHT')) return 'right'
  if (u.includes('LEFT')) return 'slight-left' // KEEP/BEAR/EXIT left
  if (u.includes('RIGHT')) return 'slight-right'
  return 'straight'
}

/** Icone de manoeuvre, blanche, lisible d'un coup d'oeil en conduite. */
export default function ManeuverIcon({ maneuver, size = 40 }: Props) {
  const t = iconType(maneuver)
  const stroke = '#ffffff'
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 48 48',
    fill: 'none' as const,
    stroke,
    strokeWidth: 4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  switch (t) {
    case 'left':
      return (
        <svg {...common}>
          <path d="M30 40 V24 a6 6 0 0 0-6-6 H14" />
          <path d="M20 12 L12 18 L20 24" />
        </svg>
      )
    case 'right':
      return (
        <svg {...common}>
          <path d="M18 40 V24 a6 6 0 0 1 6-6 H34" />
          <path d="M28 12 L36 18 L28 24" />
        </svg>
      )
    case 'slight-left':
      return (
        <svg {...common}>
          <path d="M28 40 V26 a8 8 0 0 0-3-6 L16 13" />
          <path d="M14 22 L15 12 L25 13" />
        </svg>
      )
    case 'slight-right':
      return (
        <svg {...common}>
          <path d="M20 40 V26 a8 8 0 0 1 3-6 L32 13" />
          <path d="M34 22 L33 12 L23 13" />
        </svg>
      )
    case 'sharp-left':
      return (
        <svg {...common}>
          <path d="M30 40 V26 a8 8 0 0 0-8-8 H14" />
          <path d="M20 10 L12 18 L20 26" />
        </svg>
      )
    case 'sharp-right':
      return (
        <svg {...common}>
          <path d="M18 40 V26 a8 8 0 0 1 8-8 H34" />
          <path d="M28 10 L36 18 L28 26" />
        </svg>
      )
    case 'uturn':
      return (
        <svg {...common}>
          <path d="M16 40 V22 a8 8 0 0 1 16 0 V26" />
          <path d="M26 20 L32 26 L38 20" />
        </svg>
      )
    case 'roundabout':
      return (
        <svg {...common}>
          <circle cx="22" cy="26" r="8" />
          <path d="M22 40 V34" />
          <path d="M30 18 L36 12" />
          <path d="M30 12 L36 12 L36 18" />
        </svg>
      )
    case 'arrive':
      return (
        <svg {...common}>
          <path d="M24 42 C24 42 12 28 12 19 a12 12 0 0 1 24 0 C36 28 24 42 24 42 Z" />
          <circle cx="24" cy="19" r="4" fill={stroke} stroke="none" />
        </svg>
      )
    case 'depart':
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="6" fill={stroke} stroke="none" />
          <path d="M24 18 V6" />
          <path d="M18 12 L24 6 L30 12" />
        </svg>
      )
    default: // straight
      return (
        <svg {...common}>
          <path d="M24 40 V12" />
          <path d="M16 20 L24 12 L32 20" />
        </svg>
      )
  }
}
