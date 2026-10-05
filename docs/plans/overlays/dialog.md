# OVL-P1-DIALOG — Dialog

`import { Dialog } from "@delacour/react-native-ui/dialog";`

## Purpose on mobile

A centred card over a dimmed app that asks for a decision or a short input before the user goes
on: confirm a delete, rename a file, accept terms. It takes over the screen; use a `Popover` when
the surrounding context must stay visible, and a `BottomSheet` when the content is long or
scrolls. With `isDismissible={false}` it is an alert dialog: only its own actions close it.

## Builds on

- `@delacour/react-native-ui/overlay` (OVL-P0): `Overlay.Portal layer="modal"`, `Overlay.Scrim`,
  `useOverlayPresence`, `useOverlayBackHandler`. Read `src/components/overlay/AGENTS.md` first.
- `Pressable`, `Slot`, `Text` presets (`Text.Header` for the title, muted `Text.Paragraph` for the
  description), `Icon` + `IconCrossSmall` for the close glyph, `Surface`/tokens for the card.
- `react-native-keyboard-controller` (already a required peer): `useReanimatedKeyboardAnimation`
  to lift the card above the keyboard.
- Read `bottom-sheet/AGENTS.md` (trigger `asChild` donation, `Close` with `fade` + 8pt slop,
  title/description as `Text` presets) and `button/AGENTS.md` (reference compound layout).

No new peer dependency.

## API

```tsx
type DialogProps = {
	isOpen?: boolean;
	defaultOpen?: boolean; // false
	onOpenChange?: (isOpen: boolean) => void;
	/** Scrim tap, Android back and the iOS escape gesture close it. false = alert dialog. Default true. */
	isDismissible?: boolean;
	children: ReactNode;
};

type DialogTriggerProps = PressableProps; // asChild donates onPress, like BottomSheet.Trigger
type DialogContentProps = ViewProps & {
	className?: string;
	scrimClassName?: string;
	size?: DialogSize; // "sm" | "md" | "lg" | "full"; default "md"
};
type DialogHeaderProps = ViewProps & { className?: string };
type DialogTitleProps = TextPresetProps;        // Text.Header
type DialogDescriptionProps = TextPresetProps;  // Text.Paragraph, muted
type DialogBodyProps = ViewProps & { className?: string };
type DialogFooterProps = ViewProps & { className?: string; variant?: DialogFooterVariant }; // "plain" | "panel"
type DialogCloseProps =
	| ({ asChild: true; children: ReactElement } & Omit<PressableProps, "asChild">)
	| ({ asChild?: false; accessibilityLabel?: string /* default "Close" */ } & Omit<PressableProps, "asChild" | "children">);

type DialogContextValue = { isOpen: boolean; setOpen: (isOpen: boolean) => void; close: () => void; isDismissible: boolean; titleId: string; descriptionId: string };
function useDialog(): DialogContextValue; // throws outside <Dialog>
```

Anatomy:

```tsx
<Dialog isOpen? defaultOpen? onOpenChange? isDismissible?>
  <Dialog.Trigger asChild><Button>Delete</Button></Dialog.Trigger>
  <Dialog.Content size? scrimClassName?>
    <Dialog.Close />                 // the ✕ in the corner, optional
    <Dialog.Header>
      <Dialog.Title>Delete project?</Dialog.Title>
      <Dialog.Description>This cannot be undone.</Dialog.Description>
    </Dialog.Header>
    <Dialog.Body>…</Dialog.Body>     // optional
    <Dialog.Footer variant?="plain">
      <Dialog.Close asChild><Button variant="secondary">Cancel</Button></Dialog.Close>
      <Button variant="destructive" onPress={remove}>Delete</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog>
```

`Dialog.Content` mounts the portal, the scrim and the card; it renders nothing while
`useOverlayPresence().isPresent` is false.

## Variants & sizes (`dialog.variants.ts`, slotted `tv()`)

