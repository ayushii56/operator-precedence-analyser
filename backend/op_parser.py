"""
Operator Precedence Parser (stack-based bottom-up parsing).

Uses a marker-based approach:
  - Shifting with '<' relation marks the symbol as a handle-start (marker=True).
  - Shifting with '=' relation pushes without marker (marker=False).
  - When relation is '>', pop until the marked symbol (inclusive), optionally
    pop one leading non-terminal, then match against the grammar productions.
    
A parallel node_stack tracks graph node IDs so the parse tree can be
reconstructed from reduction steps.
"""
from typing import Dict, List, Tuple, Optional, Any
from grammar import Grammar


class OperatorPrecedenceParser:
    def __init__(self, grammar: Grammar, table: Dict[str, Dict[str, Optional[str]]]):
        self.grammar = grammar
        self.table = table

    # ------------------------------------------------------------------ #
    #  Helpers                                                             #
    # ------------------------------------------------------------------ #

    def _tokenize(self, input_str: str) -> List[str]:
        s = input_str.strip()
        if not s:
            return []
        if ' ' in s:
            return [t for t in s.split() if t]
        return list(s)

    def _top_terminal(self, stack: List[Tuple[str, bool]]) -> str:
        """Return the topmost terminal on the stack (or '$' if none)."""
        for sym, _ in reversed(stack):
            if sym in self.grammar.terminals or sym == '$':
                return sym
        return '$'

    def _match_production(self, handle: List[str]) -> Optional[str]:
        """
        Find a production whose RHS matches the handle.
        Non-terminal positions in the production match any non-terminal
        in the handle (standard OPG rule).
        """
        NTs = self.grammar.non_terminals
        for lhs, prods in self.grammar.productions.items():
            for prod in prods:
                if len(prod) != len(handle):
                    continue
                if all(
                    p == h or (p in NTs and h in NTs)
                    for p, h in zip(prod, handle)
                ):
                    return lhs
        return None

    # ------------------------------------------------------------------ #
    #  Main parse                                                          #
    # ------------------------------------------------------------------ #

    def parse(self, input_str: str) -> Dict[str, Any]:
        tokens = self._tokenize(input_str)

        # Validate every token against the terminal set
        for tok in tokens:
            if tok not in self.grammar.terminals:
                return {
                    "accepted": False,
                    "steps": [{
                        "stack": "$",
                        "input": input_str.strip() + "$",
                        "relation": "ERR",
                        "action": (
                            f"REJECT: Unknown token '{tok}'. "
                            f"Valid terminals: {sorted(self.grammar.terminals)}"
                        ),
                    }],
                    "nodes": [],
                    "edges": [],
                }

        tokens = tokens + ['$']

        # stack  : list of (symbol, is_lt_marker)
        # marker=True  ↔ this symbol was shifted with '<' (start of a handle)
        # marker=False ↔ pushed with '=' or after a reduction
        stack: List[Tuple[str, bool]] = [('$', False)]

        # node_stack  : parallel to stack; holds graph node IDs (None for '$')
        node_stack: List[Optional[str]] = [None]

        ip = 0
        steps: List[Dict] = []
        nodes: List[Dict] = []
        edges: List[Dict] = []
        nc = [0]

        def new_node(label: str, ntype: str) -> str:
            nid = f"N{nc[0]}"
            nc[0] += 1
            nodes.append({"id": nid, "label": label, "type": ntype})
            return nid

        def stack_str() -> str:
            return ''.join(s for s, _ in stack)

        def input_remaining() -> str:
            return ''.join(tokens[ip:])

        MAX_STEPS = 600

        for _ in range(MAX_STEPS):
            tt = self._top_terminal(stack)
            curr = tokens[ip]

            # ── Accept condition ───────────────────────────────────────
            syms = [s for s, _ in stack]
            if (tt == '$' and curr == '$'
                    and len(syms) == 2
                    and syms[1] in self.grammar.non_terminals):
                steps.append({
                    "stack": stack_str(),
                    "input": input_remaining(),
                    "relation": "",
                    "action": "✓ ACCEPT",
                })
                return {
                    "accepted": True,
                    "steps": steps,
                    "nodes": nodes,
                    "edges": edges,
                }

            rel = self.table.get(tt, {}).get(curr)

            # ── Shift ─────────────────────────────────────────────────
            if rel in ('<', '='):
                is_marker = (rel == '<')
                steps.append({
                    "stack": stack_str(),
                    "input": input_remaining(),
                    "relation": rel,
                    "action": f"Shift  {curr}",
                })
                nid = new_node(
                    curr,
                    "terminal" if curr in self.grammar.terminals else "special",
                )
                stack.append((curr, is_marker))
                node_stack.append(nid)
                ip += 1

            # ── Reduce ────────────────────────────────────────────────
            elif rel == '>':
                current_stack_str = stack_str()
                current_input_str = input_remaining()

                handle: List[str] = []
                handle_nids: List[str] = []

                # Pop until we hit and include the marked symbol
                while stack:
                    top_sym = stack[-1][0]
                    if top_sym == '$':       # safety: never pop base $
                        break
                    sym, marker = stack.pop()
                    nid2 = node_stack.pop()
                    handle.insert(0, sym)
                    if nid2 is not None:
                        handle_nids.insert(0, nid2)
                    if marker:               # found the handle-start
                        break

                # Also pop a leading non-terminal if present
                if stack and stack[-1][0] in self.grammar.non_terminals:
                    sym, _ = stack.pop()
                    nid2 = node_stack.pop()
                    handle.insert(0, sym)
                    if nid2 is not None:
                        handle_nids.insert(0, nid2)

                lhs = self._match_production(handle)
                handle_str = ''.join(handle)

                if lhs is None:
                    steps.append({
                        "stack": current_stack_str,
                        "input": current_input_str,
                        "relation": '>',
                        "action": (
                            f"REJECT: No production matches handle '{handle_str}'"
                        ),
                    })
                    return {
                        "accepted": False,
                        "steps": steps,
                        "nodes": nodes,
                        "edges": edges,
                    }

                steps.append({
                    "stack": current_stack_str,
                    "input": current_input_str,
                    "relation": '>',
                    "action": f"Reduce {handle_str} → {lhs}",
                })

                # Build parse-tree node
                parent_id = new_node(lhs, "nonterminal")
                for child_id in handle_nids:
                    edges.append({
                        "source": parent_id,
                        "target": child_id,
                        "label": "reduce",
                    })

                stack.append((lhs, False))
                node_stack.append(parent_id)

            # ── Error ─────────────────────────────────────────────────
            else:
                steps.append({
                    "stack": stack_str(),
                    "input": input_remaining(),
                    "relation": "ERR",
                    "action": (
                        f"REJECT: No precedence relation between "
                        f"'{tt}' and '{curr}'"
                    ),
                })
                return {
                    "accepted": False,
                    "steps": steps,
                    "nodes": nodes,
                    "edges": edges,
                }

        # Max iterations exceeded
        steps.append({
            "stack": stack_str(),
            "input": input_remaining(),
            "relation": "ERR",
            "action": "ERROR: Maximum parsing steps exceeded (possible loop).",
        })
        return {
            "accepted": False,
            "steps": steps,
            "nodes": nodes,
            "edges": edges,
        }
