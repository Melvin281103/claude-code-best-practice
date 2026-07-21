// "At a glance" summary shown at the top of the Profil result screen:
// current portfolio value/P&L (from the Journal) and the next scheduled
// DCA (from the DCA plan). Read-only here - editing still happens on
// their own dedicated pages, this is just a quick overview so the user
// doesn't have to hop between tabs to see where they stand.
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
    <div className="mb-4 grid grid-cols-2 gap-3">
      <button onClick={() => navigate('/journal')} className="rounded-xl bg-card p-4 text-left">
        <p className="text-xs text-slate-400">Portefeuille</p>
        <p className="mt-1 text-lg font-semibold text-white">{formatCurrency(totalCurrentValue)}</p>
        {totalInvested > 0 && (
          <p className={`text-xs ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalPnl >= 0 ? '+' : ''}
            {formatCurrency(totalPnl)} ({formatPercent(totalPnlPercent)})
          </p>
        )}
      </button>

      <button onClick={() => navigate('/dca')} className="rounded-xl bg-card p-4 text-left">
        <p className="text-xs text-slate-400">Prochain DCA</p>
        {nextDca ? (
          <p className="mt-1 text-lg font-semibold text-white">
            {nextDca.asset} <span className="text-sm font-normal text-slate-400">J-{nextDca.daysLeft}</span>
          </p>
        ) : (
          <p className="mt-1 text-sm text-slate-500">{dcaPlans.length === 0 ? 'Aucun plan' : 'Tout est fait !'}</p>
        )}
      </button>
    </div>
  )
}
