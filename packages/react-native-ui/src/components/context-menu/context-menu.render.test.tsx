import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { Platform, Text } from "react-native";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { ContextMenu, type ContextMenuProps } from "./context-menu";
import { ContextMenuContent } from "./context-menu-content";
import { ContextMenuTrigger } from "./context-menu-trigger";

const longPress = (el: ReturnType<typeof screen.getByLabelText>) =>
	fireEvent(el, "accessibilityAction", { nativeEvent: { actionName: "longpress" } });
const activate = (el: ReturnType<typeof screen.getByLabelText>) =>
	fireEvent(el, "accessibilityAction", { nativeEvent: { actionName: "activate" } });

type MessageProps = Omit<ContextMenuProps, "children"> & {
	onPress?: () => void;
	isDisabled?: boolean;
	onShare?: () => void;
	withPreview?: boolean;
};

function Message({ onPress, isDisabled, onShare, withPreview, ...root }: MessageProps) {
	return (
		<ContextMenu {...root}>
			<ContextMenu.Trigger accessibilityLabel="Message" isDisabled={isDisabled} onPress={onPress}>
				<Text>Hello there</Text>
			</ContextMenu.Trigger>
			<ContextMenu.Content>
				{withPreview ? <ContextMenu.Preview /> : null}
				<ContextMenu.Label>Actions</ContextMenu.Label>
				<ContextMenu.Item onSelect={onShare}>Share</ContextMenu.Item>
				<ContextMenu.Separator />
				<ContextMenu.Item isDisabled variant="destructive">
					Delete
				</ContextMenu.Item>
			</ContextMenu.Content>
		</ContextMenu>
	);
}

/**
 * Layout and measurement never resolve under Jest, and a hold cannot be driven: the trigger's ref
 * is null under RNTL v14's renderer (no `createNodeMock`), so the open that follows a hold or a
 * screen-reader `longpress` returns before it measures and is not reached here. Anchoring,
 * placement and the preview's frame are covered as pure logic in `context-menu.variants.test.ts`.
 * What is tested is the trigger's semantics, the press path, the controlled and uncontrolled open
 * state, and the rows. The accessibility actions are Android-shaped, hence `Platform.OS`.
 */
