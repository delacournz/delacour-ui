# Post — design spec

A social card: an author, a body, optional media and the counts underneath, with the counts animated.
Compound root plus `Post.Header`, `Post.Author`, `Post.Community`, `Post.Action`, `Post.Title`, `Post.Body`,
`Post.Media`, `Post.Footer`, `Post.Stat`, `Post.Votes`.

`import { Post } from "@delacour/react-native-ui/post";`

## 1. Purpose on mobile

- **A feed row is one object with several tap targets.** The card opens the thread; the avatar opens a profile; the heart
  likes; the ellipsis opens a menu. Post owns the layout and the press look of each, never the data.
- **Four shapes, one set of parts.** `feed` (full card), `vote` (score pill + headline, ranked community), `compact`
  (name and handle on one line, no media, timeline row), `media` (picture is the card, author laid over it). The variant
  decides padding, media shape and where the author sits, not which parts exist, so changing shape is a prop change.
- **Nothing is counted here.** `active`, `value`, `vote`, `score` are all caller state. An optimistic like and the server's
  answer are two values only the app can reconcile; Post owns what a press looks like.
- **Does not translate from the web:** hover cards, right-click menus, text-selection popovers, hover-revealed actions,
  inline `<a>` hashtags (replaced by a tokenised `Text` with `onPress`), `<time>` elements, keyboard focus rings.
- **Does translate with a native twist:** light haptic on toggle, scale press feedback, count roll animation, a
  scrim gradient (`expo-linear-gradient`) so white type survives a bright photo, long-press on the card for caller-owned
  actions.

## 2. Public API

```ts
import type { ComponentType, ReactNode } from "react";
import type { ImageSourcePropType, ViewProps, TextProps, ImageProps } from "react-native";
import type { PressableProps } from "@delacour/react-native-ui/pressable";
import type { IconProps } from "@delacour/react-native-ui/icon";

export type PostVariant = "feed" | "vote" | "compact" | "media";
export type PostSize = "default" | "sm";
export type PostVote = "up" | "down" | null;
export type PostStatTone = "neutral" | "like" | "save" | "repost";
export type PostMediaScrim = "none" | "top" | "bottom" | "both";

export type PostProps = Omit<PressableProps, "asChild" | "children"> & {
	variant?: PostVariant; // "feed"
	size?: PostSize; // "default"
	/** Opens the post itself. Inner parts keep their own presses. Omit and the root is a plain View. */
	onPress?: PressableProps["onPress"];
	children?: ReactNode;
	className?: string;
};

export type PostHeaderProps = ViewProps & { className?: string };

export type PostAuthorProps = Omit<ViewProps, "children"> & {
	name: string;
	handle?: string; // "@ada" — inline in compact, second line elsewhere
	/** Used when `date` is given and `timestamp` is not. */
	date?: Date;
	/** Caller wording wins over `date`. */
	timestamp?: string;
	avatar?: ImageSourcePropType;
	fallback?: string; // initials override, passed to Avatar
	verified?: boolean;
	onPress?: PressableProps["onPress"]; // profile
	/** Injected clock for stories/tests; defaults to Date.now. */
	now?: Date;
	className?: string;
};

export type PostCommunityProps = Omit<ViewProps, "children"> & {
	name: string; // "r/reactnative"
	avatar?: ImageSourcePropType;
	meta?: ReactNode; // "5h ago · u/ada"
	onPress?: PressableProps["onPress"];
	className?: string;
};

export type PostActionProps = Omit<PressableProps, "asChild"> & {
	/** Required: an icon-only control has no other name. */
	accessibilityLabel: string;
};

export type PostTitleProps = TextProps & { className?: string };

export type PostBodyProps = Omit<TextProps, "children"> & {
	children: string | ReactNode; // a string is tokenised; a node is rendered as-is
	numberOfLines?: number;
	/** Shows a "more" affordance when the body is clamped and overflows. */
	expandable?: boolean;
	onTagPress?: (tag: string) => void; // without the leading #
	onMentionPress?: (handle: string) => void; // without the leading @
	onLinkPress?: (url: string) => void;
	className?: string;
};

export type PostMediaProps = Omit<ViewProps, "children"> & {
	source?: ImageSourcePropType;
	alt?: string; // empty string = decorative
	aspectRatio?: number; // 16 / 10
	scrim?: PostMediaScrim; // variant "media" => "top"
	onPress?: PressableProps["onPress"];
	/** Replaces the Image. The frame, corners, aspect ratio and scrim stay. This is the slot for galleries/viewers. */
	children?: ReactNode;
	imageProps?: Omit<ImageProps, "source" | "accessibilityLabel">;
	className?: string;
};

export type PostFooterProps = ViewProps & { className?: string };

export type PostStatProps = Omit<PressableProps, "asChild" | "children"> & {
	/** The component, not an element: it is re-rendered with `filled` on toggle. */
	icon: ComponentType<IconProps & { filled?: boolean }>;
	value?: number | string;
	tone?: PostStatTone; // "neutral"
	active?: boolean; // false
	/** "end" pushes this stat and everything after it to the trailing edge. */
	align?: "start" | "end"; // "start"
	/** Spoken noun: "likes". Composes the a11y label with the value. */
	label: string;
	/** Compact formatting of numeric values: 1234 -> "1.2K". Default true. */
	compact?: boolean;
	className?: string;
};

export type PostVotesProps = Omit<ViewProps, "children"> & {
	score: number | string;
	vote?: PostVote;
	onVote?: (next: PostVote) => void; // pressing the cast arrow reports null
	isDisabled?: boolean;
	className?: string;
};

export type PostContextValue = {
	variant: PostVariant;
	size: PostSize;
};
export function usePost(): PostContextValue; // throws outside <Post>
```

