// The app's signature element: a risk-profile badge borrowed from ski/
// hiking trail signage (green circle / blue square / black-diamond-style
// garnet diamond), instead of a generic colored pill. It reuses a system
// most people already recognize intuitively, applied to investment risk
// instead of physical difficulty.
const TRAIL_BY_PROFILE = {
  Prudent: { shape: 'circle', colorClass: 'bg-sentier', trailLabel: 'Sentier facile' },
  Équilibré: { shape: 'square', colorClass: 'bg-glacier', trailLabel: 'Sentier intermédiaire' },
  Dynamique: { shape: 'diamond', colorClass: 'bg-grenat', trailLabel: 'Sentier expert' },
}

const SHAPE_CLASSES = {
  circle: 'rounded-full',
  square: 'rounded-sm',
  diamond: 'rounded-sm rotate-45',
}

export default function RiskBadge({ profileName, size = 'md' }) {
  const trail = TRAIL_BY_PROFILE[profileName]
  if (!trail) return null

  const dimension = size === 'lg' ? 'h-8 w-8' : size === 'sm' ? 'h-3 w-3' : 'h-5 w-5'

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block shrink-0 ${dimension} ${trail.colorClass} ${SHAPE_CLASSES[trail.shape]}`} aria-hidden="true" />
      {size !== 'sm' && <span className="text-xs text-ardoise">{trail.trailLabel}</span>}
    </div>
  )
}
