import { afterEach, describe, expect, jest, test } from "@jest/globals";
import { AccessibilityInfo, Text } from "react-native";
import { act, fireEvent, renderWithProviders, screen } from "../../test/render";
import { Questionnaire } from "./questionnaire";
import type { Answers, Question } from "./questionnaire.types";

const SINGLE: Question = {
	id: "plan",
	isRequired: true,
	kind: "single",
	options: [
		{ label: "Starter", value: "starter" },
		{ label: "Pro", value: "pro" },
		{ isOther: true, label: "Something else", value: "else" },
	],
	title: "Which plan?",
};
const MULTIPLE: Question = {
	kind: "multiple",
	id: "tools",
	options: [
		{ label: "Slack", value: "slack" },
		{ label: "Linear", value: "linear" },
	],
	title: "Which tools?",
};
const TEXT: Question = { id: "name", isRequired: true, kind: "text", placeholder: "Your name", title: "Your name?" };
const RATING: Question = { id: "stars", kind: "rating", maxValue: 5, title: "How was it?" };
const SCALE: Question = { id: "nps", kind: "scale", max: 3, min: 1, title: "Likely to recommend?" };
const YES_NO: Question = { id: "agree", kind: "yesNo", title: "Do you agree?" };

/** Text (required) → yes/no (optional) → single (required): Next, Skip, Back and Submit all appear. */
const FLOW: readonly Question[] = [TEXT, YES_NO, SINGLE];

const announce = (): jest.SpiedFunction<typeof AccessibilityInfo.announceForAccessibility> => {
	const spy = jest.spyOn(AccessibilityInfo, "announceForAccessibility");
	spy.mockClear();
	return spy;
};

afterEach(() => {
	jest.restoreAllMocks();
});

describe("Questionnaire: question rendering per control type", () => {
	test("single renders a radio group with one radio per option", async () => {
		await renderWithProviders(<Questionnaire haptic={false} questions={[SINGLE]} />);
		expect(screen.getByText("Which plan?")).toBeOnTheScreen();
		expect(screen.getAllByRole("radio")).toHaveLength(3);
		expect(screen.getByRole("radio", { name: "Pro" })).not.toBeChecked();
	});

	test("multiple renders a checkbox per option", async () => {
		await renderWithProviders(<Questionnaire haptic={false} questions={[MULTIPLE]} />);
		expect(screen.getAllByRole("checkbox")).toHaveLength(2);
		expect(screen.getByRole("checkbox", { name: "Slack" })).not.toBeChecked();
	});

	test("text renders an input carrying the placeholder", async () => {
		await renderWithProviders(<Questionnaire haptic={false} questions={[TEXT]} />);
		expect(screen.getByPlaceholderText("Your name")).toBeOnTheScreen();
	});

	test("rating renders an adjustable named for the question", async () => {
		await renderWithProviders(<Questionnaire haptic={false} questions={[RATING]} />);
		expect(screen.getByRole("adjustable")).toBeOnTheScreen();
	});

	test("scale renders one 'n out of max' button per step", async () => {
		await renderWithProviders(<Questionnaire haptic={false} questions={[SCALE]} />);
		expect(screen.getByRole("radio", { name: "1 out of 3" })).toBeOnTheScreen();
		expect(screen.getByRole("radio", { name: "2 out of 3" })).toBeOnTheScreen();
		expect(screen.getByRole("radio", { name: "3 out of 3" })).toBeOnTheScreen();
	});

	test("yesNo renders the default and the custom labels", async () => {
		const view = await renderWithProviders(<Questionnaire haptic={false} questions={[YES_NO]} />);
		expect(screen.getByRole("radio", { name: "Yes" })).toBeOnTheScreen();
		expect(screen.getByRole("radio", { name: "No" })).toBeOnTheScreen();

		await view.rerender(
			<Questionnaire haptic={false} questions={[{ ...YES_NO, noLabel: "Nope", yesLabel: "Absolutely" }]} />
		);
		expect(screen.getByRole("radio", { name: "Absolutely" })).toBeOnTheScreen();
		expect(screen.getByRole("radio", { name: "Nope" })).toBeOnTheScreen();
	});

	test("the description renders under the title", async () => {
		await renderWithProviders(
			<Questionnaire haptic={false} questions={[{ ...YES_NO, description: "Read the terms first." }]} />
		);
		expect(screen.getByText("Read the terms first.")).toBeOnTheScreen();
	});

	test("an empty question list renders nothing", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
		await renderWithProviders(<Questionnaire haptic={false} questions={[]} testID="q" />);
		expect(screen.queryByTestId("q")).not.toBeOnTheScreen();
		expect(warn).toHaveBeenCalled();
	});

	test("renderQuestion replaces the control and keeps the heading", async () => {
		await renderWithProviders(
			<Questionnaire haptic={false} questions={[YES_NO]}>
				<Questionnaire.Question renderQuestion={() => <Text>Custom control</Text>} />
			</Questionnaire>
		);
		expect(screen.getByText("Custom control")).toBeOnTheScreen();
		expect(screen.getByText("Do you agree?")).toBeOnTheScreen();
		expect(screen.queryByRole("radio")).not.toBeOnTheScreen();
	});
});