Parts are never re-exported from `index.ts`; `index.ts` exports `Post`, the prop/union types, `usePost`, `postVariants`
and the pure helpers (`formatCompactCount`, `formatRelativeTime`, `tokenizePostBody`).

## 3. File map

`packages/react-native-ui/src/components/post/`

| File | Holds |
| --- | --- |
| `index.ts` | -> `@delacour/react-native-ui/post` |
| `post.tsx` | Root, `Object.assign` surface, `displayName: "DelacourUI.Post"` |
| `post-header.tsx`, `post-author.tsx`, `post-community.tsx`, `post-action.tsx` | the header row parts |
| `post-title.tsx`, `post-body.tsx`, `post-media.tsx`, `post-footer.tsx` | content parts (`post-body` owns the tokenised renderer) |
| `post-stat.tsx`, `post-stat-count.tsx` | stat press target; `post-stat-count` is the internal animated number leaf (`DelacourUI.Post.Stat.Count`) |
| `post-votes.tsx` | score pill with two arrows |
| `post.context.tsx` | `PostProvider`, `usePost()`, `usePostPart()` (leaf, imports only React) |
| `post.types.ts` | only types shared by 2+ files (`PostSlotProps`, `PostVote`, `PostStatTone`) |
| `post.variants.ts` | slotted `tv()`, `resolvePostLayout`, `resolveStatTone`, `resolveMediaScrim`, `resolveNextVote`, `resolveStatDirection` |
| `post.variants.test.ts` | |
| `post.utils.ts` | `formatCompactCount`, `formatRelativeTime`, `tokenizePostBody`, `resolvePostStatLabel`, `resolveBodyClamp` |
| `post.utils.test.ts` | |
| `AGENTS.md` | design decisions, each bullet "bold claim, then the failure it prevents" |

## 4. Variants & sizes

One slotted `tv()` (`postVariants`) with slots: `root`, `header`, `author`, `authorName`, `authorHandle`,
`authorMeta`, `community`, `action`, `title`, `body`, `bodyTag`, `media`, `mediaImage`, `mediaScrim`, `footer`,
`stat`, `statIcon`, `statValue`, `votes`, `voteArrow`, `voteScore`.

