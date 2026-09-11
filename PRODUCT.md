# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

Two audiences, equally first-class:

- **Public React Native / Expo developers.** Building an Expo app, they find the library via npm or
  `ui.delacour.co.nz` and want components whose source they own, not a dependency they configure
  around. They evaluate on a phone (the playground via QR / deep link), then either run `delacour add`
  to copy source into their repo or `bun add delacour-react-native-ui@alpha`.
- **Delacour's own client projects.** The same kit reused across Delacour's consulting work, where the
  job is shipping a client app on a shared, documented component base.

The docs site's reader is a developer deciding whether to adopt, then looking up one component's
API and install steps. The playground has no users; it is the library's harness.

## Product Purpose

A React Native component library for Expo apps, styled with Uniwind (Tailwind v4 for React Native),
animated with Reanimated and the Gesture Handler API, with haptics via Pulsar and Skia charts.
Ships raw `.tsx` with no build step, and a CLI (`delacour`) that copies component source into the
consumer's repository the way shadcn/ui does on the web.

Success: a developer gets a component onto a phone in minutes, it feels native in motion and
feedback, and they can read exactly why every decision was made and change it in their own code.

## Positioning

- **Owned source, not a dependency.** The CLI copies the component's `.tsx` into your repo; the
  registry serves the library's own source, not a copy of it.
- **Compound parts, not prop bags.** Roots publish size, variant and foreground through context to
  dot-notation children and a `useX()` hook.
- **Your web theme is already your mobile theme.** `@delacour/design-system` shares the same token
  names and palette as the web customiser; `delacour theme` converts a web `globals.css` into the
  native `theme.css`.
- **Every decision is written down beside the code** — an `AGENTS.md` per component, enforced by
  `bun test`.
- **Motion that belongs on a phone.** Drag-or-tap switches, finger-following sheets, springs, haptics.
- Takes no framework dependency and no third-party component kit, and never references one.

## Operating Context

- Consumers run Expo SDK 57 dev clients; Expo Go is unsupported. Native module versions are pinned to
  the SDK's and declared as peers.
- Bun workspace + Turbo monorepo. Metro needs `linker = "hoisted"`.
- Docs at `ui.delacour.co.nz` (prod, `main`) and `ui.staging.delacour.co.nz` (`develop`), on Railway.
  Landing page at `/`, docs under `/docs/native/*` and `/docs/charts/*`, customiser at `/theme`.
- Component preview media is captured from an iOS simulator by `bun run previews` and committed;
  the docs site renders no live components.
- Playground ships through EAS; deep-link association files are served by the docs site.
- Releases via Changesets in alpha pre mode; publish is staged with npm OIDC and approved with 2FA.

## Capabilities and Constraints

- 20 components (Accordion, Badge, BottomSheet, Button, Checkbox, Chart, Field, Icon, Input,
  ListGroup, Pressable, Radio, Screen, Separator, Slider, Spinner, Switch, Tabs, Text,
  DelacourProvider), each a subpath export.
- Three component patterns: styled wrapper, compound + context, `tv()` variants.
- Charts: line, area, bar, scatter, candlestick, pie on the theme's five-colour ramp
  (`delacour-react-native-charts`, an optional peer).
- Design system axes: 7 neutral base ramps, 17 accents, 8 style geometries, 5 radii, 26 fonts;
  presets encode to a short shareable code.
- Unit tests cover pure logic only; renderer behaviour is verified in the playground on a simulator.
- Icons: Central Icons is the library's only icon set.
- Undecided: stable (non-alpha) release date; Android-specific design adaptations beyond what
  components already do.

## Brand Commitments

- **Name:** Delacour / Delacour UI. Published packages are unscoped (`delacour`,
  `delacour-react-native-ui`, `delacour-react-native-charts`); workspace-private ones are `@delacour/*`.
- **The mark's geometry is binding.** `packages/brand` is the sole source; every rendering derives
  from it. Do not restyle the logo.
- **NZ / British English is binding** across docs, code and copy: colour, licence, behaviour,
  customiser.
- **Voice:** plain, declarative, reasons-first. Every rule names the failure it prevents.
- Never name or allude to any third-party component kit as a reference or origin.

## Evidence on Hand

- Real component captures: `apps/web/public/previews/**` with `apps/web/src/previews/manifest.ts`.
- The playground app itself, reachable from the docs via QR / deep link.
- Per-component `AGENTS.md` files and the landing-page principles copy in `apps/web/src/routes/index.tsx`.
- **No real users, testimonials, customer logos, case studies, benchmarks or press exist.** The
  product is alpha. Never fabricate any of these.

## Product Principles

1. The consumer owns the code; the library optimises for being read and changed, not configured.
2. One scale, one radius, one palette: every size, corner and colour indexes a shared token.
3. Native feel is non-negotiable: gestures, springs and haptics, never a web pattern ported to a phone.
4. Accessibility is wired in, not opted in: roles, states and labels on every control; decorative
   elements hidden from assistive technology.
5. Documentation is part of the change; an undocumented component fails the build.

## Accessibility & Inclusion

Every control carries its role, state and label for VoiceOver and TalkBack; separators and purely
decorative elements are hidden from assistive technology. Reduced-motion handling is a per-component
concern and not yet a stated product-wide guarantee.
