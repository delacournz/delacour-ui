# Questionnaire

- **Status**: spec, not started
- **Wave**: 1 (independent)
- **Depends on**: `Radio`, `Checkbox`, `Rating`, `Textarea`/`Input`, `ToggleButton` (group), `Steps`, `Progress`, `Button`, `Field`, `Text`, `Surface`. No new peers.

## Purpose on mobile
A guided, one-question-at-a-time form flow: surveys, onboarding intake, feedback, screeners. Owns the flow (current question, answers, validation, back/skip/next/submit, progress); the app supplies questions and receives answers.

## Behaviour reference (summary)
- One question visible at a time with a title, description and an answer control; footer with Back, Skip (optional questions only), Next, and on the last question Submit.
- Required questions block advancing until answered; the error shows under the control. The Next button is dimmed but still pressable while invalid so a press can reveal why (not `disabled`).
- Optional questions never block; Skip records a deliberate omission, distinct from "unanswered".
- Multiple-choice returns an array. A choice can be a free-text "Other" that reveals an input.
- Conditional questions: shown only when an earlier answer satisfies a rule; hidden questions are excluded from counts, progress and navigation, and their stale answers are dropped.
- Back returns to the question actually visited before (not index - 1) so branching goes back correctly.
- Progress indicator variants: bar, steps, "Question 2 of 5" count (a ring was in the observed reference and is deferred, see out of scope).
- Optional frame (card with header and footer band) or bare stack for use inside sheets/screens.
- Controlled/uncontrolled for current question and answers; callbacks for navigation, answer changes and final submit.
- Question-change transition slides in the travel direction.

## API

```ts
export type QuestionnaireOption = { value: string; label: string; description?: string; isDisabled?: boolean; isOther?: boolean };

type QuestionBase = {
  id: string;                         // unique, stable
  title: string; description?: string;
  isRequired?: boolean;               // default false
  isDisabled?: boolean;               // excluded from visible set
  showIf?: QuestionCondition;
};

/** Discriminated union on `kind`. */
export type Question =
  | (QuestionBase & { kind: "single"; options: readonly QuestionnaireOption[] })
  | (QuestionBase & { kind: "multiple"; options: readonly QuestionnaireOption[]; minSelected?: number; maxSelected?: number })
  | (QuestionBase & { kind: "text"; placeholder?: string; isMultiline?: boolean; minLength?: number; maxLength?: number })
  | (QuestionBase & { kind: "rating"; maxValue?: number; step?: 1 | 0.5 })           // default 5, whole stars
  | (QuestionBase & { kind: "scale"; min: number; max: number; minLabel?: string; maxLabel?: string }) // e.g. 0-10
  | (QuestionBase & { kind: "yesNo" });                                              // sugar over single with value "yes"|"no"

export type QuestionCondition =
  | { type: "answered"; questionId: string }
  | { type: "equals"; questionId: string; value: string | number }
  | { type: "includes"; questionId: string; value: string }       // multiple
  | { type: "gte" | "lte"; questionId: string; value: number }    // rating | scale
  | { type: "and" | "or"; conditions: readonly QuestionCondition[] }
  | { type: "not"; condition: QuestionCondition };

/** Discriminated union on `kind`; `skipped` is a deliberate omission. */
export type Answer =
  | { kind: "single"; value: string; other?: string }
  | { kind: "multiple"; values: readonly string[]; other?: string }
  | { kind: "text"; value: string }
  | { kind: "rating"; value: number }
  | { kind: "scale"; value: number }
  | { kind: "yesNo"; value: "yes" | "no" }
  | { kind: "skipped" };
export type Answers = Readonly<Record<string, Answer>>;

export type ValidationError =
  | { type: "required" } | { type: "minSelected"; min: number } | { type: "maxSelected"; max: number }
  | { type: "minLength"; min: number } | { type: "maxLength"; max: number }
  | { type: "outOfRange"; min: number; max: number } | { type: "otherRequired" };

export type QuestionnaireProps = {
  questions: readonly Question[];
  answers?: Answers; defaultAnswers?: Answers; onAnswersChange?: (answers: Answers) => void;
  currentId?: string | null; defaultCurrentId?: string | null; onCurrentChange?: (id: string) => void;
  onSubmit?: (answers: Answers) => void | Promise<void>;     // only visible, non-skipped-or-answered entries; pending promise sets isSubmitting
  size?: "sm" | "md" | "lg"; variant?: "primary" | "secondary";
  isFramed?: boolean;                                        // default true
  isDisabled?: boolean; isReadOnly?: boolean;
  getErrorMessage?: (error: ValidationError, question: Question) => string;   // i18n hook; defaults provided in English
  haptic?: false | HapticFeedback;
  className?: string; children?: ReactNode;
};
export function useQuestionnaire(): QuestionnaireState;   // current, answers, errors, progress {index,total,ratio}, canBack/canSkip/isLast, next/back/skip/submit/goTo/setAnswer, isSubmitting
```
Parts (Pattern B): `.Title`, `.Progress` (`variant: "bar" | "steps" | "count"`), `.Question` (renders the active question: title, description, control, error), `.Footer`, `.Back`, `.Next`, `.Skip`, `.Submit`, `.Spacer`. Lower-level `.Item`/`.Choices` are NOT exposed in v1: the control for each `kind` is internal, so the union fully describes the form. Escape hatch: `renderQuestion?: (question, state) => ReactNode` on `.Question` for a custom kind later.

