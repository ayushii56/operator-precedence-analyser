import { useState } from 'react'

function relBadge(rel) {
  switch (rel) {
    case '<':  return { bg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25',  label: '<' }
    case '>':  return { bg: 'bg-rose-500/15 text-rose-300 border-rose-500/25',   label: '>' }
    case '=':  return { bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25', label: '=' }
    default:   return { bg: 'bg-gray-500/10 text-gray-500 border-gray-500/20',  label: rel || '—' }
  }
}

function actionStyle(action) {
  if (action.includes('Shift'))                           return 'bg-cyan-500/15 text-cyan-200 border border-cyan-500/25'
  if (action.includes('Reduce'))                          return 'bg-amber-500/15 text-amber-200 border border-amber-500/25'
  if (action.includes('ACCEPT') || action.includes('✓')) return 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 font-bold'
  if (action.includes('REJECT') || action.includes('ERROR') || action.includes('ERR'))
    return 'bg-rose-500/15 text-rose-200 border border-rose-500/25'
  return 'text-gray-400'
}

function rowBg(action, idx) {
  if (action.includes('ACCEPT') || action.includes('✓')) return 'bg-emerald-500/[0.06]'
  if (action.includes('REJECT') || action.includes('ERROR')) return 'bg-rose-500/[0.06]'
  return idx % 2 === 0 ? 'bg-white/[0.015]' : ''
}

export default function ParsingSteps({ steps }) {
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all'
    ? steps
    : steps.filter(s => {
        if (filter === 'shift')  return s.action.includes('Shift')
        if (filter === 'reduce') return s.action.includes('Reduce')
        return false
      })

  const shiftCount  = steps.filter(s => s.action.includes('Shift')).length
  const reduceCount = steps.filter(s => s.action.includes('Reduce')).length

  return (
    <div className="glass rounded-2xl overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-5 border-b border-white/[0.07] flex flex-wrap items-center gap-3">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <span className="text-cyan-400">▶</span>
          Parsing Steps
        </h2>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-gray-400 text-xs">
            {steps.length} total
          </span>
          <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-xs border border-cyan-500/20">
            {shiftCount} shifts
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs border border-amber-500/20">
            {reduceCount} reduces
          </span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="px-5 py-2.5 border-b border-white/[0.05] flex gap-2">
        {[
          { key: 'all',    label: 'All Steps' },
          { key: 'shift',  label: 'Shifts only' },
          { key: 'reduce', label: 'Reduces only' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              filter === f.key
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.05]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-auto max-h-[520px]">
        <table className="w-full text-sm border-collapse min-w-[640px]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#0a0f1e] border-b border-white/[0.08]">
              {['#', 'Stack', 'Input', 'Rel', 'Action'].map(h => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((step, i) => {
              const { bg: relBg, label: relLabel } = relBadge(step.relation)
              return (
                <tr
                  key={i}
                  className={`border-b border-white/[0.04] transition-colors hover:bg-white/[0.04] cursor-default
                    ${rowBg(step.action, i)}`}
                >
                  <td className="px-4 py-2.5 text-gray-600 text-xs font-mono">{i + 1}</td>
                  <td className="px-4 py-2.5 font-mono text-violet-300 text-sm whitespace-nowrap">
                    {step.stack}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-yellow-300 text-sm whitespace-nowrap">
                    {step.input}
                  </td>
                  <td className="px-4 py-2.5">
                    {step.relation ? (
                      <span className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold border ${relBg}`}>
                        {relLabel}
                      </span>
                    ) : (
                      <span className="text-gray-700">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${actionStyle(step.action)}`}>
                      {step.action}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-600 text-sm">No steps match filter</div>
        )}
      </div>
    </div>
  )
}
