// Nudges the user every ~3 months to go check whether their real
// portfolio split has drifted from their target allocation (Journal
// already shows the comparison - see AllocationCheckCard - but that only
// appears when they happen to log a trade). Markets move on their own,
// so this fires independently of any trading activity, reusing the same
// browser notification permission as the DCA reminders.
import { useEffect } from 'react'

const CHECK_INTERVAL_DAYS = 90
const LAST_CHECK_KEY = 'investme_rebalance_last_check'

function daysBetween(fromISO, toDate) {
  const from = new Date(fromISO)
  return Math.floor((toDate - from) / (1000 * 60 * 60 * 24))
}

export function useRebalanceReminder() {
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
    // was created, so a brand-new user isn't immediately nagged.
    if (!lastCheck) {
      localStorage.setItem(LAST_CHECK_KEY, profile.createdAt ?? today.toISOString())
      return
    }

    if (daysBetween(lastCheck, today) < CHECK_INTERVAL_DAYS) return
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return

    // Only push the due date forward once the reminder actually fired -
    // if notifications aren't enabled yet, it stays "due" so enabling
    // them later fires the overdue reminder right away instead of
    // silently waiting out another 3 months.
    new Notification('InvestMe - Vérifie ta répartition', {
      body: "Ça fait 3 mois : va jeter un œil à ton Journal pour voir si ta répartition a dérivé de ta cible.",
      icon: '/icons/icon-192.png',
    })
    localStorage.setItem(LAST_CHECK_KEY, today.toISOString())
  }, [])
}
