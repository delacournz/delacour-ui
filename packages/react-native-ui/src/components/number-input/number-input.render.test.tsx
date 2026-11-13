import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { useState } from "react";
import { AccessibilityInfo, Platform } from "react-native";
import { resetAnnouncer } from "../../hooks/use-announce";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Field } from "../field";
import { NumberInput } from "./number-input";
import type { NumberInputValue } from "./number-input.format";

const FIELD = "Quantity";

const originalOS = Platform.OS;
function setPlatform(os: typeof Platform.OS) {
	Object.defineProperty(Platform, "OS", { configurable: true, get: () => os });
}

function adjust(name: "increment" | "decrement") {
	return fireEvent(screen.getByRole("adjustable"), "accessibilityAction", { nativeEvent: { actionName: name } });
}

function pressStepper(label: "Increase" | "Decrease") {
	return fireEvent(screen.getByRole("button", { name: label }), "accessibilityAction", {
		nativeEvent: { actionName: "activate" },
	});
}

function ControlledNumberInput({ onValueChange }: { onValueChange: (value: NumberInputValue) => void }) {
	const [value, setValue] = useState<NumberInputValue>(1);
	return (
		<NumberInput
			accessibilityLabel={FIELD}
			onValueChange={(next) => {
				setValue(next);
				onValueChange(next);
			}}
			value={value}
		/>
	);
}

