---
name: Application database target checks
description: Notes a mismatch between SQL-tool DDL success and the app runtime database during imported-project setup.
---

If the database tool reports that the schema was created but the running app still reports missing relations, verify the tables through the same runtime database connection the app uses before repeating schema setup. In this imported project, schema writes reported by the database tool did not appear in the app's connection; applying the authorized schema through the runtime connection resolved it.

**Why:** The app continued to fail with missing-table errors after a successful SQL-tool response, even though both connections reported the same database name.

**How to apply:** On a relation-not-found error after schema setup, compare only schema/table metadata from the app runtime connection and the database tool. Confirm the intended development target before any further writes.
