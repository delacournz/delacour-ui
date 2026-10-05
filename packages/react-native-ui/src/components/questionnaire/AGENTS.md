# Questionnaire

A guided form, one question at a time — surveys, onboarding intake, feedback, screeners.
Compound root plus `Questionnaire.Title`, `.Progress`, `.Question`, `.Footer`, `.Back`, `.Next`,
`.Skip`, `.Submit` and `.Spacer`; the control for each question kind is internal.

`import { Questionnaire } from "@delacour/react-native-ui/questionnaire";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/questionnaire` |
| `questionnaire.tsx` | Root — the state, the controlled-prop syncs, change reporting, the frame, and the `Object.assign` |
| `questionnaire.context.tsx` | The context, `useQuestionnaire()` and the internal `useQuestionnairePart()` |
| `questionnaire.types.ts` | `Question`, `Answer`, `QuestionCondition`, `ValidationError`, the root's props |
| `questionnaire.logic.ts` | **Pure leaf, no React**: visibility, validation, the reducer, progress, wording, answer adapters |
| `questionnaire.logic.test.ts` | |
| `questionnaire.variants.ts` | Pure slotted `tv()`, the axes table and the footer-button resolver |
| `questionnaire.variants.test.ts` | |
| `questionnaire-title.tsx` | `Questionnaire.Title` |
| `questionnaire-progress.tsx` | `Questionnaire.Progress` — `bar` (`Progress`), `steps` (`Steps`), `count` (text) |
| `questionnaire-question.tsx` | `Questionnaire.Question` — `Field`, heading, transition, announcements |
| `questionnaire-control.tsx` | Internal: `kind` → control |
| `questionnaire-footer.tsx` | `Questionnaire.Footer` — the default button row when childless |
| `questionnaire-back.tsx` `-next.tsx` `-skip.tsx` `-submit.tsx` `-spacer.tsx` | The footer parts |

## Design

- **It owns the flow; the app owns the questions.** `questions` is a discriminated union on
  `kind` — `single`, `multiple`, `text`, `rating`, `scale`, `yesNo` — and the kind picks both
  the control and the answer's shape. There is no `.Item` or `.Choices` part in v1: exposing them
  would let a caller render a control whose answer the union does not describe. The escape hatch
  is `renderQuestion` on `.Question`, which replaces the control and keeps the heading and error.
- **Axes**: `size` (`sm | md | lg`) passes straight through to every control — they all share the
  scale, and a test holds that. `variant` (`primary | secondary`) is translated by
  `resolveQuestionnaireAxes`, because the controls do not share a word for it: `Input`, `Radio`
  and `Steps` say `primary | secondary`, `ToggleButton` says `default | outline`, `Checkbox` and
  `Progress` have colours. One table, tested, rather than a ternary per part.
- **Framed or bare.** `isFramed` (default) is a `Surface` with no padding, so the footer's
  `Separator` runs to the card's edges and each part pads itself. Unframed is a plain column
  spaced by a gap, for a sheet or screen that already has a gutter.
- **All the decisions are in `questionnaire.logic.ts`, and it imports nothing but types.** That
  is what lets `bun test` reach every rule — and lets a server import `getVisibleQuestions` and
  `validateAnswer` to re-check a submission against the rules the device applied.

## Flow rules

- **Back pops history; it never subtracts one.** `history` records the questions actually
  visited. With a branch (A → C because B is hidden), Back from C returns to A. Back never
  validates.
- **Hidden questions do not exist.** A question with `isDisabled` or an unmet `showIf` is excluded
  from navigation, progress counts and the submission, and changing an answer **prunes** the
  answers of questions it hid. Conditions are evaluated in declaration order, so a chain
  (C on B on A) settles in one pass; a condition on a later question never holds and
  `findForwardReferences` reports it, along with `findDanglingReferences`, as a dev warning.
- **Skipped is an answer.** `{ kind: "skipped" }` is a deliberate omission, distinct from
  missing. It satisfies no condition, fails a required question, and is kept in the submission.
  Skip renders only on an optional question and replaces any existing answer.
