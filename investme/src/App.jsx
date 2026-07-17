// The app's root layout: decides which page to show based on the URL
// (via react-router-dom's <Routes>), and wraps every page with the
// shared bottom navigation, install banner and legal footer.
import { Routes, Route } from 'react-router-dom'
import BottomNav from './components/BottomNav.jsx'
import Footer from './components/Footer.jsx'
import InstallBanner from './components/InstallBanner.jsx'
import Profil from './pages/Profil.jsx'
import Simulateur from './pages/Simulateur.jsx'
import ComparateurETF from './pages/ComparateurETF.jsx'
import Journal from './pages/Journal.jsx'
import DCA from './pages/DCA.jsx'

export default function App() {
  return (
    // mx-auto + max-w-md keeps the app centered and phone-width even on
    // a big desktop screen, matching the "mobile-first, scales up" spec.
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-app">
      <main className="flex-1 pb-20">
        <Routes>
          <Route path="/" element={<Profil />} />
          <Route path="/simulateur" element={<Simulateur />} />
          <Route path="/comparateur" element={<ComparateurETF />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/dca" element={<DCA />} />
        </Routes>
      </main>
      <Footer />
      <InstallBanner />
      <BottomNav />
    </div>
  )
}
