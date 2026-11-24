import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Chart } from "./chart";
import { PieChart } from "./pie-chart";

const CONFIG = {
	desktop: { label: "Desktop" },
	mobile: { label: "Mobile" },
};

const DATA = [
	{ month: "Jan", desktop: 186, mobile: 80 },
	{ month: "Feb", desktop: 305, mobile: 200 },
	{ month: "Mar", desktop: 237, mobile: 120 },
];

const PIE_DATA = [
	{ plan: "Free", seats: 640 },
	{ plan: "Team", seats: 310 },
	{ plan: "Business", seats: 175 },
];

const FRAME = { nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 200 } } };

/** Swaps `console.error` for a no-op while a render is expected to throw. */
function silenceConsoleError(): () => void {
	const original = console.error;
	console.error = () => undefined;
	return () => {
		console.error = original;
	};
}

describe("Chart", () => {
	let restoreConsole: () => void = () => undefined;
	beforeEach(() => {
		restoreConsole = () => undefined;
	});
	afterEach(() => {
		restoreConsole();
	});

	test("renders its frame and the legend's series labels", async () => {
		await renderWithProviders(
			<Chart config={CONFIG} data={DATA} testID="chart" xKey="month">
				<Chart.Grid />
				<Chart.Line yKey="desktop" />
				<Chart.Line yKey="mobile" />
				<Chart.Legend />
			</Chart>
		);
		expect(screen.getByTestId("chart")).toBeOnTheScreen();
		expect(screen.getByText("Desktop")).toBeOnTheScreen();
		expect(screen.getByText("Mobile")).toBeOnTheScreen();
	});

	test("measures its frame through onLayout without remounting", async () => {
		await renderWithProviders(
			<Chart config={CONFIG} data={DATA} testID="chart" xKey="month">
				<Chart.Line yKey="desktop" />
				<Chart.Legend />
			</Chart>
		);
		await fireEvent(screen.getByTestId("chart"), "layout", FRAME);
		expect(screen.getByTestId("chart")).toBeOnTheScreen();
		expect(screen.getByText("Desktop")).toBeOnTheScreen();
	});

	test("the legend lists every series of the config by default", async () => {
		await renderWithProviders(
			<Chart config={CONFIG} data={DATA} xKey="month">
				<Chart.Line yKey="desktop" />
				<Chart.Legend />
			</Chart>
		);
		expect(screen.getByText("Desktop")).toBeOnTheScreen();
		expect(screen.getByText("Mobile")).toBeOnTheScreen();
	});

	test("yKeys limits the series the legend shows", async () => {
		await renderWithProviders(
			<Chart config={CONFIG} data={DATA} xKey="month" yKeys={["mobile"]}>
				<Chart.Line yKey="mobile" />
				<Chart.Legend />
			</Chart>
		);
		expect(screen.getByText("Mobile")).toBeOnTheScreen();
		expect(screen.queryByText("Desktop")).not.toBeOnTheScreen();
	});

	test("Legend keys picks and orders the rows", async () => {
		await renderWithProviders(
			<Chart config={CONFIG} data={DATA} xKey="month">
				<Chart.Line yKey="desktop" />
				<Chart.Legend keys={["mobile"]} />
			</Chart>
		);
		expect(screen.getByText("Mobile")).toBeOnTheScreen();
		expect(screen.queryByText("Desktop")).not.toBeOnTheScreen();
	});

	test("the tooltip names each series before anything is scrubbed", async () => {
		await renderWithProviders(
			<Chart config={CONFIG} data={DATA} xKey="month">
				<Chart.Line yKey="desktop" />
				<Chart.Line yKey="mobile" />
				<Chart.Tooltip.Dot />
				<Chart.Tooltip.X />
				<Chart.Tooltip.Y yKey="desktop" />
				<Chart.Tooltip />
			</Chart>
		);
		expect(screen.getByText("Desktop")).toBeOnTheScreen();
		expect(screen.getByText("Mobile")).toBeOnTheScreen();
	});

	test("bars group, and bars sharing a stackId stack, without throwing", async () => {
		await renderWithProviders(
			<Chart config={CONFIG} data={DATA} testID="grouped" xKey="month">
				<Chart.Bar yKey="desktop" />
				<Chart.Bar yKey="mobile" />
			</Chart>
		);
		expect(screen.getByTestId("grouped")).toBeOnTheScreen();

		await renderWithProviders(
			<Chart config={CONFIG} data={DATA} testID="stacked" xKey="month">
				<Chart.Bar stackId="traffic" yKey="desktop" />
				<Chart.Bar stackId="traffic" yKey="mobile" />
			</Chart>
		);
		expect(screen.getByTestId("stacked")).toBeOnTheScreen();
	});

	test("every plot part mounts together, including axes, areas, scatter and a horizontal orientation", async () => {
		await renderWithProviders(
			<Chart config={CONFIG} data={DATA} orientation="horizontal" testID="chart" xKey="month">
				<Chart.Grid />
				<Chart.YAxis />
				<Chart.XAxis />
				<Chart.Bar yKey="desktop" />
				<Chart.Scatter yKey="mobile" />
			</Chart>
		);
		expect(screen.getByTestId("chart")).toBeOnTheScreen();

		await renderWithProviders(
			<Chart config={CONFIG} data={DATA} testID="area" xKey="month">
				<Chart.Area stackId="a" yKey="desktop" />
				<Chart.Area stackId="a" yKey="mobile" />
			</Chart>
		);
		expect(screen.getByTestId("area")).toBeOnTheScreen();
	});

	test("a series colour may be a literal or a theme token", async () => {
		await renderWithProviders(
			<Chart
				config={{ desktop: { label: "Desktop", color: "#EC4899" }, mobile: { label: "Mobile", color: "chart-4" } }}
				data={DATA}
				xKey="month"
			>
				<Chart.Line yKey="desktop" />
				<Chart.Line yKey="mobile" />
				<Chart.Legend />
			</Chart>
		);
		expect(screen.getByText("Desktop")).toBeOnTheScreen();
		expect(screen.getByText("Mobile")).toBeOnTheScreen();
	});

	test("two stack ids throw the one-stack error", async () => {
		restoreConsole = silenceConsoleError();
		await expect(
			renderWithProviders(
				<Chart config={CONFIG} data={DATA} xKey="month">
					<Chart.Bar stackId="a" yKey="desktop" />
					<Chart.Bar stackId="b" yKey="mobile" />
				</Chart>
			)
		).rejects.toThrow(/\[DelacourUI\.Chart\]/);
	});

	test("a stack beside a loose bar throws", async () => {
		restoreConsole = silenceConsoleError();
		await expect(
			renderWithProviders(
				<Chart config={CONFIG} data={DATA} xKey="month">
					<Chart.Bar stackId="a" yKey="desktop" />
					<Chart.Bar yKey="mobile" />
				</Chart>
			)
		).rejects.toThrow(/\[DelacourUI\.Chart\]/);
	});

	test("the same bar placed twice throws by name", async () => {
		restoreConsole = silenceConsoleError();
		await expect(
			renderWithProviders(
				<Chart config={CONFIG} data={DATA} xKey="month">
					<Chart.Bar yKey="desktop" />
					<Chart.Bar yKey="desktop" />
				</Chart>
			)
		).rejects.toThrow(/was placed twice/);
	});

	test("a part outside a Chart throws its documented error", async () => {
		restoreConsole = silenceConsoleError();
		await expect(renderWithProviders(<Chart.Line yKey="desktop" />)).rejects.toThrow(
			/a Chart part was used outside a <Chart>/
		);
	});

	test("the legend outside any chart throws", async () => {
		restoreConsole = silenceConsoleError();
		await expect(renderWithProviders(<Chart.Legend />)).rejects.toThrow(
			/a chart part was used outside a <Chart> or a <PieChart>/
		);
	});
});