describe("ContextMenu", () => {
	const originalOS = Platform.OS;
	beforeEach(() => {
		Platform.OS = "android";
	});
	afterEach(() => {
		Platform.OS = originalOS;
		jest.restoreAllMocks();
	});

	test("renders the held content and no panel until opened", async () => {
		await renderWithProviders(<Message />);
		expect(screen.getByText("Hello there")).toBeOnTheScreen();
		expect(screen.queryByRole("menuitem", { name: "Share" })).not.toBeOnTheScreen();
	});

	test("without onPress the trigger is not a button; with it, it is", async () => {
		const { unmount } = await renderWithProviders(<Message />);
		expect(screen.queryByRole("button", { name: "Message" })).not.toBeOnTheScreen();
		await unmount();
		await renderWithProviders(<Message onPress={jest.fn()} />);
		expect(screen.getByRole("button", { name: "Message" })).toBeOnTheScreen();
	});

	test("the trigger announces collapsed, and disabled when it is", async () => {
		await renderWithProviders(<Message isDisabled onPress={jest.fn()} />);
		const trigger = screen.getByRole("button", { name: "Message" });
		expect(trigger).toBeCollapsed();
		expect(trigger).toBeDisabled();
	});

	test("defaultOpen shows the menu with its rows, label and separator", async () => {
		await renderWithProviders(<Message defaultOpen />);
		expect(screen.getByRole("menuitem", { name: "Share" })).toBeOnTheScreen();
		expect(screen.getByRole("menuitem", { name: "Share" })).toBeOnTheScreen();
		expect(screen.getByText("Actions")).toBeOnTheScreen();
	});

	test("a disabled row announces disabled", async () => {
		await renderWithProviders(<Message defaultOpen />);
		expect(screen.getByRole("menuitem", { name: "Delete" })).toBeDisabled();
		expect(screen.getByRole("menuitem", { name: "Share" })).not.toBeDisabled();
	});

	test("an assistive activation of a row runs onSelect and closes, reporting false", async () => {
		const onSelect = jest.fn();
		const onOpenChange = jest.fn();
		await renderWithProviders(<Message defaultOpen onOpenChange={onOpenChange} onShare={onSelect} />);
		await activate(screen.getByRole("menuitem", { name: "Share" }));
		expect(onSelect).toHaveBeenCalledTimes(1);
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
	});

	test("a disabled row does not select", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<Message defaultOpen onOpenChange={onOpenChange} />);
		await activate(screen.getByRole("menuitem", { name: "Delete" }));
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	test("the activate action runs onPress and does not open", async () => {
		const onPress = jest.fn();
		const onOpenChange = jest.fn();
		await renderWithProviders(<Message onOpenChange={onOpenChange} onPress={onPress} />);
		await activate(screen.getByRole("button", { name: "Message" }));
		expect(onPress).toHaveBeenCalledTimes(1);
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	test("a disabled trigger runs nothing", async () => {
		const onPress = jest.fn();
		const onOpenChange = jest.fn();
		await renderWithProviders(<Message isDisabled onOpenChange={onOpenChange} onPress={onPress} />);
		const trigger = screen.getByRole("button", { name: "Message" });
		await activate(trigger);
		await longPress(trigger);
		expect(onPress).not.toHaveBeenCalled();
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	test("the longpress action never runs onPress", async () => {
		const onPress = jest.fn();
		await renderWithProviders(<Message onPress={onPress} />);
		await longPress(screen.getByRole("button", { name: "Message" }));
		expect(onPress).not.toHaveBeenCalled();
	});

	test("the trigger exposes the activate and longpress ('Show menu') actions", async () => {
		await renderWithProviders(<Message onPress={jest.fn()} />);
		expect(screen.getByRole("button", { name: "Message" }).props.accessibilityActions).toEqual([
			{ name: "activate" },
			{ label: "Show menu", name: "longpress" },
		]);
	});

	test("controlled: isOpen decides, so the menu waits for the prop", async () => {
		const onOpenChange = jest.fn();
		const { rerender } = await renderWithProviders(<Message isOpen={false} onOpenChange={onOpenChange} />);
		expect(screen.queryByRole("menuitem", { name: "Share" })).not.toBeOnTheScreen();
		await rerender(<Message isOpen onOpenChange={onOpenChange} />);
		expect(screen.getByRole("menuitem", { name: "Share" })).toBeOnTheScreen();
		await activate(screen.getByRole("menuitem", { name: "Share" }));
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
		expect(screen.getByRole("menuitem", { name: "Share" })).toBeOnTheScreen();
	});

	test("a Preview among the rows is lifted out and leaves the rows intact", async () => {
		await renderWithProviders(<Message defaultOpen withPreview />);
		expect(screen.getByText("Hello there")).toBeOnTheScreen();
		expect(screen.getByText("Actions")).toBeOnTheScreen();
		expect(screen.getByRole("menuitem", { name: "Share" })).toBeOnTheScreen();
	});

	test("the Trigger outside a ContextMenu throws its documented error", async () => {
		const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
		await expect(
			renderWithProviders(
				<ContextMenuTrigger>
					<Text>x</Text>
				</ContextMenuTrigger>
			)
		).rejects.toThrow("ContextMenu.Trigger must be used inside");
		spy.mockRestore();
	});

	test("the Content outside a ContextMenu throws", async () => {
		const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
		await expect(
			renderWithProviders(
				<ContextMenuContent>
					<Text>x</Text>
				</ContextMenuContent>
			)
		).rejects.toThrow("must be used inside");
		spy.mockRestore();
	});
});
