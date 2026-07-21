// MODULE 1 - Mon Profil Investisseur.
// First visit: a 5-question, one-screen-at-a-time onboarding quiz.
// After that: a result screen with the recommended allocation, read
// from localStorage so the user never has to redo the quiz.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { getInvestorProfile } from '../utils/calculations'
import DailyTipCard from '../components/DailyTipCard.jsx'
import DataBackup from '../components/DataBackup.jsx'
import DashboardSummary from '../components/DashboardSummary.jsx'
import RiskBadge from '../components/RiskBadge.jsx'
import AllocationCalculator from '../components/AllocationCalculator.jsx'
import GoalProgress from '../components/GoalProgress.jsx'

// Colors for the 3 slices of the allocation donut chart - Sentier/Glacier/Ambre,
// the same 3 accents used across the whole app (never Grenat, reserved for losses).
const SLICE_COLORS = { etf: '#4C9A6A', actions: '#3E7CA6', crypto: '#D99A3E' }

const CRASH_CHOICES = [
  { label: 'Je panique et je vends', score: 1 },
  { label: 'Je stresse mais j\'attends', score: 2 },
  { label: 'J\'en rachète, c\'est une opportunité', score: 3 },
]

const GOAL_CHOICES = ['Liberté financière', 'Achat immobilier', 'Retraite', 'Juste faire fructifier']

const DEFAULT_ANSWERS = {
  savings: '',
  monthly: 150,
  crashScore: null,
  goal: null,
  years: 10,
}

// Max number of past profiles to keep - old enough entries just aren't
// useful anymore, and this keeps localStorage bounded.
const MAX_PROFILE_HISTORY = 10

export default function Profil() {
  const [profile, setProfile] = useLocalStorage('investme_profile', null)
  const [history, setHistory] = useLocalStorage('investme_profile_history', [])
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState(DEFAULT_ANSWERS)

  // No saved profile yet -> run the onboarding quiz.
  if (!profile) {
    return (
      <Onboarding
        step={step}
        setStep={setStep}
        answers={answers}
        setAnswers={setAnswers}
        onFinish={() => setProfile({ ...answers, createdAt: new Date().toISOString() })}
      />
    )
  }

  // Saved profile exists -> show the result screen.
  return (
    <ProfileResult
      profile={profile}
      history={history}
      onReset={() => {
        // Snapshot the outgoing profile before it's replaced, so its
        // recommended allocation and answers aren't lost forever - just
        // no longer the active one.
        setHistory([{ ...profile, replacedAt: new Date().toISOString() }, ...history].slice(0, MAX_PROFILE_HISTORY))
        setAnswers(DEFAULT_ANSWERS)
        setStep(0)
        setProfile(null)
      }}
    />
  )
}

