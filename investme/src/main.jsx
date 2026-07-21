// Entry point of the app: this is the very first JS file that runs.
// It mounts the React app into the <div id="root"> from index.html,
// and registers the service worker that enables offline support.
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)

// Register the service worker (public/sw.js) so the app can cache
// pages/data and keep working when the phone loses connection.
// This only works in production-like contexts (not always in dev),
// so we just log a warning instead of crashing if it fails.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('InvestMe: le service worker ne s\'est pas enregistré', error)
    })
  })
}
