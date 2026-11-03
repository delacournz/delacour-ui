import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import type { ReactElement } from "react";
import { Text } from "react-native";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Button } from "../button";
import { Screen } from "./screen";

const tap = (name: string) => fireEvent(screen.getByRole("button", { name }), "accessibilityTap");

function Basic(): ReactElement {
	return (
		<Screen>
			<Screen.Navbar>
				<Screen.Navbar.BackButton onPress={() => undefined}>
					<Screen.Navbar.Title>Inbox</Screen.Navbar.Title>
				</Screen.Navbar.BackButton>
			</Screen.Navbar>
			<Screen.Content>
				<Text>Body copy</Text>
			</Screen.Content>
		</Screen>
	);
}

describe("Screen", () => {
	test("renders its navbar and content", async () => {
		await renderWithProviders(<Basic />);
		expect(screen.getByRole("header", { name: "Inbox" })).toBeOnTheScreen();
		expect(screen.getByText("Body copy")).toBeOnTheScreen();
	});

	test("the title and subtitle render their text", async () => {
		await renderWithProviders(
			<Screen>
				<Screen.Navbar>
					<Screen.Navbar.Title>Inbox</Screen.Navbar.Title>
					<Screen.Navbar.Subtitle>12 unread</Screen.Navbar.Subtitle>
				</Screen.Navbar>
			</Screen>
		);
		expect(screen.getByRole("header", { name: "Inbox" })).toBeOnTheScreen();
		expect(screen.getByText("12 unread")).toBeOnTheScreen();
		expect(screen.queryByRole("header", { name: "12 unread" })).not.toBeOnTheScreen();
	});

	test("a non-string title is passed through untouched", async () => {
		await renderWithProviders(
			<Screen>
				<Screen.Navbar>
					<Screen.Navbar.Title>
						<Text>Custom title</Text>
					</Screen.Navbar.Title>
				</Screen.Navbar>
			</Screen>
		);
		expect(screen.getByText("Custom title")).toBeOnTheScreen();
	});

	test("navbar actions and center slots render", async () => {
		await renderWithProviders(
			<Screen>
				<Screen.Navbar actions={<Text>Actions</Text>} center={<Text>Center</Text>} />
			</Screen>
		);
		expect(screen.getByText("Actions")).toBeOnTheScreen();
		expect(screen.getByText("Center")).toBeOnTheScreen();
	});

	test("header and footer children render", async () => {
		await renderWithProviders(
			<Screen>
				<Screen.Header>
					<Text>Heading</Text>
				</Screen.Header>
				<Screen.Footer>
					<Text>Footer note</Text>
				</Screen.Footer>
			</Screen>
		);
		expect(screen.getByText("Heading")).toBeOnTheScreen();
		expect(screen.getByText("Footer note")).toBeOnTheScreen();
	});

	test("a Screen.View renders its children", async () => {
		await renderWithProviders(
			<Screen>
				<Screen.View>
					<Text>Static body</Text>
				</Screen.View>
			</Screen>
		);
		expect(screen.getByText("Static body")).toBeOnTheScreen();
	});
});

describe("Screen.Navbar.BackButton", () => {
	test("is a button named Back by default and calls onPress", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<Screen>
				<Screen.Navbar>
					<Screen.Navbar.BackButton onPress={onPress} />
				</Screen.Navbar>
			</Screen>
		);
		await tap("Back");
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("accessibilityLabel overrides the name", async () => {
		await renderWithProviders(
			<Screen>
				<Screen.Navbar>
					<Screen.Navbar.BackButton accessibilityLabel="Close" glyph="close" onPress={() => undefined} />
				</Screen.Navbar>
			</Screen>
		);
		expect(screen.getByRole("button", { name: "Close" })).toBeOnTheScreen();
		expect(screen.queryByRole("button", { name: "Back" })).not.toBeOnTheScreen();
	});

	test("onBeforeBack returning false vetoes onPress", async () => {
		const onPress = jest.fn();
		const onBeforeBack = jest.fn(() => false);
		await renderWithProviders(
			<Screen>
				<Screen.Navbar>
					<Screen.Navbar.BackButton onBeforeBack={onBeforeBack} onPress={onPress} />
				</Screen.Navbar>
			</Screen>
		);
		await tap("Back");
		expect(onBeforeBack).toHaveBeenCalledTimes(1);
		expect(onPress).not.toHaveBeenCalled();
	});

	test("onBeforeBack returning true lets onPress through", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<Screen>
				<Screen.Navbar>
					<Screen.Navbar.BackButton onBeforeBack={() => true} onPress={onPress} />
				</Screen.Navbar>
			</Screen>
		);
		await tap("Back");
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("a disabled back button does not call onPress", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<Screen>
				<Screen.Navbar>
					<Screen.Navbar.BackButton disabled onPress={onPress} />
				</Screen.Navbar>
			</Screen>
		);
		expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
		await tap("Back");
		expect(onPress).not.toHaveBeenCalled();
	});
});

