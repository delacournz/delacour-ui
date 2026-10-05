import { type ReactElement, useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, View } from "react-native";
import { playHaptic } from "../pressable";
import { Surface } from "../surface";
import { type QuestionnaireContextValue, QuestionnaireProvider } from "./questionnaire.context";
import {
	canBack,
	canSkip,
	createQuestionnaireState,
	defaultErrorMessage,
	findDanglingReferences,
	findForwardReferences,
	formatQuestionCount,
	getProgress,
	getSubmission,
	getVisibleQuestions,
	isLastVisible,
	type QuestionnaireAction,
	type QuestionnaireState,
	questionnaireReducer,
	validateAnswer,
} from "./questionnaire.logic";
import type { Answer, QuestionnaireProps } from "./questionnaire.types";
import {
	QUESTIONNAIRE_DEFAULT_SIZE,
	QUESTIONNAIRE_DEFAULT_VARIANT,
	questionnaireVariants,
	resolveQuestionnaireAxes,
} from "./questionnaire.variants";
import { QuestionnaireBack } from "./questionnaire-back";
import { QuestionnaireFooter } from "./questionnaire-footer";
import { QuestionnaireNext } from "./questionnaire-next";
import { QuestionnaireProgress } from "./questionnaire-progress";
import { QuestionnaireQuestion } from "./questionnaire-question";
import { QuestionnaireSkip } from "./questionnaire-skip";
import { QuestionnaireSpacer } from "./questionnaire-spacer";
import { QuestionnaireSubmit } from "./questionnaire-submit";
import { QuestionnaireTitle } from "./questionnaire-title";

/** Whether an action was a sync from a controlled prop — those are not reported back to the caller. */
function isSync(action: QuestionnaireAction): boolean {
	return action.type === "syncAnswers" || action.type === "syncCurrent" || action.type === "syncQuestions";
}

function warnAboutQuestions(questions: QuestionnaireProps["questions"]): void {
	if (questions.length === 0) {
		console.warn("Questionnaire: `questions` is empty, so nothing renders.");
		return;
	}
	for (const { questionId, reference } of findDanglingReferences(questions)) {
		console.warn(`Questionnaire: "${questionId}" has a condition on "${reference}", which does not exist.`);
	}
	for (const { questionId, reference } of findForwardReferences(questions)) {
		console.warn(
			`Questionnaire: "${questionId}" has a condition on "${reference}", which comes after it — the condition never holds.`
		);
	}
}

type ChangeReport = {
	action: QuestionnaireAction;
	previous: QuestionnaireState;
	next: QuestionnaireState;
	haptic: QuestionnaireProps["haptic"];
	getErrorMessage: QuestionnaireProps["getErrorMessage"];
	onAnswersChange: QuestionnaireProps["onAnswersChange"];
	onCurrentChange: QuestionnaireProps["onCurrentChange"];
	submit: (submitted: QuestionnaireState) => void;
};

/**
 * Tells the caller, the haptics and the screen reader what an action changed.
 *
 * A sync from a controlled prop is not reported back as an answer change — the
 * caller already has those answers — but a move it forces still is.
 */
function reportChange({
	action,
	previous,
	next,
	haptic,
	getErrorMessage,
	onAnswersChange,
	onCurrentChange,
	submit,
}: ChangeReport): void {
	const fromCaller = isSync(action);
	if (!fromCaller && next.answers !== previous.answers) onAnswersChange?.(next.answers);

	const hasMoved = next.currentId !== previous.currentId && next.currentId !== null;
	if (hasMoved && action.type !== "syncCurrent" && next.currentId !== null) onCurrentChange?.(next.currentId);
	if (hasMoved && !fromCaller && haptic !== false) playHaptic(haptic ?? "selection");

	if (next.blockedCount !== previous.blockedCount)
		announceBlocked(next, haptic, getErrorMessage ?? defaultErrorMessage);
	if (next.status === "submitted" && previous.status !== "submitted") submit(next);
}

/** A blocked Next or Submit: one warning buzz, and the error read aloud. */
function announceBlocked(
	state: QuestionnaireState,
	haptic: QuestionnaireProps["haptic"],
	format: NonNullable<QuestionnaireProps["getErrorMessage"]>
): void {
	if (haptic !== false) playHaptic("warning");
	const question = state.questions.find((candidate) => candidate.id === state.currentId);
	const error = question ? state.errors[question.id] : undefined;
	if (question && error) AccessibilityInfo.announceForAccessibility(format(error, question));
}

