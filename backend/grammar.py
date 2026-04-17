"""
Grammar class for Operator Precedence Parsing.
Handles parsing, validation, FirstVT/LastVT computation,
and operator precedence table generation — all dynamically.
"""
from typing import Dict, Set, List, Optional


class Grammar:
    def __init__(self, grammar_text: str):
        self.grammar_text = grammar_text.strip()
        self.productions: Dict[str, List[List[str]]] = {}
        self.non_terminals: Set[str] = set()
        self.terminals: Set[str] = set()
        self.start_symbol: Optional[str] = None
        self._parse()

    # ------------------------------------------------------------------ #
    #  Tokenization                                                        #
    # ------------------------------------------------------------------ #

    def _tokenize_rhs(self, rhs: str) -> List[str]:
        """
        Tokenize the RHS of a production.
        - If the RHS contains spaces, split by spaces (multi-char symbols allowed).
        - Otherwise greedily match known non-terminals first, then single chars.
        """
        rhs = rhs.strip()
        if not rhs or rhs in ('ε', 'epsilon', 'eps'):
            return ['ε']
        if ' ' in rhs:
            return [t for t in rhs.split() if t]

        # Greedy match: longest known NT first, then single char
        nts_sorted = sorted(self.non_terminals, key=len, reverse=True)
        result: List[str] = []
        i = 0
        while i < len(rhs):
            matched = False
            for nt in nts_sorted:
                if rhs[i:i + len(nt)] == nt:
                    result.append(nt)
                    i += len(nt)
                    matched = True
                    break
            if not matched:
                result.append(rhs[i])
                i += 1
        return result

    # ------------------------------------------------------------------ #
    #  Parsing                                                             #
    # ------------------------------------------------------------------ #

    def _parse(self):
        lines = [
            l.strip()
            for l in self.grammar_text.replace('\r\n', '\n').split('\n')
            if l.strip()
        ]
        if not lines:
            raise ValueError("Grammar is empty.")

        # First pass: identify all non-terminals (LHS symbols)
        for line in lines:
            if '->' not in line:
                raise ValueError(
                    f"Invalid production format: '{line}'. "
                    "Expected format: A->... or A -> ..."
                )
            lhs, _ = line.split('->', 1)
            lhs = lhs.strip()
            if not lhs:
                raise ValueError(f"Empty LHS in: '{line}'")
            self.non_terminals.add(lhs)
            if self.start_symbol is None:
                self.start_symbol = lhs

        # Second pass: parse full productions with smart tokenizer
        for line in lines:
            lhs, rhs_part = line.split('->', 1)
            lhs = lhs.strip()
            alternatives = rhs_part.split('|')

            if lhs not in self.productions:
                self.productions[lhs] = []

            for alt in alternatives:
                symbols = self._tokenize_rhs(alt)
                self.productions[lhs].append(symbols)
                for sym in symbols:
                    if sym not in ('ε',) and sym not in self.non_terminals:
                        self.terminals.add(sym)

    # ------------------------------------------------------------------ #
    #  Validation                                                          #
    # ------------------------------------------------------------------ #

    def validate(self) -> dict:
        """
        Check if this is a valid Operator Precedence Grammar:
        No production may have two adjacent non-terminals.
        """
        if not self.productions:
            return {"valid": False, "message": "No productions found in grammar."}

        for lhs, prods in self.productions.items():
            for prod in prods:
                for i in range(len(prod) - 1):
                    if (prod[i] in self.non_terminals
                            and prod[i + 1] in self.non_terminals):
                        prod_str = ' '.join(prod)
                        return {
                            "valid": False,
                            "message": (
                                f"Invalid Operator Precedence Grammar: "
                                f"Production {lhs} → {prod_str} has two adjacent "
                                f"non-terminals '{prod[i]}' and '{prod[i + 1]}'"
                            ),
                        }
        return {"valid": True, "message": "Valid operator precedence grammar."}

    # ------------------------------------------------------------------ #
    #  FirstVT                                                             #
    # ------------------------------------------------------------------ #

    def compute_firstvt(self) -> Dict[str, Set[str]]:
        """
        Compute FirstVT for every non-terminal using fixed-point iteration.

        Rules:
          1. A → a…        →  a ∈ FirstVT(A)
          2. A → B a…      →  a ∈ FirstVT(A)
          3. A → B…        →  FirstVT(B) ⊆ FirstVT(A)
        """
        firstvt: Dict[str, Set[str]] = {nt: set() for nt in self.non_terminals}
        changed = True
        while changed:
            changed = False
            for lhs, prods in self.productions.items():
                for prod in prods:
                    if not prod or prod == ['ε']:
                        continue
                    p0 = prod[0]
                    if p0 in self.terminals:
                        # Rule 1
                        if p0 not in firstvt[lhs]:
                            firstvt[lhs].add(p0)
                            changed = True
                    elif p0 in self.non_terminals:
                        # Rule 3
                        for t in list(firstvt[p0]):
                            if t not in firstvt[lhs]:
                                firstvt[lhs].add(t)
                                changed = True
                        # Rule 2
                        if len(prod) > 1 and prod[1] in self.terminals:
                            if prod[1] not in firstvt[lhs]:
                                firstvt[lhs].add(prod[1])
                                changed = True
        return firstvt

    # ------------------------------------------------------------------ #
    #  LastVT                                                              #
    # ------------------------------------------------------------------ #

    def compute_lastvt(self) -> Dict[str, Set[str]]:
        """
        Compute LastVT for every non-terminal using fixed-point iteration.

        Rules:
          1. A → …a        →  a ∈ LastVT(A)
          2. A → …a B      →  a ∈ LastVT(A)
          3. A → …B        →  LastVT(B) ⊆ LastVT(A)
        """
        lastvt: Dict[str, Set[str]] = {nt: set() for nt in self.non_terminals}
        changed = True
        while changed:
            changed = False
            for lhs, prods in self.productions.items():
                for prod in prods:
                    if not prod or prod == ['ε']:
                        continue
                    plast = prod[-1]
                    if plast in self.terminals:
                        # Rule 1
                        if plast not in lastvt[lhs]:
                            lastvt[lhs].add(plast)
                            changed = True
                    elif plast in self.non_terminals:
                        # Rule 3
                        for t in list(lastvt[plast]):
                            if t not in lastvt[lhs]:
                                lastvt[lhs].add(t)
                                changed = True
                        # Rule 2
                        if len(prod) > 1 and prod[-2] in self.terminals:
                            if prod[-2] not in lastvt[lhs]:
                                lastvt[lhs].add(prod[-2])
                                changed = True
        return lastvt

    # ------------------------------------------------------------------ #
    #  Operator Precedence Table                                           #
    # ------------------------------------------------------------------ #

    def build_precedence_table(
        self,
        firstvt: Dict[str, Set[str]],
        lastvt: Dict[str, Set[str]],
    ) -> Dict[str, Dict[str, Optional[str]]]:
        """
        Build the operator precedence table.

        Construction rules for production A → X1 X2 … Xn:
          (i)   Xi=T, Xi+1=T              →  Xi  =  Xi+1
          (ii)  Xi=T, Xi+1=NT, Xi+2=T     →  Xi  =  Xi+2
          (iii) Xi=T, Xi+1=NT             →  Xi  <  b  for every b ∈ FirstVT(Xi+1)
          (iv)  Xi=NT, Xi+1=T             →  a  >  Xi+1  for every a ∈ LastVT(Xi)

        Dollar rules (start symbol S):
          $  <  b   for every b ∈ FirstVT(S)
          a  >  $   for every a ∈ LastVT(S)

        Conflict resolution: '>' wins (assumes left-associativity).
        """
        all_t = sorted(list(self.terminals)) + ['$']
        table: Dict[str, Dict[str, Optional[str]]] = {
            a: {b: None for b in all_t} for a in all_t
        }

        def set_rel(a: str, b: str, rel: str) -> None:
            if a in table and b in table.get(a, {}):
                existing = table[a][b]
                if existing is None:
                    table[a][b] = rel
                elif existing != rel:
                    # '>' wins on conflict (left-associativity default)
                    if rel == '>':
                        table[a][b] = '>'

        for lhs, prods in self.productions.items():
            for prod in prods:
                n = len(prod)
                for i in range(n):
                    # Rule (i): T T
                    if (i < n - 1
                            and prod[i] in self.terminals
                            and prod[i + 1] in self.terminals):
                        set_rel(prod[i], prod[i + 1], '=')

                    # Rule (ii): T NT T
                    if (i < n - 2
                            and prod[i] in self.terminals
                            and prod[i + 1] in self.non_terminals
                            and prod[i + 2] in self.terminals):
                        set_rel(prod[i], prod[i + 2], '=')

                    # Rule (iii): T NT  →  T < FirstVT(NT)
                    if (i < n - 1
                            and prod[i] in self.terminals
                            and prod[i + 1] in self.non_terminals):
                        for b in firstvt.get(prod[i + 1], set()):
                            set_rel(prod[i], b, '<')

                    # Rule (iv): NT T  →  LastVT(NT) > T
                    if (i < n - 1
                            and prod[i] in self.non_terminals
                            and prod[i + 1] in self.terminals):
                        for a in lastvt.get(prod[i], set()):
                            set_rel(a, prod[i + 1], '>')

        # Dollar sign relations
        if self.start_symbol:
            for t in firstvt.get(self.start_symbol, set()):
                set_rel('$', t, '<')
            for t in lastvt.get(self.start_symbol, set()):
                set_rel(t, '$', '>')

        return table
