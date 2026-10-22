# Performance and installation reliability proposal

Status: draft for option 5. This PR contains a plan.
Base: `develop` at `36b3b80f`. Review date: 2026-10-22.

Measure the native workloads that users can feel. Fix the bottlenecks that the
measurements show. Verify the UI package through its npm path. Make installation
diagnostics describe the modules and native configuration that an application uses.

## Current evidence

- The [Expo verification harness](../../packages/cli/scripts/verify/harness.ts)
  already packs the chart and bottom sheet engines. It installs UI components
  through the CLI copy path. Add the UI tarball path to this harness.
- The [doctor command](../../packages/cli/src/commands/doctor.ts) checks whether
  module paths exist in both the app and workspace. It does not compare their
  resolved physical paths. Two links to one copy can therefore produce a warning.
- The [local signoff plan](../../scripts/signoff-checks.ts) already includes
  copied tests and registry checks. Extend the appropriate checks.
  Keep ordinary PR verification local. Use the existing dispatch fallback when needed.
- The playground has preview flows and visual comparison. These give interaction
  and image evidence. They do not establish frame-time or memory budgets.

## 1. Measure native workloads

Use one named iPhone and one named Android phone. Record the model, OS, refresh
rate, commit, library versions, and release build settings. Keep the device and
dataset fixed between the base and proposed change. Record thermal conditions.
Do not use a simulator result as a physical-device performance claim.

Use the existing playground demos and platform profilers. Add a small workload
fixture only where the current demo cannot repeat the required action.

| Workload | Fixed action | Measurements |
| --- | --- | --- |
| Long list | Scroll 10,000 fixed rows for 30 seconds with a recorded gesture sequence | UI frame timing, JavaScript stalls, peak memory, and row render count |
| Chart updates | Replace three 1,000-point series at 10 updates per second for 30 seconds | UI frame timing, update work on JavaScript, and peak memory |
| Keyboard and sheet | Focus, type, blur, and close the same form 30 times | Visible keyboard delay, frame timing, input loss, and final sheet position |
| Overlay lifecycle | Open and close the same dialog and sheet in ten batches of ten cycles | Retained memory after each idle period, live subscriptions, and stale overlay nodes |

Warm each workload once. Record three measured runs for both commits.
Store the raw profiles and the measurement summary together.
Report p50 and p95 values where the profiler supplies them.
Name any missing metric instead of estimating it from a screen recording.

Proposed review budgets:

- At least 95% of UI frames meet the selected device's frame interval during scrolling.
  Record the actual interval. A 60 Hz interval is about 16.7 ms.
- Median p95 frame time and keyboard delay must not regress by more than 10%.
- Idle memory after the overlay workload must not exceed the base by more than 10%.
  Inspect a growing retained-memory trend even if the final value fits that budget.
- Each optimization must improve its target metric by at least 10% across the
  three runs. Otherwise, retain the baseline and omit the extra code.
- The native interaction checks must still pass after an optimization.

These budgets are proposed acceptance criteria. They are not measured results.
If a baseline already fails, record the failure and the smallest fix before
setting a gate. Do not weaken a budget to label an unsuccessful run as passing.

React Native requires release builds for useful performance checks.
Its guide separates JavaScript and UI frame rates.
See the [performance guide](https://reactnative.dev/docs/performance).

## 2. Verify the UI npm package

Extend the existing Expo harness with a separate consumer that installs the packed
`@delacour/react-native-ui`. Reuse the engine tarballs that the harness already builds.
Keep the copied-source path and its tests.

The consumer must resolve source from the tarball. Disable aliases that point to
workspace source. Inspect the tarball file list and exports before the install.
Do not publish packages during verification.

Acceptance checks:

- A minimal app imports Button and Input through public package paths.
  Optional chart and sheet engines can remain absent for this case.
- A second app installs the packed engines. It imports Chart and BottomSheet
  through the UI package. Types and Metro bundles pass on iOS and Android.
- A native run opens a chart and sheet without a duplicate-context error.
- Every documented public subpath resolves from the tarball. TypeScript and Metro
  use the packaged TSX and CSS entries. Private workspace aliases do not escape.
- A removed export or missing file makes the smoke check fail with its path.
- The report records the package versions, tarball hashes, and source SHA.

## 3. Make doctor diagnostics precise

Resolve each watched module from the app and workspace locations. Compare the
physical package paths. Two paths to one copy should pass. Two physical copies
should warn, even when their versions match. A failed resolution should produce
an unknown or actionable result, not a false statement that the setup is valid.

Use filesystem fixtures for one hoisted copy, two links to one copy, two physical
copies, a missing package, and an unreadable path. Preserve read-only behavior.
Do not change dependencies, Metro configuration, or native files automatically.

For native configuration, first record the supported set that the npm and CLI
consumers actually pass. Read dependency and Expo values from existing manifests
and configuration readers. Add specific guidance when a checked requirement is
not met. Keep an unrecognized setup distinct from a proven incompatible setup.
Do not narrow public peer ranges without compatibility evidence and a release note.

## 4. Add focused native regression checks

Reuse the existing form, overlay, and chart flows. Automate the failures found by
the workloads above. Include one Android run for shared gesture and keyboard paths.
Keep screenshot comparison separate from timing checks.

Option 4 owns the manual accessibility acceptance matrix. This work reuses those
cases when a native automation tool can assert them. It does not replace recorded
VoiceOver and TalkBack evidence with pure JavaScript tests.
See [React Native testing guidance](https://reactnative.dev/docs/testing-overview).

## Delivery map and order

| Order | Area | Planned result |
| --- | --- | --- |
| 1 | `packages/cli/src/commands/doctor.ts` and its tests | Correct module identity checks with filesystem fixtures |
| 2 | `packages/cli/scripts/verify/` and `packages/react-native-ui/package.json` | UI tarball consumer and package contract checks |
| 3 | `apps/playground/src/demos/`, `apps/playground/e2e/`, and a small report command | Repeatable workloads, raw profiles, and a baseline report |
| 4 | The component files identified by those profiles | Small fixes with before-and-after evidence |
| 5 | `scripts/signoff-checks.ts` and its tests | Relevant local gates, after the workloads are stable |
| 6 | Component guides and CLI troubleshooting docs | Supported configuration, diagnostic guidance, and measured results |

Add a changeset for published behavior changes. Regenerate the registry when a
component changes. Record the exact head that each check tests. Keep the existing
release and dispatch workflows. Do not add paid checks to every PR.

## Open evidence

No performance measurements or consumer installs ran for this draft.
The current disk limit blocks new installs and native builds. The workspace lacks
Skia, the web telemetry package, and Warden. Complete those prerequisites before
collecting a baseline. Do not claim a speed or memory improvement before that run.
