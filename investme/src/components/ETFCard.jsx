// One ETF's card in the Comparateur list, plus its detail modal and
// the "Analyse IA" (Claude API) expandable section.
// The watchlist state itself lives one level up in ComparateurETF.jsx
// (shared across the ETF/Actions/Crypto tabs) and is passed down here as
// plain props, so there's a single source of truth instead of each card
// keeping its own disconnected copy.
import { useState } from 'react'
import { useClaudeAPI } from '../hooks/useClaudeAPI'
import HypotheticalProjection from './HypotheticalProjection.jsx'
import { formatPercent } from '../utils/formatters'
import { annualizedRateFromCumulative } from '../utils/calculations'

const AI_SYSTEM_PROMPT = `Tu es un assistant pédagogique pour un débutant en investissement long terme (ETF, actions, crypto).
On te donne les données d'un ETF au format JSON. Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, avec exactement ces clés :
{
  "resume": "2-3 phrases sur ce que suit cet ETF",
  "pour_qui": "profil d'investisseur idéal pour cet ETF",
  "avantages": ["...", "..."],
  "inconvenients": ["...", "..."],
  "disclaimer": "Cette analyse est informative et générée par IA, elle ne constitue pas un conseil en investissement au sens de la réglementation AMF."
}
Ne recommande jamais explicitement d'acheter ou de vendre.`

export default function ETFCard({ etf, compareMode, selected, onToggleSelect, isWatched, onToggleWatchlist }) {
  const [showDetail, setShowDetail] = useState(false)

  function handleCardClick() {
    if (compareMode) {
      onToggleSelect(etf.isin)
    } else {
      setShowDetail(true)
    }
  }

  return (
    <>
      <div
        onClick={handleCardClick}
        className={`cursor-pointer rounded-xl bg-card p-4 ${
          compareMode && selected ? 'ring-2 ring-accent' : ''
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-white">{etf.name}</p>
            <p className="text-xs text-slate-400">
              {etf.ticker} · {etf.index}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                etf.pea_eligible ? 'bg-green-500/20 text-green-400' : 'bg-slate-600/40 text-slate-300'
              }`}
            >
              {etf.pea_eligible ? 'PEA' : 'CTO'}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleWatchlist()
              }}
              className="text-lg leading-none"
              aria-label={isWatched ? 'Retirer de la watchlist' : 'Ajouter à la watchlist'}
            >
              {isWatched ? '⭐' : '☆'}
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Badge label={`TER ${formatPercent(etf.ter, 2)}`} />
          <Badge label={etf.replication} />
          <Badge label={etf.type} />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
          <Perf label="1 an" value={etf.perf_1y} />
          <Perf label="3 ans" value={etf.perf_3y} />
          <Perf label="5 ans" value={etf.perf_5y} />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {etf.courtiers.map((courtier) => (
            <span key={courtier} className="rounded bg-slate-700/50 px-2 py-0.5 text-[10px] text-slate-300">
              {courtier}
            </span>
          ))}
        </div>
      </div>

      {showDetail && (
        <ETFDetailModal etf={etf} isWatched={isWatched} onToggleWatchlist={onToggleWatchlist} onClose={() => setShowDetail(false)} />
      )}
    </>
  )
}

function Badge({ label }) {
  return <span className="rounded bg-slate-700/50 px-2 py-1 text-slate-300">{label}</span>
}

function Perf({ label, value }) {
  return (
    <div>
      <p className="text-slate-500">{label}</p>
      <p className={value >= 0 ? 'text-green-400' : 'text-red-400'}>{formatPercent(value)}</p>
    </div>
  )
}

function ETFDetailModal({ etf, isWatched, onToggleWatchlist, onClose }) {
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [showProjection, setShowProjection] = useState(false)
  const { askClaude, loading, error } = useClaudeAPI()

  async function runAnalysis() {
    const result = await askClaude(AI_SYSTEM_PROMPT, JSON.stringify(etf))
    if (result) setAiAnalysis(result)
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-xl bg-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">{etf.name}</h2>
            <p className="text-sm text-slate-400">
              {etf.ticker} · {etf.isin}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300" aria-label="Fermer">
            ✕
          </button>
        </div>

        <dl className="mt-4 space-y-2 text-sm">
          <DetailRow label="Indice suivi" value={etf.index} />
          <DetailRow label="Frais (TER)" value={formatPercent(etf.ter, 2)} />
          <DetailRow label="Performance 1 an" value={formatPercent(etf.perf_1y)} />
          <DetailRow label="Performance 3 ans" value={formatPercent(etf.perf_3y)} />
          <DetailRow label="Performance 5 ans" value={formatPercent(etf.perf_5y)} />
          <DetailRow label="Réplication" value={etf.replication} />
          <DetailRow label="Type" value={etf.type} />
          <DetailRow label="Éligibilité" value={etf.pea_eligible ? 'PEA' : 'CTO uniquement'} />
          <DetailRow label="Encours" value={`${etf.aum_bn} Md €`} />
          <DetailRow label="Courtiers" value={etf.courtiers.join(', ')} />
        </dl>

        <button
          onClick={onToggleWatchlist}
          className={`mt-4 w-full rounded-lg py-2 font-medium ${
            isWatched ? 'border border-accent text-accent' : 'bg-accent text-white'
          }`}
        >
          {isWatched ? 'Retirer de ma watchlist' : 'Ajouter à ma watchlist'}
        </button>

        <button
          onClick={() => setShowProjection(!showProjection)}
          className="mt-3 w-full rounded-lg border border-slate-700 py-2 text-sm font-medium text-slate-300"
        >
          {showProjection ? 'Masquer la projection hypothétique' : '📈 Voir la projection hypothétique'}
        </button>
        {showProjection && <HypotheticalProjection annualReturn={annualizedRateFromCumulative(etf.perf_5y, 5)} />}

        <div className="mt-4 border-t border-slate-700 pt-4">
          {!aiAnalysis && (
            <button
              onClick={runAnalysis}
              disabled={loading}
              className="w-full rounded-lg border border-accent py-2 font-medium text-accent disabled:opacity-50"
            >
              {loading ? 'Analyse en cours...' : '✨ Analyse IA'}
            </button>
          )}

          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

          {aiAnalysis && (
            <div className="space-y-3 text-sm">
              <p className="text-slate-200">{aiAnalysis.resume}</p>

              <div>
                <p className="font-medium text-slate-300">Pour qui ?</p>
                <p className="text-slate-400">{aiAnalysis.pour_qui}</p>
              </div>

              <div>
                <p className="font-medium text-green-400">Avantages</p>
                <ul className="list-inside list-disc text-slate-400">
                  {aiAnalysis.avantages?.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="font-medium text-red-400">Inconvénients</p>
                <ul className="list-inside list-disc text-slate-400">
                  {aiAnalysis.inconvenients?.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <p className="text-xs italic text-slate-500">{aiAnalysis.disclaimer}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-right text-slate-200">{value}</dd>
    </div>
  )
}