Bare `<Questionnaire questions={qs} onSubmit={send} />` renders Title(optional)/Progress/Question/Footer.
```tsx
<Questionnaire questions={QUESTIONS} onSubmit={send}>
  <Questionnaire.Title>Quick feedback</Questionnaire.Title>
  <Questionnaire.Progress variant="bar" />
  <Questionnaire.Question />
  <Questionnaire.Footer>
    <Questionnaire.Back /><Questionnaire.Spacer />
    <Questionnaire.Skip /><Questionnaire.Next /><Questionnaire.Submit />
  </Questionnaire.Footer>
</Questionnaire>
```
Back/Skip/Next/Submit self-hide when not applicable (Back on first, Skip on required, Submit only on last, Next not on last).

Control mapping: `single` -> `Radio.Group` (`selected`/`onSelected`, one-element array semantics handled internally) + `Radio` rows; `multiple` -> `Checkbox.Group` (`checked`/`onChecked`) + `Checkbox`; `text` -> `Textarea` (multiline) or `Input`; `rating` -> `Rating` + `Rating.Stars`/`Output`; `scale` -> `ToggleButton.Group` (selectionMode single, `isSelectionRequired` false) of numeric buttons with min/max `Text.Caption` labels; `yesNo` -> `ToggleButton.Group` two big buttons or Radio. Every control is wrapped in a `Field` (label = question title via `Field.Label` visually promoted as the question heading; invalid cascades; `Field.Error` shows the message).

## Variants & sizes
- `size` drives title `Text` step (Header/Title), control sizes passed down (Radio/Checkbox/Rating/Input/Button sizes), and gaps. One axis, a table in `questionnaire.variants.ts`.
- `variant`: `primary` filled controls/primary Next; `secondary` outlined controls/secondary Next (forwarded to Radio/Input/Button which already own that axis).
- Framed: `Surface` rounded-lg with header strip (title+progress) and footer band separated by `Separator`; unframed: bare column.

