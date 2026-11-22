# Test failure log

Every test failure that someone fixes gets a row here, from **2026-11-22 to 2026-12-06**. When the
window closes, the rows decide which tests to keep:

- **caught regression**: the test failed because the code under it was wrong. Keep it.
- **change detector**: the test failed because correct code changed shape, for example a snapshot,
  a copied string, a call count of an internal or a class list. The fix was to update the test to
  match. A file whose every failure is a change detector gets deleted, and its pattern is banned in
  `AGENTS.md` § Conventions.
- **test bug**: the test itself was wrong, for example a race, a leak between tests or a starved
  timeout. Fix the test and keep it; it says nothing about the code.

Tests for authorization, privacy, migrations or concurrency are never deleted, whatever their rows
say. In this repository that means `apps/web/src/lib/privacy.test.ts`, the rate-limit and
crawler-block suites, the release and promote guards under `.github/`, and every overlay or gesture
test that covers two events racing.

A failure that went away on a re-run is a **test bug** until shown otherwise, never "flaky". Find
the cause, and log it as a test bug or, if the code was wrong, as a caught regression.

| Date | Test | Where it failed | Kind | Cause and fix |
| --- | --- | --- | --- | --- |
| 2026-11-20 | `Drawer › a second close while exiting reports once` | CI `copied tests (jest)`, run 42063606832 attempt 1 (develop 9e35ce02); passed on attempt 2 | test bug **and** caught regression | The test asserted inside the 160 ms exit window. On a starved runner the panel unmounted first and `getByTestId` threw. Fixed by holding the exit open. Writing a test for "two closes in one tick" then found a real bug: Drawer and Dialog compared each close with the last render's `open`, so two closes before a re-render both reported `onOpenChange(false)`. Fixed in `fix/overlay-close-reports-once`. |
| 2026-11-22 | `ScrollBlur › blur engine` (3–7 tests, depending on seed) | CI `render (1/4)` under `--randomize`, seed -1250898644 | test bug | `jest.spyOn(AccessibilityInfo, "isReduceTransparencyEnabled")` returns React Native's shared preset `jest.fn`. `mockResolvedValue(true)` therefore outlived `restoreAllMocks`, and every later test saw Reduce Transparency on. The test now restores the preset implementation. |
| 2026-11-05 | `Switch.Thumb › calls a caller's onLayout and still measures itself` | CI `copied tests (jest)`, run 44748373810, PR #356 branch | caught regression (not verified) | Failed on a work-in-progress Switch branch and was fixed before merge. Recorded from the audit; the fix commit was not traced. |
| 2026-11-22 | `createFormat › *` (5 tests, 5 s timeout) | local `bun test`, load average ~100 on 14 cores | test bug (not fixed) | Each test spawns a formatter subprocess, which took over 5 s while other sessions saturated the machine. The suite passes alone in 0.6 s. Open question: should a subprocess test carry its own budget instead of the runner's default? |
