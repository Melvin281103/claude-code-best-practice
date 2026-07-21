// "Conseil du jour" card on the Profil result screen.
// Two layers, so it stays useful even without an API key:
// 1. A free tip picked deterministically from DAILY_TIPS based on today's
//    date - changes every day, costs nothing, works offline.
// 2. An optional AI-personalized recommendation (Claude), fetched once
//    per day and cached in localStorage so repeat visits the same day
//    don't burn API credits.
import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useClaudeAPI } from '../hooks/useClaudeAPI'
import { DAILY_TIPS } from '../data/dailyTips'
import { getTipOfTheDay } from '../utils/calculations'
import { todayISO } from '../utils/formatters'

const AI_TIP_SYSTEM_PROMPT = `Tu es un assistant pédagogique pour un investisseur débutant long terme (ETF, actions, crypto).
On te donne son profil (répartition recommandée, horizon, objectif) et son historique de trades au format JSON.
Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, avec exactement ces clés :
{
  "categorie": "courte étiquette, ex: Diversification, Discipline, Fiscalité",
  "recommandation": "1 à 2 phrases de conseil personnalisé pour aujourd'hui, basé sur ses données",
  "disclaimer": "Cette recommandation est informative et générée par IA, elle ne constitue pas un conseil en investissement au sens de la réglementation AMF."
}
Ne recommande jamais explicitement d'acheter ou de vendre un actif précis. Base-toi uniquement sur les données fournies.`

export default function DailyTipCard({ profile }) {
  const [trades] = useLocalStorage('investme_trades', [])
  // One cached AI tip per calendar day: { "2026-07-21": {...}, ... }
  const [aiTipsByDay, setAiTipsByDay] = useLocalStorage('investme_ai_daily_tips', {})
  const { askClaude, loading, error } = useClaudeAPI()

  const today = todayISO()
  const freeTip = getTipOfTheDay(DAILY_TIPS, new Date())
  const cachedAiTip = aiTipsByDay[today]

  async function fetchAiTip() {
    const payload = { profile, trades }
    const result = await askClaude(AI_TIP_SYSTEM_PROMPT, JSON.stringify(payload))
    if (result) setAiTipsByDay({ ...aiTipsByDay, [today]: result })
  }

  return (
    <div className="rounded-xl bg-card p-4">
      <p className="mb-2 text-sm text-slate-400">📅 Conseil du jour</p>

      <span className="inline-block rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent">
        {freeTip.category}
      </span>
      <p className="mt-2 text-sm text-slate-200">{freeTip.text}</p>

      <div className="mt-3 border-t border-slate-700 pt-3">
        {!cachedAiTip && (
          <button
            onClick={fetchAiTip}
            disabled={loading}
            className="w-full rounded-lg border border-accent py-2 text-sm font-medium text-accent disabled:opacity-40"
          >
            {loading ? 'Analyse en cours...' : '✨ Recommandation IA personnalisée du jour'}
          </button>
        )}

        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

        {cachedAiTip && (
          <div className="text-sm">
            <span className="inline-block rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
              {cachedAiTip.categorie}
            </span>
            <p className="mt-2 text-slate-200">{cachedAiTip.recommandation}</p>
            <p className="mt-2 text-xs italic text-slate-500">{cachedAiTip.disclaimer}</p>
          </div>
        )}
      </div>
    </div>
  )
}
