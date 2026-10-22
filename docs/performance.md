# Performance and install checks

This change adds four fixed workloads, a profile comparison command, and an npm consumer check.
It contains no measured speed improvement.

## Workloads

Open `dlc-ui-playground://performance` in the playground.
Select a workload.
Press **Start** to start a run.
Press **Stop** to cancel it.
A new run resets its state.
The route closes its overlays and cancels its timers on exit.

| Workload | Protocol version 1 |
| --- | --- |
| Long list | Render 10,000 fixed rows through FlatList for 30 seconds. Replay one 30-second touch path with 13 points. Alternate between 80% and 20% of the list height. |
| Chart updates | Render 1,000 fixed x values and three series. Update the data every 100 ms for 30 seconds. |
| Keyboard and sheet | Open the sheet, focus the field, type `Delacour performance`, submit, and close it. Repeat 30 times. Count text mismatches. |
| Overlay lifecycle | Open and close Dialog, then BottomSheet. Use 500 ms per step. Repeat 100 cycles. Wait five seconds after each batch of ten cycles. |

The Warden `performance` suite runs these actions on its configured simulator.
Run `bunx warden e2e performance` from `apps/playground` on a configured Mac.
This suite checks behavior. It does not measure device performance.
The touch path needs calibration on each physical device before measurement.
Keep the calibrated path unchanged across the compared builds.

## Record profiles

Use a release build on the same physical device for both commits.
Record the full build SHA, device model, OS, refresh interval, profiler name, and profiler version.
Use the same theme, font scale, motion setting, haptics, battery state, and thermal state.
Record those settings with the raw profile files.
Run at least one warm-up and exactly three measured runs for each workload and commit.
Keep every raw profile beside its JSON summary.

Collect frame duration, JS stalls, and memory with the native profiler.
Use its exact metric field names in the summary.
Record keyboard delay from focus to the settled input position.
Check input text after every cycle.
Check native overlay state and retained memory after the final five-second idle.
The app counter does not prove that a native overlay was removed.
Do not use JS timer intervals as frame measurements.

The JSON shape is `PerformanceProfile` in `apps/playground/src/performance/report.ts`.
Use these top-level fields:

```json
{
  "commit": "<40-character build SHA>",
  "protocolVersion": 1,
  "profileType": "release",
  "device": { "kind": "physical", "id": "device-a", "model": "<model>", "os": "<OS version>", "refreshIntervalMs": 16.6667 },
  "profiler": { "name": "<profiler>", "version": "<version>" },
  "workloads": {}
}
```

Add all four workload IDs from the table as keys under `workloads`.
Each workload has `warmupRuns` and `measuredRuns` arrays.
A warm-up has `rawProfilePath`.
Each measured run has `rawProfilePath` and `metrics`.
Paths are local and relative to the summary JSON.
The command checks that every raw file exists and is readable.

| Workload ID | Required metrics |
| --- | --- |
| `long-list` | `frameP95Ms`, `framesWithinInterval`, `jsStalls`, `peakMemoryMb` |
| `chart-updates` | `frameP95Ms`, `framesWithinInterval`, `jsStalls`, `peakMemoryMb` |
| `keyboard-sheet` | `keyboardDelayP95Ms`, `inputLossCount` |
| `overlay-lifecycle` | `peakMemoryMb`, `retainedMemoryMb`, `finalClosed`, `staleOverlayCount` |

Each metric has `metricField` and `value`.
For example, use `{ "metricField": "<exact profiler field>", "value": 12.4 }` for a duration in ms.
`framesWithinInterval` is a fraction from zero to one.
`finalClosed` is a boolean.
Counts are whole numbers.
Other numeric values must be finite and non-negative.
For an unavailable measurement, use `value: null` and a non-empty `unavailableReason`.
Do not substitute zero for an unavailable measurement.

You can also supply `frameP50Ms` for the first two workloads and `keyboardDelayP50Ms` for the third.
Supply an optional metric on every measured run or none.
For the overlay workload, you can add `retainedMemorySamplesMb` to each measured run.
Take one sample after each batch idle.
The report flags increasing sample trends for review. A flag does not prove a leak.

From `apps/playground`, run:

```bash
bun run performance:report baseline.json candidate.json > comparison.md
```

The report requires matching device, profiler, protocol, and metric fields.
It rejects summaries for the same commit.
It compares medians for duration and memory.
It checks a 10% regression limit for p95 frame time, p95 keyboard delay, and final retained memory.
It requires at least 95% of frames within the refresh interval in every measured run.
It requires zero candidate input losses and stale overlays.
Every candidate overlay run must end closed.
Missing measurements produce an incomplete result and a nonzero exit code.
Budget failures also produce a nonzero exit code.
The report cannot verify that manually entered metrics came from the named build.

## npm consumer checks

From `packages/cli`, run both layouts in CI:

```bash
bun run verify:expo --consumer --bundle --layout standalone
bun run verify:expo --consumer --bundle --layout monorepo
```

The harness packs the UI package and checks its source and exports.
It installs the tarball in an isolated Expo app.
It checks Button and Input before adding the optional engine tarballs.
It then checks Chart and BottomSheet with those tarballs.
Both cases run TypeScript and Metro exports for iOS and Android.
The existing CI job runs this check for each layout.
The normal copied-source check still runs.

A maintainer must dispatch CI on a branch at the PR's exact head.
The `signoff-sha` input must match that branch's commit.
The signoff job rejects a mismatch before it writes a status.
Do not dispatch on `develop` with a different PR commit as the input.

Doctor compares package real paths from the app and workspace.
Shared symlinks do not count as duplicate native modules.
Distinct physical packages still produce a warning.
Broken resolution also produces a warning.

No native profiles, screenshots, or CI pass results are included with this implementation.
