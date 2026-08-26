# demos — One component, on its own

A demo is the smallest renderable statement about a component: no navigation, no
heading, no explanation drawn on screen. Each one is a single `.tsx` file
exporting a `Demo` component and a `meta` object, and that one file feeds four
surfaces:

| Surface | What it uses |
| --- | --- |
| The playground gallery | `Demo` inside a `Section`, with `meta.title` and `meta.caption` |
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
not a helper two folders up. The snippet extractor **throws** on a violation
rather than publishing it, because the published snippet has to compile when
somebody pastes it into their own app, and an import of `@/components/anything`
does not.

**The file has a pinned shape**, in this order: imports, `export const meta`,
module-scope constants, module-scope helper components, and
`export function Demo(): ReactElement` **last**. The extractor cuts `meta` and
the types import out by byte range and publishes the rest verbatim — no
re-printing, so the snippet keeps the exact formatting Biome gave the file.
A helper component and a `useState` are welcome; they are why the unit is the
whole file rather than a bare JSX fragment.

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

**Prose goes in `meta`, never on screen.** `caption` runs above the demo and
`note` below it, so a gallery can explain before it shows or after. Neither
appears in the captured media, which is the component alone.

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

`align` is the one layout choice. It defaults to `center`, which shrink-wraps
the demo — right for a row of switches or a colour matrix. Set
`align: "stretch"` when the demo is a **container**: a shrink-wrapped
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
