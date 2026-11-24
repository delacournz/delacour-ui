import { describe, expect, jest, test } from "@jest/globals";
import { Platform } from "react-native";
import { LabelsProvider } from "../../hooks/use-labels";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { PieChart } from "./pie-chart";

const DATA = [
	{ plan: "Free", seats: 640 },
	{ plan: "Team", seats: 310 },
	{ plan: "Broken", seats: -5 },
	{ plan: "Business", seats: 175 },
];

const FRAME = { nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 200 } } };

describe("PieChart accessibility", () => {
	test("a pie nothing selects is one image carrying the summary", async () => {
		await renderWithProviders(
			<PieChart data={DATA} nameKey="plan" testID="pie" valueKey="seats">
				<PieChart.Slice />
			</PieChart>
		);
		const frame = screen.getByTestId("pie");
		expect(frame.props.accessible).toBe(true);
		expect(frame.props.accessibilityRole).toBe("image");
		expect(frame.props.accessibilityLabel).toBe("Pie chart. Free 57%, Team 28%, Business 16%.");
	});

	test("accessibilityLabel overrides the summary", async () => {
		await renderWithProviders(
			<PieChart accessibilityLabel="Seats by plan" data={DATA} nameKey="plan" testID="pie" valueKey="seats">
				<PieChart.Slice />
			</PieChart>
		);
		expect(screen.getByTestId("pie").props.accessibilityLabel).toBe("Seats by plan");
	});

	test("accessible={false} hides the whole frame, its centre and tooltip included", async () => {
		await renderWithProviders(
			<PieChart accessible={false} data={DATA} nameKey="plan" selectedIndex={0} testID="pie" valueKey="seats">
				<PieChart.Slice />
				<PieChart.Center label="Seats" value="1,125" />
				<PieChart.Tooltip />
			</PieChart>
		);
		expect(screen.queryByRole("image")).toBeNull();
		expect(screen.queryByRole("button")).toBeNull();
		expect(screen.queryByText("Seats")).toBeNull();
		expect(screen.getByText("Seats", { includeHiddenElements: true })).toBeOnTheScreen();
	});

	test("a selectable pie leaves its frame plain and exposes the summary and a button per drawn slice", async () => {
		await renderWithProviders(
			<PieChart data={DATA} nameKey="plan" testID="pie" valueKey="seats">
				<PieChart.Slice />
				<PieChart.Tooltip formatValue={(value) => `${value} seats`} />
			</PieChart>
		);
		await fireEvent(screen.getByTestId("pie"), "layout", FRAME);
		expect(screen.getByTestId("pie").props.accessible).toBe(false);
		expect(screen.getByLabelText("Pie chart. Free 57%, Team 28%, Business 16%.")).toBeOnTheScreen();
		expect(screen.getAllByRole("button")).toHaveLength(3);
		expect(screen.getByLabelText("Free, 640 seats, 57%")).toBeOnTheScreen();
		expect(screen.getByLabelText("Team, 310 seats, 28%")).toBeOnTheScreen();
		expect(screen.getByLabelText("Business, 175 seats, 16%")).toBeOnTheScreen();
		expect(screen.queryByLabelText(/Broken/)).toBeNull();
	});

	test("an iOS accessibilityTap selects the slice, which then reports selected", async () => {
		const original = Platform.OS;
		Platform.OS = "ios";
		try {
			const onSelect = jest.fn();
			await renderWithProviders(
				<PieChart data={DATA} nameKey="plan" onSelect={onSelect} testID="pie" valueKey="seats">
					<PieChart.Slice />
				</PieChart>
			);
			await fireEvent(screen.getByTestId("pie"), "layout", FRAME);
			const team = screen.getByLabelText("Team, 310, 28%");
			expect(team.props.accessibilityState).toEqual({ selected: false });
			await fireEvent(team, "accessibilityTap");
			expect(onSelect).toHaveBeenCalledWith(1);
			expect(screen.getByLabelText("Team, 310, 28%").props.accessibilityState).toEqual({ selected: true });
		} finally {
			Platform.OS = original;
		}
	});

	test("an Android activate action selects the slice", async () => {
		const original = Platform.OS;
		Platform.OS = "android";
		try {
			const onSelect = jest.fn();
			await renderWithProviders(
				<PieChart data={DATA} nameKey="plan" onSelect={onSelect} testID="pie" valueKey="seats">
					<PieChart.Slice />
				</PieChart>
			);
			await fireEvent(screen.getByTestId("pie"), "layout", FRAME);
			const business = screen.getByLabelText("Business, 175, 16%");
			expect(business.props.accessibilityActions).toEqual([{ name: "activate" }]);
			await fireEvent(business, "accessibilityAction", { nativeEvent: { actionName: "activate" } });
			expect(onSelect).toHaveBeenCalledWith(2);
		} finally {
			Platform.OS = original;
		}
	});

	test("slice items never take a touch", async () => {
		await renderWithProviders(
			<PieChart data={DATA} nameKey="plan" testID="pie" valueKey="seats">
				<PieChart.Slice />
				<PieChart.Tooltip />
			</PieChart>
		);
		await fireEvent(screen.getByTestId("pie"), "layout", FRAME);
		for (const item of screen.getAllByRole("button")) expect(item.props.pointerEvents).toBe("none");
	});
});

describe("PieChart labels", () => {
	const german = {
		pieSummary: (slices: readonly string[]) => `Kreisdiagramm. ${slices.join("; ")}.`,
		pieSlice: (slice: string, value: string, percent: string) => `${slice}: ${value} (${percent})`,
		piePercent: (percent: number) => `${percent} Prozent`,
	};

	test("the labels prop changes the summary and the slice names", async () => {
		await renderWithProviders(
			<PieChart data={DATA} labels={german} nameKey="plan" testID="pie" valueKey="seats">
				<PieChart.Slice />
				<PieChart.Tooltip formatValue={(value) => `${value} seats`} />
			</PieChart>
		);
		await fireEvent(screen.getByTestId("pie"), "layout", FRAME);
		expect(
			screen.getByLabelText("Kreisdiagramm. Free 57 Prozent; Team 28 Prozent; Business 16 Prozent.")
		).toBeOnTheScreen();
		expect(screen.getByLabelText("Free: 640 seats (57 Prozent)")).toBeOnTheScreen();
	});

	test("a LabelsProvider changes them, the prop wins key by key, and formatPercent wins over both", async () => {
		await renderWithProviders(
			<LabelsProvider labels={{ chart: german }}>
				<PieChart
					data={DATA}
					labels={{ piePercent: (percent) => `${percent} pct` }}
					nameKey="plan"
					testID="pie"
					valueKey="seats"
				>
					<PieChart.Slice />
				</PieChart>
			</LabelsProvider>
		);
		expect(screen.getByTestId("pie").props.accessibilityLabel).toBe(
			"Kreisdiagramm. Free 57 pct; Team 28 pct; Business 16 pct."
		);
	});

	test("an accessibilityLabel still wins over the labels", async () => {
		await renderWithProviders(
			<PieChart
				accessibilityLabel="Seats by plan"
				data={DATA}
				labels={german}
				nameKey="plan"
				testID="pie"
				valueKey="seats"
			>
				<PieChart.Slice />
			</PieChart>
		);
		expect(screen.getByTestId("pie").props.accessibilityLabel).toBe("Seats by plan");
	});
});
