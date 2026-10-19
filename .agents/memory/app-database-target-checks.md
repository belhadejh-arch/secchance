---
name: Application database target checks
description: Notes a mismatch between SQL-tool DDL success and the app runtime database during imported-project setup.
---

Neon is the user's source of account records. The Replit runtime may expose that connection as `DATABASE_URL`, while Render must be configured to use the same Neon database before the published site can show those accounts. Verify data through the application's selected runtime connection, not a separate SQL-tool target.

**Why:** The Replit-managed database had no professional accounts, while the user-designated Neon source contained the account records. The published Render service is a separate runtime and can silently show an empty dataset if it points elsewhere.

**How to apply:** Compare aggregate role/status counts from the app connection without displaying personal data. Configure all deployed API instances to use the same Neon database; never copy connection strings into chat.

The Neon schema can lag behind the checked-in schema: `services` may lack its expected unique constraint, and multiple directory profiles can belong to one admin user. Avoid `ON CONFLICT` unless the constraint is confirmed, and use single-row or aggregate profile joins so user and service results do not multiply.

**Why:** On the account source, the missing unique constraint caused service seeding to crash startup, and direct profile joins multiplied admin users and services.

**How to apply:** Keep demo seeding idempotent without relying on that constraint, query directory records separately from login accounts, and aggregate/select one profile per user.
