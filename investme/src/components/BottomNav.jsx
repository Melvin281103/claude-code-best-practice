// The bottom tab bar: the app's main navigation, fixed to the bottom of
// the screen like most mobile apps (Instagram, banking apps, etc).
// NavLink from react-router-dom automatically knows which tab is
// "active" based on the current URL, so we can style it differently.
import { NavLink } from 'react-router-dom'

// One entry per tab: the emoji icon, the French label, and the route path.
const TABS = [
  { to: '/', label: 'Mon Profil', icon: '👤' },
  { to: '/simulateur', label: 'Simulateur', icon: '📊' },
  { to: '/comparateur', label: 'Comparateur', icon: '🔍' },
  { to: '/journal', label: 'Journal', icon: '📓' },
  { to: '/dca', label: 'DCA', icon: '🔔' },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 flex border-t border-slate-800 bg-card"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${
              isActive ? 'text-accent' : 'text-slate-400'
            }`
          }
        >
          <span className="text-xl leading-none">{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
