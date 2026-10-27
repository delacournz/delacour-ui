# Data explorer

The Table gallery contains an invoice explorer with 10,000 fixed records.
It uses Table, SearchBar, SelectionMode, Pagination, and FlatList.
It adds no library API or dependency.

Open the Table gallery and select **Data explorer**.
You can also open `dlc-ui-playground://preview?component=table&demo=data-explorer&theme=dark`.

The app owns the query, records, page, request state, and selected IDs.
Search uses a 300 ms debounce.
Search, filters, and sorting reset the page.
Record IDs break sort ties.
Selection stays with IDs across query changes.
**Select page** affects only the current page.
The header counts all selected IDs.

The delayed local adapter ignores old responses and failures.
It keeps prior rows visible with a stale label during a refresh or failure.
**Test request error** fails the next request.
The first archive attempt fails and preserves selection.
A retry removes records and clears selection after success.
**Reset example** cancels pending work and restores the fixture.

Pure model tests cover query changes, page clamping, selection, request ordering, and bulk failures.
The source extraction test checks that the published example includes the model.
The Warden `data-explorer` suite checks query changes, selection, pages, and retries.
Run it with `bunx warden e2e data-explorer` from `apps/playground` on a configured Mac.

Tests and builds must run in CI for this change.
Native acceptance and preview capture remain pending.
Check horizontal scrolling, large text, VoiceOver, and TalkBack before approval.
The demo does not publish preview media until a real capture is available.
