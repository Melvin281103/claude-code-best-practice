// Turns the "objectif" answer from onboarding (Q4) - collected but never
// used anywhere else - into a real progress bar: set a target amount once,
// then track how close the current portfolio value gets to it over time.
import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { buildPositions } from '../utils/calculations'
import { formatCurrency, formatPercent } from '../utils/formatters'

export default function GoalProgress({ goal }) {
  const [trades] = useLocalStorage('investme_trades', [])
  const [currentValues] = useLocalStorage('investme_current_values', {})
  const [targetAmount, setTargetAmount] = useLocalStorage('investme_goal_amount', 0)
  const [editing, setEditing] = useState(targetAmount === 0)
  const [draftAmount, setDraftAmount] = useState(targetAmount || '')

  const positions = buildPositions(trades)
  const currentValue = positions.reduce((sum, p) => sum + (currentValues[p.name] ?? p.invested), 0)
  const progress = targetAmount > 0 ? Math.min(currentValue / targetAmount, 1) : 0

  function saveTarget() {
    const value = Number(draftAmount) || 0
    if (value <= 0) return
    setTargetAmount(value)
    setEditing(false)
  }

  return (
    <div className="topo-texture mb-4 rounded-xl bg-card p-4">
      <p className="text-sm text-brume">Objectif : {goal}</p>

      {editing ? (
        <div className="mt-2 flex gap-2">
          <input
            type="number"
            min="0"
            value={draftAmount}
            onChange={(e) => setDraftAmount(e.target.value)}
            placeholder="Montant cible (€)"
            className="w-full rounded-lg border border-brume/30 bg-app px-3 py-2 text-papier"
          />
          <button onClick={saveTarget} className="shrink-0 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-papier">
            OK
          </button>
        </div>
      ) : (
        <>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="font-display text-xl font-semibold tabular-nums text-papier">{formatCurrency(currentValue)}</p>
            <p className="text-sm text-brume">sur {formatCurrency(targetAmount)}</p>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-app">
            <div className="h-full rounded-full bg-accent" style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-xs text-brume">{formatPercent(progress)} de l'objectif atteint</p>
            <button onClick={() => setEditing(true)} className="text-xs text-accent">
              Modifier
            </button>
          </div>
        </>
      )}
    </div>
  )
}
