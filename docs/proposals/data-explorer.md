# Data explorer proposal

Status: draft. This PR contains a plan and no runtime changes.
Base: `origin/develop` at `99570e94`. Review date: 2026-10-22.

Build one reusable example for customer lists, invoices, or inventory. The app owns the records and query state. The example shows how existing controls compose. It does not add a data grid or a new data layer.

## Existing parts

| Part | Existing support | Use in this change |
| --- | --- | --- |
| [Table](../../packages/react-native-ui/src/components/table/AGENTS.md) | Column layout, sort buttons, selected rows, horizontal scrolling, and `FlatList` row composition | Render the header and visible rows. Keep sorting, filtering, and paging in the app. |
| [SearchBar](../../packages/react-native-ui/src/components/search-bar/AGENTS.md) | Controlled text, immediate `onValueChange`, and `onDebouncedChange` | Keep the input value responsive. Run the query from the debounced callback. |
| [SelectionMode](../../packages/react-native-ui/src/components/selection-mode/AGENTS.md) | Controlled selection by string ID, select-all over supplied IDs, and actions that receive current IDs | Wrap each non-pressable `Table.Row` in `SelectionMode.Item` with `indicator="none"`. Pass selected state to `Table.Row` and an explicit `accessibilityLabel` to `SelectionMode.Item`. Omit `values` when selection spans pages; use a page-scoped app action for select-all. |
| [Pagination](../../packages/react-native-ui/src/components/pagination/AGENTS.md) | Controlled `page`, `count`, and `onPageChange`; reports a clamp when the count shrinks | Change the page through the app. Keep result fetching and slicing in the app. |
| [EmptyState](../../packages/react-native-ui/src/components/empty-state/AGENTS.md) | Empty content and actions | Distinguish no records from no query matches. Offer a reset action for no matches. |

The current Table demo already uses `FlatList` and passes `index` and `isLast` to `Table.Row`. Extend that composition. Do not add a virtual-list abstraction. The first delivery is an editable playground example and a guide. A screen installer is outside this plan.

## Behavior

The app owns the input value, applied query, sort key and direction, status filter, page, selected IDs, and request state. The example uses deterministic local data. A small delayed adapter demonstrates request ordering with the same app state. It uses no network endpoint, persistence, or query library. Assign each request an increasing ID when it starts. Only the newest requested ID may update rows, loading, or error state.

| Action or state | Required result |
| --- | --- |
| Search text changes | Update the field at once. Apply the query after `onDebouncedChange`. Reset to page one when the applied query changes. |
| Filter changes | Apply the filter and reset to page one. |
| Sort changes | Apply the key and direction. Use record ID as the local tie-breaker. |
| Page changes | Keep the applied query and sort. Let `Pagination` report a clamp when a smaller result count makes the current page invalid. |
| Select a row | Store its record ID. Use `SelectionMode.Item indicator="none"` so the 34-point leading indicator does not shift table rows away from the header. Pass `isSelected` to `Table.Row` for its selected tone. Give `SelectionMode.Item` an explicit `accessibilityLabel` for the row. Sorting, filtering, paging, and refetching do not change which ID is selected. |
| Select all | Keep `SelectionMode` without `values` so its header count covers the full selection. Add an app-owned button that adds the current page IDs to the controlled selection. Label it as page-scoped. Do not imply that it selects all server matches. |
| Hidden selections | Preserve selected IDs when the visible page or filter changes. Show the total selected count and provide a clear action. |
| Bulk action | `SelectionMode.Action` receives the selected IDs at press time. Disable repeat submission while pending. Clear IDs only after the app confirms success. |
| Bulk action fails | Keep the IDs selected. Show the error and allow a retry. |
| Initial loading | Show a loading state with an accessible name. |
| Refresh loading | Keep the previous rows labelled as stale. Keep the latest request loading until its own response succeeds or fails. |
| Empty result | Distinguish an empty dataset from a query with no matches. Offer a reset action for no matches. |
| Query fails | If the latest request fails, keep prior rows labelled as stale when available. Show its error and retry action. Ignore failures from older requests. |

