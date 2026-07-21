// MODULE 3 - Comparateur ETF.
// Browse 3 hardcoded asset databases (ETF, Actions, Crypto) split into
// tabs. The ETF tab has the full experience (filters, watchlist, compare
// mode, AI analysis); Actions and Crypto are simpler sortable lists of
// the same "what can I invest in, and what has it returned" idea.
import { useMemo, useState } from 'react'
import ETFCard from '../components/ETFCard.jsx'
import HypotheticalProjection from '../components/HypotheticalProjection.jsx'
import GlossaryTerm from '../components/GlossaryTerm.jsx'
import { useLiveCryptoPrices } from '../hooks/useLiveCryptoPrices.js'
import { usePriceAlerts } from '../hooks/usePriceAlerts.js'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { ETFS, LAST_UPDATED } from '../data/etfs'
import { ACTIONS, ACTIONS_LAST_UPDATED } from '../data/actions'
import { CRYPTOS, CRYPTOS_LAST_UPDATED } from '../data/cryptos'
import { formatPercent, formatDate, formatCurrencyPrecise } from '../utils/formatters'
import { annualizedRateFromCumulative } from '../utils/calculations'

const SORT_OPTIONS = [
  { value: 'ter', label: 'TER' },
  { value: 'perf_1y', label: 'Perf 1 an' },
  { value: 'aum_bn', label: 'Encours' },
]

const PERF_SORT_OPTIONS = [
  { value: 'perf_1y', label: 'Perf 1 an' },
  { value: 'perf_3y', label: 'Perf 3 ans' },
  { value: 'perf_5y', label: 'Perf 5 ans' },
]

const COURTIERS = ['Trade Republic', 'XTB', 'Fortuneo']

const TABS = [
  { value: 'etf', label: 'ETF' },
  { value: 'actions', label: 'Actions' },
  { value: 'crypto', label: 'Crypto' },
]

export default function ComparateurETF() {
  const [activeTab, setActiveTab] = useState('etf')
  const [peaOnly, setPeaOnly] = useState(false)
  const [capitalisantOnly, setCapitalisantOnly] = useState(false)
  const [sortBy, setSortBy] = useState('ter')
  const [courtierFilter, setCourtierFilter] = useState(null)
  const [compareMode, setCompareMode] = useState(false)
  const [selectedIsins, setSelectedIsins] = useState([])
  const [showWatchlistOnly, setShowWatchlistOnly] = useState(false)
  const liveCrypto = useLiveCryptoPrices()
  const priceAlerts = usePriceAlerts(liveCrypto.prices)

  // Single source of truth for the watchlist, shared across all 3 tabs.
  // Entries look like { type: 'etf'|'action'|'crypto', id: <isin/ticker> }
  // so items from different asset classes never collide.
  const [watchlist, setWatchlist] = useLocalStorage('investme_watchlist', [])

  function isWatched(type, id) {
    return watchlist.some((w) => w.type === type && w.id === id)
  }

  function toggleWatchlist(type, id) {
    setWatchlist(
      isWatched(type, id) ? watchlist.filter((w) => !(w.type === type && w.id === id)) : [...watchlist, { type, id }]
    )
  }

  const visibleEtfs = useMemo(() => {
    let list = ETFS.filter((etf) => {
      if (peaOnly && !etf.pea_eligible) return false
      if (capitalisantOnly && etf.type !== 'Capitalisant') return false
      if (courtierFilter && !etf.courtiers.includes(courtierFilter)) return false
      if (showWatchlistOnly && !isWatched('etf', etf.isin)) return false
      return true
    })

    list = [...list].sort((a, b) => {
      if (sortBy === 'ter') return a.ter - b.ter // lower fees first
      return b[sortBy] - a[sortBy] // higher performance/encours first
    })

    return list
  }, [peaOnly, capitalisantOnly, courtierFilter, sortBy, showWatchlistOnly, watchlist])

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
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-white">Comparateur</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowWatchlistOnly(!showWatchlistOnly)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              showWatchlistOnly ? 'bg-accent text-white' : 'border border-slate-700 text-slate-300'
            }`}
          >
            ⭐ Watchlist ({watchlist.length})
          </button>
          {activeTab === 'etf' && (
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                compareMode ? 'bg-accent text-white' : 'border border-slate-700 text-slate-300'
              }`}
            >
              {compareMode ? 'Quitter comparaison' : 'Comparer'}
            </button>
          )}
        </div>
      </div>

      {/* --- Tab switcher: ETF / Actions / Crypto --- */}
      <div className="mb-4 flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium ${
              activeTab === tab.value ? 'bg-accent text-white' : 'bg-slate-700/50 text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'etf' && (
        <>
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
                isWatched={isWatched('etf', etf.isin)}
                onToggleWatchlist={() => toggleWatchlist('etf', etf.isin)}
              />
            ))}
            {visibleEtfs.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">Aucun ETF ne correspond à ces filtres.</p>
            )}
          </div>

          <p className="mt-4 text-center text-xs text-slate-600">Données mises à jour le {formatDate(LAST_UPDATED)}</p>
        </>
      )}

      {activeTab === 'actions' && (
        <SimpleAssetTab
          assets={showWatchlistOnly ? ACTIONS.filter((a) => isWatched('action', a.ticker)) : ACTIONS}
          lastUpdated={ACTIONS_LAST_UPDATED}
          emptyLabel={showWatchlistOnly ? 'Aucune action dans ta watchlist.' : 'Aucune action dans la base.'}
          getTag={(a) => a.secteur}
          getExtra={(a) => ({ label: 'Dividende', value: formatPercent(a.dividende_yield, 1) })}
          getBadge={(a) => (a.pea_eligible ? { label: 'PEA', tone: 'green' } : { label: 'CTO', tone: 'grey' })}
          getIsWatched={(a) => isWatched('action', a.ticker)}
          getOnToggleWatchlist={(a) => () => toggleWatchlist('action', a.ticker)}
        />
      )}

      {activeTab === 'crypto' && (
        <>
          <LivePricesHeader live={liveCrypto} />
          <SimpleAssetTab
            assets={showWatchlistOnly ? CRYPTOS.filter((a) => isWatched('crypto', a.ticker)) : CRYPTOS}
            lastUpdated={CRYPTOS_LAST_UPDATED}
            emptyLabel={showWatchlistOnly ? 'Aucune crypto dans ta watchlist.' : 'Aucune crypto dans la base.'}
            getTag={(a) => a.categorie}
            getExtra={(a) => ({ label: 'Volatilité', value: a.volatilite })}
            getBadge={() => null}
            getLivePrice={(a) => liveCrypto.prices[a.coingeckoId]}
            getIsWatched={(a) => isWatched('crypto', a.ticker)}
            getOnToggleWatchlist={(a) => () => toggleWatchlist('crypto', a.ticker)}
            getAlerts={(a) => priceAlerts.alerts.filter((alert) => alert.coingeckoId === a.coingeckoId)}
            onAddAlert={(a) => (direction, targetPrice) => priceAlerts.addAlert(a.coingeckoId, a.name, direction, targetPrice)}
            onRemoveAlert={priceAlerts.removeAlert}
          />
        </>
      )}
    </div>
  )
}

