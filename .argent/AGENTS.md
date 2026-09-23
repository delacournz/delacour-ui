# .argent — Simulator capture configuration

[argent](https://github.com/software-mansion/argent) drives the iOS simulator for
**component preview capture**: the pipeline that turns a demo in
[`apps/playground/src/demos`](../apps/playground/src/demos/AGENTS.md) into the MP4s and PNGs the
documentation site embeds.

Nothing here runs on its own. It is configuration and interaction scripts read by
`apps/playground/scripts/capture-previews.ts`, which is the thing you actually run:

```bash
bun run previews                       # from the repo root
bun run previews -- --only switch      # one component
```

## What is committed, and what is not

| Path | Committed? |
| --- | --- |
| `flags.json` | **Yes.** Two decisions the whole team needs — see below |
| `flows/previews/**.yaml` | **Yes.** The interaction scripts. They are source |
| `recordings/`, `reports/`, `artifacts/`, `tmp/`, `*.log` | No — per-run scratch, gitignored |
| `flows/__baselines__/` | No. Snapshot baselines are a QA-regression feature this pipeline does not use |

`recordings/` is the one that matters: argent writes raw device-native h264 there
(1206×2622), tens of megabytes per run. The capture script transcodes out of it and deletes the
source, but a crashed run leaves files behind. They are safe to delete.

## `flags.json` — two deliberate deviations from argent's defaults

Both are set at **project** scope, so a fresh clone inherits them and no one has to know:

```bash
argent disable video-watermark --scope project
argent enable disable-auto-screenshot --scope project
```

- **`video-watermark: false`.** On by default, argent stamps its own logo and
  "By @swmansion" into the bottom-left of **every** recording at 20% opacity. A centred stage crop
  would miss it, but a `frame: "device"` capture keeps the whole screen — so leaving this on would
  publish a third-party watermark into our documentation. The capture script asserts this in
  preflight rather than trusting the file.
- **`disable-auto-screenshot: true`.** By default every interaction tool round-trips a
  full-resolution screenshot. A capture run replays dozens of flows with several gestures each;
  that is minutes of pure waste per run, and none of those screenshots is ever read.

## The flows

One **fragment** per animated demo, at `flows/previews/<component>/<demo>.yaml`. A demo names
its flow through `meta.capture.flow`.

```yaml
executionPrerequisite: The chrome-free preview route is open on switch/tap-or-drag and settled.
steps:
  - tap: { id: switch-md }
  - wait: 500
  - tap: { id: switch-md }
```

**A fragment, never an e2e flow.** A flow whose first step is `launch:` restarts the app from
scratch — which would throw away the route and the theme the capture script has just navigated to
and set. A fragment runs against the device's current state, and is the only flow type allowed to
declare an `executionPrerequisite`: the human-readable contract describing what must already be on
screen. Write a real one. It is what an agent reads six months from now.

**What the flow owns, and what it does not.** A flow cannot loop, cannot be parameterised, and
cannot name the file its recording lands in — so it is not the pipeline. It owns exactly one thing:
*what the finger does*. The script owns the route, the theme, the recording, ffmpeg and the
manifest. That split is why a flow stays short enough to read.

### Rules

- **Target `id:` selectors, not coordinates.** A coordinate `tap` **passes with a warning** even
  when it lands on nothing, so a layout change would silently produce a video of a still screen.
  The demo sets a `testID`; the flow taps it. Drop to a raw `tool: gesture-custom` step only for a
  gesture the directives cannot express — a partial drag, a pinch — and even then anchor it to a
  known element.
- **End where you began.** The media loops. A flow that toggles a switch on and stops produces a
  clip that jump-cuts back to "off" at the seam. Toggle on *and* off.
- **Keep it under about three seconds.** The clip is an illustration, not a walkthrough.
- **No credentials, ever.** Use `{{secret:NAME}}` if one is ever needed; the YAML is committed.

### Which demos get a flow

Any captured demo whose component answers a touch. A still of a switch, a tab bar or a text field
shows what it looks like and nothing about how it feels, which is most of what a reader is deciding
on. Only the components with nothing to press — `Text`, `Badge`'s colour matrix, `Icon`,
`Separator` — stay stills.

A component that moves on its own gets a clip too: `spinner/sizes` and `button/loading` are flows
whose only step is a `wait:`. The flow is there to make the capture a recording, not to touch
anything.

### Patterns

| Interaction | How the flow writes it | Example |
| --- | --- | --- |
| Tap | `tap: { id: … }` | `tabs/variants/every-variant` |
| Press feedback | `long-press: { on: { id: … }, duration: 260 }` — a `tap` releases before the feedback shows | `button/variants` |
| Drag a thumb | `swipe: { from: { id: thumb }, by: { x: 0.4 }, momentum: false }`, then the same `by` negated | `slider/anatomy` |
| Page a pager | `swipe: { from: { id: … }, by: { x: -0.5 } }` | `tabs/swipe/swipeable-the-default` |
| Type | `tap` the field, then `tool: keyboard` with `{ text, delayMs }` | `input/states/live-validation` |
| Un-type | one `tool: keyboard` step with `{ key: backspace }` per character, then `{ key: enter }` so the field blurs as it began | `field/states/live` |
| A portal | `frame: "device"`, then `await: { visible: … }` on something inside it before acting | `bottom-sheet/anatomy/the-whole-composition` |

A typing demo has to **start empty and valid** for its clip to loop: `live-validation` and
`field/states/live` hold `""` and only flag a non-empty value with no `@`, so the flow types a name
(error), finishes the address (resolved), deletes it all and submits.

### Authoring one

Record it against a running preview rather than writing YAML blind — the recorder executes each
step live, so a step that does not work never reaches the file. The `argent-create-flow` skill has
the full procedure: `flow-start-recording` → `flow-add-step` per action → `flow-finish-recording`,
then polish the saved file into directive form.

Replay one on its own, with the preview route already open:

```bash
argent flow run .argent/flows/previews/switch/tap-or-drag.yaml --device <UDID> --json
```

## Two things that will waste an hour if you do not know them

**argent's "project" is the nearest `package.json`, not the repo root.** It walks up from the
current directory looking for `.git`, `.argent` or a `package.json`, and from `apps/playground` it
finds the playground. So `argent flags` run from there reports the **global** defaults and cannot
see this directory at all — the watermark check passes while the watermark is still on. Every
argent call in the capture script therefore runs with `cwd` at the repo root, and so should yours.

**A running app has no devtools bridge unless it was restarted.** argent injects the bridge at
process start, and that bridge is what resolves a flow's `id:` selectors against the full view
hierarchy. `launch-app` against an already-running process only foregrounds it, so the process
stays stale and every `tap: { id: … }` fails with *"No native-devtools-connected apps are available
for auto-targeting"* — and because a flow hard-stops on a failed directive, the rest is skipped.
Use `restart-app`, and check with:

```bash
argent run native-devtools-status --udid <UDID> --bundleId nz.co.delacour.ui.playground
```

`"state": "stale_process"` means exactly this. The capture script restarts the app once per run and
asserts the bridge is connected before it records anything — polling for up to 30 seconds while
argent reports `connecting`, because a dev client loading its bundle from Metro takes far longer to
open the bridge than a Release build does.

`"state": "unregistered"` is the other one: the app loaded argent's dylib but the tool-server never
saw it dial in, and no app restart changes that. `argent server stop && argent server start --detach`
does. The tool-server is shared by every argent session on the machine, so check nobody else is
mid-run first.

## Related

- [`apps/playground/src/demos/AGENTS.md`](../apps/playground/src/demos/AGENTS.md) — the demo contract
- [`apps/playground/AGENTS.md`](../apps/playground/AGENTS.md) — the capture script and the preview route
- [`apps/web/AGENTS.md`](../apps/web/AGENTS.md) — how the captured media reaches the docs