The delayed adapter must ignore every response or failure whose request ID is not the newest requested ID, even when the newer request is still pending. An older success must not replace current rows or clear the newer loading state. An older failure must not replace the newer loading or error state. A missing ID on the current page does not mean that the record was deleted. The app owns any reconciliation of selected IDs with authoritative server data.

## Delivery map

| Area | Planned change |
| --- | --- |
| `apps/playground/src/demos/table/` | Add the example and a fixed 10,000-row local fixture. Keep the fixture and local query functions beside the demo. |
| `apps/playground/src/app/(components)/` | Expose the demo through the existing Table gallery. |
| `apps/web/content/docs/native/components/table.mdx` | Add the composition guide. Explain state ownership, callbacks, selection scope, and the delayed adapter. Link to the editable demo source. |
| `apps/playground/src/demos/registry.ts` | Regenerate demo metadata. |
| `apps/playground/e2e/previews/` | Add a focused interaction flow for selection, paging, and retry. Extend the existing harness where needed. |
| `apps/web/public/previews/` and `apps/web/src/previews/manifest.ts` | Capture and register the final demo preview from the final head. |
| Library components and registry | Change only for a reproduced defect in an existing public API. Any such change needs its own tests, registry update, and changeset. It is outside this example plan. |

Keep record and callback types local to the demo. Use the existing controlled `SelectionMode` props and `Pagination` props. Keep page-scoped select-all as a small app action; do not duplicate the selection component. Do not add a shared query hook, generic column schema, storage abstraction, export service, or new public API. Do not put sorting or fetching into `Table`.

## Acceptance checks

- Pure tests cover the local sort tie-breaker, page reset and clamp, selection by ID, stale response suppression, and bulk-action failure.
- The delayed adapter test starts requests A and B. If A succeeds while B is pending, it cannot replace the current rows or clear B’s loading state. Test both completion orders. Test that an older failure cannot replace B’s loading or error state.
- The example composes `SelectionMode.Item indicator="none"` around a non-pressable `Table.Row`. It passes selected state to `Table.Row` and an explicit `accessibilityLabel` to `SelectionMode.Item`. Tests confirm that IDs remain selected and row tones follow those IDs without a second press target or a 34-point header misalignment.
- An interaction test selects rows, sorts, changes pages, applies a filter, and confirms the same IDs remain selected. The visible count includes hidden selections. The app-owned select-all action names its current-page scope. The SelectionMode header reports the full selected count.
- Runtime acceptance for the future implementation includes narrow-screen horizontal scrolling, large text, VoiceOver, and TalkBack. Every column and action must remain reachable. Screen readers must announce the row label, selected state, column names, sort direction, loading state, and error action.
- Use the 10,000-row dataset for filtering, sorting, and paging. Render the current page through the existing `FlatList` composition. Shared performance measurements belong in the separate performance plan.
- Run the required CI checks for the final PR SHA. CI checks apply to this plan. Future runtime work must also complete the native acceptance checks above.

## Implementation order

1. Add a typed local fixture and compose `Table`, `SearchBar`, `SelectionMode`, and `Pagination` with app-owned state.
2. Implement the local filter, sort, page, selection, loading, and error behavior.
3. Add the delayed adapter and its out-of-order response test.
4. Add the interaction and accessibility checks that the existing CI harness supports.
5. Verify the implementation with VoiceOver, TalkBack, large text, and narrow-screen horizontal scrolling.
6. Add the guide and capture the final demo preview.
7. Run the required CI checks for the final PR SHA.

## Open evidence

No runtime code or performance result is included in this plan. The existing contracts support the composition. The preview and interaction harness must confirm that the selection wrapper works with the Table row. Native screen-reader and layout acceptance remains required for the future runtime implementation.
