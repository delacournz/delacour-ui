import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Field } from "../field";
import { Slider } from "./slider";

const increment = { nativeEvent: { actionName: "increment" } };
const decrement = { nativeEvent: { actionName: "decrement" } };

/**
 * A drag is a Gesture Handler pan running worklets on the UI thread, which Jest
 * cannot drive, so these cover the assistive path instead: the `adjustable`
 * thumb's increment and decrement actions, which run the same snap and clamp.
 * The drag, `onChange` during a drag and haptics are verified in the playground.
 */
function Single(props: Partial<React.ComponentProps<typeof Slider>>) {
	return (
		<Slider {...props}>
			<Slider.Output testID="output" />
			<Slider.Track>
				<Slider.Fill />
				<Slider.Thumb accessibilityLabel="Volume" />
			</Slider.Track>
		</Slider>
	);
}

function Range(props: Partial<React.ComponentProps<typeof Slider>>) {
	return (
		<Slider defaultValue={[20, 60]} {...props}>
			<Slider.Track>
				<Slider.Fill />
				<Slider.Thumb accessibilityLabel="Min" index={0} />
				<Slider.Thumb accessibilityLabel="Max" index={1} />
			</Slider.Track>
		</Slider>
	);
}

describe("Slider", () => {
	describe("rendering", () => {
		test("the thumb is an adjustable named by its label", async () => {
			await renderWithProviders(<Single defaultValue={30} />);
			expect(screen.getByRole("adjustable", { name: "Volume" })).toBeOnTheScreen();
		});

		test("the thumb announces min, max, now and formatted text", async () => {
			await renderWithProviders(<Single defaultValue={30} maxValue={200} minValue={10} />);
			expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ max: 200, min: 10, now: 30, text: "30" });
		});

		test("formatOptions shape the announced text and the output", async () => {
			await renderWithProviders(
				<Single defaultValue={0.4} formatOptions={{ style: "percent" }} maxValue={1} minValue={0} step={0.1} />
			);
			expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ text: "40%" });
			expect(screen.getByTestId("output")).toHaveTextContent("40%");
		});

		test("mounting reports nothing", async () => {
			const onChange = jest.fn();
			const onChangeEnd = jest.fn();
			await renderWithProviders(<Single defaultValue={30} onChange={onChange} onChangeEnd={onChangeEnd} />);
			expect(onChange).not.toHaveBeenCalled();
			expect(onChangeEnd).not.toHaveBeenCalled();
		});

		test("the output shows the value", async () => {
			await renderWithProviders(<Single defaultValue={30} />);
			expect(screen.getByTestId("output")).toHaveTextContent("30");
		});

		test("a Field label names the thumb", async () => {
			await renderWithProviders(
				<Field>
					<Field.Label>Brightness</Field.Label>
					<Slider defaultValue={30}>
						<Slider.Track>
							<Slider.Thumb />
						</Slider.Track>
					</Slider>
				</Field>
			);
			expect(screen.getByRole("adjustable", { name: "Brightness" })).toBeOnTheScreen();
		});
	});

	describe("accessibility actions", () => {
		test("increment and decrement move the value by one step", async () => {
			await renderWithProviders(<Single defaultValue={30} step={5} />);
			const thumb = screen.getByRole("adjustable");
			await fireEvent(thumb, "accessibilityAction", increment);
			expect(thumb).toHaveAccessibilityValue({ now: 35 });
			await fireEvent(thumb, "accessibilityAction", decrement);
			await fireEvent(thumb, "accessibilityAction", decrement);
			expect(thumb).toHaveAccessibilityValue({ now: 25 });
			expect(screen.getByTestId("output")).toHaveTextContent("25");
		});

		test("a continuous slider nudges by a tenth of its range", async () => {
			await renderWithProviders(<Single defaultValue={50} step={0} />);
			await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", increment);
			expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 60 });
		});

		test("the value clamps at the maximum and at the minimum", async () => {
			const onChange = jest.fn();
			await renderWithProviders(<Single defaultValue={98} onChange={onChange} step={5} />);
			const thumb = screen.getByRole("adjustable");
			await fireEvent(thumb, "accessibilityAction", increment);
			expect(thumb).toHaveAccessibilityValue({ now: 100 });
			await fireEvent(thumb, "accessibilityAction", increment);
			expect(onChange).toHaveBeenCalledTimes(1);
			await fireEvent(thumb, "accessibilityAction", decrement);
			await fireEvent(thumb, "accessibilityAction", decrement);
			await fireEvent(thumb, "accessibilityAction", decrement);
			expect(thumb).toHaveAccessibilityValue({ now: 85 });
		});

		test("min and max bound the value", async () => {
			await renderWithProviders(<Single defaultValue={12} maxValue={20} minValue={10} step={5} />);
			const thumb = screen.getByRole("adjustable");
			await fireEvent(thumb, "accessibilityAction", decrement);
			expect(thumb).toHaveAccessibilityValue({ now: 10 });
		});
	});

	describe("callbacks", () => {
		test("onChange and onChangeEnd report the new value", async () => {
			const onChange = jest.fn();
			const onChangeEnd = jest.fn();
			await renderWithProviders(<Single defaultValue={30} onChange={onChange} onChangeEnd={onChangeEnd} step={5} />);
			await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", increment);
			expect(onChange).toHaveBeenCalledWith(35);
			expect(onChangeEnd).toHaveBeenCalledWith(35);
		});

		test("a disabled slider ignores increment and decrement", async () => {
			const onChange = jest.fn();
			const onChangeEnd = jest.fn();
			await renderWithProviders(
				<Single defaultValue={30} isDisabled onChange={onChange} onChangeEnd={onChangeEnd} step={5} />
			);
			const thumb = screen.getByRole("adjustable");
			expect(thumb).toBeDisabled();
			await fireEvent(thumb, "accessibilityAction", increment);
			await fireEvent(thumb, "accessibilityAction", decrement);
			expect(onChange).not.toHaveBeenCalled();
			expect(onChangeEnd).not.toHaveBeenCalled();
			expect(thumb).toHaveAccessibilityValue({ now: 30 });
		});

		test("a disabled Field disables the thumb and ignores actions", async () => {
			const onChange = jest.fn();
			await renderWithProviders(
				<Field isDisabled>
					<Field.Label>Volume</Field.Label>
					<Slider defaultValue={30} onChange={onChange}>
						<Slider.Track>
							<Slider.Thumb />
						</Slider.Track>
					</Slider>
				</Field>
			);
			const thumb = screen.getByRole("adjustable", { name: "Volume" });
			expect(thumb).toBeDisabled();
			await fireEvent(thumb, "accessibilityAction", increment);
			expect(onChange).not.toHaveBeenCalled();
		});
	});

	describe("controlled and uncontrolled", () => {
		test("uncontrolled seeds from defaultValue and updates itself", async () => {
			await renderWithProviders(<Single defaultValue={30} />);
			await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", increment);
			expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 31 });
		});

		test("controlled reports and waits for the prop", async () => {
			const onChange = jest.fn();
			const view = await renderWithProviders(<Single onChange={onChange} value={30} />);
			await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", increment);
			expect(onChange).toHaveBeenCalledWith(31);
			expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 30 });
			await view.rerender(<Single onChange={onChange} value={31} />);
			expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 31 });
		});
	});

	describe("range", () => {
		test("renders one thumb per value", async () => {
			await renderWithProviders(<Range />);
			expect(screen.getAllByRole("adjustable")).toHaveLength(2);
			expect(screen.getByRole("adjustable", { name: "Min" })).toHaveAccessibilityValue({ now: 20 });
			expect(screen.getByRole("adjustable", { name: "Max" })).toHaveAccessibilityValue({ now: 60 });
		});

		test("reports an array and moves only its own thumb", async () => {
			const onChange = jest.fn();
			await renderWithProviders(<Range onChange={onChange} />);
			await fireEvent(screen.getByRole("adjustable", { name: "Max" }), "accessibilityAction", increment);
			expect(onChange).toHaveBeenCalledWith([20, 61]);
			expect(screen.getByRole("adjustable", { name: "Min" })).toHaveAccessibilityValue({ now: 20 });
			expect(screen.getByRole("adjustable", { name: "Max" })).toHaveAccessibilityValue({ now: 61 });
		});

		test("thumbs cannot cross each other", async () => {
			await renderWithProviders(<Range defaultValue={[20, 21]} />);
			const min = screen.getByRole("adjustable", { name: "Min" });
			await fireEvent(min, "accessibilityAction", increment);
			await fireEvent(min, "accessibilityAction", increment);
			expect(min).toHaveAccessibilityValue({ now: 21 });
			const max = screen.getByRole("adjustable", { name: "Max" });
			await fireEvent(max, "accessibilityAction", decrement);
			await fireEvent(max, "accessibilityAction", decrement);
			expect(max).toHaveAccessibilityValue({ now: 21 });
		});

		test("a Field label names each end of the range", async () => {
			await renderWithProviders(
				<Field>
					<Field.Label>Price</Field.Label>
					<Slider defaultValue={[20, 60]}>
						<Slider.Track>
							<Slider.Thumb index={0} />
							<Slider.Thumb index={1} />
						</Slider.Track>
					</Slider>
				</Field>
			);
			expect(screen.getAllByRole("adjustable")).toHaveLength(2);
			expect(screen.getByRole("adjustable", { name: /Price.*minimum/ })).toBeOnTheScreen();
			expect(screen.getByRole("adjustable", { name: /Price.*maximum/ })).toBeOnTheScreen();
		});
	});

	describe("parts outside a Slider", () => {
		let spy: ReturnType<typeof jest.spyOn>;
		beforeEach(() => {
			spy = jest.spyOn(console, "error").mockImplementation(() => {});
		});
		afterEach(() => {
			spy.mockRestore();
		});

		test.each([
			["Slider.Thumb", <Slider.Thumb key="t" />],
			["Slider.Track", <Slider.Track key="k" />],
			["Slider.Fill", <Slider.Fill key="f" />],
			["Slider.Output", <Slider.Output key="o" />],
		])("%s throws", async (name, element) => {
			await expect(renderWithProviders(element)).rejects.toThrow(`${name} must be rendered inside a <Slider>.`);
		});
	});
});
