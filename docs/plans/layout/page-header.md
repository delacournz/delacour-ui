# PageHeader

An identity block for the top of a screen or the head of a list row: a cover (image or gradient), an avatar that overlaps its lower edge, a title block, actions and a stats strip. For a profile, a team, a venue, a playlist — anything that is a *someone* or a *somewhere* rather than a screen title.

Plan ID: LAYOUT-06
Folder: `packages/react-native-ui/src/components/page-header`
Import: `@delacour/react-native-ui/page-header`

## Purpose on mobile

The thing a user lands on after tapping a person or place: who it is, a picture, what they can do (Follow, Message), and three numbers. It scrolls with the content, sits at the top of a `Screen` scrollable's `header`, and can also render as a self-contained card inside a list.

Deliberately not:

- **A screen title.** That is `Screen.Navbar` (pinned, measured, safe-area aware, collapses a hairline) and `Screen.Header` (a bare titled block with a `gap-1`, no gutter, no chrome). `PageHeader` is the heavier, picture-led sibling. Use `Screen.Navbar` for the bar and `PageHeader` for the content under it.
- **A breadcrumb or a back control.** Navigation owns those; this component imports nothing from it.
- **A hero banner with copy and a call-to-action.** That is a marketing layout; compose `Card`/`Surface` by hand.
- **A data-fetching component.** It renders what it is given; stats are numbers the caller formats or lets it compact.

### Relation to `Screen.Header` — standalone, does not compose inside it

`Screen.Header` adds nothing but a `gap-1` block and optional safe-area `insets`; wrapping `PageHeader` in it would stack a second gutter-less view for nothing. `PageHeader` is passed to a scrollable's `header` prop directly, exactly where `Screen.Header` goes. It does not extend `Screen.Header` either: the two share no state and no tokens beyond `px-screen-gutter`, which `PageHeader` reads itself. A screen can use both — `Screen.Header` for a plain title screen, `PageHeader` for an identity screen — never both at once.

## API

```ts
export const PAGE_HEADER_VARIANTS = ["card", "page"] as const;
export const PAGE_HEADER_ALIGNS = ["center", "start"] as const;
export const PAGE_HEADER_STATS_LAYOUTS = ["stacked", "inline"] as const;

export type PageHeaderVariant = (typeof PAGE_HEADER_VARIANTS)[number];
export type PageHeaderAlign = (typeof PAGE_HEADER_ALIGNS)[number];
export type PageHeaderStatsLayout = (typeof PAGE_HEADER_STATS_LAYOUTS)[number];

export type PageHeaderProps = Omit<ViewProps, "children"> & {
	/**
	 * `card` is an isolated `Surface` — a row in a list of people. `page` has no surface and its
	 * cover bleeds to the screen edges, including under the status bar. Default `page`.
	 */
	variant?: PageHeaderVariant;
	/** Where the face and text sit. `center` over the cover's middle, `start` on the leading edge. Default `center`. */
	align?: PageHeaderAlign;
	children?: ReactNode;
};

type PageHeaderCoverProps = Omit<ViewProps, "children"> &
	(
		| {
				/** A picture. Drawn with RN `Image`, `resizeMode="cover"`, over the gradient. */
				source: ImageSourcePropType;
				colors?: never;
		  }
		| {
				source?: undefined;
				/** Two to four theme colour tokens or literals. Default: `primary` fading into `background`. */
				colors?: readonly [string, string, ...string[]];
		  }
	) & {
		/** Content height in points, excluding the top inset in `page`. Default 128. */
		height?: number;
		/** `page` only: include the safe-area top inset in the cover so the gradient never stops under the status bar. Default true. */
		isInsetAware?: boolean;
		/** Alt text. Absent → the cover is decorative and hidden from assistive tech. */
		accessibilityLabel?: string;
		/** Overlay, e.g. a back `Button` pinned top-left. Positioned by the caller. */
		children?: ReactNode;
	};

type PageHeaderAvatarProps = Omit<AvatarProps, "size"> & {
	/** Default `2xl` (96pt) in `center`, `xl` (64pt) in `start`. */
	size?: AvatarSize;
	/** Adds a verification rosette in the avatar's bottom-right corner. */
	isVerified?: boolean;
	/** Custom corner content instead of the rosette. Wins over `isVerified`. */
	badge?: ReactNode;
	/** Whether the avatar lifts over the cover. Default: true when a `PageHeader.Cover` is a sibling. */
	isOverlapping?: boolean;
};

type PageHeaderContentProps = Omit<ViewProps, "children"> & { children?: ReactNode };
type PageHeaderTitleProps = TextProps;        // Text.Title preset, one line, `numberOfLines={1}`
type PageHeaderDescriptionProps = TextProps;  // Text.Paragraph, muted, `numberOfLines` default 3
type PageHeaderActionsProps = Omit<ViewProps, "children"> & { children?: ReactNode }; // row, gap-2, wraps

type PageHeaderStatsProps = Omit<ViewProps, "children"> & {
	layout?: PageHeaderStatsLayout; // default "stacked"
	/** Hairline separators between items. Default false. */
	isDivided?: boolean;
	children?: ReactNode; // PageHeader.Stat
};

type PageHeaderStatProps = Omit<ViewProps, "children"> & {
	/** A number is compacted (`1.2K`); a string is drawn as given. */
	value: number | string;
	label: string;
	/** Makes the stat a `Pressable` (e.g. open followers list). */
	onPress?: () => void;
};

type PageHeaderMetaProps = Omit<ViewProps, "children"> & {
	/** A Central glyph, drawn through `Icon` at `sm`. */
	icon?: IconGlyph;
	children: ReactNode; // bare text is wrapped in Text.Caption, muted
};

export const PageHeader = Object.assign(PageHeaderRoot, {
	Cover: PageHeaderCover,
	Avatar: PageHeaderAvatar,
	Content: PageHeaderContent,
	Title: PageHeaderTitle,
	Description: PageHeaderDescription,
	Meta: PageHeaderMeta,
	Actions: PageHeaderActions,
	Stats: PageHeaderStats,
	Stat: PageHeaderStat,
	displayName: "DelacourUI.PageHeader",
});

export function usePageHeader(): PageHeaderContextValue; // { variant, align, hasCover, avatarSize, plane }
```

