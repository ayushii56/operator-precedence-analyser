import { useEffect, useState } from 'react'

export default function ResultBanner({ accepted }) {
  const [visible, setVisible] = useState(false)

  // Re-trigger animation whenever accepted changes
  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [accepted])

  if (accepted === undefined || accepted === null) return null

  const isAccepted = !!accepted

  return (
    <div
      className={`
        rounded-2xl p-7 flex flex-col items-center justify-center text-center
        transition-all duration-500 ease-out
        ${visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-3'}
        ${isAccepted
          ? 'border-2 border-emerald-500/40 bg-emerald-500/[0.07] pulse-green'
          : 'border-2 border-rose-500/40 bg-rose-500/[0.07] pulse-red'
        }
      `}
    >
      {/* Icon */}
      <div className={`text-6xl mb-3 ${isAccepted ? 'animate-bounce' : ''}`}>
        {isAccepted ? '✅' : '❌'}
      </div>

      {/* Main verdict */}
      <h2
        className={`text-3xl font-extrabold tracking-wide mb-1 ${
          isAccepted ? 'text-emerald-400' : 'text-rose-400'
        }`}
      >
        {isAccepted ? 'GRAMMAR ACCEPTED' : 'GRAMMAR NOT ACCEPTED'}
      </h2>

      {/* Sub-text */}
      <p className={`text-sm font-medium ${isAccepted ? 'text-emerald-400/60' : 'text-rose-400/60'}`}>
        {isAccepted
          ? 'String was successfully parsed by the operator precedence grammar.'
          : 'String was rejected — it does not conform to the provided grammar.'}
      </p>

      {/* Decorative bars */}
      <div className="mt-5 flex gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-700 ${
              isAccepted ? 'bg-emerald-500/50' : 'bg-rose-500/50'
            }`}
            style={{
              width:            `${8 + (i % 3) * 4}px`,
              transitionDelay:  `${i * 60}ms`,
              opacity:          visible ? 1 : 0,
              transform:        visible ? 'scaleY(1)' : 'scaleY(0)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
