---
name: Python package inspection
description: Side effects to watch for when temporarily installing Python tooling in this Node application.
---

When Python packages are installed in this Node project, the package flow may initialize a Python project, create `pyproject.toml`, `uv.lock`, and `main.py`, and add Python modules or Nix packages to `.replit`.

**Why:** Temporary PDF inspection tooling unexpectedly changed the app configuration and created unrelated project files.

**How to apply:** Before installing Python tooling, check whether an existing tool can do the job. If installation is necessary, inspect `git status` afterward, preserve the original `.replit` workflow, and remove only generated artifacts that were absent beforehand.
