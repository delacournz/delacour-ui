# @delacour/react-native-ui

## 0.4.1

### Patch Changes

- [#238](https://github.com/delacournz/delacour-ui/pull/238) [`936cff3`](https://github.com/delacournz/delacour-ui/commit/936cff334a7efb28026302bb9f72fe8201667bb0) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Calendar: a `secondary` range's start and end circles are one even colour — the band now runs under the whole circle instead of half of it.

- [#244](https://github.com/delacournz/delacour-ui/pull/244) [`cb11cbb`](https://github.com/delacournz/delacour-ui/commit/cb11cbbcf216dd5fadf2f34300690839fbe77789) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - `add --tests` copies each component's `bun test` suites beside it, records them in the lock, and asks for `@types/bun`; `update` keeps copied tests current and `update --tests` brings them in. The registry ships each item's tests in a separate `tests` list, so older CLIs are unaffected.

- [#246](https://github.com/delacournz/delacour-ui/pull/246) [`292d502`](https://github.com/delacournz/delacour-ui/commit/292d502bbcd141a17c65e62d09defe080afb6a4d) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - `add --tests` writes copied suites for the project's own runner — Vitest, Jest or Bun, read from `package.json` or set with `tests.runner` in `native-components.json` — and asks for that runner's packages instead of `@types/bun`. The shipped suites keep to the API all three share, and the registry build fails on one that does not. `add --tests` and `doctor` check that the runner can run them — its packages, a Jest config or a Vitest alias, and `tsconfigRaw` on Expo's tsconfig — and name the fix.

- [#241](https://github.com/delacournz/delacour-ui/pull/241) [`3c76b6c`](https://github.com/delacournz/delacour-ui/commit/3c76b6cd6cc9242ee04a0ffc3b74f4785c9cc551) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Item, ListGroup.Item and GridItem: `asChild` takes a single child element as written. The text wrap (and GridItem's background ordering) always rebuilt the children as an array, which `Pressable`'s `Children.only` rejects even with one element, so `<Item asChild onPress={…}><View /></Item>` threw. Under `asChild` the children now pass through untouched, and without it a lone element comes back as that same element. The wrap is one shared helper, `lib/wrap-text-children`.

- [#243](https://github.com/delacournz/delacour-ui/pull/243) [`c0b0a87`](https://github.com/delacournz/delacour-ui/commit/c0b0a87b4a32c164eb34f6fc664abd01f821ff6f) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Copied components no longer assume Bun or cite tests that are not copied. `add` strips maintainer-only notes and test-file rows from each component's `AGENTS.md`, the registry build fails on any shipped file that names Bun or an unshipped test, and the CLI prints Expo commands for the project's own package manager. The agent skill shows `npx` with its pnpm, yarn and bun equivalents.

- [#240](https://github.com/delacournz/delacour-ui/pull/240) [`2f6f1d3`](https://github.com/delacournz/delacour-ui/commit/2f6f1d398bfb30c72a24fcfd7e8983f782f5f79a) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Pressable: TalkBack's double-tap-and-hold now reaches `onLongPress` through a `longpress` accessibility action on Android, behind the same `disabled` / `busy` guard as the press. Screen-reader activation and long press are dispatched by `dispatchPressableAccessibilityAction`, which fires each handler once and never on a gated control.

- [#242](https://github.com/delacournz/delacour-ui/pull/242) [`3f1cfb8`](https://github.com/delacournz/delacour-ui/commit/3f1cfb8dbe1b92ecb1ac130113b50f623bc09d1c) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Export every public variant axis from its component's entry point. `BADGE_MATERIALS` / `BadgeMaterial`, `BUTTON_MATERIALS` / `ButtonMaterial`, `SURFACE_MATERIALS` / `SurfaceMaterial` and `SCROLL_SHADOW_ANCHORS` / `ScreenScrollShadowAnchor` were declared but only reachable by importing a component's internal files; `@delacour/react-native-ui/text-animation` now also exports `TextAnimationEffectKind`, `TextAnimationCaretKind`, `TextAnimationSlideFrom` and a new `TEXT_ANIMATION_SLIDE_DIRECTIONS`. A package test now fails for any axis left unexported.

## 0.4.0

### Minor Changes

- [#211](https://github.com/delacournz/delacour-ui/pull/211) [`f8dadbe`](https://github.com/delacournz/delacour-ui/commit/f8dadbeeb5232d4ceff641831481010b451238d7) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Breadcrumb` — the path to the current screen, links back up each level and the current page last.

  - `Breadcrumb.List` counts its direct `Breadcrumb.Item`s and puts a separator between every pair, none after the last. A hand-placed `Breadcrumb.Separator` stands in for the automatic one beside it, and the root's `separator` replaces the chevron everywhere.
  - Past `maxItems` the middle folds into an ellipsis, keeping `itemsBeforeCollapse` and `itemsAfterCollapse` at each end; `onEllipsisPress` makes it a button and hands over the hidden indices. `overflow="scroll"` runs the trail on in a horizontal scroller opened at the current page.
  - `Breadcrumb.Link` is a `Pressable` announced as a link with a 44-point target and takes an `onPress` — no router coupling. `Breadcrumb.Page` is announced selected; separators are hidden from screen readers; chevrons flip in right-to-left layouts.
  - `sm` and `md` sizes, on the caption and body text steps.
  - `delacour add breadcrumb` copies it into a project.

- [#216](https://github.com/delacournz/delacour-ui/pull/216) [`b31b518`](https://github.com/delacournz/delacour-ui/commit/b31b51866b44c109a141f8973f88c42dc0ba6aa5) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `CircularText` — text set around a circle, optionally turning

  The text sits on a `react-native-svg` `TextPath`, laid out once by the platform's shaper and closed
  exactly with `textLength`. `span` is a full ring, an arc or natural spacing; `side` stands the glyphs
  outside or inside the circle; `repeat="fill"` repeats a phrase until the ring closes. `spin` is a
  steady `loop` in degrees per second, driven by a frame-callback integrator so a `pause` (by press or
  by state) eases to a halt and resumes without a snap, or a `controlled` angle from a shared value.
  `centerContent` stays upright and independently accessible, the ring reads once with separators
  stripped, and a `loop` holds still under reduce motion or `isMotionCalm`.

- [#182](https://github.com/delacournz/delacour-ui/pull/182) [`93189f8`](https://github.com/delacournz/delacour-ui/commit/93189f853a43a560b532d9971e41c1f7b121f574) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `ColorPicker` — pick a colour by dragging, typing or tapping a preset.

  - Compound anatomy: `ColorPicker.Area` (saturation and brightness), `.Hue`, `.Alpha`, `.Preview`, `.Input` (a hex field), `.Swatches` / `.Swatch`, `.Content` and `.Trigger`. A bare `<ColorPicker />` draws the area, the hue track and the field.
  - Every drag runs on the UI thread through one shared value, so nothing re-renders while a finger moves. `onValueChange` fires per frame, `onValueCommit` once a change settles.
  - Accepts hex (3, 4, 6, 8 digits), `rgb()`, `rgba()`, `hsl()` and `hsla()`; reports in `format` — `hex`, `rgb` or `hsl`. Greys and black keep their hue, and a controlled echo never drifts it.
  - `hasAlpha` adds an opacity track whose fade keeps the same RGB end to end. `presentation="sheet"` puts the surface in a `BottomSheet` behind a trigger row drawn on `Input`'s box.
  - Joins `Field`, takes `Input`'s sizes and variants, and is adjustable for screen readers in every axis, announcing on commit.
  - The `color-picker` subpath imports `BottomSheet`, so it needs `@delacour/react-native-bottom-sheet` installed even inline.
  - `delacour add color-picker` copies it into a project.

- [#206](https://github.com/delacournz/delacour-ui/pull/206) [`e6dc71c`](https://github.com/delacournz/delacour-ui/commit/e6dc71c92576381c08253c58aed99de797cd5fa2) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Compare`, two layers of one frame with a seam the finger drags across — before and after, one screen in two themes, a redesign against the original. The front layer is revealed by a sliding mask rather than resized, so both halves stay in register; the handle is an `adjustable` with stepped assistive actions, snap points on release, haptics at stops and bounds, horizontal or vertical orientation, and a `grab` mode that leaves vertical scrolling to the list

- [#190](https://github.com/delacournz/delacour-ui/pull/190) [`bcbaaea`](https://github.com/delacournz/delacour-ui/commit/bcbaaea43d31b30e8c9e67271eb844439962bc98) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Direction`, a per-subtree LTR/RTL wrapper with `useDirection` and `useDirectionSign`.

  - `<Direction dir="rtl">` mirrors its subtree on the next frame — rows reverse, `start`/`end` insets swap — with no restart and no remount, and nests: an inner `<Direction dir="ltr">` holds a phone number's order inside an RTL card.
  - Uniwind's `rtl:` and `ltr:` variants resolve against the nearest `Direction`, not the app.
  - `useDirection()` and `useDirectionSign()` report the direction to gesture and `translateX` maths. Outside any `Direction` they fall back to `I18nManager.isRTL` rather than throwing.
  - Worklet-safe helpers — `resolveDirection`, `directionSign`, `physicalSide`, `mirrorX`, `logicalDelta` — for code that runs on the UI thread.
  - `delacour add direction` copies it into a project.

- [#222](https://github.com/delacournz/delacour-ui/pull/222) [`e4e27d0`](https://github.com/delacournz/delacour-ui/commit/e4e27d07824d617912a37812d1bd0fed10aa0552) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add ImageViewer: a fullscreen gallery that opens from a thumbnail, with pinch, pan and double-tap zoom, swipe between images and drag-to-dismiss, plus the `media` / `media-foreground` colour tokens.

- [#208](https://github.com/delacournz/delacour-ui/pull/208) [`720b3b8`](https://github.com/delacournz/delacour-ui/commit/720b3b81483e3a9846049454b096d9328a5e7501) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `MessageScroller`, a conversation list anchored at the newest message

  It follows new messages while the reader is at the end and leaves them alone once they have
  scrolled up, with a floating "jump to latest" button carrying an unread count. Older history loads
  when the reader reaches the top, guarded to one request per page, and lands without moving the
  viewport. The list rises with the keyboard, draws day separators and an unread divider, and passes
  each message's place in its sender's run to `renderMessage`. `useMessageScrollerState` drives the
  same behaviour on another list, such as `Screen.ChatList`.

- [#218](https://github.com/delacournz/delacour-ui/pull/218) [`ff22d48`](https://github.com/delacournz/delacour-ui/commit/ff22d48e480cb1161d55f7397dc8ee3e56836401) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Message`, a chat bubble with incoming and outgoing sides, run-aware logical corners, an avatar gutter, author and timestamp, delivery receipts with retry, reactions, actions and a typing indicator — read by a screen reader as one composed label

- [#205](https://github.com/delacournz/delacour-ui/pull/205) [`8732bb9`](https://github.com/delacournz/delacour-ui/commit/8732bb9ecc9c94dca439f4cbeca5e7f54b5926ed) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Pagination`, for moving through the pages of a result set. The `numbers` variant draws a
  fixed-length run of page numbers and gaps, so the number under the reader's thumb never slides away
  as the window moves; a gap never hides a single page, and tapping one jumps `pageJump` pages.
  `compact` draws one "3 / 12" readout that VoiceOver swipes a page at a time, and `simple` the two
  labelled arrows alone. `Pagination.Summary` and `Pagination.Status` ("41–60 of 472") sit at the
  leading edge. A controlled `page` outside `[1, count]` is drawn clamped and reported once through
  `onPageChange`. `sm` targets reach 44 points with hit slop. `delacour add pagination` copies it in.

- [#200](https://github.com/delacournz/delacour-ui/pull/200) [`d612861`](https://github.com/delacournz/delacour-ui/commit/d6128617dd7b7cecb274f6811deb8ae5b8dda474) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Post`, a social card in four shapes — feed, vote, compact and media — with an author, a tokenised body with tags, mentions and links, a fixed-shape media frame with a scrim, stats whose glyph fills and whose count rolls, and a score pill; all counts and votes stay caller state

- [#219](https://github.com/delacournz/delacour-ui/pull/219) [`698fd6f`](https://github.com/delacournz/delacour-ui/commit/698fd6f779fff9bb2464008a931913a669d13cf4) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `QRCode`: a string a camera can read, drawn as one `react-native-svg` path, with an optional
  `QRCode.Logo` in the middle

  The encoder is in-house and dependency-free — numeric, alphanumeric and UTF-8 byte modes, versions
  1–40, levels L/M/Q/H — and is exported as `encodeQr` and `useQRCode` for custom renderers. Three
  module styles (`square`, `rounded`, `dots`) keep the finders concentric; modules snap to whole device
  pixels; a logo forces level H and grows the version until every block stays recoverable. The tile is
  dark-on-light in both themes, and an inverted or low-contrast pair warns in development. The
  registry now also skips `*.test-helpers.ts` and `*.fixtures.ts` alongside tests.

- [#195](https://github.com/delacournz/delacour-ui/pull/195) [`b2719e6`](https://github.com/delacournz/delacour-ui/commit/b2719e63f7e8ae07ae24b14593ee999e4b740a02) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Questionnaire` — a guided form, one question at a time. Six question kinds (single and multiple choice with a free-text "Other", text, rating, a numbered scale and yes/no), conditional questions that drop their stale answers, Back that follows the questions actually visited, deliberate skips, a dimmed-not-disabled Next that explains a blocked answer, async submit, controlled answers and navigation, and bar, stepper or count progress. The flow's rules are exported as pure functions, so a server can re-validate a submission.

- [#223](https://github.com/delacournz/delacour-ui/pull/223) [`82c569b`](https://github.com/delacournz/delacour-ui/commit/82c569b3d5557937e46a17cbb1b788fcc7c775ce) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `SectionProgress` — a floating pill over a long reading screen: a ring filling with scroll progress beside the title of the section being read, opening a card that lists every section.

  - Reads `useScrollSections`: `scroll` drives the ring and the reveal, `value` takes `activeId`, `onValueChange` takes `scrollTo`. The ring runs on the UI thread, so scrolling renders nothing; a jump eases over 180ms.
  - Six placements against the safe area, an `offset`, and a `revealAt` that latches once crossed. The panel grows out of the pill, scrolls past six rows, and closes on an outside tap, the escape gesture or Android back.
  - `SectionProgress.Item` takes a `color` for its marker and for the ring while it is active. `progress` overrides the scroll; `isOpen` / `onOpenChange` control the panel; `haptic` plays on a section change.
  - VoiceOver reads "Sections, Pricing, 42 percent"; opening moves focus to the active section. Reduce motion turns the panel's scale into a fade.
  - `delacour add section-progress` copies it into a project, with `use-scroll-sections`.

- [#214](https://github.com/delacournz/delacour-ui/pull/214) [`d370d83`](https://github.com/delacournz/delacour-ui/commit/d370d83b91d231f6a6bfa8c8d709b5e6cf6943b3) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `SectionRail` — a thin rail of bars along a screen edge, one per section of a long screen, that opens into a labelled outline.

  - `SectionRail.Trigger` holds one `SectionRail.Bar` per section and `SectionRail.Content` one `SectionRail.Item` per row; `level` shortens a bar and indents its row by the same step. The active bar's colour eases in, and the active row is drawn in the foreground.
  - Tap the rail to open the outline, or scrub: drag along it and the row under the finger highlights — mapped on the UI thread, with an optional `haptic` tick per section crossed — and releasing jumps there. A pick lingers for `closeDelay` before closing; an outside tap or Android's back closes it.
  - `placement` (`end`, `start`) and `align` (`center`, `bottom`) are logical and mirror in right-to-left; the rail clears the safe area by `offset`. It fills its container and passes every other touch through, so the content under it keeps scrolling.
  - Pairs with `useScrollSections`: `value={sections.activeId}` and `onValueChange={sections.scrollTo}`. `value={undefined}` stays controlled, so a hook's empty first value does not flip modes.
  - One `adjustable` element to VoiceOver, named "Sections" and valued by the active title; swiping steps through the sections and focus lands on the active row when the outline opens.
  - `delacour add section-rail` copies it into a project, along with `use-scroll-sections`. The registry builder now reads a `registryDependencies` list from `ITEM_META` for edges no import records.

- [#221](https://github.com/delacournz/delacour-ui/pull/221) [`44a5182`](https://github.com/delacournz/delacour-ui/commit/44a5182c4cd2c84a9c2a0c5d150fe126b849a9af) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Sortable` — a vertical list the user reorders by dragging.

  - Rows move by transform on the UI thread, so a drag renders nothing; `onReorder(order, { id, from, to })` fires once, after the row lands, and the transforms clear in the commit that renders the new order.
  - `activation="handle"` drags from `Sortable.Handle`; `"long-press"` lifts the whole row after `longPressDelay`. A row changes slot when its edge crosses the next row's midpoint, at any heights.
  - `isPinned` rows never move and the others reorder around them; `isDisabled` rows cannot be lifted.
  - `scrollRef` auto-scrolls the enclosing scroller near its edges. `haptic` plays one feedback on lift and one per slot passed.
  - Screen readers get Move up / Move down actions and "Position 2 of 5", with the new position announced.
  - `reorderItems` and `useSortableItem` are exported. `delacour add sortable` copies it into a project.

- [#179](https://github.com/delacournz/delacour-ui/pull/179) [`a566fa1`](https://github.com/delacournz/delacour-ui/commit/a566fa1dde77e74598a4680c7861336135e24c43) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `SplitView`, two stacked panes with a drag row that settles on named snap points.

- [#177](https://github.com/delacournz/delacour-ui/pull/177) [`c7c5930`](https://github.com/delacournz/delacour-ui/commit/c7c59302bf1363236644a4ff074ee704af277928) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Splitter`, resizable panes divided by draggable, adjustable handles, sized in percent.

- [#198](https://github.com/delacournz/delacour-ui/pull/198) [`424b075`](https://github.com/delacournz/delacour-ui/commit/424b0756212fe7b8e08c7ffa8a60ce5de457eded) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `TagInput` — free-form tags typed into one field box, each a removable chip

  Return or a delimiter commits the text as a chip and keeps the keyboard up; a paste holding
  delimiters lands as several tags. Duplicates, a `max` and a `validate` hook refuse tags through
  `onReject` with a reason, and `allowOverflow` accepts past `max` while marking the field invalid.
  Backspace on an empty field arms the last chip, and a second removes it. The box is `Input`'s, it
  joins an enclosing `Field`, and tags and draft are each controlled or uncontrolled.

- [#220](https://github.com/delacournz/delacour-ui/pull/220) [`b34c88f`](https://github.com/delacournz/delacour-ui/commit/b34c88f04f23e1a928df4521e0b38265e583571d) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `TextAnimation` — five ways a piece of text or a number arrives, on one clock.

  The root reveals a string by word, character or line with a fade, slide or scale, staggered
  forward, in reverse, from the centre or in a seeded random order. `TextAnimation.Typing` types a
  phrase or cycles several with a bar or block caret, `TextAnimation.Rotating` swaps one word in
  place inside a sentence, `TextAnimation.Counting` tweens a formatted number on the UI thread, and
  `TextAnimation.Rolling` rolls an odometer whose wheels take the short way round. Nothing reflows
  while it plays, a screen reader hears the final text once, and under reduce motion every part shows
  its final text on the first frame.

- [#212](https://github.com/delacournz/delacour-ui/pull/212) [`b431d88`](https://github.com/delacournz/delacour-ui/commit/b431d88799fe32e1c43894a6ed75d9a96812a3fc) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Tour` — a guided walkthrough: the screen dims, a hole opens around one control, and a card beside it explains it.

  - Wrap each control in a `Tour.Step` with an `order` and a `title`; the tour sorts the steps, measures the current one in window coordinates and re-measures on rotation. `onStepChange` fires first, so a target can be scrolled into view.
  - The hole is an SVG cutout, `rect` or `circle`, that glides between targets on the UI thread and jumps under reduce motion. `shape`, `padding`, `radius` and `placement` are set on the tour and overridden per step.
  - The card sits below the hole when it fits and above otherwise, centred and clamped to the safe area. Next, Back, Skip and Done, a "2 of 5" progress, and every label replaceable.
  - A React Native `Modal` by default; `isInteractive` draws inside the tour's root and passes touches inside the hole through to the control.
  - Open with `defaultOpen`, the `isOpen` triple or `useTour().start()`. `onFinish` and `onSkip` are where an app records that the tour was seen.
  - Focus moves to the card on each step; VoiceOver's escape and Android back skip when dismissible.
  - `delacour add tour` copies it into a project.

- [#207](https://github.com/delacournz/delacour-ui/pull/207) [`a1079b2`](https://github.com/delacournz/delacour-ui/commit/a1079b25597b5439945b60ac5950da8c20d39fc7) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Tree` — a hierarchy opened one level at a time, with branches that expand and collapse and
  optional single or multiple selection. Depth comes from context, closed groups unmount, and
  `hasChildren` marks a lazy branch before its children load.

- [#183](https://github.com/delacournz/delacour-ui/pull/183) [`4cc10e3`](https://github.com/delacournz/delacour-ui/commit/4cc10e3aab8c323dd5330a244f0b421e4764eb25) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add AnimatedBadge, a status pill that rolls its content and springs its width when the status changes.

- [#192](https://github.com/delacournz/delacour-ui/pull/192) [`2d0b288`](https://github.com/delacournz/delacour-ui/commit/2d0b28807cb919be250eccbb70ad024d5a0a7049) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Attachment` — a file, image, video or recording with a thumbnail, size, upload state and remove

  `AttachmentMedia` is discriminated by `kind`, so an image without a `source` is a type error. Three
  layouts — `chip` for a composer, `tile` for a photo tray, `card` for inside a message — at three
  sizes. Upload stays the app's: `status` is `idle`, `uploading` (determinate or looping), `error`
  with the app's message, or `done`, and `onRemove` / `onRetry` compose their controls in beside the
  press target so a remove tap never opens the attachment. A screen reader meets one element with a
  composed label, progress in ten-point steps and remove / retry as actions. `Attachment.Group` is a
  horizontal tray that fades attachments in and out and slides the rest along, stilled under calm
  motion. `delacour add attachment` installs it.

- [#175](https://github.com/delacournz/delacour-ui/pull/175) [`0a4b432`](https://github.com/delacournz/delacour-ui/commit/0a4b432644ec8a8b59c83fb6b7d7ab6bbcfe9304) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Combobox` — a long or remote list behind a field-shaped trigger, filtered as you type in a bottom sheet.

  - The sheet opens with its search field focused once it has settled. The default filter matches the label and `keywords` case- and accent-insensitively; `filter={{ kind: "custom", match }}` takes a predicate and `{ kind: "none" }` shows the options as given, for a server. The matched run of each label is bold, through accents.
  - Single selection by default, where a pick closes the sheet; `selectionMode="multiple"` keeps it open and shows removable chips on the trigger (folding into `+N`) and above the search field, with a two-step Backspace remove. `value` and `onValueChange` are typed per mode; `maxSelected` disables the rest once reached.
  - The query is controlled separately with `inputValue` and `onInputValueChange`, which reports `type`, `select`, `clear` or `close`. A picked option stays on the trigger after a server's results move on. `allowCustomValue` offers the typed text as a value.
  - Built from Select's leaves — the same trigger box and option rows — and joins `Field` the same way. `isClearable`, `isReadOnly`, `isLoading`, `Combobox.Empty` and a replaceable `Combobox.Trigger` cover the rest; the result count is announced to screen readers.
  - Needs `@delacour/react-native-bottom-sheet` and `BottomSheetProvider`. `delacour add combobox` copies it into a project, along with `select`, `chip` and `bottom-sheet`.

- [#174](https://github.com/delacournz/delacour-ui/pull/174) [`7557b64`](https://github.com/delacournz/delacour-ui/commit/7557b64dbff0e9a869faee8d66e9b181af48c95e) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Countdown`, the time left until a fixed moment, read from the wall clock on every tick

  It reads the clock rather than decrementing a counter, so it is right after the app was backgrounded or the
  device slept, and it re-reads on returning to the foreground. Seconds round up — the final second shows `0:01`
  and `onComplete` fires once at zero, re-arming when `to` moves into the future. `units` picks which units show,
  the largest absorbing everything above it; `trim` drops leading zero units. `variant` is `segmented` — boxed
  digits that slide per changed digit, with captions from `labels` — or `inline`, one tabular run. `urgentBelow`
  turns the digits destructive. The `timer` label is coarse and names seconds only in the final minute.
  `bunx delacour add countdown` copies it into a project.

- [#172](https://github.com/delacournz/delacour-ui/pull/172) [`7bc6b74`](https://github.com/delacournz/delacour-ui/commit/7bc6b741931907a0bfd651c8a9e517165d8ee234) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `DatePicker`, a field-shaped trigger that shows a date (`mode="single"`), a range (`"range"`) or several (`"multiple"`) and opens a `Calendar` in a bottom sheet to change it. The sheet closes when the pick is finished — on a day, on a range's second end, or on Done for several — and a half-picked range is held inside the sheet rather than reported. The trigger is the `Input` box at every `size` and `variant`; its text is formatted from the value through the calendar's `Intl` formatters, with `format` and `formatRange` overrides and a long-form screen-reader value. `minDate`/`maxDate`/`disabledDates`, `locale` and week start pass to the calendar; `isOpen`/`onOpenChange` and the value work controlled or uncontrolled; Clear, read-only, `presentation="inline"`, and `isInvalid`/`isDisabled`/label/label-tap from a `Field`. Needs `BottomSheetProvider`. `bunx delacour add date-picker` copies it.

- [#199](https://github.com/delacournz/delacour-ui/pull/199) [`0a6db15`](https://github.com/delacournz/delacour-ui/commit/0a6db15d372408b2c3e149b9cb550fd96bb7a177) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `DateTimePicker`, one field for a date and a time of day picked together: an `Input`-shaped trigger that opens a `Calendar` and `TimePicker`'s wheel in one bottom sheet with one Done, or draws them in place with `presentation="inline"`. The value is a whole `{ date, time }` or `null`, never half — a day picked first takes the time from the clock, rounded up onto `minuteStep`; a time picked first lands on today or the nearest allowed day — and every pick and settle reports it, so Done only closes and announces. `layout="tabs"` (default) puts Date and Time behind tabs and moves to Time once after the first date pick; `layout="stacked"` draws the calendar over a time row that opens the wheel. `minDateTime`/`maxDateTime` are one window that bounds the calendar to its days and the wheel to its times on those days only, re-clamping the time when the date moves; plus `disabledDates`, `hourCycle`, `showSeconds`, `locale`, a custom `format`, `isClearable`, controlled or uncontrolled value and open state, and the `Field` cascade. The subpath exports the pure `DateTimeValue` helpers — `toNativeDate`/`fromNativeDate`, `formatDateTime`, `serialiseDateTime`/`parseDateTime`, `clampDateTime`, `timeBoundsForDate` and more. Needs `BottomSheetProvider`. `bunx delacour add date-time-picker` copies it.

- [#226](https://github.com/delacournz/delacour-ui/pull/226) [`c6f3e76`](https://github.com/delacournz/delacour-ui/commit/c6f3e76b1f0a421d09107793dea1acfcb3c18361) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Move to Expo SDK 58: React Native 0.88, React 19.3, Gesture Handler 3

  The peer floors are now `react-native >=0.88` and `react-native-gesture-handler >=3.3`. React Native
  0.88 types its components through the strict API by default, so every ref is typed as the host
  instance it receives — `ViewInstance`, `TextInputInstance`, `ScrollViewInstance` — rather than as
  the component, and `ScreenScrollViewRef` is now `ScrollViewInstance`. Those types do not exist
  before 0.88. The sheet's and the drawer's pans keep the builder API under Gesture Handler 3's
  `LegacyPanGesture` type. The CLI's
  `verify:expo` scaffolds against SDK 58.

- [#170](https://github.com/delacournz/delacour-ui/pull/170) [`aa15324`](https://github.com/delacournz/delacour-ui/commit/aa15324729cd5d769cf50266e4b29cdea20b2726) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `FlipCard` — two faces of one card and a turn between them

  `FlipCard.Front` sits in flow and sizes the card, `FlipCard.Back` fills it, and `FlipCard.Trigger`
  turns it under every trigger. `trigger` is a discriminated union: `"press"` (a tap anywhere),
  `"swipe"` (a drag that scrubs the turn, rubber-bands past either rest and settles on the nearer face
  or the way it was flicked; `swipeDistance` exists only here) and `"manual"` (only `face`, the ref's
  `flip()` / `flipTo()` or a trigger). The face is state and the rotation follows it: the hidden face
  leaves the accessibility tree and stops taking touches the moment a turn is committed, which face is
  drawn is decided by the angle rather than `backfaceVisibility`, the settled face is announced, and a
  gesture card always offers an `activate` action. Under reduce motion or `isMotionCalm` the faces
  crossfade instead of turning. `delacour add flip-card` installs it.

- [#173](https://github.com/delacournz/delacour-ui/pull/173) [`f1d5ff8`](https://github.com/delacournz/delacour-ui/commit/f1d5ff85feb381f3b15901f7ced7ea175c30e94c) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Flow`, a pan-and-zoom canvas of nodes joined by edges that route themselves — handles, groups, drag-to-connect, controls, a minimap and assistive move/connect/delete actions, all reporting to an app that owns the graph.

- [#202](https://github.com/delacournz/delacour-ui/pull/202) [`ccdc785`](https://github.com/delacournz/delacour-ui/commit/ccdc785ff27b161d1c368f20edc50ffa4e8b8b88) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add Frame, a titled shell with a header action, a divided tray of rows, labelled sections and a footer.

- [#189](https://github.com/delacournz/delacour-ui/pull/189) [`9319bf3`](https://github.com/delacournz/delacour-ui/commit/9319bf3caadc88d56726dea8367cbc3d685cb087) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `GridItem` and `GridItem.Group`, a bento tile grid with whole-cell spans

  `GridItem.Group` measures its width, sizes a cell from `columns`, `gap` and `aspect` or `rowHeight`, and
  places each direct child first-fit in writing order from its `colSpan` and `rowSpan`, on pixel-snapped edges
  and the logical `start` inset. It reserves its height before the first measure, so nothing jumps, and glides
  tiles to new cells on a relayout unless reduce motion is on. `GridItem` takes four variants and two sizes,
  renders a `Pressable` only when it has a press handler, and announces itself as one stop labelled from its
  title, value and description. Parts: `Background`, `Media`, `Title`, `Value`, `Description`, `Footer` and
  `Actions`; `useGridItem()` and `useGridItemGroup()` expose the tile's box and the group's cell size, and
  `bunx delacour add grid-item` copies it into a project.

- [#186](https://github.com/delacournz/delacour-ui/pull/186) [`3b9e383`](https://github.com/delacournz/delacour-ui/commit/3b9e38394fae796a20cda65a002ebe5e221cd560) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Input.Group.Button`, `Input.Group.Separator` and `Input.Group.Block`, decorative decorators, and `Textarea` inside a group

  - `Input.Group.Prefix` / `.Suffix` take `isDecorative`, which hides them from screen readers and lets
    touches through to the field. It defaults to true when every child is bare text or an `Icon`.
  - `Input.Group.Button` is a `Button` sized one step below the box (square when icon-only), disabled
    with the group without fading twice, and warns in development when icon-only with no label.
  - `Input.Group.Separator` draws a hairline whose direction comes from where it is written: vertical
    in the row, horizontal between a block and the row.
  - `Input.Group.Block` adds a full-width section above (`position="start"`) or below (`"end"`) the
    field inside the same border and focus ring. The group always renders an inner row, so adding a
    block never remounts the field.
  - `Textarea` reads the group's context and drops its own box, so a message composer is one box.

- [#176](https://github.com/delacournz/delacour-ui/pull/176) [`4b21258`](https://github.com/delacournz/delacour-ui/commit/4b21258b4ef10ff944c9d687160ed25cf3a54023) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Leaderboard`: ranked people or teams with standard competition ties, the top three on a podium of growing bars or lifted cards, a movement column, and the highlighted entry pinned below the `limit` cut with its true rank.

  Its podium and rows read entries in any order and rank them stably, `order="asc"` for times; `unit` is spoken after every value. `bunx delacour add leaderboard` copies it into a project.

- [#191](https://github.com/delacournz/delacour-ui/pull/191) [`500a0c0`](https://github.com/delacournz/delacour-ui/commit/500a0c07e967278d443ef57b55ce6611064877de) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `MarkdownEditor`, a Markdown field with a formatting toolbar, a monospaced write pane and a rendered preview

  The toolbar wraps a selection or inserts markers at the caret, toggles a format off when pressed
  again, applies headings, quotes and lists to every touched line, and lights from the caret. Return
  continues a list. The preview draws the toolbar's subset on the `Text` presets and opens a link only
  for http, https, mailto and tel. It joins `Field` like `Input`, comes in a `bar` or `pill` toolbar,
  and ships `applyMarkdownCommand`, `continueMarkdownList` and `parseMarkdown` as plain functions. The
  CLI adds it with `delacour add markdown-editor`.

- [#188](https://github.com/delacournz/delacour-ui/pull/188) [`402ffc7`](https://github.com/delacournz/delacour-ui/commit/402ffc75452df2f3cb5e0b8ca1e2a522fa8b2a66) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Marker`, a centred inline note for steps and day breaks between conversation turns

  It comes as a bare `default` row, a hairline `border` capsule, or a `separator` label ruled to both edges. With no handler it is a plain view read as text; give it `onPress` or `onLongPress` and it becomes a pressable announced as a button. `Marker.Content shimmer` breathes the text on the UI thread while a step runs and announces the marker busy, stilled under reduce motion. `bunx delacour add marker` copies it in.

- [#196](https://github.com/delacournz/delacour-ui/pull/196) [`9f3e5ab`](https://github.com/delacournz/delacour-ui/commit/9f3e5abd8a7544205cae6152ceb6877390aa3df1) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Marquee`: content that travels across its container on a loop at a speed in points per second — horizontal or vertical, edge fades, held on touch, `Marquee.Group` to keep rows in step, and a still, hand-scrollable strip under reduce motion.

- [#203](https://github.com/delacournz/delacour-ui/pull/203) [`136bf8c`](https://github.com/delacournz/delacour-ui/commit/136bf8cc5b9ba231bf774c9ea91f2789dcb71106) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Support`: the chrome around a help conversation — availability, channels, topics, past requests, articles, and a thread's agent, ticket, handoff, suggested replies, note and resolution.

- [#184](https://github.com/delacournz/delacour-ui/pull/184) [`ebb7ed7`](https://github.com/delacournz/delacour-ui/commit/ebb7ed7947478725ed7100e1a2ce5e0334a439e4) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `NumberInput` — a number between a minus and a plus

  Tap a stepper to move by `step`, hold it to repeat after 400ms and accelerate, or type: while
  focused the field takes half-typed text (`""`, `"-"`, `"1."`) and commits on blur or submit, so it
  never fights the person typing. Every path goes through one reconcile — snapped to the step, held
  inside `[min, max]`, rounded to the step's precision — and `onValueChange` fires only on a committed
  change. The box is `Input.Group`'s, so it takes `Input`'s variants and sizes and an enclosing
  `Field`'s label, invalid and disabled state. `formatOptions` formats the value at rest through
  `Intl`; `commitMode="validate"` keeps an out-of-range number and flags it instead of clamping. The
  field is `adjustable` with increment and decrement actions for VoiceOver and TalkBack. The parse,
  format and step maths are exported as pure helpers. `bunx delacour add number-input` installs it.

- [#215](https://github.com/delacournz/delacour-ui/pull/215) [`79c4a7c`](https://github.com/delacournz/delacour-ui/commit/79c4a7c29cfd755385efea754dff51bd89f9dcde) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `OtpInput`, a one-time code or PIN drawn as a row of cells over one hidden `TextInput`, so the number pad, a paste, iOS's QuickType code from Messages and Android's SMS autofill all fill every cell at once. Every change is sanitised to `pattern` (`digits`, `alphanumeric`, `alphabetic` or a one-character `RegExp`) and cut to `length`; `onComplete` fires once per transition to a full code with a `success` haptic. `groupSize` draws separators between groups, or write the anatomy out with `OtpInput.Group`, `OtpInput.Slot` and `OtpInput.Separator`. `isMasked` draws dots without switching off autofill, the caret holds still under reduce motion, the row is one accessible element, and `isInvalid` / `isDisabled` cascade from a `Field`. `bunx delacour add otp-input` copies it.

- [#217](https://github.com/delacournz/delacour-ui/pull/217) [`6e86b00`](https://github.com/delacournz/delacour-ui/commit/6e86b00e2ac781b6781bef66600fb89f384c69d2) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add PageHeader: the head of a profile or place screen — a cover that reaches under the status bar, an avatar lifted over its edge, a title block, actions and a strip of stats that compacts on screen and reads in full. Add a `2xl` (96pt) Avatar size.

- [#178](https://github.com/delacournz/delacour-ui/pull/178) [`fdfe40e`](https://github.com/delacournz/delacour-ui/commit/fdfe40e864845850929f5257e1204a021b8cb213) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Planner`: a month of days, each showing what falls on it — category dots and icons, tinted tiles or named blocks — with swipe paging, a virtualised week scroller, a legend with counts and a bottom sheet of the selected day.

- [#194](https://github.com/delacournz/delacour-ui/pull/194) [`9679152`](https://github.com/delacournz/delacour-ui/commit/9679152ab9485be24d46a88ebb8334ab5fb6e0d5) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `ScrollBlur` — a progressive blur at a scrollable's edges that keeps floating controls legible over any background, falling back to a gradient wash with no engine or with Reduce Transparency on. Ships with `ScrollBlurLayerProvider`, the `expo/blur-layer` engine (`ExpoBlurLayer`, behind the new optional peer `expo-blur`), `useReduceTransparency` and `withAlpha` in `lib/color`. The CLI gains `scroll-blur`, `blur-layer` and `use-reduce-transparency` registry items, and classifies `expo-blur` as an `expo install` package.

- [#209](https://github.com/delacournz/delacour-ui/pull/209) [`2a4dd77`](https://github.com/delacournz/delacour-ui/commit/2a4dd77c8e21cf6618de905847bddd0188c635da) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `ScrollCanvas`, an image in a still frame that moves as the page scrolls — `parallax`, `zoom`, `reveal`, or a `sequence` of frames scrubbed by the scroll. It follows a `Screen` with no wiring or a `useScrollSource` source at any depth, takes a `progress` shared value to drive it directly, and draws each effect's resting state under Reduce Motion.

- [#213](https://github.com/delacournz/delacour-ui/pull/213) [`41e2238`](https://github.com/delacournz/delacour-ui/commit/41e2238cac88b0fd313485036b95e735bfed7b55) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `ScrollFade`, a gradient at a scrollable's edges while content runs past them

  `@delacour/react-native-ui/scroll-fade` overlays any scrollable — a card row, a list in a `Card`, a
  sheet body — and fades its start and end edges only while there is content past them, on either
  axis. It reads a `ScrollSource` from `useScrollSource`, or needs no wiring at all inside a `Screen`.
  The fade is a colour, so name the surface with `color`; `edges`, `size`, `fadeInDistance` and
  `insetStart` / `insetEnd` tune it. The CLI registry gains the `scroll-fade` item.

- [#201](https://github.com/delacournz/delacour-ui/pull/201) [`9b5a518`](https://github.com/delacournz/delacour-ui/commit/9b5a518d982b7441d49e62e3646e68d01ec9764a) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add ScrollHeader, a collapsing large title with a pinned bar, cover and snap.

- [#210](https://github.com/delacournz/delacour-ui/pull/210) [`875e78c`](https://github.com/delacournz/delacour-ui/commit/875e78ca24928d7eb6b0b1ed48266ac5251790fd) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `ScrollText`, text that resolves unit by unit as the screen scrolls past it. Four effects —
  `colour`, `fade`, `rise` and `highlight` — over a `word`, `character` (by grapheme) or `line` split,
  staggered by `overlap` inside a viewport `window`. Progress comes from the enclosing `Screen`, from
  any scroll view's offset (read against its own bounds with `viewport`), or from a shared value
  already in 0..1. Every frame runs on the UI thread and writes only opacity, transform and colour;
  un-revealed text never drops below a legible floor, reduce motion and `isMotionCalm` show it fully
  revealed, and the block reads as one accessibility element with the whole string.
  `delacour add scroll-text` copies it in.

- [#197](https://github.com/delacournz/delacour-ui/pull/197) [`7c96aa8`](https://github.com/delacournz/delacour-ui/commit/7c96aa8a10d0f41a184595fc086378aa95fdf952) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `SearchBar`, the query field at the top of a list, on `Input.Group` with no chrome of its own. A clear button that keeps focus and the keyboard, a Cancel action shown never, on focus or always that empties the text and dismisses the keyboard, `debounce` with `onDebouncedChange` (flushed by the search key, immediate on clear), `isLoading` swapping clear for a spinner, and `tokens` drawn as removable chips with Backspace removing the last. `pill` and `rounded` shapes over `Input`'s variants and sizes, and it joins an enclosing `Field`. `delacour add search-bar` copies it.

- [#171](https://github.com/delacournz/delacour-ui/pull/171) [`176847d`](https://github.com/delacournz/delacour-ui/commit/176847dbcb8dd8840b662aec2b84bc16ab14e08d) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Select` — a closed set of choices behind a field-shaped trigger, picked from a bottom sheet.

  - Single selection by default, where a pick closes the sheet; `selectionMode="multiple"` keeps it open, draws a box on each row and closes from a Done footer. `value` and `onValueChange` are typed per mode — a string or `null`, or an array — and `maxSelected` disables the remaining rows once reached.
  - Options come as data through `options`, or as `Select.Item` and `Select.Group` children, and both are drawn from one normalised, virtualised list. `isSearchable` adds a search field that matches case- and accent-insensitively, hides groups it empties and clears on close.
  - The trigger is `Input`'s own box at every variant and size. Inside a `Field` the select takes its invalid and disabled state, reads `Field.Label` as its accessible name and sheet title, and opens when the label is tapped. `isReadOnly`, `isLoading`, `renderValue` and a replaceable `Select.Trigger` cover the rest.
  - Rows are radios in single mode and checkboxes in multiple to a screen reader; group headings are headers. `SelectOptionRow` is exported as the leaf a later picker reuses.
  - Needs `@delacour/react-native-bottom-sheet` and `BottomSheetProvider`. `delacour add select` copies it into a project, along with `bottom-sheet`.

- [#187](https://github.com/delacournz/delacour-ui/pull/187) [`44edcd7`](https://github.com/delacournz/delacour-ui/commit/44edcd73a58cad7a15d5236d64da2137a9d0935e) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Signature`, a pad to sign with a finger or a stylus. Strokes are drawn on the UI thread and smoothed into ink, a tap leaves a dot, and React renders once per stroke rather than per move. `Signature.Undo`, `.Redo` and `.Clear` disable themselves when they would do nothing, and `onRequestAlternative` adds a "Can't sign? Type your name" link for anyone who cannot draw. The value is plain JSON that re-fits a pad of another size; the ref adds `toSVG()` and `toPaths()`. Four sizes, two variants, read-only and disabled states, and `isInvalid` / `isDisabled` cascade from a `Field`. `bunx delacour add signature` copies it.

- [#204](https://github.com/delacournz/delacour-ui/pull/204) [`5157898`](https://github.com/delacournz/delacour-ui/commit/515789859513ea24a0ecfea5e85df0705d639ad3) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add Sketch: a drawing surface with pen, shapes, eraser, colours, size and undo, drawn with Skia and exported as SVG or PNG. Needs `@shopify/react-native-skia`, now an optional peer.

- [#181](https://github.com/delacournz/delacour-ui/pull/181) [`6ac8e95`](https://github.com/delacournz/delacour-ui/commit/6ac8e95f8c8962acb866c7fdd102b85d268a710b) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Table`, rows and columns of short values lined up by one set of column rules

  `columns` on the table declares each column once — `{ flex }` or `{ width }`, with an `align` — and every row's
  Nth cell reads the Nth rule, so a header, the body and a footer line up without a width on any cell. Bare text is
  set in tabular figures. `Table.Head` takes `sort` to become a button that draws and announces its direction while
  the caller owns the order; `Table.Row` takes `onPress` and `isSelected` to become one selectable button named by its
  cells, and each cell announces its column's heading. `size`, `variant="outline"` and `striped` set density and
  chrome; `minWidth` scrolls a wide table sideways with edge fades that dissolve into the surface behind it; rows
  render from a `FlatList` with `index` and `isLast`; `Table.Empty` keeps the header; `Table.Frame` puts the table in a
  card under a title and an action. `bunx delacour add table` copies it into a project.

- [#185](https://github.com/delacournz/delacour-ui/pull/185) [`9dccb2f`](https://github.com/delacournz/delacour-ui/commit/9dccb2f9b10414d328e21298d36aaa7376646db2) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `ThemeSelector`, a System, Light or Dark choice read from the live Uniwind theme and applied to
  it. System is selected while the app follows the device, so a theme changed anywhere else
  re-selects it. `segmented` joins the options into one attached run; `cards` stands them apart as
  tiles. `applyTheme={false}` with `value` turns it into a presentation layer so the app can persist
  the preference itself — there is no storage dependency — and `restoreThemeMode` validates a stored
  string before it reaches `Uniwind.setTheme`. `useThemeSelection` reads and sets the mode with no
  selector mounted. `delacour add theme-selector` copies it, with `toggle-button`, `icon` and `field`
  as registry dependencies.

- [#193](https://github.com/delacournz/delacour-ui/pull/193) [`5af1ed2`](https://github.com/delacournz/delacour-ui/commit/5af1ed2b51f073ba867c362cfa3113b8d2442d7e) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `TimePicker`, a time of day on snapping wheels — hour, minute, optional second and, on a 12-hour clock, AM/PM. It presents as an `Input`-shaped trigger that opens a `BottomSheet`, or inline with `presentation="inline"`. The value is always a 24-hour `TimeValue`; `hourCycle` and `locale` change only how it reads. It takes `minuteStep`, `minTime`/`maxTime` (out-of-bounds rows dim and a wheel resting on one moves back), `showSeconds`, `visibleRows`, a custom `format`, `clearable`, controlled or uncontrolled value and open state, and joins an enclosing `Field`. Parts are `TimePicker.Trigger`, `.Value`, `.Icon`, `.Content`, `.Wheel`, `.Done` and `.Clear`; `TimePickerWheel` renders the bare wheel on its own, and the subpath exports the pure time helpers (`parseTime`, `serialiseTime`, `formatTime`, `snapTime`, `clampTime` and more). Each wheel column is one adjustable element to screen readers. The subpath imports the sheet engine, so it needs `@delacour/react-native-bottom-sheet` installed. The CLI can now `add time-picker`.

- [#180](https://github.com/delacournz/delacour-ui/pull/180) [`8fad439`](https://github.com/delacournz/delacour-ui/commit/8fad4399d219694825896b77422d5ceab326aca0) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Timeline`, a sequence of dated events down a rail or across a snapping strip

  `Timeline` lays out an order's history, a project's milestones or a match's key moments: each `Timeline.Item` is a
  marker on a rail with a title, a date, a description and optional side columns. One zero-based `value` says how far
  along the sequence is — events before it completed, at it current, after it upcoming — and the rail fills off that
  value alone, so it is never half drawn between two events. `tone` says what kind an event is (`info`, `success`,
  `warning`, `destructive`) and tints its marker whatever its progress. Five variants (`dot`, `icon`, `numbered`, `card`,
  `compact`) and two sizes. Horizontally it is a swipeable strip of columns that can snap, fires `onColumnChange` and a
  selection haptic as each column reaches the reading edge, and collapses an empty column to a tick. `Timeline.List`
  virtualises a long history over a `FlatList` and supplies each item's position itself. `Timeline.Masthead` and
  `Timeline.Stats` head the sequence. Each event is one VoiceOver stop, read as "Event 2 of 6, completed, success".

  `bunx delacour add timeline` copies it into your project.

### Patch Changes

- [#233](https://github.com/delacournz/delacour-ui/pull/233) [`4ed1b06`](https://github.com/delacournz/delacour-ui/commit/4ed1b063d76644a21febf620ff3d1609d6e2fd6b) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Fix `Item` and `ListGroup.Item` throwing with `asChild` and one child. Their text wrapping always returned an array, and `Pressable`'s `asChild` path calls `Children.only`, which rejects an array of one — so `<Item asChild onPress={…}><View /></Item>` threw. A single child now passes through as itself.

- [#234](https://github.com/delacournz/delacour-ui/pull/234) [`6ca108f`](https://github.com/delacournz/delacour-ui/commit/6ca108fb7e4566b8cf299228e76dd56f2b508521) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - `ListGroup.Item` renders a plain view when it has neither `onPress` nor `onLongPress`, so a static row is no longer announced as a button and runs no press feedback. Rows with a handler keep button semantics, disabled ones included.

- [#235](https://github.com/delacournz/delacour-ui/pull/235) [`b1cc1bc`](https://github.com/delacournz/delacour-ui/commit/b1cc1bc0307d3db3b59e9085ba000a9ea594dda9) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - `Pressable` wires screen-reader activation to `onPress` behind the same `disabled` / `busy` guard as the tap: `onAccessibilityTap` on iOS, so a VoiceOver double-tap no longer relies on UIKit synthesising a touch, and an `activate` action on Android, where a TalkBack double-tap previously fell through to a click with no listener. A caller that lists `activate` itself still owns it, and a caller's other actions are merged in. Every control built on `Pressable` — `Button`, `ListGroup.Item`, back and close buttons — inherits it.

- [#232](https://github.com/delacournz/delacour-ui/pull/232) [`266f5bf`](https://github.com/delacournz/delacour-ui/commit/266f5bffa062c688483e8198d8faafebdf5ea726) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Screen scrollables compose a caller's `onScroll` with their own scroll tracking. `Screen.FlatList`, `SectionList` and `LegendList` used to drop it; `Screen.ScrollArea` let it replace the tracking, freezing `ScrollShadow` and the navbar border. A plain callback and a `useAnimatedScrollHandler` result are both accepted.
- Updated dependencies [[`c6f3e76`](https://github.com/delacournz/delacour-ui/commit/c6f3e76b1f0a421d09107793dea1acfcb3c18361)]:
  - @delacour/react-native-bottom-sheet@0.2.0

## 0.3.0

### Minor Changes

- [#126](https://github.com/delacournz/delacour-ui/pull/126) [`2f720c5`](https://github.com/delacournz/delacour-ui/commit/2f720c588b43e0d1a036ed1be5d3e81b744a3f9e) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add Carousel: swipeable slides with peek, loop, vertical, coverflow, autoplay, dots and arrows. Adds `lib/paging`, the shared worklet-safe paging maths.

- [#163](https://github.com/delacournz/delacour-ui/pull/163) [`870cb5c`](https://github.com/delacournz/delacour-ui/commit/870cb5ce9988bfa46887ec66dbaa9abbb0a19791) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add the scroll family's shared base: `useScrollSource`, `scroll-maths` and `scroll-edges`

  `@delacour/react-native-ui/hooks/use-scroll-source` gives any scrollable a `ScrollSource` — its
  offset, content size and layout size as shared values, plus its axis — and the props to spread onto
  it; `ScrollSourceProvider` shares one and `useResolvedScrollSource` is how an effect finds it.
  `lib/scroll-maths` holds the worklet maths an edge affordance needs (`scrollEdgeOpacity`,
  `scrollProgress`, `readScrollEvent`) and `lib/scroll-edges` the band geometry. A `Screen` now
  publishes its own body as a scroll source, so scroll-linked effects inside one need no wiring. The
  CLI registry gains the three items, and `screen` now depends on `use-scroll-source`.

- [#164](https://github.com/delacournz/delacour-ui/pull/164) [`9ea878d`](https://github.com/delacournz/delacour-ui/commit/9ea878de09b3623cb8ba7b1631f9ee4f20563d08) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `useScrollSections` — section-aware scroll tracking for long screens.

  - `useScrollSections({ readingLine })` returns a `scrollHandler` for an `Animated.ScrollView`, a `register(id)` that hands back each section's `onLayout`, the `activeId` (React state that changes only when the reader crosses into another section), `progress` and `scrollY` as shared values, and `scrollTo(id)`.
  - The active section is resolved on the UI thread and crosses to React only on a change, so scrolling never re-renders the screen.
  - The pure resolvers behind it — `resolveActiveSection`, `resolveScrollProgress` and `resolveSectionScrollTarget` — are worklet-safe and exported from `lib/scroll-sections`.
  - `delacour add use-scroll-sections` copies the hook and its resolvers into a project.

## 0.2.0

### Minor Changes

- [#159](https://github.com/delacournz/delacour-ui/pull/159) [`db7f90d`](https://github.com/delacournz/delacour-ui/commit/db7f90de243b919bc2ef73202c4d3ac9a1b31395) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Map` — a themed map for places and paths, at `@delacour/react-native-ui/map`

  Markers that are React views and anchor on their pin's tip, labels, themed popups, routes, arcs and
  floating zoom, compass, recenter and locate controls, on MapLibre (`@maplibre/maplibre-react-native`).
  The basemap is OpenStreetMap vector tiles from OpenFreeMap — free, no key — painted from the theme's
  tokens on both platforms, so light, dark and any retuned theme carry through to the map; `mapStyle`
  or `buildMapStyle` swap in other tiles. Props set the opening view; a ref moves the camera with
  `flyTo`, `fitBounds` and `recenter`. `@maplibre/maplibre-react-native` is a new optional peer,
  resolved only by an app that imports `/map`; `delacour add map` copies the component into a project
  and `expo install`s it.

- [#131](https://github.com/delacournz/delacour-ui/pull/131) [`1bb7d69`](https://github.com/delacournz/delacour-ui/commit/1bb7d69c169b541a41c0943a69d94fc25022f36d) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - `cn()` now runs on [`cn`](https://github.com/shadcn-ui/cn) instead of `clsx` + `tailwind-merge`: the same output (held to tailwind-merge's on every variant class), much faster on repeated render calls. `clsx` is no longer a dependency; `tailwind-merge` stays, as `tailwind-variants`' peer for `tv()`. Components added with `delacour add` now install `cn`.

- [#131](https://github.com/delacournz/delacour-ui/pull/131) [`1bb7d69`](https://github.com/delacournz/delacour-ui/commit/1bb7d69c169b541a41c0943a69d94fc25022f36d) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add the etched material, the tray and the kicker — opt-in, the default look is unchanged

  `Surface` and `Card` take `material`: `flat` (default), `etched` (a one-pixel highlight set into the edge, with a very soft drop) and `tray` (a muted frame, 4pt padding, 2xl corner, whose panels take the xl corner and the card fill). `Button` and `Badge` take `material="etched"` — the primary button gains a white inset top edge, the quiet fills the light/dark edge, and an etched badge squares to the small corner with 8%/16% alpha soft status fills. `Input` and `Textarea` gain an `etched` variant that rings on focus. `Text.Kicker` is the ten-point, 0.2em-tracked uppercase mono label.

  New tokens in `tokens.css`: `--text-kicker`, `--tracking-kicker`, `--shadow-etched`, `--shadow-etched-dark`, `--shadow-etched-primary`, `--shadow-focus` and `--shadow-focus-dark`, registered with `tailwind-merge`. `theme.css` is untouched.

## 0.1.0

### Minor Changes

- [#97](https://github.com/delacournz/delacour-ui/pull/97) [`638f2d9`](https://github.com/delacournz/delacour-ui/commit/638f2d9e2093f1b2e62144bb8d3f53cb9a62c965) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Meter` — a measurement on a fixed scale, coloured by where it falls.

  - Built on `Progress`: `Meter.Header`, `Meter.Label`, `Meter.Output`, `Meter.Track` and `Meter.Fill` are the progress bar's parts, with a root that clamps the reading and judges it. A bare `<Meter value={68} />` draws the scale on its own.
  - Judge a reading by `low`, `high` and `optimum` — good, worse and worst regions painted success, warning and destructive, with `optimum` saying which end is good — or by a `thresholds` list naming the colour from points along the scale. The prop type allows one or the other, never both.
  - `segments` draws the scale as whole blocks that fade on and off; any reading above the floor lights at least one.
  - `valueLabel` takes a function handed the judged reading and its `region`, so the judgement is put into words that are drawn and spoken alike rather than left to colour. One accessible element with the `progressbar` role, spoken the way `Progress` speaks its value.
  - `delacour add meter` copies it into a project, along with `progress`.

- [#88](https://github.com/delacournz/delacour-ui/pull/88) [`ebaf127`](https://github.com/delacournz/delacour-ui/commit/ebaf127930b1b3fecdbd497ebc1d7e3f5885dbe3) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Progress` — a bar showing how far a task has got, or a looping segment while it is under way.

  - Compound anatomy: `Progress.Header`, `Progress.Label`, `Progress.Output`, `Progress.Track` and `Progress.Fill`; a bare `<Progress value={40} />` draws the track and fill on its own.
  - The fill animates on the UI thread as a clipped `translateX`, with no layout pass per frame. `isIndeterminate` sweeps a segment across the track, and breathes in place instead when Reduce Motion is on.
  - Six colours and three sizes, shared with `Slider`. `formatOptions`, a function child on `Progress.Output`, or `valueLabel` word the readout.
  - One accessible element with the `progressbar` role: the value is spoken as a percentage over 0–100 and as a count (`18 of 24`) over any other range, and an indeterminate bar reports busy with no value.
  - `delacour add progress` copies it into a project.

- [#137](https://github.com/delacournz/delacour-ui/pull/137) [`a71dc63`](https://github.com/delacournz/delacour-ui/commit/a71dc63815e3a33110f19b9fc2ec9505ba9d0398) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `SelectionMode` — pick several things at once, then act on them from a bar. A long press enters the mode with the pressed item picked; taps then toggle. `SelectionMode.Item` wraps any row, avatar or swatch with a round `leading` mark, a `ring` or nothing; `.Header` counts the picks and offers select-all and the way out; `.Bar` and `.Action` act on the selection; `.Group` lays items out as a stacked card, a grid or a horizontal strip. Selection is a set of ids, controllable alongside the mode, with an optional `max`.

  `delacour add selection-mode` copies it into a project.

- [#135](https://github.com/delacournz/delacour-ui/pull/135) [`57d6320`](https://github.com/delacournz/delacour-ui/commit/57d63202634494f2b85aad040624137d70a5e1b2) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `SlideButton`, a control confirmed by dragging a handle across a rail

  The handle tracks the finger exactly and only the release is sprung. A release confirms past
  `threshold` (0.9 by default) with a small look-ahead, but a flick from halfway never does, and
  `threshold={1}` demands the far end. Controlled, the handle waits at the end until `isCompleted`
  answers; a rejected `onComplete` promise takes it home. Variants `secondary`, `destructive` and
  `success`; sizes match `Button`. Screen readers confirm with one named action, and the control
  flips under RTL.

- [#132](https://github.com/delacournz/delacour-ui/pull/132) [`5f7b6e4`](https://github.com/delacournz/delacour-ui/commit/5f7b6e4fce36a746690478c4407226d0b5c450b1) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `StackCard` — a deck taken one card at a time by throwing the top one off.

  - Compound anatomy: `StackCard.Card`, `StackCard.Stamp`, `StackCard.Empty`, `StackCard.Actions` and `StackCard.Action`. The root sorts its children by type, and anything it does not recognise is a card.
  - One shared value — the top card's offset — drives the drag, the tilt, the stamps and the cards behind, so nothing re-renders during a drag and the next card is already in place when the top one leaves.
  - `directions` picks which ways a drag throws; a horizontal-only deck lets vertical scrolls through. A flick throws from a short drag, and a disallowed direction gives a little and returns.
  - `layout` draws the cards behind as a `stack`, a `fan` or `flat`, `depth` of them. Only a window around the top card is mounted, so a deck of five hundred costs what a deck of five does.
  - Undo brings the last card back from the side it left, and a controlled deck that leaves `index` where it was declines the throw and the card flies back.
  - Each allowed direction, and undo, is a screen-reader action on the top card, named by `directionLabels`; the cards behind are hidden. Under Reduce Motion a card fades rather than flies.
  - `delacour add stack-card` copies it into a project.

- [#94](https://github.com/delacournz/delacour-ui/pull/94) [`8e6fedd`](https://github.com/delacournz/delacour-ui/commit/8e6fedd7aff8a274325ca2e85cdf41511eb65ea3) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Alert`, a status message on a `Surface`

  Five statuses — `default`, `info`, `success`, `warning` and `destructive` — pick the leading glyph
  and colour it and the title from one token, while the description stays muted. `variant="soft"`
  washes the surface in the status's soft fill; `variant="surface"` keeps a neutral fill that steps
  off whatever it sits in. Three sizes move padding, type and glyph together. Composed from
  `Alert.Indicator`, `Alert.Content`, `Alert.Title`, `Alert.Description`, `Alert.Action` and
  `Alert.CloseButton`; `isDismissible` adds the close control, uncontrolled or through `isOpen` /
  `onOpenChange`, and `useAlert().dismiss` closes it from an action. `bunx delacour add alert` copies
  it into a project, with `surface` alongside.

- [#92](https://github.com/delacournz/delacour-ui/pull/92) [`d4b4b89`](https://github.com/delacournz/delacour-ui/commit/d4b4b893df4bcc7f4dfe0e0787ba7e68f983095b) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Avatar`

  A person as a picture. The initials of `name` are painted first and the image goes on top, so the circle is never
  empty while a picture loads or after it fails, and a failed source retries on its own when its URI or headers change.
  `variant` and `color` paint the fallback on the six colours `Badge` takes; `sm`, `md`, `lg` and `xl` are fixed edges.

  `Avatar.Badge` pins a count or, left empty, a presence dot to a corner without the circle clipping it. `Avatar.Group`
  overlaps its faces with the first on top, rings each in the page background, and counts the people past `max` — or
  up to `total` — in a trailing `+N` tile that `onOverflowPress` can make a button.

  `delacour add avatar` copies it in.

- [#139](https://github.com/delacournz/delacour-ui/pull/139) [`3ac4ac4`](https://github.com/delacournz/delacour-ui/commit/3ac4ac48e6037c3af09b46dcb97d95b19869a025) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - `Button.Group` takes `isAttached` and `isFullWidth`. `isAttached={false}` keeps the shared
  `variant`, `size`, `isDisabled` and `feedback` but drops the joined shape: every member keeps its
  own corners, no seam overlaps, the run takes a gap, and a press scales again. `isFullWidth` spans
  the parent and splits it equally between members, whatever their labels say. A custom member reads
  both through `useButtonGroupItem()`, as `isAttached` and `isStretched`.

- [#124](https://github.com/delacournz/delacour-ui/pull/124) [`7eedbec`](https://github.com/delacournz/delacour-ui/commit/7eedbecacc2a9a6f9dbc4a24644bef3c390185cb) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Calendar`, an always-visible month grid for picking one day (`mode="single"`), several (`"multiple"`) or a range (`"range"`), controlled or uncontrolled. Always six weeks, so the height never moves; swipe or tap the arrows to page, and tap the caption for month and year jump views. `minDate`/`maxDate` and `disabled` matchers (a date, a span, weekdays or a predicate) limit what can be picked; names and the first day of the week come from the locale. Two variants, three sizes on the input scale, optional `Surface` chrome, custom day content, and `isInvalid` / `isDisabled` / the label cascade from a `Field`. Days are plain `CalendarDate`s — `{ year, month, day }`, no time zone — with the helpers to compare, add, format, parse and serialise them, so no date library is needed. `bunx delacour add calendar` copies it.

- [#117](https://github.com/delacournz/delacour-ui/pull/117) [`2ee3fa2`](https://github.com/delacournz/delacour-ui/commit/2ee3fa29a51646a7d7e6b0d5bcc429864dd85ea5) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `isMotionCalm` to `DelacourProvider`, and `useCalmMotion()`

  An E2E build passes `isMotionCalm` and every decorative loop holds still, exactly as it does under
  the OS reduce-motion setting — so a test runner that waits for the screen to settle before each
  gesture (Argent, Detox, Maestro) never waits out a shimmering `Skeleton`. Motion that is the
  behaviour keeps moving: `Spinner` and an indeterminate `Progress` are untouched.

  `useCalmMotion()` (`@delacour/react-native-ui/hooks/use-calm-motion`) is the one question a
  component asks before it loops — reduce motion, or the app asking — and `CalmMotionProvider` sets
  the app's half for a hand-composed root. `Skeleton` and `Skeleton.Group` now read it.

- [#95](https://github.com/delacournz/delacour-ui/pull/95) [`e84ab6d`](https://github.com/delacournz/delacour-ui/commit/e84ab6dd133ef99510878a216bbd5cbaa525e97a) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Card`, a content surface with a header, a body and a footer

  Built on `Surface`, so it takes the same four fills and steps to the next one when nested. Six parts —
  `Card.Header`, `Card.Title`, `Card.Description`, `Card.Action`, `Card.Content` and `Card.Footer` —
  share one inset through context across three sizes, and the padding lives on the parts, so media placed
  straight in the card reaches its edges. `Card.Action` is pinned to the header's corner wherever it is
  written, the title follows the foreground token of the card's fill, and `Card.Footer variant="band"`
  sets the footer into the card on the next fill down. `useCard()` exposes the size and fill to custom
  parts, and `bunx delacour add card` copies it into a project, with `surface` alongside.

- [#90](https://github.com/delacournz/delacour-ui/pull/90) [`f600b93`](https://github.com/delacournz/delacour-ui/commit/f600b93678e5baf9c7d73ba33327cb525e9eaa92) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Chip`, an interactive pill for filters, tags and removable tokens

  What a chip does follows from its props. With no handler it is a plain tag; with `onPress` it is
  a button; with `isSelected`, `defaultSelected` or `onSelectedChange` it is a filter that toggles —
  controlled or uncontrolled, with a `selection` haptic, announced to a screen reader as selected or
  not. `onClose` adds a remove control with a press of its own, so removing a chip never also toggles
  it.

  ```tsx
  import { Chip } from "@delacour/react-native-ui/chip";

  <Chip isSelected={open} onSelectedChange={setOpen} variant="outline">
    <Icon icon={IconFilter1} />
    <Chip.Label>Open only</Chip.Label>
  </Chip>;
  ```

  It shares `Badge`'s colours, sizes and tones — an unselected `soft` or `outline` chip is painted
  exactly as the badge beside it — and selection swaps in a solid fill in the chip's colour without
  changing its size, so a wrapping row never reflows. Parts: `Chip.Label`, `Chip.StartContent`,
  `Chip.EndContent`, `Chip.CloseButton`, and `useChip()` for a child that restyles itself on
  selection.

  `bunx delacour add chip` copies it in, along with `badge`, whose tones it reads.

  `Pressable` now multiplies a `className`'s opacity into its press feedback instead of overwriting it,
  so a disabled `Button`, `Badge` or `Chip` fades as its variant says it should.

- [#87](https://github.com/delacournz/delacour-ui/pull/87) [`d999f83`](https://github.com/delacournz/delacour-ui/commit/d999f83f0d8c34cfcd7c7240f0ab9935bac5c78e) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Collapsible` — one section of content shown and hidden by its own trigger. Controlled (`isOpen` / `onOpenChange`) or uncontrolled (`defaultOpen`), with `Collapsible.Trigger`, `.Title`, `.Description`, `.Indicator` and `.Content`. The panel's height is measured and sprung, so whatever sits below follows it; the panel mounts on first open and stays mounted, and a closed panel leaves the accessibility tree. Shares `Accordion`'s variants, sizes and motion, and `bunx delacour add collapsible` copies it without pulling in an accordion.

- [#134](https://github.com/delacournz/delacour-ui/pull/134) [`7d4385e`](https://github.com/delacournz/delacour-ui/commit/7d4385eb18b74a8c9533b3e57f4da8b769d254e8) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `ContextMenu` — the actions that belong to a piece of content, reached by holding it. A hold opens the menu at the finger or against the whole trigger; a short press runs the trigger's `onPress`, and never both. `ContextMenu.Preview` lifts a copy of the held content over the scrim, with the panel beside it. The rows and the panel are Menu's own, and `Menu.Content` gains a `backdrop` prop for drawing over its scrim.

- [#125](https://github.com/delacournz/delacour-ui/pull/125) [`1c4284b`](https://github.com/delacournz/delacour-ui/commit/1c4284b916dfceb20a097f19e926e640dc0672f2) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Dialog`, a centred card over a dimmed app that asks for a decision or a short input

  `@delacour/react-native-ui/dialog`, and `delacour add dialog`. A compound root with `Trigger`,
  `Content`, `Close`, `Header`, `Title`, `Description`, `Body` and `Footer`, drawn through the overlay
  foundation, so it sits above every bottom sheet and the navigator's header. `isOpen` /
  `defaultOpen` / `onOpenChange`, and `isDismissible={false}` for an alert dialog that only its own
  actions close. Four sizes (`sm`, `md`, `lg`, `full`), a `plain` or `panel` footer that stacks on
  `sm`, a card that lifts just clear of the keyboard, a fade-only entrance under Reduce Motion, and
  accessibility focus that moves to the title on open and back to the trigger on close.

  Also: `Overlay.Portal`'s missing-provider warning no longer names the npm package, so a copied
  overlay carries no reference to it.

- [#129](https://github.com/delacournz/delacour-ui/pull/129) [`41506f8`](https://github.com/delacournz/delacour-ui/commit/41506f844caa291d9dd14ec63652b4d80b726333) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Drawer`, a panel that slides in from an edge and covers the app until dismissed

  `@delacour/react-native-ui/drawer`, and `delacour add drawer`. A compound root with `Trigger`,
  `Content`, `Header`, `Title`, `Description`, `Body`, `Footer` and `Close`, drawn through the overlay
  foundation, so it sits above every bottom sheet and the navigator's header. Four sides — `start` and
  `end` swap under RTL, plus `top` and `bottom` — and four sizes as a capped fraction of the window.
  Swipe toward the edge to dismiss: past 40% or on a fling it carries on from the finger, short of that
  it eases back, a selection haptic marks the threshold and the scrim thins with the drag. The panel
  pads the safe-area insets on its screen sides, fades instead of sliding under Reduce Motion, and
  moves accessibility focus to the title on open and back to the trigger on close.

- [#86](https://github.com/delacournz/delacour-ui/pull/86) [`1d02f49`](https://github.com/delacournz/delacour-ui/commit/1d02f49b03e8c07064296892c504bbe247646a35) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `EmptyState`

  A placeholder for a list or screen with nothing in it. `EmptyState.Header` stacks `Media`, `Title` and
  `Description`, and `EmptyState.Content` holds the actions. `variant="card"` draws a dashed block for an
  empty section beside populated ones, and `size` scales the padding, media and type together. A bare
  `Icon` in `Media` inherits its size and colour, and `Media variant="icon"` tints a box behind it.

  `delacour add empty-state` copies it into a project.

- [#136](https://github.com/delacournz/delacour-ui/pull/136) [`c03d5bb`](https://github.com/delacournz/delacour-ui/commit/c03d5bb4ff0c18a5f19ba8430dd94db081e9ae0d) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Fab`, one primary action floating over the screen it belongs to. `placement` pins it to the
  bottom start, centre or end of its nearest positioned ancestor, clear of the safe area, or leaves it
  in flow when omitted; sizes are 44, 56 and 64pt from new `--spacing-fab-*` tokens, in `primary`,
  `secondary`, `surface` and `destructive`. `isExtended` with `Fab.Label` makes a labelled stadium.
  `Fab.Group` unfolds a dial of `Fab.Action`s over a scrim from one spring with a stagger, turns its
  plus into a cross, unmounts the actions once closed, closes on the scrim, an action or Android back,
  and takes `isOpen` / `defaultOpen` / `onOpenChange`. `delacour add fab` copies it in.

- [#130](https://github.com/delacournz/delacour-ui/pull/130) [`b646977`](https://github.com/delacournz/delacour-ui/commit/b6469779f61d090262f95c4f9b17ae796850ad9b) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Feedback`, a dialog for writing — the field in a recessed well, the actions on the band around it

  `@delacour/react-native-ui/feedback`, and `delacour add feedback`. Built on `Dialog`, so open state,
  portal, scrim, back, escape, focus and the keyboard lift are Dialog's. A compound root with
  `Trigger`, `Content`, `Panel`, `Title`, `Close`, `Field`, `Footer`, `Action`, `Cancel` and `Submit`,
  and `useFeedback()`. The draft is `value` / `defaultValue` / `onValueChange` on the root and survives
  close and reopen until `clear()`. `Submit` is gated by `canSubmitFeedback` (empty and whitespace are
  empty, `canSubmitEmpty` for chips or a rating), passes the trimmed text, shows its loading state and
  makes the field read-only while a returned promise is in flight, and never closes on its own. The
  well eases to its measured height when a multi-step flow swaps its content, so the card never
  jumps; under Reduce Motion it changes height at once. The field grows from `minRows` (6) to
  `maxRows` (12) before it scrolls, and takes the title's text as its label.

- [#93](https://github.com/delacournz/delacour-ui/pull/93) [`3c33ec0`](https://github.com/delacournz/delacour-ui/commit/3c33ec0acd6b1665f93c7f500f1b74b2f7ea23bf) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Item`, a row of media, text and actions for lists and settings. It renders as a `Pressable` when given `onPress` and as a plain view otherwise, has `default`, `outline` and `muted` surfaces, `sm`/`md`/`lg` sizes, a `vertical` orientation for cards, `isDisabled` and `isSelected` states, and `Item.Media` (bare icon, icon tile or clipped image), `Item.Content`, `Item.Title`, `Item.Description`, `Item.Actions`, `Item.Header`, `Item.Footer`, `Item.Group` and `Item.Separator`. Dropped into a `ListGroup` it takes the group's size, draws no surface of its own and lines up with the group's dividers. The CLI can now `add item`.

- [#98](https://github.com/delacournz/delacour-ui/pull/98) [`d5944d4`](https://github.com/delacournz/delacour-ui/commit/d5944d4004e987797a2994dc6a62e0f327946dcc) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Kpi`, one number, its change and a sparkline of how it got there

  Built on `Card`, so it takes the card's four fills and three sizes and sits on the card's inset. `Kpi.Trend`
  takes a signed percentage and colours it by what it means rather than by its sign — `goodDirection` on the
  card says whether up, down or neither is good news, and every trend inside follows it — as a line of text or
  a badge with an arrow, announced as one string. `Kpi.Sparkline` is a `Chart` line with no axes in the card's
  series colour, under the number or in a fixed column beside it, and holding it scrubs a point: the KPI keeps
  the scrubbed index as controllable state that `useKpi()` reads. `isLoading` holds placeholders of each part's
  size, and `Kpi.Group` lays several metrics out in a row or a column, optionally on one surface with rules
  between. `Chart` gains `frameClassName`, which sizes the plot's frame. `bunx delacour add kpi` copies it into a
  project, with `card` and `chart` alongside.

- [#85](https://github.com/delacournz/delacour-ui/pull/85) [`4383198`](https://github.com/delacournz/delacour-ui/commit/438319823f65968c8551a8260fbe862d324066b8) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Label`, a form control's name with required, invalid and disabled states

  `Label` renders `Text.Label` and takes a colour, never a scale, so it keeps the type scale the rest
  of a form uses. `isRequired` appends a destructive asterisk as a nested run behind a no-break space,
  so a label that wraps carries the mark after its last word, and announces the label as
  "Email, required" rather than reading the asterisk aloud. `isInvalid` turns it destructive and
  `isDisabled` fades it and reports it disabled to assistive technology.

  ```tsx
  import { Label } from "@delacour/react-native-ui/label";

  <Label isRequired>Email</Label>;
  ```

  `bunx delacour add label` copies it in, bringing `text` and `tv` with it.

- [#133](https://github.com/delacournz/delacour-ui/pull/133) [`ad21e13`](https://github.com/delacournz/delacour-ui/commit/ad21e137d99b87f0f58bb32956c855f23cd82e83) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Menu` — a list of actions anchored to the control that opens it. Rows run an action and close; checkbox rows stay open, radio rows close; `Menu.Sub` expands in place. The panel flips above the trigger near the bottom of the screen, stays inside the safe area and scrolls past the room. `resolveMenuPlacement` is exported for a later popover to adopt.

- [#120](https://github.com/delacournz/delacour-ui/pull/120) [`033b774`](https://github.com/delacournz/delacour-ui/commit/033b7743238fbdc3fa2aef46f1c2613cf78f4a5f) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `OverlayProvider`, the layer every overlay is drawn on

  `@delacour/react-native-ui/overlay` mounts the one teleport host that overlays and bottom sheets
  share, and a registry that orders them in bands — every overlay above every sheet, an anchored
  panel above the dialog that opened it, a toast above both — and gives Android's back button to the
  topmost overlay only. `Overlay.Portal`, `Overlay.Scrim`, `useOverlayPresence` (keeps an overlay
  mounted through its exit animation) and `useOverlayBackHandler` are exported for building more.
  `BottomSheetProvider` now detects an `OverlayProvider` above or below it and mounts teleport's
  provider only once; the engine's provider takes `hasPortalProvider` to make that possible.
  `bunx delacour add overlay` copies it into a project.

- [#127](https://github.com/delacournz/delacour-ui/pull/127) [`927ab21`](https://github.com/delacournz/delacour-ui/commit/927ab21f808163c5ccea7b8f379df7b9a9dec2bf) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Popover` — a small panel anchored to its trigger that flips and shifts to stay inside the safe area and above the keyboard, with an arrow that keeps pointing at the trigger, a title, a description, a close control, an optional scrim, `width="trigger"` and a scrollable body. Its anchoring pieces — `resolveAnchoredPosition`, `useAnchorMeasure`, `useAnchoredContent` and `AnchoredArrow` — are exported for other anchored overlays. `delacour add popover` copies it.

- [#138](https://github.com/delacournz/delacour-ui/pull/138) [`7d260fd`](https://github.com/delacournz/delacour-ui/commit/7d260fdf6101311b592315b2e490f41b12a7f809) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `ProgressButton`, a button held rather than tapped to confirm. A fill grows from the leading
  edge over `holdDuration` (2000 ms by default) and `onComplete` fires only when it reaches the end,
  read from the animation's own finish rather than a timer. Released early, the fill plays back at the
  same rate, and a second press resumes from where it is. Every variant (`primary`, `secondary`,
  `destructive`, `success`) rests on the same surface and carries its colour in a label drawn twice,
  so the text stays readable across the wipe. It takes the button's sizes and a `pill` or `rounded`
  shape, draws a tick on completion or a caller's `ProgressButton.Done`, rewinds by travelling back
  with `isAutoReset` or a controlled `isCompleted`, steps in fifths under reduced motion, and
  completes on a screen reader's activate. `delacour add progress-button` copies it in.

- [#91](https://github.com/delacournz/delacour-ui/pull/91) [`ecf81ca`](https://github.com/delacournz/delacour-ui/commit/ecf81ca23b5d6baca611a4e4cf6de4438719e974) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Rating`, a row of stars that reads or sets a score. Tap a star or drag along the row to set it, in whole stars or any step that divides one (`step={0.5}` for halves); a read-only rating draws any value, filling a fraction of a star. `allowClear` lets a tap on the value held withdraw it, `Rating.Output` shows the value, and the row is one adjustable control to screen readers. Six colours, three sizes, and `isInvalid` / `isDisabled` cascade from a `Field`. `bunx delacour add rating` copies it.

- [#116](https://github.com/delacournz/delacour-ui/pull/116) [`e9ef1d4`](https://github.com/delacournz/delacour-ui/commit/e9ef1d4055a8159c5edab24658d03bedd6057b6f) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - `BottomSheet` is rewritten on `@delacour/react-native-bottom-sheet`, this repository's own headless engine, with the same compound shape — `Trigger`, `Portal`, `Overlay`, `Container`, `Content`, `ScrollView`, `Footer`, `Close`, `Title`, `Description` — and eight new parts: `Background`, `Handle`, `FlatList`, `SectionList`, `LegendList`, `TextInput`, `Steps` / `Step`, `Host` and `Provider`. `@gorhom/bottom-sheet` is no longer imported anywhere; its peer entry leaves in the next release.

  **Install.** The engine is an optional peer, like `@delacour/react-native-charts`: `bun add @delacour/react-native-bottom-sheet@alpha` and `expo install react-native-teleport`, then rebuild the dev client — teleport is a native module and needs the new architecture. `delacour add bottom-sheet` does both.

  **Provider.** `DelacourProvider` no longer mounts a sheet provider. Mount `BottomSheetProvider` from `@delacour/react-native-ui/bottom-sheet` once, inside `DelacourProvider` and around the navigator. Without it a `Portal` renders where it is written, as an inline sheet.

  **Renamed and moved props.** The engine's names win, and sizing and behaviour move from `Container` to the root:

  - `<BottomSheet.Container enableDynamicSizing={false} snapPoints={…} maxDynamicContentSize={…}>` → `<BottomSheet dynamicSizing={false} snapPoints={…} maxDynamicContentSize={…}>`. `Container` takes `className`, `style` and the three `*ClassName` props only.
  - `keyboardBehavior`, `keyboardBlurBehavior`, `enablePanDownToClose`, `enableOverDrag` and the other gorhom modal props move to the root under the same names; `android_keyboardInputMode` is gone (keyboard-controller owns the window). New on the root: `keyboardScope`, `detached`, `topInset`, `bottomInset` (defaults to the safe-area bottom), `stackBehavior`, `closeOnBack`, `keepMounted`, `animation`, `onSnapPointHaptic` / `onCloseHaptic` / `onOverDragHaptic`.
  - `<BottomSheet.Overlay isCloseOnPress={false}>` → `<BottomSheet.Overlay pressBehavior="none">`. Omitting `Overlay` still draws no scrim.
  - `BottomSheet.ScrollView` no longer needs `dynamicSizing={false}` or `snapPoints`: a list's content size is the dynamic snap point, capped by `maxDynamicContentSize`.
  - `BottomSheetHandle` (the ref type) is now `BottomSheetRef`; the old name is a deprecated alias. `useBottomSheetInput()` stays as an alias of the engine's `useBottomSheetTextInput()`. `resolveSheetBottomInset` / `resolveSheetScrollEndPadding` are re-exported from the engine's `./core`.
  - Removed: `BOTTOM_SHEET_KEYBOARD_DEFAULTS`, `resolveFooterPlacement`, and the container and portal contexts.

- [#96](https://github.com/delacournz/delacour-ui/pull/96) [`8da14c4`](https://github.com/delacournz/delacour-ui/commit/8da14c4248ae6ea2f75f35969d62b4978b26cad9) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Skeleton`, a placeholder for content that is still loading

  It comes in three shapes — `rect`, `line` and `circle` — and either shimmers a glint across itself or pulses its opacity, on the UI thread. Pass the real content as children and the placeholder takes its exact size, then fades the content in when `isLoading` flips off with nothing moving. `Skeleton.Lines` draws a paragraph, and `Skeleton.Group` keeps every skeleton inside it on one clock and one loading flag. Motion stops under the OS reduce-motion setting, and a placeholder stays hidden from screen readers unless it has a `label`. `bunx delacour add skeleton` copies it in.

- [#118](https://github.com/delacournz/delacour-ui/pull/118) [`77e6f73`](https://github.com/delacournz/delacour-ui/commit/77e6f73efca451681d4a34c83825f7f0c0865564) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Detents are snap points everywhere, matching the `snapPoints` prop. `DetentSpec` is `SnapPointSpec`, `onDetentHaptic` is `onSnapPointHaptic`, `useBottomSheetAnimated()`'s `detents` is `snapPoints`, the internal `detentCount` is `snapPointCount`, and the core helpers follow (`normalizeSnapPoints`, `parseSnapPoint`, `dynamicSnapPoint`, `crossedSnapPoint`, `snapPointUnder`). The handle's accessibility value reads "Snap point 1 of 2". The docs page moves to `/docs/bottom-sheet/snap-points`.

- [#99](https://github.com/delacournz/delacour-ui/pull/99) [`1de172e`](https://github.com/delacournz/delacour-ui/commit/1de172e68c91530f7e737bf1008dc2fa26ccad24) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Steps`, a stepper for multi-step flows

  `Steps` shows where someone is in a flow: numbered indicators joined by a line, each step completed, current or
  upcoming against one zero-based `value`. It runs horizontally, with titles under the indicators, or vertically, with
  titles and descriptions beside them, in two variants and three sizes. The connectors are drawn for you — the root
  counts its `Steps.Item`s and every one but the last draws a line to the next, filled once the value has passed it.

  A step can be loading (a spinner in the indicator), invalid (a cross and a destructive title) or disabled, and
  `completed` overrides whether it reads as done. Steps take presses and move the value there; `isLinear` keeps the
  steps ahead closed, and a controlled `value` with no `onValueChange` is a read-only progress display whose steps are
  not announced as buttons. `Steps.Panel` holds a step's form or summary below its title, outside the tap target, so its
  controls stay reachable by a screen reader. Each step is announced as its title with a value such as "Step 2 of 3,
  completed".

  `bunx delacour add steps` copies it into your project.

- [#83](https://github.com/delacournz/delacour-ui/pull/83) [`fd2209e`](https://github.com/delacournz/delacour-ui/commit/fd2209e0a73141f4e9676be5c8d2ce1a73dc8258) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Surface`, a rounded container on the theme's fill ladder

  Four fills — `default`, `secondary`, `tertiary` and `transparent` — and four padding steps. A
  surface that names no variant steps to the next fill from the one it sits in, so a panel inside a
  card never vanishes into it, and a transparent surface passes the plane beneath it through.
  `useSurface()` exposes the resolved fill to custom children, and `padding="none"` clips, for
  content bled to the corners. `bunx delacour add surface` copies it into a project.

- [#123](https://github.com/delacournz/delacour-ui/pull/123) [`0261acc`](https://github.com/delacournz/delacour-ui/commit/0261acc0f8d15137f06de8cc6effe5f6be62f191) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Swipe`, a row that slides aside to reveal actions behind it. `Swipe.Start` and `Swipe.End` hold `Swipe.Action` tiles; a drag far past them fires the outermost (`isFullSwipe`, on by default), `Swipe.Group` keeps one row open at a time, and a ref opens or closes the row from code. Every action is also published as an accessibility action on the row.

- [#89](https://github.com/delacournz/delacour-ui/pull/89) [`f24334f`](https://github.com/delacournz/delacour-ui/commit/f24334f1882d10553b920d8db4ce10e231f76865) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Textarea`, a multiline text field sized in rows. It renders `Input`'s box — variants, sizes, focus, invalid, disabled and the `Field` cascade — and adds a height derived from `rows` and the size's line height, `autoGrow` up to `maxRows`, and a `showCount` character count against `maxLength` that turns destructive at the limit. `delacour add textarea` copies it, with `input` and `text` as registry dependencies.

- [#122](https://github.com/delacournz/delacour-ui/pull/122) [`2937efb`](https://github.com/delacournz/delacour-ui/commit/2937efbf85072786ceb18853ce5f7c90d686d628) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Toast` — a brief message shown with `toast()` from anywhere, including outside React, and drawn by one `<ToastViewport />` mounted inside `OverlayProvider`. Toasts stack at the top or bottom edge, three drawn with the newest in front and the rest queued; they sit above the home indicator and the keyboard, pause their clock while touched or backgrounded, and swipe away toward their edge or sideways. Statuses, glyphs and title colours are `Alert`'s; `toast.promise` turns one loading toast into the success or the failure in place; `render` composes a custom card from `<Toast>`'s parts. Each toast is announced as it appears and stays at least ten seconds under a screen reader. Alert's status glyphs move to the `alert-glyphs.ts` leaf so the two share them. `delacour add toast` copies it.

- [#84](https://github.com/delacournz/delacour-ui/pull/84) [`0377ff9`](https://github.com/delacournz/delacour-ui/commit/0377ff9299c669ea073643434ff5e0afc5c06a38) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `ToggleButton`, a button that stays pressed. On its own it is controlled with `isSelected` and
  `onSelected` or holds its own state from `defaultSelected`; inside `ToggleButton.Group` the group
  owns one array of selected values, in `multiple` or `single` selection mode, with
  `isSelectionRequired` to keep the last choice from being cleared. Each state draws with one of the
  button's own variants (`default`, `outline`, `ghost`), so sizes, icons, loading and press feedback
  are the button's. An attached group joins into one run like `Button.Group`; a detached one wraps
  with a gap. The state is announced as a toggle button that is checked, or as a selected radio in a
  single-choice group. `delacour add toggle-button` copies it in.

- [#128](https://github.com/delacournz/delacour-ui/pull/128) [`dd83873`](https://github.com/delacournz/delacour-ui/commit/dd83873544ef43ae2db1f12372398fc9528f4466) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Tooltip` — a short label anchored to its control that opens on a long press (or a press, with `openOn="press"`), hides itself after `duration`, and closes on any outside tap while letting that tap through to what it landed on. It flips and shifts like `Popover`, has an inverted and a surface variant, an arrow that points at the trigger, and reads its `label` to a screen reader on the trigger without opening. `OverlayProvider` now hears every touch that starts beneath it, through `subscribeTouchStart`, without claiming any. `delacour add tooltip` copies it.

- [#48](https://github.com/delacournz/delacour-ui/pull/48) [`04bc15b`](https://github.com/delacournz/delacour-ui/commit/04bc15b32e86416bf32f4cece2fdf4e6af495f5b) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Publish the libraries under the `@delacour` org

  `delacour-react-native-ui` is now `@delacour/react-native-ui`, and `delacour-react-native-charts` is now
  `@delacour/react-native-charts`. The old names are deprecated and take no further versions. (Both were briefly spelled
  `@delacour/native-ui` and `@delacour/charts` in this repository; neither reached npm, so the line
  above is the whole story for anyone installing.) Nothing about the
  components changed — swap the package and the import prefix:

  ```bash
  bun remove delacour-react-native-ui delacour-react-native-charts
  bun add @delacour/react-native-ui@alpha @delacour/react-native-charts@alpha
  ```

  ```diff
  - import { Button } from "delacour-react-native-ui/button";
  + import { Button } from "@delacour/react-native-ui/button";
  ```

  and in `global.css`, `@import '@delacour/react-native-ui/styles';`.

  The CLI keeps its name. `delacour add chart` now installs `@delacour/react-native-charts`.

- [#22](https://github.com/delacournz/delacour-ui/pull/22) [`16175b8`](https://github.com/delacournz/delacour-ui/commit/16175b800122c5732bcff0673aebbb3f7450ca80) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add bar, scatter, candlestick and pie charts, stacked areas and horizontal bars

  **`@delacour/react-native-charts`** gains four marks and a second root. `ChartBar` draws
  one bar per datum on a cubic-cornered rect path, so a corner radius animates
  without snapping; sibling bars share a step and bars naming one `stackId`
  stack in data space, so the y domain covers the running totals rather than
  the tallest series. `ChartArea` takes the same `stackId`. `ChartScatter` is
  one Skia path per series, and `ChartCandlestick` draws every candle through every sentiment
  path so a colour flip is a morph rather than a cut. `orientation="horizontal"`
  swaps the axis roles at the model, so bars grow rightward from a category
  axis. `PolarChart` is the new root, with `PieSlices` on a fixed-verb path
  that morphs between any two data sets and a scrub-free tap that resolves a
  slice index. `@delacour/react-native-charts/core` exports the bar, scatter, candle and
  slice geometry alongside the scales.

  **`@delacour/react-native-ui/chart`** skins all of it. `Chart.Bar`, `Chart.Scatter`
  and `Chart.Candlestick` join `Chart.Line` and `Chart.Area`; bars group by
  being siblings, stack by sharing a `stackId`, round their value end from
  `--radius`, and take `labels`. Candles borrow `success`, `destructive` and
  `muted-foreground` for their sentiment. Over bars or candles `Chart.Tooltip.X`
  becomes a band one step wide. `PieChart` is a second root — `PieChart.Slice`,
  `.Label`, `.Center`, `.Tooltip` and `.Legend` — whose categories are its rows,
  with `innerRadius` for a donut and a tap-driven readout.

  Series colours now dedupe before the theme lookup, so twenty slices walking
  the five-token ramp resolve five tokens rather than throwing past the eighth.

  The CLI's chart registry item picks up the new files and names the new marks
  in its description.

- [#21](https://github.com/delacournz/delacour-ui/pull/21) [`d9a7473`](https://github.com/delacournz/delacour-ui/commit/d9a7473cd5acee4113a59d16799feecd16a4fcc0) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Button.Group`, which joins several controls into one segmented run — with
  `Button.Group.Separator` for a rule between two members and `Button.Group.Text`
  for a chunk that says something rather than doing something. An `Input` joins the
  same way.

  ```tsx
  <Button.Group variant="outline">
    <Button onPress={archive}>Archive</Button>
    <Button onPress={report}>Report</Button>
    <Button onPress={snooze}>Snooze</Button>
  </Button.Group>

  <Button.Group>
    <Button onPress={save}>Save</Button>
    <Button.Group.Separator />
    <Button accessibilityLabel="More" size="icon-md" onPress={openMenu}>
      <Icon icon={IconChevronDownSmall} />
    </Button>
  </Button.Group>
  ```

  Each member squares the pair of corners crossing a seam and overlaps its
  neighbour by a point, so two adjacent borders draw as one hairline. React Native
  has no sibling selector, so a member's place is computed in JavaScript and
  published through context rather than matched with CSS — which also means a
  control this package has never heard of can join a run by reading
  `useButtonGroupItem()`.

  The group owns its members' axes: their step outright, since controls of
  different heights do not join, and `variant`, `isDisabled` and `feedback` as
  defaults a member may override. A member keeps its own _shape_, so a square
  button still works inside a run — an `icon-md` member of an `sm` group comes out
  `icon-sm`.

  Nothing existing changes behaviour: a button outside a group draws exactly the
  corner it drew before.

  - New exports: `BUTTON_GROUP_ORIENTATIONS`, `BUTTON_GROUP_POSITIONS`,
    `BUTTON_GROUP_SEPARATOR_ORIENTATION`, `BUTTON_FEEDBACK`,
    `BUTTON_GROUP_FEEDBACK`, `useButtonGroup`, `useButtonGroupContext`,
    `useButtonGroupItem`, `useButtonGroupItemContext`, `ButtonGroupProvider`,
    `ButtonGroupItemProvider`, and the pure resolvers `resolveGroupPositions`,
    `resolveGroupSeams`, `resolveButtonFeedback`, `resolveGroupedButtonSize` and
    `resolveButtonSizeStep`.

- [#53](https://github.com/delacournz/delacour-ui/pull/53) [`f05da78`](https://github.com/delacournz/delacour-ui/commit/f05da7876dcf7b63a99c3ec18dfe47f9d50c6657) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Name both libraries for what they are

  `@delacour/react-native-ui` and `@delacour/react-native-charts` — the names they published under
  before the scope, with the `delacour-` prefix traded for `@delacour/` rather than dropped. Every
  subpath keeps its spelling (`@delacour/react-native-ui/button`, `@delacour/react-native-charts/core`),
  so only the package half of an import changes.

  The pair now matches: the charts package was briefly `@delacour/charts`, which did not say React
  Native and did not sit beside its sibling. Neither intermediate spelling reached npm.

  The CLI stays `delacour`, unscoped, because it is the thing people type:
  `bunx delacour@alpha add button`.

  `@types/react` is pinned in the workspace catalog as part of this: four packages declared three
  different ranges, so two copies were always installed and only hoisting order decided which reached
  the root. The rename changed that order, split `Ref` types across two copies and collapsed every
  `ComponentRef<typeof Animated.View>` to `never`.

- [#25](https://github.com/delacournz/delacour-ui/pull/25) [`c0a7ca4`](https://github.com/delacournz/delacour-ui/commit/c0a7ca4dfb4e97e09c97b6335f19c657c7535616) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - One theme file, the same shape everywhere

  `theme.css` is now the one file in `styles/` that is yours, and its header says so. What
  `delacour init` ships, what the docs site's `/theme` page emits with no preset, and what
  `delacour theme` writes are held to the same shape, declaration for declaration.

  **`delacour theme` converts `theme.css` in place.** Paste a shadcn or tweakcn `globals.css` over
  the file and run the command with no argument: a file already in Uniwind's shape is left alone, a
  shadcn-shaped one is rewritten, and anything else is named. `delacour doctor` fails on a `theme.css`
  still in shadcn's `:root` / `.dark` shape, which Uniwind reads as a utility class named `dark` and a
  dark theme that never arrives.

  **The converter fills what shadcn v4 stopped declaring.** `--destructive-foreground` — which
  `Button`, `Badge`, `Switch`, `Slider` and `Checkbox` all paint with — and the shadow scale are now
  derived when a source omits them, and the light `--elevated` derivation follows the card, as the
  shipped file already did.

  **The shipped defaults are shadcn's current ones.** The chart ramp is the neutral greys `shadcn
init` writes today, and the default typeface is each platform's own sans rather than Geist, which a
  fresh app had never loaded. The `/theme` page shows `theme.css` first, with shadcn's `globals.css`
  in a second tab for a web app sharing the theme.

- [#22](https://github.com/delacournz/delacour-ui/pull/22) [`16175b8`](https://github.com/delacournz/delacour-ui/commit/16175b800122c5732bcff0673aebbb3f7450ca80) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add charts: a headless Skia engine, and the `Chart` component that skins it

  **`@delacour/react-native-charts` is new** — a token-free charting engine for React Native,
  drawn with Skia, animated with Reanimated and driven by Gesture Handler. It
  ships `CartesianChart` with `Line`, `Area`, `Grid` and both axes, a scrub whose
  dot rides the drawn curve rather than hopping between data points, and path
  morphing that never falls back to snapping. `@delacour/react-native-charts/core` is every
  scale, tick, curve and solver in it, importable with no Skia in the module graph.

  **`@delacour/react-native-ui/chart`** is that engine wearing the theme. A shadcn-shaped
  `config` names each series and assigns `--chart-1` … `--chart-5` by position, so
  a call site writes `<Chart.Line yKey="revenue" />` and never a colour. Parts are
  placed rather than configured: `Chart.Grid`, `Chart.Line`, `Chart.Area`,
  `Chart.XAxis` and `Chart.YAxis` draw into the canvas, while `Chart.Tooltip` and
  `Chart.Legend` are React Native views layered over and under it.

  Also new: `--spacing-chart-sm/md/lg`, because a canvas has no intrinsic height
  and a dashboard's rows only line up if every chart agrees on one.

  **This needs a dev-client rebuild.** `@shopify/react-native-skia` is a native
  module and is new to the workspace — run `expo prebuild --clean` and rebuild
  before running the playground.

  The CLI learns two things: how to install a Skia-backed component, and that
  `@delacour/react-native-charts` publishes to the `alpha` tag while this repository is in pre
  mode, since a bare `bun add` of it would resolve `latest` and find nothing.

- [#19](https://github.com/delacournz/delacour-ui/pull/19) [`dea1a7c`](https://github.com/delacournz/delacour-ui/commit/dea1a7c30963629cb8581b6ea1ade7f266a70b57) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - **Breaking.** `Button`'s `isIconOnly` prop is removed. A square footprint is now a
  size: `size="icon-sm"`, `size="icon-md"` or `size="icon-lg"`.

  ```tsx
  // before
  <Button accessibilityLabel="Favourite" isIconOnly size="sm" variant="ghost">

  // after
  <Button accessibilityLabel="Favourite" size="icon-sm" variant="ghost">
  ```

  Each `icon-*` size is its labelled step with the horizontal padding traded for a
  width off the same token, which is shadcn's spelling and makes padding and width
  mutually exclusive by construction rather than by rule.

  - `BUTTON_SIZES` now holds all six values, and is derived from the new
    `BUTTON_LABEL_SIZES` and `BUTTON_ICON_SIZES` tuples. `ButtonSize` widens to
    match; `ButtonLabelSize` and `ButtonIconSize` are exported alongside it.
  - `buttonVariants` no longer accepts `isIconOnly`; pass the size instead. Its
    signature now matches the public prop exactly, so
    `buttonVariants({ size: "icon-md" })` works.
  - `ButtonLayout` loses `isIconOnly`, and `resolveButtonLayout` no longer takes
    it — it now folds only `isLoading` and `spinnerPlacement`.
  - `useButton()` reports `size` verbatim, so an icon button returns `"icon-lg"`
    rather than `"lg"`. Match against `BUTTON_ICON_SIZES` where a child needs to
    know it sits inside a square one.

### Patch Changes

- [#117](https://github.com/delacournz/delacour-ui/pull/117) [`2ee3fa2`](https://github.com/delacournz/delacour-ui/commit/2ee3fa29a51646a7d7e6b0d5bcc429864dd85ea5) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Fix `Accordion` and `Collapsible` panels that never opened on their first expand in Release builds

  The item's effect decided "has the panel measured?" by reading the measured height's shared value
  on the JS thread, straight after the panel's `onLayout` had written it. That write is queued onto
  the UI runtime and the read does not drain the queue, so a Release build read the unmeasured
  sentinel every time, bailed, and nothing re-ran it — the trigger said expanded and the panel stayed
  shut. Debug builds were slow enough to hide it. "Measured" is now React state, the decision is a
  pure `accordionTravelTarget` / `collapsibleTravelTarget`, and a test sweeps both components for any
  JS-thread read of the height.

- [#112](https://github.com/delacournz/delacour-ui/pull/112) [`f74bc73`](https://github.com/delacournz/delacour-ui/commit/f74bc73f7c0d3582d5ca85609c35a62c76ef0356) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - `Chip`, `Badge` and `Alert` take a `closeTestID` and forward it to the close control they compose in, so a test or automation can press "Remove" or "Dismiss" by id rather than by its label.

- [#103](https://github.com/delacournz/delacour-ui/pull/103) [`96e65cd`](https://github.com/delacournz/delacour-ui/commit/96e65cd3d0dd824215cfab6bfdd12a32cf47bf0b) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Pressable multiplies a className's opacity into its press feedback instead of overwriting it, so a disabled Button, Badge, Checkbox, ListGroup.Item or Input.Group now fades as its variant asks.

- [#62](https://github.com/delacournz/delacour-ui/pull/62) [`cef6a2a`](https://github.com/delacournz/delacour-ui/commit/cef6a2a81a7b97034768c229ea87b8c11e768071) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - End `BottomSheet.ScrollView` at a sticky footer's top edge, so the scroll indicator and the overscroll bounce stop above the footer instead of running on underneath it

- [#100](https://github.com/delacournz/delacour-ui/pull/100) [`f0df6bd`](https://github.com/delacournz/delacour-ui/commit/f0df6bddbfe8e7ccee0e651c4224000eb2f74b74) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - `Slider.Thumb` now has an accessible name. It defaults to the enclosing `Field.Label`'s text — the label alone for one thumb, "…, minimum" and "…, maximum" for a range's two — and an `accessibilityLabel` on the thumb wins outright. A range with no label still reads "Minimum" and "Maximum". `Field.Label` registers its text with the field's context (`label` / `registerLabel`), so any control can read it; `resolveFieldLabelText` and `resolveThumbAccessibilityLabel` are exported.

- [#46](https://github.com/delacournz/delacour-ui/pull/46) [`77f41f1`](https://github.com/delacournz/delacour-ui/commit/77f41f1aeb271d24baee77a7b1a5240bbb2cf03d) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Fix the corner seam on a checked `Checkbox`

  The fill sat exactly inside the border, so its outer curve and the border's inner
  curve were the same curve rasterised on two layers. Antialiased independently
  they under-cover where they meet, letting the box's own `bg-card` bleed through
  as a dull arc at each corner — on iOS and Android alike, and at every size. The
  straight edges are pixel-aligned, which is why only the corners showed it.

  The fill now overlaps the border ring instead of meeting it: `-inset-px` reaches
  past the padding box, and it wears the box's own corner rather than one a border
  width tighter. There is no longer a shared edge to leave a seam.

- Updated dependencies [[`e9ef1d4`](https://github.com/delacournz/delacour-ui/commit/e9ef1d4055a8159c5edab24658d03bedd6057b6f), [`033b774`](https://github.com/delacournz/delacour-ui/commit/033b7743238fbdc3fa2aef46f1c2613cf78f4a5f), [`77e6f73`](https://github.com/delacournz/delacour-ui/commit/77e6f73efca451681d4a34c83825f7f0c0865564), [`04bc15b`](https://github.com/delacournz/delacour-ui/commit/04bc15b32e86416bf32f4cece2fdf4e6af495f5b), [`16175b8`](https://github.com/delacournz/delacour-ui/commit/16175b800122c5732bcff0673aebbb3f7450ca80), [`cc9fb6a`](https://github.com/delacournz/delacour-ui/commit/cc9fb6afb7e2e4babe83653a9bf38c3278fc9c25), [`e76311f`](https://github.com/delacournz/delacour-ui/commit/e76311f8a8f9ff6956bca6aa8361fb7ac2856cbe), [`f05da78`](https://github.com/delacournz/delacour-ui/commit/f05da7876dcf7b63a99c3ec18dfe47f9d50c6657), [`16175b8`](https://github.com/delacournz/delacour-ui/commit/16175b800122c5732bcff0673aebbb3f7450ca80), [`840a3af`](https://github.com/delacournz/delacour-ui/commit/840a3af7e5dc4f0c0d98ee88a8e3fa9742406e5f)]:
  - @delacour/react-native-bottom-sheet@0.1.0
  - @delacour/react-native-charts@0.1.0

## 0.1.0-alpha.5

### Patch Changes

- [#103](https://github.com/delacournz/delacour-ui/pull/103) [`96e65cd`](https://github.com/delacournz/delacour-ui/commit/96e65cd3d0dd824215cfab6bfdd12a32cf47bf0b) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Pressable multiplies a className's opacity into its press feedback instead of overwriting it, so a disabled Button, Badge, Checkbox, ListGroup.Item or Input.Group now fades as its variant asks.

- [#100](https://github.com/delacournz/delacour-ui/pull/100) [`f0df6bd`](https://github.com/delacournz/delacour-ui/commit/f0df6bddbfe8e7ccee0e651c4224000eb2f74b74) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - `Slider.Thumb` now has an accessible name. It defaults to the enclosing `Field.Label`'s text — the label alone for one thumb, "…, minimum" and "…, maximum" for a range's two — and an `accessibilityLabel` on the thumb wins outright. A range with no label still reads "Minimum" and "Maximum". `Field.Label` registers its text with the field's context (`label` / `registerLabel`), so any control can read it; `resolveFieldLabelText` and `resolveThumbAccessibilityLabel` are exported.

## 0.1.0-alpha.4

### Patch Changes

- [#62](https://github.com/delacournz/delacour-ui/pull/62) [`cef6a2a`](https://github.com/delacournz/delacour-ui/commit/cef6a2a81a7b97034768c229ea87b8c11e768071) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - End `BottomSheet.ScrollView` at a sticky footer's top edge, so the scroll indicator and the overscroll bounce stop above the footer instead of running on underneath it

## 0.1.0-alpha.3

### Minor Changes

- [#53](https://github.com/delacournz/delacour-ui/pull/53) [`f05da78`](https://github.com/delacournz/delacour-ui/commit/f05da7876dcf7b63a99c3ec18dfe47f9d50c6657) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Name both libraries for what they are

  `@delacour/react-native-ui` and `@delacour/react-native-charts` — the names they published under
  before the scope, with the `delacour-` prefix traded for `@delacour/` rather than dropped. Every
  subpath keeps its spelling (`@delacour/react-native-ui/button`, `@delacour/react-native-charts/core`),
  so only the package half of an import changes.

  The pair now matches: the charts package was briefly `@delacour/charts`, which did not say React
  Native and did not sit beside its sibling. Neither intermediate spelling reached npm.

  The CLI stays `delacour`, unscoped, because it is the thing people type:
  `bunx delacour@alpha add button`.

  `@types/react` is pinned in the workspace catalog as part of this: four packages declared three
  different ranges, so two copies were always installed and only hoisting order decided which reached
  the root. The rename changed that order, split `Ref` types across two copies and collapsed every
  `ComponentRef<typeof Animated.View>` to `never`.

### Patch Changes

- Updated dependencies [[`f05da78`](https://github.com/delacournz/delacour-ui/commit/f05da7876dcf7b63a99c3ec18dfe47f9d50c6657)]:
  - @delacour/react-native-charts@0.1.0-alpha.4

## 0.1.0-alpha.2

### Minor Changes

- [#48](https://github.com/delacournz/delacour-ui/pull/48) [`04bc15b`](https://github.com/delacournz/delacour-ui/commit/04bc15b32e86416bf32f4cece2fdf4e6af495f5b) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Publish the libraries under the `@delacour` org

  `delacour-react-native-ui` is now `@delacour/react-native-ui`, and `delacour-react-native-charts` is now
  `@delacour/react-native-charts`. The old names are deprecated and take no further versions. Nothing about the
  components changed — swap the package and the import prefix:

  ```bash
  bun remove delacour-react-native-ui delacour-react-native-charts
  bun add @delacour/react-native-ui@alpha @delacour/react-native-charts@alpha
  ```

  ```diff
  - import { Button } from "delacour-react-native-ui/button";
  + import { Button } from "@delacour/react-native-ui/button";
  ```

  and in `global.css`, `@import '@delacour/react-native-ui/styles';`.

  The CLI keeps its name. `delacour add chart` now installs `@delacour/react-native-charts`.

### Patch Changes

- [#46](https://github.com/delacournz/delacour-ui/pull/46) [`77f41f1`](https://github.com/delacournz/delacour-ui/commit/77f41f1aeb271d24baee77a7b1a5240bbb2cf03d) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Fix the corner seam on a checked `Checkbox`

  The fill sat exactly inside the border, so its outer curve and the border's inner
  curve were the same curve rasterised on two layers. Antialiased independently
  they under-cover where they meet, letting the box's own `bg-card` bleed through
  as a dull arc at each corner — on iOS and Android alike, and at every size. The
  straight edges are pixel-aligned, which is why only the corners showed it.

  The fill now overlaps the border ring instead of meeting it: `-inset-px` reaches
  past the padding box, and it wears the box's own corner rather than one a border
  width tighter. There is no longer a shared edge to leave a seam.

- Updated dependencies [[`04bc15b`](https://github.com/delacournz/delacour-ui/commit/04bc15b32e86416bf32f4cece2fdf4e6af495f5b)]:
  - @delacour/react-native-charts@0.1.0-alpha.3

## 0.1.0-alpha.1

### Minor Changes

- [#22](https://github.com/delacournz/delacour-ui/pull/22) [`16175b8`](https://github.com/delacournz/delacour-ui/commit/16175b800122c5732bcff0673aebbb3f7450ca80) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add bar, scatter, candlestick and pie charts, stacked areas and horizontal bars

  **`@delacour/react-native-charts`** gains four marks and a second root. `ChartBar` draws
  one bar per datum on a cubic-cornered rect path, so a corner radius animates
  without snapping; sibling bars share a step and bars naming one `stackId`
  stack in data space, so the y domain covers the running totals rather than
  the tallest series. `ChartArea` takes the same `stackId`. `ChartScatter` is
  one Skia path per series, and `ChartCandlestick` draws every candle through every sentiment
  path so a colour flip is a morph rather than a cut. `orientation="horizontal"`
  swaps the axis roles at the model, so bars grow rightward from a category
  axis. `PolarChart` is the new root, with `PieSlices` on a fixed-verb path
  that morphs between any two data sets and a scrub-free tap that resolves a
  slice index. `@delacour/react-native-charts/core` exports the bar, scatter, candle and
  slice geometry alongside the scales.

  **`@delacour/react-native-ui/chart`** skins all of it. `Chart.Bar`, `Chart.Scatter`
  and `Chart.Candlestick` join `Chart.Line` and `Chart.Area`; bars group by
  being siblings, stack by sharing a `stackId`, round their value end from
  `--radius`, and take `labels`. Candles borrow `success`, `destructive` and
  `muted-foreground` for their sentiment. Over bars or candles `Chart.Tooltip.X`
  becomes a band one step wide. `PieChart` is a second root — `PieChart.Slice`,
  `.Label`, `.Center`, `.Tooltip` and `.Legend` — whose categories are its rows,
  with `innerRadius` for a donut and a tap-driven readout.

  Series colours now dedupe before the theme lookup, so twenty slices walking
  the five-token ramp resolve five tokens rather than throwing past the eighth.

  The CLI's chart registry item picks up the new files and names the new marks
  in its description.

- [#21](https://github.com/delacournz/delacour-ui/pull/21) [`d9a7473`](https://github.com/delacournz/delacour-ui/commit/d9a7473cd5acee4113a59d16799feecd16a4fcc0) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add `Button.Group`, which joins several controls into one segmented run — with
  `Button.Group.Separator` for a rule between two members and `Button.Group.Text`
  for a chunk that says something rather than doing something. An `Input` joins the
  same way.

  ```tsx
  <Button.Group variant="outline">
    <Button onPress={archive}>Archive</Button>
    <Button onPress={report}>Report</Button>
    <Button onPress={snooze}>Snooze</Button>
  </Button.Group>

  <Button.Group>
    <Button onPress={save}>Save</Button>
    <Button.Group.Separator />
    <Button accessibilityLabel="More" size="icon-md" onPress={openMenu}>
      <Icon icon={IconChevronDownSmall} />
    </Button>
  </Button.Group>
  ```

  Each member squares the pair of corners crossing a seam and overlaps its
  neighbour by a point, so two adjacent borders draw as one hairline. React Native
  has no sibling selector, so a member's place is computed in JavaScript and
  published through context rather than matched with CSS — which also means a
  control this package has never heard of can join a run by reading
  `useButtonGroupItem()`.

  The group owns its members' axes: their step outright, since controls of
  different heights do not join, and `variant`, `isDisabled` and `feedback` as
  defaults a member may override. A member keeps its own _shape_, so a square
  button still works inside a run — an `icon-md` member of an `sm` group comes out
  `icon-sm`.

  Nothing existing changes behaviour: a button outside a group draws exactly the
  corner it drew before.

  - New exports: `BUTTON_GROUP_ORIENTATIONS`, `BUTTON_GROUP_POSITIONS`,
    `BUTTON_GROUP_SEPARATOR_ORIENTATION`, `BUTTON_FEEDBACK`,
    `BUTTON_GROUP_FEEDBACK`, `useButtonGroup`, `useButtonGroupContext`,
    `useButtonGroupItem`, `useButtonGroupItemContext`, `ButtonGroupProvider`,
    `ButtonGroupItemProvider`, and the pure resolvers `resolveGroupPositions`,
    `resolveGroupSeams`, `resolveButtonFeedback`, `resolveGroupedButtonSize` and
    `resolveButtonSizeStep`.

- [#25](https://github.com/delacournz/delacour-ui/pull/25) [`c0a7ca4`](https://github.com/delacournz/delacour-ui/commit/c0a7ca4dfb4e97e09c97b6335f19c657c7535616) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - One theme file, the same shape everywhere

  `theme.css` is now the one file in `styles/` that is yours, and its header says so. What
  `delacour init` ships, what the docs site's `/theme` page emits with no preset, and what
  `delacour theme` writes are held to the same shape, declaration for declaration.

  **`delacour theme` converts `theme.css` in place.** Paste a shadcn or tweakcn `globals.css` over
  the file and run the command with no argument: a file already in Uniwind's shape is left alone, a
  shadcn-shaped one is rewritten, and anything else is named. `delacour doctor` fails on a `theme.css`
  still in shadcn's `:root` / `.dark` shape, which Uniwind reads as a utility class named `dark` and a
  dark theme that never arrives.

  **The converter fills what shadcn v4 stopped declaring.** `--destructive-foreground` — which
  `Button`, `Badge`, `Switch`, `Slider` and `Checkbox` all paint with — and the shadow scale are now
  derived when a source omits them, and the light `--elevated` derivation follows the card, as the
  shipped file already did.

  **The shipped defaults are shadcn's current ones.** The chart ramp is the neutral greys `shadcn
init` writes today, and the default typeface is each platform's own sans rather than Geist, which a
  fresh app had never loaded. The `/theme` page shows `theme.css` first, with shadcn's `globals.css`
  in a second tab for a web app sharing the theme.

- [#22](https://github.com/delacournz/delacour-ui/pull/22) [`16175b8`](https://github.com/delacournz/delacour-ui/commit/16175b800122c5732bcff0673aebbb3f7450ca80) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - Add charts: a headless Skia engine, and the `Chart` component that skins it

  **`@delacour/react-native-charts` is new** — a token-free charting engine for React Native,
  drawn with Skia, animated with Reanimated and driven by Gesture Handler. It
  ships `CartesianChart` with `Line`, `Area`, `Grid` and both axes, a scrub whose
  dot rides the drawn curve rather than hopping between data points, and path
  morphing that never falls back to snapping. `@delacour/react-native-charts/core` is every
  scale, tick, curve and solver in it, importable with no Skia in the module graph.

  **`@delacour/react-native-ui/chart`** is that engine wearing the theme. A shadcn-shaped
  `config` names each series and assigns `--chart-1` … `--chart-5` by position, so
  a call site writes `<Chart.Line yKey="revenue" />` and never a colour. Parts are
  placed rather than configured: `Chart.Grid`, `Chart.Line`, `Chart.Area`,
  `Chart.XAxis` and `Chart.YAxis` draw into the canvas, while `Chart.Tooltip` and
  `Chart.Legend` are React Native views layered over and under it.

  Also new: `--spacing-chart-sm/md/lg`, because a canvas has no intrinsic height
  and a dashboard's rows only line up if every chart agrees on one.

  **This needs a dev-client rebuild.** `@shopify/react-native-skia` is a native
  module and is new to the workspace — run `expo prebuild --clean` and rebuild
  before running the playground.

  The CLI learns two things: how to install a Skia-backed component, and that
  `@delacour/react-native-charts` publishes to the `alpha` tag while this repository is in pre
  mode, since a bare `bun add` of it would resolve `latest` and find nothing.

- [#19](https://github.com/delacournz/delacour-ui/pull/19) [`dea1a7c`](https://github.com/delacournz/delacour-ui/commit/dea1a7c30963629cb8581b6ea1ade7f266a70b57) Thanks [@UrbanChrisy](https://github.com/UrbanChrisy)! - **Breaking.** `Button`'s `isIconOnly` prop is removed. A square footprint is now a
  size: `size="icon-sm"`, `size="icon-md"` or `size="icon-lg"`.

  ```tsx
  // before
  <Button accessibilityLabel="Favourite" isIconOnly size="sm" variant="ghost">

  // after
  <Button accessibilityLabel="Favourite" size="icon-sm" variant="ghost">
  ```

  Each `icon-*` size is its labelled step with the horizontal padding traded for a
  width off the same token, which is shadcn's spelling and makes padding and width
  mutually exclusive by construction rather than by rule.

  - `BUTTON_SIZES` now holds all six values, and is derived from the new
    `BUTTON_LABEL_SIZES` and `BUTTON_ICON_SIZES` tuples. `ButtonSize` widens to
    match; `ButtonLabelSize` and `ButtonIconSize` are exported alongside it.
  - `buttonVariants` no longer accepts `isIconOnly`; pass the size instead. Its
    signature now matches the public prop exactly, so
    `buttonVariants({ size: "icon-md" })` works.
  - `ButtonLayout` loses `isIconOnly`, and `resolveButtonLayout` no longer takes
    it — it now folds only `isLoading` and `spinnerPlacement`.
  - `useButton()` reports `size` verbatim, so an icon button returns `"icon-lg"`
    rather than `"lg"`. Match against `BUTTON_ICON_SIZES` where a child needs to
    know it sits inside a square one.

### Patch Changes

- Updated dependencies [[`16175b8`](https://github.com/delacournz/delacour-ui/commit/16175b800122c5732bcff0673aebbb3f7450ca80), [`16175b8`](https://github.com/delacournz/delacour-ui/commit/16175b800122c5732bcff0673aebbb3f7450ca80)]:
  - @delacour/react-native-charts@0.1.0-alpha.1