describe("Questionnaire: answering", () => {
	test("single: choosing an option checks it and reports the answer", async () => {
		const onAnswersChange = jest.fn<(answers: Answers) => void>();
		await renderWithProviders(<Questionnaire haptic={false} onAnswersChange={onAnswersChange} questions={[SINGLE]} />);
		await fireEvent(screen.getByRole("radio", { name: "Pro" }), "accessibilityTap");
		expect(screen.getByRole("radio", { name: "Pro" })).toBeChecked();
		expect(screen.getByRole("radio", { name: "Starter" })).not.toBeChecked();
		expect(onAnswersChange).toHaveBeenLastCalledWith({ plan: { kind: "single", value: "pro" } });
	});

	test("single: choosing Other reveals a field whose text joins the answer", async () => {
		const onAnswersChange = jest.fn<(answers: Answers) => void>();
		await renderWithProviders(
			<Questionnaire haptic={false} onAnswersChange={onAnswersChange} questions={[SINGLE]} testID="q" />
		);
		expect(screen.queryByTestId("q-plan-other")).not.toBeOnTheScreen();
		await fireEvent(screen.getByRole("radio", { name: "Something else" }), "accessibilityTap");
		await fireEvent.changeText(screen.getByTestId("q-plan-other"), "Enterprise");
		expect(onAnswersChange).toHaveBeenLastCalledWith({ plan: { kind: "single", other: "Enterprise", value: "else" } });
	});

	test("multiple: ticking boxes reports the values", async () => {
		const onAnswersChange = jest.fn<(answers: Answers) => void>();
		await renderWithProviders(
			<Questionnaire haptic={false} onAnswersChange={onAnswersChange} questions={[MULTIPLE]} />
		);
		await fireEvent(screen.getByRole("checkbox", { name: "Slack" }), "accessibilityTap");
		await fireEvent(screen.getByRole("checkbox", { name: "Linear" }), "accessibilityTap");
		expect(screen.getByRole("checkbox", { name: "Slack" })).toBeChecked();
		expect(screen.getByRole("checkbox", { name: "Linear" })).toBeChecked();
		expect(onAnswersChange).toHaveBeenLastCalledWith({ tools: { kind: "multiple", values: ["slack", "linear"] } });
	});

	test("text: typing stores the answer and clearing removes it", async () => {
		const onAnswersChange = jest.fn<(answers: Answers) => void>();
		await renderWithProviders(<Questionnaire haptic={false} onAnswersChange={onAnswersChange} questions={[TEXT]} />);
		const input = screen.getByPlaceholderText("Your name");
		await fireEvent.changeText(input, "Ada");
		expect(onAnswersChange).toHaveBeenLastCalledWith({ name: { kind: "text", value: "Ada" } });
		await fireEvent.changeText(input, "");
		expect(onAnswersChange).toHaveBeenLastCalledWith({});
	});

	test("rating: an increment action stores the next star", async () => {
		const onAnswersChange = jest.fn<(answers: Answers) => void>();
		await renderWithProviders(<Questionnaire haptic={false} onAnswersChange={onAnswersChange} questions={[RATING]} />);
		await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", {
			nativeEvent: { actionName: "increment" },
		});
		expect(onAnswersChange).toHaveBeenLastCalledWith({ stars: { kind: "rating", value: 1 } });
		expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 1 });
	});

	test("scale: choosing a step selects it and reports a number", async () => {
		const onAnswersChange = jest.fn<(answers: Answers) => void>();
		await renderWithProviders(<Questionnaire haptic={false} onAnswersChange={onAnswersChange} questions={[SCALE]} />);
		await fireEvent(screen.getByRole("radio", { name: "2 out of 3" }), "accessibilityTap");
		expect(screen.getByRole("radio", { name: "2 out of 3" })).toBeSelected();
		expect(screen.getByRole("radio", { name: "1 out of 3" })).not.toBeSelected();
		expect(onAnswersChange).toHaveBeenLastCalledWith({ nps: { kind: "scale", value: 2 } });
	});

	test("yesNo: choosing a button selects it and reports yes or no", async () => {
		const onAnswersChange = jest.fn<(answers: Answers) => void>();
		await renderWithProviders(<Questionnaire haptic={false} onAnswersChange={onAnswersChange} questions={[YES_NO]} />);
		await fireEvent(screen.getByRole("radio", { name: "No" }), "accessibilityTap");
		expect(screen.getByRole("radio", { name: "No" })).toBeSelected();
		expect(onAnswersChange).toHaveBeenLastCalledWith({ agree: { kind: "yesNo", value: "no" } });
	});

	test("defaultAnswers seed the control's state", async () => {
		await renderWithProviders(
			<Questionnaire
				defaultAnswers={{ plan: { kind: "single", value: "starter" } }}
				haptic={false}
				questions={[SINGLE]}
			/>
		);
		expect(screen.getByRole("radio", { name: "Starter" })).toBeChecked();
	});

	test("isReadOnly shows the answer and ignores a press", async () => {
		const onAnswersChange = jest.fn();
		await renderWithProviders(
			<Questionnaire
				defaultAnswers={{ plan: { kind: "single", value: "starter" } }}
				haptic={false}
				isReadOnly
				onAnswersChange={onAnswersChange}
				questions={[SINGLE]}
			/>
		);
		await fireEvent(screen.getByRole("radio", { name: "Pro" }), "accessibilityTap");
		expect(screen.getByRole("radio", { name: "Starter" })).toBeChecked();
		expect(onAnswersChange).not.toHaveBeenCalled();
	});

	test("isDisabled ignores a press on a control", async () => {
		const onAnswersChange = jest.fn();
		await renderWithProviders(
			<Questionnaire haptic={false} isDisabled onAnswersChange={onAnswersChange} questions={[SINGLE]} />
		);
		await fireEvent(screen.getByRole("radio", { name: "Pro" }), "accessibilityTap");
		expect(onAnswersChange).not.toHaveBeenCalled();
	});
});