Axes:

- `variant` — `feed | vote | compact | media`. `feed`: `gap-3 py-4`, media inset with `rounded-xl`, 16:10.
  `vote`: score pill leading the footer, title in `Text.Subheader` weight. `compact`: `gap-2 py-3`, no media slot
  rendered (a test asserts `media` is `hidden` there, and `Post.Media` returns null with a dev warning), handle inline.
  `media`: root `overflow-hidden rounded-lg`, header `absolute` over the picture, text on `text-white`
  (the one place a raw foreground is justified: type on a photograph has no theme surface; document it).
- `size` — `default | sm`. `sm` steps type one preset down and gaps one step; avatar `sm`->`xs`.
- `tone` (stat) — `neutral | like | save | repost`. Lit: `like -> text-destructive`, `save -> text-primary`,
  `repost -> text-success`; unlit `text-muted-foreground`. Compound variants `{ active, tone }`.
- `surface`: the root is a `Surface`-style card: `bg-card border border-border rounded-lg`; `media` has no border.
  Do not use `dark:` or raw palette classes (rule 11).

Text colour goes on the `Text` (rule 1): `authorName text-foreground`, `authorHandle text-muted-foreground`.
Icon size by class (`size-icon-sm`), colour via `Icon`/`useThemeColor`.

## 5. States

- Root: rest, pressed (`feedback="fade"`), `isDisabled` (not announced as interactive).
- Stat: rest, pressed, `active`, disabled, numeric-changing (roll animation), `value` absent (icon only).
- Votes: none, up, down, disabled. Pill tints with the cast arrow: arrow alone is too small to notice.
- Body: collapsed (clamped, overflowing, "more" shown), expanded, short (no affordance).
- Media: loading (muted fill under the image), failed (muted fill + `ImageIcon` glyph, keeps aspect ratio),
  loaded.
- Author: with/without avatar (Avatar fallback initials), verified.

## 6. Accessibility

- **A card with an `onPress` is `accessibilityRole="button"` and merges nothing.** Inner controls stay separate
  focus stops; a swallowed group would hide like/reply from VoiceOver. When there is no `onPress`, the root is a plain
  `View` with `accessible={false}`.
- **Stats announce noun and number together:** `"Like, 216"`, state via `accessibilityState={{ selected: active }}`
  and role `button`. `resolvePostStatLabel(label, value, compact)` builds it from the *raw* number, so `1.2K` is spoken
  as "1,234", not "one point two K".
- **Votes** are two buttons labelled "Upvote" / "Downvote" with `accessibilityState={{ selected }}`, inside a group
  labelled `"Score 1,240"`. The score carries `accessibilityLiveRegion="polite"` so a change is read once.
- **Media**: `alt` -> `accessibilityLabel`, role `image`; `alt=""` => `accessible={false}` (decorative).
- **Timestamp** reads as words ("3 minutes ago"), not "3m": `resolveAuthorA11yLabel`.
- **Body links**: tags and mentions are `accessibilityRole="link"`.
- **Reduced motion**: the count roll and icon pop are behaviour, not decoration, so they follow the OS setting only
  (`ReduceMotion.System` on the layout animations; instant value swap when on). They do not consult `useCalmMotion`,
  which is for endless loops; Post has none.
- Touch targets >= 44pt: `Post.Stat` and `Post.Action` use `hitSlop` to reach 44 without growing the layout.

## 7. Motion

- **Count roll.** `PostStatCount` keys the number on its value; `entering` is `SlideInDown` (value rose) or `SlideInUp`
  (value fell) with a short fade, `exiting` is a fade only. Direction comes from `resolveStatDirection(prev, next)` using
  a `usePrevious`-style ref; only the arriving half carries direction (the leaving half was rendered before the change
  was known). Non-numeric values cross-fade (`FadeIn`/`FadeOut`).
