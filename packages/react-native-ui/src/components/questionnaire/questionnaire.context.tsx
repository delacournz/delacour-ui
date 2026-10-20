import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { HapticFeedback } from "../pressable";
import type {
	Answer,
	Answers,
	Question,
	QuestionnaireDirection,
	QuestionnaireProgress,
	ValidationError,
} from "./questionnaire.types";
import type { QuestionnaireAxes, QuestionnaireSize, QuestionnaireVariant } from "./questionnaire.variants";

export type QuestionnaireContextValue = {
	/** Every question passed in, hidden ones included. */
	questions: readonly Question[];
	/** The questions in the flow right now. */
	visibleQuestions: readonly Question[];
	/** The question on screen, or `null` when nothing is visible. */
	current: Question | null;
	answers: Answers;
	/** Errors being shown, keyed by question id. */
	errors: Readonly<Record<string, ValidationError>>;
	/** The current question's shown error, worded — `null` while none is shown. */
	errorMessage: string | null;
	/** Whether the current question's answer would pass. Next and Submit dim while it would not. */
	isCurrentValid: boolean;
	progress: QuestionnaireProgress;
	/** "Question 2 of 5" — the count readout and the question's spoken prefix. */
	countLabel: string;
	canBack: boolean;
	canSkip: boolean;
	/** The current question is the last visible one: Submit replaces Next. */
	isLast: boolean;
	/** A promise returned by `onSubmit` has not settled. The form is inert. */
	isSubmitting: boolean;
	/** Submit passed validation. The footer hides. */
	isSubmitted: boolean;
	isDisabled: boolean;
	isReadOnly: boolean;
	/** Which way the flow last moved. */
	direction: QuestionnaireDirection;
	/** Whether the flow has moved since mount — the first question does not animate in. */
	hasNavigated: boolean;
	size: QuestionnaireSize;
	variant: QuestionnaireVariant;
	isFramed: boolean;
	/** The questionnaire's axes, translated for each control inside. */
	axes: QuestionnaireAxes;
	/** The questionnaire's own haptic, or `false`. */
	haptic: false | HapticFeedback;
	/** The root's `testID`, which every part derives its own from. */
	testID: string | undefined;
	/** Words an error for a question — the caller's `getErrorMessage`, or the English default. */
	formatError: (error: ValidationError, question: Question) => string;
	next: () => void;
	back: () => void;
	skip: () => void;
	submit: () => void;
	/** Moves to a visible question — visited ones and the next, while linear. */
	goTo: (id: string) => void;
	/** Stores an answer. `undefined` clears it. */
	setAnswer: (id: string, answer: Answer | undefined) => void;
	/** Back to the initial answers and question. */
	reset: () => void;
};

const QuestionnaireContext = createContext<QuestionnaireContextValue | null>(null);

/**
 * Supplies the flow to every part.
 *
 * Lives in its own module, importing nothing but React and types, so a part can
 * read it without importing `./questionnaire` and closing a cycle — Metro would
 * serve the context `undefined` at import time. See AGENTS.md rule 3.
 */
export function QuestionnaireProvider({
	value,
	children,
}: {
	value: QuestionnaireContextValue;
	children: ReactNode;
}): ReactElement {
	return <QuestionnaireContext value={value}>{children}</QuestionnaireContext>;
}
QuestionnaireProvider.displayName = "DelacourUI.Questionnaire.Provider";

/** The enclosing questionnaire, or `null` outside one. */
export function useQuestionnaireContext(): QuestionnaireContextValue | null {
	return use(QuestionnaireContext);
}

/**
 * Reads the enclosing questionnaire's flow and actions.
 *
 * For a custom part — a bespoke footer, a "Question 2 of 5" written your own
 * way, a review list that calls `goTo`. Throws outside a `<Questionnaire>`.
 */
export function useQuestionnaire(): QuestionnaireContextValue {
	const context = useQuestionnaireContext();
	if (!context) {
		throw new Error("useQuestionnaire must be called inside a <Questionnaire>.");
	}
	return context;
}

/**
 * The enclosing questionnaire, for a part that cannot work without one.
 *
 * Internal: not re-exported from `index.ts`. A caller wants {@link useQuestionnaire}.
 */
export function useQuestionnairePart(component: string): QuestionnaireContextValue {
	const context = useQuestionnaireContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Questionnaire>.`);
	}
	return context;
}