describe("Questionnaire: the footer", () => {
	test("first question: Back and Submit are hidden, Skip is hidden on a required one, Next is present", async () => {
		await renderWithProviders(<Questionnaire haptic={false} questions={FLOW} />);
		expect(screen.getByRole("button", { name: "Next" })).toBeOnTheScreen();
		expect(screen.queryByRole("button", { name: "Back" })).not.toBeOnTheScreen();
		expect(screen.queryByRole("button", { name: "Skip this question" })).not.toBeOnTheScreen();
		expect(screen.queryByRole("button", { name: "Submit" })).not.toBeOnTheScreen();
	});

	test("Next is dimmed but not disabled while the answer would not pass, and says why", async () => {
		await renderWithProviders(<Questionnaire haptic={false} questions={FLOW} />);
		const next = screen.getByRole("button", { name: "Next" });
		expect(next).not.toBeDisabled();
		expect(next.props.accessibilityHint).toBe("Answer required");
		await fireEvent.changeText(screen.getByPlaceholderText("Your name"), "Ada");
		expect(screen.getByRole("button", { name: "Next" }).props.accessibilityHint).toBeUndefined();
	});

	test("a blocked Next shows the error, announces it and does not move", async () => {
		const spy = announce();
		const onCurrentChange = jest.fn();
		await renderWithProviders(<Questionnaire haptic={false} onCurrentChange={onCurrentChange} questions={FLOW} />);
		await fireEvent(screen.getByRole("button", { name: "Next" }), "accessibilityTap");
		expect(screen.getByText("Answer this question to continue.")).toBeOnTheScreen();
		expect(spy).toHaveBeenCalledWith("Answer this question to continue.");
		expect(onCurrentChange).not.toHaveBeenCalled();
		expect(screen.getByText("Your name?")).toBeOnTheScreen();
	});

	test("answering clears the error", async () => {
		await renderWithProviders(<Questionnaire haptic={false} questions={FLOW} />);
		await fireEvent(screen.getByRole("button", { name: "Next" }), "accessibilityTap");
		expect(screen.getByText("Answer this question to continue.")).toBeOnTheScreen();
		await fireEvent.changeText(screen.getByPlaceholderText("Your name"), "Ada");
		expect(screen.queryByText("Answer this question to continue.")).not.toBeOnTheScreen();
	});

	test("getErrorMessage words the error", async () => {
		await renderWithProviders(
			<Questionnaire getErrorMessage={(error) => `custom:${error.type}`} haptic={false} questions={FLOW} />
		);
		await fireEvent(screen.getByRole("button", { name: "Next" }), "accessibilityTap");
		expect(screen.getByText("custom:required")).toBeOnTheScreen();
	});

	test("a valid Next moves on, announces the new question and reports onCurrentChange", async () => {
		const onCurrentChange = jest.fn();
		await renderWithProviders(
			<Questionnaire
				defaultAnswers={{ name: { kind: "text", value: "Ada" } }}
				haptic={false}
				onCurrentChange={onCurrentChange}
				questions={FLOW}
			/>
		);
		const spy = announce();
		await fireEvent(screen.getByRole("button", { name: "Next" }), "accessibilityTap");
		expect(onCurrentChange).toHaveBeenCalledWith("agree");
		expect(screen.getByText("Do you agree?")).toBeOnTheScreen();
		expect(spy).toHaveBeenCalledWith("Question 2 of 3: Do you agree?");
	});

	test("the first question is not announced", async () => {
		const spy = announce();
		await renderWithProviders(<Questionnaire haptic={false} questions={FLOW} />);
		expect(spy).not.toHaveBeenCalled();
	});

	test("Back returns to the previous question and never validates", async () => {
		await renderWithProviders(
			<Questionnaire
				defaultAnswers={{ name: { kind: "text", value: "Ada" } }}
				defaultCurrentId="agree"
				haptic={false}
				questions={FLOW}
			/>
		);
		expect(screen.getByText("Do you agree?")).toBeOnTheScreen();
		await fireEvent(screen.getByRole("button", { name: "Back" }), "accessibilityTap");
		expect(screen.getByText("Your name?")).toBeOnTheScreen();
	});

	test("Skip appears on an optional question, records skipped and moves on", async () => {
		const onAnswersChange = jest.fn<(answers: Answers) => void>();
		await renderWithProviders(
			<Questionnaire
				defaultAnswers={{ name: { kind: "text", value: "Ada" } }}
				defaultCurrentId="agree"
				haptic={false}
				onAnswersChange={onAnswersChange}
				questions={FLOW}
			/>
		);
		await fireEvent(screen.getByRole("button", { name: "Skip this question" }), "accessibilityTap");
		expect(onAnswersChange).toHaveBeenLastCalledWith({
			agree: { kind: "skipped" },
			name: { kind: "text", value: "Ada" },
		});
		expect(screen.getByText("Which plan?")).toBeOnTheScreen();
	});

	test("on the last question Submit replaces Next", async () => {
		await renderWithProviders(<Questionnaire defaultCurrentId="plan" haptic={false} questions={FLOW} />);
		expect(screen.getByRole("button", { name: "Submit" })).toBeOnTheScreen();
		expect(screen.queryByRole("button", { name: "Next" })).not.toBeOnTheScreen();
	});

	test("Submit with an invalid answer does not call onSubmit and shows the error", async () => {
		const onSubmit = jest.fn<(answers: Answers) => void>();
		await renderWithProviders(
			<Questionnaire defaultCurrentId="plan" haptic={false} onSubmit={onSubmit} questions={[SINGLE]} />
		);
		await fireEvent(screen.getByRole("button", { name: "Submit" }), "accessibilityTap");
		expect(onSubmit).not.toHaveBeenCalled();
		expect(screen.getByText("Answer this question to continue.")).toBeOnTheScreen();
	});

	test("Submit with every answer valid calls onSubmit with the submission and hides the footer", async () => {
		const onSubmit = jest.fn<(answers: Answers) => void>();
		await renderWithProviders(
			<Questionnaire
				defaultAnswers={{ plan: { kind: "single", value: "pro" } }}
				haptic={false}
				onSubmit={onSubmit}
				questions={[SINGLE]}
			/>
		);
		await fireEvent(screen.getByRole("button", { name: "Submit" }), "accessibilityTap");
		expect(onSubmit).toHaveBeenCalledTimes(1);
		expect(onSubmit).toHaveBeenCalledWith({ plan: { kind: "single", value: "pro" } });
		expect(screen.queryByRole("button", { name: "Submit" })).not.toBeOnTheScreen();
	});

	test("a pending onSubmit promise marks Submit busy and holds the form inert", async () => {
		let resolve: () => void = () => undefined;
		const onSubmit = jest.fn(
			() =>
				new Promise<void>((done) => {
					resolve = done;
				})
		);
		await renderWithProviders(
			<Questionnaire
				defaultAnswers={{ plan: { kind: "single", value: "pro" } }}
				haptic={false}
				onSubmit={onSubmit}
				questions={[SINGLE]}
			/>
		);
		await fireEvent(screen.getByRole("button", { name: "Submit" }), "accessibilityTap");
		expect(screen.getByRole("button", { name: "Submit" })).toBeBusy();

		await fireEvent(screen.getByRole("button", { name: "Submit" }), "accessibilityTap");
		expect(onSubmit).toHaveBeenCalledTimes(1);

		await act(async () => {
			resolve();
		});
		expect(screen.queryByRole("button", { name: "Submit" })).not.toBeOnTheScreen();
	});

	test("isDisabled disables every footer button and swallows presses", async () => {
		const onCurrentChange = jest.fn();
		await renderWithProviders(
			<Questionnaire
				defaultAnswers={{ name: { kind: "text", value: "Ada" } }}
				haptic={false}
				isDisabled
				onCurrentChange={onCurrentChange}
				questions={FLOW}
			/>
		);
		const next = screen.getByRole("button", { name: "Next" });
		expect(next).toBeDisabled();
		await fireEvent(next, "accessibilityTap");
		expect(onCurrentChange).not.toHaveBeenCalled();
	});

	test("isReadOnly hides Skip and Submit but navigation still works", async () => {
		const view = await renderWithProviders(
			<Questionnaire
				defaultAnswers={{ name: { kind: "text", value: "Ada" } }}
				defaultCurrentId="agree"
				haptic={false}
				isReadOnly
				questions={FLOW}
			/>
		);
		expect(screen.queryByRole("button", { name: "Skip this question" })).not.toBeOnTheScreen();
		await fireEvent(screen.getByRole("button", { name: "Back" }), "accessibilityTap");
		expect(screen.getByText("Your name?")).toBeOnTheScreen();

		await view.rerender(<Questionnaire defaultCurrentId="plan" haptic={false} isReadOnly questions={FLOW} />);
		expect(screen.queryByRole("button", { name: "Submit" })).not.toBeOnTheScreen();
	});

	test("a caller's onPress runs after the questionnaire's action", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<Questionnaire defaultAnswers={{ name: { kind: "text", value: "Ada" } }} haptic={false} questions={FLOW}>
				<Questionnaire.Question />
				<Questionnaire.Footer>
					<Questionnaire.Next onPress={onPress}>Continue</Questionnaire.Next>
				</Questionnaire.Footer>
			</Questionnaire>
		);
		await fireEvent(screen.getByRole("button", { name: "Continue" }), "accessibilityTap");
		expect(onPress).toHaveBeenCalledTimes(1);
		expect(screen.getByText("Do you agree?")).toBeOnTheScreen();
	});
});

