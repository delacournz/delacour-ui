import type { ReactNode } from "react";
import type { ButtonProps } from "../button";
import type { HapticFeedback } from "../pressable";
import type { QuestionnaireSize, QuestionnaireVariant } from "./questionnaire.variants";

/** One choice in a `single` or `multiple` question. */
export type QuestionnaireOption = {
	/** Stable identifier, written into the answer. Unique within the question. */
	value: string;
	label: string;
	/** Supporting copy under the label. */
	description?: string;
	/** Shown but cannot be chosen. An answer naming it is invalid. */
	isDisabled?: boolean;
	/** Choosing it reveals a text field, and the answer is incomplete until it is filled in. */
	isOther?: boolean;
};

/** What every question kind shares. */
export type QuestionBase = {
	/** Unique and stable — answers, conditions and history are keyed by it. */
	id: string;
	title: string;
	description?: string;
	/** Blocks Next and Submit until answered, and hides Skip. Default `false`. */
	isRequired?: boolean;
	/** Removes the question from the flow, the way an unmet `showIf` does. */
	isDisabled?: boolean;
	/** Shown only while this holds against the answers to earlier questions. */
	showIf?: QuestionCondition;
};

/** A question, discriminated on `kind` — the kind picks the control and the answer's shape. */
export type Question =
	| (QuestionBase & { kind: "single"; options: readonly QuestionnaireOption[] })
	| (QuestionBase & {
			kind: "multiple";
			options: readonly QuestionnaireOption[];
			minSelected?: number;
			maxSelected?: number;
	  })
	| (QuestionBase & {
			kind: "text";
			placeholder?: string;
			isMultiline?: boolean;
			minLength?: number;
			maxLength?: number;
	  })
	| (QuestionBase & {
			kind: "rating";
			/** How many stars. Default 5. */
			maxValue?: number;
			/** `0.5` allows half stars. Default `1`. */
			step?: 1 | 0.5;
	  })
	| (QuestionBase & {
			kind: "scale";
			min: number;
			max: number;
			/** Caption under the low end — "Not likely". */
			minLabel?: string;
			/** Caption under the high end — "Very likely". */
			maxLabel?: string;
	  })
	| (QuestionBase & {
			kind: "yesNo";
			/** The first button's text. Default "Yes". */
			yesLabel?: string;
			/** The second button's text. Default "No". */
			noLabel?: string;
	  });

export type QuestionKind = Question["kind"];

/**
 * When a question is shown, as a rule over earlier answers.
 *
 * A rule naming a question declared later, or one that does not exist, never
 * holds — see `findForwardReferences` and `findDanglingReferences`.
 */
export type QuestionCondition =
	| { type: "answered"; questionId: string }
	| { type: "equals"; questionId: string; value: string | number }
	| { type: "includes"; questionId: string; value: string }
	| { type: "gte" | "lte"; questionId: string; value: number }
	| { type: "and" | "or"; conditions: readonly QuestionCondition[] }
	| { type: "not"; condition: QuestionCondition };

/** An answer, discriminated on `kind`. `skipped` is a deliberate omission, not a missing answer. */
export type Answer =
	| { kind: "single"; value: string; other?: string }
	| { kind: "multiple"; values: readonly string[]; other?: string }
	| { kind: "text"; value: string }
	| { kind: "rating"; value: number }
	| { kind: "scale"; value: number }
	| { kind: "yesNo"; value: "yes" | "no" }
	| { kind: "skipped" };

export type Answers = Readonly<Record<string, Answer>>;

/** Why an answer cannot be accepted, discriminated on `type`. */
export type ValidationError =
	| { type: "required" }
	| { type: "minSelected"; min: number }
	| { type: "maxSelected"; max: number }
	| { type: "minLength"; min: number }
	| { type: "maxLength"; max: number }
	| { type: "outOfRange"; min: number; max: number }
	| { type: "otherRequired" };

/** Which way the flow last moved — what the question transition slides with. */
export type QuestionnaireDirection = "forward" | "backward";

/** `active` while questions are being answered; `submitted` once Submit has passed validation. */
export type QuestionnaireStatus = "active" | "submitted";

/** Where the flow is, over the visible questions only. */
export type QuestionnaireProgress = {
	/** The current question's position, zero-based. */
	index: number;
	/** How many questions are visible now. Moves as branching shows and hides questions. */
	total: number;
	/** `(index + 1) / total`, in `[0, 1]`. `0` with no questions. */
	ratio: number;
};

export type QuestionnaireProps = {
	questions: readonly Question[];
	/** Controlled answers, keyed by question id. */
	answers?: Answers;
	/** Starting answers while uncontrolled. */
	defaultAnswers?: Answers;
	/** Called with every new set of answers — hidden questions' answers already pruned. */
	onAnswersChange?: (answers: Answers) => void;
	/** Controlled current question. `null` means the first visible one. */
	currentId?: string | null;
	/** Starting question while uncontrolled. */
	defaultCurrentId?: string | null;
	/** Called with the id of every question the flow moves to. */
	onCurrentChange?: (id: string) => void;
	/**
	 * Called once every visible required question is answered. Receives the
	 * visible questions' answers, with skipped ones kept as `skipped`. A returned
	 * promise holds the form in `isSubmitting` until it settles; a rejection
	 * re-enables the form and is not caught.
	 */
	onSubmit?: (answers: Answers) => void | Promise<void>;
	size?: QuestionnaireSize;
	/** `primary` fills the controls and the Next button; `secondary` outlines them. */
	variant?: QuestionnaireVariant;
	/** A card with a header and a footer band. `false` for a bare column inside a sheet or screen. Default `true`. */
	isFramed?: boolean;
	/**
	 * Restricts `goTo` to visited questions and the next one. Default `true`.
	 * `false` lets `goTo` jump to any visible question.
	 */
	isLinear?: boolean;
	/** Every control and every footer button is disabled. */
	isDisabled?: boolean;
	/** Answers are shown and cannot change; navigation still works. */
	isReadOnly?: boolean;
	/** Words each validation error. English defaults are used without it. */
	getErrorMessage?: (error: ValidationError, question: Question) => string;
	/** The questionnaire's own haptics — navigation, a blocked Next, Submit. `false` silences them. */
	haptic?: false | HapticFeedback;
	className?: string;
	/** The anatomy. With none, renders Title-less Progress, Question and the default Footer. */
	children?: ReactNode;
};

/**
 * What Back, Skip, Next and Submit take — a `Button`'s props, with the press
 * owned by the questionnaire. A caller's `onPress` still runs, after the
 * questionnaire's action; `size` follows the questionnaire unless named.
 */
export type QuestionnaireButtonProps = ButtonProps;
