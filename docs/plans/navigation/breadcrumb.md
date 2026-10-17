# NAV-01 — Breadcrumb

`import { Breadcrumb } from "@delacour/react-native-ui/breadcrumb";`

## Purpose on mobile

A path to the current screen — `Settings › Account › Security` — shown at the top of a deep
detail screen or a file browser. Every crumb before the last navigates back to that level; the
last is the current page and is plain text. On a phone width is scarce, so a long trail
collapses its middle into an ellipsis crumb.

## API

```tsx
<Breadcrumb size="md">
  <Breadcrumb.List maxItems={4} onEllipsisPress={(hidden) => openSheet(hidden)}>
    <Breadcrumb.Item>
      <Breadcrumb.Link onPress={() => router.navigate("/")}>Home</Breadcrumb.Link>
    </Breadcrumb.Item>
    <Breadcrumb.Item>
      <Breadcrumb.Link onPress={goSettings}>Settings</Breadcrumb.Link>
    </Breadcrumb.Item>
    <Breadcrumb.Item>
      <Breadcrumb.Page>Security</Breadcrumb.Page>
    </Breadcrumb.Item>
  </Breadcrumb.List>
</Breadcrumb>
```

```ts
type BreadcrumbSize = "sm" | "md";

type BreadcrumbProps = ViewProps & {
  size?: BreadcrumbSize;              // default "md"
  /** Replaces the chevron between crumbs. */
  separator?: ReactNode;
  className?: string;
};

type BreadcrumbListProps = ViewProps & {
  /** Collapse when the item count exceeds this. Unset = never collapse. */
  maxItems?: number;
  itemsBeforeCollapse?: number;       // default 1
  itemsAfterCollapse?: number;        // default 1
  /** Makes the ellipsis a button. Receives the hidden items' indices. */
  onEllipsisPress?: (hiddenIndices: readonly number[]) => void;
  /** Horizontal scroll instead of collapse/wrap. */
  overflow?: "wrap" | "collapse" | "scroll"; // default: "collapse" when maxItems set, else "wrap"
  className?: string;
};

type BreadcrumbItemProps = ViewProps & { className?: string };
type BreadcrumbLinkProps = Omit<PressableProps, "children"> & {
  children: ReactNode; textClassName?: string; className?: string;
};
type BreadcrumbPageProps = TextProps & { className?: string };
type BreadcrumbSeparatorProps = ViewProps & { children?: ReactNode; className?: string };
type BreadcrumbEllipsisProps = ViewProps & { className?: string };
```

`Breadcrumb.Separator` and `Breadcrumb.Ellipsis` are public for custom layouts, but `List`
inserts separators automatically (the way `Steps` derives its connectors) — the caller never
writes one between items. A manually placed `Separator` child is respected and suppresses the
automatic one beside it.

## Pure logic (`breadcrumb.variants.ts`)

- `resolveBreadcrumbCollapse({ count, maxItems, before, after })` →
  `{ kind: "all" } | { kind: "collapsed"; visibleBefore: number[]; hidden: number[]; visibleAfter: number[] }`
  (discriminated union). Never collapses when `count <= maxItems`; clamps `before + after` so at
  least one item is hidden and at least the last item stays; `before`/`after` < 0 → 0.
- `resolveBreadcrumbSeparatorGlyph(isRTL)` → `IconChevronRight` vs `IconChevronLeft`.
- `breadcrumbVariants` — slots `root`, `list`, `item`, `link`, `linkLabel`, `page`, `separator`,
  `ellipsis`; `size` axis: `sm` → `Text` caption step, icon `icon-xs`; `md` → body step, `icon-sm`.
- Colour: link label `text-muted-foreground`, page `text-foreground font-medium`, separator glyph
  token `muted-foreground` (assert both the class and token exist in `theme.css`).

## States

- Link pressed: `Pressable`'s scale/opacity; label underline is **not** used (mobile).
- Link `isDisabled`.
- Ellipsis: static `View` when `onEllipsisPress` absent, `Pressable` when present.

## Accessibility

- `List` root: `accessibilityRole="none"`, `accessibilityLabel="Breadcrumb"` (overridable).
- Link: `accessibilityRole="link"`, name = its text.
- Page: `accessibilityRole="text"`, `accessibilityState={{ selected: true }}`, value "current page".
- Separators: `accessibilityElementsHidden` + `importantForAccessibility="no-hide-descendants"`.
- Ellipsis button: label "Show N hidden levels".
- All links hit-slopped to 44pt height.

## Motion

None beyond `Pressable`'s press feedback.

## Reuses

`Pressable`, `Text`, `Icon` (+ Central chevrons, `IconDotGrid1x3Horizontal` or nearest "more"
glyph), `cn`, `tv`.

## Decisions

- No `asChild`/router coupling: links take `onPress` (rule 4: no navigation dependency).
- Counting items walks direct children of `List` via `Children.toArray` (like `Steps`); an item
  behind a wrapper is not counted and dev-warns.
- Overflow `scroll` renders a horizontal `ScrollView` that scrolls to the end on mount so the
  current page is visible.

## Playground demos

`basic` (hero, capture), `sizes` (capture), `custom-separator` (capture), `collapsed` with
`maxItems` (capture), `ellipsis-sheet` (ellipsis opens a `BottomSheet` listing hidden crumbs),
`scroll-overflow` (capture).

## Acceptance

- [ ] `resolveBreadcrumbCollapse` covers: no max, count ≤ max, count > max, before/after
      overflow, zero/negative before/after.
- [ ] Automatic separators between every pair, none after the last.
- [ ] Last crumb is non-pressable and announced selected.
- [ ] RTL flips chevrons.
- [ ] Separators hidden from VoiceOver.
- [ ] AGENTS.md, Components-table row, gen-exports, registry, demos, docs page, changeset.
- [ ] `bun test`, `bun run typecheck`, `bun run check` green.
