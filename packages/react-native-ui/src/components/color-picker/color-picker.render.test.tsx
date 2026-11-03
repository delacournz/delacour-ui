import { BottomSheetProvider } from "@delacour/react-native-bottom-sheet";
import { describe, expect, jest, test } from "@jest/globals";
import type { ReactElement, ReactNode } from "react";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Field } from "../field";
import { OverlayProvider } from "../overlay";
import { ColorPicker, type ColorPickerProps } from "./color-picker";

function Providers({ children }: { children: ReactNode }): ReactElement {
	return (
		<OverlayProvider>
			<BottomSheetProvider>{children}</BottomSheetProvider>
		</OverlayProvider>
	);
}

const adjust = (name: string, actionName: string) =>
	fireEvent(screen.getByRole("adjustable", { name }), "accessibilityAction", { nativeEvent: { actionName } });

const AREA = "Saturation and brightness";

function Picker(props: ColorPickerProps): ReactElement {
	return <ColorPicker defaultValue="#ff0000" haptic={false} {...props} />;
}

describe("ColorPicker", () => {
	test("the default anatomy draws the area, hue track and hex field", async () => {
		await renderWithProviders(<Picker />);
		expect(screen.getByRole("adjustable", { name: AREA })).toHaveAccessibilityValue({
			text: "Saturation 100 percent, brightness 100 percent",
		});
		expect(screen.getByRole("adjustable", { name: "Hue" })).toHaveAccessibilityValue({
			max: 360,
			min: 0,
			now: 0,
		});
		expect(screen.getByLabelText("Hex colour")).toHaveDisplayValue("#ff0000");
		expect(screen.queryByRole("adjustable", { name: "Opacity" })).not.toBeOnTheScreen();
	});

	test("hasAlpha adds the opacity track", async () => {
		await renderWithProviders(<Picker hasAlpha />);
		expect(screen.getByRole("adjustable", { name: "Opacity" })).toHaveAccessibilityValue({
			max: 100,
			min: 0,
			now: 100,
			text: "Opacity 100 percent",
		});
	});

	test("an unparseable defaultValue falls back to the default colour", async () => {
		await renderWithProviders(<Picker defaultValue="not a colour" />);
		expect(screen.getByLabelText("Hex colour")).toHaveDisplayValue("#000000");
	});

	test("the hue track steps ten degrees and commits", async () => {
		const onValueChange = jest.fn();
		const onValueCommit = jest.fn();
		await renderWithProviders(<Picker onValueChange={onValueChange} onValueCommit={onValueCommit} />);

		await adjust("Hue", "increment");
		expect(screen.getByRole("adjustable", { name: "Hue" })).toHaveAccessibilityValue({ now: 10 });
		expect(onValueChange).toHaveBeenCalledTimes(1);
		expect(onValueCommit).toHaveBeenCalledTimes(1);
		expect(onValueCommit).toHaveBeenLastCalledWith(onValueChange.mock.calls[0]?.[0]);
		expect(screen.getByLabelText("Hex colour")).not.toHaveDisplayValue("#ff0000");
	});

	test("the hue track wraps below zero", async () => {
		await renderWithProviders(<Picker />);
		await adjust("Hue", "decrement");
		expect(screen.getByRole("adjustable", { name: "Hue" })).toHaveAccessibilityValue({ now: 350 });
	});

	test("the area steps saturation and brightness through its actions", async () => {
		await renderWithProviders(<Picker />);
		await adjust(AREA, "decrement");
		expect(screen.getByRole("adjustable", { name: AREA })).toHaveAccessibilityValue({
			text: "Saturation 95 percent, brightness 100 percent",
		});
		await adjust(AREA, "darker");
		expect(screen.getByRole("adjustable", { name: AREA })).toHaveAccessibilityValue({
			text: "Saturation 95 percent, brightness 95 percent",
		});
		await adjust(AREA, "brighter");
		await adjust(AREA, "increment");
		expect(screen.getByRole("adjustable", { name: AREA })).toHaveAccessibilityValue({
			text: "Saturation 100 percent, brightness 100 percent",
		});
	});

	test("the opacity track steps five percent", async () => {
		const onValueCommit = jest.fn();
		await renderWithProviders(<Picker hasAlpha onValueCommit={onValueCommit} />);
		await adjust("Opacity", "decrement");
		expect(screen.getByRole("adjustable", { name: "Opacity" })).toHaveAccessibilityValue({
			now: 95,
			text: "Opacity 95 percent",
		});
		expect(onValueCommit).toHaveBeenCalledTimes(1);
		expect(onValueCommit.mock.calls[0]?.[0]).toMatch(/^#ff0000[0-9a-f]{2}$/);
	});

	test("the hex field commits a valid colour on submit", async () => {
		const onValueChange = jest.fn();
		const onValueCommit = jest.fn();
		await renderWithProviders(<Picker onValueChange={onValueChange} onValueCommit={onValueCommit} />);
		const input = screen.getByLabelText("Hex colour");

		await fireEvent.changeText(input, "#00ff00");
		expect(onValueCommit).not.toHaveBeenCalled();
		await fireEvent(input, "submitEditing");

		expect(onValueChange).toHaveBeenLastCalledWith("#00ff00");
		expect(onValueCommit).toHaveBeenLastCalledWith("#00ff00");
		expect(screen.getByRole("adjustable", { name: "Hue" })).toHaveAccessibilityValue({ now: 120 });
	});

	test("the hex field commits on blur", async () => {
		const onValueCommit = jest.fn();
		await renderWithProviders(<Picker onValueCommit={onValueCommit} />);
		const input = screen.getByLabelText("Hex colour");
		await fireEvent.changeText(input, "#0000ff");
		await fireEvent(input, "blur");
		expect(onValueCommit).toHaveBeenLastCalledWith("#0000ff");
	});

	test("text that is not a colour leaves the value alone", async () => {
		const onValueCommit = jest.fn();
		await renderWithProviders(<Picker onValueCommit={onValueCommit} />);
		const input = screen.getByLabelText("Hex colour");
		await fireEvent.changeText(input, "#zz");
		await fireEvent(input, "submitEditing");
		expect(onValueCommit).not.toHaveBeenCalled();
		expect(screen.getByRole("adjustable", { name: "Hue" })).toHaveAccessibilityValue({ now: 0 });
	});

	// The swatches row carries role radiogroup but is deliberately not `accessible` (a grouping container
	// must not swallow its radios on iOS), so RNTL role queries cannot reach it; the radios are tested.
	test("a swatch is a radio, selected when it is the current colour", async () => {
		await renderWithProviders(
			<Picker>
				<ColorPicker.Swatches colors={["#ff0000", "#00ff00", "rgb(0 0 255)"]} />
			</Picker>
		);
		expect(screen.getByRole("radio", { name: "#ff0000" })).toBeChecked();
		expect(screen.getByRole("radio", { name: "#00ff00" })).not.toBeChecked();
		expect(screen.getByRole("radio", { name: "#0000ff" })).toBeOnTheScreen();
	});

	test("pressing a swatch sets and commits the colour", async () => {
		const onValueCommit = jest.fn();
		await renderWithProviders(
			<Picker onValueCommit={onValueCommit}>
				<ColorPicker.Swatches colors={["#ff0000", "#00ff00"]} />
			</Picker>
		);
		await fireEvent(screen.getByRole("radio", { name: "#00ff00" }), "accessibilityTap");
		expect(onValueCommit).toHaveBeenLastCalledWith("#00ff00");
		expect(screen.getByRole("radio", { name: "#00ff00" })).toBeChecked();
		expect(screen.getByRole("radio", { name: "#ff0000" })).not.toBeChecked();
	});

	test("a swatch that does not parse renders nothing", async () => {
		await renderWithProviders(
			<Picker>
				<ColorPicker.Swatches colors={["#ff0000", "nope"]} />
			</Picker>
		);
		expect(screen.getAllByRole("radio")).toHaveLength(1);
	});

	test("format reports changes in the chosen notation", async () => {
		const onValueCommit = jest.fn();
		await renderWithProviders(<Picker format="rgb" onValueCommit={onValueCommit} />);
		await adjust("Hue", "increment");
		expect(String(onValueCommit.mock.calls[0]?.[0])).toMatch(/^rgb/);
	});

	test("controlled: reports the change and waits for the prop", async () => {
		const onValueChange = jest.fn();
		const view = await renderWithProviders(<Picker onValueChange={onValueChange} value="#ff0000" />);
		await adjust("Hue", "increment");
		expect(onValueChange).toHaveBeenCalledTimes(1);

		await view.rerender(<Picker onValueChange={onValueChange} value="#00ff00" />);
		expect(screen.getByRole("adjustable", { name: "Hue" })).toHaveAccessibilityValue({ now: 120 });
		expect(screen.getByLabelText("Hex colour")).toHaveDisplayValue("#00ff00");
	});

	test("a controlled value that does not parse is ignored", async () => {
		const view = await renderWithProviders(<Picker value="#ff0000" />);
		await view.rerender(<Picker value="garbage" />);
		expect(screen.getByLabelText("Hex colour")).toHaveDisplayValue("#ff0000");
	});

	test("isDisabled is announced and ignores every input path", async () => {
		const onValueChange = jest.fn();
		await renderWithProviders(
			<Picker isDisabled onValueChange={onValueChange}>
				<ColorPicker.Area />
				<ColorPicker.Hue />
				<ColorPicker.Input />
				<ColorPicker.Swatches colors={["#00ff00"]} />
			</Picker>
		);
		expect(screen.getByRole("adjustable", { name: AREA })).toBeDisabled();
		expect(screen.getByRole("adjustable", { name: "Hue" })).toBeDisabled();
		expect(screen.getByRole("radio", { name: "#00ff00" })).toBeDisabled();

		await adjust("Hue", "increment");
		await adjust(AREA, "decrement");
		await fireEvent(screen.getByRole("radio", { name: "#00ff00" }), "accessibilityTap");
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test("isReadOnly renders the value but ignores adjustments, swatches and typing", async () => {
		const onValueChange = jest.fn();
		await renderWithProviders(
			<Picker isReadOnly onValueChange={onValueChange}>
				<ColorPicker.Hue />
				<ColorPicker.Input />
				<ColorPicker.Swatches colors={["#00ff00"]} />
			</Picker>
		);
		await adjust("Hue", "increment");
		await fireEvent(screen.getByRole("radio", { name: "#00ff00" }), "accessibilityTap");
		expect(onValueChange).not.toHaveBeenCalled();
		expect(screen.getByLabelText("Hex colour")).toHaveDisplayValue("#ff0000");
		expect(screen.getByLabelText("Hex colour")).toBeDisabled();
	});

	test("hasAlpha false pins alpha at one for an alpha swatch", async () => {
		const onValueCommit = jest.fn();
		await renderWithProviders(
			<Picker onValueCommit={onValueCommit}>
				<ColorPicker.Swatches colors={["#00ff0080"]} />
			</Picker>
		);
		await fireEvent(screen.getByRole("radio", { name: "#00ff00" }), "accessibilityTap");
		expect(onValueCommit).toHaveBeenLastCalledWith("#00ff00");
	});

	test("Preview is hidden from assistive technology", async () => {
		await renderWithProviders(
			<Picker>
				<ColorPicker.Preview testID="preview" />
			</Picker>
		);
		expect(screen.getByTestId("preview", { includeHiddenElements: true })).toBeOnTheScreen();
		expect(screen.queryByTestId("preview")).not.toBeOnTheScreen();
	});

	test("a Field label prefixes each part's accessible name", async () => {
		await renderWithProviders(
			<Field>
				<Field.Label>Accent</Field.Label>
				<Picker />
			</Field>
		);
		expect(screen.getByRole("adjustable", { name: "Accent, saturation and brightness" })).toBeOnTheScreen();
		expect(screen.getByRole("adjustable", { name: "Accent, hue" })).toBeOnTheScreen();
	});

	test("a testID on a track names its thumb", async () => {
		await renderWithProviders(
			<Picker>
				<ColorPicker.Hue testID="hue" />
			</Picker>
		);
		expect(screen.getByTestId("hue-thumb")).toBeOnTheScreen();
	});

	test("parts used outside a ColorPicker throw their documented errors", async () => {
		const original = console.error;
		console.error = () => undefined;
		try {
			await expect(renderWithProviders(<ColorPicker.Area />)).rejects.toThrow(
				"ColorPicker.Area must be rendered inside a <ColorPicker>."
			);
			await expect(renderWithProviders(<ColorPicker.Hue />)).rejects.toThrow(
				"ColorPicker.Hue must be rendered inside a <ColorPicker>."
			);
			await expect(renderWithProviders(<ColorPicker.Input />)).rejects.toThrow(
				"ColorPicker.Input must be rendered inside a <ColorPicker>."
			);
			await expect(renderWithProviders(<ColorPicker.Swatch color="#fff" />)).rejects.toThrow(
				"ColorPicker.Swatch must be rendered inside a <ColorPicker>."
			);
		} finally {
			console.error = original;
		}
	});

	describe("sheet presentation", () => {
		test("the trigger is a collapsed button naming the colour", async () => {
			await renderWithProviders(<Picker presentation="sheet" />, { wrapper: Providers });
			const trigger = screen.getByRole("button", { name: "Colour, #ff0000, opens picker" });
			expect(trigger).not.toBeExpanded();
			expect(screen.queryByRole("adjustable", { name: "Hue" })).not.toBeOnTheScreen();
		});

		test("activating the trigger opens the sheet and reports it", async () => {
			const onOpenChange = jest.fn();
			await renderWithProviders(<Picker onOpenChange={onOpenChange} presentation="sheet" />, {
				wrapper: Providers,
			});
			await fireEvent(screen.getByRole("button", { name: /opens picker/ }), "accessibilityTap");
			expect(onOpenChange).toHaveBeenLastCalledWith(true);
			expect(screen.getByRole("adjustable", { name: "Hue" })).toBeOnTheScreen();
			expect(screen.getByRole("button", { name: /opens picker/ })).toBeExpanded();
		});

		test("defaultOpen shows the content, and a disabled trigger does not open", async () => {
			const onOpenChange = jest.fn();
			await renderWithProviders(<Picker defaultOpen presentation="sheet" />, { wrapper: Providers });
			expect(screen.getByRole("adjustable", { name: "Hue" })).toBeOnTheScreen();
			await screen.unmount();

			await renderWithProviders(<Picker isDisabled onOpenChange={onOpenChange} presentation="sheet" />, {
				wrapper: Providers,
			});
			expect(screen.getByRole("button", { name: /opens picker/ })).toBeDisabled();
			await fireEvent(screen.getByRole("button", { name: /opens picker/ }), "accessibilityTap");
			expect(onOpenChange).not.toHaveBeenCalled();
		});

		test("controlled isOpen waits for the prop", async () => {
			const onOpenChange = jest.fn();
			const view = await renderWithProviders(
				<Picker isOpen={false} onOpenChange={onOpenChange} presentation="sheet" />,
				{ wrapper: Providers }
			);
			await fireEvent(screen.getByRole("button", { name: /opens picker/ }), "accessibilityTap");
			expect(onOpenChange).toHaveBeenCalledWith(true);
			expect(screen.queryByRole("adjustable", { name: "Hue" })).not.toBeOnTheScreen();

			await view.rerender(<Picker isOpen onOpenChange={onOpenChange} presentation="sheet" />);
			expect(screen.getByRole("adjustable", { name: "Hue" })).toBeOnTheScreen();
		});

		test("isOpen is ignored inline", async () => {
			await renderWithProviders(<Picker isOpen={false} />);
			expect(screen.getByRole("adjustable", { name: "Hue" })).toBeOnTheScreen();
		});
	});
});
