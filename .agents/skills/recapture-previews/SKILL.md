---
name: recapture-previews
description: Recapture the documentation preview media (apps/web/public/previews/** and apps/web/src/previews/manifest.ts) for every component a branch changed visually, review it, commit it, and embed the before/after in the pull request. Use when asked to "recapture previews", "update preview media", "refresh the previews", "regenerate previews", or when a component "looks different" — and use it unprompted after any change to packages/react-native-ui, an engine package, apps/playground/src/demos or apps/playground/e2e/previews that can alter pixels, and before opening a pull request (including through dlc-pr) on such a branch.
---

# Recapture previews

The rule this skill serves is in the root `AGENTS.md`, under Conventions: a change that can move a
component's pixels recaptures its previews **in the same branch, before the pull request opens**,
and the pull request embeds them **when it is created**. The capture pipeline itself is documented
in `apps/playground/AGENTS.md`, "Capturing preview media" — read it before debugging a capture.

Run everything from the repo root.

## 1. Find the affected components

```bash
bun run previews:affected            # against origin/develop, working tree included
bun run previews:affected -- --json  # { kind, components[{ name, via }], force, command }
```

It walks the import graph backwards from every changed file, so a Button change also lists the
Dialog that renders one, and an engine change lists the component that skins it. `kind: "all"`
means the capture harness or a stylesheet changed: that is a full `--force` run, which rewrites
every preview — **ask the user before running it**.

The list over-approximates — an import says a file *can* move pixels. Drop a component only when
the change provably cannot alter any of its captured demos: tests, fixtures, markdown, types-only
edits, comments, logic no demo exercises (an `onChange` payload, an accessibility label). When in
doubt keep it; an unchanged picture costs one run.

A component's captured demos are the ones in `apps/playground/src/demos/<name>/` whose `meta` has a
`capture` block; its interactions are `apps/playground/e2e/previews/<name>.e2e.ts`. `--only` takes a
component (`button`) or one demo id (`button/variants`), comma-separated.

## 2. Plan, then capture

```bash
bun run previews -- -- --only <list> --force --dry-run     # the plan and the warden command, runs nothing
bun run previews -- -- --only <list> --force --headless    # capture
```

- **Two `--`.** The root script is turbo; one `--` and turbo eats `--only`.
- **`--force`** because a demo's hash covers the demo, not the component — without it an incremental
  run skips every demo whose own file did not change. Leave it off only when the demo or spec itself
  is what changed (`previews:affected` prints `force: false` then).
- **warden owns the simulator.** The script calls `warden e2e previews`, which claims a device,
  builds or reuses the app and runs Metro. Never start Metro, boot a simulator, touch `simctl`, or
  export `WARDEN_*` yourself. Add `--count 2` to share a long list across two simulators.

## 3. Read failures

A demo with no fragment, or whose hash moved, fails the run by name and keeps its old entry. The
script prints warden's batch directory; read, in order:

1. `screen-at-failure.txt` — what was on screen when a step failed
2. `results.jsonl` / `e2e-report.json` — which spec and step
3. the Metro and device logs beside them

The symptom table under "If a capture looks wrong" in `apps/playground/AGENTS.md` covers the common
causes (a container needing `capture.align: "stretch"`, a portal needing `frame: "device"`, a
`testID` on a wrapper). Fix a missing `testID` in the component, not with retries.

## 4. Review what changed

A green run is not a correct picture. Look at every regenerated file:

```bash
git status --short apps/web/public/previews apps/web/src/previews/manifest.ts
```

Read each changed `light.png` / `dark.png` with the Read tool, and compare it with the base copy
(`git show origin/develop:<path> > <scratch>/before.png`). For a clip, `bun run previews:verify --
-- --only <list> --no-capture` writes a contact sheet per `.mp4` and a pixel-diff report to
`apps/playground/.previews/verify/` without capturing again — its exit 1 on a moved still is
expected when the change was meant to move it; a `missing` or failed row is not.

Check the change is the one intended, in both themes, and that nothing else moved. A preview that
moved without a reason is a regression, not churn.

## 5. Commit

Commit the media and the manifest with the change that moved them, or straight after it — the squash
merge folds them into one commit either way:

```bash
git add apps/web/public/previews apps/web/src/previews/manifest.ts
git commit -m "🎨 style(react-native-ui): recapture <components>' previews after <change>"
```

Match the repo's commit style (`git log --oneline -- apps/web/public/previews`) — gitmoji, type,
scope, no trailers. Say "and recapture its previews" in the pull request title when the change is
visual, as earlier ones do.

## 6. Embed in the pull request, at creation

Push first: the table's URLs name commit SHAs, and GitHub must have them.

```bash
git push -u origin HEAD
bun run previews:pr-table > <scratch>/previews.md
```

Paste that table into the **Screenshots** section of `.github/pull_request_template.md`'s body
before the pull request is created — `gh pr create --base develop --body-file …`, or hand it to the
`dlc-pr` skill as part of the body. Each row is the merge base's copy beside the head's, pinned to
full SHAs, so camo can never show a stale picture; a clip is its poster plus a `▶ clip` link.
A long table goes inside `<details><summary>Previews (n)</summary>` … `</details>`.

**A later push that recaptures again regenerates the table and edits the body in the same push**
(`gh pr edit --body-file`). The old SHAs still resolve, but they show a branch that no longer exists.

Then sign off as usual (`bun run signoff`) — the media is part of the signed tree.
