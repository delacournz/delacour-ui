import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";
import { Progress } from "../progress";
import { Steps } from "../steps";
import { Text } from "../text";
import { useQuestionnairePart } from "./questionnaire.context";
import { type QuestionnaireProgressVariant, questionnaireVariants } from "./questionnaire.variants";

export type QuestionnaireProgressProps = Omit<ViewProps, "children"> & {
	/** `bar` fills a track, `steps` draws a stepper, `count` reads "Question 2 of 5". Default `bar`. */
	variant?: QuestionnaireProgressVariant;
	className?: string;
};

/**
 * How far through the visible questions the flow is.
 *
 * Counts only what is visible, so the total moves as branching reveals and
 * hides questions — the bar can step backwards when a question appears ahead.
 * After submit it reads full.
 *
 * Every variant says the same thing to a screen reader: "Question 2 of 5". The
 * bar is `Progress`'s `progressbar` with that as its value; the stepper is
 * hidden beneath a single element carrying the same, so its circles are not
 * read one by one; the count is plain text on a polite live region.
 */
export function QuestionnaireProgress({
	variant = "bar",
	className,
	...props
}: QuestionnaireProgressProps): ReactElement | null {
	const { axes, countLabel, isFramed, isSubmitted, progress, size, visibleQuestions } =
		useQuestionnairePart("Questionnaire.Progress");
	if (progress.total === 0) return null;

	const slots = questionnaireVariants({ isFramed, size });
	const now = isSubmitted ? progress.total : progress.index + 1;
	const rootClass = slots.header({ class: slots.progress(), className });

	if (variant === "count") {
		return (
			<View className={rootClass} {...props}>
				<Text.Caption accessibilityLiveRegion="polite" className={slots.count()}>
					{countLabel}
				</Text.Caption>
			</View>
		);
	}

	if (variant === "steps") {
		return (
			<View
				accessibilityLabel={countLabel}
				accessibilityRole="progressbar"
				accessibilityValue={{ max: progress.total, min: 1, now }}
				accessible
				className={rootClass}
				{...props}
			>
				<Steps
					accessibilityElementsHidden
					importantForAccessibility="no-hide-descendants"
					isReadOnly
					size={axes.stepsSize}
					value={isSubmitted ? progress.total : progress.index}
					variant={axes.stepsVariant}
				>
					{visibleQuestions.map((question, step) => (
						<Steps.Item key={question.id} step={step} />
					))}
				</Steps>
			</View>
		);
	}

	return (
		<View className={rootClass} {...props}>
			<Progress
				accessibilityLabel={countLabel}
				color={axes.progressColor}
				maxValue={progress.total}
				minValue={0}
				size={axes.progressSize}
				value={now}
				valueLabel={countLabel}
			/>
		</View>
	);
}
QuestionnaireProgress.displayName = "DelacourUI.Questionnaire.Progress";
