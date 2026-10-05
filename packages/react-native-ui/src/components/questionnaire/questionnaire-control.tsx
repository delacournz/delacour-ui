import type { ReactElement } from "react";
import { View } from "react-native";
import { Checkbox } from "../checkbox";
import { Input } from "../input";
import { Radio } from "../radio";
import { Rating } from "../rating";
import { Text } from "../text";
import { Textarea } from "../textarea";
import { ToggleButton } from "../toggle-button";
import {
	chooseMultiple,
	chooseSingle,
	formatScaleValue,
	getScaleValues,
	getSelectedValues,
	isOtherSelected,
	QUESTIONNAIRE_RATING_MAX,
	setOtherText,
} from "./questionnaire.logic";
import type { Answer, Question, QuestionnaireOption } from "./questionnaire.types";
import {
	type QuestionnaireAxes,
	type QuestionnaireSize,
	questionnaireVariants,
	resolveQuestionnaireTestId,
} from "./questionnaire.variants";

export type QuestionnaireControlProps = {
	question: Question;
	answer: Answer | undefined;
	/** Stores the new answer. `undefined` clears it. */
	onAnswer: (answer: Answer | undefined) => void;
	axes: QuestionnaireAxes;
	size: QuestionnaireSize;
	isDisabled: boolean;
	isReadOnly: boolean;
	/** The questionnaire's `testID`; each element derives its own from it. */
	testID: string | undefined;
};

/** What each kind's control receives: its own question, narrowed, and a `store` that honours read-only. */
type KindProps<K extends Question["kind"]> = {
	question: Extract<Question, { kind: K }>;
	answer: Answer | undefined;
	store: (answer: Answer | undefined) => void;
	axes: QuestionnaireAxes;
	size: QuestionnaireSize;
	isDisabled: boolean;
	isReadOnly: boolean;
	/** The questionnaire's `testID`; each element derives its own from it. */
	testID: string | undefined;
};

/**
 * The answer control for a question, picked by its `kind`.
 *
 * Internal: the union on `kind` fully describes the form, so a caller never
 * names a control. Every control sits inside the question's `Field`, which is
 * where invalid and disabled reach it from — nothing here passes `isInvalid`.
 *
 * Read-only has no prop on most of these controls, so it is honoured by not
 * storing: the control still draws the answer, and a press changes nothing.
 */
export function QuestionnaireControl({
	question,
	onAnswer,
	isReadOnly,
	...rest
}: QuestionnaireControlProps): ReactElement {
	const store = (next: Answer | undefined): void => {
		if (!isReadOnly) onAnswer(next);
	};
	const shared = { ...rest, isReadOnly, store };

	switch (question.kind) {
		case "single":
			return <SingleControl question={question} {...shared} />;
		case "multiple":
			return <MultipleControl question={question} {...shared} />;
		case "text":
			return <TextControl question={question} {...shared} />;
		case "rating":
			return <RatingControl question={question} {...shared} />;
		case "scale":
			return <ScaleControl question={question} {...shared} />;
		case "yesNo":
			return <YesNoControl question={question} {...shared} />;
	}
}
QuestionnaireControl.displayName = "DelacourUI.Questionnaire.Control";

/** `single`: a radio group, plus the Other field while Other is chosen. */
function SingleControl({ question, answer, store, axes, size, isDisabled, testID }: KindProps<"single">): ReactElement {
	const slots = questionnaireVariants({ size });
	return (
		<View className={slots.choices()}>
			<Radio.Group
				accessibilityLabel={question.title}
				className={slots.choices()}
				isDisabled={isDisabled || undefined}
				onSelected={(value) => store(chooseSingle(question, answer, value))}
				selected={answer?.kind === "single" ? answer.value : null}
				size={axes.radioSize}
				variant={axes.radioVariant}
			>
				{question.options.map((option) => (
					<Radio
						isDisabled={option.isDisabled}
						key={option.value}
						testID={resolveQuestionnaireTestId(testID, question.id, option.value)}
						value={option.value}
					>
						<OptionLabel option={option} part="radio" />
					</Radio>
				))}
			</Radio.Group>
			<OtherInput answer={answer} axes={axes} question={question} store={store} testID={testID} />
		</View>
	);
}
SingleControl.displayName = "DelacourUI.Questionnaire.Control.Single";

