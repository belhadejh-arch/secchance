---
name: Preview proxy shell checks
description: Development-domain shell requests can fail with 426 despite a healthy running preview.
---

For development smoke tests, do not treat an HTTP 426 response from a shell request to `REPLIT_DEV_DOMAIN` as proof that the app is down. Check the managed workflow logs and app preview; if both are healthy, use the local running port for internal API probes.

**Why:** The development proxy returned “Upgrade Required” for shell curls while the same running workflow served a clean app preview and successful local API responses.

**How to apply:** This is a development shell-debugging fallback only. A local success does not verify that an external payment gateway can reach the public webhook URL.