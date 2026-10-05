import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import type { ButtonIconSize, ButtonLabelSize, ButtonVariant } from "../button/button.variants";
import type { CheckboxColor, CheckboxSize } from "../checkbox/checkbox.variants";
import type { InputSize, InputVariant } from "../input/input.variants";
import type { ProgressColor, ProgressSize } from "../progress/progress.variants";
import type { RadioSize, RadioVariant } from "../radio/radio.variants";
import type { RatingSize } from "../rating/rating.variants";
import type { StepsSize, StepsVariant } from "../steps/steps.variants";
import type { TextSize, TextVariant } from "../text/text.variants";
import type { ToggleButtonVariant } from "../toggle-button/toggle-button.variants";

/** The sizes every control inside takes — the label half of `Button`'s scale. */
export const QUESTIONNAIRE_SIZES = ["sm", "md", "lg"] as const;

/** `primary` fills the controls and Next; `secondary` outlines them. */
export const QUESTIONNAIRE_VARIANTS = ["primary", "secondary"] as const;

/** How `Questionnaire.Progress` draws: a bar, a stepper, or "Question 2 of 5". */
export const QUESTIONNAIRE_PROGRESS_VARIANTS = ["bar", "steps", "count"] as const;

export type QuestionnaireSize = (typeof QUESTIONNAIRE_SIZES)[number];
export type QuestionnaireVariant = (typeof QUESTIONNAIRE_VARIANTS)[number];
export type QuestionnaireProgressVariant = (typeof QUESTIONNAIRE_PROGRESS_VARIANTS)[number];

export const QUESTIONNAIRE_DEFAULT_SIZE: QuestionnaireSize = "md";
export const QUESTIONNAIRE_DEFAULT_VARIANT: QuestionnaireVariant = "primary";

/** How far a new question slides in from the side it travels from, in points. */
export const QUESTIONNAIRE_SLIDE_DISTANCE = 24;

/** The question transition's duration — `calm` is the cross-fade used under calm motion. */
export const QUESTIONNAIRE_TRANSITION_MS = { calm: 100, full: 220 } as const;

/**
 * The questionnaire's slots.
 *
 * Framed, every part pads itself — the header strip, the body and the footer
 * band each own their inset, so the card's edge-to-edge `Separator` above the
 * footer can run to the corners. Unframed, nothing pads and the root spaces
 * the parts with a gap instead, so the flow sits flush inside a sheet or a
 * screen that already has a gutter.
 *
 * No slot carries a text colour: every text part renders a `Text` preset or a
 * `Field` part, whose `color` decides it (rule 1).
 *
 * Free of React Native imports so it stays unit-testable. See AGENTS.md.
 */
export const questionnaireVariants = tv({
	slots: {
		root: "",
		header: "",
		title: "",
		progress: "",
		count: "tabular-nums",
		body: "",
		question: "",
		heading: "",
		description: "",
		choices: "",
		other: "",
		scale: "flex-row flex-wrap",
		scaleLabels: "flex-row justify-between",
		footer: "flex-row items-center",
		spacer: "flex-1",
		action: "",
	},
	variants: {
		size: {
			sm: {
				root: "",
				header: "gap-2",
				question: "gap-2",
				choices: "gap-2",
				scale: "gap-1.5",
				scaleLabels: "pt-1",
				footer: "gap-2",
			},
			md: {
				header: "gap-3",
				question: "gap-3",
				choices: "gap-3",
				scale: "gap-2",
				scaleLabels: "pt-1.5",
				footer: "gap-2",
			},
			lg: {
				header: "gap-4",
				question: "gap-4",
				choices: "gap-4",
				scale: "gap-2.5",
				scaleLabels: "pt-2",
				footer: "gap-3",
			},
		},
		/**
		 * Next and Submit while the current answer would not pass: faded, and
		 * still pressable, so a press can say why. Not `isDisabled`.
		 */
		isDimmed: {
			true: { action: "opacity-50" },
			false: {},
		},
		isFramed: {
			true: {
				root: "overflow-hidden",
				header: "px-4 pt-4",
				body: "px-4 py-4",
				footer: "px-4 py-3",
			},
			false: {
				root: "gap-4",
			},
		},
	},
	compoundVariants: [
		{ isFramed: true, size: "sm", class: { header: "px-3 pt-3", body: "px-3 py-3", footer: "px-3 py-2.5" } },
		{ isFramed: true, size: "lg", class: { header: "px-5 pt-5", body: "px-5 py-5", footer: "px-5 py-4" } },
		{ isFramed: false, size: "sm", class: { root: "gap-3" } },
		{ isFramed: false, size: "lg", class: { root: "gap-5" } },
	],
	defaultVariants: {
		isDimmed: false,
		isFramed: true,
		size: "md",
	},
});

