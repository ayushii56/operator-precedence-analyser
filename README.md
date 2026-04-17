# Operator Precedence Parser — Compiler Design Tool

A full-stack web application that implements **Operator Precedence (Bottom-Up) Parsing**, built for Compiler Design coursework.

> **Fully dynamic** — no hardcoded grammar. Everything is computed at runtime from your input.

---

## 📸 Features

| Feature | Details |
|---|---|
| ✅ Dynamic Grammar | Enter any operator-precedence grammar at runtime |
| ✅ Grammar Validation | Detects adjacent non-terminals, shows red error |
| ✅ FirstVT / LastVT | Computed via fixed-point iteration for all non-terminals |
| ✅ Precedence Table | Full `<`, `>`, `=` matrix with conflict resolution |
| ✅ Step-by-step Parsing | Stack / Input / Relation / Action for every step |
| ✅ Parse Tree | SVG tree visualization with zoom and hover details |
| ✅ Result Banner | Large animated ACCEPTED (green) / NOT ACCEPTED (red) |

---

## 🗂 Project Structure

```
compiler/
├── backend/
│   ├── main.py          # FastAPI application (endpoints)
│   ├── grammar.py       # Grammar parsing, validation, FirstVT, LastVT, table
│   ├── op_parser.py     # Stack-based operator precedence parser
│   └── requirements.txt
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js       # proxy: /process-grammar, /parse-string → :8000
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── App.jsx
        ├── index.css
        ├── main.jsx
        └── components/
            ├── GrammarInput.jsx      # Grammar textarea + string input
            ├── VTSetsPanel.jsx       # FirstVT / LastVT display
            ├── PrecedenceTable.jsx   # Matrix table
            ├── ParsingSteps.jsx      # Parsing trace table
            ├── GraphVisualization.jsx# SVG parse tree
            └── ResultBanner.jsx      # ACCEPTED / NOT ACCEPTED banner
```

---

## 🚀 Running the Application

### 1 — Backend (FastAPI)

```bash
cd compiler/backend
pip install fastapi uvicorn[standard] pydantic python-multipart
python main.py
```

Backend runs at **http://localhost:8000**

### 2 — Frontend (React + Vite)

```bash
cd compiler/frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:3000**

Open **http://localhost:3000** in your browser.

---

## 🔌 API Endpoints

### `POST /process-grammar`
```json
{ "grammar": "E->E+E\nE->E*E\nE->i" }
```
Returns: `valid`, `non_terminals`, `terminals`, `start_symbol`, `firstvt`, `lastvt`, `table`, `table_headers`

### `POST /parse-string`
```json
{ "grammar": "E->E+E\nE->E*E\nE->i", "input_string": "i+i*i" }
```
Returns: `accepted`, `steps` (stack/input/relation/action), `nodes`, `edges` (for parse tree)

---

## 📝 Grammar Format

| Format | Example |
|---|---|
| Single-char symbols | `E->E+E` |
| With alternatives | `E->E+E\|E*E\|i` |
| Space-separated (multi-char terminals) | `E -> E + E` |

### Supported grammar examples
```
# Basic arithmetic
E->E+E
E->E*E
E->i

# With parentheses
E->E+E
E->E*E
E->(E)
E->i

# Multi-level
E->E+T
E->T
T->T*F
T->F
F->i
F->(E)
```

---

## 🔷 Grammar Validation Rules

The system validates that:
- **No two adjacent non-terminals** appear in any production.  
  (e.g., `E → EE` is **INVALID** for OPG)
- The grammar is non-empty and properly formatted.

If invalid → red error: **"Invalid Operator Precedence Grammar"**

---

## 🧠 Algorithm Details

### FirstVT (fixed-point iteration)
1. `A → a…`  →  `a ∈ FirstVT(A)`
2. `A → Ba…` →  `a ∈ FirstVT(A)`
3. `A → B…`  →  `FirstVT(B) ⊆ FirstVT(A)`

### LastVT (fixed-point iteration)
1. `A → …a`  →  `a ∈ LastVT(A)`
2. `A → …aB` →  `a ∈ LastVT(A)`
3. `A → …B`  →  `LastVT(B) ⊆ LastVT(A)`

### Precedence Table Rules
| Production pattern | Relation |
|---|---|
| `…T T…` | `T = T` |
| `…T NT T…` | `T = T` |
| `…T NT…` | `T < FirstVT(NT)` |
| `…NT T…` | `LastVT(NT) > T` |

Dollar `$` relations: `$ < FirstVT(S)` and `LastVT(S) > $`

### Parsing (marker-based)
- `<` shift  → mark symbol as handle-start
- `=` shift  → push without mark
- `>`        → pop until marked symbol (handle), reduce, push LHS

---

## 🎨 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python · FastAPI · Uvicorn |
| Frontend | React 18 · Vite 5 |
| Styling | Tailwind CSS v3 |
| Graph | Custom SVG tree layout |
| HTTP | Axios |
