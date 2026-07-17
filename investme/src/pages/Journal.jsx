// MODULE 4 - Journal de Trades.
// Logs every buy/sell with the reason + emotion behind it, shows a
// simple portfolio view, and offers a Claude-generated monthly review.
import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useClaudeAPI } from '../hooks/useClaudeAPI'
import TradeForm from '../components/TradeForm.jsx'
import Disclaimer from '../components/Disclaimer.jsx'
import { formatCurrency, formatPercent, formatDate } from '../utils/formatters'

const CLASS_COLORS = { ETF: '#6366f1', Action: '#22c55e', Crypto: '#f59e0b' }

const INSIGHTS_SYSTEM_PROMPT = `Tu es un coach pédagogique pour un investisseur débutant long terme.
On te donne l'historique de ses trades au format JSON (achats/ventes, raisons, émotions).
Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, avec exactement ces clés :
{
  "biais_detectes": ["...", "..."],
  "points_positifs": ["...", "..."],
  "suggestions": ["...", "..."],
  "disclaimer": "Ces observations sont informatives et générées par IA, elles ne constituent pas un conseil en investissement au sens de la réglementation AMF."
}
Sois bienveillant et concret, base-toi uniquement sur les données fournies.`

export default function Journal() {
  const [trades, setTrades] = useLocalStorage('investme_trades', [])
  // Manual "current value" per asset name, since there's no live price API.
  const [currentValues, setCurrentValues] = useLocalStorage('investme_current_values', {})
  const [showForm, setShowForm] = useState(false)
  const [insights, setInsights] = useState(null)
  const { askClaude, loading, error } = useClaudeAPI()

  const positions = useMemo(() => buildPositions(trades), [trades])
  const totalInvested = trades.filter((t) => t.type === 'Achat').reduce((sum, t) => sum + t.totalAmount, 0)
  const totalCurrentValue = positions.reduce(
    (sum, p) => sum + (currentValues[p.name] ?? p.invested),
    0
  )
  const totalPnl = totalCurrentValue - totalInvested
  const totalPnlPercent = totalInvested > 0 ? totalPnl / totalInvested : 0

  const breakdownData = useMemo(() => {
    const byClass = {}
    for (const p of positions) {
      const value = currentValues[p.name] ?? p.invested
      byClass[p.assetClass] = (byClass[p.assetClass] ?? 0) + value
    }
    return Object.entries(byClass).map(([name, value]) => ({ name, value }))
  }, [positions, currentValues])

  function addTrade(trade) {
    setTrades([trade, ...trades])
    setShowForm(false)
  }

  async function runInsights() {
    const result = await askClaude(INSIGHTS_SYSTEM_PROMPT, JSON.stringify(trades))
    if (result) setInsights(result)
  }

  function exportCsv() {
    const header = ['Type', 'Classe', 'Nom', 'Date', 'Quantité', 'Prix unitaire', 'Montant total', 'Émotion', 'Raison']
    const rows = trades.map((t) => [
      t.type,
      t.assetClass,
      t.name,
      t.date,
      t.quantity,
      t.unitPrice,
      t.totalAmount,
      t.emotion,
      t.reason.replace(/"/g, "'"),
    ])
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `investme-journal-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Journal</h1>
        <button onClick={() => setShowForm(!showForm)} className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white">
          {showForm ? 'Fermer' : '+ Ajouter'}
        </button>
      </div>

      {showForm && (
        <div className="mb-5">
          <TradeForm onAdd={addTrade} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* --- Portfolio summary --- */}
      <div className="rounded-xl bg-card p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <Stat label="Total investi" value={formatCurrency(totalInvested)} />
          <Stat label="Valeur actuelle" value={formatCurrency(totalCurrentValue)} />
          <Stat
            label="P&L"
            value={`${formatCurrency(totalPnl)} (${formatPercent(totalPnlPercent)})`}
            valueClass={totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}
          />
        </div>

        {breakdownData.length > 0 && (
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={breakdownData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2}>
                  {breakdownData.map((entry) => (
                    <Cell key={entry.name} fill={CLASS_COLORS[entry.name] ?? '#64748b'} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* --- Manual "current value" editor per position --- */}
      {positions.length > 0 && (
        <div className="mt-4 rounded-xl bg-card p-4">
          <p className="mb-3 text-sm text-slate-400">Mets à jour la valeur actuelle de chaque position</p>
          <div className="space-y-2">
            {positions.map((p) => (
              <div key={p.name} className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-300">{p.name}</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={currentValues[p.name] ?? p.invested}
                  onChange={(e) =>
                    setCurrentValues({ ...currentValues, [p.name]: Number(e.target.value) || 0 })
                  }
                  className="w-28 rounded-lg border border-slate-700 bg-app px-2 py-1 text-right text-sm text-white"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- AI insights --- */}
      <div className="mt-4 rounded-xl bg-card p-4">
        <button
          onClick={runInsights}
          disabled={loading || trades.length === 0}
          className="w-full rounded-lg border border-accent py-2 font-medium text-accent disabled:opacity-40"
        >
          {loading ? 'Analyse en cours...' : '✨ Analyse mon journal'}
        </button>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        {insights && (
          <div className="mt-3 space-y-3 text-sm">
            <InsightList title="Biais détectés" items={insights.biais_detectes} color="text-amber-400" />
            <InsightList title="Points positifs" items={insights.points_positifs} color="text-green-400" />
            <InsightList title="Suggestions" items={insights.suggestions} color="text-accent" />
            <p className="text-xs italic text-slate-500">{insights.disclaimer}</p>
          </div>
        )}
      </div>

      {/* --- Trade list --- */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm text-slate-400">Historique ({trades.length})</p>
          <button onClick={exportCsv} disabled={trades.length === 0} className="text-sm text-accent disabled:opacity-40">
            Exporter mon journal
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {trades.map((trade) => (
            <div key={trade.id} className="rounded-lg bg-card p-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-white">
                  {trade.type} · {trade.name}
                </span>
                <span className="text-slate-400">{formatDate(trade.date)}</span>
              </div>
              <p className="mt-1 text-slate-400">
                {trade.quantity} × {formatCurrency(trade.unitPrice)} = {formatCurrency(trade.totalAmount)}
              </p>
              <p className="mt-1 text-slate-500">{trade.reason}</p>
            </div>
          ))}
          {trades.length === 0 && <p className="py-8 text-center text-sm text-slate-500">Aucun trade enregistré pour l'instant.</p>}
        </div>
      </div>

      <div className="mt-5">
        <Disclaimer />
      </div>
    </div>
  )
}

// Groups raw trades into net positions per asset: how many units are
// still held, and how much money went into that position (Achat - Vente).
function buildPositions(trades) {
  const byName = {}
  for (const t of trades) {
    if (!byName[t.name]) byName[t.name] = { name: t.name, assetClass: t.assetClass, quantity: 0, invested: 0 }
    const sign = t.type === 'Achat' ? 1 : -1
    byName[t.name].quantity += sign * t.quantity
    byName[t.name].invested += sign * t.totalAmount
  }
  return Object.values(byName).filter((p) => p.quantity > 0)
}

function Stat({ label, value, valueClass = 'text-white' }) {
  return (
    <div>
      <p className="text-slate-400">{label}</p>
      <p className={`text-lg font-semibold ${valueClass}`}>{value}</p>
    </div>
  )
}

function InsightList({ title, items, color }) {
  if (!items || items.length === 0) return null
  return (
    <div>
      <p className={`font-medium ${color}`}>{title}</p>
      <ul className="list-inside list-disc text-slate-400">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