// ---------------------------------------------------------------------
// Onboarding quiz: renders exactly one question per screen, based on
// the "step" number (0 to 4).
// ---------------------------------------------------------------------
function Onboarding({ step, setStep, answers, setAnswers, onFinish }) {
  const totalSteps = 5
  const canGoNext =
    (step === 0 && answers.savings !== '' && Number(answers.savings) >= 0) ||
    (step === 1 && answers.monthly > 0) ||
    (step === 2 && answers.crashScore !== null) ||
    (step === 3 && answers.goal !== null) ||
    (step === 4 && answers.years > 0)

  function next() {
    if (step === totalSteps - 1) {
      onFinish()
    } else {
      setStep(step + 1)
    }
  }

  return (
    <div className="flex min-h-[80vh] flex-col px-4 py-6">
      {/* Shown only on the first question, so someone reopening the app
          after clearing their browser can restore instead of redoing
          the whole quiz. */}
      {step === 0 && (
        <div className="mb-6">
          <DataBackup />
        </div>
      )}

      {/* Progress dots so the user knows how many questions are left */}
      <div className="mb-6 flex gap-1.5">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-accent' : 'bg-brume/20'}`} />
        ))}
      </div>

      <div className="flex-1">
        {step === 0 && (
          <Question title="Tu as combien d'épargne de précaution disponible ?">
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={answers.savings}
              onChange={(e) => setAnswers({ ...answers, savings: e.target.value })}
              placeholder="0"
              className="w-full rounded-lg border border-brume/30 bg-card px-4 py-3 font-display text-lg tabular-nums text-papier"
            />
            <p className="mt-2 text-sm text-brume">Idéalement 3-6 mois de dépenses. Ne touche pas à ça.</p>
          </Question>
        )}

        {step === 1 && (
          <Question title="Tu peux investir combien par mois ?">
            <p className="mb-4 text-center font-display text-3xl font-semibold tabular-nums text-accent">{answers.monthly} €</p>
            <input
              type="range"
              min="50"
              max="2000"
              step="50"
              value={answers.monthly}
              onChange={(e) => setAnswers({ ...answers, monthly: Number(e.target.value) })}
              className="w-full accent-accent"
            />
            <div className="mt-1 flex justify-between text-xs text-brume">
              <span>50 €</span>
              <span>2000 €</span>
            </div>
          </Question>
        )}

        {step === 2 && (
          <Question title="Si ton portefeuille perd 30 % en 3 mois, tu fais quoi ?">
            <div className="flex flex-col gap-3">
              {CRASH_CHOICES.map((choice) => (
                <ChoiceButton
                  key={choice.label}
                  selected={answers.crashScore === choice.score}
                  onClick={() => setAnswers({ ...answers, crashScore: choice.score })}
                >
                  {choice.label}
                </ChoiceButton>
              ))}
            </div>
          </Question>
        )}

        {step === 3 && (
          <Question title="Quel est ton objectif principal ?">
            <div className="flex flex-col gap-3">
              {GOAL_CHOICES.map((goal) => (
                <ChoiceButton
                  key={goal}
                  selected={answers.goal === goal}
                  onClick={() => setAnswers({ ...answers, goal })}
                >
                  {goal}
                </ChoiceButton>
              ))}
            </div>
          </Question>
        )}

        {step === 4 && (
          <Question title="Dans combien d'années tu pourrais avoir besoin de cet argent ?">
            <p className="mb-4 text-center font-display text-3xl font-semibold tabular-nums text-accent">{answers.years} ans</p>
            <input
              type="range"
              min="1"
              max="30"
              value={answers.years}
              onChange={(e) => setAnswers({ ...answers, years: Number(e.target.value) })}
              className="w-full accent-accent"
            />
            <div className="mt-1 flex justify-between text-xs text-brume">
              <span>1 an</span>
              <span>30 ans</span>
            </div>
          </Question>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="rounded-lg border border-brume/30 px-4 py-3 text-brume">
            Retour
          </button>
        )}
        <button
          onClick={next}
          disabled={!canGoNext}
          className="flex-1 rounded-lg bg-accent py-3 font-medium text-papier disabled:opacity-40"
        >
          {step === totalSteps - 1 ? 'Voir mon profil' : 'Suivant'}
        </button>
      </div>
    </div>
  )
}

function Question({ title, children }) {
  return (
    <div>
      <h1 className="mb-6 font-display text-xl font-semibold text-papier">{title}</h1>
      {children}
    </div>
  )
}

