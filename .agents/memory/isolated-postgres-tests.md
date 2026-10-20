---
name: Isolated PostgreSQL tests
description: Environment-specific setup for running database integration tests in a temporary local PostgreSQL cluster.
---

When launching a temporary PostgreSQL cluster in this workspace, set `unix_socket_directories` to a directory under the temporary data path; `/run/postgresql` may not exist. Use the role created by `initdb` (`runner` here), not an assumed `postgres` role.

**Why:** Default socket setup and assumed role names caused false-negative test runs even though the application and test were healthy.

**How to apply:** Start the cluster with a private socket path and construct `TEST_DATABASE_URL` with the `initdb` owner before running integration tests.
