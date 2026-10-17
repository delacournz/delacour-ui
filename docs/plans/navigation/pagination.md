# NAV-02 — Pagination

`import { Pagination } from "@delacour/react-native-ui/pagination";`

## Purpose on mobile

Moves through pages of a result set — an admin table, search results, an order history — when
infinite scroll is wrong (the reader needs to say "page 7"). The component owns the arithmetic
(which numbers to show, where gaps fall, what is disabled); the caller owns fetching and slicing.

## API

```tsx
<Pagination count={24} page={page} onPageChange={setPage} />

<Pagination count={24} variant="compact" size="sm" />

<Pagination count={24} page={page} onPageChange={setPage}>
  <Pagination.Summary>
    <Pagination.Status pageSize={20} total={472} />
  </Pagination.Summary>
</Pagination>
```

```ts
type PaginationVariant = "numbers" | "compact" | "simple";
type PaginationSize = "sm" | "md";

type PaginationProps = Omit<ViewProps, "children"> & {
  /** Total pages, numbered from 1. */
  count: number;
  page?: number;
  defaultPage?: number;                // default 1
  onPageChange?: (page: number) => void;
  variant?: PaginationVariant;         // default "numbers"
  size?: PaginationSize;               // default "md"
  siblings?: number;                   // default 1
  boundaries?: number;                 // default 1
  /** Show the previous/next arrows. */
  hasControls?: boolean;               // default true
  /** Pages jumped by tapping an ellipsis. */
  pageJump?: number;                   // default 5
  isDisabled?: boolean;
  haptic?: false | HapticFeedback;     // default "selection"
  accessibilityLabel?: string;         // default "Pagination"
  /** Leading content — e.g. Pagination.Summary. Controls go on the trailing edge. */
  children?: ReactNode;
  className?: string;
};

type PaginationItemProps = Omit<PressableProps, "children"> & { page: number; labelClassName?: string; className?: string };
type PaginationControlProps = Omit<PressableProps, "children"> & { hasLabel?: boolean; className?: string };
type PaginationEllipsisProps = Omit<PressableProps, "children"> & { direction: -1 | 1; className?: string };
type PaginationSummaryProps = ViewProps & { className?: string };
type PaginationStatusProps = TextProps & { page?: number; pageSize: number; total: number; className?: string };
```

Parts: `Pagination.Item`, `.Previous`, `.Next`, `.Ellipsis`, `.Summary`, `.Status`. Without
children the root renders the default run for its variant; parts read root context so they
never disagree with it.

## Pure logic (`pagination.variants.ts`) — write tests first

- `type PaginationToken = { kind: "page"; page: number } | { kind: "ellipsis"; direction: -1 | 1 }`
- `resolvePaginationRange({ count, page, siblings, boundaries })` → `PaginationToken[]`.
  **Fixed length**: always `2 * boundaries + 2 * siblings + 3` tokens when `count` exceeds that,
  so the number the reader aimed at does not move. An ellipsis that would hide exactly one page
  shows that page instead.
- `clampPage(page, count)` → integer in `[1, max(1, count)]`; `NaN` → 1.
- `resolveEllipsisTarget(page, direction, jump, count)` → clamped.
- `resolveControlState(page, count)` → `{ canPrevious: boolean; canNext: boolean }`.
- `resolvePaginationStatus({ page, pageSize, total })` → `{ from, to, total }` (`0–0 of 0` when empty).
- `formatPaginationStatus` and `formatCompact` (`"3 / 12"`), English defaults, overridable via a
  `labels` prop later — not in v1.
- `paginationVariants` slots: `root`, `run`, `item`, `itemLabel`, `control`, `controlLabel`,
  `ellipsis`, `compact`, `summary`, `status`; axes `size`, `isCurrent`, `isDisabled`.
  Current page: `bg-primary` + `text-primary-foreground`; others ghost, `text-foreground`.

## States

Current, pressed, disabled (whole root), control disabled at either end. A controlled `page`
outside `[1, count]` is rendered clamped and `onPageChange(clamped)` fires once in an effect.

## Accessibility

- Root: `accessibilityLabel` ("Pagination").
- Item: `accessibilityRole="button"`, label "Page 3", `selected` when current.
- Previous/Next: labels "Previous page"/"Next page", disabled state at ends.
- Ellipsis: label "Jump forward 5 pages" / "Jump back 5 pages".
- Compact: one element with `accessibilityRole="adjustable"` and `accessibilityActions`
  increment/decrement, value "Page 3 of 12".
- Every target ≥ 44×44; `sm` shrinks visuals and adds `hitSlop`.
- RTL: arrows mirrored.

## Motion

Current-page fill cross-fades (`withTiming` 150ms); snaps under reduce motion. No layout
animation — the run is fixed-width by design.

## Reuses

`Pressable`, `Text`, `Icon` (`IconChevronLeft`/`IconChevronRight`), `useControllableState`.

## Playground demos

`numbers` (hero, capture), `compact` (capture), `simple` (capture), `sizes` (capture),
`with-summary` (capture), `controlled-list` (slices a 470-row array), `disabled`.

## Acceptance

- [ ] `resolvePaginationRange` table-tested: count 0/1/5/7/24/100, page at start/middle/end,
      siblings 0–2, boundaries 0–2; length constant across pages for a given count.
- [ ] Ellipsis never hides a single page.
- [ ] Clamping for out-of-range controlled values.
- [ ] Controls disabled at the ends; whole component disabled via `isDisabled`.
- [ ] 44pt targets in `sm`.
- [ ] AGENTS.md, Components-table row, gen-exports, registry, demos, docs page, changeset.
- [ ] `bun test`, `bun run typecheck`, `bun run check` green.
