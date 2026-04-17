import { useState, useCallback } from 'react'
import axios from 'axios'
import GrammarInput   from './components/GrammarInput'
import VTSetsPanel    from './components/VTSetsPanel'
import PrecedenceTable from './components/PrecedenceTable'
import ParsingSteps   from './components/ParsingSteps'
import GraphVisualization from './components/GraphVisualization'
import ResultBanner   from './components/ResultBanner'

// Vite proxy routes all API calls through localhost:3000 → 8000
const api = axios.create({ baseURL: '/' })

// ── Tabs definition ─────────────────────────────────────────────────── //
const TABS = [
  { id: 'analysis', label: 'Analysis',      icon: '⚡' },
  { id: 'steps',    label: 'Parsing Steps', icon: '📋' },
  { id: 'graph',    label: 'Parse Tree',    icon: '🌳' },
]

export default function App() {
  const [grammar,      setGrammar]      = useState('E->E+E\nE->E*E\nE->i')
  const [inputString,  setInputString]  = useState('i+i*i')
  const [grammarData,  setGrammarData]  = useState(null)   // from /process-grammar
  const [parseData,    setParseData]    = useState(null)   // from /parse-string
  const [grammarError, setGrammarError] = useState(null)   // red message
  const [loading,      setLoading]      = useState(false)
  const [activeTab,    setActiveTab]    = useState('analysis')

  // ── Process Grammar ──────────────────────────────────────────────── //
  const handleProcessGrammar = useCallback(async () => {
    setLoading(true)
    setGrammarError(null)
    setGrammarData(null)
    setParseData(null)

    try {
      const { data } = await api.post('/process-grammar', { grammar })

      if (!data.valid) {
        setGrammarError(data.error ?? 'Invalid grammar')
      } else {
        setGrammarData(data)
        setActiveTab('analysis')
      }
    } catch (err) {
      setGrammarError(
        err.response?.data?.detail ?? err.message ?? 'Server error'
      )
    } finally {
      setLoading(false)
    }
  }, [grammar])

  // ── Parse String ─────────────────────────────────────────────────── //
  const handleParseString = useCallback(async () => {
    if (!grammarData) return
    setLoading(true)
    setParseData(null)

    try {
      const { data } = await api.post('/parse-string', {
        grammar,
        input_string: inputString,
      })
      setParseData(data)
      setActiveTab('steps')
    } catch (err) {
      setParseData({
        accepted: false,
        error:    err.response?.data?.detail ?? err.message ?? 'Server error',
        steps:    [],
        nodes:    [],
        edges:    [],
      })
    } finally {
      setLoading(false)
    }
  }, [grammar, inputString, grammarData])

  // ── Available tabs ────────────────────────────────────────────────── //
  const availableTabs = TABS.filter(t => {
    if (t.id === 'analysis') return !!grammarData
    return !!parseData
  })

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 font-sans">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="border-b border-white/[0.07] bg-[#030712]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-6 py-3.5 flex items-center gap-4">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-sm font-bold shadow-lg shadow-violet-500/30">
              OP
            </div>
            <div>
              <h1 className="text-base font-bold gradient-text leading-tight">
                Operator Precedence Parser
              </h1>
              <p className="text-[11px] text-gray-500 leading-tight">Compiler Design Tool · Bottom-Up Parsing</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-mono">
              Dynamic Grammar
            </span>
            <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono">
              Operator Precedence
            </span>
          </div>
        </div>
      </header>

      {/* ── Main layout ─────────────────────────────────────────────── */}
      <main className="max-w-screen-2xl mx-auto px-6 py-7">
        <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-6 items-start">

          {/* ── Left panel ─────────────────────────────────────────── */}
          <div className="space-y-5">
            <GrammarInput
              grammar={grammar}
              setGrammar={v => { setGrammar(v); setGrammarData(null); setGrammarError(null); setParseData(null) }}
              inputString={inputString}
              setInputString={setInputString}
              onProcessGrammar={handleProcessGrammar}
              onParseString={handleParseString}
              loading={loading}
              grammarReady={!!grammarData}
            />

            {/* Grammar error */}
            {grammarError && (
              <div className="glass border-red-500/30 bg-red-500/5 p-4 rounded-2xl animate-fade-in glow-red">
                <p className="text-red-400 font-bold text-sm mb-1 flex items-center gap-2">
                  <span className="text-base">✕</span>
                  Invalid Operator Precedence Grammar
                </p>
                <p className="text-red-300/80 text-xs leading-relaxed">{grammarError}</p>
              </div>
            )}

            {/* Grammar summary */}
            {grammarData && (
              <div className="glass border-emerald-500/25 bg-emerald-500/5 p-4 rounded-2xl animate-fade-in">
                <p className="text-emerald-400 font-semibold text-sm mb-2 flex items-center gap-2">
                  <span>✓</span> Grammar Valid
                </p>
                <div className="space-y-1">
                  {[
                    ['Start',        grammarData.start_symbol],
                    ['Non-terminals', grammarData.non_terminals.join(', ')],
                    ['Terminals',     grammarData.terminals.join(', ')],
                  ].map(([k, v]) => (
                    <p key={k} className="text-xs text-emerald-300/60 font-mono">
                      <span className="text-emerald-400/80 font-semibold">{k}:</span> {v}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Parse error (non-grammar) */}
            {parseData?.error && !grammarError && (
              <div className="glass border-amber-500/30 bg-amber-500/5 p-4 rounded-2xl animate-fade-in">
                <p className="text-amber-400 font-semibold text-sm mb-1 flex items-center gap-2">
                  <span>⚠</span> Parse Error
                </p>
                <p className="text-amber-300/70 text-xs">{parseData.error}</p>
              </div>
            )}
          </div>

          {/* ── Right panel ────────────────────────────────────────── */}
          <div className="space-y-5 min-w-0">

            {/* Result banner */}
            {parseData && <ResultBanner accepted={parseData.accepted} />}

            {/* Tabs */}
            {availableTabs.length > 0 && (
              <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.07]">
                {availableTabs.map(tab => (
                  <button
                    key={tab.id}
                    id={`tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                      activeTab === tab.id
                        ? 'tab-active'
                        : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* Tab content */}
            <div className="animate-slide-up">
              {activeTab === 'analysis' && grammarData && (
                <div className="space-y-5">
                  <VTSetsPanel
                    firstvt={grammarData.firstvt}
                    lastvt={grammarData.lastvt}
                  />
                  <PrecedenceTable
                    table={grammarData.table}
                    headers={grammarData.table_headers}
                  />
                </div>
              )}

              {activeTab === 'steps' && parseData && (
                <ParsingSteps steps={parseData.steps} />
              )}

              {activeTab === 'graph' && parseData && (
                <GraphVisualization
                  nodes={parseData.nodes}
                  edges={parseData.edges}
                />
              )}
            </div>

            {/* Empty state */}
            {!grammarData && !parseData && !loading && !grammarError && (
              <div className="glass flex flex-col items-center justify-center h-[480px] rounded-2xl animate-fade-in">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center mb-5 text-4xl">
                  ⚙️
                </div>
                <h2 className="text-xl font-bold text-white/50 mb-2">Ready to Parse</h2>
                <p className="text-sm text-white/25 text-center max-w-xs leading-relaxed">
                  Enter your custom grammar on the left, click <strong className="text-white/40">Process Grammar</strong>,
                  then enter a string and click <strong className="text-white/40">Parse String</strong>.
                </p>
                <div className="mt-8 grid grid-cols-3 gap-3 text-center text-xs text-white/20">
                  {['1  Enter Grammar','2  Process','3  Parse String'].map(s => (
                    <div key={s} className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">{s}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Loading overlay */}
            {loading && (
              <div className="glass flex flex-col items-center justify-center h-[200px] rounded-2xl animate-fade-in">
                <div className="spinner mb-3" />
                <p className="text-sm text-white/50 font-medium">Processing…</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
