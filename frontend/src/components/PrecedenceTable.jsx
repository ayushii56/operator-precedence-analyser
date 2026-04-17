function relStyle(rel) {
  switch (rel) {
    case '<': return { text: 'text-cyan-400',   bg: 'bg-cyan-500/10'   }
    case '>': return { text: 'text-rose-400',   bg: 'bg-rose-500/10'   }
    case '=': return { text: 'text-emerald-400', bg: 'bg-emerald-500/10' }
    default:  return { text: 'text-gray-700',   bg: ''                 }
  }
}

export default function PrecedenceTable({ table, headers }) {
  return (
    <div className="glass p-5 rounded-2xl animate-fade-in">
      <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
        <span className="text-amber-400 text-base">⊞</span>
        Operator Precedence Table
      </h2>

      <div className="overflow-x-auto rounded-xl border border-white/[0.07]">
        <table className="w-full text-sm border-collapse min-w-max">
          <thead>
            <tr className="bg-black/30">
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 border-b border-r border-white/[0.07] sticky left-0 bg-black/40">
                ↓ \ →
              </th>
              {headers.map(h => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-center font-mono text-violet-300 font-bold border-b border-white/[0.07] text-sm"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {headers.map((row, ri) => (
              <tr
                key={row}
                className={`border-b border-white/[0.05] transition-colors hover:bg-white/[0.03]
                  ${ri % 2 === 0 ? 'bg-white/[0.015]' : ''}`}
              >
                {/* Row header */}
                <td className="px-4 py-2.5 font-mono text-violet-300 font-bold text-sm border-r border-white/[0.07] sticky left-0 bg-[#050a14]">
                  {row}
                </td>

                {headers.map(col => {
                  const rel = table[row]?.[col] ?? null
                  const { text, bg } = relStyle(rel)
                  return (
                    <td key={col} className={`px-4 py-2.5 text-center ${bg}`}>
                      {rel ? (
                        <span className={`font-mono font-bold text-lg ${text}`}>
                          {rel}
                        </span>
                      ) : (
                        <span className="text-gray-800 text-base font-mono">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-3.5 flex flex-wrap gap-4 text-xs">
        {[
          { rel: '<', label: 'Less precedence  (Shift)',  cls: 'text-cyan-400'   },
          { rel: '>',  label: 'More precedence (Reduce)', cls: 'text-rose-400'   },
          { rel: '=',  label: 'Equal / Match',            cls: 'text-emerald-400' },
        ].map(({ rel, label, cls }) => (
          <div key={rel} className="flex items-center gap-1.5">
            <span className={`font-mono font-bold ${cls}`}>{rel}</span>
            <span className="text-gray-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