/** `multiple`: a checkbox group, plus the Other field while Other is ticked. */
function MultipleControl({
	question,
	answer,
	store,
	axes,
	size,
	isDisabled,
	testID,
}: KindProps<"multiple">): ReactElement {
	const slots = questionnaireVariants({ size });
	return (
		<View className={slots.choices()}>
			<Checkbox.Group
				accessibilityLabel={question.title}
				checked={getSelectedValues(answer)}
				className={slots.choices()}
				color={axes.checkboxColor}
				isDisabled={isDisabled || undefined}
				onChecked={(values) => store(chooseMultiple(question, answer, values))}
				size={axes.checkboxSize}
			>
				{question.options.map((option) => (
					<Checkbox
						isDisabled={option.isDisabled}
						key={option.value}
						testID={resolveQuestionnaireTestId(testID, question.id, option.value)}
						value={option.value}
					>
						<OptionLabel option={option} part="checkbox" />
					</Checkbox>
				))}
			</Checkbox.Group>
			<OtherInput answer={answer} axes={axes} question={question} store={store} testID={testID} />
		</View>
	);
}
MultipleControl.displayName = "DelacourUI.Questionnaire.Control.Multiple";

/** `text`: an `Input`, or a growing `Textarea` with a count when `isMultiline`. Empty text clears the answer. */
function TextControl({ question, answer, store, axes, isReadOnly, testID }: KindProps<"text">): ReactElement {
	const value = answer?.kind === "text" ? answer.value : "";
	const onChangeText = (text: string): void => store(text === "" ? undefined : { kind: "text", value: text });

	if (!question.isMultiline) {
		return (
			<Input
				editable={!isReadOnly}
				maxLength={question.maxLength}
				onChangeText={onChangeText}
				placeholder={question.placeholder}
				size={axes.inputSize}
				testID={resolveQuestionnaireTestId(testID, question.id)}
				value={value}
				variant={axes.inputVariant}
			/>
		);
	}

	const count: { showCount: true; maxLength: number } | { showCount?: false } =
		question.maxLength === undefined ? {} : { maxLength: question.maxLength, showCount: true };
	return (
		<Textarea
			autoGrow
			editable={!isReadOnly}
			{...count}
			onChangeText={onChangeText}
			placeholder={question.placeholder}
			rows={3}
			size={axes.inputSize}
			testID={resolveQuestionnaireTestId(testID, question.id)}
			value={value}
			variant={axes.inputVariant}
		/>
	);
}
TextControl.displayName = "DelacourUI.Questionnaire.Control.Text";

/** `rating`: stars, cleared by a tap on the value held. Zero is no answer. */
function RatingControl({ question, answer, store, axes, isReadOnly, testID }: KindProps<"rating">): ReactElement {
	return (
		<Rating
			allowClear
			isReadOnly={isReadOnly}
			maxValue={question.maxValue ?? QUESTIONNAIRE_RATING_MAX}
			onChange={(value) => store(value === 0 ? undefined : { kind: "rating", value })}
			size={axes.ratingSize}
			step={question.step ?? 1}
			value={answer?.kind === "rating" ? answer.value : 0}
		>
			<Rating.Stars accessibilityLabel={question.title} testID={resolveQuestionnaireTestId(testID, question.id)} />
		</Rating>
	);
}
RatingControl.displayName = "DelacourUI.Questionnaire.Control.Rating";

