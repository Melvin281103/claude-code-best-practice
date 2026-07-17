// A React hook that works exactly like useState, except the value is
// also saved in the browser's localStorage under the given "key".
// This is how InvestMe remembers your data (profile, trades, DCA plan...)
// between visits, with no backend/server involved.
import { useState, useEffect } from 'react'

export function useLocalStorage(key, initialValue) {
  // Read the saved value once, when the component first renders.
  const [value, setValue] = useState(() => {
    try {
      const saved = window.localStorage.getItem(key)
      // If nothing was saved yet, fall back to the initial value.
      return saved !== null ? JSON.parse(saved) : initialValue
    } catch (error) {
      // If the saved data is corrupted/unreadable, don't crash the app -
      // just start fresh with the initial value.
      console.warn(`InvestMe: could not read "${key}" from localStorage`, error)
      return initialValue
    }
  })

  // Every time "value" changes, save it back to localStorage.
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn(`InvestMe: could not save "${key}" to localStorage`, error)
    }
  }, [key, value])

  // Return it exactly like useState: [currentValue, setterFunction]
  return [value, setValue]
}
