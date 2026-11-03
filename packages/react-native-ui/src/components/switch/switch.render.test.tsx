import { describe, expect, jest, test } from "@jest/globals";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
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
});