describe("Questionnaire: progress", () => {
	test("bar publishes 'Question n of total' as the progressbar value", async () => {
		await renderWithProviders(<Questionnaire haptic={false} questions={FLOW} />);
		const bar = screen.getByRole("progressbar");
		expect(bar).toHaveAccessibilityValue({ max: 3, min: 0, now: 1, text: "Question 1 of 3" });
	});

	test("bar follows the flow", async () => {
		await renderWithProviders(
			<Questionnaire defaultAnswers={{ name: { kind: "text", value: "Ada" } }} haptic={false} questions={FLOW} />
		);
		await fireEvent(screen.getByRole("button", { name: "Next" }), "accessibilityTap");
		expect(screen.getByRole("progressbar")).toHaveAccessibilityValue({ now: 2, text: "Question 2 of 3" });
	});

	test("steps is one progressbar element named with the count", async () => {
		await renderWithProviders(
			<Questionnaire haptic={false} questions={FLOW}>
				<Questionnaire.Progress variant="steps" />
				<Questionnaire.Question />
			</Questionnaire>
		);
		const bar = screen.getByRole("progressbar", { name: "Question 1 of 3" });
		expect(bar).toHaveAccessibilityValue({ max: 3, min: 1, now: 1 });
	});

	test("count reads the label as text", async () => {
		await renderWithProviders(
			<Questionnaire haptic={false} questions={FLOW}>
				<Questionnaire.Progress variant="count" />
				<Questionnaire.Question />
			</Questionnaire>
		);
		expect(screen.getByText("Question 1 of 3")).toBeOnTheScreen();
	});

	test("a hidden question is not counted", async () => {
		const questions: readonly Question[] = [
			YES_NO,
			{ ...TEXT, isRequired: false, showIf: { questionId: "agree", type: "equals", value: "yes" } },
		];
		await renderWithProviders(<Questionnaire haptic={false} questions={questions} />);
		expect(screen.getByRole("progressbar")).toHaveAccessibilityValue({ max: 1 });
	});
});

