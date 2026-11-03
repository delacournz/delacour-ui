import { afterEach, describe, expect, jest, test } from "@jest/globals";
import { Platform, Text } from "react-native";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Pressable } from "./pressable";

const ACTIVATE = { nativeEvent: { actionName: "activate" } };
const LONG_PRESS = { nativeEvent: { actionName: "longpress" } };

const originalOS = Platform.OS;

function setPlatform(os: "ios" | "android"): void {
	Object.defineProperty(Platform, "OS", { configurable: true, value: os });
}

afterEach(() => {
	setPlatform(originalOS === "android" ? "android" : "ios");
});

describe("Pressable", () => {
	test("is a button with its content as the accessible name", async () => {
		await renderWithProviders(
			<Pressable>
				<Text>Save</Text>
			</Pressable>
		);
		expect(screen.getByRole("button", { name: "Save" })).toBeOnTheScreen();
	});

	test("accessibilityLabel overrides the content as the name", async () => {
		await renderWithProviders(
			<Pressable accessibilityLabel="Close">
				<Text>x</Text>
			</Pressable>
		);
		expect(screen.getByRole("button", { name: "Close" })).toBeOnTheScreen();
	});

	test("an assistive activation on iOS calls onPress", async () => {
		const onPress = jest.fn();
		await renderWithProviders(<Pressable accessibilityLabel="Go" onPress={onPress} />);
		await fireEvent(screen.getByRole("button", { name: "Go" }), "accessibilityTap");
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("on Android the activate action calls onPress", async () => {
		setPlatform("android");
		const onPress = jest.fn();
		await renderWithProviders(<Pressable accessibilityLabel="Go" onPress={onPress} />);
		await fireEvent(screen.getByRole("button", { name: "Go" }), "accessibilityAction", ACTIVATE);
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("on Android the longpress action calls onLongPress and not onPress", async () => {
		setPlatform("android");
		const onPress = jest.fn();
		const onLongPress = jest.fn();
		await renderWithProviders(<Pressable accessibilityLabel="Go" onLongPress={onLongPress} onPress={onPress} />);
		await fireEvent(screen.getByRole("button", { name: "Go" }), "accessibilityAction", LONG_PRESS);
		expect(onLongPress).toHaveBeenCalledTimes(1);
		expect(onPress).not.toHaveBeenCalled();
	});

	test("on iOS no longpress action is listed", async () => {
		await renderWithProviders(<Pressable accessibilityLabel="Go" onLongPress={jest.fn()} onPress={jest.fn()} />);
		const actions = screen.getByRole("button").props.accessibilityActions as { name: string }[] | undefined;
		expect(actions?.map((action) => action.name) ?? []).not.toContain("longpress");
	});

	test("disabled is announced and swallows every activation", async () => {
		const onPress = jest.fn();
		const onLongPress = jest.fn();
		await renderWithProviders(
			<Pressable accessibilityLabel="Go" disabled onLongPress={onLongPress} onPress={onPress} />
		);
		const control = screen.getByRole("button", { name: "Go" });
		expect(control).toBeDisabled();
		await fireEvent(control, "accessibilityTap");
		expect(onPress).not.toHaveBeenCalled();

		setPlatform("android");
		await renderWithProviders(
			<Pressable accessibilityLabel="Stop" disabled onLongPress={onLongPress} onPress={onPress} />
		);
		const android = screen.getByRole("button", { name: "Stop" });
		await fireEvent(android, "accessibilityAction", ACTIVATE);
		await fireEvent(android, "accessibilityAction", LONG_PRESS);
		expect(onPress).not.toHaveBeenCalled();
		expect(onLongPress).not.toHaveBeenCalled();
	});

	test("busy is announced as busy, not disabled, and swallows activation", async () => {
		const onPress = jest.fn();
		await renderWithProviders(<Pressable accessibilityLabel="Go" busy onPress={onPress} />);
		const control = screen.getByRole("button", { name: "Go" });
		expect(control).toBeBusy();
		expect(control).not.toBeDisabled();
		await fireEvent(control, "accessibilityTap");
		expect(onPress).not.toHaveBeenCalled();
	});

	test("a caller's accessibilityState busy survives without blocking the press", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<Pressable accessibilityLabel="Go" accessibilityState={{ busy: true }} onPress={onPress} />
		);
		const control = screen.getByRole("button", { name: "Go" });
		expect(control).toBeBusy();
		await fireEvent(control, "accessibilityTap");
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("a caller's accessibilityState cannot un-disable a disabled pressable", async () => {
		await renderWithProviders(<Pressable accessibilityLabel="Go" accessibilityState={{ disabled: false }} disabled />);
		expect(screen.getByRole("button")).toBeDisabled();
	});

	test("a caller's own onAccessibilityTap wins over onPress", async () => {
		const onPress = jest.fn();
		const onAccessibilityTap = jest.fn();
		await renderWithProviders(
			<Pressable accessibilityLabel="Go" onAccessibilityTap={onAccessibilityTap} onPress={onPress} />
		);
		await fireEvent(screen.getByRole("button"), "accessibilityTap");
		expect(onAccessibilityTap).toHaveBeenCalledTimes(1);
		expect(onPress).not.toHaveBeenCalled();
	});

	test("a caller's other accessibility actions reach its handler on Android", async () => {
		setPlatform("android");
		const onPress = jest.fn();
		const onAccessibilityAction = jest.fn();
		await renderWithProviders(
			<Pressable
				accessibilityActions={[{ label: "Archive", name: "archive" }]}
				accessibilityLabel="Go"
				onAccessibilityAction={onAccessibilityAction}
				onPress={onPress}
			/>
		);
		const control = screen.getByRole("button");
		await fireEvent(control, "accessibilityAction", { nativeEvent: { actionName: "archive" } });
		expect(onAccessibilityAction).toHaveBeenCalledTimes(1);
		expect(onPress).not.toHaveBeenCalled();

		await fireEvent(control, "accessibilityAction", ACTIVATE);
		expect(onPress).toHaveBeenCalledTimes(1);
		expect(onAccessibilityAction).toHaveBeenCalledTimes(1);
	});

	test("asChild renders into its child without a wrapper and keeps the press wiring", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<Pressable asChild onPress={onPress}>
				<Text accessibilityLabel="Child">Child</Text>
			</Pressable>
		);
		const control = screen.getByLabelText("Child");
		expect(control).toBeOnTheScreen();
		await fireEvent(control, "accessibilityTap");
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("asChild with more than one child throws its documented error", async () => {
		const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
		await expect(
			renderWithProviders(
				<Pressable asChild>
					<Text>a</Text>
					<Text>b</Text>
				</Pressable>
			)
		).rejects.toThrow("Pressable asChild expects exactly one child element, received 2");
		spy.mockRestore();
	});

	test("asChild with a text child throws its documented error", async () => {
		const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
		await expect(renderWithProviders(<Pressable asChild>{"plain"}</Pressable>)).rejects.toThrow(
			"Pressable asChild expects a single React element child"
		);
		spy.mockRestore();
	});
});
