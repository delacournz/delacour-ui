import { describe, expect, jest, test } from "@jest/globals";
import type { ReactElement } from "react";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { SectionProgress, type SectionProgressProps } from "./section-progress";
import { SectionProgressItem } from "./section-progress-item";

// Not testable under Jest: the ring fill (Skia is stubbed), the label slide/resize, the panel grow
// and the reveal latch (all UI-thread worklets), the screen-reader focus jump and the Android
// back handler's real hardware path. Items stay mounted while closed, hidden from assistive
// technology, so item queries pass `includeHiddenElements`.

type Props = Partial<Omit<SectionProgressProps, "children">>;

function Pill(props: Props): ReactElement {
	return (
		<SectionProgress {...props}>
			<SectionProgress.Item value="intro">Introduction</SectionProgress.Item>
			<SectionProgress.Item value="pricing" color="success">
				Pricing
			</SectionProgress.Item>
			<SectionProgress.Item value="faq">FAQ</SectionProgress.Item>
		</SectionProgress>
	);
}

const hidden = { includeHiddenElements: true } as const;
const pill = () => screen.getByRole("button", { name: "Sections" });
const item = (name: string) => screen.getByRole("button", { name, ...hidden });
const activate = (element: ReturnType<typeof item>) => fireEvent(element, "accessibilityTap");

describe("SectionProgress", () => {
	test("renders the pill as a collapsed button named Sections", async () => {
		await renderWithProviders(<Pill defaultValue="intro" />);
		expect(pill()).toBeOnTheScreen();
		expect(pill()).toBeCollapsed();
	});

	test("the pill's value announces the active section and percent", async () => {
		await renderWithProviders(<Pill defaultValue="pricing" />);
		expect(pill()).toHaveAccessibilityValue({ text: "Pricing, 0 percent" });
	});

	test("accessibilityLabel renames the pill", async () => {
		await renderWithProviders(<Pill accessibilityLabel="Chapters" defaultValue="intro" />);
		expect(screen.getByRole("button", { name: "Chapters" })).toBeOnTheScreen();
	});

	test("the pill shows the active section's title beside the listed one", async () => {
		await renderWithProviders(<Pill defaultValue="faq" />);
		expect(screen.getAllByText("FAQ", hidden)).toHaveLength(2);
		expect(screen.getAllByText("Pricing", hidden)).toHaveLength(1);
	});

	test("the pill toggles the panel and reports onOpenChange", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<Pill defaultValue="intro" onOpenChange={onOpenChange} />);

		await activate(pill());
		expect(pill()).toBeExpanded();
		expect(onOpenChange).toHaveBeenLastCalledWith(true);

		await activate(pill());
		expect(pill()).toBeCollapsed();
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
	});

	test("defaultOpen starts the panel open", async () => {
		await renderWithProviders(<Pill defaultOpen defaultValue="intro" />);
		expect(pill()).toBeExpanded();
	});

	test("controlled isOpen waits for the prop", async () => {
		const onOpenChange = jest.fn();
		const { rerender } = await renderWithProviders(<Pill isOpen={false} onOpenChange={onOpenChange} />);

		await activate(pill());
		expect(onOpenChange).toHaveBeenCalledWith(true);
		expect(pill()).toBeCollapsed();

		await rerender(<Pill isOpen onOpenChange={onOpenChange} />);
		expect(pill()).toBeExpanded();
	});

	test("every item is listed, and the active one is selected", async () => {
		await renderWithProviders(<Pill defaultOpen defaultValue="pricing" />);
		expect(item("Introduction")).not.toBeSelected();
		expect(item("Pricing")).toBeSelected();
		expect(item("FAQ")).not.toBeSelected();
	});

	test("with no active section no item is selected", async () => {
		await renderWithProviders(<Pill defaultOpen />);
		expect(item("Introduction")).not.toBeSelected();
		expect(item("Pricing")).not.toBeSelected();
	});

	test("picking an item emits it, selects it and closes the panel (uncontrolled)", async () => {
		const onValueChange = jest.fn();
		const onOpenChange = jest.fn();
		await renderWithProviders(
			<Pill defaultOpen defaultValue="intro" onOpenChange={onOpenChange} onValueChange={onValueChange} />
		);

		await activate(item("FAQ"));
		expect(onValueChange).toHaveBeenCalledTimes(1);
		expect(onValueChange).toHaveBeenCalledWith("faq");
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
		expect(pill()).toBeCollapsed();
		expect(item("FAQ")).toBeSelected();
		expect(item("Introduction")).not.toBeSelected();
	});

	test("controlled value reports the pick and waits for the prop", async () => {
		const onValueChange = jest.fn();
		const { rerender } = await renderWithProviders(<Pill defaultOpen onValueChange={onValueChange} value="intro" />);

		await activate(item("Pricing"));
		expect(onValueChange).toHaveBeenCalledWith("pricing");
		expect(item("Introduction")).toBeSelected();
		expect(item("Pricing")).not.toBeSelected();

		await rerender(<Pill defaultOpen onValueChange={onValueChange} value="pricing" />);
		expect(item("Pricing")).toBeSelected();
	});

	test("a controlled value of undefined stays controlled and means none yet", async () => {
		const onValueChange = jest.fn();
		const { rerender } = await renderWithProviders(
			<Pill defaultOpen onValueChange={onValueChange} value={undefined} />
		);

		await activate(item("Pricing"));
		expect(onValueChange).toHaveBeenCalledWith("pricing");
		expect(item("Pricing")).not.toBeSelected();

		await rerender(<Pill defaultOpen onValueChange={onValueChange} value="pricing" />);
		expect(item("Pricing")).toBeSelected();
	});

	test("an item's own onPress also fires", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<SectionProgress defaultOpen defaultValue="a">
				<SectionProgress.Item onPress={onPress} value="a">
					Alpha
				</SectionProgress.Item>
			</SectionProgress>
		);
		await activate(item("Alpha"));
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("a disabled item neither emits nor closes the panel", async () => {
		const onValueChange = jest.fn();
		await renderWithProviders(
			<SectionProgress defaultOpen defaultValue="a" onValueChange={onValueChange}>
				<SectionProgress.Item value="a">Alpha</SectionProgress.Item>
				<SectionProgress.Item disabled value="b">
					Beta
				</SectionProgress.Item>
			</SectionProgress>
		);
		expect(item("Beta")).toBeDisabled();
		await activate(item("Beta"));
		expect(onValueChange).not.toHaveBeenCalled();
		expect(pill()).toBeExpanded();
	});

	test("tracks a changing controlled value on the pill", async () => {
		const { rerender } = await renderWithProviders(<Pill value="intro" />);
		await rerender(<Pill value="pricing" />);
		expect(pill()).toHaveAccessibilityValue({ text: "Pricing, 0 percent" });
	});

	test("an item outside a SectionProgress throws its documented error", async () => {
		const original = console.error;
		console.error = () => {};
		try {
			await expect(renderWithProviders(<SectionProgressItem value="x">X</SectionProgressItem>)).rejects.toThrow(
				"SectionProgress.Item must be rendered inside a <SectionProgress>."
			);
		} finally {
			console.error = original;
		}
	});
});
