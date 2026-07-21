// Nudges the user once a year to redo the Module 1 onboarding quiz.
// Same pattern as useRebalanceReminder.js, but on a much longer interval:
// life circumstances (income, goals, risk tolerance) change slowly, so a
// profile set up years ago may no longer reflect who the user is today.
import { useEffect } from 'react'

const CHECK_INTERVAL_DAYS = 365
const LAST_CHECK_KEY = 'investme_profile_review_last_check'

function daysBetween(fromISO, toDate) {
  const from = new Date(fromISO)
  return Math.floor((toDate - from) / (1000 * 60 * 60 * 24))
}

export function useProfileReviewReminder() {
  useEffect(() => {
    let profile
    try {
      profile = JSON.parse(localStorage.getItem('investme_profile') || 'null')
    } catch {
      return
    }
    if (!profile) return

    const today = new Date()
    const lastCheck = localStorage.getItem(LAST_CHECK_KEY)

    // First time we ever see this profile: start the clock from when it
    // was created, not from today, so the reminder actually lands ~1
    // year after the quiz was taken rather than 1 year after this code
    // shipped.
    if (!lastCheck) {
      localStorage.setItem(LAST_CHECK_KEY, profile.createdAt ?? today.toISOString())
      return
    }

    if (daysBetween(lastCheck, today) < CHECK_INTERVAL_DAYS) return
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return

    new Notification('InvestMe - Ça fait un an !', {
      body: "Ta situation a peut-être changé. Prends 2 minutes pour refaire le questionnaire de profil et vérifier que la répartition recommandée te correspond toujours.",
      icon: '/icons/icon-192.png',
    })
    localStorage.setItem(LAST_CHECK_KEY, today.toISOString())
  }, [])
}