describe("PieChart", () => {
	let restoreConsole: () => void = () => undefined;
	beforeEach(() => {
		restoreConsole = () => undefined;
	});
	afterEach(() => {
		restoreConsole();
	});

	test("renders its frame and one legend row per row of data", async () => {
		await renderWithProviders(
			<PieChart data={PIE_DATA} nameKey="plan" testID="pie" valueKey="seats">
				<PieChart.Slice />
				<PieChart.Legend />
			</PieChart>
		);
		expect(screen.getByTestId("pie")).toBeOnTheScreen();
		expect(screen.getByText("Free")).toBeOnTheScreen();
		expect(screen.getByText("Team")).toBeOnTheScreen();
		expect(screen.getByText("Business")).toBeOnTheScreen();
	});

	test("a config entry relabels one row", async () => {
		await renderWithProviders(
			<PieChart config={{ Team: { label: "Teams" } }} data={PIE_DATA} nameKey="plan" valueKey="seats">
				<PieChart.Slice />
				<PieChart.Legend />
			</PieChart>
		);
		expect(screen.getByText("Teams")).toBeOnTheScreen();
		expect(screen.queryByText("Team")).not.toBeOnTheScreen();
	});

	test("rows with a negative, missing or unreadable value are dropped everywhere", async () => {
		await renderWithProviders(
			<PieChart
				data={[
					{ plan: "Free", seats: 10 },
					{ plan: "Negative", seats: -5 },
					{ plan: "Missing" },
					{ plan: "Bad", seats: "n/a" },
					{ plan: "Team", seats: 30 },
				]}
				nameKey="plan"
				valueKey="seats"
			>
				<PieChart.Slice />
				<PieChart.Legend />
			</PieChart>
		);
		expect(screen.getByText("Free")).toBeOnTheScreen();
		expect(screen.getByText("Team")).toBeOnTheScreen();
		expect(screen.queryByText("Negative")).not.toBeOnTheScreen();
		expect(screen.queryByText("Missing")).not.toBeOnTheScreen();
		expect(screen.queryByText("Bad")).not.toBeOnTheScreen();
	});

	test("rows sharing a name both reach the legend", async () => {
		await renderWithProviders(
			<PieChart
				data={[
					{ plan: "Free", seats: 10 },
					{ plan: "Free", seats: 20 },
				]}
				nameKey="plan"
				valueKey="seats"
			>
				<PieChart.Slice />
				<PieChart.Legend />
			</PieChart>
		);
		expect(screen.getAllByText("Free")).toHaveLength(2);
	});

	test("an empty data set renders an empty legend", async () => {
		await renderWithProviders(
			<PieChart data={[]} nameKey="plan" testID="pie" valueKey="seats">
				<PieChart.Slice />
				<PieChart.Legend />
			</PieChart>
		);
		expect(screen.getByTestId("pie")).toBeOnTheScreen();
		expect(screen.queryByText("Free")).not.toBeOnTheScreen();
	});

	test("Center prints its value and label, and nothing it was not given", async () => {
		await renderWithProviders(
			<PieChart data={PIE_DATA} innerRadius={0.6} nameKey="plan" valueKey="seats">
				<PieChart.Slice />
				<PieChart.Center label="Seats" value="1,125" />
			</PieChart>
		);
		expect(screen.getByText("1,125")).toBeOnTheScreen();
		expect(screen.getByText("Seats")).toBeOnTheScreen();

		await renderWithProviders(
			<PieChart data={PIE_DATA} nameKey="plan" valueKey="seats">
				<PieChart.Center label="Only a caption" />
			</PieChart>
		);
		expect(screen.getByText("Only a caption")).toBeOnTheScreen();
	});

	test("the tooltip is hidden while nothing is selected", async () => {
		await renderWithProviders(
			<PieChart data={PIE_DATA} nameKey="plan" valueKey="seats">
				<PieChart.Slice />
				<PieChart.Tooltip />
			</PieChart>
		);
		expect(screen.queryByText("Free")).not.toBeOnTheScreen();
		expect(screen.queryByText("1%")).not.toBeOnTheScreen();
	});

	test("controlled selectedIndex shows that slice's name, grouped value and share", async () => {
		const view = await renderWithProviders(
			<PieChart data={PIE_DATA} nameKey="plan" selectedIndex={0} valueKey="seats">
				<PieChart.Slice />
				<PieChart.Tooltip />
			</PieChart>
		);
		await fireEvent(screen.getByText("Free"), "layout", FRAME);
		expect(screen.getByText("Free")).toBeOnTheScreen();
		expect(screen.getByText("640")).toBeOnTheScreen();
		expect(screen.getByText("57%")).toBeOnTheScreen();

		await view.rerender(
			<PieChart data={PIE_DATA} nameKey="plan" selectedIndex={1} valueKey="seats">
				<PieChart.Slice />
				<PieChart.Tooltip />
			</PieChart>
		);
		expect(screen.getByText("Team")).toBeOnTheScreen();
		expect(screen.getByText("310")).toBeOnTheScreen();
		expect(screen.getByText("28%")).toBeOnTheScreen();
		expect(screen.queryByText("Free")).not.toBeOnTheScreen();

		await view.rerender(
			<PieChart data={PIE_DATA} nameKey="plan" selectedIndex={null} valueKey="seats">
				<PieChart.Slice />
				<PieChart.Tooltip />
			</PieChart>
		);
		expect(screen.queryByText("Team")).not.toBeOnTheScreen();
	});

	test("the tooltip groups thousands and honours formatValue and formatPercent", async () => {
		await renderWithProviders(
			<PieChart
				data={[
					{ plan: "Free", seats: 1240 },
					{ plan: "Team", seats: 1240 },
				]}
				nameKey="plan"
				selectedIndex={0}
				valueKey="seats"
			>
				<PieChart.Slice />
				<PieChart.Tooltip />
			</PieChart>
		);
		expect(screen.getByText("1,240")).toBeOnTheScreen();
		expect(screen.getByText("50%")).toBeOnTheScreen();

		await renderWithProviders(
			<PieChart data={PIE_DATA} nameKey="plan" selectedIndex={2} valueKey="seats">
				<PieChart.Tooltip
					formatPercent={(percent) => `${percent.toFixed(1)} pct`}
					formatValue={(value, name) => `${name}=${value}`}
				/>
			</PieChart>
		);
		expect(screen.getByText("Business=175")).toBeOnTheScreen();
		expect(screen.getByText("15.6 pct")).toBeOnTheScreen();
	});

	test("an out-of-range selectedIndex shows no tooltip", async () => {
		await renderWithProviders(
			<PieChart data={PIE_DATA} nameKey="plan" selectedIndex={9} valueKey="seats">
				<PieChart.Slice />
				<PieChart.Tooltip />
			</PieChart>
		);
		expect(screen.queryByText("Free")).not.toBeOnTheScreen();
	});

	test("the labels part mounts beside the slices", async () => {
		await renderWithProviders(
			<PieChart data={PIE_DATA} nameKey="plan" testID="pie" valueKey="seats">
				<PieChart.Slice />
				<PieChart.Label format="value" />
			</PieChart>
		);
		expect(screen.getByTestId("pie")).toBeOnTheScreen();
	});

	test("Center outside a PieChart throws its documented error", async () => {
		restoreConsole = silenceConsoleError();
		await expect(renderWithProviders(<PieChart.Center value="1" />)).rejects.toThrow(
			/a PieChart part was used outside a <PieChart>/
		);
	});

	test("Tooltip outside a PieChart throws its documented error", async () => {
		restoreConsole = silenceConsoleError();
		await expect(renderWithProviders(<PieChart.Tooltip />)).rejects.toThrow(
			/a PieChart part was used outside a <PieChart>/
		);
	});

	test("the legend inside a PieChart does not throw (shared with Chart)", async () => {
		const spy = jest.fn();
		await renderWithProviders(
			<PieChart data={PIE_DATA} nameKey="plan" onSelect={spy} valueKey="seats">
				<PieChart.Legend />
			</PieChart>
		);
		expect(screen.getByText("Free")).toBeOnTheScreen();
		expect(spy).not.toHaveBeenCalled();
	});
});
