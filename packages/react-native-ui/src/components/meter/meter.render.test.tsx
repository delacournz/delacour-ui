import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import type { ReactElement } from "react";
import { renderWithProviders, screen } from "../../test/render";
import { Meter } from "./meter";
import type { MeterRenderProps } from "./meter.types";

const hidden = { includeHiddenElements: true } as const;

describe("Meter", () => {
	test("is one progressbar named by its label, with the percentage as its value", async () => {
		await renderWithProviders(
			<Meter value={68}>
				<Meter.Header>
					<Meter.Label>Storage</Meter.Label>
					<Meter.Output />
				</Meter.Header>
				<Meter.Track>
					<Meter.Fill />
				</Meter.Track>
			</Meter>
		);
		const meter = screen.getByRole("progressbar", { name: /Storage/ });
		expect(meter).toBeOnTheScreen();
		expect(meter).toHaveAccessibilityValue({ min: 0, max: 100, now: 68, text: "68%" });
	});

	test("a bare meter draws and announces itself with an accessibilityLabel", async () => {
		await renderWithProviders(<Meter accessibilityLabel="Battery" value={40} />);
		const meter = screen.getByRole("progressbar", { name: "Battery" });
		expect(meter).toHaveAccessibilityValue({ min: 0, max: 100, now: 40, text: "40%" });
		expect(meter).not.toBeBusy();
	});

	test("is not a control: no disabled state", async () => {
		await renderWithProviders(<Meter accessibilityLabel="Battery" value={40} />);
		expect(screen.getByRole("progressbar")).not.toBeDisabled();
	});

	test("a custom scale publishes min, max, now and an 'x of y' text", async () => {
		await renderWithProviders(<Meter accessibilityLabel="Disk" maxValue={256} minValue={0} value={168} />);
		expect(screen.getByRole("progressbar")).toHaveAccessibilityValue({
			min: 0,
			max: 256,
			now: 168,
			text: "168 of 256",
		});
	});

	test("a non-percent format formats the reading itself", async () => {
		await renderWithProviders(
			<Meter accessibilityLabel="Disk" formatOptions={{ style: "unit", unit: "gigabyte" }} maxValue={256} value={168} />
		);
		const value = screen.getByRole("progressbar").props.accessibilityValue as { now: number; text: string };
		expect(value.now).toBe(168);
		expect(value.text).toContain("168");
		expect(value.text).not.toContain("%");
	});

	test("a reading above the scale clamps to the top", async () => {
		await renderWithProviders(<Meter accessibilityLabel="Disk" maxValue={256} value={300} />);
		expect(screen.getByRole("progressbar")).toHaveAccessibilityValue({ min: 0, max: 256, now: 256 });
	});

	test("a reading below the scale clamps to the floor", async () => {
		await renderWithProviders(<Meter accessibilityLabel="Temp" maxValue={50} minValue={10} value={-5} />);
		expect(screen.getByRole("progressbar")).toHaveAccessibilityValue({ min: 10, max: 50, now: 10 });
	});

	test("NaN reads at the floor", async () => {
		await renderWithProviders(<Meter accessibilityLabel="Disk" value={Number.NaN} />);
		expect(screen.getByRole("progressbar")).toHaveAccessibilityValue({ min: 0, max: 100, now: 0 });
	});

	test("an inverted scale collapses to its floor rather than inverting", async () => {
		await renderWithProviders(<Meter accessibilityLabel="Odd" maxValue={0} minValue={50} value={25} />);
		const value = screen.getByRole("progressbar").props.accessibilityValue as { min: number; max: number; now: number };
		expect(value.now).toBeGreaterThanOrEqual(value.min);
		expect(value.now).toBeLessThanOrEqual(value.max);
	});

	test("valueLabel replaces the spoken text and the readout", async () => {
		await renderWithProviders(
			<Meter accessibilityLabel="Password" valueLabel="Strong" value={80}>
				<Meter.Output />
			</Meter>
		);
		expect(screen.getByRole("progressbar")).toHaveAccessibilityValue({ min: 0, max: 100, now: 80, text: "Strong" });
		expect(screen.getByText("Strong", hidden)).toBeOnTheScreen();
	});

	test("a valueLabel function is handed the judged region, and what it returns is spoken", async () => {
		const valueLabel = jest.fn((reading: { region: string | null }) => `Region ${reading.region}`);
		await renderWithProviders(
			<Meter accessibilityLabel="Disk" high={90} low={60} optimum={0} value={95} valueLabel={valueLabel} />
		);
		expect(screen.getByRole("progressbar")).toHaveAccessibilityValue({ text: "Region critical" });
		expect(valueLabel).toHaveBeenCalledWith(expect.objectContaining({ region: "critical", value: 95 }));
	});

	test("regions: low-is-good optimum judges each part of the scale", async () => {
		const regions: Array<[number, string]> = [
			[30, "optimum"],
			[75, "suboptimum"],
			[95, "critical"],
		];
		for (const [value, expected] of regions) {
			const { unmount } = await renderWithProviders(
				<Meter accessibilityLabel="Disk" high={90} low={60} optimum={0} value={value}>
					<Meter.Output>{(props) => props.region}</Meter.Output>
				</Meter>
			);
			expect(screen.getByText(expected, hidden)).toBeOnTheScreen();
			await unmount();
		}
	});

	test("regions: high-is-good optimum flips the judgement", async () => {
		await renderWithProviders(
			<Meter accessibilityLabel="Battery" high={80} low={20} optimum={100} value={10}>
				<Meter.Output>{(props) => props.region}</Meter.Output>
			</Meter>
		);
		expect(screen.getByText("critical", hidden)).toBeOnTheScreen();
	});

	test("regions never change the spoken value", async () => {
		await renderWithProviders(<Meter accessibilityLabel="Disk" high={90} low={60} optimum={0} value={95} />);
		expect(screen.getByRole("progressbar")).toHaveAccessibilityValue({ min: 0, max: 100, now: 95, text: "95%" });
	});

	test("thresholds: the highest `from` reached wins, in any listed order", async () => {
		const colours: string[] = [];
		const Probe = ({ value }: { value: number }): ReactElement => (
			<Meter
				accessibilityLabel="Disk"
				color="primary"
				thresholds={[
					{ from: 90, color: "destructive" },
					{ from: 50, color: "warning" },
				]}
				value={value}
			>
				<Meter.Output>
					{(props) => {
						colours.push(props.color);
						return props.color;
					}}
				</Meter.Output>
			</Meter>
		);
		const view = await renderWithProviders(<Probe value={20} />);
		expect(screen.getByText("primary", hidden)).toBeOnTheScreen();
		await view.rerender(<Probe value={60} />);
		expect(screen.getByText("warning", hidden)).toBeOnTheScreen();
		await view.rerender(<Probe value={95} />);
		expect(screen.getByText("destructive", hidden)).toBeOnTheScreen();
	});

	test("Meter.Output is hidden from assistive technology", async () => {
		await renderWithProviders(
			<Meter accessibilityLabel="Disk" value={68}>
				<Meter.Output />
			</Meter>
		);
		expect(screen.queryByText("68%")).not.toBeOnTheScreen();
		expect(screen.getByText("68%", hidden)).toBeOnTheScreen();
	});

	test("Meter.Output's function child receives the clamped reading", async () => {
		let seen: MeterRenderProps | null = null;
		await renderWithProviders(
			<Meter accessibilityLabel="Disk" maxValue={256} value={300}>
				<Meter.Output>
					{(props) => {
						seen = props;
						return `${props.value}/${props.maxValue}`;
					}}
				</Meter.Output>
			</Meter>
		);
		expect(screen.getByText("256/256", hidden)).toBeOnTheScreen();
		expect((seen as MeterRenderProps | null)?.ratio).toBe(1);
	});

	test("segments: whole blocks light, and any reading above the floor lights one", async () => {
		const lit: number[] = [];
		const Probe = ({ value }: { value: number }): ReactElement => (
			<Meter accessibilityLabel="Strength" maxValue={4} segments={4} value={value}>
				<Meter.Output>
					{(props) => {
						lit.push(props.litSegments);
						return `${props.litSegments}/${props.segments}`;
					}}
				</Meter.Output>
				<Meter.Segments />
			</Meter>
		);
		const view = await renderWithProviders(<Probe value={3} />);
		expect(screen.getByText("3/4", hidden)).toBeOnTheScreen();
		await view.rerender(<Probe value={0.1} />);
		expect(screen.getByText("1/4", hidden)).toBeOnTheScreen();
		await view.rerender(<Probe value={0} />);
		expect(screen.getByText("0/4", hidden)).toBeOnTheScreen();
	});

	test("segments leave the spoken value unchanged", async () => {
		await renderWithProviders(<Meter accessibilityLabel="Strength" maxValue={4} segments={4} value={3} />);
		expect(screen.getByRole("progressbar")).toHaveAccessibilityValue({ min: 0, max: 4, now: 3, text: "3 of 4" });
	});

	test("an unusable segment count falls back to the continuous bar", async () => {
		await renderWithProviders(
			<Meter accessibilityLabel="Strength" segments={0} value={50}>
				<Meter.Output>{(props) => String(props.segments)}</Meter.Output>
			</Meter>
		);
		expect(screen.getByText("null", hidden)).toBeOnTheScreen();
	});

	test("rerendering with a new value updates the published value", async () => {
		const view = await renderWithProviders(<Meter accessibilityLabel="Disk" value={10} />);
		expect(screen.getByRole("progressbar")).toHaveAccessibilityValue({ now: 10, text: "10%" });
		await view.rerender(<Meter accessibilityLabel="Disk" value={90} />);
		expect(screen.getByRole("progressbar")).toHaveAccessibilityValue({ now: 90, text: "90%" });
	});

	describe("outside a Meter", () => {
		let spy: ReturnType<typeof jest.spyOn>;
		beforeEach(() => {
			spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
		});
		afterEach(() => {
			spy.mockRestore();
		});

		const parts: Array<[string, ReactElement]> = [
			["Meter.Header", <Meter.Header key="h" />],
			["Meter.Label", <Meter.Label key="l">x</Meter.Label>],
			["Meter.Output", <Meter.Output key="o" />],
			["Meter.Track", <Meter.Track key="t" />],
			["Meter.Fill", <Meter.Fill key="f" />],
			["Meter.Segments", <Meter.Segments key="s" />],
		];

		test.each(parts)("%s throws naming itself", async (name, element) => {
			await expect(renderWithProviders(element)).rejects.toThrow(`${name} must be rendered inside a <Meter>.`);
		});
	});
});