describe("Screen.Loading", () => {
	test("shows its title, and a back button only when onBack is given", async () => {
		const onBack = jest.fn();
		await renderWithProviders(<Screen.Loading onBack={onBack} title="Inbox" />);
		expect(screen.getByRole("header", { name: "Inbox" })).toBeOnTheScreen();
		await tap("Back");
		expect(onBack).toHaveBeenCalledTimes(1);
	});

	test("without onBack there is no back button", async () => {
		await renderWithProviders(<Screen.Loading title="Inbox" />);
		expect(screen.getByRole("header", { name: "Inbox" })).toBeOnTheScreen();
		expect(screen.queryByRole("button", { name: "Back" })).not.toBeOnTheScreen();
	});

	test("showNavbar={false} drops the navbar", async () => {
		await renderWithProviders(<Screen.Loading onBack={() => undefined} showNavbar={false} title="Inbox" />);
		expect(screen.queryByText("Inbox")).not.toBeOnTheScreen();
		expect(screen.queryByRole("button", { name: "Back" })).not.toBeOnTheScreen();
	});
});

describe("Screen.Error", () => {
	test("shows the default title and the message", async () => {
		await renderWithProviders(<Screen.Error message="The request timed out." />);
		expect(screen.getByRole("header", { name: "Something went wrong" })).toBeOnTheScreen();
		expect(screen.getByText("The request timed out.")).toBeOnTheScreen();
	});

	test("a custom title replaces the default", async () => {
		await renderWithProviders(<Screen.Error message="Gone." title="Not found" />);
		expect(screen.getByRole("header", { name: "Not found" })).toBeOnTheScreen();
		expect(screen.queryByText("Something went wrong")).not.toBeOnTheScreen();
	});

	test("a retry action passed as children fires its callback", async () => {
		const onRetry = jest.fn();
		await renderWithProviders(
			<Screen.Error message="Offline.">
				<Button onPress={onRetry}>Try again</Button>
			</Screen.Error>
		);
		await tap("Try again");
		expect(onRetry).toHaveBeenCalledTimes(1);
	});

	test("onBack adds a working back button", async () => {
		const onBack = jest.fn();
		await renderWithProviders(<Screen.Error message="Offline." onBack={onBack} />);
		await tap("Back");
		expect(onBack).toHaveBeenCalledTimes(1);
	});

	test("without onBack there is no back button, and showNavbar={false} drops the navbar", async () => {
		await renderWithProviders(<Screen.Error message="Offline." />);
		expect(screen.queryByRole("button", { name: "Back" })).not.toBeOnTheScreen();
		await renderWithProviders(<Screen.Error message="Hidden." onBack={() => undefined} showNavbar={false} />);
		expect(screen.queryAllByRole("button", { name: "Back" })).toHaveLength(0);
	});
});

describe("scrolling bodies", () => {
	test("ScrollArea renders its children", async () => {
		await renderWithProviders(
			<Screen>
				<Screen.ScrollArea>
					<Text>Scrolled row</Text>
				</Screen.ScrollArea>
			</Screen>
		);
		expect(screen.getByText("Scrolled row")).toBeOnTheScreen();
	});

	test("ScrollArea renders its header", async () => {
		await renderWithProviders(
			<Screen>
				<Screen.ScrollArea header={<Text>Pinned header</Text>}>
					<Text>Row</Text>
				</Screen.ScrollArea>
			</Screen>
		);
		expect(screen.getByText("Pinned header")).toBeOnTheScreen();
		expect(screen.getByText("Row")).toBeOnTheScreen();
	});

	test("FlatList renders its items", async () => {
		await renderWithProviders(
			<Screen>
				<Screen.FlatList
					data={["Alpha", "Beta"]}
					keyExtractor={(item) => item}
					renderItem={({ item }) => <Text>{item}</Text>}
				/>
			</Screen>
		);
		expect(screen.getByText("Alpha")).toBeOnTheScreen();
		expect(screen.getByText("Beta")).toBeOnTheScreen();
	});

	test("SectionList renders its section headers and items", async () => {
		await renderWithProviders(
			<Screen>
				<Screen.SectionList
					keyExtractor={(item) => item}
					renderItem={({ item }) => <Text>{item}</Text>}
					renderSectionHeader={({ section }) => <Text>{section.title}</Text>}
					sections={[{ title: "Today", data: ["One", "Two"] }]}
				/>
			</Screen>
		);
		expect(screen.getByText("Today")).toBeOnTheScreen();
		expect(screen.getByText("One")).toBeOnTheScreen();
		expect(screen.getByText("Two")).toBeOnTheScreen();
	});
});

describe("parts outside a Screen", () => {
	let spy: ReturnType<typeof jest.spyOn>;

	beforeEach(() => {
		spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
	});

	afterEach(() => {
		spy.mockRestore();
	});

	test("Navbar throws its documented error", async () => {
		await expect(renderWithProviders(<Screen.Navbar />)).rejects.toThrow(
			"Screen.Navbar must be rendered inside a <Screen>."
		);
	});

	test("Footer throws its documented error", async () => {
		await expect(renderWithProviders(<Screen.Footer />)).rejects.toThrow(
			"Screen.Footer must be rendered inside a <Screen>."
		);
	});

	test("View throws its documented error", async () => {
		await expect(renderWithProviders(<Screen.View />)).rejects.toThrow(
			"Screen.View must be rendered inside a <Screen>."
		);
	});
});
