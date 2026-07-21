// MODULE 5 - Plan DCA (Dollar-Cost Averaging).
// Lets the user schedule a recurring monthly investment per asset,
// track this month's progress, and see the history over time.
import { useMemo, useState } from 'react'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useClaudeAPI } from '../hooks/useClaudeAPI'
import GlossaryTerm from '../components/GlossaryTerm.jsx'
import { averagePurchasePrice } from '../utils/calculations'
import { formatCurrency, formatCurrencyPrecise } from '../utils/formatters'

const COURTIERS = ['Trade Republic', 'XTB', 'Fortuneo', 'Revolut']

const MARKET_CONTEXT_SYSTEM_PROMPT = `Tu es un assistant qui rassure des investisseurs débutants qui font du DCA (investissement programmé).
Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, avec exactement cette clé :
{ "bullets": ["point 1", "point 2", "point 3"] }
3 points courts sur le contexte de marché du jour, factuels et neutres. Ne dis JAMAIS de ne pas investir, ne donne aucun conseil d'achat ou de vente précis.`

function currentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export default function DCA() {
  const [plans, setPlans] = useLocalStorage('investme_dca_plans', [])
  const [log, setLog] = useLocalStorage('investme_dca_log', [])
  const [trades] = useLocalStorage('investme_trades', [])
  const [showSetup, setShowSetup] = useState(false)

  const today = new Date()
  const monthKey = currentMonthKey(today)

  function isDoneThisMonth(planId) {
    return log.some((l) => l.planId === planId && l.month === monthKey)
  }

  function markDone(plan) {
    setLog([
      ...log,
      { id: crypto.randomUUID(), planId: plan.id, asset: plan.asset, amount: plan.amount, courtier: plan.courtier, month: monthKey, doneDate: today.toISOString() },
    ])
  }

  function addPlan(plan) {
    setPlans([...plans, { id: crypto.randomUUID(), ...plan }])
  }

  function removePlan(id) {
    setPlans(plans.filter((p) => p.id !== id))
  }

  // Next scheduled DCA date across all plans (the plan not yet done this
  // month with the closest upcoming day, or next month's first plan).
  const nextDca = useMemo(() => computeNextDca(plans, log, today), [plans, log])

  const totalTarget = plans.reduce((sum, p) => sum + Number(p.amount), 0)
  const totalDoneThisMonth = log.filter((l) => l.month === monthKey).reduce((sum, l) => sum + l.amount, 0)

  const todaysPlans = plans.filter((p) => Number(p.day) === today.getDate())

  return (
    <div className="px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">
          Plan <GlossaryTerm term="DCA" />
        </h1>
        <button onClick={() => setShowSetup(!showSetup)} className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white">
          {showSetup ? 'Fermer' : '+ Ajouter'}
        </button>
      </div>

      {showSetup && <DcaSetupForm onAdd={addPlan} onCancel={() => setShowSetup(false)} />}

      <NotificationSettings />

      {/* --- Countdown --- */}
      {nextDca && (
        <div className="mt-4 rounded-xl bg-card p-4 text-center">
          <p className="text-sm text-slate-400">Prochain DCA</p>
          <p className="mt-1 text-xl font-bold text-accent">
            {nextDca.asset} dans {nextDca.daysLeft} jour{nextDca.daysLeft > 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* --- Market context on DCA day --- */}
      {todaysPlans.length > 0 && <MarketContextCard />}

      {/* --- This month's table --- */}
      <div className="mt-4 rounded-xl bg-card p-4">
        <p className="mb-3 text-sm text-slate-400">Ce mois-ci</p>
        {plans.length === 0 && <p className="text-sm text-slate-500">Ajoute un premier plan DCA pour commencer.</p>}
        <div className="flex flex-col gap-2">
          {plans.map((plan) => {
            const done = isDoneThisMonth(plan.id)
            const daysLeft = daysUntilDay(plan.day, today)
            return (
              <div key={plan.id} className="flex items-center justify-between rounded-lg bg-app px-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-white">{plan.asset}</p>
                  <p className="text-slate-500">
                    {formatCurrency(plan.amount)} · {plan.courtier}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={done ? 'text-green-400' : 'text-amber-400'}>
                    {done ? '✅ Fait' : `⏳ J-${daysLeft}`}
                  </span>
                  {!done && (
                    <button onClick={() => markDone(plan)} className="rounded bg-accent px-2 py-1 text-xs font-medium text-white">
                      Marquer fait
                    </button>
                  )}
                  <button onClick={() => removePlan(plan.id)} className="text-slate-600" aria-label="Supprimer">
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {plans.length > 0 && (
          <p className="mt-3 text-sm text-slate-400">
            Investi ce mois : <span className="text-white">{formatCurrency(totalDoneThisMonth)}</span> / objectif{' '}
            <span className="text-white">{formatCurrency(totalTarget)}</span>
          </p>
        )}
      </div>

      {/* --- History chart --- */}
      <DcaHistoryChart log={log} />

      {/* --- Average purchase price per asset, from the Journal's trades --- */}
      <AveragePriceTable trades={trades} />
    </div>
  )
}

// Lets the user opt in to a browser notification on the day a DCA is
// due. Only works while the app is actually open that day - there's no
// backend to push a reminder while the phone is locked or the tab closed.
function NotificationSettings() {
  const supported = typeof Notification !== 'undefined'
  const [permission, setPermission] = useState(supported ? Notification.permission : 'unsupported')

  if (!supported) return null

  async function requestPermission() {
    const result = await Notification.requestPermission()
    setPermission(result)
  }

  return (
    <div className="mt-4 rounded-xl bg-card p-4 text-sm">
      <p className="font-medium text-white">🔔 Rappels de DCA</p>
      {permission === 'default' && (
        <>
          <p className="mt-1 text-xs text-slate-500">
            Reçois une notification le jour où un versement est prévu (uniquement quand l'app est ouverte).
          </p>
          <button onClick={requestPermission} className="mt-3 w-full rounded-lg border border-accent py-2 text-sm font-medium text-accent">
            Activer les rappels
          </button>
        </>
      )}
      {permission === 'granted' && <p className="mt-1 text-xs text-green-400">Rappels activés.</p>}
      {permission === 'denied' && (
        <p className="mt-1 text-xs text-slate-500">
          Notifications bloquées - active-les dans les réglages de ton navigateur si tu changes d'avis.
        </p>
      )}
    </div>
  )
}

function DcaSetupForm({ onAdd, onCancel }) {
  const [asset, setAsset] = useState('')
  const [amount, setAmount] = useState(100)
  const [day, setDay] = useState(5)
  const [courtier, setCourtier] = useState(COURTIERS[0])

  function handleSubmit(e) {
    e.preventDefault()
    if (!asset.trim() || amount <= 0) return
    onAdd({ asset: asset.trim(), amount: Number(amount), day: Number(day), courtier })
    onCancel()
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-xl bg-card p-4">
      <div>
        <p className="mb-1 text-sm text-slate-400">Actif</p>
        <input
          value={asset}
          onChange={(e) => setAsset(e.target.value)}
          placeholder="ex: CW8, Bitcoin..."
          className="w-full rounded-lg border border-slate-700 bg-app px-3 py-2 text-white"
        />
      </div>
      <div>
        <p className="mb-1 text-sm text-slate-400">Montant mensuel (€)</p>
        <input
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-app px-3 py-2 text-white"
        />
      </div>
      <div>
        <p className="mb-1 text-sm text-slate-400">Jour préféré du mois (1-28)</p>
        <input
          type="number"
          min="1"
          max="28"
          value={day}
          onChange={(e) => setDay(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-app px-3 py-2 text-white"
        />
      </div>
      <div>
        <p className="mb-1 text-sm text-slate-400">Courtier</p>
        <select
          value={courtier}
          onChange={(e) => setCourtier(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-app px-3 py-2 text-white"
        >
          {COURTIERS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 rounded-lg border border-slate-700 py-2 text-slate-300">
          Annuler
        </button>
        <button type="submit" className="flex-1 rounded-lg bg-accent py-2 font-medium text-white">
          Ajouter
        </button>
      </div>
    </form>
  )
}

function MarketContextCard() {
  const [bullets, setBullets] = useState(null)
  const { askClaude, loading, error } = useClaudeAPI()

  async function fetchContext() {
    const result = await askClaude(MARKET_CONTEXT_SYSTEM_PROMPT, `Date du jour : ${new Date().toLocaleDateString('fr-FR')}`)
    if (result) setBullets(result.bullets)
  }

  return (
    <div className="mt-4 rounded-xl border border-accent/40 bg-card p-4">
      <p className="font-medium text-white">📅 Contexte marché aujourd'hui</p>
      {!bullets && (
        <button
          onClick={fetchContext}
          disabled={loading}
          className="mt-3 w-full rounded-lg border border-accent py-2 text-sm font-medium text-accent disabled:opacity-40"
        >
          {loading ? 'Chargement...' : 'Voir le contexte marché'}
        </button>
      )}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      {bullets && (
        <div className="mt-3 space-y-2 text-sm">
          <ul className="list-inside list-disc text-slate-300">
            {bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
          {/* This closing line is always appended here in code (not left
              to the AI) so it's guaranteed to appear exactly as required,
              regardless of what Claude replies. */}
          <p className="text-xs italic text-accent">
            Le DCA consiste à investir régulièrement sans essayer de timer le marché. Continuez votre plan.
          </p>
        </div>
      )}
    </div>
  )
}

function DcaHistoryChart({ log }) {
  const chartData = useMemo(() => {
    const byMonth = {}
    for (const entry of log) {
      byMonth[entry.month] = (byMonth[entry.month] ?? 0) + entry.amount
    }
    const months = Object.keys(byMonth).sort()
    let running = 0
    return months.map((month) => {
      running += byMonth[month]
      return { month, total: byMonth[month], cumulative: running }
    })
  }, [log])

  if (chartData.length === 0) return null

  return (
    <div className="mt-4 rounded-xl bg-card p-4">
      <p className="mb-3 text-sm text-slate-400">Historique des versements</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" tickFormatter={(v) => `${Math.round(v / 100) / 10}k`} />
            <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
            <Legend />
            <Bar dataKey="total" name="Versé ce mois" fill="#6366f1" />
            <Line type="monotone" dataKey="cumulative" name="Cumul" stroke="#4ade80" strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function AveragePriceTable({ trades }) {
  const averages = useMemo(() => {
    const byAsset = {}
    for (const t of trades) {
      if (t.type !== 'Achat') continue
      if (!byAsset[t.name]) byAsset[t.name] = []
      byAsset[t.name].push(t)
    }
    return Object.entries(byAsset).map(([name, list]) => ({ name, avgPrice: averagePurchasePrice(list) }))
  }, [trades])

  if (averages.length === 0) return null

  return (
    <div className="mt-4 rounded-xl bg-card p-4">
      <p className="mb-3 text-sm text-slate-400">Prix d'achat moyen (basé sur ton journal)</p>
      <div className="space-y-2 text-sm">
        {averages.map((a) => (
          <div key={a.name} className="flex justify-between">
            <span className="text-slate-300">{a.name}</span>
            <span className="text-white">{formatCurrencyPrecise(a.avgPrice)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// How many days until the next occurrence of "day" (1-28) in the current
// or next month. Returns 0 if it's today.
function daysUntilDay(day, today) {
  const target = new Date(today.getFullYear(), today.getMonth(), day)
  if (target < today) target.setMonth(target.getMonth() + 1)
  const diffMs = target.setHours(0, 0, 0, 0) - new Date(today).setHours(0, 0, 0, 0)
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)))
}

function computeNextDca(plans, log, today) {
  const monthKey = currentMonthKey(today)
  const pending = plans.filter((p) => !log.some((l) => l.planId === p.id && l.month === monthKey))
  if (pending.length === 0) return null

  let best = null
  for (const plan of pending) {
    const daysLeft = daysUntilDay(plan.day, today)
    if (!best || daysLeft < best.daysLeft) best = { asset: plan.asset, daysLeft }
  }
  return best
}
