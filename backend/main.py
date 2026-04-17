"""
FastAPI backend for the Operator Precedence Parser.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from grammar import Grammar
from op_parser import OperatorPrecedenceParser

app = FastAPI(
    title="Operator Precedence Parser API",
    description="Dynamic OPG parser: validates grammar, computes FirstVT/LastVT, "
                "builds precedence table, and performs stack-based bottom-up parsing.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────────────────────────────── #
#  Request models                                                           #
# ──────────────────────────────────────────────────────────────────────── #

class GrammarRequest(BaseModel):
    grammar: str


class ParseRequest(BaseModel):
    grammar: str
    input_string: str


# ──────────────────────────────────────────────────────────────────────── #
#  Endpoints                                                                #
# ──────────────────────────────────────────────────────────────────────── #

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/process-grammar")
def process_grammar(req: GrammarRequest):
    """
    Parse the user-provided grammar dynamically, validate it,
    then compute FirstVT, LastVT, and the operator precedence table.
    """
    try:
        g = Grammar(req.grammar)

        # Step 1 – Validate
        validation = g.validate()
        if not validation["valid"]:
            return {"valid": False, "error": validation["message"]}

        # Step 2 – Compute sets
        firstvt = g.compute_firstvt()
        lastvt = g.compute_lastvt()

        # Step 3 – Build table
        table = g.build_precedence_table(firstvt, lastvt)

        terminal_headers = sorted(list(g.terminals)) + ['$']

        return {
            "valid": True,
            "non_terminals": sorted(list(g.non_terminals)),
            "terminals": sorted(list(g.terminals)),
            "start_symbol": g.start_symbol,
            "firstvt": {k: sorted(list(v)) for k, v in firstvt.items()},
            "lastvt":  {k: sorted(list(v)) for k, v in lastvt.items()},
            "table": table,
            "table_headers": terminal_headers,
        }

    except Exception as exc:
        return {"valid": False, "error": str(exc)}


@app.post("/parse-string")
def parse_string(req: ParseRequest):
    """
    Re-process the grammar (validate + build table) then run the
    stack-based operator precedence parser on the given string.
    Returns step-by-step trace + graph data for tree visualization.
    """
    try:
        g = Grammar(req.grammar)

        validation = g.validate()
        if not validation["valid"]:
            return {
                "accepted": False,
                "error": validation["message"],
                "steps": [],
                "nodes": [],
                "edges": [],
            }

        firstvt = g.compute_firstvt()
        lastvt  = g.compute_lastvt()
        table   = g.build_precedence_table(firstvt, lastvt)

        parser = OperatorPrecedenceParser(g, table)
        result = parser.parse(req.input_string)
        return result

    except Exception as exc:
        return {
            "accepted": False,
            "error": str(exc),
            "steps": [],
            "nodes": [],
            "edges": [],
        }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
