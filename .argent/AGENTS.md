# .argent — the argent flows still in the tree

argent no longer drives anything this repository automates. Component preview capture runs on
warden: the specs are `apps/playground/e2e/previews/*.e2e.ts` and the pipeline is described in
[`apps/playground/AGENTS.md`](../apps/playground/AGENTS.md#capturing-preview-media). Do not call
argent's CLI, MCP tools or skills from here; `warden claim` and `warden ui` are how a simulator is
driven by hand.

What is left in this directory is YAML that two other things still read, kept until each is
ported:

| Path | Read by | Status |
| --- | --- | --- |
| `flows/store-*.yaml` | goldie — `goldie/goldie.config.ts` names each scene | In use for App Store assets; ports with goldie |
| `flows/qa/bottom-sheet/*.yaml` | Nobody automated — eight acceptance fragments from the BottomSheet rewrite, with their own `README.md` | **Follow-up:** convert to a warden `qa` suite with `apps/playground/scripts/previews/convert-flows.ts`, then delete |
| `recordings/`, `reports/`, `artifacts/`, `tmp/`, `*.log` | — | Per-run scratch, gitignored; safe to delete |

Two of argent's habits still shape these files and are worth knowing when porting them:

- **A fragment, never a launch.** None of these flows begins with `launch:`. A scene that needs the
  home screen opens `dlc-ui-playground:///`, which resets navigation in the running process; a QA
  fragment runs against the chrome-free preview route named in its `executionPrerequisite`. The
  warden equivalent is `device.openLink` on the same links.
- **`id:` selectors, not coordinates.** Each flow taps the `testID` the demo sets. A converted spec
  keeps that: `screen.getByTestId(id).tap()`, which fails when the id is not on screen rather than
  passing with a warning as argent's coordinate taps did.

## Related

- [`apps/playground/AGENTS.md`](../apps/playground/AGENTS.md) — the capture pipeline, the preview route and the warden suite
- [`apps/playground/src/demos/AGENTS.md`](../apps/playground/src/demos/AGENTS.md) — the demo contract
- [`goldie/`](../goldie) — the store scenes these `store-*.yaml` flows belong to
