import { describe, expect, jest, test } from "@jest/globals";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Label } from "./label";

describe("Label", () => {
	test("renders its text", async () => {
		await renderWithProviders(<Label>Email</Label>);
		expect(screen.getByText("Email")).toBeOnTheScreen();
	});

	test("a plain label is announced by its text and shows no required mark", async () => {
		await renderWithProviders(<Label>Email</Label>);
		expect(screen.getByText("Email")).toHaveTextContent("Email");
		expect(screen.queryByText("*", { exact: false })).not.toBeOnTheScreen();
	});

	test("isRequired shows an asterisk and is announced as required, not as a star", async () => {
		await renderWithProviders(<Label isRequired>Email</Label>);
		expect(screen.getByLabelText("Email, required")).toBeOnTheScreen();
		expect(screen.getByText("*", { exact: false })).toBeOnTheScreen();
	});

	test("the required mark is nested in the label's own text, not a sibling", async () => {
		await renderWithProviders(<Label isRequired>Email</Label>);
		expect(screen.getByLabelText("Email, required")).toHaveTextContent("Email *", { exact: false });
	});

	test("a caller's accessibilityLabel beats the derived one", async () => {
		await renderWithProviders(
			<Label accessibilityLabel="Work email" isRequired>
				Email
			</Label>
		);
		expect(screen.getByLabelText("Work email")).toBeOnTheScreen();
		expect(screen.queryByLabelText("Email, required")).not.toBeOnTheScreen();
	});

	test("isDisabled reports the disabled accessibility state", async () => {
		await renderWithProviders(<Label isDisabled>Email</Label>);
		expect(screen.getByText("Email")).toBeDisabled();
	});

	test("an enabled label is not disabled", async () => {
		await renderWithProviders(<Label>Email</Label>);
		expect(screen.getByText("Email")).not.toBeDisabled();
	});

	test("isDisabled keeps the caller's other accessibility state", async () => {
		await renderWithProviders(
			<Label accessibilityState={{ selected: true }} isDisabled>
				Email
			</Label>
		);
		const label = screen.getByText("Email");
		expect(label).toBeDisabled();
		expect(label).toBeSelected();
	});

	test("forwards testID and onPress", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<Label onPress={onPress} testID="email-label">
				Email
			</Label>
		);
		const label = screen.getByTestId("email-label");
		await fireEvent.press(label);
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("invalid, required and disabled combine independently", async () => {
		await renderWithProviders(
			<Label isDisabled isInvalid isRequired>
				Email
			</Label>
		);
		const label = screen.getByLabelText("Email, required");
		expect(label).toBeDisabled();
		expect(screen.getByText("*", { exact: false })).toBeOnTheScreen();
	});
});
