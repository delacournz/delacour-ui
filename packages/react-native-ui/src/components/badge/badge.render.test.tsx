import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { Platform, Text, View } from "react-native";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Badge } from "./badge";
import { useBadge } from "./badge.context";

function ContextProbe() {
	const { variant, color, size, isDisabled } = useBadge();
	return <Text testID="probe">{`${variant}|${color}|${size}|${isDisabled}`}</Text>;
}

const originalOS = Platform.OS;

/** `longpress` is an Android action — VoiceOver long-presses natively — and jest-expo runs as iOS. */
function setPlatform(os: "ios" | "android"): void {
	Object.defineProperty(Platform, "OS", { configurable: true, value: os });
}

afterEach(() => {
	setPlatform(originalOS === "android" ? "android" : "ios");
});

describe("Badge", () => {
	test("string children render as one label", async () => {
		await renderWithProviders(<Badge testID="badge">Active</Badge>);
		expect(screen.getByText("Active")).toBeOnTheScreen();
		expect(screen.getByTestId("badge")).toHaveTextContent("Active");
	});

	test("consecutive strings and numbers collapse into one label", async () => {
		await renderWithProviders(<Badge>{3} left</Badge>);
		expect(screen.getAllByText(/left/)).toHaveLength(1);
		expect(screen.getByText("3 left")).toBeOnTheScreen();
	});

	test("with no handler it is content, not a control", async () => {
		await renderWithProviders(<Badge>Active</Badge>);
		expect(screen.queryByRole("button")).not.toBeOnTheScreen();
	});

	test("forwards testID and accessibilityLabel to the plain root", async () => {
		await renderWithProviders(
			<Badge accessibilityLabel="Status: active" testID="badge">
				Active
			</Badge>
		);
		expect(screen.getByTestId("badge")).toHaveProp("accessibilityLabel", "Status: active");
	});

	test("onPress makes the root a button named by its label", async () => {
		const onPress = jest.fn();
		await renderWithProviders(<Badge onPress={onPress}>Filter</Badge>);
		const button = screen.getByRole("button", { name: "Filter" });
		await fireEvent(button, "accessibilityTap");
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("onLongPress makes the root a button and fires on Android's longpress action", async () => {
		setPlatform("android");
		const onLongPress = jest.fn();
		await renderWithProviders(<Badge onLongPress={onLongPress}>Filter</Badge>);
		await fireEvent(screen.getByRole("button", { name: "Filter" }), "accessibilityAction", {
			nativeEvent: { actionName: "longpress" },
		});
		expect(onLongPress).toHaveBeenCalledTimes(1);
	});

	test("isDisabled is announced and blocks onPress and onLongPress", async () => {
		setPlatform("android");
		const onPress = jest.fn();
		const onLongPress = jest.fn();
		await renderWithProviders(
			<Badge isDisabled onLongPress={onLongPress} onPress={onPress}>
				Filter
			</Badge>
		);
		const button = screen.getByRole("button", { name: "Filter" });
		expect(button).toBeDisabled();
		await fireEvent(button, "accessibilityTap");
		await fireEvent(button, "accessibilityAction", { nativeEvent: { actionName: "longpress" } });
		expect(onPress).not.toHaveBeenCalled();
		expect(onLongPress).not.toHaveBeenCalled();
	});

	describe("onClose", () => {
		test("composes a dismiss button named Remove by default", async () => {
			await renderWithProviders(<Badge onClose={() => undefined}>Tag</Badge>);
			expect(screen.getByRole("button", { name: "Remove" })).toBeOnTheScreen();
		});

		test("closeAccessibilityLabel renames it and closeTestID finds it", async () => {
			await renderWithProviders(
				<Badge closeAccessibilityLabel="Remove React" closeTestID="close" onClose={() => undefined}>
					React
				</Badge>
			);
			expect(screen.getByRole("button", { name: "Remove React" })).toBeOnTheScreen();
			expect(screen.getByTestId("close")).toBeOnTheScreen();
		});

		test("activating it calls onClose and never onPress", async () => {
			const onClose = jest.fn();
			const onPress = jest.fn();
			await renderWithProviders(
				<Badge onClose={onClose} onPress={onPress}>
					Tag
				</Badge>
			);
			await fireEvent(screen.getByRole("button", { name: "Remove" }), "accessibilityTap");
			expect(onClose).toHaveBeenCalledTimes(1);
			expect(onPress).not.toHaveBeenCalled();
		});

		test("an onClose-only badge is not itself a button", async () => {
			await renderWithProviders(<Badge onClose={() => undefined}>Tag</Badge>);
			expect(screen.getAllByRole("button")).toHaveLength(1);
		});

		test("isDisabled disables the dismiss control and blocks onClose", async () => {
			const onClose = jest.fn();
			await renderWithProviders(
				<Badge isDisabled onClose={onClose}>
					Tag
				</Badge>
			);
			const close = screen.getByRole("button", { name: "Remove" });
			expect(close).toBeDisabled();
			await fireEvent(close, "accessibilityTap");
			expect(onClose).not.toHaveBeenCalled();
		});

		test("no dismiss control without onClose", async () => {
			await renderWithProviders(<Badge onPress={() => undefined}>Tag</Badge>);
			expect(screen.queryByRole("button", { name: "Remove" })).not.toBeOnTheScreen();
		});
	});

	describe("compound parts", () => {
		test("Label, StartContent and EndContent render inside the root", async () => {
			await renderWithProviders(
				<Badge>
					<Badge.StartContent testID="start">
						<View testID="dot" />
					</Badge.StartContent>
					<Badge.Label>Premium</Badge.Label>
					<Badge.EndContent testID="end">
						<Text>9</Text>
					</Badge.EndContent>
				</Badge>
			);
			expect(screen.getByText("Premium")).toBeOnTheScreen();
			expect(screen.getByTestId("start")).toBeOnTheScreen();
			expect(screen.getByTestId("dot")).toBeOnTheScreen();
			expect(screen.getByTestId("end")).toBeOnTheScreen();
			expect(screen.getByText("9")).toBeOnTheScreen();
		});

		test("a hand-placed CloseButton fires its own onPress", async () => {
			const onPress = jest.fn();
			await renderWithProviders(
				<Badge>
					<Badge.Label>Tag</Badge.Label>
					<Badge.CloseButton accessibilityLabel="Dismiss" onPress={onPress} />
				</Badge>
			);
			await fireEvent(screen.getByRole("button", { name: "Dismiss" }), "accessibilityTap");
			expect(onPress).toHaveBeenCalledTimes(1);
		});

		test("children read the badge's variant, colour, size and state through useBadge", async () => {
			await renderWithProviders(
				<Badge color="success" isDisabled size="lg" variant="soft">
					<ContextProbe />
				</Badge>
			);
			expect(screen.getByTestId("probe")).toHaveTextContent("soft|success|lg|true");
		});

		test("defaults are solid, default, md and enabled", async () => {
			await renderWithProviders(
				<Badge>
					<ContextProbe />
				</Badge>
			);
			expect(screen.getByTestId("probe")).toHaveTextContent("solid|default|md|false");
		});
	});

	describe("outside a Badge", () => {
		let errorSpy: ReturnType<typeof jest.spyOn>;

		beforeEach(() => {
			errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
		});

		afterEach(() => {
			errorSpy.mockRestore();
		});

		test("Badge.Label throws its documented error", async () => {
			await expect(renderWithProviders(<Badge.Label>Lonely</Badge.Label>)).rejects.toThrow(
				"Badge.Label must be rendered inside a <Badge>."
			);
		});

		test("Badge.CloseButton throws its documented error", async () => {
			await expect(renderWithProviders(<Badge.CloseButton />)).rejects.toThrow(
				"Badge.CloseButton must be rendered inside a <Badge>."
			);
		});

		test("useBadge throws its documented error", async () => {
			await expect(renderWithProviders(<ContextProbe />)).rejects.toThrow("useBadge must be called inside a <Badge>.");
		});
	});
});
