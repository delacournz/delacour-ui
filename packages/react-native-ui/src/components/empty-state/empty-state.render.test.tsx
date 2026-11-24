import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { Text } from "react-native";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Button } from "../button";
import { EmptyState } from "./empty-state";
import { useEmptyState } from "./empty-state.context";
import { EmptyStateTitle } from "./empty-state-title";

function Probe() {
	const { size, variant } = useEmptyState();
	return <Text>{`${size}/${variant}`}</Text>;
}

describe("EmptyState", () => {
	test("announces its title as a header and its description as text", async () => {
		await renderWithProviders(
			<EmptyState>
				<EmptyState.Header>
					<EmptyState.Title>No messages</EmptyState.Title>
					<EmptyState.Description>New conversations will show up here.</EmptyState.Description>
				</EmptyState.Header>
			</EmptyState>
		);
		expect(screen.getByRole("header", { name: "No messages" })).toBeOnTheScreen();
		expect(screen.getByText("New conversations will show up here.")).toBeOnTheScreen();
	});

	test("media is hidden from assistive technology by default", async () => {
		await renderWithProviders(
			<EmptyState>
				<EmptyState.Header>
					<EmptyState.Media testID="media">
						<Text>glyph</Text>
					</EmptyState.Media>
					<EmptyState.Title>No messages</EmptyState.Title>
				</EmptyState.Header>
			</EmptyState>
		);
		expect(screen.queryByText("glyph")).not.toBeOnTheScreen();
		const media = screen.getByTestId("media", { includeHiddenElements: true });
		expect(media.props.accessibilityElementsHidden).toBe(true);
		expect(media.props.importantForAccessibility).toBe("no-hide-descendants");
		expect(screen.getByRole("header")).toBeOnTheScreen();
	});

	test("media opts back in to assistive technology", async () => {
		await renderWithProviders(
			<EmptyState>
				<EmptyState.Header>
					<EmptyState.Media accessibilityElementsHidden={false} importantForAccessibility="auto">
						<Text>glyph</Text>
					</EmptyState.Media>
				</EmptyState.Header>
			</EmptyState>
		);
		expect(screen.getByText("glyph")).toBeOnTheScreen();
	});

	test("the icon media variant keeps its children hidden too", async () => {
		await renderWithProviders(
			<EmptyState>
				<EmptyState.Media variant="icon">
					<Text>glyph</Text>
				</EmptyState.Media>
			</EmptyState>
		);
		expect(screen.queryByText("glyph")).not.toBeOnTheScreen();
	});

	test("actions in Content are reachable and fire their own onPress", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<EmptyState>
				<EmptyState.Content>
					<Button onPress={onPress}>New message</Button>
				</EmptyState.Content>
			</EmptyState>
		);
		await fireEvent(screen.getByRole("button", { name: "New message" }), "accessibilityTap");
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("size and variant reach parts through context", async () => {
		await renderWithProviders(
			<EmptyState size="lg" variant="card">
				<Probe />
			</EmptyState>
		);
		expect(screen.getByText("lg/card")).toBeOnTheScreen();
	});

	test("size and variant default to md and default", async () => {
		await renderWithProviders(
			<EmptyState>
				<Probe />
			</EmptyState>
		);
		expect(screen.getByText("md/default")).toBeOnTheScreen();
	});

	test("Title accepts an accessibilityRole override that replaces header", async () => {
		await renderWithProviders(
			<EmptyState>
				<EmptyState.Title accessibilityRole="text">Plain</EmptyState.Title>
			</EmptyState>
		);
		expect(screen.queryByRole("header")).not.toBeOnTheScreen();
	});

	describe("outside an EmptyState", () => {
		const original = console.error;
		beforeEach(() => {
			console.error = () => undefined;
		});
		afterEach(() => {
			console.error = original;
		});

		test("a part throws its documented error", async () => {
			await expect(renderWithProviders(<EmptyStateTitle>Orphan</EmptyStateTitle>)).rejects.toThrow(
				"EmptyState.Title must be rendered inside an <EmptyState>."
			);
			await expect(renderWithProviders(<EmptyState.Content>{null}</EmptyState.Content>)).rejects.toThrow(
				"EmptyState.Content must be rendered inside an <EmptyState>."
			);
		});

		test("useEmptyState throws", async () => {
			await expect(renderWithProviders(<Probe />)).rejects.toThrow(
				"useEmptyState must be called inside an <EmptyState>."
			);
		});
	});
});