// Shared list view for the Actions and Crypto tabs: sortable by
// performance, one lightweight card per asset. Simpler than the ETF tab
// on purpose (no watchlist/compare/AI) to keep this addition contained.
function SimpleAssetTab({
  assets,
  lastUpdated,
  emptyLabel,
  getTag,
  getExtra,
  getBadge,
  getLivePrice,
  getIsWatched,
  getOnToggleWatchlist,
  getAlerts,
  onAddAlert,
  onRemoveAlert,
}) {
  const [sortBy, setSortBy] = useState('perf_1y')

  const sorted = useMemo(() => [...assets].sort((a, b) => b[sortBy] - a[sortBy]), [assets, sortBy])

  return (
    <div>
      <div className="rounded-xl bg-card p-4">
        <p className="mb-1 text-xs text-slate-400">Trier par</p>
        <div className="flex gap-2">
          {PERF_SORT_OPTIONS.map((opt) => (
            <ToggleChip key={opt.value} active={sortBy === opt.value} onClick={() => setSortBy(opt.value)} label={opt.label} />
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {sorted.map((asset) => (
          <SimpleAssetCard
            key={asset.ticker}
            asset={asset}
            tag={getTag(asset)}
            extra={getExtra(asset)}
            badge={getBadge(asset)}
            livePrice={getLivePrice ? getLivePrice(asset) : null}
            isWatched={getIsWatched(asset)}
            onToggleWatchlist={getOnToggleWatchlist(asset)}
            alerts={getAlerts ? getAlerts(asset) : undefined}
            onAddAlert={getAlerts ? onAddAlert(asset) : undefined}
            onRemoveAlert={onRemoveAlert}
          />
        ))}
        {sorted.length === 0 && <p className="py-8 text-center text-sm text-slate-500">{emptyLabel}</p>}
      </div>

      <p className="mt-4 text-center text-xs text-slate-600">Données historiques mises à jour le {formatDate(lastUpdated)}</p>
    </div>
  )
}

// Header shown above the Crypto tab: last-refresh time + a manual
// "Actualiser" button, since the automatic refresh only happens every
// hour and the user might not want to wait.
function LivePricesHeader({ live }) {
  return (
    <div className="mb-4 flex items-center justify-between rounded-xl bg-card px-4 py-3 text-xs">
      <span className="text-slate-400">
        {live.error
          ? live.error
          : live.lastUpdated
            ? `Prix en direct actualisés à ${live.lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} (auto toutes les heures)`
            : 'Chargement des prix en direct...'}
      </span>
      <button onClick={live.refetch} disabled={live.loading} className="shrink-0 text-accent disabled:opacity-40">
        {live.loading ? '...' : 'Actualiser'}
      </button>
    </div>
  )
}

function SimpleAssetCard({ asset, tag, extra, badge, livePrice, isWatched, onToggleWatchlist, alerts, onAddAlert, onRemoveAlert }) {
  const [showProjection, setShowProjection] = useState(false)
  const badgeTone = badge?.tone === 'green' ? 'bg-green-500/20 text-green-400' : 'bg-slate-600/40 text-slate-300'

  return (
    <div className="rounded-xl bg-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-white">{asset.name}</p>
          <p className="text-xs text-slate-400">
            {asset.ticker} · {tag}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {badge && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badgeTone}`}>
              <GlossaryTerm term={badge.label} />
            </span>
          )}
          <button
            onClick={onToggleWatchlist}
            className="text-lg leading-none"
            aria-label={isWatched ? 'Retirer de la watchlist' : 'Ajouter à la watchlist'}
          >
            {isWatched ? '⭐' : '☆'}
          </button>
        </div>
      </div>

      {livePrice && (
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-semibold text-white">{formatCurrencyPrecise(livePrice.eur)}</span>
          {typeof livePrice.eur_24h_change === 'number' && (
            <span className={livePrice.eur_24h_change >= 0 ? 'text-sm text-green-400' : 'text-sm text-red-400'}>
              {livePrice.eur_24h_change >= 0 ? '+' : ''}
              {livePrice.eur_24h_change.toFixed(1)} % (24h)
            </span>
          )}
        </div>
      )}

      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
        <PerfCell label="1 an" value={asset.perf_1y} />
        <PerfCell label="3 ans" value={asset.perf_3y} />
        <PerfCell label="5 ans" value={asset.perf_5y} />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-slate-500">
          <GlossaryTerm term={extra.label} /> : <span className="text-slate-300">{extra.value}</span>
        </span>
        <div className="flex flex-wrap gap-1.5">
          {asset.courtiers.map((courtier) => (
            <span key={courtier} className="rounded bg-slate-700/50 px-2 py-0.5 text-slate-300">
              {courtier}
            </span>
          ))}
        </div>
      </div>

      <button
        onClick={() => setShowProjection(!showProjection)}
        className="mt-3 w-full rounded-lg border border-slate-700 py-1.5 text-xs font-medium text-slate-300"
      >
        {showProjection ? 'Masquer la projection hypothétique' : '📈 Voir la projection hypothétique'}
      </button>
      {showProjection && <HypotheticalProjection annualReturn={annualizedRateFromCumulative(asset.perf_5y, 5)} />}

      {alerts && <PriceAlertSection alerts={alerts} onAddAlert={onAddAlert} onRemoveAlert={onRemoveAlert} />}
    </div>
  )
}

// Lets the user set a "notify me if this price goes above/below X€"
// alert on a live-priced crypto card. Only rendered when the parent
// passed live alert data (i.e. the Crypto tab).
function PriceAlertSection({ alerts, onAddAlert, onRemoveAlert }) {
  const [direction, setDirection] = useState('above')
  const [targetPrice, setTargetPrice] = useState('')

  function handleAdd() {
    const value = Number(targetPrice)
    if (!value || value <= 0) return
    onAddAlert(direction, value)
    setTargetPrice('')
  }

  return (
    <div className="mt-3 border-t border-slate-700 pt-3">
      <p className="text-xs font-medium text-slate-300">🔔 Alertes de prix</p>

      {alerts.length > 0 && (
        <div className="mt-2 space-y-1">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-center justify-between text-xs">
              <span className={alert.triggered ? 'text-slate-500' : 'text-slate-300'}>
                {alert.triggered ? '🔔 Déclenchée' : '⏳ Active'} -{' '}
                {alert.direction === 'above' ? 'au-dessus de' : 'en dessous de'} {alert.targetPrice} €
              </span>
              <button onClick={() => onRemoveAlert(alert.id)} className="text-slate-600" aria-label="Supprimer l'alerte">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 flex gap-2">
        <select
          value={direction}
          onChange={(e) => setDirection(e.target.value)}
          className="rounded-lg border border-slate-700 bg-app px-2 py-1 text-xs text-slate-300"
        >
          <option value="above">Au-dessus de</option>
          <option value="below">En dessous de</option>
        </select>
        <input
          type="number"
          min="0"
          value={targetPrice}
          onChange={(e) => setTargetPrice(e.target.value)}
          placeholder="Prix en €"
          className="w-24 rounded-lg border border-slate-700 bg-app px-2 py-1 text-xs text-white"
        />
        <button onClick={handleAdd} className="rounded-lg bg-accent px-2 py-1 text-xs font-medium text-white">
          Créer
        </button>
      </div>
    </div>
  )
}

function PerfCell({ label, value }) {
  return (
    <div>
      <p className="text-slate-500">{label}</p>
      <p className={value >= 0 ? 'text-green-400' : 'text-red-400'}>{formatPercent(value)}</p>
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
