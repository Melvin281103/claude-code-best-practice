// Red warning box, required by the app spec on the Simulateur, Journal
// and DCA pages. Accepts an optional custom "message" - if none is given,
// it falls back to the general AMF disclaimer text.
const DEFAULT_MESSAGE =
  "Ces informations sont fournies à titre informatif uniquement et ne constituent pas un conseil en investissement au sens de la réglementation AMF. Les performances passées ne garantissent pas les performances futures."

export default function Disclaimer({ message }) {
  return (
    <div className="rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
      {message ?? DEFAULT_MESSAGE}
    </div>
  )
}
