import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { Text } from "react-native";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Frame } from "./frame";
import { useFrame } from "./frame.context";

function FrameProbe() {
	const { variant, size } = useFrame();
	return <Text testID="probe">{`${variant}|${size}`}</Text>;
}

function silenceConsoleError() {
	let spy: ReturnType<typeof jest.spyOn> | undefined;
	beforeEach(() => {
		spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
	});
	afterEach(() => {
		spy?.mockRestore();
	});
}

describe("Frame", () => {
	test("the title is announced as a header", async () => {
		await renderWithProviders(
			<Frame>
				<Frame.Header>
					<Frame.Title>Notifications</Frame.Title>
				</Frame.Header>
			</Frame>
		);
		expect(screen.getByRole("header", { name: "Notifications" })).toBeOnTheScreen();
	});

	test("bare text in a header becomes its title", async () => {
		await renderWithProviders(
			<Frame>
				<Frame.Header>Members</Frame.Header>
			</Frame>
		);
		expect(screen.getByRole("header", { name: "Members" })).toBeOnTheScreen();
	});

	test("a description renders beside the title", async () => {
		await renderWithProviders(
			<Frame>
				<Frame.Header>
					<Frame.Title>Notifications</Frame.Title>
					<Frame.Description>Choose what reaches you</Frame.Description>
				</Frame.Header>
			</Frame>
		);
		expect(screen.getByText("Choose what reaches you")).toBeOnTheScreen();
	});

	test("forwards testID and accessibilityLabel to the root", async () => {
		await renderWithProviders(
			<Frame accessibilityLabel="Settings frame" testID="frame">
				<Frame.Header>Settings</Frame.Header>
			</Frame>
		);
		expect(screen.getByTestId("frame")).toHaveProp("accessibilityLabel", "Settings frame");
	});

	test("useFrame reads the root's variant and size", async () => {
		await renderWithProviders(
			<Frame size="lg" variant="inset">
				<FrameProbe />
			</Frame>
		);
		expect(screen.getByTestId("probe")).toHaveTextContent("inset|lg");
	});

	test("useFrame defaults to the default variant at md", async () => {
		await renderWithProviders(
			<Frame>
				<FrameProbe />
			</Frame>
		);
		expect(screen.getByTestId("probe")).toHaveTextContent("default|md");
	});

	describe("Frame.Action", () => {
		test("is a button named by its label", async () => {
			await renderWithProviders(
				<Frame>
					<Frame.Header>
						<Frame.Title>Notifications</Frame.Title>
						<Frame.Action onPress={() => undefined}>Manage</Frame.Action>
					</Frame.Header>
				</Frame>
			);
			expect(screen.getByRole("button", { name: "Manage" })).toBeOnTheScreen();
		});

		test("an assistive activation calls onPress", async () => {
			const onPress = jest.fn();
			await renderWithProviders(
				<Frame>
					<Frame.Header>
						<Frame.Action onPress={onPress}>Manage</Frame.Action>
					</Frame.Header>
				</Frame>
			);
			await fireEvent(screen.getByRole("button", { name: "Manage" }), "accessibilityTap");
			expect(onPress).toHaveBeenCalledTimes(1);
		});

		test("isDisabled reports disabled state and does not fire onPress", async () => {
			const onPress = jest.fn();
			await renderWithProviders(
				<Frame>
					<Frame.Header>
						<Frame.Action isDisabled onPress={onPress}>
							Manage
						</Frame.Action>
					</Frame.Header>
				</Frame>
			);
			const action = screen.getByRole("button", { name: "Manage" });
			expect(action).toBeDisabled();
			await fireEvent(action, "accessibilityTap");
			expect(onPress).not.toHaveBeenCalled();
		});

		test("a caller's accessibilityRole wins", async () => {
			await renderWithProviders(
				<Frame>
					<Frame.Header>
						<Frame.Action accessibilityRole="link" onPress={() => undefined}>
							See all
						</Frame.Action>
					</Frame.Header>
				</Frame>
			);
			expect(screen.getByRole("link", { name: "See all" })).toBeOnTheScreen();
			expect(screen.queryByRole("button", { name: "See all" })).not.toBeOnTheScreen();
		});

		test("an action written before the title is still rendered", async () => {
			await renderWithProviders(
				<Frame>
					<Frame.Header>
						<Frame.Action onPress={() => undefined}>Manage</Frame.Action>
						<Frame.Title>Notifications</Frame.Title>
					</Frame.Header>
				</Frame>
			);
			expect(screen.getByRole("button", { name: "Manage" })).toBeOnTheScreen();
			expect(screen.getByRole("header", { name: "Notifications" })).toBeOnTheScreen();
		});
	});

	describe("Frame.Tray", () => {
		test("is announced as a list and holds its rows", async () => {
			await renderWithProviders(
				<Frame>
					<Frame.Tray testID="tray">
						<Text>Row one</Text>
						<Text>Row two</Text>
					</Frame.Tray>
				</Frame>
			);
			expect(screen.getByTestId("tray")).toHaveProp("accessibilityRole", "list");
			expect(screen.getByText("Row one")).toBeOnTheScreen();
			expect(screen.getByText("Row two")).toBeOnTheScreen();
		});

		test("rows stay individually reachable", async () => {
			await renderWithProviders(
				<Frame>
					<Frame.Tray testID="tray">
						<Text>Row one</Text>
					</Frame.Tray>
				</Frame>
			);
			expect(screen.getByTestId("tray")).not.toHaveProp("accessible", true);
		});
	});

	describe("Frame.Section", () => {
		test("a titled section is a summary labelled by its title", async () => {
			await renderWithProviders(
				<Frame>
					<Frame.Tray>
						<Frame.Section title="Email">
							<Text>Weekly digest</Text>
						</Frame.Section>
					</Frame.Tray>
				</Frame>
			);
			const section = screen.getByLabelText("Email");
			expect(section).toHaveProp("accessibilityRole", "summary");
			expect(screen.getByText("Email")).toBeOnTheScreen();
			expect(screen.getByText("Weekly digest")).toBeOnTheScreen();
		});

		test("an untitled section has no role or label", async () => {
			await renderWithProviders(
				<Frame>
					<Frame.Tray>
						<Frame.Section testID="section">
							<Text>Weekly digest</Text>
						</Frame.Section>
					</Frame.Tray>
				</Frame>
			);
			const section = screen.getByTestId("section");
			expect(section).not.toHaveProp("accessibilityRole");
			expect(section).not.toHaveProp("accessibilityLabel");
		});
	});

	describe("Frame.Footer", () => {
		test("renders caption and buttons with their own roles", async () => {
			const onSave = jest.fn();
			await renderWithProviders(
				<Frame>
					<Frame.Footer align="stretch">
						<Frame.Action onPress={() => undefined}>Cancel</Frame.Action>
						<Frame.Action onPress={onSave}>Save</Frame.Action>
					</Frame.Footer>
				</Frame>
			);
			expect(screen.getByRole("button", { name: "Cancel" })).toBeOnTheScreen();
			await fireEvent(screen.getByRole("button", { name: "Save" }), "accessibilityTap");
			expect(onSave).toHaveBeenCalledTimes(1);
		});

		test.each(["start", "end", "between", "stretch"] as const)("align=%s renders every child", async (align) => {
			await renderWithProviders(
				<Frame>
					<Frame.Footer align={align}>
						<Text>Left</Text>
						<Text>Right</Text>
					</Frame.Footer>
				</Frame>
			);
			expect(screen.getByText("Left")).toBeOnTheScreen();
			expect(screen.getByText("Right")).toBeOnTheScreen();
		});

		test("forwards testID", async () => {
			await renderWithProviders(
				<Frame>
					<Frame.Footer testID="footer">
						<Text>Saved</Text>
					</Frame.Footer>
				</Frame>
			);
			expect(screen.getByTestId("footer")).toBeOnTheScreen();
		});
	});

	describe("a part outside its root", () => {
		silenceConsoleError();

		test.each([
			["Frame.Title", () => <Frame.Title>x</Frame.Title>],
			["Frame.Description", () => <Frame.Description>x</Frame.Description>],
			["Frame.Header", () => <Frame.Header>x</Frame.Header>],
			["Frame.Action", () => <Frame.Action>x</Frame.Action>],
			["Frame.Tray", () => <Frame.Tray />],
			["Frame.Section", () => <Frame.Section />],
			["Frame.Footer", () => <Frame.Footer />],
		])("%s throws its documented error", async (name, element) => {
			await expect(renderWithProviders(element())).rejects.toThrow(`${name} must be rendered inside a <Frame>.`);
		});

		test("useFrame throws outside a Frame", async () => {
			await expect(renderWithProviders(<FrameProbe />)).rejects.toThrow("useFrame must be called inside a <Frame>.");
		});
	});
});
