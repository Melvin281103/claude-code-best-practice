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

// Colors for the 3 slices of the allocation donut chart.
const SLICE_COLORS = { etf: '#6366f1', actions: '#22c55e', crypto: '#f59e0b' }

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

export default function Profil() {
  const [profile, setProfile] = useLocalStorage('investme_profile', null)
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
        onFinish={() => setProfile(answers)}
      />
    )
  }

  // Saved profile exists -> show the result screen.
  return (
    <ProfileResult
      profile={profile}
      onReset={() => {
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
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-accent' : 'bg-slate-700'}`} />
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
              className="w-full rounded-lg border border-slate-700 bg-card px-4 py-3 text-lg text-white"
            />
            <p className="mt-2 text-sm text-slate-400">
              Idéalement 3-6 mois de dépenses. Ne touche pas à ça.
            </p>
          </Question>
        )}

        {step === 1 && (
          <Question title="Tu peux investir combien par mois ?">
            <p className="mb-4 text-center text-3xl font-bold text-accent">{answers.monthly} €</p>
            <input
              type="range"
              min="50"
              max="2000"
              step="50"
              value={answers.monthly}
              onChange={(e) => setAnswers({ ...answers, monthly: Number(e.target.value) })}
              className="w-full accent-accent"
            />
            <div className="mt-1 flex justify-between text-xs text-slate-500">
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
            <p className="mb-4 text-center text-3xl font-bold text-accent">{answers.years} ans</p>
            <input
              type="range"
              min="1"
              max="30"
              value={answers.years}
              onChange={(e) => setAnswers({ ...answers, years: Number(e.target.value) })}
              className="w-full accent-accent"
            />
            <div className="mt-1 flex justify-between text-xs text-slate-500">
              <span>1 an</span>
              <span>30 ans</span>
            </div>
          </Question>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="rounded-lg border border-slate-700 px-4 py-3 text-slate-300"
          >
            Retour
          </button>
        )}
        <button
          onClick={next}
          disabled={!canGoNext}
          className="flex-1 rounded-lg bg-accent py-3 font-medium text-white disabled:opacity-40"
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
      <h1 className="mb-6 text-xl font-semibold text-white">{title}</h1>
      {children}
    </div>
  )
}

function ChoiceButton({ selected, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-4 py-3 text-left ${
        selected ? 'border-accent bg-accent/10 text-white' : 'border-slate-700 text-slate-300'
      }`}
    >
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------
// Result screen: shown once the profile is saved.
// ---------------------------------------------------------------------
function ProfileResult({ profile, onReset }) {
  const navigate = useNavigate()
  const [showLepInfo, setShowLepInfo] = useState(false)
  const result = getInvestorProfile(profile.crashScore, profile.years)

  const chartData = [
    { name: 'ETF', key: 'etf', value: result.allocation.etf },
    { name: 'Actions', key: 'actions', value: result.allocation.actions },
    { name: 'Crypto', key: 'crypto', value: result.allocation.crypto },
  ]

  return (
    <div className="px-4 py-6">
      <p className="text-sm text-slate-400">Ton profil</p>
      <h1 className="mb-4 text-2xl font-bold text-white">Investisseur {result.name}</h1>

      <div className="rounded-xl bg-card p-4">
        <p className="mb-2 text-center text-sm text-slate-400">Répartition recommandée</p>
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

      <div className="mt-4">
        <DailyTipCard profile={profile} />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <a
          href="https://traderepublic.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-card p-4 text-left"
        >
          <p className="font-medium text-white">Ouvre un PEA chez Trade Republic</p>
          <p className="mt-1 text-sm text-slate-400">Un compte simple pour débuter sur les ETF et actions →</p>
        </a>

        <button onClick={() => setShowLepInfo(true)} className="rounded-lg bg-card p-4 text-left">
          <p className="font-medium text-white">Garde ton LEP plein en priorité</p>
          <p className="mt-1 text-sm text-slate-400">Pourquoi c'est important avant d'investir →</p>
        </button>

        <button onClick={() => navigate('/comparateur')} className="rounded-lg bg-card p-4 text-left">
          <p className="font-medium text-white">Commence par 1 ETF World</p>
          <p className="mt-1 text-sm text-slate-400">Compare les ETF disponibles →</p>
        </button>
      </div>

      <button onClick={onReset} className="mt-6 w-full rounded-lg border border-slate-700 py-3 text-slate-300">
        Modifier mon profil
      </button>

      <div className="mt-4">
        <DataBackup />
      </div>

      {showLepInfo && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60" onClick={() => setShowLepInfo(false)}>
          <div className="w-full max-w-md rounded-t-xl bg-card p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-2 text-lg font-semibold text-white">Le LEP, c'est quoi ?</h2>
            <p className="text-sm text-slate-300">
              Le Livret d'Épargne Populaire est un livret réglementé au taux avantageux, réservé
              aux revenus modestes. Avant de placer de l'argent sur les marchés, il est
              généralement recommandé de d'abord remplir son épargne de précaution (livrets
              disponibles à tout moment), car les marchés peuvent baisser au mauvais moment.
            </p>
            <button
              onClick={() => setShowLepInfo(false)}
              className="mt-4 w-full rounded-lg bg-accent py-2 font-medium text-white"
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
