// A React hook for calling the Claude API (Anthropic) from the browser.
// InvestMe has NO backend server, so this hook talks to Claude directly
// from the user's browser using their own API key stored in .env.
//
// IMPORTANT (beginner note): calling an API directly from the browser
// means your API key is visible in network requests made by your own
// browser. That's fine for a personal, local-only tool like this one,
// but you would never do this in a real multi-user product - there,
// the API call should go through a backend server that keeps the key
// secret.
import { useState } from 'react'

// Anthropic requires this exact model id per the InvestMe tech stack.
const MODEL = 'claude-sonnet-4-6'
const API_URL = 'https://api.anthropic.com/v1/messages'

export function useClaudeAPI() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Call Claude with a system prompt (instructions) and a user prompt
  // (the actual question/data). Returns the parsed JSON object Claude
  // replied with, or null if something went wrong.
  async function askClaude(systemPrompt, userPrompt) {
    const apiKey = import.meta.env.VITE_ANTHROPIC_KEY

    if (!apiKey) {
      console.warn(
        'InvestMe: VITE_ANTHROPIC_KEY is missing. AI features are disabled.\n' +
          'Get a free key at https://console.anthropic.com/ and add it to your .env file.'
      )
      setError('Clé API Claude manquante. Voir le README pour la configurer.')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          // Required to call the Anthropic API straight from a browser
          // instead of a backend server.
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      })

      if (!response.ok) {
        // Anthropic sends back a JSON body describing exactly what went
        // wrong (e.g. "Your credit balance is too low..."). Surface that
        // real message instead of just the HTTP status number, since the
        // status alone isn't enough to know what to fix.
        let detail = `statut ${response.status}`
        try {
          const errorBody = await response.json()
          if (errorBody?.error?.message) detail = errorBody.error.message
        } catch {
          // Response body wasn't JSON - stick with the status code above.
        }
        throw new Error(`Claude API : ${detail}`)
      }

      const data = await response.json()
      const textReply = data.content?.[0]?.text ?? ''

      // Claude is asked to reply with ONLY a JSON object, but we extract
      // the {...} portion defensively in case it adds any extra text.
      const jsonMatch = textReply.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Réponse de Claude illisible (pas de JSON trouvé)')
      }

      return JSON.parse(jsonMatch[0])
    } catch (err) {
      console.error('InvestMe: erreur en appelant Claude API', err)
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { askClaude, loading, error }
}
