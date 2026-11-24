import { describe, expect, jest, test } from "@jest/globals";
import type { ComponentProps, ReactElement } from "react";
import { Text } from "react-native";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Tabs } from "./tabs";

type BarProps = Omit<ComponentProps<typeof Tabs>, "children"> & { disabledValue?: string };

/** Three tabs and their panels; `disabledValue` disables one trigger. */
function Bar({ disabledValue, ...props }: BarProps): ReactElement {
	return (
		<Tabs {...props}>
			<Tabs.List testID="tablist">
				<Tabs.Indicator />
				<Tabs.Trigger value="one">One</Tabs.Trigger>
				<Tabs.Trigger isDisabled={disabledValue === "two"} value="two">
					Two
				</Tabs.Trigger>
				<Tabs.Trigger isDisabled={disabledValue === "three"} value="three">
					Three
				</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="one">
				<Text>Panel one</Text>
			</Tabs.Content>
			<Tabs.Content value="two">
				<Text>Panel two</Text>
			</Tabs.Content>
			<Tabs.Content value="three">
				<Text>Panel three</Text>
			</Tabs.Content>
		</Tabs>
	);
}

async function activate(name: string): Promise<void> {
	await fireEvent(screen.getByRole("tab", { name }), "accessibilityTap");
}

/** Swaps console.error for a no-op while a render that is expected to throw runs. */
async function expectThrows(ui: ReactElement, message: string): Promise<void> {
	const original = console.error;
	console.error = () => undefined;
	try {
		await expect(renderWithProviders(ui)).rejects.toThrow(message);
	} finally {
		console.error = original;
	}
}

