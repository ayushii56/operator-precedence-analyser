function SetCard({ title, colorClass, sets }) {
  return (
    <div>
      <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${colorClass}`}>
        <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold
          bg-current/20`} style={{ color: 'inherit' }}>
          {title[0]}
        </span>
        {title}
      </h3>
      <div className="space-y-2">
        {Object.entries(sets).map(([nt, terminals]) => (
          <div
            key={nt}
            className="flex items-start gap-2 p-3 rounded-xl bg-black/20 border border-white/[0.06]
                       hover:bg-black/30 transition-colors"
          >
            <span className="font-mono text-violet-400 font-bold text-sm min-w-[1.5rem] pt-0.5">
              {nt}
            </span>
            <span className="text-gray-500 text-sm pt-0.5">→</span>
            <div className="flex flex-wrap gap-1.5">
              {terminals.length === 0 ? (
                <span className="text-gray-600 text-xs italic">∅</span>
              ) : (
                terminals.map(t => (
                  <span
                    key={t}
                    className={`px-2 py-0.5 rounded-md text-xs font-mono font-semibold
                      ${colorClass === 'text-cyan-400'
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/20'
                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
                      }`}
                  >
                    {t}
                  </span>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function VTSetsPanel({ firstvt, lastvt }) {
  return (
    <div className="glass p-5 rounded-2xl animate-fade-in">
      <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
        <span className="text-violet-400 text-base">∑</span>
        FirstVT &amp; LastVT Sets
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SetCard title="FirstVT" colorClass="text-cyan-400"  sets={firstvt} />
        <SetCard title="LastVT"  colorClass="text-amber-400" sets={lastvt} />
      </div>
    </div>
  )
}
