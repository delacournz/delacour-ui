import { type ReactElement, type ReactNode, useCallback, useEffect, useRef } from "react";
import { AccessibilityInfo, type View as NativeView, View, type ViewProps } from "react-native";
import Animated, { Easing, FadeIn, FadeOut, Keyframe, LinearTransition } from "react-native-reanimated";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { Field } from "../field";
import { type QuestionnaireContextValue, useQuestionnairePart } from "./questionnaire.context";
import type { Answer, Question } from "./questionnaire.types";
import {
	QUESTIONNAIRE_SLIDE_DISTANCE,
	QUESTIONNAIRE_TRANSITION_MS,
	questionnaireVariants,
} from "./questionnaire.variants";
import { QuestionnaireControl } from "./questionnaire-control";

export type QuestionnaireQuestionProps = ViewProps & {
	className?: string;
	/**
	 * Draws the control for a question yourself — a custom kind, or a bespoke
	 * layout for one of the six. Return `undefined` to fall back to the built-in
	 * control. The title, description and error stay the questionnaire's.
	 */
	renderQuestion?: (question: Question, state: QuestionnaireContextValue) => ReactNode;
};

const EASING = Easing.out(Easing.cubic);

/** A short slide plus a fade — `SlideInRight` would travel the whole screen width. */
function slideFrom(offset: number) {
	return new Keyframe({
		0: { opacity: 0, transform: [{ translateX: offset }] },
		100: { easing: EASING, opacity: 1, transform: [{ translateX: 0 }] },
	}).duration(QUESTIONNAIRE_TRANSITION_MS.full);
}

const FORWARD = slideFrom(QUESTIONNAIRE_SLIDE_DISTANCE);
const BACKWARD = slideFrom(-QUESTIONNAIRE_SLIDE_DISTANCE);
const CALM = FadeIn.duration(QUESTIONNAIRE_TRANSITION_MS.calm);
const EXIT = FadeOut.duration(QUESTIONNAIRE_TRANSITION_MS.calm);
const RESIZE = LinearTransition.duration(QUESTIONNAIRE_TRANSITION_MS.full).easing(EASING);

/**
 * The question on screen: its title, description, control and error, in a
 * `Field` so invalid and disabled reach the control with nothing said.
 *
 * The title is the `Field.Label`, promoted up the type scale to read as the
 * question's heading. A new question slides in from the side it travels from —
 * forward from the right, back from the left — and the frame's height follows;
 * under calm motion that is a short cross-fade with no slide and no resize.
 *
 * After every move the question is announced as "Question 2 of 5: <title>" and
 * screen-reader focus lands on its heading. The first question is neither
 * animated nor announced: nothing has moved yet.
 */
export function QuestionnaireQuestion({
	className,
	renderQuestion,
	...props
}: QuestionnaireQuestionProps): ReactElement | null {
	const questionnaire = useQuestionnairePart("Questionnaire.Question");
	const {
		answers,
		axes,
		countLabel,
		current,
		direction,
		errorMessage,
		hasNavigated,
		isDisabled,
		isFramed,
		isReadOnly,
		isSubmitting,
		setAnswer,
		size,
	} = questionnaire;
	const isCalm = useCalmMotion();
	const headingRef = useRef<NativeView>(null);
	const currentId = current?.id;
	const title = current?.title;

	useEffect(() => {
		if (!hasNavigated || currentId === undefined) return;
		AccessibilityInfo.announceForAccessibility(`${countLabel}: ${title}`);
		const timer = setTimeout(
			() => {
				if (headingRef.current) AccessibilityInfo.sendAccessibilityEvent(headingRef.current, "focus");
			},
			isCalm ? QUESTIONNAIRE_TRANSITION_MS.calm : QUESTIONNAIRE_TRANSITION_MS.full
		);
		return () => clearTimeout(timer);
	}, [countLabel, currentId, hasNavigated, isCalm, title]);

	const onAnswer = useCallback(
		(answer: Answer | undefined) => {
			if (currentId !== undefined) setAnswer(currentId, answer);
		},
		[currentId, setAnswer]
	);

	if (!current) return null;

	const slots = questionnaireVariants({ isFramed, size });
	const isInert = isDisabled || isSubmitting;
	const answer = answers[current.id];
	const custom = renderQuestion?.(current, questionnaire);
	const control = custom ?? (
		<QuestionnaireControl
			answer={answer}
			axes={axes}
			isDisabled={isInert}
			isReadOnly={isReadOnly}
			onAnswer={onAnswer}
			question={current}
			size={size}
		/>
	);

	const slide = direction === "forward" ? FORWARD : BACKWARD;
	const entering = !hasNavigated ? undefined : isCalm ? CALM : slide;

	return (
		<Animated.View className={slots.body({ className })} layout={isCalm ? undefined : RESIZE} {...props}>
			<Animated.View entering={entering} exiting={hasNavigated ? EXIT : undefined} key={current.id}>
				<Field isDisabled={isInert} isInvalid={errorMessage !== null}>
					<View className={slots.question()}>
						<View accessibilityRole="header" accessible ref={headingRef}>
							<Field.Label className={slots.heading()} size={axes.headingSize}>
								{current.title}
							</Field.Label>
						</View>
						{current.description ? (
							<Field.Description className={slots.description()}>{current.description}</Field.Description>
						) : null}
						{control}
						<Field.Error>{errorMessage ?? undefined}</Field.Error>
					</View>
				</Field>
			</Animated.View>
		</Animated.View>
	);
}
QuestionnaireQuestion.displayName = "DelacourUI.Questionnaire.Question";