Every part is optional. Part order is the caller's source order; the root does not reorder or inspect children except one thing: `PageHeader.Cover` registers itself into context (`hasCover`) from a layout effect so `PageHeader.Avatar` knows to overlap — the same detect-by-context move the avatar uses for its group.

```tsx
<Screen>
  <Screen.Navbar placement="overlay" />
  <Screen.ScrollArea
    header={
      <PageHeader variant="page" align="center">
        <PageHeader.Cover source={{ uri: team.cover }} />
        <PageHeader.Avatar name={team.name} source={{ uri: team.logo }} isVerified />
        <PageHeader.Content>
          <PageHeader.Title>{team.name}</PageHeader.Title>
          <PageHeader.Meta icon={IconPin}>Auckland, NZ</PageHeader.Meta>
          <PageHeader.Description>{team.bio}</PageHeader.Description>
        </PageHeader.Content>
        <PageHeader.Actions>
          <Button>Follow</Button>
          <Button variant="secondary" size="icon-md" accessibilityLabel="Message"><Button.Label>…</Button.Label></Button>
        </PageHeader.Actions>
        <PageHeader.Stats isDivided>
          <PageHeader.Stat value={1234} label="Followers" onPress={openFollowers} />
          <PageHeader.Stat value={87} label="Posts" />
        </PageHeader.Stats>
      </PageHeader>
    }
  />
</Screen>
```

## Variants & sizes

One slotted `tv()` in `page-header.variants.ts`; slots `root`, `cover`, `coverFallback`, `avatarRing`, `content`, `title`, `description`, `meta`, `actions`, `stats`, `stat`, `statValue`, `statLabel`, `divider`.

| Axis | Values | Effect |
| --- | --- | --- |
| `variant` | `card` / `page` | `card`: root is `Surface` (`rounded-lg`, hairline, `overflow-hidden`, `padding="none"`), cover clipped by the corner, ring matches `bg-card`. `page`: no surface, cover full-bleed with no side gutter, ring matches `bg-background`. |
| `align` | `center` / `start` | `center`: column, `items-center`, text centred, actions and stats centred. `start`: avatar and text on the leading edge, stats left-aligned, actions `justify-start`. |
| stats `layout` | `stacked` / `inline` | `stacked`: value over label, **equal-width cells** (`flex-1`) so the middle stat stays under the title when labels differ in width. `inline`: `"1.2K Followers"` runs together, `gap-4`. |

