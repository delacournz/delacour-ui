import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";
import { Text } from "react-native";
import { renderWithProviders, screen } from "../../test/render";
import { Progress } from "./progress";
import { useProgress } from "./progress.context";

function Probe() {
	const { ratio } = useProgress();
	return <Text>{String(ratio)}</Text>;
}

describe("Progress", () => {
	test("a bare bar is a progressbar with a 0-100 value spoken as a percentage", async () => {
		await renderWithProviders(<Progress accessibilityLabel="Upload" value={40} />);
		const bar = screen.getByRole("progressbar", { name: "Upload" });
		expect(bar).toBeOnTheScreen();
		expect(bar).toHaveAccessibilityValue({ max: 100, min: 0, now: 40, text: "40%" });
		expect(bar).not.toBeBusy();
	});

	test("defaults to zero when given no value", async () => {
		await renderWithProviders(<Progress accessibilityLabel="Upload" />);
		expect(screen.getByRole("progressbar")).toHaveAccessibilityValue({ max: 100, min: 0, now: 0, text: "0%" });
	});

	test("clamps a value outside the range", async () => {
		await renderWithProviders(<Progress accessibilityLabel="Upload" value={250} />);
		expect(screen.getByRole("progressbar")).toHaveAccessibilityValue({ max: 100, min: 0, now: 100, text: "100%" });
	});

	test("a non-finite value reads as empty rather than NaN", async () => {
		await renderWithProviders(<Progress accessibilityLabel="Upload" value={Number.NaN} />);
		expect(screen.getByRole("progressbar")).toHaveAccessibilityValue({ max: 100, min: 0, now: 0, text: "0%" });
	});

	test("a custom range is spoken as a count over the maximum", async () => {
		await renderWithProviders(<Progress accessibilityLabel="Seats" maxValue={24} value={18} />);
		expect(screen.getByRole("progressbar")).toHaveAccessibilityValue({ max: 24, min: 0, now: 18, text: "18 of 24" });
	});

	test("a non-percent format styles the spoken count", async () => {
		await renderWithProviders(
			<Progress
				accessibilityLabel="Budget"
				formatOptions={{ currency: "USD", maximumFractionDigits: 0, style: "currency" }}
				maxValue={2000}
				value={1250}
			/>
		);
		expect(screen.getByRole("progressbar")).toHaveAccessibilityValue({
			max: 2000,
			min: 0,
			now: 1250,
			text: "$1,250 of $2,000",
		});
	});

	test("valueLabel replaces the spoken text and the readout alike", async () => {
		await renderWithProviders(
			<Progress accessibilityLabel="Upload" value={40} valueLabel="Almost there">
				<Progress.Header>
					<Progress.Output />
				</Progress.Header>
				<Progress.Track>
					<Progress.Fill />
				</Progress.Track>
			</Progress>
		);
		expect(screen.getByRole("progressbar")).toHaveAccessibilityValue({
			max: 100,
			min: 0,
			now: 40,
			text: "Almost there",
		});
		expect(screen.getByText("Almost there", { includeHiddenElements: true })).toBeOnTheScreen();
	});

	test("indeterminate is busy and publishes no value", async () => {
		await renderWithProviders(<Progress accessibilityLabel="Syncing" isIndeterminate value={60} />);
		const bar = screen.getByRole("progressbar", { name: "Syncing" });
		expect(bar).toBeBusy();
		expect(bar.props.accessibilityValue).toBeUndefined();
	});

	test("leaving indeterminate clears busy and restores the value", async () => {
		const view = await renderWithProviders(<Progress accessibilityLabel="Syncing" isIndeterminate />);
		expect(screen.getByRole("progressbar")).toBeBusy();
		await view.rerender(<Progress accessibilityLabel="Syncing" value={30} />);
		const bar = screen.getByRole("progressbar");
		expect(bar).not.toBeBusy();
		expect(bar).toHaveAccessibilityValue({ max: 100, min: 0, now: 30, text: "30%" });
	});

	test("a Progress.Label names the bar", async () => {
		await renderWithProviders(
			<Progress value={40}>
				<Progress.Header>
					<Progress.Label>Uploading</Progress.Label>
					<Progress.Output />
				</Progress.Header>
				<Progress.Track>
					<Progress.Fill />
				</Progress.Track>
			</Progress>
		);
		expect(screen.getByRole("progressbar", { name: /Uploading/ })).toBeOnTheScreen();
	});

	test("the readout shows the formatted value but is hidden from assistive technology", async () => {
		await renderWithProviders(
			<Progress accessibilityLabel="Upload" value={72}>
				<Progress.Header>
					<Progress.Output />
				</Progress.Header>
			</Progress>
		);
		expect(screen.queryByText("72%")).not.toBeOnTheScreen();
		const output = screen.getByText("72%", { includeHiddenElements: true });
		expect(output).toBeOnTheScreen();
		expect(output.props.accessibilityElementsHidden).toBe(true);
		expect(output.props.importantForAccessibility).toBe("no-hide-descendants");
	});

	test("the readout of a custom range is the share, and a function child words it", async () => {
		await renderWithProviders(
			<Progress accessibilityLabel="Seats" maxValue={24} value={18}>
				<Progress.Output>
					{({ value, maxValue, formatted }) => `${value} of ${maxValue} (${formatted})`}
				</Progress.Output>
			</Progress>
		);
		expect(screen.getByText("18 of 24 (75%)", { includeHiddenElements: true })).toBeOnTheScreen();
	});

	test("indeterminate renders no default readout, but a function child still runs", async () => {
		await renderWithProviders(
			<Progress accessibilityLabel="Syncing" isIndeterminate>
				<Progress.Output testID="default" />
				<Progress.Output testID="custom">
					{({ isIndeterminate }) => (isIndeterminate ? "Waiting" : "Done")}
				</Progress.Output>
			</Progress>
		);
		expect(screen.queryByTestId("default", { includeHiddenElements: true })).not.toBeOnTheScreen();
		expect(screen.getByText("Waiting", { includeHiddenElements: true })).toBeOnTheScreen();
	});

	test("the value follows a rerender", async () => {
		const view = await renderWithProviders(<Progress accessibilityLabel="Upload" value={10} />);
		await view.rerender(<Progress accessibilityLabel="Upload" value={90} />);
		expect(screen.getByRole("progressbar")).toHaveAccessibilityValue({ max: 100, min: 0, now: 90, text: "90%" });
	});

	test("every colour and size keeps the same semantics", async () => {
		await renderWithProviders(<Progress accessibilityLabel="Upload" color="destructive" size="lg" value={40} />);
		const bar = screen.getByRole("progressbar");
		expect(bar).toHaveAccessibilityValue({ max: 100, min: 0, now: 40, text: "40%" });
		expect(bar).not.toBeBusy();
	});

	test("useProgress reads the bar's ratio inside it", async () => {
		await renderWithProviders(
			<Progress accessibilityLabel="Upload" maxValue={200} value={50}>
				<Probe />
			</Progress>
		);
		expect(screen.getByText("0.25")).toBeOnTheScreen();
	});

	describe("a part outside its root", () => {
		const original = console.error;
		beforeEach(() => {
			console.error = () => undefined;
		});
		afterEach(() => {
			console.error = original;
		});

		test.each([
			["Progress.Label", <Progress.Label key="l">x</Progress.Label>],
			["Progress.Output", <Progress.Output key="o" />],
			["Progress.Track", <Progress.Track key="t" />],
			["Progress.Fill", <Progress.Fill key="f" />],
		])("%s throws", async (name, part) => {
			await expect(renderWithProviders(part)).rejects.toThrow(`${name} must be rendered inside a <Progress>.`);
		});

		test("useProgress throws", async () => {
			await expect(renderWithProviders(<Probe />)).rejects.toThrow("useProgress must be called inside a <Progress>.");
		});
	});
});
