# Data explorer proposal

Status: draft for option 2. This PR contains a plan.
Base: `develop` at `36b3b80f`. Review date: 2026-10-22.

Build a reusable example for customer lists, invoices, and inventory.
It combines search, filters, sorting, paging, selection, and bulk actions.
The application owns the records and query state.

## Existing parts

| Part | Existing support | Use in this change |
| --- | --- | --- |
| [Table](../../packages/react-native-ui/src/components/table/AGENTS.md) | Sort controls, column labels, selected rows, horizontal scrolling, and FlatList row composition | Render the columns and rows. Keep data operations outside Table. |
| [SearchBar](../../packages/react-native-ui/src/components/search-bar/AGENTS.md) | Controlled text and debounced callbacks | Edit the query and notify the application. |
| [SelectionMode](../../packages/react-native-ui/src/components/selection-mode/AGENTS.md) | Controlled selection by string ID and actions that receive current IDs | Keep selection stable when row order changes. |
| [Pagination](../../packages/react-native-ui/src/components/pagination/AGENTS.md) | Page controls | Change the page through an application callback. |
| [EmptyState](../../packages/react-native-ui/src/components/empty-state/AGENTS.md) | Empty content and actions | Show no records and no search results. |

Use the existing FlatList composition from Table. Do not add a data grid engine.
The first delivery is editable example source, a playground demo, and a guide.
CLI installation of complete screens belongs to option 1 and is outside this draft.

## Behavior

The application supplies visible rows, stable IDs, a query, one sort key,
one sort direction, a status filter, page state, selected IDs, and request state.
Callbacks report changes. The example uses deterministic local data first.
A second adapter shows the same contract with a delayed server query.
The example has no network endpoint or persistence layer.

| Action or state | Required result |
| --- | --- |
| Search or filter changes | Report the new query and reset to page one. A new request does not show a previous query's response. |
| Sort changes | Report the key and direction. Equal values use a stable ID as the tie breaker in the local adapter. |
| Page changes | Keep the query and sort. Clamp a page after the total decreases. |
| Select a row | Store its ID. Sorting and refetching must not change which record is selected. |
| Select all | Select the current page only. Label that scope. Do not imply selection of all server matches. |
| Filter or page changes | Preserve explicitly selected IDs. Show a count that includes hidden selections. Provide a clear action. |
| Bulk action | Pass the current IDs once. Disable repeat submission while pending. The application decides which IDs to clear after success. |
| Bulk action fails | Keep selection and show the error. Allow a retry. |
| Initial loading | Show a loading state with a name for screen readers. |
| Refresh loading | Keep current rows visible and identify the update. |
| Empty result | Distinguish an empty dataset from a query with no matches. Provide a reset action for the latter. |
| Query fails | Show the error and retry action. Keep any prior rows labelled as stale. |

The server adapter must ignore stale responses after a later query completes.
If selected IDs disappear, the application reconciles them with the server.
The example must not infer deletion from an ID missing on the current page.

## Delivery map

| Area | Planned change |
| --- | --- |
| `apps/playground/src/demos/table/` | Add the complete example and a fixed 10,000-row fixture. Keep its reducer and local query functions beside it. |
| `apps/playground/src/app/(components)/` | Expose the example through the existing table gallery. |
| `apps/web/content/docs/native/components/table.mdx` | Add the composition guide and callback contract. Include editable source and server adapter guidance. |
| `apps/playground/src/demos/registry.ts` | Regenerate demo metadata. |
| `apps/playground/e2e/previews/` | Add a focused interaction flow for selection, paging, and retry. |
| `apps/web/public/previews/` and `apps/web/src/previews/manifest.ts` | Capture the final example. |
| Library components and registry | Change only if the example exposes a defect in an existing public API. Add a changeset and regenerate the registry for that change. |

Keep callback and record types local to the example until a second use needs them.
Do not add a query library, storage abstraction, generic column schema, or export service.
Do not put sorting or fetching into Table.

## Acceptance checks

- Pure tests cover stable sorting, page reset and clamping, selection by ID,
  stale responses, and bulk-action failure. Tests must use public behavior.
- A server example records callback inputs for search, filter, sort, page, and retry.
  Its responses complete out of order in one test. Only the current response appears.
- A user can select rows, sort, change pages, apply a filter, and act on the same IDs.
  The hidden selection count remains clear.
- A narrow screen can reach every column and action. Large text does not hide controls.
  VoiceOver and TalkBack announce column names, sort direction, selection, and loading.
- A release build scrolls the 10,000-row fixture with virtualization active.
  Confirm that offscreen rows are not all mounted. Reuse this fixture in option 5
  for frame-time and memory measurements. That plan owns the performance budget.
- Capture the final demo. Run the applicable local signoff checks on its final SHA.

## Implementation order

1. Confirm the local callback contract with a small typed fixture.
2. Compose the existing controls and implement each request state.
3. Add the delayed server adapter and failure tests.
4. Verify selection and accessibility on iOS and Android.
5. Measure the large fixture in release builds. Fix measured regressions.
6. Capture the demo and complete the guide and signoff.

Performance uses release builds because development mode changes JavaScript timing.
See the [React Native performance guide](https://reactnative.dev/docs/performance).
Option 5 owns the broader performance suite. This example only measures its own workload.

## Open evidence

No runtime code or performance result is included in this draft.
The interaction of SelectionMode and pressable table rows needs a prototype.
The native labels and horizontal scroll behavior need device checks.
