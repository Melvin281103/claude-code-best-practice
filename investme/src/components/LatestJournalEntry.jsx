// "Journal — dernière entrée" - the single most recent trade, from the
// "Instrument de rando" direction. Trades are stored newest-first (see
// Journal.jsx's addTrade), so the first entry is always the latest.
import { useLocalStorage } from '../hooks/useLocalStorage'
import { formatCurrency } from '../utils/formatters'

const EMOTION_LABELS = { peur: '😨 peur', neutre: '😐 neutre', confiant: '😊 confiant', euphorique: '🤑 euphorique' }

export default function LatestJournalEntry() {
  const [trades] = useLocalStorage('investme_trades', [])
  const latest = trades[0]

  if (!latest) return null

  return (
    <div className="rounded-xl border border-app/8 bg-creme p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ardoise">Journal — dernière entrée</p>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-app">
          {latest.type} {latest.name} — {formatCurrency(latest.totalAmount)}
        </p>
        <p className="text-sm text-mousse">{EMOTION_LABELS[latest.emotion] ?? latest.emotion}</p>
      </div>
    </div>
  )
}
