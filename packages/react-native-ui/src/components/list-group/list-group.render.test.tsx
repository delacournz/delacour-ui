import { describe, expect, jest, test } from "@jest/globals";
import { Platform, Text } from "react-native";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Separator } from "../separator";
import { ListGroup } from "./list-group";

const ACTIVATE = { nativeEvent: { actionName: "activate" } };

/** `activate` and `longpress` are Android actions the pressable only wires there, so those tests switch the platform. */
async function withPlatform(os: "android" | "ios", run: () => Promise<void>): Promise<void> {
	const original = Platform.OS;
	Platform.OS = os;
	try {
		await run();
	} finally {
		Platform.OS = original;
	}
}

describe("ListGroup", () => {
	test("renders its rows and their text", async () => {
		await renderWithProviders(
			<ListGroup>
				<ListGroup.Item>Wi-Fi</ListGroup.Item>
				<ListGroup.Item>Bluetooth</ListGroup.Item>
			</ListGroup>
		);
		expect(screen.getByText("Wi-Fi")).toBeOnTheScreen();
		expect(screen.getByText("Bluetooth")).toBeOnTheScreen();
	});

	test("every compound part renders inside the root", async () => {
		await renderWithProviders(
			<ListGroup>
				<ListGroup.Item onPress={jest.fn()}>
					<ListGroup.ItemPrefix>
						<Text>prefix</Text>
					</ListGroup.ItemPrefix>
					<ListGroup.ItemContent>
						<ListGroup.ItemTitle>Personal info</ListGroup.ItemTitle>
						<ListGroup.ItemDescription>Name, email</ListGroup.ItemDescription>
					</ListGroup.ItemContent>
					<ListGroup.ItemSuffix>
						<Text>suffix</Text>
					</ListGroup.ItemSuffix>
				</ListGroup.Item>
			</ListGroup>
		);
		expect(screen.getByText("prefix")).toBeOnTheScreen();
		expect(screen.getByText("Personal info")).toBeOnTheScreen();
		expect(screen.getByText("Name, email")).toBeOnTheScreen();
		expect(screen.getByText("suffix")).toBeOnTheScreen();
	});

	test("consecutive string children collapse into one title", async () => {
		await renderWithProviders(
			<ListGroup>
				<ListGroup.Item>Row {3}</ListGroup.Item>
			</ListGroup>
		);
		expect(screen.getByText("Row 3")).toBeOnTheScreen();
	});

	test("asChild passes its child through untouched", async () => {
		await renderWithProviders(
			<ListGroup>
				<ListGroup.Item asChild onPress={jest.fn()}>
					<Text>Custom</Text>
				</ListGroup.Item>
			</ListGroup>
		);
		expect(screen.getByText("Custom")).toBeOnTheScreen();
	});

	describe("item semantics", () => {
		test("a row with onPress is a button and activates", async () => {
			const onPress = jest.fn();
			await renderWithProviders(
				<ListGroup>
					<ListGroup.Item onPress={onPress}>Wi-Fi</ListGroup.Item>
				</ListGroup>
			);
			const row = screen.getByRole("button", { name: "Wi-Fi" });
			await fireEvent(row, "accessibilityTap");
			expect(onPress).toHaveBeenCalledTimes(1);
		});

		test("on Android the activate action reaches onPress", async () => {
			const onPress = jest.fn();
			await withPlatform("android", async () => {
				await renderWithProviders(
					<ListGroup>
						<ListGroup.Item onPress={onPress}>Wi-Fi</ListGroup.Item>
					</ListGroup>
				);
				await fireEvent(screen.getByRole("button", { name: "Wi-Fi" }), "accessibilityAction", ACTIVATE);
			});
			expect(onPress).toHaveBeenCalledTimes(1);
		});

		test("a row with onLongPress alone is a button and long-presses", async () => {
			const onLongPress = jest.fn();
			await withPlatform("android", async () => {
				await renderWithProviders(
					<ListGroup>
						<ListGroup.Item onLongPress={onLongPress}>Wi-Fi</ListGroup.Item>
					</ListGroup>
				);
				await fireEvent(screen.getByRole("button", { name: "Wi-Fi" }), "accessibilityAction", {
					nativeEvent: { actionName: "longpress" },
				});
			});
			expect(onLongPress).toHaveBeenCalledTimes(1);
		});

		test("a row with no handler is not a button", async () => {
			await renderWithProviders(
				<ListGroup>
					<ListGroup.Item>Version 1.0</ListGroup.Item>
				</ListGroup>
			);
			expect(screen.queryByRole("button")).not.toBeOnTheScreen();
			expect(screen.getByText("Version 1.0")).toBeOnTheScreen();
		});

		test("isDisabled keeps the button role, reports disabled and ignores activation", async () => {
			const onPress = jest.fn();
			await renderWithProviders(
				<ListGroup>
					<ListGroup.Item isDisabled onPress={onPress}>
						Wi-Fi
					</ListGroup.Item>
				</ListGroup>
			);
			const row = screen.getByRole("button", { name: "Wi-Fi" });
			expect(row).toBeDisabled();
			await fireEvent(row, "accessibilityTap");
			await fireEvent(row, "accessibilityAction", ACTIVATE);
			expect(onPress).not.toHaveBeenCalled();
		});

		test("a disabled static row reports disabled without a role", async () => {
			await renderWithProviders(
				<ListGroup>
					<ListGroup.Item accessibilityLabel="Version" isDisabled testID="static-row">
						Version 1.0
					</ListGroup.Item>
				</ListGroup>
			);
			expect(screen.queryByRole("button")).not.toBeOnTheScreen();
			expect(screen.getByTestId("static-row").props.accessibilityState).toMatchObject({ disabled: true });
		});

		test("busy is announced and blocks activation", async () => {
			const onPress = jest.fn();
			await renderWithProviders(
				<ListGroup>
					<ListGroup.Item busy onPress={onPress}>
						Sync
					</ListGroup.Item>
				</ListGroup>
			);
			const row = screen.getByRole("button", { name: "Sync" });
			expect(row).toBeBusy();
			await fireEvent(row, "accessibilityTap");
			expect(onPress).not.toHaveBeenCalled();
		});

		test("a caller accessibilityState merges into a pressable row", async () => {
			await renderWithProviders(
				<ListGroup>
					<ListGroup.Item accessibilityState={{ selected: true }} onPress={jest.fn()}>
						Wi-Fi
					</ListGroup.Item>
				</ListGroup>
			);
			expect(screen.getByRole("button", { name: "Wi-Fi" })).toBeSelected();
		});
	});

	describe("dividers", () => {
		test("a divider sits between adjacent rows only", async () => {
			await renderWithProviders(
				<ListGroup testID="group">
					<ListGroup.Item>One</ListGroup.Item>
					<ListGroup.Item>Two</ListGroup.Item>
					<ListGroup.Item>Three</ListGroup.Item>
				</ListGroup>
			);
			expect(screen.getByTestId("group").children).toHaveLength(5);
		});

		test("isDivided={false} inserts none", async () => {
			await renderWithProviders(
				<ListGroup isDivided={false} testID="group">
					<ListGroup.Item>One</ListGroup.Item>
					<ListGroup.Item>Two</ListGroup.Item>
				</ListGroup>
			);
			expect(screen.getByTestId("group").children).toHaveLength(2);
		});

		test("a hand-placed Separator suppresses the automatic one on either side", async () => {
			await renderWithProviders(
				<ListGroup testID="group">
					<ListGroup.Item>One</ListGroup.Item>
					<Separator />
					<ListGroup.Item>Two</ListGroup.Item>
					<ListGroup.Item>Three</ListGroup.Item>
				</ListGroup>
			);
			expect(screen.getByTestId("group").children).toHaveLength(5);
		});

		test("a conditional row that renders nothing strands no divider", async () => {
			const show = false as boolean;
			await renderWithProviders(
				<ListGroup testID="group">
					<ListGroup.Item>One</ListGroup.Item>
					{show ? <ListGroup.Item>Hidden</ListGroup.Item> : null}
				</ListGroup>
			);
			expect(screen.getByTestId("group").children).toHaveLength(1);
		});
	});

	describe("variants and sizes", () => {
		test.each(["default", "secondary", "tertiary", "transparent"] as const)(
			"variant %s renders its rows",
			async (variant) => {
				await renderWithProviders(
					<ListGroup variant={variant}>
						<ListGroup.Item onPress={jest.fn()}>Wi-Fi</ListGroup.Item>
					</ListGroup>
				);
				expect(screen.getByRole("button", { name: "Wi-Fi" })).toBeOnTheScreen();
			}
		);

		test.each(["sm", "md", "lg"] as const)("size %s renders its rows", async (size) => {
			await renderWithProviders(
				<ListGroup size={size}>
					<ListGroup.Item onPress={jest.fn()}>Wi-Fi</ListGroup.Item>
				</ListGroup>
			);
			expect(screen.getByRole("button", { name: "Wi-Fi" })).toBeOnTheScreen();
		});
	});

	describe("outside the root", () => {
		test.each([
			["Item", () => <ListGroup.Item>Row</ListGroup.Item>, "ListGroup.Item must be rendered inside a <ListGroup>."],
			[
				"ItemPrefix",
				() => <ListGroup.ItemPrefix>x</ListGroup.ItemPrefix>,
				"ListGroup.ItemPrefix must be rendered inside a <ListGroup>.",
			],
			[
				"ItemTitle",
				() => <ListGroup.ItemTitle>x</ListGroup.ItemTitle>,
				"ListGroup.ItemTitle must be rendered inside a <ListGroup>.",
			],
			[
				"ItemDescription",
				() => <ListGroup.ItemDescription>x</ListGroup.ItemDescription>,
				"ListGroup.ItemDescription must be rendered inside a <ListGroup>.",
			],
			["ItemSuffix", () => <ListGroup.ItemSuffix />, "ListGroup.ItemSuffix must be rendered inside a <ListGroup>."],
		] as const)("%s throws", async (_name, ui, message) => {
			const original = console.error;
			console.error = () => undefined;
			try {
				await expect(renderWithProviders(ui())).rejects.toThrow(message);
			} finally {
				console.error = original;
			}
		});
	});
});
