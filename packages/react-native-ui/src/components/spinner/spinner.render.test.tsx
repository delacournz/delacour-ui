import { describe, expect, jest, test } from "@jest/globals";
import type { ReactElement } from "react";
import { Text } from "react-native";
import { renderWithProviders, screen } from "../../test/render";
import { Spinner } from "./spinner";
import { useSpinner } from "./spinner.context";

function ContextProbe(): ReactElement {
	const { speed, isLoading } = useSpinner();
	return <Text testID="probe">{`speed:${speed} loading:${isLoading}`}</Text>;
}

describe("Spinner", () => {
	test("is announced as a busy progressbar", async () => {
		await renderWithProviders(<Spinner accessibilityLabel="Saving" />);
		const bar = screen.getByRole("progressbar", { name: "Saving" });
		expect(bar).toBeOnTheScreen();
		expect(bar).toBeBusy();
	});

	test("is named Loading when no label is given, and does not announce on mount", async () => {
		await renderWithProviders(<Spinner />);
		expect(screen.getByRole("progressbar", { name: "Loading" })).toBeBusy();
	});

	test("forwards testID and accessibility props to the root", async () => {
		await renderWithProviders(<Spinner accessibilityLabel="Loading results" testID="spin" />);
		expect(screen.getByTestId("spin")).toBe(screen.getByLabelText("Loading results"));
	});

	test("isLoading false renders nothing", async () => {
		const view = await renderWithProviders(<Spinner accessibilityLabel="Saving" isLoading={false} />);
		expect(screen.queryByRole("progressbar")).not.toBeOnTheScreen();

		await view.rerender(<Spinner accessibilityLabel="Saving" isLoading />);
		expect(screen.getByRole("progressbar", { name: "Saving" })).toBeOnTheScreen();
	});

	test("a custom child is rendered as the glyph", async () => {
		await renderWithProviders(
			<Spinner accessibilityLabel="Syncing">
				<Text>glyph</Text>
			</Spinner>
		);
		expect(screen.getByText("glyph")).toBeOnTheScreen();
	});

	test("an explicit Spinner.Content child is not double-wrapped", async () => {
		await renderWithProviders(
			<Spinner accessibilityLabel="Syncing">
				<Spinner.Content testID="layer">
					<Text>glyph</Text>
				</Spinner.Content>
			</Spinner>
		);
		expect(screen.getAllByTestId("layer")).toHaveLength(1);
		expect(screen.getByText("glyph")).toBeOnTheScreen();
	});

	test("speed and isLoading reach parts through context", async () => {
		await renderWithProviders(
			<Spinner speed={2}>
				<ContextProbe />
			</Spinner>
		);
		expect(screen.getByTestId("probe")).toHaveTextContent("speed:2 loading:true");
	});

	test("speed defaults to 1", async () => {
		await renderWithProviders(
			<Spinner>
				<ContextProbe />
			</Spinner>
		);
		expect(screen.getByTestId("probe")).toHaveTextContent("speed:1 loading:true");
	});

	test("a numeric size is applied as the root's dimensions", async () => {
		await renderWithProviders(<Spinner accessibilityLabel="Saving" size={40} />);
		expect(screen.getByRole("progressbar")).toHaveStyle({ height: 40, width: 40 });
	});

	test("useSpinner outside a Spinner throws its documented error", async () => {
		const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
		try {
			await expect(renderWithProviders(<ContextProbe />)).rejects.toThrow(
				"useSpinner must be called inside a <Spinner>."
			);
		} finally {
			spy.mockRestore();
		}
	});
});
