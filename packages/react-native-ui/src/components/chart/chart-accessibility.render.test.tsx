import { describe, expect, test } from "@jest/globals";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Chart } from "./chart";

const CONFIG = {
	desktop: { label: "Desktop" },
	mobile: { label: "Mobile" },
};

const DATA = [
	{ month: "Jan", desktop: 186, mobile: 80 },
	{ month: "Feb", desktop: 305, mobile: 200 },
	{ month: "Mar", desktop: 237, mobile: 120 },
];

const step = (name: "increment" | "decrement") => ({ nativeEvent: { actionName: name } });

/**
 * What Jest can and cannot see: the engine's `focus` reaction (the UI-thread
 * move of the scrub) does not run here, so these tests observe the frame's
 * own stepped index, which drives the value text beside it. That the scrub
 * then follows `focus` is the engine's own test, and a simulator's.
 */
describe("Chart accessibility", () => {
	test("is one image with a generated summary when no tooltip is placed", async () => {
		await renderWithProviders(
			<Chart config={CONFIG} data={DATA} testID="chart" xKey="month">
				<Chart.Line yKey="desktop" />
			</Chart>
		);
		const frame = screen.getByRole("image");
		expect(frame).toBe(screen.getByTestId("chart"));
		expect(frame.props.accessibilityLabel).toContain("Jan to Mar");
		expect(frame.props.accessibilityLabel).toContain("Desktop: lowest 186, highest 305, latest 237.");
		expect(screen.queryByRole("adjustable")).toBeNull();
	});

	test("an accessibilityLabel replaces the summary verbatim", async () => {
		await renderWithProviders(
			<Chart accessibilityLabel="Revenue trend" config={CONFIG} data={DATA} xKey="month">
				<Chart.Line yKey="desktop" />
			</Chart>
		);
		expect(screen.getByRole("image", { name: "Revenue trend" })).toBeOnTheScreen();
	});

	test("accessible={false} removes the chart from the accessibility tree", async () => {
		await renderWithProviders(
			<Chart accessible={false} config={CONFIG} data={DATA} testID="chart" xKey="month">
				<Chart.Line yKey="desktop" />
				<Chart.Tooltip />
			</Chart>
		);
		expect(screen.queryByRole("image")).toBeNull();
		expect(screen.queryByRole("adjustable")).toBeNull();
		expect(screen.getByTestId("chart", { includeHiddenElements: true }).props.importantForAccessibility).toBe(
			"no-hide-descendants"
		);
	});

	test("a placed tooltip makes the chart adjustable, with no value before the first step", async () => {
		await renderWithProviders(
			<Chart config={CONFIG} data={DATA} xKey="month">
				<Chart.Line yKey="desktop" />
				<Chart.Tooltip />
			</Chart>
		);
		const frame = screen.getByRole("adjustable");
		expect(frame.props.accessibilityActions).toEqual([{ name: "increment" }, { name: "decrement" }]);
		expect(frame.props.accessibilityValue).toBeUndefined();
	});

	test("increment and decrement step through the data and stop at the ends", async () => {
		await renderWithProviders(
			<Chart config={CONFIG} data={DATA} xKey="month">
				<Chart.Line yKey="desktop" />
				<Chart.Line yKey="mobile" />
				<Chart.Tooltip />
			</Chart>
		);
		const frame = screen.getByRole("adjustable");
		await fireEvent(frame, "accessibilityAction", step("increment"));
		expect(screen.getByRole("adjustable").props.accessibilityValue).toEqual({ text: "Jan: Desktop 186, Mobile 80" });
		await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", step("increment"));
		expect(screen.getByRole("adjustable").props.accessibilityValue).toEqual({ text: "Feb: Desktop 305, Mobile 200" });
		await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", step("decrement"));
		await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", step("decrement"));
		expect(screen.getByRole("adjustable").props.accessibilityValue).toEqual({ text: "Jan: Desktop 186, Mobile 80" });
	});

	test("the tooltip's formatters reach the value text and the summary", async () => {
		await renderWithProviders(
			<Chart config={CONFIG} data={DATA} xKey="month">
				<Chart.Line yKey="desktop" />
				<Chart.Line yKey="mobile" />
				<Chart.Tooltip
					formatHeading={(row) => `Month ${String(row.month)}`}
					formatValue={(value) => `$${String(value)}`}
				/>
			</Chart>
		);
		const frame = screen.getByRole("adjustable");
		expect(frame.props.accessibilityLabel).toContain("highest $305");
		await fireEvent(frame, "accessibilityAction", step("increment"));
		expect(screen.getByRole("adjustable").props.accessibilityValue).toEqual({
			text: "Month Jan: Desktop $186, Mobile $80",
		});
	});
});
