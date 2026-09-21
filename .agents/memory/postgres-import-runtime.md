---
name: PostgreSQL import runtime constraint
description: Notes an environment-specific constraint discovered while moving the imported synchronous route layer from SQLite to PostgreSQL.
---

The imported route layer uses synchronous database helper calls. Blocking the Node event loop while waiting for a `pg` Promise deadlocks startup in this environment; the current compatibility layer executes PostgreSQL queries through a short-lived Node worker process.

**Why:** A direct `deasync` bridge left the application hanging before it opened its port, while an asynchronous `pg` probe connected successfully.

**How to apply:** If the route layer is later refactored to native asynchronous handlers, replace the worker bridge with a shared `pg.Pool` and await all database operations together.