Slots: `scrim`, `positioner` (absolute fill, centring, `px-screen-gutter`), `content` (card:
`bg-popover`, `rounded-lg` — a card is `rounded-lg`, see the package Sizing section —
`border border-border`, `gap`, padding), `close`, `header`, `title` (`pr-8` only — the type is
`Text.Header`'s), `description`, `body`, `footer`.

- `size`: `sm` max-w 320, `md` max-w 400, `lg` max-w 520, `full` fills the gutter. Width is
  `w-full` with a max; a class, not a number. A test pins each size's class.
- `footer.variant`: `plain` — a row, right-aligned, `gap-2`, inside the card padding; `panel` —
  bleeds to the card's edges with a `bg-muted` band and a top hairline (`border-t border-border`),
  bottom corners follow the card. On a narrow `sm` card the footer stacks vertically, primary
  action last (pure `resolveDialogFooterDirection(size)`).

Every token named exists in both themes (assert like `bottom-sheet.variants.test.ts`).

## States

closed · entering · open · exiting (from presence) · non-dismissible · keyboard up.

## Motion

Scrim opacity = `progress`. Card: opacity = `progress`, scale `0.96 → 1` and translateY `8 → 0`
on enter; under reduce motion opacity only. Keyboard: the card lifts by
`resolveDialogKeyboardLift({ keyboardHeight, cardBottom, windowHeight, margin: 16 })` — the
smallest lift that keeps the card's bottom `margin` above the keyboard, never negative, never more
than pushes the card's top under the top safe-area inset. Pure and tested.

## Accessibility

- Card: `accessibilityViewIsModal`, `role="dialog"` (or `"alertdialog"` when not dismissible),
  `accessibilityLabelledBy` → title `nativeID` (Android), and on iOS the title is the first
  focusable element.
- On open: `AccessibilityInfo.setAccessibilityFocus` on the title once `onEntered` fires. On close:
  focus returns to the trigger if it is still mounted.
- `onAccessibilityEscape` on the card closes when dismissible.
- `useOverlayBackHandler({ id, isEnabled: isPresent && isDismissible, onBack: close })`, with the same `id` (from `useId()`) passed to `Overlay.Portal`.
- `Dialog.Close` without children has `accessibilityLabel="Close"`, `role="button"`, 8pt
  `hitSlop`, `feedback="fade"`.

## Pure logic to unit-test (write first)

`dialog.variants.test.ts`: slot classes per size and footer variant, tokens in both themes,
`title` slot carries no text-size class, `resolveDialogFooterDirection`, `resolveDialogKeyboardLift`
(no keyboard, keyboard below card, keyboard overlapping, lift capped by top inset).

## Files

`index.ts`, `dialog.tsx` (root + `Object.assign`), `dialog.context.tsx`, `dialog.types.ts` (only
if two modules share a type), `dialog.variants.ts`, `dialog.variants.test.ts`, one file per part:
`dialog-trigger.tsx`, `dialog-content.tsx`, `dialog-close.tsx`, `dialog-header.tsx`,
`dialog-title.tsx`, `dialog-description.tsx`, `dialog-body.tsx`, `dialog-footer.tsx`, `AGENTS.md`.
`displayName`s `DelacourUI.Dialog`, `DelacourUI.Dialog.Content`, …

## Playground demos (`apps/playground/src/demos/dialog/`)

`confirm` (hero, capture), `alert-dialog` (non-dismissible, capture), `form` (input + panel footer,
keyboard, capture), `sizes` (capture), `controlled`, `over-sheet` (opened from inside a bottom
sheet — proves z-order). Route `apps/playground/src/app/(components)/dialog.tsx` (`DemoGallery`
shell), a row on `src/app/index.tsx` with a Central icon. `testID`s on triggers and actions.

## Docs

`apps/web/content/docs/native/components/dialog.mdx` (model on `alert.mdx`: Preview, Installation,
Usage, Anatomy, examples, API tables, Accessibility), and `"dialog"` under `---Overlays---` in
`meta.json`. Registry: `ITEM_META.dialog` in `packages/cli/src/registry/config.ts` (category
`overlays`, dependency `react-native-teleport`), then `bun --filter delacour run registry:build`.

## Acceptance

- [ ] Opens from a trigger (asChild on a `Button`) and controlled; `onOpenChange` fires once per
      change from every path (trigger, Close, scrim, back, escape).
- [ ] Scrim tap closes only when dismissible; Android back likewise; neither closes an alert dialog.
- [ ] Draws above an open bottom sheet and above the navigator header.
- [ ] Exit animation plays fully before unmount; re-open mid-exit reverses smoothly.
- [ ] Input in the body: the card lifts clear of the keyboard and settles back.
- [ ] VoiceOver: focus lands on the title on open, cannot leave the card, escape gesture closes.
- [ ] Reduce motion: fade only.
- [ ] `bun test`, `bun run typecheck`, `bun run check` green; `gen-exports`, `gen-demos`,
      `registry:build` run; component row in `packages/react-native-ui/AGENTS.md`; folder
      `AGENTS.md`; changeset (`@delacour/react-native-ui` minor, `delacour` patch).
