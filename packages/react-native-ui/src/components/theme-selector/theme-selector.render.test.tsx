import { afterEach, describe, expect, jest, test } from "@jest/globals";
import { Uniwind } from "uniwind";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Field } from "../field";
import { ThemeSelector } from "./theme-selector";
import { useThemeSelector } from "./theme-selector.context";

// ToggleButton.Group does not set `accessible` on its radiogroup, so role queries skip it; the group is
// found by its label. The Android `activate` action is wired only when Platform.OS is android, which Jest is not.
// The Uniwind mock reports an adaptive "light" theme, so the live mode is always `system`;
// the real theme cannot move under Jest, only `Uniwind.setTheme` calls are observable.

afterEach(() => {
	jest.restoreAllMocks();
});

describe("ThemeSelector", () => {
	test("is a named radiogroup with one radio per mode, live mode selected", async () => {
		await renderWithProviders(<ThemeSelector />);
		expect(screen.getByLabelText("Theme")).toBeOnTheScreen();
		expect(screen.getAllByRole("radio")).toHaveLength(3);
		expect(screen.getByRole("radio", { name: "System" })).toBeSelected();
		expect(screen.getByRole("radio", { name: "Light" })).not.toBeSelected();
		expect(screen.getByRole("radio", { name: "Dark" })).not.toBeSelected();
	});

	test("accessibilityLabel names the group", async () => {
		await renderWithProviders(<ThemeSelector accessibilityLabel="Appearance" />);
		expect(screen.getByLabelText("Appearance")).toBeOnTheScreen();
	});

	test("an enclosing Field.Label names the group", async () => {
		await renderWithProviders(
			<Field>
				<Field.Label>Colour scheme</Field.Label>
				<ThemeSelector />
			</Field>
		);
		expect(screen.getByLabelText("Colour scheme")).toBeOnTheScreen();
	});

	test("testID names the group and each option takes it plus the mode", async () => {
		await renderWithProviders(<ThemeSelector testID="theme" />);
		expect(screen.getByTestId("theme")).toBeOnTheScreen();
		expect(screen.getByTestId("theme-system")).toBeOnTheScreen();
		expect(screen.getByTestId("theme-light")).toBeOnTheScreen();
		expect(screen.getByTestId("theme-dark")).toBeOnTheScreen();
	});

	test("modes picks and orders the options", async () => {
		await renderWithProviders(<ThemeSelector modes={["dark", "light"]} />);
		const radios = screen.getAllByRole("radio");
		expect(radios).toHaveLength(2);
		expect(radios[0]).toHaveAccessibleName("Dark");
		expect(radios[1]).toHaveAccessibleName("Light");
	});

	test("labels override per mode and a blank override falls back", async () => {
		await renderWithProviders(<ThemeSelector labels={{ system: "Auto", dark: "  " }} />);
		expect(screen.getByRole("radio", { name: "Auto" })).toBeOnTheScreen();
		expect(screen.getByRole("radio", { name: "Dark" })).toBeOnTheScreen();
	});

	test("value overrides which option is shown selected", async () => {
		const view = await renderWithProviders(<ThemeSelector value="dark" />);
		expect(screen.getByRole("radio", { name: "Dark" })).toBeSelected();
		expect(screen.getByRole("radio", { name: "System" })).not.toBeSelected();

		await view.rerender(<ThemeSelector value="light" />);
		expect(screen.getByRole("radio", { name: "Light" })).toBeSelected();
		expect(screen.getByRole("radio", { name: "Dark" })).not.toBeSelected();
	});

	test("an activation applies the theme and then reports the mode", async () => {
		const calls: string[] = [];
		const setTheme = jest.spyOn(Uniwind, "setTheme").mockImplementation((theme) => {
			calls.push(`setTheme:${theme}`);
		});
		const onValueChange = jest.fn((mode: string) => {
			calls.push(`onValueChange:${mode}`);
		});
		await renderWithProviders(<ThemeSelector onValueChange={onValueChange} />);

		await fireEvent(screen.getByRole("radio", { name: "Dark" }), "accessibilityTap");
		expect(setTheme).toHaveBeenCalledTimes(1);
		expect(onValueChange).toHaveBeenCalledTimes(1);
		expect(calls).toEqual(["setTheme:dark", "onValueChange:dark"]);
	});

	test("applyTheme={false} reports without touching the theme", async () => {
		const setTheme = jest.spyOn(Uniwind, "setTheme").mockImplementation(() => undefined);
		const onValueChange = jest.fn();
		await renderWithProviders(<ThemeSelector applyTheme={false} onValueChange={onValueChange} value="system" />);

		await fireEvent(screen.getByRole("radio", { name: "Dark" }), "accessibilityTap");
		expect(onValueChange).toHaveBeenCalledWith("dark");
		expect(setTheme).not.toHaveBeenCalled();
	});

	test("pressing the selected option notifies nobody", async () => {
		const setTheme = jest.spyOn(Uniwind, "setTheme").mockImplementation(() => undefined);
		const onValueChange = jest.fn();
		await renderWithProviders(<ThemeSelector onValueChange={onValueChange} />);

		await fireEvent(screen.getByRole("radio", { name: "System" }), "accessibilityTap");
		expect(onValueChange).not.toHaveBeenCalled();
		expect(setTheme).not.toHaveBeenCalled();
	});

	test("with value, the selection waits for the prop", async () => {
		jest.spyOn(Uniwind, "setTheme").mockImplementation(() => undefined);
		const onValueChange = jest.fn();
		const view = await renderWithProviders(
			<ThemeSelector applyTheme={false} onValueChange={onValueChange} value="light" />
		);
		await fireEvent(screen.getByRole("radio", { name: "Dark" }), "accessibilityTap");
		expect(onValueChange).toHaveBeenCalledWith("dark");
		expect(screen.getByRole("radio", { name: "Light" })).toBeSelected();

		await view.rerender(<ThemeSelector applyTheme={false} onValueChange={onValueChange} value="dark" />);
		expect(screen.getByRole("radio", { name: "Dark" })).toBeSelected();
	});

	test("isDisabled is announced and ignores activation", async () => {
		const setTheme = jest.spyOn(Uniwind, "setTheme").mockImplementation(() => undefined);
		const onValueChange = jest.fn();
		await renderWithProviders(<ThemeSelector isDisabled onValueChange={onValueChange} />);
		const dark = screen.getByRole("radio", { name: "Dark" });
		expect(dark).toBeDisabled();
		await fireEvent(dark, "accessibilityTap");
		expect(onValueChange).not.toHaveBeenCalled();
		expect(setTheme).not.toHaveBeenCalled();
	});

	test("a disabled Field disables every option", async () => {
		await renderWithProviders(
			<Field isDisabled>
				<ThemeSelector />
			</Field>
		);
		for (const radio of screen.getAllByRole("radio")) {
			expect(radio).toBeDisabled();
		}
	});

	test("an explicit isDisabled={false} wins over a disabled Field", async () => {
		await renderWithProviders(
			<Field isDisabled>
				<ThemeSelector isDisabled={false} />
			</Field>
		);
		for (const radio of screen.getAllByRole("radio")) {
			expect(radio).not.toBeDisabled();
		}
	});

	test("the cards variant keeps the same radio semantics", async () => {
		await renderWithProviders(<ThemeSelector variant="cards" />);
		expect(screen.getByLabelText("Theme")).toBeOnTheScreen();
		expect(screen.getAllByRole("radio")).toHaveLength(3);
		expect(screen.getByRole("radio", { name: "System" })).toBeSelected();
	});

	test("custom Options render in place of the defaults, with label and testID", async () => {
		await renderWithProviders(
			<ThemeSelector>
				<ThemeSelector.Option label="Night" testID="night" value="dark" />
				<ThemeSelector.Option value="light" />
			</ThemeSelector>
		);
		expect(screen.getAllByRole("radio")).toHaveLength(2);
		expect(screen.getByRole("radio", { name: "Night" })).toBeOnTheScreen();
		expect(screen.getByTestId("night")).toBeOnTheScreen();
		expect(screen.getByRole("radio", { name: "Light" })).toBeOnTheScreen();
	});

	test("an Option outside a ThemeSelector throws its documented error", async () => {
		const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
		await expect(renderWithProviders(<ThemeSelector.Option value="dark" />)).rejects.toThrow(
			"ThemeSelector.Option must be rendered inside a <ThemeSelector>."
		);
		spy.mockRestore();
	});

	test("useThemeSelector outside a ThemeSelector throws", async () => {
		function Probe() {
			useThemeSelector();
			return null;
		}
		const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
		await expect(renderWithProviders(<Probe />)).rejects.toThrow(
			"useThemeSelector must be called inside a <ThemeSelector>."
		);
		spy.mockRestore();
	});
});