Tokens (all semantic, no new tokens): `bg-card` / `bg-background` for the ring, `border-border` for dividers, `text-foreground`, `text-muted-foreground`, `px-screen-gutter` for page content, `rounded-lg` card corner, `size-icon-sm` meta icon. Cover gradient defaults to `primary` → `background` via `useThemeColor` (raw names, rule in AGENTS Theming) with the far stop built by `transparentOf` — never the `transparent` keyword.

Not adding a token. The cover height default (128) and ring width (4) are numbers because the overlap is computed at runtime (same reasoning as `AVATAR_SIZE_POINTS`): `PAGE_HEADER_COVER_HEIGHT`, `PAGE_HEADER_RING_WIDTH` live in `page-header.variants.ts`, pinned by a test against the `ring` slot's `p-1`.

**Avatar size change (cross-component, small).** `Avatar` tops out at `xl` (64). A profile face is ~96. Add `2xl: 96` to `AVATAR_SIZES` / `AVATAR_SIZE_POINTS` / the `face` slot with the existing size-pin test extended. This edits `avatar/` (and its AGENTS.md size line) and gets its own changeset line. Alternative if the owner of Avatar objects: `PageHeader.Avatar` passes `className="size-24"` and `size="xl"`; rejected because `AVATAR_SIZE_POINTS` would then lie about the edge and `Avatar.Group` maths and initials sizing would drift.

## States

