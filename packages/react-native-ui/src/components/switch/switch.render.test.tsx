import { describe, expect, jest, test } from "@jest/globals";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Field } from "../field";
import { Switch } from "./switch";

describe("Switch", () => {
	test("is a switch whose state is announced", async () => {
		await renderWithProviders(<Switch accessibilityLabel="Wi-Fi" />);
		const control = screen.getByRole("switch", { name: "Wi-Fi" });
		expect(control).not.toBeChecked();
	});

	test("uncontrolled: defaultSelected seeds it and an activation flips it", async () => {
		const onSelectedChange = jest.fn();
		await renderWithProviders(
			<Switch accessibilityLabel="Wi-Fi" defaultSelected onSelectedChange={onSelectedChange} />
		);
		const control = screen.getByRole("switch");
		expect(control).toBeChecked();

		await fireEvent(control, "accessibilityTap");
		expect(control).not.toBeChecked();
		expect(onSelectedChange).toHaveBeenLastCalledWith(false);
	});

	test("controlled: reports the change and waits for the prop", async () => {
		const onSelectedChange = jest.fn();
		const view = await renderWithProviders(
			<Switch accessibilityLabel="Wi-Fi" isSelected={false} onSelectedChange={onSelectedChange} />
		);
		await fireEvent(screen.getByRole("switch"), "accessibilityAction", { nativeEvent: { actionName: "activate" } });
		expect(onSelectedChange).toHaveBeenCalledWith(true);
		expect(screen.getByRole("switch")).not.toBeChecked();

		await view.rerender(<Switch accessibilityLabel="Wi-Fi" isSelected onSelectedChange={onSelectedChange} />);
		expect(screen.getByRole("switch")).toBeChecked();
	});

	test("isDisabled is announced and ignores activation", async () => {
		const onSelectedChange = jest.fn();
		await renderWithProviders(<Switch accessibilityLabel="Wi-Fi" isDisabled onSelectedChange={onSelectedChange} />);
		const control = screen.getByRole("switch");
		expect(control).toBeDisabled();
		await fireEvent(control, "accessibilityTap");
		expect(onSelectedChange).not.toHaveBeenCalled();
	});

	test("inside an invalid, required Field it is named and described by the Field", async () => {
		await renderWithProviders(
			<Field isInvalid isRequired>
				<Field.Label>Notifications</Field.Label>
				<Switch />
				<Field.Error>Turn this on to continue.</Field.Error>
				<Field.Description>Push alerts.</Field.Description>
			</Field>
		);
		const control = screen.getByRole("switch");
		expect(control.props.accessibilityLabel).toBe("Notifications, required");
		expect(control.props.accessibilityHint).toContain("Invalid: Turn this on to continue.");
		expect(control.props.accessibilityHint).toContain("Push alerts.");
	});

	test("outside a Field the label is the caller's own", async () => {
		await renderWithProviders(<Switch accessibilityLabel="Wi-Fi" />);
		const control = screen.getByRole("switch");
		expect(control.props.accessibilityLabel).toBe("Wi-Fi");
		expect(control.props.accessibilityHint).toBeUndefined();
	});
});
