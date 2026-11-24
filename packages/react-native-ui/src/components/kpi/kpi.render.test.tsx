import { describe, expect, jest, test } from "@jest/globals";
import type { ReactElement } from "react";
import { Text } from "react-native";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Button } from "../button";
import { Kpi } from "./kpi";
import { useKpi } from "./kpi.context";

const DATA = [31, 34, 33, 38, 41, 40, 48];

function Metric({ goodDirection, isLoading }: { goodDirection?: "up" | "down" | "none"; isLoading?: boolean }) {
	return (
		<Kpi goodDirection={goodDirection} isLoading={isLoading} testID="kpi">
			<Kpi.Header>
				<Kpi.Title>Revenue</Kpi.Title>
				<Kpi.Action>
					<Button accessibilityLabel="Options" size="icon-md" />
				</Kpi.Action>
			</Kpi.Header>
			<Kpi.Content>
				<Kpi.Stat>
					<Kpi.Value>$48,120</Kpi.Value>
					<Kpi.Trend caption="vs last month" value={7.8} />
				</Kpi.Stat>
				<Kpi.Sparkline data={DATA} />
			</Kpi.Content>
			<Kpi.Footer>Last 30 days</Kpi.Footer>
		</Kpi>
	);
}

function silenceConsoleError<T>(run: () => Promise<T>): Promise<T> {
	const original = console.error;
	console.error = () => undefined;
	return run().finally(() => {
		console.error = original;
	});
}

