// Wraps a piece of jargon (TER, PEA, DCA...) with a dotted underline;
// tapping it opens a small bottom-sheet with a plain-language definition
// from data/glossary.js. Built for a complete beginner who shouldn't have
// to leave the app to understand a badge.
import { useState } from 'react'
import { GLOSSARY } from '../data/glossary'

export default function GlossaryTerm({ term, children }) {
  const [open, setOpen] = useState(false)
  const definition = GLOSSARY[term]

  // If a term isn't in the glossary yet, just render it as plain text
  // instead of a dead/confusing button.
  if (!definition) return <>{children ?? term}</>

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
        className="underline decoration-dotted decoration-slate-500 underline-offset-2"
      >
        {children ?? term}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
          onClick={(e) => {
            e.stopPropagation()
            setOpen(false)
          }}
        >
          <div className="w-full max-w-md rounded-t-xl bg-card p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-white">{term}</h3>
            <p className="mt-2 text-sm text-slate-300">{definition}</p>
            <button onClick={() => setOpen(false)} className="mt-4 w-full rounded-lg bg-accent py-2 font-medium text-white">
              Compris
            </button>
          </div>
        </div>
      )}
    </>
  )
}
