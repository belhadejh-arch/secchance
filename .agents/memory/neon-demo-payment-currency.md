---
name: Neon demo payment currency
description: Compatibility requirement for writing demo payment transactions to the connected Neon schema.
---

Every inserted payment transaction must explicitly include `currency = 'DZD'`; do not rely on the checked-in schema's default.

**Why:** Render logs showed Neon rejects a demo payment transaction with SQLSTATE `23502` when `currency` is omitted, rolling back the payment and appointment confirmation.

**How to apply:** Keep the explicit currency in all payment transaction creation paths and test against a schema where `currency` is `NOT NULL` without a default.
