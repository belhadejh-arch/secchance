---
name: Session expiry race protection
description: Avoid signing a user out because an old unauthenticated request completes after a successful login.
---

Only expire a session on an unauthorized response when that request actually carried the same session token that is still current. Anonymous or stale-token requests may finish after a new login; they must not clear the newer token.

**Why:** A delayed bootstrap request issued before login could return 401 after login and force the user back to the sign-in screen, repeating the login loop.

**How to apply:** When adding auth-aware API transport or retries, capture the request's token at send time and compare it to the current token before expiring local session state. Test delayed unauthenticated responses that overlap login.