- No controlled state; `PageHeader` is presentational. `PageHeader.Stat` is the only interactive part, and only when `onPress` is given (content-until-given-something-to-do, per Avatar/Badge).
- **Cover failing to load**: gradient is always painted, `Image` mounts over it (Avatar's rule) — no loading state, no empty box. `onError` is forwarded to the image.
- **Loading**: `PageHeader.Skeleton` is *not* added; callers swap parts for `Skeleton` (existing). A demo shows the recipe.
- **No cover / no avatar / no stats**: each degrades alone. No cover → avatar does not overlap, `page` variant adds `pt` = top inset only if `Screen` has no navbar (`useScreenContext() === null` or navbar `static`) so the avatar never sits under the status bar.
- **Disabled**: n/a. `isDisabled` on a `Stat` is inherited from nothing; omit.
- **Empty strings**: a `Title` with empty children renders nothing, so the layout does not leave a gap.

## Accessibility

- Root: `accessibilityRole="header"` is **not** put on the whole block (it would swallow the actions). Instead `PageHeader.Title` gets `accessibilityRole="header"` and `Cover` is `accessible={false}` / `importantForAccessibility="no-hide-descendants"` unless it has an `accessibilityLabel`.
- `PageHeader.Avatar` is the Avatar's single accessible element; `isVerified` appends `", verified"` to its label via a pure `resolvePageHeaderAvatarLabel`.
- `Stat` is one accessible element with label `"1,234 Followers"` (full number, `Intl.NumberFormat` with the locale default, *not* the compact string — compaction is visual only). A pressable Stat has `accessibilityRole="button"` and a hint is the caller's.
- Divider views are hidden from assistive tech (as `Separator`).
- Dynamic type: text scales; the avatar and ring are fixed points; stacked stats keep `flex-1` and allow two-line labels (`numberOfLines={2}`) rather than truncating at large font scales.
- Reduce motion: nothing here animates by default (see Motion), so nothing to calm.

## Motion

Static in v1. A card press uses `Pressable`'s own feedback when a `Stat` is pressable. No parallax, no stretch-on-overscroll: those need `Screen`'s `scrollY` shared value wired into an `Animated.Image` transform and a clamp worklet, and they belong in a follow-up opt-in (`<PageHeader.Cover stretch>`), written as a worklet reading `useScreen().scrollY`, gated by `useCalmMotion()`. Listed under Out of scope so v1 is not blocked on it.

## Reuses

`Surface` (card variant, plane context), `Avatar` (+ `Avatar.Badge`), `Text` presets, `Icon`, `Pressable` (pressable Stat, `haptic="selection"` default false), `Separator` hairline colour, `useThemeColor`, `transparentOf` (`lib/color.ts`), `cn`, `tv`, `expo-linear-gradient` (already a hard peer through `Screen.ScrollShadow`), `useSafeAreaInsets` (never `pt-safe` — resolves to zero on RN, see Screen AGENTS), `useScreenContext()` (nullable; for navbar placement), RN `Image`.

## New peer deps

None. The gradient is the existing `expo-linear-gradient` peer. Images are RN `Image` (no `expo-image`; that would be a new optional peer under `src/expo/` per rule 4 and is not worth it for one cover). Registry: `ITEM_META["page-header"]` needs no `dependencies` override — the import scan sees `expo-linear-gradient`, already in `PACKAGE_INSTALL` as `expo`.

## Cross-category dependencies

- **Breadcrumb / Navigation**: none; explicitly not depended on.
- **Overlays**: none.
- **Forms**: none. Follow/Message are caller-supplied `Button`s.
- **Media**: if Media ships an `Image`/`Gallery` with caching, `Cover` could adopt it later; v1 uses RN `Image`. Do not import from the Media branch.
- Inside `layout`: `PageHeader` reads `Screen`'s context (already merged). It does **not** need `Split`/`Structure` pieces from sibling plans.

## Pure logic to unit-test

All in `page-header.variants.ts` (no RN imports) + `page-header.utils.ts`; tests written first.

| Function | Input → expected |
| --- | --- |
| `resolvePageHeaderAvatarSize(align, size?)` | `("center")` → `"2xl"`; `("start")` → `"xl"`; explicit wins: `("start","lg")` → `"lg"` |
| `resolvePageHeaderOverlap({ avatarSize, ringWidth, hasCover, isOverlapping? })` | `("2xl", 4, true)` → `-(96/2 + 4)` = `-52` margin; `hasCover:false` → `0`; `isOverlapping:false` with cover → `0`; `isOverlapping:true` with no cover → `0` (nothing to lap) |
| `resolvePageHeaderCoverHeight({ variant, height, topInset, isInsetAware })` | `("page",128,59,true)` → `187`; `("page",128,59,false)` → `128`; `("card",128,59,true)` → `128` (card never extends under the status bar) |
| `resolvePageHeaderRing(variant)` | `"card"` → `bg-card`; `"page"` → `bg-background` (class strings; also asserts both tokens exist in both themes of `theme.css`) |
| `formatStatCount(n)` | `0`→`"0"`; `999`→`"999"`; `1000`→`"1K"`; `1234`→`"1.2K"`; `12500`→`"12.5K"`; `999_949`→`"999.9K"`; `999_950`→`"1M"` (rounds *up* across the boundary, never `"1000K"`); `1_250_000`→`"1.3M"`; `-5`→`"0"`; `NaN`/`Infinity`→`"–"`. Hand-rolled: Hermes' `Intl` compact notation is not guaranteed. |
| `resolveStatLabel(value, label)` | `(1234,"Followers")` → `"1,234 Followers"` (spoken); `("Top 5","Rank")` → `"Top 5 Rank"` |
| `resolvePageHeaderAvatarLabel(name, isVerified)` | `("Kate", true)` → `"Kate, verified"`; `(undefined, true)` → `"Verified"`; `("Kate", false)` → `"Kate"` |
| `pageHeaderVariants()` slot assertions | `card` root has `rounded-lg` and `overflow-hidden`; `page` root has neither; no variant emits `shadow-*`; no slot carries `self-*` or `dark:`; `title` slot owns `text-*` (rule 1), `root` does not; `align: center` → `items-center text-center`, `start` → `items-start`; stats `stacked` cell has `flex-1` |
| tokens | every token named in `PAGE_HEADER_*` exists in both variants of `theme.css` (use the shared `theme-tokens.test.ts` reader) |

## File map

```
packages/react-native-ui/src/components/page-header/
  AGENTS.md
  index.ts                       root, prop types, usePageHeader, pageHeaderVariants, constants
  page-header.tsx                Object.assign surface + root
  page-header-cover.tsx
  page-header-avatar.tsx
  page-header-content.tsx
  page-header-title.tsx
  page-header-description.tsx
  page-header-meta.tsx
  page-header-actions.tsx
  page-header-stats.tsx
  page-header-stat.tsx
  page-header.context.tsx        PageHeaderProvider, usePageHeader(), usePageHeaderContext(), usePageHeaderPart()
  page-header.types.ts           slot prop types shared by 2+ parts
  page-header.variants.ts        tv() + resolvers (above)
  page-header.variants.test.ts
  page-header.utils.ts           formatStatCount, resolveStatLabel, resolvePageHeaderAvatarLabel
  page-header.utils.test.ts
```

Plus: `avatar/` `2xl` step (variants, test, AGENTS.md), `src/components/…/AGENTS.md` Components table row in `packages/react-native-ui/AGENTS.md`, `package.json` exports via `bun run gen-exports`. Every part and the provider carry `DelacourUI.PageHeader.*` displayNames; the root's goes inside the assign.

## Playground demo

`apps/playground/src/demos/page-header/` — `index.ts` ordered barrel; route `apps/playground/src/app/(components)/page-header.tsx` (six-line `DemoGallery`); one row in the `ListGroup` in `src/app/index.tsx`; `bun run gen-demos`. Demos import only from `@delacour/react-native-ui/*`, `react`, `react-native`, peers.

| File | Shows | Capture |
| --- | --- | --- |
| `profile.tsx` | Cover image, avatar, title, meta, description, actions, stats | capture, **hero**, `align: stretch` |
| `gradient-cover.tsx` | No image, theme gradient, `isVerified` | capture |
| `aligned-start.tsx` | `align="start"`, inline stats | capture |
| `card-in-list.tsx` | `variant="card"` x2 in a column | capture, `align: stretch` |
| `stats.tsx` | stacked vs inline, divided, uneven label widths | capture |
| `no-cover.tsx` | Avatar + text only; skeleton recipe | gallery only |

`testID` on the cover, avatar and each stat. Labels from a `Record<PageHeaderStatsLayout, string>`.

## Docs page

`apps/web/content/docs/native/components/page-header.mdx` (frontmatter `title`, `description`, `icon`): hero `<Preview id="page-header/profile" title={null} />`; Installation (`<ComponentInstall name="page-header" />`); Usage; sections — Cover (image vs gradient, safe-area), Avatar and overlap, Alignment, Stats (stacked/inline/divided, why equal widths), Card variant in a list, Inside a Screen (header prop; not `Screen.Header`), Accessibility, API reference tables for every part. Add to `meta.json`.

Registry: `ITEM_META["page-header"] = { title: "Page Header", description: "A cover, an overlapping avatar, a title block, actions and stats — the head of a profile or place screen.", categories: ["layout"] }`. `PACKAGE_INSTALL`: no new classification (`expo-linear-gradient` already `expo`).

## Changeset

`@delacour/react-native-ui` **minor** — "Add PageHeader: a cover, overlapping avatar, title block, actions and stats; add Avatar `2xl`." (If Avatar's change should be separate, a second `patch`-level line; same file is fine.)

## Out of scope

- Parallax / stretch on overscroll, collapsing into the navbar on scroll.
- Breadcrumbs, back button, tabs under the header (use `Tabs`).
- Editing the cover or avatar (upload UI is Media/Forms).
- Follower-count fetching, relative formatting beyond `formatStatCount`, locale-specific compacting.
- A `PageHeader.Skeleton`.
- `expo-image` / blurhash.
- Wrapping inside `Screen.Header`.

## Acceptance checklist

- [x] `page-header.variants.test.ts` and `page-header.utils.test.ts` written first, failing, then passing (`bun test packages/react-native-ui/src/components/page-header`)
- [x] `avatar.variants.test.ts` extended for `2xl` and passing
- [x] `bun run typecheck` and `bun run check` clean; no `any`; no comments in JSX
- [x] Every part, provider and leaf has a `DelacourUI.PageHeader…` displayName (`display-name.test.ts` passes)
- [x] `page-header/AGENTS.md` written; row added to the Components table; `docs.test.ts` passes
- [x] `bun run gen-exports` run; `package.json` exports include `./page-header`
- [x] Demos list, route, home row, `bun run gen-demos`; `demos.test.ts` passes; six captured (two clips, four stills), hero `in-a-screen`
- [x] Docs page + `meta.json` entry; `ITEM_META["page-header"]`; registry rebuilt; install manifest and skill list regenerated
- [x] Changeset added
- [x] Simulator (agent-device on a warden-claimed iPhone 17): results in the component AGENTS.md **Verification** section. The card check found and fixed a page-coloured band across a card's cover
- [x] `agent-device close` and `warden release` on completion

## Deviations from this spec

- `PageHeader.Meta`'s `icon` is typed `IconComponent` (what `Icon` takes), not `IconGlyph` — the latter is `Icon`'s private proxy.
- `PageHeader.Cover`'s `colors` is a two-to-four tuple rather than `[string, string, ...string[]]`, so the fixed four `useThemeColor` lookups cover every case.
- The `cover` slot carries the variant's ground (`bg-card` / `bg-background`) and the default gradient fades into it, so a card's cover does not end in page colour.
- An extra gallery-only demo, `in-a-screen`, shows the header in a real `Screen.ScrollArea` under an overlay navbar.
- `PageHeader.Avatar` takes a `ringClassName` for the ring; `className` styles the avatar.
