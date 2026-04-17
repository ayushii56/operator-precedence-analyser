"""
Vercel serverless entry-point for the FastAPI backend.
Vercel picks up `api/index.py` and serves it via the ASGI handler.
"""
import sys
import os

# Add the backend directory to sys.path so grammar.py and op_parser.py are importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from main import app  # noqa: F401  – Vercel needs the `app` symbol exposed here