## States
default; answered; invalid (error shown after a Next/Submit press or after the user changed then cleared an answer; not on first render); disabled (all controls and footer); readOnly (shows answers, no changes, navigation allowed); submitting (Submit shows `loading` and the form is inert until promise settles; error from a rejected promise surfaces through `onSubmit`'s caller, not swallowed: rethrow into `Field.Error`? DECISION: the component does not catch; it re-enables on settle); submitted (`isSubmitted` flag in state; Footer hides, a `Questionnaire.Done` slot is out of scope: the app navigates away in `onSubmit`); empty questions (renders nothing, dev warning); all hidden by conditions (treated as submitted-with-no-questions: dev warning).

## Accessibility
- `Question` region: `accessibilityRole="none"`/group with label `"Question 2 of 5: <title>"`; announce on change with `announceForAccessibility` and move focus (`AccessibilityInfo.setAccessibilityFocus`) to the question title after the transition.
- Progress: bar uses Progress's `progressbar` semantics with `now/max` and text "Question 2 of 5"; count variant is plain text with live-region polite; steps variant is decorative-hidden when a count text is also present (avoid double reading).
- Errors: `accessibilityLiveRegion="polite"` + `announceForAccessibility(message)` on a blocked Next; control `accessibilityState.invalid` via Field.
- Dimmed Next uses `accessibilityState={{ disabled: false }}` plus hint "Answer required" (it is intentionally pressable); Skip labelled "Skip this question".
- Radio/Checkbox/Rating/ToggleButton keep their own a11y; scale buttons labelled "7 out of 10".
- Transition respects reduced motion; no focus trap.

## Motion & haptics
- Question change: Reanimated layout entering/exiting, slide 24pt + fade in the travel direction (forward from right, back from left), 220ms. Decorative -> under `useCalmMotion()` becomes a plain cross-fade 100ms or instant. Height change of the frame animates with `LinearTransition` (also gated).
- Progress bar fill animation is Progress's own.
- Haptics (Pulsar): selection tick on Next/Back/Skip success, warning-style notification once on a blocked Next, success notification on Submit. Each control keeps its own haptics. `haptic={false}` disables the questionnaire's.
- Swipe navigation: not in v1.

## Reuses / new internal pieces / peer deps
- Reuses: `Radio`, `Checkbox`, `Rating`, `Textarea`, `Input`, `ToggleButton` group, `Steps` (progress variant `steps`, horizontal, `value` = current index, read-only), `Progress` (variant `bar`), `Button`, `Field`, `Text`, `Surface`, `Separator`.
- Import rule: these are compounds with no cycle back to Questionnaire, so import them via their folder index the way `Textarea` imports `../input` and `Button` imports `../spinner`; never import `../questionnaire` from any of them. Leaf-only import is still used for `field.context`. (Brief says "leaf only"; this is the established practice for one-way composition: flagged as an open question.)
- Note existing prop names differ from the `value/onValueChange` house names: `Radio.Group` uses `selected/onSelected`, `Checkbox.Group` uses `checked/onChecked`, `ToggleButton.Group` uses `selected/onSelected` (string[]), `Rating` uses `value/onChange`. The Questionnaire adapts internally; its own API uses `answers/onAnswersChange` and `currentId/onCurrentChange`.
- New: `questionnaire.logic.ts` (pure reducer + helpers), `questionnaire-control.tsx` (kind -> control switch, internal), `questionnaire-progress-ring` deliberately absent.
- Peer deps: none new.

## Files
```
components/questionnaire/
  AGENTS.md  index.ts
  questionnaire.tsx             root: reducer via useReducer + useControllableState sync, Object.assign
  questionnaire.context.tsx     context, useQuestionnaire(), useQuestionnairePart()
  questionnaire.types.ts        Question, Answer, Answers, QuestionCondition, ValidationError, props
  questionnaire.logic.ts        PURE leaf (no RN imports): visibility, validation, reducer, progress, message defaults
  questionnaire.logic.test.ts
  questionnaire.variants.ts     slotted tv(): root, frame, header, body, footer, title, question, error + size tables + resolvers
  questionnaire.variants.test.ts
  questionnaire-title.tsx  questionnaire-progress.tsx  questionnaire-question.tsx
  questionnaire-footer.tsx  questionnaire-back.tsx  questionnaire-next.tsx
  questionnaire-skip.tsx  questionnaire-submit.tsx  questionnaire-spacer.tsx
  questionnaire-control.tsx                     (internal, kind -> control)
```
Plus brief's repo-wide checklist (AGENTS row, gen-exports, demos, route, index row, gen-demos, docs mdx + meta.json, registry ITEM_META — the CLI registry item must list its sibling registry items radio, checkbox, rating, textarea, input, toggle-button, steps, progress, button, field, text, surface as dependencies — then registry:build, changeset minor ui + delacour).

## Pure logic to unit-test (`questionnaire.logic.test.ts`)
- `isConditionMet(condition, answers)`: each type; `answered` false for missing and for `skipped`; `equals` on single/yesNo/scale/rating; `includes` on multiple; `gte/lte` boundaries; `and/or/not` nesting; reference to unknown id -> false (and dev-warn helper `findDanglingReferences(questions)` returns them).
- `getVisibleQuestions(questions, answers)`: filters `isDisabled` and unmet `showIf`; preserves order; chained conditions (B depends on A, C on B) resolve in one pass because evaluation is in declaration order; condition on a LATER question -> treated unmet and reported by `findForwardReferences`.
- `validateAnswer(question, answer | undefined)`: required missing -> `required`; required + `skipped` -> `required`; optional missing -> null; empty/whitespace-only text required -> `required`; text min/max length (trim for min; raw for max); multiple min/max selected; `isOther` selected with empty `other` -> `otherRequired`; scale/rating out of range or non-integer when step 1 -> `outOfRange`; unknown option value -> error; kind mismatch between question and answer -> `required` (treated as invalid, no throw).
- `questionnaireReducer(state, action)`:
  - `answer`: stores, clears that question's error; changing an answer prunes answers of questions that are now hidden and trims `history` entries for them; unrelated answers untouched.
  - `next`: invalid -> sets error, stays, increments `blockedCount`; valid -> pushes current onto `history`, moves to next visible id; on the last visible question `next` is a no-op (Submit is the action).
  - `skip`: only if not required; stores `{kind:"skipped"}` (replacing an existing answer? DECISION: yes, skip clears and marks skipped), advances.
  - `back`: pops `history`, never validates, no-op at start; works across a branch (A -> C when B hidden, back from C returns to A).
  - `goTo(id)`: only visible ids; ignores forward jumps past an invalid required question when `isLinear` (default true: allowed targets = history + current + next).
  - `submit`: valid only if every visible required question is answered; on failure moves to the first invalid question and sets its error; on success sets `status: "submitted"` and returns the payload via a selector `getSubmission(state)` (visible questions only, skipped kept as `skipped`).
  - `reset`: back to initial.
  - Controlled sync: `syncAnswers(state, answers)` re-derives visibility, if the current question became hidden moves to the nearest next visible one.
- `getProgress(questions, answers, currentId)`: `{index, total, ratio}` over visible questions only; total changes as branching reveals/hides questions (document: ratio may move backwards, test it stays in [0,1]); empty -> `{0,0,0}`.
- `getNextId` / `getPrevId` / `isLastVisible` edge cases: single question, all hidden, current hidden.
- `defaultErrorMessage(error, question)` strings per type (pluralisation for min/max selected).
- `resolveQuestionnaireAxes`/size tables in `questionnaire.variants.test.ts`: tokens exist in both themes, size set equals Button's, `variant` forwarded value set equals `primary|secondary`, frame vs unframed slots, no raw palette/`dark:`.

## Playground demos (`apps/playground/src/demos/questionnaire/`)
`basic` **hero**+capture (3 questions: single, multiple, rating); `progress-variants` capture (bar/steps/count); `conditional` capture (branching on an answer); `text-and-scale` capture (text + 0-10 scale, NPS); `unframed-in-sheet` (inside BottomSheet; needs provider, already in playground); `validation` capture (required + blocked Next showing error); `controlled` (external answers readout/goTo).

## Docs page outline
Intro/hero; Installation (lists the sibling components pulled in); Usage (bare, composed footer, Field-less); Question kinds table (each kind, answer shape); Required vs optional vs skipped; Conditional questions; Validation & custom messages (i18n); Controlled answers & navigation; Progress variants; Framed vs unframed; Accessibility; API tables; Pure helpers exported (`getVisibleQuestions`, `validateAnswer`) for server-side re-validation.

## Out of scope / follow-ups
Swipe-between-questions (gesture + validation gating; open question), progress ring (needs bespoke SVG; Steps/Progress cover v1), keyboard letter/number shortcuts (desktop-oriented), per-question images, matrix/grid questions, ranking/drag-to-order, date/time/file question kinds (can arrive once DatePicker lands: add union members), autosave/persistence, async per-question validation, a built-in "Done" screen, i18n beyond `getErrorMessage`.

## Acceptance checklist
- [ ] `questionnaire.logic.ts` pure, no RN imports; all tests above green
- [ ] Answer shape strictly follows the discriminated union; no `any`
- [ ] Back after a branch returns to the true previous question
- [ ] Hidden questions never counted, shown or submitted; stale answers pruned
- [ ] Dimmed-not-disabled Next reveals the error on press; Submit blocks on first invalid
- [ ] Skip only on optional questions and recorded as `skipped`
- [ ] Controlled `answers`/`currentId` work and survive prop changes mid-flow
- [ ] Each kind renders and reports correctly (single, multiple + Other, text, rating, scale, yesNo)
- [ ] a11y: announcements, focus move, progress semantics verified with VoiceOver and TalkBack
- [ ] Calm-motion variant of the transition verified
- [ ] Works unframed inside a BottomSheet
- [ ] displayName on all parts, AGENTS.md + table row, exports, demos, docs, registry (with sibling deps), changeset
- [ ] No JSX comments, semantic tokens only
