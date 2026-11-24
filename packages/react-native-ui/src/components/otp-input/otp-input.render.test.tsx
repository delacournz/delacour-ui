import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { act, createRef } from "react";
import { TextInput } from "react-native";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Field } from "../field";
import { OtpInput, type OtpInputRef } from "./otp-input";

const tap = (element: Parameters<typeof fireEvent>[0]) => fireEvent(element, "accessibilityTap");

describe("OtpInput", () => {
	test("is one text field named by its accessibilityLabel, defaulting to Verification code", async () => {
		await renderWithProviders(<OtpInput accessibilityLabel="Login code" />);
		expect(screen.getByLabelText("Login code")).toBeOnTheScreen();
		await screen.unmount();

		await renderWithProviders(<OtpInput />);
		expect(screen.getByLabelText("Verification code")).toBeOnTheScreen();
	});

	test("announces how to fill it and how much is entered", async () => {
		await renderWithProviders(<OtpInput length={4} testID="otp" />);
		const field = screen.getByTestId("otp");
		expect(field.props.accessibilityHint).toBe("Enter the 4 digit code");
		expect(field.props.accessibilityValue).toEqual({ text: "0 of 4 digits entered" });

		await fireEvent.changeText(field, "12");
		expect(screen.getByTestId("otp").props.accessibilityValue).toEqual({ text: "1 2" });
	});

	test("a masked field announces a count, never the digits", async () => {
		await renderWithProviders(<OtpInput defaultValue="123" isMasked length={4} testID="otp" />);
		expect(screen.getByTestId("otp").props.accessibilityValue).toEqual({ text: "3 of 4 digits entered" });
	});

	test("draws one cell per length, filled with the typed characters", async () => {
		await renderWithProviders(<OtpInput length={4} testID="otp" />);
		await fireEvent.changeText(screen.getByTestId("otp"), "12");
		expect(screen.getByText("1", { includeHiddenElements: true })).toBeOnTheScreen();
		expect(screen.getByText("2", { includeHiddenElements: true })).toBeOnTheScreen();
		expect(screen.queryByText("3", { includeHiddenElements: true })).not.toBeOnTheScreen();
	});

	test("a masked cell draws the mask instead of the character", async () => {
		await renderWithProviders(<OtpInput defaultValue="12" isMasked length={4} />);
		expect(screen.getAllByText("•", { includeHiddenElements: true })).toHaveLength(2);
		expect(screen.queryByText("1", { includeHiddenElements: true })).not.toBeOnTheScreen();
	});

	test("an empty cell draws the placeholder", async () => {
		await renderWithProviders(<OtpInput length={4} placeholder="○" />);
		expect(screen.getAllByText("○", { includeHiddenElements: true })).toHaveLength(4);
	});

	test("the drawn row is hidden from assistive technology", async () => {
		await renderWithProviders(<OtpInput defaultValue="12" length={4} />);
		expect(screen.queryByText("1")).not.toBeOnTheScreen();
		expect(screen.getByLabelText("Verification code")).toBeOnTheScreen();
	});

	describe("typing", () => {
		test("uncontrolled: defaultValue seeds it and typing reports each change", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(<OtpInput defaultValue="12" onValueChange={onValueChange} testID="otp" />);
			expect(screen.getByTestId("otp")).toHaveDisplayValue("12");

			await fireEvent.changeText(screen.getByTestId("otp"), "123");
			expect(onValueChange).toHaveBeenLastCalledWith("123");
			expect(screen.getByTestId("otp")).toHaveDisplayValue("123");
		});

		test("the default value is sanitised like anything typed", async () => {
			await renderWithProviders(<OtpInput defaultValue="1a2b3" length={4} testID="otp" />);
			expect(screen.getByTestId("otp")).toHaveDisplayValue("123");
		});

		test("characters the pattern rejects are dropped", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(<OtpInput onValueChange={onValueChange} testID="otp" />);
			await fireEvent.changeText(screen.getByTestId("otp"), "1a2 b3");
			expect(onValueChange).toHaveBeenLastCalledWith("123");
			expect(screen.getByTestId("otp")).toHaveDisplayValue("123");
		});

		test("alphanumeric accepts letters, uppercased", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(<OtpInput onValueChange={onValueChange} pattern="alphanumeric" testID="otp" />);
			await fireEvent.changeText(screen.getByTestId("otp"), "a1b-2");
			expect(onValueChange).toHaveBeenLastCalledWith("A1B2");
		});

		test("a RegExp pattern tests one (uppercased) character at a time", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(<OtpInput onValueChange={onValueChange} pattern={/[A-F]/} testID="otp" />);
			await fireEvent.changeText(screen.getByTestId("otp"), "abxz");
			expect(onValueChange).toHaveBeenLastCalledWith("AB");
		});

		test("input longer than length is cut to length", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(<OtpInput length={4} onValueChange={onValueChange} testID="otp" />);
			await fireEvent.changeText(screen.getByTestId("otp"), "123456");
			expect(onValueChange).toHaveBeenLastCalledWith("1234");
			expect(screen.getByTestId("otp")).toHaveDisplayValue("1234");
		});

		test("a change that sanitises to the current value reports nothing", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(<OtpInput defaultValue="12" onValueChange={onValueChange} testID="otp" />);
			await fireEvent.changeText(screen.getByTestId("otp"), "12x");
			expect(onValueChange).not.toHaveBeenCalled();
		});

		test("length is clamped to 1..12", async () => {
			await renderWithProviders(<OtpInput length={99} testID="otp" />);
			await fireEvent.changeText(screen.getByTestId("otp"), "1234567890123456");
			expect(screen.getByTestId("otp")).toHaveDisplayValue("123456789012");
		});

		test("controlled: reports the change and waits for the prop", async () => {
			const onValueChange = jest.fn();
			const view = await renderWithProviders(<OtpInput onValueChange={onValueChange} testID="otp" value="12" />);
			await fireEvent.changeText(screen.getByTestId("otp"), "123");
			expect(onValueChange).toHaveBeenCalledWith("123");
			expect(screen.getByTestId("otp")).toHaveDisplayValue("12");

			await view.rerender(<OtpInput onValueChange={onValueChange} testID="otp" value="123" />);
			expect(screen.getByTestId("otp")).toHaveDisplayValue("123");
		});

		test("a controlled value longer than length is drawn cut to length", async () => {
			await renderWithProviders(<OtpInput length={4} testID="otp" value="1234567" />);
			expect(screen.getByTestId("otp")).toHaveDisplayValue("1234");
		});
	});

	describe("onComplete", () => {
		test("fires once with the code when the last cell fills", async () => {
			const onComplete = jest.fn();
			await renderWithProviders(<OtpInput haptic={false} length={4} onComplete={onComplete} testID="otp" />);
			await fireEvent.changeText(screen.getByTestId("otp"), "123");
			expect(onComplete).not.toHaveBeenCalled();

			await fireEvent.changeText(screen.getByTestId("otp"), "1234");
			expect(onComplete).toHaveBeenCalledTimes(1);
			expect(onComplete).toHaveBeenCalledWith("1234");
		});

		test("a paste of a whole code completes it once", async () => {
			const onComplete = jest.fn();
			await renderWithProviders(<OtpInput haptic={false} length={4} onComplete={onComplete} testID="otp" />);
			await fireEvent.changeText(screen.getByTestId("otp"), "1234");
			expect(onComplete).toHaveBeenCalledTimes(1);
		});

		test("more input after a full code does not fire it again", async () => {
			const onComplete = jest.fn();
			await renderWithProviders(<OtpInput haptic={false} length={4} onComplete={onComplete} testID="otp" />);
			await fireEvent.changeText(screen.getByTestId("otp"), "1234");
			await fireEvent.changeText(screen.getByTestId("otp"), "12345");
			expect(onComplete).toHaveBeenCalledTimes(1);
		});

		test("deleting a character re-arms it", async () => {
			const onComplete = jest.fn();
			await renderWithProviders(<OtpInput haptic={false} length={4} onComplete={onComplete} testID="otp" />);
			await fireEvent.changeText(screen.getByTestId("otp"), "1234");
			await fireEvent.changeText(screen.getByTestId("otp"), "123");
			await fireEvent.changeText(screen.getByTestId("otp"), "1239");
			expect(onComplete).toHaveBeenCalledTimes(2);
			expect(onComplete).toHaveBeenLastCalledWith("1239");
		});

		test("a defaultValue that is already full does not fire it", async () => {
			const onComplete = jest.fn();
			await renderWithProviders(<OtpInput defaultValue="1234" haptic={false} length={4} onComplete={onComplete} />);
			expect(onComplete).not.toHaveBeenCalled();
		});

		test("still reports through onValueChange when it completes", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(<OtpInput haptic={false} length={4} onValueChange={onValueChange} testID="otp" />);
			await fireEvent.changeText(screen.getByTestId("otp"), "1234");
			expect(onValueChange).toHaveBeenLastCalledWith("1234");
		});

		test("with the default haptic it still completes", async () => {
			const onComplete = jest.fn();
			await renderWithProviders(<OtpInput length={4} onComplete={onComplete} testID="otp" />);
			await fireEvent.changeText(screen.getByTestId("otp"), "1234");
			expect(onComplete).toHaveBeenCalledWith("1234");
		});
	});

	describe("ref", () => {
		test("clear empties the code and reports an empty string", async () => {
			const ref = createRef<OtpInputRef>();
			const onValueChange = jest.fn();
			await renderWithProviders(<OtpInput defaultValue="12" onValueChange={onValueChange} ref={ref} testID="otp" />);
			await act(async () => ref.current?.clear());
			expect(onValueChange).toHaveBeenLastCalledWith("");
			expect(screen.getByTestId("otp")).toHaveDisplayValue("");
		});

		test("clear re-arms onComplete", async () => {
			const ref = createRef<OtpInputRef>();
			const onComplete = jest.fn();
			await renderWithProviders(<OtpInput haptic={false} length={2} onComplete={onComplete} ref={ref} testID="otp" />);
			await fireEvent.changeText(screen.getByTestId("otp"), "12");
			await act(async () => ref.current?.clear());
			await fireEvent.changeText(screen.getByTestId("otp"), "34");
			expect(onComplete).toHaveBeenCalledTimes(2);
			expect(onComplete).toHaveBeenLastCalledWith("34");
		});

		test("clear on an empty field reports nothing", async () => {
			const ref = createRef<OtpInputRef>();
			const onValueChange = jest.fn();
			await renderWithProviders(<OtpInput onValueChange={onValueChange} ref={ref} />);
			await act(async () => ref.current?.clear());
			expect(onValueChange).not.toHaveBeenCalled();
		});
	});

	describe("focus", () => {
		test("onFocus and onBlur receive the event", async () => {
			const onFocus = jest.fn();
			const onBlur = jest.fn();
			await renderWithProviders(<OtpInput onBlur={onBlur} onFocus={onFocus} testID="otp" />);
			await fireEvent(screen.getByTestId("otp"), "focus");
			expect(onFocus).toHaveBeenCalledTimes(1);
			await fireEvent(screen.getByTestId("otp"), "blur");
			expect(onBlur).toHaveBeenCalledTimes(1);
		});

		test("onSubmitEditing is passed through", async () => {
			const onSubmitEditing = jest.fn();
			await renderWithProviders(<OtpInput onSubmitEditing={onSubmitEditing} testID="otp" />);
			await fireEvent(screen.getByTestId("otp"), "submitEditing");
			expect(onSubmitEditing).toHaveBeenCalledTimes(1);
		});
	});

	describe("state", () => {
		test("isDisabled is announced, not editable, and ignores typing", async () => {
			const onValueChange = jest.fn();
			const onComplete = jest.fn();
			await renderWithProviders(
				<OtpInput isDisabled length={2} onComplete={onComplete} onValueChange={onValueChange} testID="otp" />
			);
			const field = screen.getByTestId("otp");
			expect(field).toBeDisabled();
			expect(field.props.editable).toBe(false);

			await fireEvent.changeText(field, "12");
			expect(onValueChange).not.toHaveBeenCalled();
			expect(onComplete).not.toHaveBeenCalled();
			expect(screen.getByTestId("otp")).toHaveDisplayValue("");
		});

		test("isReadOnly keeps it readable but not editable", async () => {
			await renderWithProviders(<OtpInput defaultValue="12" isReadOnly testID="otp" />);
			const field = screen.getByTestId("otp");
			expect(field).not.toBeDisabled();
			expect(field.props.readOnly).toBe(true);
			expect(screen.getByTestId("otp")).toHaveDisplayValue("12");
		});

		test("an enabled field is editable", async () => {
			await renderWithProviders(<OtpInput testID="otp" />);
			expect(screen.getByTestId("otp")).not.toBeDisabled();
			expect(screen.getByTestId("otp").props.editable).toBe(true);
		});

		test("pattern picks the keyboard", async () => {
			await renderWithProviders(<OtpInput testID="digits" />);
			expect(screen.getByTestId("digits").props.keyboardType).toBe("number-pad");
			await renderWithProviders(<OtpInput pattern="alphanumeric" testID="alnum" />);
			expect(screen.getByTestId("alnum").props.keyboardType).not.toBe("number-pad");
		});

		test("isMasked does not make the native field secure, so autofill still works", async () => {
			await renderWithProviders(<OtpInput isMasked testID="otp" />);
			expect(screen.getByTestId("otp").props.secureTextEntry).toBeUndefined();
			expect(screen.getByTestId("otp").props.textContentType).toBe("oneTimeCode");
		});
	});

	describe("inside a Field", () => {
		afterEach(() => {
			jest.restoreAllMocks();
		});

		test("the Field.Label text becomes the accessible name", async () => {
			await renderWithProviders(
				<Field>
					<Field.Label>Sign-in code</Field.Label>
					<OtpInput />
				</Field>
			);
			expect(await screen.findByLabelText("Sign-in code")).toBeOnTheScreen();
		});

		test("an own accessibilityLabel beats the Field.Label", async () => {
			await renderWithProviders(
				<Field>
					<Field.Label>Sign-in code</Field.Label>
					<OtpInput accessibilityLabel="SMS code" />
				</Field>
			);
			expect(await screen.findByLabelText("SMS code")).toBeOnTheScreen();
		});

		test("a disabled Field disables it, and an own isDisabled={false} opts out", async () => {
			await renderWithProviders(
				<Field isDisabled>
					<OtpInput testID="a" />
					<OtpInput isDisabled={false} testID="b" />
				</Field>
			);
			expect(screen.getByTestId("a").props.editable).toBe(false);
			expect(screen.getByTestId("b").props.editable).toBe(true);
		});

		test("a press on the Field's row focuses the field", async () => {
			const focus = jest.spyOn(TextInput.prototype, "focus");
			focus.mockClear();
			await renderWithProviders(
				<Field testID="row">
					<Field.Label>Code</Field.Label>
					<OtpInput />
				</Field>
			);
			await tap(screen.getByTestId("row"));
			expect(focus).toHaveBeenCalledTimes(1);
		});

		test("a disabled field ignores a press on its Field's row", async () => {
			const focus = jest.spyOn(TextInput.prototype, "focus");
			focus.mockClear();
			await renderWithProviders(
				<Field testID="row">
					<Field.Label>Code</Field.Label>
					<OtpInput isDisabled />
				</Field>
			);
			await tap(screen.getByTestId("row"));
			expect(focus).not.toHaveBeenCalled();
		});
	});

	describe("custom anatomy", () => {
		test("groups, slots and separators render inside the root", async () => {
			await renderWithProviders(
				<OtpInput defaultValue="123" length={4}>
					<OtpInput.Group>
						<OtpInput.Slot index={0} />
						<OtpInput.Slot index={1} />
					</OtpInput.Group>
					<OtpInput.Separator testID="sep" />
					<OtpInput.Group>
						<OtpInput.Slot index={2} />
						<OtpInput.Slot index={3} />
					</OtpInput.Group>
				</OtpInput>
			);
			expect(screen.getByTestId("sep", { includeHiddenElements: true })).toBeOnTheScreen();
			expect(screen.getByText("1", { includeHiddenElements: true })).toBeOnTheScreen();
			expect(screen.getByText("3", { includeHiddenElements: true })).toBeOnTheScreen();
		});

		test("groupSize draws a separator between groups", async () => {
			await renderWithProviders(<OtpInput groupSize={3} />);
			expect(screen.getByLabelText("Verification code")).toBeOnTheScreen();
		});
	});

	describe("parts outside a root", () => {
		let original: typeof console.error;
		beforeEach(() => {
			original = console.error;
			console.error = () => {};
		});
		afterEach(() => {
			console.error = original;
		});

		test("Group throws", async () => {
			await expect(renderWithProviders(<OtpInput.Group />)).rejects.toThrow(
				"OtpInput.Group must be rendered inside an <OtpInput>."
			);
		});

		test("Slot throws", async () => {
			await expect(renderWithProviders(<OtpInput.Slot index={0} />)).rejects.toThrow(
				"OtpInput.Slot must be rendered inside an <OtpInput>."
			);
		});

		test("Separator throws", async () => {
			await expect(renderWithProviders(<OtpInput.Separator />)).rejects.toThrow(
				"OtpInput.Separator must be rendered inside an <OtpInput>."
			);
		});
	});
});
