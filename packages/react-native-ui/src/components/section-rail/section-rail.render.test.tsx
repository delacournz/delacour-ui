import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { act, fireEvent, renderWithProviders, screen } from "../../test/render";
import { SectionRail, type SectionRailProps } from "./section-rail";

const SECTIONS = [
	{ id: "overview", title: "Overview", level: 0 },
	{ id: "pricing", title: "Pricing", level: 0 },
	{ id: "details", title: "Pricing details", level: 1 },
] as const;

function Rail(props: Omit<SectionRailProps, "children">) {
	return (
		<SectionRail {...props}>
			<SectionRail.Trigger>
				{SECTIONS.map((section) => (
					<SectionRail.Bar key={section.id} level={section.level} value={section.id} />
				))}
			</SectionRail.Trigger>
			<SectionRail.Content>
				{SECTIONS.map((section) => (
					<SectionRail.Item key={section.id} level={section.level} value={section.id}>
						{section.title}
					</SectionRail.Item>
				))}
			</SectionRail.Content>
		</SectionRail>
	);
}

/** Closed, the panel is hidden from assistive technology, so its rows need `includeHiddenElements`. */
const ANY = { includeHiddenElements: true } as const;

/** RNTL's value matcher only reads now/min/max, so the trigger's spoken text is read off the prop. */
function spoken(): string | undefined {
	return trigger().props.accessibilityValue?.text;
}

function trigger() {
	return screen.getByRole("adjustable", { name: "Sections" });
}

async function activate(element: ReturnType<typeof trigger>) {
	await fireEvent(element, "accessibilityAction", { nativeEvent: { actionName: "activate" } });
}

async function adjust(element: ReturnType<typeof trigger>, actionName: "increment" | "decrement") {
	await fireEvent(element, "accessibilityAction", { nativeEvent: { actionName } });
}

async function pickRow(title: string) {
	await fireEvent(screen.getByRole("button", { name: title, ...ANY }), "accessibilityTap");
}

