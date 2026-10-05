# OVL-P2-FEEDBACK — Feedback

`import { Feedback } from "@delacour/react-native-ui/feedback";`

**Phase P2.** Start only after Dialog (OVL-P1-DIALOG) has been merged into the category branch you
branch from. If `src/components/dialog/` does not exist in your checkout, stop and report.

## Purpose on mobile

A dialog for writing: "What should we fix first?", a bug report, a one-question survey. It differs
from a confirm `Dialog` in one visible way — the text field sits in a **recessed well** that says
"type here", and the actions sit in the band around it. It is not for confirmations or warnings.

## Builds on

- `Dialog` (OVL-P1-DIALOG) — `Feedback.Content` **is** a `Dialog.Content`; open state, portal,
  scrim, back, escape, focus and keyboard lift are Dialog's. Import the compound from `../dialog`
  (a normal cross-folder import of a merged component is fine; Dialog never imports Feedback, so
  no cycle) or its leaves if a cycle appears. Read `dialog/AGENTS.md` first.
- `Textarea` / a bare `TextInput` with the house field styling (read `textarea/AGENTS.md`), `Button`.

No new peer dependency.

## API

```tsx
type FeedbackProps = {
	isOpen?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (isOpen: boolean) => void;
	value?: string;
	defaultValue?: string; // ""
	onValueChange?: (value: string) => void;
	isDismissible?: boolean; // true
	children: ReactNode;
};
type FeedbackTriggerProps = PressableProps;           // Dialog.Trigger
type FeedbackContentProps = DialogContentProps;       // the shell — card in the `muted` band colour
type FeedbackPanelProps = ViewProps & { className?: string }; // the recessed well: bg-background, rounded-md, inset from the shell
type FeedbackTitleProps = TextPresetProps;            // Dialog.Title, inside the panel, pr-8
type FeedbackCloseProps = DialogCloseProps;           // the ✕ in the panel's corner
type FeedbackFieldProps = Omit<TextInputProps, "value" | "onChangeText" | "multiline"> & {
	className?: string;
	/** Rows before it grows. Default 6 (≈200pt at the md input text size). */
	minRows?: number;
	isDisabled?: boolean; // read-only while sending
};
type FeedbackFooterProps = ViewProps & { className?: string };
type FeedbackActionProps = ButtonProps;               // base for custom footer actions
type FeedbackCancelProps = ButtonProps;               // "Cancel"; resets nothing, closes
type FeedbackSubmitProps = Omit<ButtonProps, "onPress"> & {
	/** Receives the trimmed message. Does NOT close — sending has to finish first. */
	onSubmit: (value: string) => void | Promise<void>;
	/** Allow submitting an empty message (e.g. when chips were picked). Default false. */
	canSubmitEmpty?: boolean;
};

function useFeedback(): { value: string; setValue(v: string): void; isOpen: boolean; close(): void; clear(): void };
```

```tsx
<Feedback>
  <Feedback.Trigger asChild><Button variant="secondary">Give feedback</Button></Feedback.Trigger>
  <Feedback.Content>
    <Feedback.Panel>
      <Feedback.Title>What should we fix first?</Feedback.Title>
      <Feedback.Close />
      <Feedback.Field placeholder="Tell us what got in your way" />
    </Feedback.Panel>
    <Feedback.Footer>
      <Feedback.Cancel />
      <Feedback.Submit onSubmit={send} />
    </Feedback.Footer>
  </Feedback.Content>
</Feedback>
```

## Behaviour

- Submit is disabled while `!canSubmitFeedback({ value, canSubmitEmpty, isDisabled })` (pure).
  When `onSubmit` returns a promise, Submit shows the button's loading state and the field is
  read-only until it settles; it still does not close — the caller closes on success, so a failure
  message can be shown in the panel with the draft intact.
- The draft survives close/reopen while uncontrolled; `clear()` empties it.
- Multi-step (rating → text → thanks) is the caller swapping the Panel's and Footer's children;
  the shell stays put and the panel's height animates with Reanimated `LinearTransition`
  (none under reduce motion).
- Keyboard: Dialog's lift keeps the footer above the keyboard.

## Variants (`feedback.variants.ts`)

Slots: `content` (shell — `bg-muted`, padding tighter than Dialog so the well reads inset),
`panel` (`bg-background`, `rounded-md`, `border border-border`, padding), `title`, `close`,
`field` (no border, no background, `font-sans`, `text-input-md`, `min-h` from `minRows`), `footer`
(row, end-aligned, `gap-2`, narrower inset than the well). Tokens in both themes.

## Accessibility

Dialog's semantics, labelled by the title. Field `accessibilityLabel` defaults to the title's text
when a string. Close is `"Close"`. Submit announces its loading state via the Button's.

## Pure logic to unit-test (write first)

`canSubmitFeedback` (empty, whitespace, `canSubmitEmpty`, disabled), `resolveFeedbackFieldMinHeight(minRows, lineHeight)`,
`feedback.variants.test.ts` (slots, tokens).

## Files

`index.ts`, `feedback.tsx`, `feedback.context.tsx`, `feedback.variants.ts` (+ test),
`feedback-trigger.tsx`, `feedback-content.tsx`, `feedback-panel.tsx`, `feedback-title.tsx`,
`feedback-close.tsx`, `feedback-field.tsx`, `feedback-footer.tsx`, `feedback-action.tsx`,
`feedback-cancel.tsx`, `feedback-submit.tsx`, `AGENTS.md`.

## Playground demos (`apps/playground/src/demos/feedback/`)

`basic` (hero, capture), `sending` (async submit with a fake 1.5 s promise and a failure toggle,
capture), `multi-step` (rating → text → thanks, capture), `with-chips` (chips above the field,
Submit gated on chips or text), `controlled-draft`. Route, home row, `testID`s.

## Docs

`feedback.mdx`, `meta.json` under `---Overlays---`, `ITEM_META.feedback`, `registry:build`.

## Acceptance

- [ ] Opens from trigger; Submit disabled while empty; typing enables it.
- [ ] Async submit: loading, field read-only, dialog stays open; failure keeps the draft.
- [ ] The well and the footer stay above the keyboard while typing.
- [ ] Multi-step swaps animate the panel height, the shell does not jump.
- [ ] Close / Cancel / scrim / back close; draft retained on reopen (uncontrolled).
- [ ] `bun test`, `bun run typecheck`, `bun run check` green; `gen-exports`, `gen-demos`,
      `registry:build`; package `AGENTS.md` row; folder `AGENTS.md`; changeset.