// The tablist is a non-accessible container (making it accessible would swallow its tabs into one
// element), so role queries cannot reach it and its role is asserted by prop. The sideways pan that swipes between panels is a worklet-driven Gesture Handler pan writing a
// Reanimated shared value on the UI thread; Jest has neither, so swiping, the indicator's frame and
// the label crossfade are verified in the playground's swipe demos instead.
describe("Tabs", () => {
	test("is a tablist of tabs with accessible names", async () => {
		await renderWithProviders(<Bar />);
		expect(screen.getByTestId("tablist")).toHaveProp("accessibilityRole", "tablist");
		expect(screen.getAllByRole("tab")).toHaveLength(3);
		expect(screen.getByRole("tab", { name: "Two" })).toBeOnTheScreen();
	});

	test("the first tab is selected by default and the others are not", async () => {
		await renderWithProviders(<Bar />);
		expect(screen.getByRole("tab", { name: "One" })).toBeSelected();
		expect(screen.getByRole("tab", { name: "Two" })).not.toBeSelected();
		expect(screen.getByRole("tab", { name: "Three" })).not.toBeSelected();
	});

	test("defaultValue seeds the selection", async () => {
		await renderWithProviders(<Bar defaultValue="three" />);
		expect(screen.getByRole("tab", { name: "Three" })).toBeSelected();
		expect(screen.getByRole("tab", { name: "One" })).not.toBeSelected();
	});

	test("uncontrolled: an activation selects the tab and reports its value", async () => {
		const onValueChange = jest.fn();
		await renderWithProviders(<Bar onValueChange={onValueChange} />);
		await activate("Two");
		expect(screen.getByRole("tab", { name: "Two" })).toBeSelected();
		expect(screen.getByRole("tab", { name: "One" })).not.toBeSelected();
		expect(onValueChange).toHaveBeenCalledTimes(1);
		expect(onValueChange).toHaveBeenCalledWith("two");
	});

	test("re-activating the selected tab does not report a change", async () => {
		const onValueChange = jest.fn();
		await renderWithProviders(<Bar onValueChange={onValueChange} />);
		await activate("One");
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test("a trigger's own onPress still runs for a re-press of the selected tab", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<Tabs>
				<Tabs.List>
					<Tabs.Trigger onPress={onPress} value="one">
						One
					</Tabs.Trigger>
					<Tabs.Trigger value="two">Two</Tabs.Trigger>
				</Tabs.List>
			</Tabs>
		);
		await activate("One");
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("controlled: reports the change and waits for the prop", async () => {
		const onValueChange = jest.fn();
		const view = await renderWithProviders(<Bar onValueChange={onValueChange} value="one" />);
		await activate("Two");
		expect(onValueChange).toHaveBeenCalledWith("two");
		expect(screen.getByRole("tab", { name: "One" })).toBeSelected();
		expect(screen.getByRole("tab", { name: "Two" })).not.toBeSelected();

		await view.rerender(<Bar onValueChange={onValueChange} value="two" />);
		expect(screen.getByRole("tab", { name: "Two" })).toBeSelected();
		expect(screen.getByRole("tab", { name: "One" })).not.toBeSelected();
	});

	test("controlled null selects nothing", async () => {
		await renderWithProviders(<Bar value={null} />);
		for (const tab of screen.getAllByRole("tab")) {
			expect(tab).not.toBeSelected();
		}
	});

	test("a disabled trigger is announced and ignores activation", async () => {
		const onValueChange = jest.fn();
		await renderWithProviders(<Bar disabledValue="two" onValueChange={onValueChange} />);
		const disabled = screen.getByRole("tab", { name: "Two" });
		expect(disabled).toBeDisabled();
		expect(screen.getByRole("tab", { name: "One" })).not.toBeDisabled();
		await activate("Two");
		expect(onValueChange).not.toHaveBeenCalled();
		expect(disabled).not.toBeSelected();
	});

	test("isDisabled on the root disables every trigger, and a trigger can opt back in", async () => {
		const onValueChange = jest.fn();
		await renderWithProviders(
			<Tabs isDisabled onValueChange={onValueChange}>
				<Tabs.List>
					<Tabs.Trigger value="one">One</Tabs.Trigger>
					<Tabs.Trigger value="two">Two</Tabs.Trigger>
					<Tabs.Trigger isDisabled={false} value="three">
						Three
					</Tabs.Trigger>
				</Tabs.List>
			</Tabs>
		);
		expect(screen.getByRole("tab", { name: "One" })).toBeDisabled();
		expect(screen.getByRole("tab", { name: "Two" })).toBeDisabled();
		expect(screen.getByRole("tab", { name: "Three" })).not.toBeDisabled();

		await activate("Two");
		expect(onValueChange).not.toHaveBeenCalled();
		await activate("Three");
		expect(onValueChange).toHaveBeenCalledWith("three");
	});

	test("every panel is mounted, and only the selected one is exposed to assistive technology", async () => {
		await renderWithProviders(<Bar />);
		const visible = screen.getByText("Panel one");
		expect(visible).toBeOnTheScreen();
		expect(screen.getByText("Panel two", { includeHiddenElements: true })).toBeOnTheScreen();
		expect(screen.queryByText("Panel two")).not.toBeOnTheScreen();
		expect(screen.queryByText("Panel three")).not.toBeOnTheScreen();

		await activate("Two");
		expect(screen.getByText("Panel two")).toBeOnTheScreen();
		expect(screen.queryByText("Panel one")).not.toBeOnTheScreen();
	});

	test("a Content function child receives its selected state", async () => {
		await renderWithProviders(
			<Tabs>
				<Tabs.List>
					<Tabs.Trigger value="one">One</Tabs.Trigger>
					<Tabs.Trigger value="two">Two</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="one">{({ isSelected }) => (isSelected ? <Text>One is live</Text> : null)}</Tabs.Content>
				<Tabs.Content value="two">{({ isSelected }) => (isSelected ? <Text>Two is live</Text> : null)}</Tabs.Content>
			</Tabs>
		);
		expect(screen.getByText("One is live")).toBeOnTheScreen();
		expect(screen.queryByText("Two is live")).not.toBeOnTheScreen();

		await activate("Two");
		expect(screen.getByText("Two is live")).toBeOnTheScreen();
		expect(screen.queryByText("One is live")).not.toBeOnTheScreen();
	});

	test("a Trigger function child receives its settled state", async () => {
		await renderWithProviders(
			<Tabs defaultValue="one">
				<Tabs.List>
					<Tabs.Trigger accessibilityLabel="Inbox" value="one">
						{({ isSelected }) => <Text>{isSelected ? "on" : "off"}</Text>}
					</Tabs.Trigger>
					<Tabs.Trigger accessibilityLabel="Sent" value="two">
						{({ isSelected }) => <Text>{isSelected ? "on" : "off"}</Text>}
					</Tabs.Trigger>
				</Tabs.List>
			</Tabs>
		);
		expect(screen.getByRole("tab", { name: "Inbox" })).toHaveTextContent("on");
		expect(screen.getByRole("tab", { name: "Sent" })).toHaveTextContent("off");
		await activate("Sent");
		expect(screen.getByRole("tab", { name: "Sent" })).toHaveTextContent("on");
	});

	test("triggers work without panels, as a filter row", async () => {
		const onValueChange = jest.fn();
		await renderWithProviders(
			<Tabs defaultValue="all" onValueChange={onValueChange}>
				<Tabs.List>
					<Tabs.Trigger value="all">All</Tabs.Trigger>
					<Tabs.Trigger value="open">Open</Tabs.Trigger>
				</Tabs.List>
			</Tabs>
		);
		await activate("Open");
		expect(onValueChange).toHaveBeenCalledWith("open");
		expect(screen.getByRole("tab", { name: "Open" })).toBeSelected();
	});

	test("a panel-less bar with no defaultValue selects its first tab after mount", async () => {
		const onValueChange = jest.fn();
		await renderWithProviders(
			<Tabs onValueChange={onValueChange}>
				<Tabs.List>
					<Tabs.Trigger value="all">All</Tabs.Trigger>
					<Tabs.Trigger value="open">Open</Tabs.Trigger>
				</Tabs.List>
			</Tabs>
		);
		expect(screen.getByRole("tab", { name: "All" })).toBeSelected();
		expect(screen.getByRole("tab", { name: "Open" })).not.toBeSelected();
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test("a panel-less controlled null stays unselected", async () => {
		await renderWithProviders(
			<Tabs value={null}>
				<Tabs.List>
					<Tabs.Trigger value="all">All</Tabs.Trigger>
					<Tabs.Trigger value="open">Open</Tabs.Trigger>
				</Tabs.List>
			</Tabs>
		);
		for (const tab of screen.getAllByRole("tab")) {
			expect(tab).not.toBeSelected();
		}
	});

	test("a trigger added later does not steal the first tab's selection", async () => {
		const view = await renderWithProviders(
			<Tabs>
				<Tabs.List>
					<Tabs.Trigger value="b">B</Tabs.Trigger>
				</Tabs.List>
			</Tabs>
		);
		expect(screen.getByRole("tab", { name: "B" })).toBeSelected();
		await view.rerender(
			<Tabs>
				<Tabs.List>
					<Tabs.Trigger value="a">A</Tabs.Trigger>
					<Tabs.Trigger value="b">B</Tabs.Trigger>
				</Tabs.List>
			</Tabs>
		);
		expect(screen.getByRole("tab", { name: "B" })).toBeSelected();
		expect(screen.getByRole("tab", { name: "A" })).not.toBeSelected();
	});

	test("variant, size and isSwipeable leave the semantics intact", async () => {
		await renderWithProviders(<Bar isSwipeable={false} size="lg" variant="secondary" />);
		expect(screen.getAllByRole("tab")).toHaveLength(3);
		expect(screen.getByRole("tab", { name: "One" })).toBeSelected();
		await activate("Three");
		expect(screen.getByRole("tab", { name: "Three" })).toBeSelected();
	});

	test("Tabs.ScrollView renders its triggers", async () => {
		await renderWithProviders(
			<Tabs>
				<Tabs.List>
					<Tabs.ScrollView>
						<Tabs.Indicator />
						<Tabs.Trigger value="one">One</Tabs.Trigger>
						<Tabs.Trigger value="two">Two</Tabs.Trigger>
					</Tabs.ScrollView>
				</Tabs.List>
			</Tabs>
		);
		expect(screen.getAllByRole("tab")).toHaveLength(2);
		await activate("Two");
		expect(screen.getByRole("tab", { name: "Two" })).toBeSelected();
	});

	test("a Trigger outside Tabs throws its documented error", async () => {
		await expectThrows(<Tabs.Trigger value="one">One</Tabs.Trigger>, "Tabs.Trigger must be rendered inside a <Tabs>.");
	});

	test("a Content outside Tabs throws its documented error", async () => {
		await expectThrows(
			<Tabs.Content value="one">
				<Text>x</Text>
			</Tabs.Content>,
			"Tabs.Content must be rendered inside a <Tabs>."
		);
	});

	test("a Trigger inside Tabs but outside Tabs.List throws its documented error", async () => {
		await expectThrows(
			<Tabs>
				<Tabs.Trigger value="one">One</Tabs.Trigger>
			</Tabs>,
			"Tabs.Trigger must be rendered inside a <Tabs.List>."
		);
	});
});
