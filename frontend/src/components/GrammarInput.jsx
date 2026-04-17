const EXAMPLES = [
  { label: 'Arithmetic', grammar: 'E->E+E\nE->E*E\nE->i' },
  { label: 'Brackets', grammar: 'E->E+E\nE->E*E\nE->(E)\nE->i' },
  { label: 'Multi-level', grammar: 'E->E+T\nE->T\nT->T*F\nT->F\nF->i\nF->(E)' },
]

export default function GrammarInput({
  grammar, setGrammar,
  inputString, setInputString,
  onProcessGrammar, onParseString,
  loading, grammarReady,
}) {
  return (
    <div className="space-y-4">

      {/* ── Grammar panel ─────────────────────────────────────────── */}
      <div className="glass p-5 rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
            Grammar Input
          </h2>
          <span className="text-[10px] text-gray-600 font-mono">
            No hardcoded grammar
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-3 leading-relaxed">
          One production per line · Use <code className="text-violet-400">-&gt;</code> separator ·
          Use <code className="text-violet-400">|</code> for alternatives
        </p>

        {/* Textarea */}
        <textarea
          id="grammar-input"
          value={grammar}
          onChange={e => setGrammar(e.target.value)}
          rows={7}
          className="input-field resize-none text-green-300 placeholder-gray-700 leading-relaxed"
          placeholder={'E->E+E\nE->E*E\nE->i'}
          spellCheck={false}
        />

        {/* Example buttons */}
        <div className="mt-2.5 flex flex-wrap gap-2 items-center">
          <span className="text-[11px] text-gray-600">Quick load:</span>
          {EXAMPLES.map(ex => (
            <button
              key={ex.label}
              onClick={() => setGrammar(ex.grammar)}
              className="px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20
                         text-violet-400 text-xs hover:bg-violet-500/20 hover:border-violet-500/40
                         transition-all duration-150"
            >
              {ex.label}
            </button>
          ))}
        </div>

        {/* Process button */}
        <button
          id="btn-process-grammar"
          onClick={onProcessGrammar}
          disabled={loading || !grammar.trim()}
          className="btn btn-violet w-full mt-4"
        >
          {loading
            ? <><span className="spinner" /> Processing…</>
            : <>⚡ Process Grammar</>
          }
        </button>
      </div>

      {/* ── String panel ──────────────────────────────────────────── */}
      <div className={`glass p-5 rounded-2xl transition-all duration-300 ${grammarReady ? 'border-cyan-500/25 bg-cyan-500/[0.03]' : 'opacity-55'
        }`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full inline-block ${grammarReady ? 'bg-cyan-400' : 'bg-gray-600'}`} />
            String Input
          </h2>
          {!grammarReady && (
            <span className="text-[11px] text-gray-600">Process grammar first</span>
          )}
        </div>

        <input
          id="string-input"
          value={inputString}
          onChange={e => setInputString(e.target.value)}
          disabled={!grammarReady}
          placeholder="e.g.  i+i*i"
          className={`input-field ${grammarReady
              ? 'text-cyan-300 focus:border-cyan-500/60 focus:shadow-[0_0_0_3px_rgba(8,145,178,0.15)]'
              : 'text-gray-600 cursor-not-allowed'
            }`}
          spellCheck={false}
          onKeyDown={e => { if (e.key === 'Enter' && grammarReady && !loading) onParseString() }}
        />
        <p className="text-[10px] text-gray-600 mt-1.5">
          Space-separate tokens for multi-char symbols · Press Enter to parse
        </p>

        <button
          id="btn-parse-string"
          onClick={onParseString}
          disabled={loading || !grammarReady || !inputString.trim()}
          className="btn btn-cyan w-full mt-4"
        >
          {loading
            ? <><span className="spinner" /> Parsing…</>
            : <>▶ Parse String</>
          }
        </button>
      </div>

    </div>
  )
}