describe("NumberInput", () => {
	test("is an adjustable field with Decrease and Increase buttons", async () => {
		await renderWithProviders(<NumberInput accessibilityLabel={FIELD} defaultValue={3} />);
		expect(screen.getByRole("adjustable", { name: FIELD })).toBeOnTheScreen();
		expect(screen.getByRole("button", { name: "Decrease" })).toBeOnTheScreen();
		expect(screen.getByRole("button", { name: "Increase" })).toBeOnTheScreen();
	});

	test("accessibilityValue carries now, text, min and max", async () => {
		await renderWithProviders(<NumberInput accessibilityLabel={FIELD} defaultValue={3} max={10} min={1} />);
		expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ max: 10, min: 1, now: 3, text: "3" });
	});

	test("accessibilityValue omits now when empty and bounds when infinite", async () => {
		await renderWithProviders(<NumberInput accessibilityLabel={FIELD} />);
		const value = screen.getByRole("adjustable").props.accessibilityValue as Record<string, unknown>;
		expect(value.now).toBeUndefined();
		expect(value.min).toBeUndefined();
		expect(value.max).toBeUndefined();
	});

	test("the field shows the formatted value", async () => {
		await renderWithProviders(<NumberInput accessibilityLabel={FIELD} defaultValue={1234} />);
		expect(screen.getByRole("adjustable")).toHaveDisplayValue("1,234");
	});

	describe("stepping", () => {
		test("uncontrolled: defaultValue seeds it and the increment action steps by step", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<NumberInput accessibilityLabel={FIELD} defaultValue={2} onValueChange={onValueChange} step={2} />
			);
			expect(screen.getByRole("adjustable")).toHaveDisplayValue("2");

			await adjust("increment");
			expect(onValueChange).toHaveBeenLastCalledWith(4);
			expect(screen.getByRole("adjustable")).toHaveDisplayValue("4");

			await adjust("decrement");
			expect(onValueChange).toHaveBeenLastCalledWith(2);
			expect(screen.getByRole("adjustable")).toHaveDisplayValue("2");
		});

		test("the stepper buttons step through their activate action", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<NumberInput accessibilityLabel={FIELD} defaultValue={5} onValueChange={onValueChange} />
			);
			await pressStepper("Increase");
			expect(onValueChange).toHaveBeenLastCalledWith(6);
			await pressStepper("Decrease");
			await pressStepper("Decrease");
			expect(onValueChange).toHaveBeenLastCalledWith(4);
			expect(screen.getByRole("adjustable")).toHaveDisplayValue("4");
		});

		test("an empty value steps to the nearest in-range number", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(<NumberInput accessibilityLabel={FIELD} min={1} onValueChange={onValueChange} />);
			await adjust("increment");
			expect(onValueChange).toHaveBeenLastCalledWith(1);
		});

		test("stepping clamps at max: the increment button disables and nothing fires past it", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<NumberInput accessibilityLabel={FIELD} defaultValue={9} max={10} onValueChange={onValueChange} />
			);
			await pressStepper("Increase");
			expect(onValueChange).toHaveBeenCalledTimes(1);
			expect(onValueChange).toHaveBeenLastCalledWith(10);
			expect(screen.getByRole("button", { name: "Increase" })).toBeDisabled();
			expect(screen.getByRole("button", { name: "Decrease" })).not.toBeDisabled();

			await pressStepper("Increase");
			await adjust("increment");
			expect(onValueChange).toHaveBeenCalledTimes(1);
			expect(screen.getByRole("adjustable")).toHaveDisplayValue("10");
		});

		test("stepping clamps at min: the decrement button disables and nothing fires below it", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<NumberInput accessibilityLabel={FIELD} defaultValue={2} min={1} onValueChange={onValueChange} />
			);
			await adjust("decrement");
			expect(onValueChange).toHaveBeenLastCalledWith(1);
			expect(screen.getByRole("button", { name: "Decrease" })).toBeDisabled();

			await pressStepper("Decrease");
			await adjust("decrement");
			expect(onValueChange).toHaveBeenCalledTimes(1);
			expect(screen.getByRole("adjustable")).toHaveDisplayValue("1");
		});

		test("a max off the step grid is never reached", async () => {
			await renderWithProviders(<NumberInput accessibilityLabel={FIELD} defaultValue={6} max={10} step={3} />);
			await adjust("increment");
			expect(screen.getByRole("adjustable")).toHaveDisplayValue("9");
			expect(screen.getByRole("button", { name: "Increase" })).toBeDisabled();
		});

		test("decimal steps land on the grid", async () => {
			await renderWithProviders(<NumberInput accessibilityLabel={FIELD} defaultValue={0.1} step={0.1} />);
			await adjust("increment");
			await adjust("increment");
			expect(screen.getByRole("adjustable")).toHaveDisplayValue("0.3");
		});
	});

	describe("controlled", () => {
		test("reports the change and waits for the prop", async () => {
			const onValueChange = jest.fn();
			const view = await renderWithProviders(
				<NumberInput accessibilityLabel={FIELD} onValueChange={onValueChange} value={1} />
			);
			await adjust("increment");
			expect(onValueChange).toHaveBeenCalledWith(2);
			expect(screen.getByRole("adjustable")).toHaveDisplayValue("1");

			await view.rerender(<NumberInput accessibilityLabel={FIELD} onValueChange={onValueChange} value={2} />);
			expect(screen.getByRole("adjustable")).toHaveDisplayValue("2");
		});

		test("a stateful parent follows each step", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(<ControlledNumberInput onValueChange={onValueChange} />);
			await pressStepper("Increase");
			await pressStepper("Increase");
			expect(onValueChange).toHaveBeenCalledTimes(2);
			expect(screen.getByRole("adjustable")).toHaveDisplayValue("3");
		});
	});

	describe("typing", () => {
		test("a typed value commits on blur, not per keystroke", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<NumberInput accessibilityLabel={FIELD} defaultValue={1} max={100} onValueChange={onValueChange} />
			);
			const field = screen.getByRole("adjustable");
			await fireEvent(field, "focus");
			await fireEvent.changeText(field, "1");
			await fireEvent.changeText(field, "15");
			expect(onValueChange).not.toHaveBeenCalled();
			expect(screen.getByRole("adjustable")).toHaveDisplayValue("15");

			await fireEvent(screen.getByRole("adjustable"), "blur");
			expect(onValueChange).toHaveBeenCalledTimes(1);
			expect(onValueChange).toHaveBeenLastCalledWith(15);
		});

		test("submitting commits the draft", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<NumberInput accessibilityLabel={FIELD} defaultValue={1} onValueChange={onValueChange} />
			);
			const field = screen.getByRole("adjustable");
			await fireEvent(field, "focus");
			await fireEvent.changeText(field, "7");
			await fireEvent(screen.getByRole("adjustable"), "submitEditing");
			expect(onValueChange).toHaveBeenLastCalledWith(7);
		});

		test("an out-of-range entry clamps on commit", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<NumberInput accessibilityLabel={FIELD} defaultValue={5} max={10} onValueChange={onValueChange} />
			);
			const field = screen.getByRole("adjustable");
			await fireEvent(field, "focus");
			await fireEvent.changeText(field, "99");
			await fireEvent(screen.getByRole("adjustable"), "blur");
			expect(onValueChange).toHaveBeenLastCalledWith(10);
			expect(screen.getByRole("adjustable")).toHaveDisplayValue("10");
		});

		test("clearing the field commits null", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<NumberInput accessibilityLabel={FIELD} defaultValue={5} onValueChange={onValueChange} />
			);
			const field = screen.getByRole("adjustable");
			await fireEvent(field, "focus");
			await fireEvent.changeText(field, "");
			await fireEvent(screen.getByRole("adjustable"), "blur");
			expect(onValueChange).toHaveBeenLastCalledWith(null);
		});

		test("blurring without typing fires nothing", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<NumberInput accessibilityLabel={FIELD} defaultValue={5} onValueChange={onValueChange} />
			);
			await fireEvent(screen.getByRole("adjustable"), "focus");
			await fireEvent(screen.getByRole("adjustable"), "blur");
			expect(onValueChange).not.toHaveBeenCalled();
		});

		test("letters are stripped from the draft", async () => {
			await renderWithProviders(<NumberInput accessibilityLabel={FIELD} defaultValue={5} />);
			const field = screen.getByRole("adjustable");
			await fireEvent(field, "focus");
			await fireEvent.changeText(field, "1a2");
			expect(screen.getByRole("adjustable")).toHaveDisplayValue("12");
		});

		test("commitMode validate keeps an out-of-range number", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<NumberInput
					accessibilityLabel={FIELD}
					commitMode="validate"
					defaultValue={5}
					max={10}
					onValueChange={onValueChange}
				/>
			);
			const field = screen.getByRole("adjustable");
			await fireEvent(field, "focus");
			await fireEvent.changeText(field, "99");
			await fireEvent(screen.getByRole("adjustable"), "blur");
			expect(onValueChange).toHaveBeenLastCalledWith(99);
		});

		test("a stepper press commits the typed draft first, then steps from it", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<NumberInput accessibilityLabel={FIELD} defaultValue={1} max={100} onValueChange={onValueChange} />
			);
			const field = screen.getByRole("adjustable");
			await fireEvent(field, "focus");
			await fireEvent.changeText(field, "15");
			await pressStepper("Increase");
			expect(onValueChange).toHaveBeenLastCalledWith(16);
		});

		test("isEditable={false} blocks typing but not the steppers", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<NumberInput accessibilityLabel={FIELD} defaultValue={1} isEditable={false} onValueChange={onValueChange} />
			);
			expect(screen.getByRole("adjustable").props.editable).toBe(false);
			await pressStepper("Increase");
			expect(onValueChange).toHaveBeenLastCalledWith(2);
		});
	});

	describe.each([
		["isDisabled", { isDisabled: true }],
		["isReadOnly", { isReadOnly: true }],
	] as const)("%s", (_name, flag) => {
		test("both steppers are announced disabled and ignore activation", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<NumberInput accessibilityLabel={FIELD} defaultValue={5} onValueChange={onValueChange} {...flag} />
			);
			expect(screen.getByRole("button", { name: "Increase" })).toBeDisabled();
			expect(screen.getByRole("button", { name: "Decrease" })).toBeDisabled();
			await pressStepper("Increase");
			await pressStepper("Decrease");
			expect(onValueChange).not.toHaveBeenCalled();
			expect(screen.getByRole("adjustable")).toHaveDisplayValue("5");
		});

		test("the increment and decrement accessibility actions do nothing", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<NumberInput accessibilityLabel={FIELD} defaultValue={5} onValueChange={onValueChange} {...flag} />
			);
			await adjust("increment");
			await adjust("decrement");
			expect(onValueChange).not.toHaveBeenCalled();
			expect(screen.getByRole("adjustable")).toHaveDisplayValue("5");
		});

		test("the field takes no typing", async () => {
			await renderWithProviders(<NumberInput accessibilityLabel={FIELD} defaultValue={5} {...flag} />);
			expect(screen.getByRole("adjustable").props.editable).toBe(false);
		});

		test("a Field label press does not focus it", async () => {
			const focus = jest.fn();
			await renderWithProviders(
				<Field testID="row">
					<Field.Label>{FIELD}</Field.Label>
					<NumberInput
						defaultValue={5}
						inputProps={{
							ref: (node) => {
								if (node) node.focus = focus;
							},
						}}
						{...flag}
					/>
				</Field>
			);
			expect(screen.getByTestId("row")).not.toHaveProp("onAccessibilityTap");
			expect(focus).not.toHaveBeenCalled();
		});
	});

	describe("inside a Field", () => {
		test("the Field.Label text becomes the accessible name", async () => {
			await renderWithProviders(
				<Field>
					<Field.Label>Guests</Field.Label>
					<NumberInput defaultValue={2} />
				</Field>
			);
			expect(await screen.findByRole("adjustable", { name: "Guests" })).toBeOnTheScreen();
		});

		test("pressing the label focuses the field", async () => {
			const focus = jest.fn();
			await renderWithProviders(
				<Field testID="row">
					<Field.Label>Guests</Field.Label>
					<NumberInput
						defaultValue={2}
						inputProps={{
							ref: (node) => {
								if (node) node.focus = focus;
							},
						}}
					/>
				</Field>
			);
			await fireEvent(screen.getByTestId("row"), "accessibilityTap");
			expect(focus).toHaveBeenCalledTimes(1);
		});

		test("a disabled Field disables the steppers and the field", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<Field isDisabled>
					<Field.Label>Seats</Field.Label>
					<NumberInput defaultValue={4} onValueChange={onValueChange} />
				</Field>
			);
			expect(screen.getByRole("button", { name: "Increase" })).toBeDisabled();
			await pressStepper("Increase");
			await adjust("increment");
			expect(onValueChange).not.toHaveBeenCalled();
		});
	});

	describe("parts outside a NumberInput", () => {
		let original: typeof console.error;
		beforeEach(() => {
			original = console.error;
			console.error = () => {};
		});
		afterEach(() => {
			console.error = original;
		});

		test("Field throws", async () => {
			await expect(renderWithProviders(<NumberInput.Field />)).rejects.toThrow(
				"NumberInput.Field must be rendered inside a <NumberInput>."
			);
		});

		test("Decrement throws", async () => {
			await expect(renderWithProviders(<NumberInput.Decrement />)).rejects.toThrow(
				"NumberInput.Decrement must be rendered inside a <NumberInput>."
			);
		});

		test("Increment throws", async () => {
			await expect(renderWithProviders(<NumberInput.Increment />)).rejects.toThrow(
				"NumberInput.Increment must be rendered inside a <NumberInput>."
			);
		});
	});

	describe("invalid props", () => {
		let original: typeof console.error;
		beforeEach(() => {
			original = console.error;
			console.error = () => {};
		});
		afterEach(() => {
			console.error = original;
		});

		test("a step of zero throws", async () => {
			await expect(renderWithProviders(<NumberInput accessibilityLabel={FIELD} step={0} />)).rejects.toThrow(
				"step must be greater than 0"
			);
		});
	});
});

