// MODULE 3 - Comparateur ETF.
// Browse the hardcoded ETF database, filter/sort it, and optionally pick
// up to 3 ETFs to compare side-by-side in a table.
import { useMemo, useState } from 'react'
import ETFCard from '../components/ETFCard.jsx'
import { ETFS, LAST_UPDATED } from '../data/etfs'
import { formatPercent, formatDate } from '../utils/formatters'

const SORT_OPTIONS = [
  { value: 'ter', label: 'TER' },
  { value: 'perf_1y', label: 'Perf 1 an' },
  { value: 'aum_bn', label: 'Encours' },
]

const COURTIERS = ['Trade Republic', 'XTB', 'Fortuneo']

export default function ComparateurETF() {
  const [peaOnly, setPeaOnly] = useState(false)
  const [capitalisantOnly, setCapitalisantOnly] = useState(false)
  const [sortBy, setSortBy] = useState('ter')
  const [courtierFilter, setCourtierFilter] = useState(null)
  const [compareMode, setCompareMode] = useState(false)
  const [selectedIsins, setSelectedIsins] = useState([])

  const visibleEtfs = useMemo(() => {
    let list = ETFS.filter((etf) => {
      if (peaOnly && !etf.pea_eligible) return false
      if (capitalisantOnly && etf.type !== 'Capitalisant') return false
      if (courtierFilter && !etf.courtiers.includes(courtierFilter)) return false
      return true
    })

    list = [...list].sort((a, b) => {
      if (sortBy === 'ter') return a.ter - b.ter // lower fees first
      return b[sortBy] - a[sortBy] // higher performance/encours first
    })

    return list
  }, [peaOnly, capitalisantOnly, courtierFilter, sortBy])

  const selectedEtfs = ETFS.filter((etf) => selectedIsins.includes(etf.isin))

  function toggleSelect(isin) {
    setSelectedIsins((current) => {
      if (current.includes(isin)) return current.filter((id) => id !== isin)
      if (current.length >= 3) return current // max 3 ETFs in compare mode
      return [...current, isin]
    })
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Comparateur ETF</h1>
        <button
          onClick={() => setCompareMode(!compareMode)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            compareMode ? 'bg-accent text-white' : 'border border-slate-700 text-slate-300'
          }`}
        >
          {compareMode ? 'Quitter comparaison' : 'Comparer'}
        </button>
      </div>

      {/* --- Filter bar --- */}
      <div className="space-y-3 rounded-xl bg-card p-4">
        <div className="flex flex-wrap gap-2">
          <ToggleChip active={peaOnly} onClick={() => setPeaOnly(!peaOnly)} label="PEA uniquement" />
          <ToggleChip
            active={capitalisantOnly}
            onClick={() => setCapitalisantOnly(!capitalisantOnly)}
            label="Capitalisant"
          />
        </div>

        <div>
          <p className="mb-1 text-xs text-slate-400">Trier par</p>
          <div className="flex gap-2">
            {SORT_OPTIONS.map((opt) => (
              <ToggleChip key={opt.value} active={sortBy === opt.value} onClick={() => setSortBy(opt.value)} label={opt.label} />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs text-slate-400">Mon courtier</p>
          <div className="flex flex-wrap gap-2">
            {COURTIERS.map((courtier) => (
              <ToggleChip
                key={courtier}
                active={courtierFilter === courtier}
                onClick={() => setCourtierFilter(courtierFilter === courtier ? null : courtier)}
                label={courtier}
              />
            ))}
          </div>
        </div>
      </div>

      {compareMode && (
        <p className="mt-3 text-sm text-slate-400">
          Sélectionne jusqu'à 3 ETF ({selectedIsins.length}/3) en tapant sur leur carte.
        </p>
      )}

      {compareMode && selectedEtfs.length >= 2 && <CompareTable etfs={selectedEtfs} />}

      {/* --- ETF list --- */}
      <div className="mt-4 flex flex-col gap-3">
        {visibleEtfs.map((etf) => (
          <ETFCard
            key={etf.isin}
            etf={etf}
            compareMode={compareMode}
            selected={selectedIsins.includes(etf.isin)}
            onToggleSelect={toggleSelect}
          />
        ))}
        {visibleEtfs.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">Aucun ETF ne correspond à ces filtres.</p>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-slate-600">Données mises à jour le {formatDate(LAST_UPDATED)}</p>
    </div>
  )
}

function ToggleChip({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        active ? 'bg-accent text-white' : 'bg-slate-700/50 text-slate-300'
      }`}
    >
      {label}
    </button>
  )
}

// Rows shown in the side-by-side comparison table, plus how to pick the
// "winner" for rows where a numeric comparison makes sense.
const COMPARE_ROWS = [
  { label: 'TER', get: (e) => e.ter, format: (v) => formatPercent(v, 2), best: 'min' },
  { label: 'Perf 1 an', get: (e) => e.perf_1y, format: (v) => formatPercent(v), best: 'max' },
  { label: 'Perf 3 ans', get: (e) => e.perf_3y, format: (v) => formatPercent(v), best: 'max' },
  { label: 'Perf 5 ans', get: (e) => e.perf_5y, format: (v) => formatPercent(v), best: 'max' },
  { label: 'Encours', get: (e) => e.aum_bn, format: (v) => `${v} Md €`, best: 'max' },
  { label: 'Réplication', get: (e) => e.replication, format: (v) => v, best: null },
  { label: 'Éligibilité', get: (e) => (e.pea_eligible ? 'PEA' : 'CTO'), format: (v) => v, best: null },
]

function CompareTable({ etfs }) {
  return (
    <div className="mt-3 overflow-x-auto rounded-xl bg-card p-3">
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th className="p-2 text-slate-500"></th>
            {etfs.map((etf) => (
              <th key={etf.isin} className="p-2 font-medium text-white">
                {etf.ticker}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARE_ROWS.map((row) => {
            const values = etfs.map((etf) => row.get(etf))
            const winner =
              row.best === 'min' ? Math.min(...values) : row.best === 'max' ? Math.max(...values) : null

            return (
              <tr key={row.label} className="border-t border-slate-700">
                <td className="p-2 text-slate-400">{row.label}</td>
                {etfs.map((etf, i) => (
                  <td
                    key={etf.isin}
                    className={`p-2 ${values[i] === winner ? 'font-semibold text-green-400' : 'text-slate-200'}`}
                  >
                    {row.format(values[i])}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
