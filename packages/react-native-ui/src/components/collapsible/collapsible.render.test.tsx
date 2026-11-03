import { describe, expect, jest, test } from "@jest/globals";
import type { ReactElement } from "react";
import { Pressable, Text } from "react-native";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Collapsible } from "./collapsible";
import { useCollapsible } from "./collapsible.context";

function trigger(name = "Details") {
	return screen.getByRole("button", { name: new RegExp(name) });
}

async function activate(name = "Details"): Promise<void> {
	await fireEvent(trigger(name), "accessibilityTap");
}

async function silenced<T>(run: () => Promise<T>): Promise<T> {
	const original = console.error;
	console.error = () => undefined;
	try {
		return await run();
	} finally {
		console.error = original;
	}
}

function Body(): ReactElement {
	return (
		<>
			<Collapsible.Trigger>Details</Collapsible.Trigger>
			<Collapsible.Content>
				<Text>Body text</Text>
			</Collapsible.Content>
		</>
	);
}

function ExternalToggle(): ReactElement {
	const { isOpen, toggle } = useCollapsible();
	return (
		<Pressable accessibilityLabel="External" onPress={toggle}>
			<Text>{isOpen ? "open" : "closed"}</Text>
		</Pressable>
	);
}

// The `activate` accessibility action exists only on Android (Pressable adds it per platform) and
// Jest runs as iOS, so only the VoiceOver `accessibilityTap` path is driven here. Spring travel,
// panel height, fade and indicator rotation are animation and are not asserted.
describe("Collapsible", () => {
	test("renders a collapsed button trigger with no panel mounted", async () => {
		await renderWithProviders(
			<Collapsible>
				<Body />
			</Collapsible>
		);
		expect(trigger()).toBeOnTheScreen();
		expect(trigger()).toBeCollapsed();
		expect(screen.queryByText("Body text", { includeHiddenElements: true })).not.toBeOnTheScreen();
	});

	test("defaultOpen announces expanded and mounts the panel", async () => {
		await renderWithProviders(
			<Collapsible defaultOpen>
				<Body />
			</Collapsible>
		);
		expect(trigger()).toBeExpanded();
		expect(screen.getByText("Body text")).toBeOnTheScreen();
	});

	test("an activation expands it and the panel stays mounted but hidden once closed", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(
			<Collapsible onOpenChange={onOpenChange}>
				<Body />
			</Collapsible>
		);
		await activate();
		expect(trigger()).toBeExpanded();
		expect(screen.getByText("Body text")).toBeOnTheScreen();
		expect(onOpenChange).toHaveBeenLastCalledWith(true);

		await activate();
		expect(trigger()).toBeCollapsed();
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
		expect(screen.queryByText("Body text")).not.toBeOnTheScreen();
		expect(screen.getByText("Body text", { includeHiddenElements: true })).toBeOnTheScreen();
		expect(onOpenChange).toHaveBeenCalledTimes(2);
	});

	test("controlled: reports the change and waits for the isOpen prop", async () => {
		const onOpenChange = jest.fn();
		const view = await renderWithProviders(
			<Collapsible isOpen={false} onOpenChange={onOpenChange}>
				<Body />
			</Collapsible>
		);
		await activate();
		expect(onOpenChange).toHaveBeenCalledWith(true);
		expect(trigger()).toBeCollapsed();

		await view.rerender(
			<Collapsible isOpen onOpenChange={onOpenChange}>
				<Body />
			</Collapsible>
		);
		expect(trigger()).toBeExpanded();
		expect(screen.getByText("Body text")).toBeOnTheScreen();
	});

	test("controlled open: an activation asks to close and stays open until told", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(
			<Collapsible isOpen onOpenChange={onOpenChange}>
				<Body />
			</Collapsible>
		);
		await activate();
		expect(onOpenChange).toHaveBeenCalledWith(false);
		expect(trigger()).toBeExpanded();
	});

	test("isDisabled is announced and ignores activation without reporting", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(
			<Collapsible isDisabled onOpenChange={onOpenChange}>
				<Body />
			</Collapsible>
		);
		expect(trigger()).toBeDisabled();
		await activate();
		expect(trigger()).toBeCollapsed();
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	test("a disabled but open collapsible stays open and its panel stays readable", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(
			<Collapsible defaultOpen isDisabled onOpenChange={onOpenChange}>
				<Body />
			</Collapsible>
		);
		expect(trigger()).toBeDisabled();
		expect(trigger()).toBeExpanded();
		await activate();
		expect(trigger()).toBeExpanded();
		expect(screen.getByText("Body text")).toBeOnTheScreen();
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	test("a trigger holding a title and description is named by both", async () => {
		await renderWithProviders(
			<Collapsible>
				<Collapsible.Trigger>
					<Collapsible.Title>Shipping</Collapsible.Title>
					<Collapsible.Description>2 to 5 days</Collapsible.Description>
				</Collapsible.Trigger>
			</Collapsible>
		);
		expect(screen.getByRole("button", { name: /Shipping/ })).toBeOnTheScreen();
		expect(screen.getByText("2 to 5 days")).toBeOnTheScreen();
	});

	test("a custom indicator renders its render-function child with the open state", async () => {
		await renderWithProviders(
			<Collapsible>
				<Collapsible.Trigger>
					Details
					<Collapsible.Indicator isAnimated={false}>
						{({ isOpen }) => <Text>{isOpen ? "minus" : "plus"}</Text>}
					</Collapsible.Indicator>
				</Collapsible.Trigger>
				<Collapsible.Content>
					<Text>Body text</Text>
				</Collapsible.Content>
			</Collapsible>
		);
		expect(screen.getByText("plus")).toBeOnTheScreen();
		await activate();
		expect(screen.getByText("minus")).toBeOnTheScreen();
	});

	test("useCollapsible().toggle opens it from outside the trigger", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(
			<Collapsible onOpenChange={onOpenChange}>
				<Body />
				<ExternalToggle />
			</Collapsible>
		);
		await fireEvent.press(screen.getByLabelText("External"));
		expect(trigger()).toBeExpanded();
		expect(screen.getByText("open")).toBeOnTheScreen();
		expect(onOpenChange).toHaveBeenCalledWith(true);
	});

	test("a disabled collapsible refuses toggle() from outside the trigger", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(
			<Collapsible isDisabled onOpenChange={onOpenChange}>
				<Body />
				<ExternalToggle />
			</Collapsible>
		);
		await fireEvent.press(screen.getByLabelText("External"));
		expect(trigger()).toBeCollapsed();
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	test("a trigger outside a Collapsible throws its documented error", async () => {
		await expect(silenced(() => renderWithProviders(<Collapsible.Trigger>Lost</Collapsible.Trigger>))).rejects.toThrow(
			"Collapsible.Trigger must be rendered inside a <Collapsible>."
		);
	});

	test("a content panel outside a Collapsible throws its documented error", async () => {
		await expect(
			silenced(() =>
				renderWithProviders(
					<Collapsible.Content>
						<Text>Lost</Text>
					</Collapsible.Content>
				)
			)
		).rejects.toThrow("Collapsible.Content must be rendered inside a <Collapsible>.");
	});

	test("an indicator outside a Collapsible throws its documented error", async () => {
		await expect(silenced(() => renderWithProviders(<Collapsible.Indicator />))).rejects.toThrow(
			"Collapsible.Indicator must be rendered inside a <Collapsible>."
		);
	});

	test("useCollapsible outside a Collapsible throws its documented error", async () => {
		function Lost(): ReactElement {
			useCollapsible();
			return <Text>never</Text>;
		}
		await expect(silenced(() => renderWithProviders(<Lost />))).rejects.toThrow(
			"useCollapsible must be called inside a <Collapsible>."
		);
	});
});