describe("NumberInput announcements", () => {
	let spoken: jest.SpiedFunction<typeof AccessibilityInfo.announceForAccessibilityWithOptions>;

	beforeEach(() => {
		resetAnnouncer();
		setPlatform("ios");
		jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => {});
		spoken = jest.spyOn(AccessibilityInfo, "announceForAccessibilityWithOptions").mockImplementation(() => {});
		spoken.mockClear();
	});

	afterEach(() => {
		setPlatform(originalOS);
		jest.restoreAllMocks();
	});

	test("a stepper activation speaks the formatted value", async () => {
		await renderWithProviders(<NumberInput accessibilityLabel={FIELD} defaultValue={1233} />);
		await pressStepper("Increase");
		expect(spoken).toHaveBeenCalledTimes(1);
		expect(spoken).toHaveBeenCalledWith("1,234", { queue: true });
	});

	test("reaching a bound names it", async () => {
		await renderWithProviders(<NumberInput accessibilityLabel={FIELD} defaultValue={9} max={10} />);
		await pressStepper("Increase");
		expect(spoken).toHaveBeenLastCalledWith("10, maximum", { queue: true });
	});

	test("a burst of steps is heard as its first and last value", async () => {
		jest.useFakeTimers();
		try {
			await renderWithProviders(<NumberInput accessibilityLabel={FIELD} defaultValue={0} />);
			await pressStepper("Increase");
			await pressStepper("Increase");
			await pressStepper("Increase");
			expect(spoken).toHaveBeenCalledTimes(1);
			await jest.advanceTimersByTimeAsync(600);
			expect(spoken.mock.calls.map(([message]) => message)).toEqual(["1", "3"]);
		} finally {
			jest.useRealTimers();
		}
	});

	test("the field's own adjustable actions are not announced", async () => {
		await renderWithProviders(<NumberInput accessibilityLabel={FIELD} defaultValue={2} />);
		await adjust("increment");
		expect(spoken).not.toHaveBeenCalled();
	});

	test("a controlled value change is not announced", async () => {
		const { rerender } = await renderWithProviders(<NumberInput accessibilityLabel={FIELD} value={1} />);
		await rerender(<NumberInput accessibilityLabel={FIELD} value={5} />);
		expect(spoken).not.toHaveBeenCalled();
	});

	test("announce={false} is silent", async () => {
		await renderWithProviders(<NumberInput accessibilityLabel={FIELD} announce={false} defaultValue={1} />);
		await pressStepper("Increase");
		expect(spoken).not.toHaveBeenCalled();
	});

	test("Android speaks through announceForAccessibility", async () => {
		setPlatform("android");
		const android = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => {});
		android.mockClear();
		await renderWithProviders(<NumberInput accessibilityLabel={FIELD} defaultValue={1} />);
		await pressStepper("Increase");
		expect(android).toHaveBeenCalledWith("2");
	});
});