function QuestionnaireRoot({
	questions,
	answers: answersProp,
	defaultAnswers,
	onAnswersChange,
	currentId: currentIdProp,
	defaultCurrentId,
	onCurrentChange,
	onSubmit,
	size = QUESTIONNAIRE_DEFAULT_SIZE,
	variant = QUESTIONNAIRE_DEFAULT_VARIANT,
	isFramed = true,
	isLinear = true,
	isDisabled = false,
	isReadOnly = false,
	getErrorMessage,
	haptic,
	className,
	children,
}: QuestionnaireProps): ReactElement | null {
	const [state, setState] = useState<QuestionnaireState>(() =>
		createQuestionnaireState({
			answers: answersProp ?? defaultAnswers,
			currentId: currentIdProp ?? defaultCurrentId,
			isLinear,
			questions,
		})
	);
	const stateRef = useRef(state);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (process.env.NODE_ENV !== "production") warnAboutQuestions(questions);
	}, [questions]);

	const runSubmit = useCallback(
		(submitted: QuestionnaireState) => {
			if (haptic !== false) playHaptic("success");
			const result = onSubmit?.(getSubmission(submitted));
			if (!(result instanceof Promise)) return;
			setIsSubmitting(true);
			result.then(
				() => setIsSubmitting(false),
				(error: unknown) => {
					setIsSubmitting(false);
					const reopened = questionnaireReducer(stateRef.current, { type: "reopen" });
					stateRef.current = reopened;
					setState(reopened);
					throw error;
				}
			);
		},
		[haptic, onSubmit]
	);

	/**
	 * Runs an action against the latest state and reports what changed.
	 *
	 * The reducer runs here rather than in `useReducer` so the callbacks fire
	 * from the event that caused them, with the state that event produced —
	 * never from an effect a render later.
	 */
	const dispatch = useCallback(
		(action: QuestionnaireAction) => {
			const previous = stateRef.current;
			const next = questionnaireReducer(previous, action);
			if (next === previous) return;
			stateRef.current = next;
			setState(next);
			reportChange({
				action,
				getErrorMessage,
				haptic,
				next,
				onAnswersChange,
				onCurrentChange,
				previous,
				submit: runSubmit,
			});
		},
		[getErrorMessage, haptic, onAnswersChange, onCurrentChange, runSubmit]
	);

	// Each sync runs when its prop changes and only then — not when a callback
	// prop's identity does, which would drag a controlled flow back to a stale id.
	const sync = useEffectEvent((action: QuestionnaireAction) => dispatch(action));

	useEffect(() => {
		sync({ questions, type: "syncQuestions" });
	}, [questions]);

	useEffect(() => {
		if (answersProp !== undefined) sync({ answers: answersProp, type: "syncAnswers" });
	}, [answersProp]);

	useEffect(() => {
		if (currentIdProp !== undefined) sync({ id: currentIdProp, type: "syncCurrent" });
	}, [currentIdProp]);

	const [hasNavigated, setHasNavigated] = useState(false);
	const [firstId] = useState(state.currentId);
	if (!hasNavigated && state.currentId !== firstId) setHasNavigated(true);

	const isInert = isDisabled || isSubmitting;

	const context = useMemo<QuestionnaireContextValue>(() => {
		const visibleQuestions = getVisibleQuestions(state.questions, state.answers);
		const current = visibleQuestions.find((question) => question.id === state.currentId) ?? null;
		const progress = getProgress(state.questions, state.answers, state.currentId);
		const formatError = getErrorMessage ?? defaultErrorMessage;
		const shownError = current ? state.errors[current.id] : undefined;
		const guard = (run: () => void) => () => {
			if (!isInert) run();
		};
		return {
			answers: state.answers,
			axes: resolveQuestionnaireAxes({ size, variant }),
			back: guard(() => dispatch({ type: "back" })),
			canBack: canBack(state),
			canSkip: canSkip(state),
			countLabel: formatQuestionCount(progress),
			current,
			direction: state.direction,
			errorMessage: current && shownError ? formatError(shownError, current) : null,
			errors: state.errors,
			formatError,
			goTo: (id: string) => {
				if (!isInert) dispatch({ id, type: "goTo" });
			},
			haptic: haptic ?? "selection",
			hasNavigated,
			isCurrentValid: current ? validateAnswer(current, state.answers[current.id]) === null : true,
			isDisabled,
			isFramed,
			isLast: isLastVisible(state.questions, state.answers, state.currentId),
			isReadOnly,
			isSubmitted: state.status === "submitted" && !isSubmitting,
			isSubmitting,
			next: guard(() => dispatch({ type: "next" })),
			progress,
			questions: state.questions,
			reset: () => dispatch({ type: "reset" }),
			setAnswer: (id: string, answer: Answer | undefined) => {
				if (!isInert && !isReadOnly) dispatch({ answer, id, type: "answer" });
			},
			size,
			skip: guard(() => {
				if (!isReadOnly) dispatch({ type: "skip" });
			}),
			submit: guard(() => {
				if (!isReadOnly) dispatch({ type: "submit" });
			}),
			variant,
			visibleQuestions,
		};
	}, [
		dispatch,
		getErrorMessage,
		haptic,
		hasNavigated,
		isDisabled,
		isFramed,
		isInert,
		isReadOnly,
		isSubmitting,
		size,
		state,
		variant,
	]);

	if (context.visibleQuestions.length === 0) return null;

	const content = children ?? (
		<>
			<QuestionnaireProgress />
			<QuestionnaireQuestion />
			<QuestionnaireFooter />
		</>
	);

	const rootClass = questionnaireVariants({ isFramed, size }).root({ className });

	return (
		<QuestionnaireProvider value={context}>
			{isFramed ? (
				<Surface className={rootClass} padding="none">
					{content}
				</Surface>
			) : (
				<View className={rootClass}>{content}</View>
			)}
		</QuestionnaireProvider>
	);
}

