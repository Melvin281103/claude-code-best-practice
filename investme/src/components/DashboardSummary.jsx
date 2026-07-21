// "At a glance" summary shown at the top of the Profil result screen:
// current portfolio value/P&L (from the Journal) and the next scheduled
// DCA (from the DCA plan). Read-only here - editing still happens on
// their own dedicated pages, this is just a quick overview so the user
// doesn't have to hop between tabs to see where they stand.
//
// Styled as the "Instrument de rando" 3-cell stat grid (Valeur / P&L /
// DCA) from the design directions, on the light "Carte de jour" palette
// used for the whole Profil result screen.
import { useNavigate } from 'react-router-dom'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { buildPositions, computeNextDca } from '../utils/calculations'
import { formatCurrency, formatPercent } from '../utils/formatters'

export default function DashboardSummary() {
  const navigate = useNavigate()
  const [trades] = useLocalStorage('investme_trades', [])
  const [currentValues] = useLocalStorage('investme_current_values', {})
  const [dcaPlans] = useLocalStorage('investme_dca_plans', [])
  const [dcaLog] = useLocalStorage('investme_dca_log', [])

  const positions = buildPositions(trades)
  const totalInvested = trades.filter((t) => t.type === 'Achat').reduce((sum, t) => sum + t.totalAmount, 0)
  const totalCurrentValue = positions.reduce((sum, p) => sum + (currentValues[p.name] ?? p.invested), 0)
  const totalPnl = totalCurrentValue - totalInvested
  const totalPnlPercent = totalInvested > 0 ? totalPnl / totalInvested : 0

  const nextDca = computeNextDca(dcaPlans, dcaLog, new Date())

  // Nothing to summarize yet (brand new user) - skip the empty card.
  if (trades.length === 0 && dcaPlans.length === 0) return null

  return (
    <div className="mb-4 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-app/8 bg-app/8">
      <button onClick={() => navigate('/journal')} className="bg-creme p-3 text-left">
        <p className="text-[10px] uppercase tracking-wide text-ardoise">Valeur</p>
        <p className="mt-1 font-display text-lg font-semibold tabular-nums text-app">{formatCurrency(totalCurrentValue)}</p>
      </button>

      <button onClick={() => navigate('/journal')} className="bg-creme p-3 text-left">
        <p className="text-[10px] uppercase tracking-wide text-ardoise">P&amp;L</p>
        <p className={`mt-1 font-display text-lg font-semibold tabular-nums ${totalPnl >= 0 ? 'text-mousse' : 'text-grenat'}`}>
          {totalInvested > 0 ? (
            <>
              {totalPnl >= 0 ? '+' : ''}
              {formatCurrency(totalPnl)}
            </>
          ) : (
            '—'
          )}
        </p>
        {totalInvested > 0 && <p className="text-[11px] text-ardoise">{formatPercent(totalPnlPercent)}</p>}
      </button>

      <button onClick={() => navigate('/dca')} className="bg-creme p-3 text-left">
        <p className="text-[10px] uppercase tracking-wide text-ardoise">DCA</p>
        {nextDca ? (
          <p className="mt-1 font-display text-lg font-semibold text-app">J-{nextDca.daysLeft}</p>
        ) : (
          <p className="mt-1 text-sm text-ardoise">{dcaPlans.length === 0 ? 'Aucun plan' : 'Fait'}</p>
        )}
      </button>
    </div>
  )
}
