// Turns the recommended allocation percentages (ETF/Actions/Crypto) into
// actual euro amounts for a given sum - the bridge between "ton profil
// recommande 50/30/20%" (abstract) and "voici combien mettre dans chaque
// classe" (concrete, ready to type into ton courtier ou ton plan DCA).
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatCurrency } from '../utils/formatters'

const ROW_COLOR_CLASS = { etf: 'text-sentier', actions: 'text-glacier', crypto: 'text-ambre' }
const ROW_DOT_CLASS = { etf: 'bg-sentier', actions: 'bg-glacier', crypto: 'bg-ambre' }

export default function AllocationCalculator({ allocation, defaultAmount }) {
  const navigate = useNavigate()
  const [amount, setAmount] = useState(defaultAmount > 0 ? defaultAmount : 150)

  const rows = [
    { key: 'etf', label: 'ETF', percent: allocation.etf },
    { key: 'actions', label: 'Actions', percent: allocation.actions },
    { key: 'crypto', label: 'Crypto', percent: allocation.crypto },
  ]

  return (
    <div className="topo-texture rounded-xl bg-card p-4">
      <p className="mb-2 text-sm text-brume">Répartis ton montant</p>

      <input
        type="number"
        min="0"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value) || 0)}
        className="w-full rounded-lg border border-brume/30 bg-app px-3 py-2 font-display text-lg tabular-nums text-papier"
      />

      <div className="mt-3 space-y-2">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-300">
              <span className={`h-2 w-2 rounded-full ${ROW_DOT_CLASS[row.key]}`} />
              {row.label} <span className="text-brume">({row.percent} %)</span>
            </span>
            <span className={`font-display font-semibold tabular-nums ${ROW_COLOR_CLASS[row.key]}`}>
              {formatCurrency((amount * row.percent) / 100)}
            </span>
          </div>
        ))}
      </div>

      <button onClick={() => navigate('/dca')} className="print:hidden mt-3 text-xs text-accent underline">
        Configurer ces montants dans mon plan DCA →
      </button>
    </div>
  )
}