/**
 * A guided form, one question at a time: surveys, onboarding intake,
 * feedback, screeners.
 *
 * **It owns the flow; the app owns the questions.** Pass `questions` — a
 * discriminated union on `kind`, which picks both the control and the answer's
 * shape — and receive the answers in `onSubmit`. Required questions block Next
 * with an error under the control; optional ones offer Skip, which records a
 * deliberate `{ kind: "skipped" }` rather than nothing. A question with
 * `showIf` appears only while its rule holds against earlier answers; a hidden
 * question is not counted, shown or submitted, and its stale answer is dropped.
 * Back returns to the question actually visited before, across a branch.
 *
 * Next stays pressable while the answer would not pass — dimmed, so a press can
 * say why. Submit validates every visible question and moves to the first that
 * fails. A promise returned from `onSubmit` holds the form inert with a spinner
 * until it settles; a rejection re-opens the form and is not swallowed.
 *
 * With no children it renders Progress, Question and the default Footer.
 * Compose the parts to add a title, choose a progress style, or rearrange the
 * footer — each footer button hides itself where it does not apply.
 *
 * @example
 * <Questionnaire questions={QUESTIONS} onSubmit={send} />
 *
 * @example
 * <Questionnaire questions={QUESTIONS} onSubmit={send}>
 *   <Questionnaire.Title>Quick feedback</Questionnaire.Title>
 *   <Questionnaire.Progress variant="count" />
 *   <Questionnaire.Question />
 *   <Questionnaire.Footer>
 *     <Questionnaire.Back />
 *     <Questionnaire.Spacer />
 *     <Questionnaire.Skip />
 *     <Questionnaire.Next />
 *     <Questionnaire.Submit>Send</Questionnaire.Submit>
 *   </Questionnaire.Footer>
 * </Questionnaire>
 */
export const Questionnaire = Object.assign(QuestionnaireRoot, {
	/** The questionnaire's name, at the top of the header strip. */
	Title: QuestionnaireTitle,
	/** How far through the visible questions the flow is — `bar`, `steps` or `count`. */
	Progress: QuestionnaireProgress,
	/** The question on screen: title, description, control and error. */
	Question: QuestionnaireQuestion,
	/** The row of navigation buttons. Lays out the default set with no children. */
	Footer: QuestionnaireFooter,
	/** Returns to the question visited before. Hidden on the first. */
	Back: QuestionnaireBack,
	/** Validates and moves on. Dimmed, never disabled, while the answer would not pass. */
	Next: QuestionnaireNext,
	/** Records a deliberate omission. Only on an optional question. */
	Skip: QuestionnaireSkip,
	/** Validates everything and calls `onSubmit`. Only on the last question. */
	Submit: QuestionnaireSubmit,
	/** Fills the footer, pushing what follows to the trailing edge. */
	Spacer: QuestionnaireSpacer,
	displayName: "DelacourUI.Questionnaire",
});
