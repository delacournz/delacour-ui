import { describe, expect, test } from "@jest/globals";
import { Text, View } from "react-native";
import { renderWithProviders, screen } from "../../test/render";
import { Surface, useSurfaceContext } from "../surface";
import { Card } from "./card";
import { type CardContextValue, useCard, useCardContext } from "./card.context";

/** Writes the card context it reads into a Text, so a test can assert on it. */
function CardProbe({ id }: { id: string }) {
	const context: CardContextValue | null = useCardContext();
	return <Text testID={id}>{context ? `${context.variant}|${context.plane}|${context.size}` : "none"}</Text>;
}

function StrictCardProbe() {
	const context: CardContextValue = useCard();
	return <Text testID="strict">{context.size}</Text>;
}

function SurfaceProbe({ id }: { id: string }) {
	const context = useSurfaceContext();
	return <Text testID={id}>{context ? `${context.variant}|${context.plane}|${context.material}` : "none"}</Text>;
}

/** Silences console.error while a render is expected to throw, and restores it after. */
async function withSilencedErrors(run: () => Promise<void>): Promise<void> {
	const original = console.error;
	console.error = () => undefined;
	try {
		await run();
	} finally {
		console.error = original;
	}
}

describe("Card", () => {
	test("renders its children and forwards View props", async () => {
		await renderWithProviders(
			<Card accessibilityLabel="Monthly report" testID="card">
				<Text>Body</Text>
			</Card>
		);
		expect(screen.getByTestId("card")).toBeOnTheScreen();
		expect(screen.getByLabelText("Monthly report")).toBeOnTheScreen();
		expect(screen.getByText("Body")).toBeOnTheScreen();
	});

	test("adds no role of its own, so a card is layout rather than a control", async () => {
		await renderWithProviders(<Card testID="card" />);
		const card = screen.getByTestId("card");
		expect(card.props.accessibilityRole).toBeUndefined();
		expect(card.props.onPress).toBeUndefined();
	});

	test("a full card renders every part", async () => {
		await renderWithProviders(
			<Card>
				<Card.Header>
					<Card.Title>Monthly report</Card.Title>
					<Card.Description>Revenue and retention for October.</Card.Description>
					<Card.Action>
						<Text>New</Text>
					</Card.Action>
				</Card.Header>
				<Card.Content>
					<Text>$48,120</Text>
				</Card.Content>
				<Card.Footer>
					<Text>Export</Text>
				</Card.Footer>
			</Card>
		);
		expect(screen.getByText("Monthly report")).toBeOnTheScreen();
		expect(screen.getByText("Revenue and retention for October.")).toBeOnTheScreen();
		expect(screen.getByText("New")).toBeOnTheScreen();
		expect(screen.getByText("$48,120")).toBeOnTheScreen();
		expect(screen.getByText("Export")).toBeOnTheScreen();
	});

	test("Card.Title is announced as a header", async () => {
		await renderWithProviders(
			<Card>
				<Card.Header>
					<Card.Title>Monthly report</Card.Title>
				</Card.Header>
			</Card>
		);
		expect(screen.getByRole("header", { name: "Monthly report" })).toBeOnTheScreen();
	});

	test("Card.Description is plain text, not a header", async () => {
		await renderWithProviders(
			<Card>
				<Card.Header>
					<Card.Title>Title</Card.Title>
					<Card.Description>Supporting line</Card.Description>
				</Card.Header>
			</Card>
		);
		expect(screen.getByText("Supporting line").props.accessibilityRole).not.toBe("header");
		expect(screen.getAllByRole("header")).toHaveLength(1);
	});

	test("bare text in a header becomes its title", async () => {
		await renderWithProviders(
			<Card>
				<Card.Header>Plain heading</Card.Header>
			</Card>
		);
		expect(screen.getByRole("header", { name: "Plain heading" })).toBeOnTheScreen();
	});

	test("Card.Action keeps its content reachable wherever it is written in the header", async () => {
		await renderWithProviders(
			<Card>
				<Card.Header>
					<Card.Action>
						<Text>Menu</Text>
					</Card.Action>
					<Card.Title>Title</Card.Title>
				</Card.Header>
			</Card>
		);
		expect(screen.getByText("Menu")).toBeOnTheScreen();
		expect(screen.getByRole("header", { name: "Title" })).toBeOnTheScreen();
	});

	test("parts forward View and Text props", async () => {
		await renderWithProviders(
			<Card>
				<Card.Header testID="header">
					<Card.Title testID="title">Title</Card.Title>
					<Card.Description testID="description">Description</Card.Description>
					<Card.Action testID="action" accessibilityLabel="Card menu" />
				</Card.Header>
				<Card.Content testID="content" />
				<Card.Footer testID="footer" />
			</Card>
		);
		for (const id of ["header", "title", "description", "action", "content", "footer"]) {
			expect(screen.getByTestId(id)).toBeOnTheScreen();
		}
		expect(screen.getByLabelText("Card menu")).toBeOnTheScreen();
	});

	test("Card.Footer renders both variants with their children", async () => {
		await renderWithProviders(
			<Card>
				<Card.Footer>
					<Text>Default footer</Text>
				</Card.Footer>
				<Card.Footer variant="band">
					<Text>Band footer</Text>
				</Card.Footer>
			</Card>
		);
		expect(screen.getByText("Default footer")).toBeOnTheScreen();
		expect(screen.getByText("Band footer")).toBeOnTheScreen();
	});

	test("publishes the default fill and md size to its parts", async () => {
		await renderWithProviders(
			<Card>
				<CardProbe id="probe" />
			</Card>
		);
		expect(screen.getByTestId("probe")).toHaveTextContent("default|default|md");
	});

	test("size reaches the parts through context", async () => {
		await renderWithProviders(
			<Card size="lg">
				<CardProbe id="probe" />
			</Card>
		);
		expect(screen.getByTestId("probe")).toHaveTextContent("default|default|lg");
	});

	test("an explicit variant is published", async () => {
		await renderWithProviders(
			<Card variant="tertiary">
				<CardProbe id="probe" />
			</Card>
		);
		expect(screen.getByTestId("probe")).toHaveTextContent("tertiary|tertiary|md");
	});

	test("a transparent card passes its parent's plane through", async () => {
		await renderWithProviders(
			<Card variant="transparent">
				<CardProbe id="page" />
			</Card>
		);
		expect(screen.getByTestId("page")).toHaveTextContent("transparent|null|md");

		await renderWithProviders(
			<Surface variant="secondary">
				<Card variant="transparent">
					<CardProbe id="nested" />
				</Card>
			</Surface>
		);
		expect(screen.getByTestId("nested")).toHaveTextContent("transparent|secondary|md");
	});

	test("a card inside a surface steps to the next fill down", async () => {
		await renderWithProviders(
			<Surface>
				<Card>
					<CardProbe id="probe" />
				</Card>
			</Surface>
		);
		expect(screen.getByTestId("probe")).toHaveTextContent("secondary|secondary|md");
	});

	test("the card and the surface it renders agree on the fill", async () => {
		await renderWithProviders(
			<Surface>
				<Card material="etched">
					<CardProbe id="card" />
					<SurfaceProbe id="surface" />
				</Card>
			</Surface>
		);
		expect(screen.getByTestId("card")).toHaveTextContent("secondary|secondary|md");
		expect(screen.getByTestId("surface")).toHaveTextContent("secondary|secondary|etched");
	});

	test("a card nested in a card steps down a fill each time", async () => {
		await renderWithProviders(
			<Card>
				<Card>
					<CardProbe id="second" />
					<Card>
						<CardProbe id="third" />
					</Card>
				</Card>
			</Card>
		);
		expect(screen.getByTestId("second")).toHaveTextContent("secondary|secondary|md");
		expect(screen.getByTestId("third")).toHaveTextContent("tertiary|tertiary|md");
	});

	test("a tray resets the plane, so a card inside it takes the card fill", async () => {
		await renderWithProviders(
			<Surface material="tray">
				<Card>
					<CardProbe id="probe" />
				</Card>
			</Surface>
		);
		expect(screen.getByTestId("probe")).toHaveTextContent("default|default|md");
	});

	test("useCardContext is null outside a card", async () => {
		await renderWithProviders(<CardProbe id="probe" />);
		expect(screen.getByTestId("probe")).toHaveTextContent("none");
	});

	test("useCard reads the enclosing card and throws outside one", async () => {
		await renderWithProviders(
			<Card size="sm">
				<StrictCardProbe />
			</Card>
		);
		expect(screen.getByTestId("strict")).toHaveTextContent("sm");

		await withSilencedErrors(async () => {
			await expect(renderWithProviders(<StrictCardProbe />)).rejects.toThrow("useCard must be called inside a <Card>.");
		});
	});

	test.each([
		["Card.Header", () => <Card.Header />],
		["Card.Title", () => <Card.Title>Title</Card.Title>],
		["Card.Description", () => <Card.Description>Text</Card.Description>],
		["Card.Action", () => <Card.Action />],
		["Card.Content", () => <Card.Content />],
		["Card.Footer", () => <Card.Footer />],
	] as const)("%s outside a Card throws its documented error", async (name, part) => {
		await withSilencedErrors(async () => {
			await expect(renderWithProviders(<View>{part()}</View>)).rejects.toThrow(
				`${name} must be rendered inside a <Card>.`
			);
		});
	});
});
