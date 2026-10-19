---
name: Administration synchronization requirement
description: User's repeated requirement for unified administration account lists and reliable account creation.
---

All account types must appear in administration after registration, whether created by an administrator or through public signup. Accounts must appear in their matching role sections as well as the general user list. Preserve the administrator's identity when creating another account.

**Why:** The user repeated that accounts were missing from administration and that account creation incorrectly asked an already signed-in administrator to log in. They explicitly requested linking administration to everything without exception.

**How to apply:** Test the frontend account-creation transport, not just direct API calls with manually supplied cookies. Check the embedded-preview case where third-party cookies are unavailable, and cover registration plus administration synchronization for both beneficiaries and organizations.