describe("Kpi", () => {
	test("renders every part's content", async () => {
		await renderWithProviders(<Metric />);
		expect(screen.getByText("Revenue")).toBeOnTheScreen();
		expect(screen.getByText("$48,120")).toBeOnTheScreen();
		expect(screen.getByText("+7.8%")).toBeOnTheScreen();
		expect(screen.getByText("Last 30 days")).toBeOnTheScreen();
	});

	test("the trend is announced as one string with its direction", async () => {
		await renderWithProviders(<Metric />);
		expect(screen.getByLabelText("Up 7.8 percent, vs last month")).toBeOnTheScreen();
	});

	test("a negative trend is announced as a fall, whatever goodDirection says", async () => {
		await renderWithProviders(
			<Kpi goodDirection="down">
				<Kpi.Trend value={-8.4} />
			</Kpi>
		);
		expect(screen.getByLabelText("Down 8.4 percent")).toBeOnTheScreen();
	});

	test("a movement within the threshold is announced as no change", async () => {
		await renderWithProviders(
			<Kpi>
				<Kpi.Trend caption="vs last week" threshold={1} value={0.4} />
			</Kpi>
		);
		expect(screen.getByLabelText("No change, vs last week")).toBeOnTheScreen();
	});

	test("a custom format is read as written after the direction", async () => {
		await renderWithProviders(
			<Kpi>
				<Kpi.Trend format={(value) => `${value} pts`} value={3} />
			</Kpi>
		);
		expect(screen.getByLabelText("Up, 3 pts")).toBeOnTheScreen();
		expect(screen.getByText("3 pts")).toBeOnTheScreen();
	});

	test("the badge variant keeps the same announcement", async () => {
		await renderWithProviders(
			<Kpi>
				<Kpi.Trend caption="vs last month" value={7.8} variant="badge" />
			</Kpi>
		);
		expect(screen.getByLabelText("Up 7.8 percent, vs last month")).toBeOnTheScreen();
	});

	test("the sparkline is one image summarising the series", async () => {
		await renderWithProviders(<Metric />);
		expect(screen.getByRole("image", { name: "Trend over 7 points, from 31 to 48" })).toBeOnTheScreen();
	});

	test("the sparkline summary uses formatValue, and accessibilityLabel replaces it", async () => {
		await renderWithProviders(
			<Kpi>
				<Kpi.Sparkline data={DATA} formatValue={(value) => `$${value}`} />
				<Kpi.Sparkline accessibilityLabel="Revenue shape" data={DATA} />
			</Kpi>
		);
		expect(screen.getByRole("image", { name: "Trend over 7 points, from $31 to $48" })).toBeOnTheScreen();
		expect(screen.getByRole("image", { name: "Revenue shape" })).toBeOnTheScreen();
	});

	test("an empty series is announced as no data", async () => {
		await renderWithProviders(
			<Kpi>
				<Kpi.Sparkline data={[]} />
			</Kpi>
		);
		expect(screen.getByRole("image", { name: "No trend data" })).toBeOnTheScreen();
	});

	test("isLoading marks the card busy and swaps the numbers for placeholders", async () => {
		const view = await renderWithProviders(<Metric />);
		expect(screen.getByTestId("kpi")).not.toBeBusy();

		await view.rerender(<Metric isLoading />);
		expect(screen.getByTestId("kpi")).toBeBusy();
		expect(screen.getByLabelText("Loading")).toBeOnTheScreen();
		expect(screen.queryByText("$48,120")).not.toBeOnTheScreen();
		expect(screen.queryByLabelText("Up 7.8 percent, vs last month")).not.toBeOnTheScreen();
		expect(screen.queryByRole("image")).not.toBeOnTheScreen();
	});

	test("Kpi.Action hosts an interactive control that reports its own press", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<Kpi>
				<Kpi.Header>
					<Kpi.Title>Revenue</Kpi.Title>
					<Kpi.Action>
						<Button accessibilityLabel="Options" onPress={onPress} size="icon-md" />
					</Kpi.Action>
				</Kpi.Header>
			</Kpi>
		);
		await fireEvent(screen.getByRole("button", { name: "Options" }), "accessibilityTap");
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("a disabled control inside Kpi.Action does not fire", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<Kpi>
				<Kpi.Header>
					<Kpi.Action>
						<Button accessibilityLabel="Options" isDisabled onPress={onPress} size="icon-md" />
					</Kpi.Action>
				</Kpi.Header>
			</Kpi>
		);
		const button = screen.getByRole("button", { name: "Options" });
		expect(button).toBeDisabled();
		await fireEvent(button, "accessibilityTap");
		expect(onPress).not.toHaveBeenCalled();
	});

	test("activeIndex is shared through useKpi; defaultActiveIndex seeds it", async () => {
		function Readout(): ReactElement {
			const { activeIndex } = useKpi();
			return <Text>{`active:${activeIndex === null ? "none" : activeIndex}`}</Text>;
		}
		const uncontrolled = await renderWithProviders(
			<Kpi defaultActiveIndex={3}>
				<Readout />
			</Kpi>
		);
		expect(screen.getByText("active:3")).toBeOnTheScreen();
		await uncontrolled.unmount();

		await renderWithProviders(
			<Kpi activeIndex={5}>
				<Readout />
			</Kpi>
		);
		expect(screen.getByText("active:5")).toBeOnTheScreen();
	});

	test("Kpi.Group renders its metrics, with or without a separator", async () => {
		const view = await renderWithProviders(
			<Kpi.Group>
				<Kpi>
					<Kpi.Title>Revenue</Kpi.Title>
				</Kpi>
				<Kpi>
					<Kpi.Title>Orders</Kpi.Title>
				</Kpi>
			</Kpi.Group>
		);
		expect(screen.getByText("Revenue")).toBeOnTheScreen();
		expect(screen.getByText("Orders")).toBeOnTheScreen();

		await view.rerender(
			<Kpi.Group orientation="horizontal" separated>
				<Kpi>
					<Kpi.Title>Revenue</Kpi.Title>
				</Kpi>
				<Kpi>
					<Kpi.Title>Orders</Kpi.Title>
				</Kpi>
			</Kpi.Group>
		);
		expect(screen.getByText("Revenue")).toBeOnTheScreen();
		expect(screen.getByText("Orders")).toBeOnTheScreen();
	});

	test.each([
		["Kpi.Title", <Kpi.Title key="p">x</Kpi.Title>],
		["Kpi.Value", <Kpi.Value key="p">x</Kpi.Value>],
		["Kpi.Trend", <Kpi.Trend key="p" value={1} />],
		["Kpi.Sparkline", <Kpi.Sparkline key="p" data={DATA} />],
		["Kpi.Action", <Kpi.Action key="p" />],
		["Kpi.Footer", <Kpi.Footer key="p">x</Kpi.Footer>],
	])("%s outside a Kpi throws", async (name, part) => {
		await silenceConsoleError(() =>
			expect(renderWithProviders(part)).rejects.toThrow(`${name} must be rendered inside a <Kpi>.`)
		);
	});

	test("useKpi outside a Kpi throws its documented error", async () => {
		function Probe(): null {
			useKpi();
			return null;
		}
		await silenceConsoleError(() =>
			expect(renderWithProviders(<Probe />)).rejects.toThrow("useKpi must be called inside a <Kpi>.")
		);
	});
});