export type QuestionnaireVariantProps = VariantProps<typeof questionnaireVariants>;

/** What each control inside is handed, settled from the questionnaire's two axes. */
export type QuestionnaireAxes = {
	buttonSize: ButtonLabelSize;
	/** A scale's numbered buttons are squares on the same step. */
	scaleButtonSize: ButtonIconSize;
	nextVariant: ButtonVariant;
	backVariant: ButtonVariant;
	skipVariant: ButtonVariant;
	inputSize: InputSize;
	inputVariant: InputVariant;
	radioSize: RadioSize;
	radioVariant: RadioVariant;
	checkboxSize: CheckboxSize;
	checkboxColor: CheckboxColor;
	ratingSize: RatingSize;
	toggleVariant: ToggleButtonVariant;
	stepsSize: StepsSize;
	stepsVariant: StepsVariant;
	progressSize: ProgressSize;
	progressColor: ProgressColor;
	/** The questionnaire's own title. */
	titleVariant: TextVariant;
	/** The current question's heading — a `Field.Label` promoted up the scale. */
	headingSize: TextSize;
};

const SCALE_BUTTON_SIZE: Record<QuestionnaireSize, ButtonIconSize> = { sm: "icon-sm", md: "icon-md", lg: "icon-lg" };
const HEADING_SIZE: Record<QuestionnaireSize, TextSize> = { sm: "md", md: "lg", lg: "xl" };
const TITLE_VARIANT: Record<QuestionnaireSize, TextVariant> = { sm: "header", md: "header", lg: "title" };

/**
 * The one table mapping the questionnaire's axes onto its controls.
 *
 * `size` passes through unchanged — every control here shares the `sm | md |
 * lg` scale, and a test holds that. `variant` is translated, because the
 * controls do not share a vocabulary for it: an `Input`, a `Radio` and `Steps`
 * own `primary | secondary` outright, a `ToggleButton` says `default | outline`,
 * and a `Checkbox` has colours rather than variants.
 */
export function resolveQuestionnaireAxes({
	size,
	variant,
}: {
	size: QuestionnaireSize;
	variant: QuestionnaireVariant;
}): QuestionnaireAxes {
	const isPrimary = variant === "primary";
	return {
		backVariant: "ghost",
		buttonSize: size,
		checkboxColor: isPrimary ? "primary" : "default",
		checkboxSize: size,
		headingSize: HEADING_SIZE[size],
		inputSize: size,
		inputVariant: variant,
		nextVariant: variant,
		progressColor: isPrimary ? "primary" : "default",
		progressSize: size,
		radioSize: size,
		radioVariant: variant,
		ratingSize: size,
		scaleButtonSize: SCALE_BUTTON_SIZE[size],
		skipVariant: "ghost",
		stepsSize: size,
		stepsVariant: variant,
		titleVariant: TITLE_VARIANT[size],
		toggleVariant: isPrimary ? "default" : "outline",
	};
}

/**
 * Which footer buttons render.
 *
 * Back needs somewhere to go, Skip needs an optional question, and Next and
 * Submit are one slot that swaps on the last visible question. Once submitted
 * the footer is empty — the app navigates away in `onSubmit`.
 */
export function resolveQuestionnaireFooterButtons({
	canBack,
	canSkip,
	isLast,
	isSubmitted,
}: {
	canBack: boolean;
	canSkip: boolean;
	isLast: boolean;
	isSubmitted: boolean;
}): { back: boolean; skip: boolean; next: boolean; submit: boolean } {
	if (isSubmitted) return { back: false, next: false, skip: false, submit: false };
	return { back: canBack, next: !isLast, skip: canSkip, submit: isLast };
}