function ChoiceButton({ selected, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-4 py-3 text-left ${
        selected ? 'border-accent bg-accent/10 text-papier' : 'border-brume/30 text-brume'
      }`}
    >
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------
// Result screen: shown once the profile is saved.
// ---------------------------------------------------------------------
function ProfileResult({ profile, history, onReset }) {
  const navigate = useNavigate()
  const [showLepInfo, setShowLepInfo] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const result = getInvestorProfile(profile.crashScore, profile.years)

  const chartData = [
    { name: 'ETF', key: 'etf', value: result.allocation.etf },
    { name: 'Actions', key: 'actions', value: result.allocation.actions },
    { name: 'Crypto', key: 'crypto', value: result.allocation.crypto },
  ]

  return (
    <div className="px-4 py-6">
      <div className="flex items-start justify-between">
        <p className="text-sm text-brume">Ton profil</p>
        <button onClick={() => window.print()} className="print:hidden text-xs text-accent underline">
          🖨️ Exporter / imprimer
        </button>
      </div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-papier">Investisseur {result.name}</h1>
        <RiskBadge profileName={result.name} size="lg" />
      </div>

      <GoalProgress goal={profile.goal} />

      <DashboardSummary />

      {/* The trail: each card below is a waypoint, connected by a dashed
          line - recommended next steps laid out like a path, not a list. */}
      <TrailPath>
        <Waypoint>
          <div className="topo-texture rounded-xl bg-card p-4">
            <p className="mb-2 text-center text-sm text-brume">Répartition recommandée</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                    {chartData.map((entry) => (
                      <Cell key={entry.key} fill={SLICE_COLORS[entry.key]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} %`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Waypoint>

        <Waypoint>
          <AllocationCalculator allocation={result.allocation} defaultAmount={profile.monthly} />
        </Waypoint>

        <Waypoint>
          <DailyTipCard profile={profile} />
        </Waypoint>

        <Waypoint>
          <a
            href="https://traderepublic.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="topo-texture block rounded-lg bg-card p-4 text-left"
          >
            <p className="font-medium text-papier">Ouvre un PEA chez Trade Republic</p>
            <p className="mt-1 text-sm text-brume">Un compte simple pour débuter sur les ETF et actions →</p>
          </a>
        </Waypoint>

        <Waypoint>
          <button onClick={() => setShowLepInfo(true)} className="topo-texture w-full rounded-lg bg-card p-4 text-left">
            <p className="font-medium text-papier">Garde ton LEP plein en priorité</p>
            <p className="mt-1 text-sm text-brume">Pourquoi c'est important avant d'investir →</p>
          </button>
        </Waypoint>

        <Waypoint>
          <button onClick={() => navigate('/comparateur')} className="topo-texture w-full rounded-lg bg-card p-4 text-left">
            <p className="font-medium text-papier">Commence par 1 ETF World</p>
            <p className="mt-1 text-sm text-brume">Compare les ETF disponibles →</p>
          </button>
        </Waypoint>
      </TrailPath>

      <button
        onClick={() => setShowResetConfirm(true)}
        className="print:hidden mt-6 w-full rounded-lg border border-brume/30 py-3 text-brume"
      >
        Modifier mon profil
      </button>

      <div className="print:hidden mt-4">
        <DataBackup />
      </div>

      {history.length > 0 && <ProfileHistory history={history} />}

      {showResetConfirm && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60" onClick={() => setShowResetConfirm(false)}>
          <div className="w-full max-w-md rounded-t-xl bg-card p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-2 font-display text-lg font-semibold text-papier">Recommencer le questionnaire ?</h2>
            <p className="text-sm text-papier/80">
              Ça efface ton profil actuel (répartition recommandée, objectif) pour refaire les 5 questions depuis le
              début. Ton journal, ton plan DCA et ta watchlist ne sont pas touchés.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 rounded-lg border border-brume/30 py-2 font-medium text-brume"
              >
                Annuler
              </button>
              <button onClick={onReset} className="flex-1 rounded-lg bg-grenat py-2 font-medium text-papier">
                Oui, recommencer
              </button>
            </div>
          </div>
        </div>
      )}

      {showLepInfo && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60" onClick={() => setShowLepInfo(false)}>
          <div className="w-full max-w-md rounded-t-xl bg-card p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-2 font-display text-lg font-semibold text-papier">Le LEP, c'est quoi ?</h2>
            <p className="text-sm text-papier/80">
              Le Livret d'Épargne Populaire est un livret réglementé au taux avantageux, réservé
              aux revenus modestes. Avant de placer de l'argent sur les marchés, il est
              généralement recommandé de d'abord remplir son épargne de précaution (livrets
              disponibles à tout moment), car les marchés peuvent baisser au mauvais moment.
            </p>
            <button
              onClick={() => setShowLepInfo(false)}
              className="mt-4 w-full rounded-lg bg-accent py-2 font-medium text-papier"
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Collapsible list of past profiles, snapshotted right before each reset,
// so redoing the questionnaire doesn't erase how the recommendation
// evolved over time - useful context next time you wonder "wait, wasn't
// I Prudent before?".
function ProfileHistory({ history }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="print:hidden mt-4 rounded-xl bg-card p-4">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between text-left">
        <p className="text-sm text-brume">Historique de mes profils ({history.length})</p>
        <span className="text-brume">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-2 text-sm">
          {history.map((past, i) => {
            const pastResult = getInvestorProfile(past.crashScore, past.years)
            return (
              <div key={i} className="flex items-center justify-between rounded-lg bg-app px-3 py-2">
                <div>
                  <p className="text-papier">{pastResult.name}</p>
                  <p className="text-xs text-brume">
                    {pastResult.allocation.etf}/{pastResult.allocation.actions}/{pastResult.allocation.crypto} % ·
                    objectif : {past.goal}
                  </p>
                </div>
                <span className="text-xs text-brume">
                  jusqu'au {new Date(past.replacedAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Groups the recommendation cards into a "trail": a dashed vertical line
// with a small waypoint dot marking each stop, reinforcing the app's
// "long-term investing is a path, not a sprint" visual identity.
function TrailPath({ children }) {
  return <div className="space-y-4 border-l-2 border-dashed border-brume/25 pl-5">{children}</div>
}

function Waypoint({ children }) {
  return (
    <div className="relative">
      <span className="absolute -left-[1.65rem] top-4 h-2.5 w-2.5 rounded-full bg-accent ring-4 ring-app" />
      {children}
    </div>
  )
}