describe("Questionnaire: controlled and uncontrolled", () => {
	test("uncontrolled currentId: defaultCurrentId seeds it and Next moves it", async () => {
		await renderWithProviders(
			<Questionnaire
				defaultAnswers={{ name: { kind: "text", value: "Ada" } }}
				defaultCurrentId="name"
				haptic={false}
				questions={FLOW}
			/>
		);
		await fireEvent(screen.getByRole("button", { name: "Next" }), "accessibilityTap");
		expect(screen.getByText("Do you agree?")).toBeOnTheScreen();
	});

	test("controlled answers: the prop drives the tree and a sync is not reported back", async () => {
		const onAnswersChange = jest.fn();
		const view = await renderWithProviders(
			<Questionnaire answers={{}} haptic={false} onAnswersChange={onAnswersChange} questions={[SINGLE]} />
		);
		expect(screen.getByRole("radio", { name: "Pro" })).not.toBeChecked();
		onAnswersChange.mockClear();

		await view.rerender(
			<Questionnaire
				answers={{ plan: { kind: "single", value: "pro" } }}
				haptic={false}
				onAnswersChange={onAnswersChange}
				questions={[SINGLE]}
			/>
		);
		expect(screen.getByRole("radio", { name: "Pro" })).toBeChecked();
		expect(onAnswersChange).not.toHaveBeenCalled();
	});

	test("controlled currentId: the prop moves the flow without echoing onCurrentChange", async () => {
		const onCurrentChange = jest.fn();
		const view = await renderWithProviders(
			<Questionnaire currentId="name" haptic={false} onCurrentChange={onCurrentChange} questions={FLOW} />
		);
		expect(screen.getByText("Your name?")).toBeOnTheScreen();

		await view.rerender(
			<Questionnaire currentId="agree" haptic={false} onCurrentChange={onCurrentChange} questions={FLOW} />
		);
		expect(screen.getByText("Do you agree?")).toBeOnTheScreen();
		expect(onCurrentChange).not.toHaveBeenCalled();
	});
});

describe("Questionnaire: parts outside the root", () => {
	const parts = [
		["Questionnaire.Title", <Questionnaire.Title key="t">T</Questionnaire.Title>],
		["Questionnaire.Progress", <Questionnaire.Progress key="p" />],
		["Questionnaire.Question", <Questionnaire.Question key="q" />],
		["Questionnaire.Footer", <Questionnaire.Footer key="f" />],
		["Questionnaire.Back", <Questionnaire.Back key="b" />],
		["Questionnaire.Next", <Questionnaire.Next key="n" />],
		["Questionnaire.Skip", <Questionnaire.Skip key="s" />],
		["Questionnaire.Submit", <Questionnaire.Submit key="u" />],
	] as const;

	test.each(parts)("%s throws its documented error", async (name, element) => {
		const original = console.error;
		console.error = () => undefined;
		try {
			await expect(renderWithProviders(element)).rejects.toThrow(`${name} must be rendered inside a <Questionnaire>.`);
		} finally {
			console.error = original;
		}
	});
});