- **Icon fill.** `filled` swaps the same glyph, with a one-shot scale pop (`withSpring`, 1 -> 1.2 -> 1) on activation
  only, never on deactivation.
- **Press.** Everything through `Pressable` (`feedback="scale-fade"` for stats, `fade` for the card), haptic
  `selection` on toggle via Pulsar through `Pressable`'s `haptic` prop.
- **Scrim** is static. No loops anywhere, so `useCalmMotion` is not consulted; state this explicitly in AGENTS.md so
  nobody adds it to the roll.

## 8. Reuses

`Avatar` (author/community face, `size` mapped from post size), `Pressable` (all taps), `Text` presets
(`Text.Subheader` title, `Text.Paragraph` body, `Text.Caption` meta, `Text.Label` name), `Icon` + Central Icons
(`verified` rosette, ellipsis, heart, comment, repost, bookmark, share, eye, arrow-up/down), `Skeleton` for a
`PostSkeleton` helper demo (not a part), `Surface`/`Card` tokens for fill and corner (not the Card component itself,
to avoid nesting a Card's padding model), `useControllableState` is not needed (no owned state), `expo-linear-gradient`
for the scrim, `cn`, `tv` from `lib/tv`, `Slot` is not needed.

## 9. Dependencies

- **New deps: none.** `expo-linear-gradient`, `react-native-reanimated`, `react-native-gesture-handler`,
  `react-native-pulsar`, `react-native-svg` are already optional/required peers, all catalog or SDK-bundled; nothing is
  added to the root `workspaces.catalog`, nothing repeated per the "not bundled by SDK" rule.
- Image: plain React Native `Image`; **not** `expo-image` (not a peer; adding one would require a catalog/`expo install`
  decision the lead has not made). Mention in AGENTS.md as an upgrade path via `children` slot.
- Registry (`packages/cli/src/registry/config.ts`):
  ```ts
  post: {
  	title: "Post",
  	description: "A social card: author, body, media and animated counts, in four shapes.",
  	categories: ["display"],
  	dependencies: ["expo-linear-gradient"],
  },
  ```
  `PACKAGE_INSTALL` already lists `expo-linear-gradient: "expo"`, so no edit there. Run `bun run registry:build`.
- Changeset: `@delacour/react-native-ui` minor.

## 10. Sibling / cross-category dependencies

- **Ideal sibling compositions:** `Attachment` (a post with files or a gallery), `Message`/`MessageScroller` (a post's
  reply thread), `Marquee` (none). **None are imported.**
- **Decision: (a) children/slots only — buildable in wave 1.** `Post.Media` takes `children` that replace the Image
  inside the same framed, scrimmed box, so an app drops an Attachment gallery or a full-screen viewer in with no import
  from Post's side. `Post.Footer` and `Post.Header` take arbitrary children, so a reply count linking to a
  MessageScroller screen needs nothing from Post. The `children` slot is the contract; do not add `attachments` props.
- **Wave 2 is optional polish only:** once Attachment lands, a demo (`demos/post/with-attachments.tsx`, imports allowed
  in demos) shows the pairing. That demo must be added in a follow-up commit, not in the wave-1 branch.
- **Missing from other categories, scoped around:**
  - *Image viewer / lightbox* — not built; `Post.Media onPress` hands control to the app. Defer.
  - *Menu / Popover / Dialog* — `Post.Action` is a plain Pressable with `onPress`; the app opens its own menu or
    `BottomSheet`. No internal menu.
  - *Toast* — "Link copied" feedback is the app's.
  - *Share / clipboard* — app-owned.
  - *Hashtag/mention parsing* — implemented internally as pure `tokenizePostBody`, not a shared component.
- `formatRelativeTime` is private to Post. Do not hoist to `src/lib/` in this branch (another sibling may also add a
  time helper there; the lead dedupes after merge).

## 11. Pure logic to unit-test (TDD)

All in `post.utils.ts` / `post.variants.ts`, no RN imports. Write tests first.

```ts
formatCompactCount(n: number, locale?: string): string
// 0 -> "0"; 999 -> "999"; 1000 -> "1K"; 1234 -> "1.2K"; 1250 -> "1.3K" (round half up);
// 9999 -> "10K"; 12_345 -> "12K"; 999_999 -> "1M" (never "1000K"); 1_500_000 -> "1.5M";
// -5 -> "-5"; NaN/Infinity -> "0"; 2_000_000_000 -> "2B"

formatRelativeTime(date: Date, now: Date): { short: string; spoken: string }
// +30s -> "now"/"just now"; 59s -> "now"; 3m -> "3m"/"3 minutes ago"; 1h -> "1h"/"1 hour ago";
// 23h59m -> "23h"; 2d -> "2d"; 7d+ -> "Oct 5" (same year) / "Oct 5, 2025" (other year);
// future date -> "now" (clock skew never prints "-3m"); invalid date -> ""

type BodyToken =
	| { type: "text"; value: string }
	| { type: "tag"; value: string; raw: string }
	| { type: "mention"; value: string; raw: string }
	| { type: "link"; value: string; raw: string };
tokenizePostBody(body: string): BodyToken[]
// "Hi #tag" -> text,tag; "a#b" -> text only (no tag mid-word); "#a#b" -> tag "a" then text "#b" (a tag ends at the next "#")
// "@ada," -> mention "ada" + text ","; "email@x.com" -> text (mention needs start-of-string/whitespace before @)
// "#123" -> text (tags need a letter); "#Café" -> tag "Café" (unicode letters);
// "https://x.dev/a?b=1." -> link without trailing "."; "" -> []; token round-trip: tokens.map(raw|value).join("") === body

resolvePostStatLabel(label: string, value: number | string | undefined, active: boolean): string
// ("Like", 216, false) -> "Like, 216"; ("Like", 1234, true) -> "Like, 1,234" (on/off lives in accessibilityState);
// ("Save", "Save", false) -> "Save"; ("Views", undefined, false) -> "Views"

resolveStatDirection(prev: number | string | undefined, next: number | string | undefined): "up" | "down" | "none"
// (215, 216) up; (216, 215) down; (5, 5) none; ("Save", 3) none; (undefined, 3) none; (NaN, 3) none

resolveNextVote(current: PostVote, pressed: "up" | "down"): PostVote
// (null,"up") up; ("up","up") null; ("up","down") down; ("down","down") null; (null,"down") down

resolveBodyClamp(input: { numberOfLines?: number; expandable: boolean; isTruncated: boolean; isExpanded: boolean }):
	{ numberOfLines: number | undefined; showMore: boolean; showLess: boolean }
// expandable false => never a toggle; truncated && !expanded => showMore; expanded => showLess, lines undefined

resolvePostLayout(variant: PostVariant): { hasMedia: boolean; handleInline: boolean; mediaScrimDefault: PostMediaScrim; authorOverMedia: boolean }
resolveMediaScrim(variant: PostVariant, scrim?: PostMediaScrim): PostMediaScrim   // media => "top", others "none", explicit wins
```

`post.variants.test.ts` also asserts: every `tone x active` cell has a colour; no slot contains `dark:` or a raw
palette colour; `compact` hides media; no `self-*` on `root`; token classes in `theme.css` exist (reuse the
`theme-tokens` reader the Avatar tests use).

## 12. Playground demos

`apps/playground/src/demos/post/` (barrel `index.ts` ordered as listed; route `(components)/post.tsx`):

| File | Description | Meta |
| --- | --- | --- |
| `feed-card.tsx` | Full card: author, body with tag, media, view/like/reply/save | `capture`, **`hero`** |
| `vote.tsx` | Score pill, title, clamped body; tap arrows, tap again clears | `capture` (flow: `post/vote`) |
| `compact-timeline.tsx` | Three compact rows with inline handle and mentions | `capture` |
| `media-first.tsx` | Picture is the card, scrim, author over it | `capture` |
| `live-counts.tsx` | Like and repost toggle, count rolls up/down | `capture` (flow: `post/live-counts`) |
| `hashtags-and-mentions.tsx` | Tokenised body with press handlers | gallery only |
| `expandable-body.tsx` | "More" on a clamped body | gallery only |
| `sizes.tsx` | default vs sm | gallery only |
| `media-states.tsx` | Loading and failed image keep their aspect ratio | gallery only |

`testID`s: `post-like`, `post-save`, `post-vote-up`, `post-vote-down`, `post-body-more`. Demos import only from
`@delacour/react-native-ui/*`, `react`, `react-native`, peers and `@/demos/types`. Images use stable remote URIs
(pravatar for faces; a stable placeholder photo URL), with fallback initials proving the failure path.

## 13. Docs page

`apps/web/content/docs/native/components/post.mdx`, frontmatter `title: Post`, `description: A social card with an
author, body, media and animated counts.`, `icon: MessageSquare`. Outline: `<Preview id="post/feed-card" title={null} />`;
Installation (`<ComponentInstall name="post" />`); Usage; Composition (parts tree); Variants (feed, vote, compact,
media); Counts and state (caller owns state, optimistic like example); Hashtags and mentions; Media and the `children`
slot (gallery/viewer drop-in); Accessibility; API reference tables per part; Notes (fixed aspect ratio, toggles fill
rather than swap). Joins `meta.json` under **Data Display** after `item` (or the "Media and motion" heading if the lead
adds one — a single `"---Media and Motion---"` line, coordinated with siblings to avoid a merge conflict).

## 14. Acceptance checklist

- [ ] Tests written first and failing, then passing: `bun test packages/react-native-ui/src/components/post`
- [ ] `bun run typecheck` clean (no `any`; unions for variant/vote/token shapes)
- [ ] `bun run check` (Biome) clean; no comments inside JSX
- [ ] `post/AGENTS.md` written (file map, axes, bold-claim bullets) and row added to the Components table in
      `packages/react-native-ui/AGENTS.md`
- [ ] `displayName` on every part, provider and internal leaf (`DelacourUI.Post.Stat.Count`...); `bun test` display-name passes
- [ ] `bun run gen-exports` run, `package.json` exports diff committed
- [ ] Demos written, listed in `demos/post/index.ts`, `bun run gen-demos`; 4-6 `capture`, one `hero`
- [ ] Route `apps/playground/src/app/(components)/post.tsx` + row in `src/app/index.tsx`
- [ ] Docs page `post.mdx` + `meta.json` entry
- [ ] `ITEM_META.post` added; `bun run registry:build` succeeds with no unknown-package throw
- [ ] Changeset (`bun run changeset`, react-native-ui minor)
- [ ] Simulator check via `warden claim ios --json` + `agent-device` (open playground `/post`, snapshot, press like,
      `wait`/`get` the new count text, `close`, `warden release`)
- [ ] Component-specific:
  - [ ] Like toggles fill the same glyph (no shape swap); count rolls up on increase, down on decrease; reduced motion = instant
  - [ ] Pressing the cast vote arrow reports `null`
  - [ ] Card height does not depend on image dimensions (fixed aspect ratio) with a tall and a wide image
  - [ ] `compact` renders no media and warns in dev if `Post.Media` is used
  - [ ] Scrim keeps white author text legible over a white photo (light and dark theme)
  - [ ] Tag/mention taps fire handlers with the stripped token; no handler => plain coloured text
  - [ ] VoiceOver reads "Like, 216, selected"; media with `alt=""` is skipped
  - [ ] Dead avatar and dead media URL fall back without layout shift
  - [ ] Imports no sibling component (grep `from "../(attachment|message|message-scroller|marquee|qr-code|support)`)
