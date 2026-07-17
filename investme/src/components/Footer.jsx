// Legal footer shown at the bottom of EVERY page. This wording is
// required by the app spec: InvestMe must never look like it's giving
// regulated financial advice (AMF = the French financial regulator).
export default function Footer() {
  return (
    <footer className="px-4 py-4 text-center text-xs text-slate-500 border-t border-slate-800">
      InvestMe est un outil personnel d'aide à la décision. Il ne constitue
      pas un conseil en investissement au sens de la réglementation AMF.
    </footer>
  )
}