- **Empty is missing.** `normalizeAnswer` turns empty text, no boxes ticked and a zero rating
  into no answer, so "cleared" and "never answered" are one state and an emptied required
  question re-shows its error.
- **Errors appear after an attempt, not on first render.** A blocked Next or Submit sets the
  error; so does clearing a previously given answer. Answering clears it.
- **Next is dimmed, never disabled, while the answer would not pass.** A press is how the user
  finds out why: it shows the error, announces it, and buzzes once. It therefore reports
  `disabled: false` with an "Answer required" hint. `isDimmed` is a slot variant
  (`opacity-50`), not `isDisabled`, which would swallow the press.
- **Submit validates every visible question** and on failure moves to the first invalid one.
  A promise from `onSubmit` holds the form inert with Submit's spinner until it settles; a
  rejection dispatches `reopen` and is re-thrown, not swallowed. `isSubmitted` is true only once
  the promise resolves — while pending the footer must stay to show the spinner.
- **Read-only shows answers and allows navigation.** Skip and Submit hide; controls without a
  read-only prop of their own are honoured by not storing.

## State and the controlled props

- **The reducer runs in the event, not in `useReducer`.** `dispatch` reads the latest state from
  a ref, runs the pure reducer, and reports what changed — `onAnswersChange`, `onCurrentChange`,
  haptics, announcements, `onSubmit` — from the press that caused it, with the state that press
  produced. Every reducer action returns the same object for a no-op, which is what the
  `next === previous` early return relies on.
- **Controlled props sync when they change and only then.** `answers`, `currentId` and
  `questions` each dispatch a `sync*` action from an effect keyed on the prop alone, through
  `useEffectEvent` — keying on `dispatch` would re-run the sync whenever an inline callback prop
  changed identity and drag a controlled flow back to a stale id. A sync is not reported back as
  an answer change, since the caller already has those answers.

## Test ids

- **The controls are internal, so their `testID`s are derived.** A caller cannot reach an option's
  `Radio` to tag it, so the root's `testID` is the one input: `<testID>-<questionId>-<value>` on an
  option, scale step or yes/no button; `<testID>-<questionId>` on a text field or the stars;
  `<testID>-<questionId>-other` on the Other field; `<testID>-next` / `-back` / `-skip` / `-submit`
  on the footer. `resolveQuestionnaireTestId` builds them and returns `undefined` with no root id,
  so nothing is tagged by accident. A footer button's own `testID` prop still wins. The preview
  flows in `.argent/flows/previews/questionnaire/` depend on these names.

## Accessibility

- After every move the question is announced as "Question 2 of 5: <title>" and focus moves to its
  heading once the transition ends. The first question is neither announced nor animated.
- The heading is the `Field.Label`, promoted up the type scale (`headingSize`) and wrapped in an
  `accessibilityRole="header"` view.
- Progress reads "Question 2 of 5" in every variant: the bar through `Progress`'s `progressbar`,
  the stepper as one `progressbar` element with its circles hidden, the count as a polite live
  region.
- Scale buttons are labelled "7 out of 10"; Skip is labelled "Skip this question". Radio,
  Checkbox, Rating and ToggleButton keep their own semantics.

## Motion and haptics

- **A new question slides 24pt and fades in from the side it travels from**, 220ms, as a
  `Keyframe` — `SlideInRight` would travel the whole screen width. The body animates its height
  with `LinearTransition`. Under `useCalmMotion()` both become a 100ms fade with no resize.
- **Haptics are the questionnaire's own, on top of each control's**: a `selection` tick on a
  move (or the `haptic` prop's feedback), `warning` on a blocked Next or Submit, `success` on
  Submit. `haptic={false}` silences these three.

## Out of scope

Swipe between questions, a progress ring, keyboard shortcuts, per-question images, matrix and
ranking questions, date/time/file kinds (union members once a date picker lands), autosave, async
per-question validation, and a built-in "Done" screen — the app navigates away in `onSubmit`.
