import { describe, expect, jest, test } from "@jest/globals";
import type { ReactElement } from "react";
import { Text } from "react-native";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Accordion } from "./accordion";

function Sections({ isDisabledSecond = false }: { isDisabledSecond?: boolean }): ReactElement[] {
	return [
		<Accordion.Item key="a" value="a">
			<Accordion.Trigger>Shipping</Accordion.Trigger>
			<Accordion.Content>
				<Text>Shipping body</Text>
			</Accordion.Content>
		</Accordion.Item>,
		<Accordion.Item isDisabled={isDisabledSecond} key="b" value="b">
			<Accordion.Trigger>Returns</Accordion.Trigger>
			<Accordion.Content>
				<Text>Returns body</Text>
			</Accordion.Content>
		</Accordion.Item>,
	];
}

function trigger(name: string) {
	return screen.getByRole("button", { name: new RegExp(name) });
}

async function activate(name: string): Promise<void> {
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

// The `activate` accessibility action exists only on Android (Pressable adds it per platform) and
// Jest runs as iOS, so only the VoiceOver `accessibilityTap` path is driven here. Spring travel,
// panel height and fade are animation and are not asserted.
describe("Accordion", () => {
	test("renders a button per item, collapsed, with no panel mounted", async () => {
		await renderWithProviders(
			<Accordion>
				<Sections />
			</Accordion>
		);
		expect(trigger("Shipping")).toBeOnTheScreen();
		expect(trigger("Shipping")).toBeCollapsed();
		expect(trigger("Returns")).toBeCollapsed();
		expect(screen.queryByText("Shipping body", { includeHiddenElements: true })).not.toBeOnTheScreen();
	});

	test("defaultValue opens an item, announces it expanded and mounts its panel", async () => {
		await renderWithProviders(
			<Accordion defaultValue="b">
				<Sections />
			</Accordion>
		);
		expect(trigger("Returns")).toBeExpanded();
		expect(trigger("Shipping")).toBeCollapsed();
		expect(screen.getByText("Returns body")).toBeOnTheScreen();
	});

	test("an activation expands the item and a panel stays mounted but hidden once closed", async () => {
		await renderWithProviders(
			<Accordion>
				<Sections />
			</Accordion>
		);
		await activate("Shipping");
		expect(trigger("Shipping")).toBeExpanded();
		expect(screen.getByText("Shipping body")).toBeOnTheScreen();

		await activate("Shipping");
		expect(trigger("Shipping")).toBeCollapsed();
		expect(screen.queryByText("Shipping body")).not.toBeOnTheScreen();
		expect(screen.getByText("Shipping body", { includeHiddenElements: true })).toBeOnTheScreen();
	});

	test("single mode closes the open item when another opens", async () => {
		const onValueChange = jest.fn();
		await renderWithProviders(
			<Accordion defaultValue="a" onValueChange={onValueChange}>
				<Sections />
			</Accordion>
		);
		await activate("Returns");
		expect(trigger("Returns")).toBeExpanded();
		expect(trigger("Shipping")).toBeCollapsed();
		expect(onValueChange).toHaveBeenLastCalledWith("b");
	});

	test("single mode reports null when the open item closes", async () => {
		const onValueChange = jest.fn();
		await renderWithProviders(
			<Accordion defaultValue="a" onValueChange={onValueChange}>
				<Sections />
			</Accordion>
		);
		await activate("Shipping");
		expect(onValueChange).toHaveBeenLastCalledWith(null);
	});

	test("multiple mode keeps several open and reports the array", async () => {
		const onValueChange = jest.fn();
		await renderWithProviders(
			<Accordion onValueChange={onValueChange} selectionMode="multiple">
				<Sections />
			</Accordion>
		);
		await activate("Shipping");
		await activate("Returns");
		expect(trigger("Shipping")).toBeExpanded();
		expect(trigger("Returns")).toBeExpanded();
		expect(onValueChange).toHaveBeenLastCalledWith(["a", "b"]);

		await activate("Shipping");
		expect(trigger("Shipping")).toBeCollapsed();
		expect(onValueChange).toHaveBeenLastCalledWith(["b"]);
	});

	test("multiple mode defaultValue seeds several open items", async () => {
		await renderWithProviders(
			<Accordion defaultValue={["a", "b"]} selectionMode="multiple">
				<Sections />
			</Accordion>
		);
		expect(trigger("Shipping")).toBeExpanded();
		expect(trigger("Returns")).toBeExpanded();
	});

	test("isCollapsible={false} refuses to close the last open item and does not report it", async () => {
		const onValueChange = jest.fn();
		await renderWithProviders(
			<Accordion defaultValue="a" isCollapsible={false} onValueChange={onValueChange}>
				<Sections />
			</Accordion>
		);
		await activate("Shipping");
		expect(trigger("Shipping")).toBeExpanded();
		expect(onValueChange).not.toHaveBeenCalled();

		await activate("Returns");
		expect(trigger("Returns")).toBeExpanded();
		expect(onValueChange).toHaveBeenCalledWith("b");
	});

	test("isCollapsible={false} in multiple mode closes an item while another is open", async () => {
		const onValueChange = jest.fn();
		await renderWithProviders(
			<Accordion defaultValue={["a", "b"]} isCollapsible={false} onValueChange={onValueChange} selectionMode="multiple">
				<Sections />
			</Accordion>
		);
		await activate("Shipping");
		expect(trigger("Shipping")).toBeCollapsed();
		expect(onValueChange).toHaveBeenLastCalledWith(["b"]);

		await activate("Returns");
		expect(trigger("Returns")).toBeExpanded();
		expect(onValueChange).toHaveBeenCalledTimes(1);
	});

	test("controlled single: reports the change and waits for the value prop", async () => {
		const onValueChange = jest.fn();
		const view = await renderWithProviders(
			<Accordion onValueChange={onValueChange} value={null}>
				<Sections />
			</Accordion>
		);
		await activate("Shipping");
		expect(onValueChange).toHaveBeenCalledWith("a");
		expect(trigger("Shipping")).toBeCollapsed();

		await view.rerender(
			<Accordion onValueChange={onValueChange} value="a">
				<Sections />
			</Accordion>
		);
		expect(trigger("Shipping")).toBeExpanded();
	});

	test("controlled multiple: reports the array and waits for the value prop", async () => {
		const onValueChange = jest.fn();
		const view = await renderWithProviders(
			<Accordion onValueChange={onValueChange} selectionMode="multiple" value={["a"]}>
				<Sections />
			</Accordion>
		);
		await activate("Returns");
		expect(onValueChange).toHaveBeenCalledWith(["a", "b"]);
		expect(trigger("Returns")).toBeCollapsed();

		await view.rerender(
			<Accordion onValueChange={onValueChange} selectionMode="multiple" value={["a", "b"]}>
				<Sections />
			</Accordion>
		);
		expect(trigger("Returns")).toBeExpanded();
	});

	test("an item's isDisabled is announced and ignores activation", async () => {
		const onValueChange = jest.fn();
		await renderWithProviders(
			<Accordion onValueChange={onValueChange}>
				<Sections isDisabledSecond />
			</Accordion>
		);
		expect(trigger("Returns")).toBeDisabled();
		expect(trigger("Shipping")).toBeEnabled();
		await activate("Returns");
		expect(trigger("Returns")).toBeCollapsed();
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test("the accordion's isDisabled blocks every trigger, and an item can opt back in", async () => {
		const onValueChange = jest.fn();
		await renderWithProviders(
			<Accordion isDisabled onValueChange={onValueChange}>
				<Accordion.Item value="a">
					<Accordion.Trigger>Locked</Accordion.Trigger>
					<Accordion.Content>
						<Text>Locked body</Text>
					</Accordion.Content>
				</Accordion.Item>
				<Accordion.Item isDisabled={false} value="b">
					<Accordion.Trigger>Open</Accordion.Trigger>
					<Accordion.Content>
						<Text>Open body</Text>
					</Accordion.Content>
				</Accordion.Item>
			</Accordion>
		);
		expect(trigger("Locked")).toBeDisabled();
		expect(trigger("Open")).toBeEnabled();

		await activate("Locked");
		expect(onValueChange).not.toHaveBeenCalled();

		await activate("Open");
		expect(onValueChange).toHaveBeenCalledWith("b");
		expect(trigger("Open")).toBeExpanded();
	});

	test("a trigger holding a title and description is named by both", async () => {
		await renderWithProviders(
			<Accordion>
				<Accordion.Item value="a">
					<Accordion.Trigger>
						<Accordion.Title>Shipping</Accordion.Title>
						<Accordion.Description>2 to 5 days</Accordion.Description>
					</Accordion.Trigger>
					<Accordion.Content>
						<Text>Body</Text>
					</Accordion.Content>
				</Accordion.Item>
			</Accordion>
		);
		expect(screen.getByRole("button", { name: /Shipping/ })).toBeOnTheScreen();
		expect(screen.getByText("2 to 5 days")).toBeOnTheScreen();
	});

	test("a custom indicator renders its render-function child with the item's state", async () => {
		await renderWithProviders(
			<Accordion defaultValue="a">
				<Accordion.Item value="a">
					<Accordion.Trigger>
						Shipping
						<Accordion.Indicator>
							{({ isExpanded }) => <Text>{isExpanded ? "minus" : "plus"}</Text>}
						</Accordion.Indicator>
					</Accordion.Trigger>
					<Accordion.Content>
						<Text>Body</Text>
					</Accordion.Content>
				</Accordion.Item>
			</Accordion>
		);
		expect(screen.getByText("minus")).toBeOnTheScreen();
	});

	test("an item outside an Accordion throws its documented error", async () => {
		await expect(
			silenced(() =>
				renderWithProviders(
					<Accordion.Item value="a">
						<Accordion.Trigger>Lost</Accordion.Trigger>
					</Accordion.Item>
				)
			)
		).rejects.toThrow("Accordion.Item must be rendered inside an <Accordion>.");
	});

	test("a trigger outside an Accordion throws its documented error", async () => {
		await expect(silenced(() => renderWithProviders(<Accordion.Trigger>Lost</Accordion.Trigger>))).rejects.toThrow(
			"Accordion.Trigger must be rendered inside an <Accordion>."
		);
	});

	test("a trigger outside an item throws its documented error", async () => {
		await expect(
			silenced(() =>
				renderWithProviders(
					<Accordion>
						<Accordion.Trigger>Lost</Accordion.Trigger>
					</Accordion>
				)
			)
		).rejects.toThrow("Accordion.Trigger must be rendered inside an <Accordion.Item>.");
	});

	test("a content panel outside an item throws its documented error", async () => {
		await expect(
			silenced(() =>
				renderWithProviders(
					<Accordion>
						<Accordion.Content>
							<Text>Lost</Text>
						</Accordion.Content>
					</Accordion>
				)
			)
		).rejects.toThrow("Accordion.Content must be rendered inside an <Accordion.Item>.");
	});
});