/** `scale`: a wrapping row of numbered toggles, each read as "7 out of 10", with the end captions under it. */
function ScaleControl({ question, answer, store, axes, size, testID }: KindProps<"scale">): ReactElement {
	const slots = questionnaireVariants({ size });
	const hasLabels = question.minLabel !== undefined || question.maxLabel !== undefined;
	return (
		<View>
			<ToggleButton.Group
				accessibilityLabel={question.title}
				className={slots.scale()}
				layout="detached"
				onSelected={([value]) => store(value === undefined ? undefined : { kind: "scale", value: Number(value) })}
				selected={getSelectedValues(answer)}
				selectionMode="single"
				size={axes.scaleButtonSize}
				variant={axes.toggleVariant}
			>
				{getScaleValues(question.min, question.max).map((value) => (
					<ToggleButton
						accessibilityLabel={formatScaleValue(value, question.max)}
						key={value}
						testID={resolveQuestionnaireTestId(testID, question.id, String(value))}
						value={String(value)}
					>
						{String(value)}
					</ToggleButton>
				))}
			</ToggleButton.Group>
			{hasLabels ? (
				<View className={slots.scaleLabels()}>
					<Text.Caption>{question.minLabel ?? ""}</Text.Caption>
					<Text.Caption>{question.maxLabel ?? ""}</Text.Caption>
				</View>
			) : null}
		</View>
	);
}
ScaleControl.displayName = "DelacourUI.Questionnaire.Control.Scale";

/** `yesNo`: two wide toggles, either-or. */
function YesNoControl({ question, answer, store, axes, size, testID }: KindProps<"yesNo">): ReactElement {
	const slots = questionnaireVariants({ size });
	return (
		<ToggleButton.Group
			accessibilityLabel={question.title}
			className={slots.choices()}
			layout="detached"
			onSelected={([value]) => store(value === "yes" || value === "no" ? { kind: "yesNo", value } : undefined)}
			selected={getSelectedValues(answer)}
			selectionMode="single"
			size={axes.buttonSize}
			variant={axes.toggleVariant}
		>
			<ToggleButton className="flex-1" testID={resolveQuestionnaireTestId(testID, question.id, "yes")} value="yes">
				{question.yesLabel ?? "Yes"}
			</ToggleButton>
			<ToggleButton className="flex-1" testID={resolveQuestionnaireTestId(testID, question.id, "no")} value="no">
				{question.noLabel ?? "No"}
			</ToggleButton>
		</ToggleButton.Group>
	);
}
YesNoControl.displayName = "DelacourUI.Questionnaire.Control.YesNo";

/** An option's label, with its description composed inside the row so both stay one tap target. */
function OptionLabel({ option, part }: { option: QuestionnaireOption; part: "radio" | "checkbox" }): ReactElement {
	const Label = part === "radio" ? Radio.Label : Checkbox.Label;
	if (!option.description) return <Label>{option.label}</Label>;
	return (
		<View className="min-w-0 shrink gap-0.5">
			<Label>{option.label}</Label>
			<Text.Caption>{option.description}</Text.Caption>
		</View>
	);
}
OptionLabel.displayName = "DelacourUI.Questionnaire.Control.OptionLabel";

/** The free-text field an "Other" option reveals, while that option is chosen. */
function OtherInput({
	question,
	answer,
	axes,
	store,
	testID,
}: {
	question: Question;
	answer: Answer | undefined;
	axes: QuestionnaireAxes;
	store: (answer: Answer | undefined) => void;
	testID: string | undefined;
}): ReactElement | null {
	if (!isOtherSelected(question, answer)) return null;
	const other = answer && (answer.kind === "single" || answer.kind === "multiple") ? (answer.other ?? "") : "";
	return (
		<Input
			accessibilityLabel="Other answer"
			autoFocus
			onChangeText={(text) => store(setOtherText(answer, text))}
			placeholder="Please specify"
			size={axes.inputSize}
			testID={resolveQuestionnaireTestId(testID, question.id, "other")}
			value={other}
			variant={axes.inputVariant}
		/>
	);
}
OtherInput.displayName = "DelacourUI.Questionnaire.Control.OtherInput";
