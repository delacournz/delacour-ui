# demos — One component, on its own

A demo is the smallest renderable statement about a component: no navigation, no
heading, no explanation drawn on screen. Each one is a single `.tsx` file
exporting a `Demo` component and a `meta` object, and that one file feeds four
surfaces:

| Surface | What it uses |
| --- | --- |
| The playground gallery | `Demo` alone on its own page, with `meta.title` and `meta.align` |
| The capture route (`src/app/preview.tsx`) | `Demo` alone, centred, chrome-free |
| The published media | A screenshot or an MP4 of that route |
| The documentation snippet | The file's own source, minus `meta` |

That is the whole point of the arrangement. A caption cannot drift from the demo
it describes and a documented snippet cannot drift from the component that was
photographed, because in both cases there is nowhere else for them to be
written.

## Layout

```
src/demos/
├── types.ts                  DemoMeta, DemoCapture, DemoEntry — the contract
├── define-demo-group.ts      defineDemoGroup / concatDemoGroups
├── registry.gen-ish          registry.ts — GENERATED, do not edit
└── switch/
    ├── index.ts              the ORDERED barrel — hand-written
    ├── tap-or-drag.tsx
    └── colours.tsx
```

A component whose gallery splits into facets nests one level further —
`tabs/swipe/rubber-band.tsx`, id `tabs/swipe/rubber-band` — and its
component-level `index.ts` joins the facets with `concatDemoGroups`.

**`registry.ts` is generated and `index.ts` is not, and that split is
deliberate.** Order is editorial: the Switch gallery opens with the gesture and
ends with the edge cases, and no script can derive that. Completeness is
mechanical: a file in the folder is a demo, full stop. So the barrel is authored
and the registry is generated, and `demos.test.ts` checks that the two describe
the same set — which is what catches a demo added to the folder and never listed
for the gallery.

Regenerate with `bun run gen-demos`. `bun dev`, `bun ios` and `bun android` all
run it first, so a demo added on a branch cannot reach a device missing from the
map.

## Adding a demo

1. Write `src/demos/<component>/<name>.tsx`. Kebab-case: the filename becomes the
   demo's id, its deep link and its media path.
2. Add it to that folder's `index.ts`, **in the position it should be read**.
3. Run it: `bun dev`, then open the component's gallery.
4. Give it `meta.capture` only if its media belongs in the documentation.

## The rules

**Imports are restricted, and this is the load-bearing one.** A demo may import
only from `@delacour/native-ui/*`, `react`, `react-native`, the native peers, and
`@/demos/types`. Nothing else — not `@/components/section`, not `expo-router`,
not a helper two folders up. The source extractor **throws** on a violation,
because a demo that only resolves inside this repository has stopped
illustrating the library — a reader has to be able to write what they see.

**The file has a pinned shape**, in this order: imports, `export const meta`,
module-scope constants, module-scope helper components, and
`export function Demo(): ReactElement` **last**. The extractor cuts `meta` and
the types import out by byte range and keeps the rest verbatim — no re-printing,
because `sourceHash` is computed over it and a reformat would re-shoot every
demo. That source is **not** published: the documentation writes its own snippets
at the call site. A helper component and a `useState` are welcome; they are why
the unit is the whole file rather than a bare JSX fragment.

**No `GalleryScreen`, no `Section`, no scroll view.** A demo is the component
and nothing else. The gallery supplies the frame.

**`testID` anything a flow will touch.** Interaction for an animated demo lives
in an argent flow that targets elements by id, and a flow that cannot find its
target still reports success — so a missing `testID` produces a video of a
motionless screen rather than an error. See
[`.argent/AGENTS.md`](../../../../.argent/AGENTS.md).

**Keep the `.map()` over the library's exported tuples.** `SWITCH_COLORS.map(…)`
is why a colour added to the library shows up here with no edit — in the gallery
*and* in the published media. Writing the six out by hand breaks that quietly.

**Label from a `Record` keyed on the value's own type, never from the value.**
Rendering the mapped value put `destructive-soft` in front of a reader, in the
gallery and in the published card. A `Record<ButtonVariant, string>` beside the
demo is exhaustive, so a variant added to the library fails this file's
typecheck until someone writes its label — which is a better version of the rule
above rather than an exception to it: the new variant still cannot be forgotten,
and now it cannot arrive unreadable either.

```ts
const LABELS: Record<ButtonVariant, string> = {
	primary: "Primary",
	"destructive-soft": "Destructive Soft",
	// …
};
```

**Demos show the props, not the plumbing.** A demo earns its place by making one
visual axis legible — a variant, a colour, a size, a state, or a composition
someone would actually write. Interaction harnesses, scroll probes and
seven-way permutations of one prop belong in a test or in the component's
`AGENTS.md`, not in a gallery someone is paging through.

**Prose goes in `meta`, never on screen.** `caption` reads before the demo and
`note` after it.

**Neither is drawn in the playground any more.** The gallery is a pager — one
demo per screen, centred, nothing else on it — and a paragraph above a control
was outweighing the control. Keep writing them: they are what the documentation
site publishes beside the captured media, and they are the only place a demo
explains what it is asking you to look at. They simply have no reader on a
phone, so a demo that can only be understood through its caption is a demo that
needs rewriting rather than a caption that needs rendering.

**`meta.align` is how a demo sits on its page.** `stretch` is the default and
gives the demo the full content width — what every demo is authored against, and
what a container needs. Set `center` on a demo that is one small cluster of
controls: alone on a page of its own, a lone switch pinned to the left gutter
reads as a mistake rather than as a specimen. A container — `Accordion`,
`ListGroup`, `Field.Group`, `Tabs` — must stay `stretch`, because shrink-wrapping
collapses it to its narrowest row and drops the text out.

It falls back to `capture.align` before the default, so a curated demo that
already declared one for its published card does not restate it here.

## `meta.capture` is opt-in

A demo without it renders in the gallery and produces no files. The galleries
carry over two hundred sections between them; capturing every one in both themes
is tens of megabytes of PNG, most of it demos nobody would put in a document. So
galleries stay exhaustive and captured demos are curated — **four to six per
component**, one of them `hero: true` for the components index.

**There is no aspect ratio to pick.** The preview route measures where the demo
actually landed and publishes that rect, and the capture script crops to it plus
a fixed margin. So every card is framed alike whatever its height, and a demo
that grows a row keeps working — where a hand-tuned aspect would quietly start
clipping the top and bottom off the component instead of failing.

`capture.align` is the one layout choice, and it is the published card's, not
the gallery page's — see `meta.align` above for that one. It defaults the other
way round, to `center`, because a card is a composition in a way a page is not.
Set `capture.align: "stretch"` when the demo is a **container**: a shrink-wrapped
`ListGroup`, `Field.Group`, `Accordion` or `Tabs` collapses to its narrowest
content and drops the text out of its own rows. If a captured demo comes back
looking squashed, this is why.

`frame: "device"` keeps the whole screen instead of the demo's own bounds. Use
it for a demo that *is* a screen, and for anything that mounts into a portal:
`BottomSheet` renders outside the measured stage entirely, so cropping to those
bounds would frame an empty box.

Adding `flow` makes the demo animated — it is recorded and published as an MP4
with a poster instead of a still.

## Related

- [`../../AGENTS.md`](../../AGENTS.md) — the playground, the preview route and the capture script
- [`.argent/AGENTS.md`](../../../../.argent/AGENTS.md) — the interaction flows
- [`packages/native-ui/AGENTS.md`](../../../../packages/native-ui/AGENTS.md) — the components themselves
