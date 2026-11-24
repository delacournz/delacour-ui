import { describe, expect, test } from "@jest/globals";
import { renderWithProviders, screen } from "../../test/render";
import { Chart } from "./chart";

const CONFIG = {
	desktop: { label: "Desktop" },
	mobile: { label: "Mobile", dash: [6, 4] as const },
};

const DATA = [
	{ month: "Jan", desktop: 186, mobile: 80 },
	{ month: "Feb", desktop: 305, mobile: 200 },
];

/**
 * Skia is mocked under Jest, so these assert the legend's React Native
 * structure and that the line mounts; the dashed canvas stroke itself is only
 * verifiable on a simulator.
 */
describe("Chart.Legend dash cue", () => {
	test("a dashed series swatch renders dash segments, a solid one a single block", async () => {
		await renderWithProviders(
			<Chart config={CONFIG} data={DATA} xKey="month">
				<Chart.Line yKey="desktop" />
				<Chart.Line yKey="mobile" />
				<Chart.Legend />
			</Chart>
		);
		const solid = screen.getByTestId("chart-legend-swatch-desktop", { includeHiddenElements: true });
		const dashed = screen.getByTestId("chart-legend-swatch-mobile", { includeHiddenElements: true });
		expect(solid.children).toHaveLength(0);
		expect(dashed.children.length).toBeGreaterThan(1);
	});

	test("hides both swatches from assistive tech", async () => {
		await renderWithProviders(
			<Chart config={CONFIG} data={DATA} xKey="month">
				<Chart.Line yKey="desktop" />
				<Chart.Legend />
			</Chart>
		);
		expect(screen.queryByTestId("chart-legend-swatch-desktop")).toBeNull();
		expect(screen.getByText("Desktop")).toBeOnTheScreen();
	});

	test("Chart.Line accepts dash={false} and a dash override", async () => {
		await renderWithProviders(
			<Chart config={CONFIG} data={DATA} testID="chart" xKey="month">
				<Chart.Line dash={false} yKey="mobile" />
				<Chart.Line dash={[2, 2]} yKey="desktop" />
			</Chart>
		);
		expect(screen.getByTestId("chart")).toBeOnTheScreen();
	});
});
