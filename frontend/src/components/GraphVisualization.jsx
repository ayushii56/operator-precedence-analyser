import { useMemo, useState } from 'react'

/* ── Tree layout ─────────────────────────────────────────────────────── */
const NODE_W = 72
const NODE_H = 80
const PAD    = 48

function computeLayout(nodes, edges) {
  if (!nodes.length) return { positions: {}, svgW: 0, svgH: 0 }

  // Build maps
  const childrenMap = {}
  const parentSet   = new Set()
  const nodeMap     = {}

  for (const n of nodes) {
    childrenMap[n.id] = []
    nodeMap[n.id] = n
  }
  for (const e of edges) {
    if (childrenMap[e.source] !== undefined)
      childrenMap[e.source].push(e.target)
    parentSet.add(e.target)
  }

  // Roots = nodes with no incoming edge
  const roots = nodes.filter(n => !parentSet.has(n.id)).map(n => n.id)
  if (!roots.length) {
    // Fallback: grid
    const positions = {}
    nodes.forEach((n, i) => {
      positions[n.id] = { x: PAD + (i % 6) * NODE_W, y: PAD + Math.floor(i / 6) * NODE_H }
    })
    const maxX = PAD + Math.min(nodes.length, 6) * NODE_W
    const maxY = PAD + Math.ceil(nodes.length / 6) * NODE_H
    return { positions, svgW: maxX, svgH: maxY }
  }

  const positions = {}
  let xCounter = 0

  function place(id, depth) {
    const children = childrenMap[id] || []
    if (!children.length) {
      // Leaf
      positions[id] = { x: xCounter * NODE_W, y: depth * NODE_H }
      xCounter++
    } else {
      const startX = xCounter
      for (const child of children) place(child, depth + 1)
      const endX = xCounter - 1
      positions[id] = { x: ((startX + endX) / 2) * NODE_W, y: depth * NODE_H }
    }
  }

  for (const root of roots) {
    place(root, 0)
    xCounter += 0.5   // gap between disconnected trees
  }

  // Normalize
  const xs = Object.values(positions).map(p => p.x)
  const ys = Object.values(positions).map(p => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const maxY = Math.max(...ys)

  for (const id in positions) {
    positions[id].x = positions[id].x - minX + PAD
    positions[id].y = positions[id].y + PAD
  }

  return {
    positions,
    svgW: maxX - minX + PAD * 2 + NODE_W,
    svgH: maxY          + PAD * 2 + 40,
  }
}

/* ── Component ───────────────────────────────────────────────────────── */
const R = 22   // node radius

export default function GraphVisualization({ nodes, edges }) {
  const [zoom,        setZoom]        = useState(1)
  const [hoveredNode, setHoveredNode] = useState(null)
  const [tooltip,     setTooltip]     = useState(null)

  const { positions, svgW, svgH } = useMemo(
    () => computeLayout(nodes, edges),
    [nodes, edges]
  )

  const nodeMap = useMemo(() => {
    const m = {}
    for (const n of nodes) m[n.id] = n
    return m
  }, [nodes])

  if (!nodes.length) {
    return (
      <div className="glass rounded-2xl flex flex-col items-center justify-center h-64 animate-fade-in">
        <span className="text-3xl mb-2 opacity-30">🌳</span>
        <p className="text-gray-600 text-sm">No parse tree data</p>
      </div>
    )
  }

  const ntCount = nodes.filter(n => n.type === 'nonterminal').length
  const tCount  = nodes.filter(n => n.type === 'terminal').length

  return (
    <div className="glass rounded-2xl overflow-hidden animate-fade-in">

      {/* Header */}
      <div className="p-5 border-b border-white/[0.07] flex flex-wrap items-center gap-3">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <span className="text-emerald-400">🌳</span>
          Parse Tree
        </h2>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 text-xs border border-violet-500/20">
            {ntCount} non-terminals
          </span>
          <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-xs border border-cyan-500/20">
            {tCount} terminals
          </span>
          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoom(z => Math.max(0.25, z - 0.1))}
              className="w-7 h-7 rounded-lg bg-white/[0.07] hover:bg-white/[0.12] text-white text-sm font-bold transition-colors"
            >−</button>
            <span className="text-xs text-gray-500 w-12 text-center font-mono">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(z => Math.min(2.5, z + 0.1))}
              className="w-7 h-7 rounded-lg bg-white/[0.07] hover:bg-white/[0.12] text-white text-sm font-bold transition-colors"
            >+</button>
            <button
              onClick={() => setZoom(1)}
              className="px-2 py-1 rounded-lg bg-white/[0.07] hover:bg-white/[0.12] text-xs text-gray-400 transition-colors"
            >Reset</button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-5 py-2 border-b border-white/[0.05] flex items-center gap-5 text-xs">
        {[
          { color: 'bg-violet-500/50 border-violet-400', label: 'Non-terminal (reduction)' },
          { color: 'bg-cyan-500/50 border-cyan-400',     label: 'Terminal (leaf node)' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-3.5 h-3.5 rounded-full border ${l.color}`} />
            <span className="text-gray-500">{l.label}</span>
          </div>
        ))}
        <span className="ml-auto text-gray-700">Hover node for details</span>
      </div>

      {/* SVG canvas */}
      <div className="overflow-auto bg-[#040a16]" style={{ maxHeight: '520px' }}>
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            display: 'inline-block',
            transition: 'transform 0.2s',
          }}
        >
          <svg
            width={svgW}
            height={svgH}
            style={{ display: 'block', minWidth: 320 }}
          >
            <defs>
              {/* Arrowhead marker */}
              <marker id="arr" markerWidth="7" markerHeight="5" refX="5" refY="2.5" orient="auto">
                <polygon points="0 0, 7 2.5, 0 5" fill="rgba(109,40,217,0.5)" />
              </marker>

              {/* Glow filter */}
              <filter id="glow-v" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-c" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Gradient fills */}
              <radialGradient id="grad-nt" cx="35%" cy="35%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.4" />
              </radialGradient>
              <radialGradient id="grad-t" cx="35%" cy="35%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#0891b2" stopOpacity="0.35" />
              </radialGradient>
            </defs>

            {/* Grid dots (subtle background pattern) */}
            <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="rgba(255,255,255,0.04)" />
            </pattern>
            <rect width={svgW} height={svgH} fill="url(#dots)" />

            {/* ── Edges ─────────────────────────────────────────── */}
            {edges.map((edge, i) => {
              const src = positions[edge.source]
              const tgt = positions[edge.target]
              if (!src || !tgt) return null

              // Cubic bezier for nicer curves
              const x1 = src.x,   y1 = src.y + R
              const x2 = tgt.x,   y2 = tgt.y - R
              const cp1y = y1 + (y2 - y1) * 0.45
              const cp2y = y1 + (y2 - y1) * 0.55
              const d = `M ${x1} ${y1} C ${x1} ${cp1y}, ${x2} ${cp2y}, ${x2} ${y2}`

              return (
                <path
                  key={i}
                  d={d}
                  fill="none"
                  stroke="rgba(109,40,217,0.4)"
                  strokeWidth="1.5"
                  markerEnd="url(#arr)"
                />
              )
            })}

            {/* ── Nodes ─────────────────────────────────────────── */}
            {nodes.map(node => {
              const pos = positions[node.id]
              if (!pos) return null

              const isNT      = node.type === 'nonterminal'
              const isHovered = hoveredNode === node.id
              const fillId    = isNT ? 'url(#grad-nt)' : 'url(#grad-t)'
              const stroke    = isNT ? '#8b5cf6' : '#22d3ee'
              const textColor = isNT ? '#ddd6fe' : '#a5f3fc'
              const filterId  = isNT ? 'url(#glow-v)' : 'url(#glow-c)'
              const labelSize = node.label.length > 2 ? 9 : node.label.length > 1 ? 11 : 14

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onMouseEnter={() => { setHoveredNode(node.id); setTooltip(node) }}
                  onMouseLeave={() => { setHoveredNode(null);    setTooltip(null) }}
                  style={{ cursor: 'default' }}
                >
                  {/* Outer glow ring when hovered */}
                  {isHovered && (
                    <circle
                      r={R + 7}
                      fill="none"
                      stroke={stroke}
                      strokeWidth="1"
                      opacity="0.3"
                      style={{ animation: 'ping 1s infinite' }}
                    />
                  )}
                  {/* Shadow circle */}
                  <circle
                    r={R + 2}
                    fill={isNT ? 'rgba(109,40,217,0.15)' : 'rgba(8,145,178,0.12)'}
                  />
                  {/* Main circle */}
                  <circle
                    r={R}
                    fill={fillId}
                    stroke={stroke}
                    strokeWidth={isHovered ? 2.5 : 1.5}
                    filter={isHovered ? filterId : undefined}
                    style={{ transition: 'all 0.15s ease' }}
                  />
                  {/* Label */}
                  <text
                    y="1"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={textColor}
                    fontSize={labelSize}
                    fontFamily="'JetBrains Mono', monospace"
                    fontWeight="700"
                    style={{ userSelect: 'none' }}
                  >
                    {node.label}
                  </text>

                  {/* Node type dot */}
                  <circle
                    cx={R - 3}
                    cy={-(R - 3)}
                    r="4"
                    fill={isNT ? '#7c3aed' : '#0891b2'}
                    stroke="#030712"
                    strokeWidth="1.5"
                  />
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      {/* Tooltip bar */}
      {tooltip && (
        <div className="px-5 py-2.5 border-t border-white/[0.05] flex items-center gap-3 text-xs">
          <span className={`font-mono font-bold ${tooltip.type === 'nonterminal' ? 'text-violet-400' : 'text-cyan-400'}`}>
            {tooltip.label}
          </span>
          <span className="text-gray-600">·</span>
          <span className="text-gray-400 capitalize">{tooltip.type}</span>
          <span className="text-gray-600">·</span>
          <span className="text-gray-500">ID: {tooltip.id}</span>
        </div>
      )}
    </div>
  )
}