// A touch, a scrub and the scrim's outside tap run through Gesture Handler on the UI thread and
// cannot be driven from Jest, so opening is exercised through the trigger's `activate` action,
// which is the same `setOpen` path. The scrub's pure maths is covered by section-rail.variants.test.ts.
describe("SectionRail", () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});
	afterEach(() => {
		jest.useRealTimers();
	});

	test("the trigger is one adjustable element named Sections, valued by the active row", async () => {
		await renderWithProviders(<Rail defaultValue="pricing" />);
		const control = trigger();
		expect(spoken()).toBe("Pricing");
		expect(control).not.toBeExpanded();
	});

	test("with no section yet the trigger speaks an empty value", async () => {
		await renderWithProviders(<Rail value={undefined} />);
		expect(spoken()).toBe("");
	});

	test("rows are buttons and only the active one is selected", async () => {
		await renderWithProviders(<Rail defaultValue="pricing" />);
		expect(screen.getByRole("button", { name: "Pricing", ...ANY })).toBeSelected();
		expect(screen.getByRole("button", { name: "Overview", ...ANY })).not.toBeSelected();
		expect(screen.getByRole("button", { name: "Pricing details", ...ANY })).not.toBeSelected();
	});

	test("the panel is hidden from assistive technology while closed and exposed once open", async () => {
		await renderWithProviders(<Rail />);
		expect(screen.queryByRole("button", { name: "Overview" })).not.toBeOnTheScreen();

		await activate(trigger());
		expect(trigger()).toBeExpanded();
		expect(screen.getByRole("button", { name: "Overview" })).toBeOnTheScreen();
	});

	test("activate toggles the panel and reports onOpenChange", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<Rail onOpenChange={onOpenChange} />);

		await activate(trigger());
		expect(onOpenChange).toHaveBeenLastCalledWith(true);
		expect(trigger()).toBeExpanded();

		await activate(trigger());
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
		expect(trigger()).not.toBeExpanded();
		expect(onOpenChange).toHaveBeenCalledTimes(2);
	});

	test("uncontrolled: defaultOpen starts it open", async () => {
		await renderWithProviders(<Rail defaultOpen />);
		expect(trigger()).toBeExpanded();
	});

	test("controlled open: reports the change and waits for the prop", async () => {
		const onOpenChange = jest.fn();
		const view = await renderWithProviders(<Rail isOpen={false} onOpenChange={onOpenChange} />);

		await activate(trigger());
		expect(onOpenChange).toHaveBeenCalledWith(true);
		expect(trigger()).not.toBeExpanded();

		await view.rerender(<Rail isOpen onOpenChange={onOpenChange} />);
		expect(trigger()).toBeExpanded();
	});

	test("the accessibility escape on the open panel closes it", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(
			<SectionRail defaultOpen onOpenChange={onOpenChange}>
				<SectionRail.Trigger>
					<SectionRail.Bar value="a" />
				</SectionRail.Trigger>
				<SectionRail.Content testID="panel">
					<SectionRail.Item value="a">Alpha</SectionRail.Item>
				</SectionRail.Content>
			</SectionRail>
		);
		const modal = screen.getByTestId("panel");
		expect(modal.props.accessibilityViewIsModal).toBe(true);
		await act(async () => {
			modal.props.onAccessibilityEscape();
		});
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
		expect(trigger()).not.toBeExpanded();
	});

	test("increment and decrement step through the bars in layout order and stop at the ends", async () => {
		const onValueChange = jest.fn();
		await renderWithProviders(
			<SectionRail defaultValue="overview" onValueChange={onValueChange}>
				<SectionRail.Trigger>
					{SECTIONS.map((section) => (
						<SectionRail.Bar key={section.id} testID={`bar-${section.id}`} value={section.id} />
					))}
				</SectionRail.Trigger>
				<SectionRail.Content>
					{SECTIONS.map((section) => (
						<SectionRail.Item key={section.id} value={section.id}>
							{section.title}
						</SectionRail.Item>
					))}
				</SectionRail.Content>
			</SectionRail>
		);
		for (const [index, section] of SECTIONS.entries()) {
			await fireEvent(screen.getByTestId(`bar-${section.id}`, ANY), "layout", {
				nativeEvent: { layout: { x: 0, y: index * 10, width: 8, height: 4 } },
			});
		}

		await adjust(trigger(), "decrement");
		expect(onValueChange).not.toHaveBeenCalled();

		await adjust(trigger(), "increment");
		expect(onValueChange).toHaveBeenLastCalledWith("pricing");
		expect(spoken()).toBe("Pricing");

		await adjust(trigger(), "increment");
		expect(onValueChange).toHaveBeenLastCalledWith("details");

		await adjust(trigger(), "increment");
		expect(onValueChange).toHaveBeenCalledTimes(2);
		expect(spoken()).toBe("Pricing details");
	});

	test("tapping a row commits it, calls onValueChange and updates the trigger's value", async () => {
		const onValueChange = jest.fn();
		await renderWithProviders(<Rail defaultOpen defaultValue="overview" onValueChange={onValueChange} />);

		await pickRow("Pricing");
		expect(onValueChange).toHaveBeenCalledTimes(1);
		expect(onValueChange).toHaveBeenCalledWith("pricing");
		expect(spoken()).toBe("Pricing");
		expect(screen.getByRole("button", { name: "Pricing" })).toBeSelected();
	});

	test("re-picking the active section does not call onValueChange", async () => {
		const onValueChange = jest.fn();
		await renderWithProviders(<Rail defaultOpen defaultValue="pricing" onValueChange={onValueChange} />);
		await pickRow("Pricing");
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test("a pick lingers for closeDelay, then closes the panel", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<Rail closeDelay={300} defaultOpen onOpenChange={onOpenChange} />);

		await pickRow("Pricing");
		expect(trigger()).toBeExpanded();

		await act(async () => {
			jest.advanceTimersByTime(299);
		});
		expect(trigger()).toBeExpanded();

		await act(async () => {
			jest.advanceTimersByTime(1);
		});
		expect(trigger()).not.toBeExpanded();
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
	});

	test("picking again restarts the close timer", async () => {
		await renderWithProviders(<Rail closeDelay={300} defaultOpen />);

		await pickRow("Pricing");
		await act(async () => {
			jest.advanceTimersByTime(200);
		});
		await pickRow("Overview");
		await act(async () => {
			jest.advanceTimersByTime(200);
		});
		expect(trigger()).toBeExpanded();

		await act(async () => {
			jest.advanceTimersByTime(100);
		});
		expect(trigger()).not.toBeExpanded();
	});

	test("controlled value: reports the pick and waits for the prop", async () => {
		const onValueChange = jest.fn();
		const view = await renderWithProviders(<Rail defaultOpen onValueChange={onValueChange} value="overview" />);

		await pickRow("Pricing");
		expect(onValueChange).toHaveBeenCalledWith("pricing");
		expect(spoken()).toBe("Overview");

		await view.rerender(<Rail defaultOpen onValueChange={onValueChange} value="pricing" />);
		expect(spoken()).toBe("Pricing");
	});

	test("value={undefined} stays controlled: a pick reports but does not move the rail", async () => {
		const onValueChange = jest.fn();
		const view = await renderWithProviders(<Rail defaultOpen onValueChange={onValueChange} value={undefined} />);

		await pickRow("Overview");
		expect(onValueChange).toHaveBeenCalledWith("overview");
		expect(spoken()).toBe("");

		await view.rerender(<Rail defaultOpen onValueChange={onValueChange} value="overview" />);
		expect(spoken()).toBe("Overview");
	});

	test("a row's own onPress runs after the pick", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<SectionRail defaultOpen defaultValue="a">
				<SectionRail.Trigger>
					<SectionRail.Bar value="a" />
					<SectionRail.Bar value="b" />
				</SectionRail.Trigger>
				<SectionRail.Content>
					<SectionRail.Item value="a">Alpha</SectionRail.Item>
					<SectionRail.Item onPress={onPress} value="b">
						Beta
					</SectionRail.Item>
				</SectionRail.Content>
			</SectionRail>
		);
		await pickRow("Beta");
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("a disabled row ignores activation", async () => {
		const onValueChange = jest.fn();
		await renderWithProviders(
			<SectionRail defaultOpen defaultValue="a" onValueChange={onValueChange}>
				<SectionRail.Trigger>
					<SectionRail.Bar value="a" />
					<SectionRail.Bar value="b" />
				</SectionRail.Trigger>
				<SectionRail.Content>
					<SectionRail.Item value="a">Alpha</SectionRail.Item>
					<SectionRail.Item disabled value="b">
						Beta
					</SectionRail.Item>
				</SectionRail.Content>
			</SectionRail>
		);
		const row = screen.getByRole("button", { name: "Beta" });
		expect(row).toBeDisabled();
		await fireEvent(row, "accessibilityTap");
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test("bars are hidden from assistive technology; the trigger is the only adjustable", async () => {
		await renderWithProviders(
			<SectionRail defaultValue="a">
				<SectionRail.Trigger>
					<SectionRail.Bar testID="bar-a" value="a" />
				</SectionRail.Trigger>
				<SectionRail.Content>
					<SectionRail.Item value="a">Alpha</SectionRail.Item>
				</SectionRail.Content>
			</SectionRail>
		);
		expect(screen.getByTestId("bar-a", ANY).props.accessibilityElementsHidden).toBe(true);
		expect(screen.getAllByRole("adjustable")).toHaveLength(1);
	});

	test("parts outside a SectionRail throw their documented error", async () => {
		const original = console.error;
		console.error = () => undefined;
		try {
			await expect(renderWithProviders(<SectionRail.Trigger />)).rejects.toThrow(
				"SectionRail.Trigger must be rendered inside a <SectionRail>."
			);
			await expect(renderWithProviders(<SectionRail.Bar value="a" />)).rejects.toThrow(
				"must be rendered inside a <SectionRail>."
			);
			await expect(renderWithProviders(<SectionRail.Content>{null}</SectionRail.Content>)).rejects.toThrow(
				"SectionRail.Content must be rendered inside a <SectionRail>."
			);
			await expect(renderWithProviders(<SectionRail.Item value="a">A</SectionRail.Item>)).rejects.toThrow(
				"SectionRail.Item must be rendered inside a <SectionRail>."
			);
		} finally {
			console.error = original;
		}
	});
});
