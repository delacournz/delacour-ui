import { afterEach, describe, expect, jest, test } from "@jest/globals";
import { fireGestureHandler, getByGestureTestId } from "react-native-gesture-handler/jest-utils";
import { fireEvent, renderWithProviders, screen, waitFor } from "../../test/render";
import { Field } from "../field";
import { Rating } from "./rating";
import { useRating } from "./rating.context";
import { RATING_GESTURE_TEST_ID } from "./rating-stars";

const hidden = { includeHiddenElements: true };
const increment = { nativeEvent: { actionName: "increment" } };
const ROW = { nativeEvent: { layout: { height: 44, width: 250, x: 0, y: 0 } } };

async function mountRow(element: React.ReactElement) {
	const view = await renderWithProviders(element);
	await fireEvent(screen.getByLabelText("Rating"), "layout", ROW);
	return view;
}

async function touch(...xs: number[]) {
	const pan = getByGestureTestId(RATING_GESTURE_TEST_ID);
	await fireGestureHandler(
		pan,
		xs.map((x) => ({ x }))
	);
}

const decrement = { nativeEvent: { actionName: "decrement" } };

describe("Rating", () => {
	test("is one adjustable control with a value spoken as 'n out of m'", async () => {
		await renderWithProviders(
			<Rating defaultValue={3.5}>
				<Rating.Stars accessibilityLabel="Your rating" />
			</Rating>
		);
		const row = screen.getByRole("adjustable", { name: "Your rating" });
		expect(row).toBeOnTheScreen();
		expect(row).toHaveAccessibilityValue({ max: 5, min: 0, now: 3.5, text: "3.5 out of 5" });
		expect(row).not.toBeDisabled();
	});

	test("the accessible name defaults to Rating and maxValue sets the count", async () => {
		await renderWithProviders(
			<Rating maxValue={10} value={7}>
				<Rating.Stars />
			</Rating>
		);
		expect(screen.getByRole("adjustable", { name: "Rating" })).toHaveAccessibilityValue({
			max: 10,
			now: 7,
			text: "7 out of 10",
		});
	});

	test("a value above the count is held at the count", async () => {
		await renderWithProviders(
			<Rating value={9}>
				<Rating.Stars />
			</Rating>
		);
		expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 5, text: "5 out of 5" });
	});

	test("uncontrolled: defaultValue seeds it and an increment moves it", async () => {
		const onChange = jest.fn();
		const onChangeEnd = jest.fn();
		await renderWithProviders(
			<Rating defaultValue={2} onChange={onChange} onChangeEnd={onChangeEnd}>
				<Rating.Stars />
			</Rating>
		);
		const row = screen.getByRole("adjustable");
		expect(row).toHaveAccessibilityValue({ now: 2 });

		await fireEvent(row, "accessibilityAction", increment);
		expect(row).toHaveAccessibilityValue({ now: 3, text: "3 out of 5" });
		expect(onChange).toHaveBeenLastCalledWith(3);
		expect(onChangeEnd).toHaveBeenCalledTimes(1);
		expect(onChangeEnd).toHaveBeenLastCalledWith(3);

		await fireEvent(row, "accessibilityAction", decrement);
		await fireEvent(row, "accessibilityAction", decrement);
		expect(row).toHaveAccessibilityValue({ now: 1 });
		expect(onChangeEnd).toHaveBeenLastCalledWith(1);
	});

	test("step sets the size of an assistive step", async () => {
		await renderWithProviders(
			<Rating defaultValue={2} step={0.5}>
				<Rating.Stars />
			</Rating>
		);
		const row = screen.getByRole("adjustable");
		await fireEvent(row, "accessibilityAction", increment);
		expect(row).toHaveAccessibilityValue({ now: 2.5, text: "2.5 out of 5" });
	});

	test("the value stops at zero and at the count, and nothing fires past them", async () => {
		const onChange = jest.fn();
		const onChangeEnd = jest.fn();
		await renderWithProviders(
			<Rating defaultValue={5} onChange={onChange} onChangeEnd={onChangeEnd}>
				<Rating.Stars />
			</Rating>
		);
		await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", increment);
		expect(onChange).not.toHaveBeenCalled();
		expect(onChangeEnd).not.toHaveBeenCalled();
	});

	test("controlled: reports the change and waits for the prop", async () => {
		const onChange = jest.fn();
		const view = await renderWithProviders(
			<Rating onChange={onChange} value={2}>
				<Rating.Stars />
			</Rating>
		);
		await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", increment);
		expect(onChange).toHaveBeenCalledWith(3);
		expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 2 });

		await view.rerender(
			<Rating onChange={onChange} value={3}>
				<Rating.Stars />
			</Rating>
		);
		expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 3 });
	});

	test("isReadOnly is an image with the value and no actions", async () => {
		const onChange = jest.fn();
		const onChangeEnd = jest.fn();
		await renderWithProviders(
			<Rating isReadOnly onChange={onChange} onChangeEnd={onChangeEnd} value={4.3}>
				<Rating.Stars accessibilityLabel="Average rating" />
			</Rating>
		);
		const row = screen.getByRole("image", { name: "Average rating" });
		expect(row).toHaveAccessibilityValue({ now: 4.3, text: "4.3 out of 5" });
		expect(row).not.toBeDisabled();
		expect(row.props.accessibilityActions).toBeUndefined();
		expect(screen.queryByRole("adjustable")).not.toBeOnTheScreen();

		await fireEvent(row, "accessibilityAction", increment);
		expect(onChange).not.toHaveBeenCalled();
		expect(onChangeEnd).not.toHaveBeenCalled();
	});

	test("isDisabled is announced and ignores assistive steps", async () => {
		const onChange = jest.fn();
		const onChangeEnd = jest.fn();
		await renderWithProviders(
			<Rating defaultValue={2} isDisabled onChange={onChange} onChangeEnd={onChangeEnd}>
				<Rating.Stars />
			</Rating>
		);
		const row = screen.getByRole("adjustable");
		expect(row).toBeDisabled();
		await fireEvent(row, "accessibilityAction", increment);
		expect(row).toHaveAccessibilityValue({ now: 2 });
		expect(onChange).not.toHaveBeenCalled();
		expect(onChangeEnd).not.toHaveBeenCalled();
	});

	test("an enclosing Field's isDisabled disables it, and an explicit prop wins", async () => {
		const view = await renderWithProviders(
			<Field isDisabled>
				<Rating defaultValue={1}>
					<Rating.Stars accessibilityLabel="Inherited" />
				</Rating>
			</Field>
		);
		expect(screen.getByRole("adjustable", { name: "Inherited" })).toBeDisabled();

		await view.rerender(
			<Field isDisabled>
				<Rating defaultValue={1} isDisabled={false}>
					<Rating.Stars accessibilityLabel="Inherited" />
				</Rating>
			</Field>
		);
		expect(screen.getByRole("adjustable", { name: "Inherited" })).not.toBeDisabled();
	});

	test("Rating.Output shows the formatted value and follows it", async () => {
		await renderWithProviders(
			<Rating defaultValue={3.5}>
				<Rating.Stars />
				<Rating.Output />
			</Rating>
		);
		expect(screen.getByText("3.5", hidden)).toBeOnTheScreen();
		await fireEvent(screen.getByRole("adjustable"), "accessibilityAction", increment);
		expect(screen.getByText("4", hidden)).toBeOnTheScreen();
	});

	test("Rating.Output hands a render function the settled state", async () => {
		await renderWithProviders(
			<Rating isReadOnly value={4.3}>
				<Rating.Stars />
				<Rating.Output>{({ value, count }) => `${value.toFixed(1)} of ${count} · 128 reviews`}</Rating.Output>
			</Rating>
		);
		expect(screen.getByText("4.3 of 5 · 128 reviews", hidden)).toBeOnTheScreen();
	});

	test("Rating.Output is hidden from assistive technology", async () => {
		await renderWithProviders(
			<Rating value={3}>
				<Rating.Stars />
				<Rating.Output />
			</Rating>
		);
		expect(screen.queryByText("3")).not.toBeOnTheScreen();
		expect(screen.getByText("3", hidden)).toBeOnTheScreen();
	});

	test("useRating reads the enclosing rating's state", async () => {
		function Probe() {
			const { value, count } = useRating();
			return <Rating.Output>{`${value}/${count}`}</Rating.Output>;
		}
		await renderWithProviders(
			<Rating defaultValue={2}>
				<Probe />
			</Rating>
		);
		expect(screen.getByText("2/5", hidden)).toBeOnTheScreen();
	});

	describe("parts outside a Rating", () => {
		const original = console.error;
		afterEach(() => {
			console.error = original;
		});

		test("Rating.Stars throws its documented error", async () => {
			console.error = () => {};
			await expect(renderWithProviders(<Rating.Stars />)).rejects.toThrow(
				"Rating.Stars must be rendered inside a <Rating>."
			);
		});

		test("Rating.Output throws its documented error", async () => {
			console.error = () => {};
			await expect(renderWithProviders(<Rating.Output />)).rejects.toThrow(
				"Rating.Output must be rendered inside a <Rating>."
			);
		});

		test("useRating throws outside a Rating", async () => {
			function Probe() {
				useRating();
				return null;
			}
			console.error = () => {};
			await expect(renderWithProviders(<Probe />)).rejects.toThrow("useRating must be called inside a <Rating>.");
		});
	});

	describe("the pan", () => {
		test("a touch takes the star under the finger and ends once", async () => {
			const onChange = jest.fn();
			const onChangeEnd = jest.fn();
			await mountRow(
				<Rating onChange={onChange} onChangeEnd={onChangeEnd}>
					<Rating.Stars />
				</Rating>
			);
			await touch(110);
			await waitFor(() =>
				expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 3, text: "3 out of 5" })
			);
			expect(onChange).toHaveBeenCalledWith(3);
			expect(onChangeEnd).toHaveBeenCalledTimes(1);
			expect(onChangeEnd).toHaveBeenCalledWith(3);
		});

		test("step 0.5 lands on the half of a star", async () => {
			await mountRow(
				<Rating step={0.5}>
					<Rating.Stars />
				</Rating>
			);
			await touch(110);
			await waitFor(() => expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 2.5 }));
		});

		test("a drag follows the finger and reports each star crossed", async () => {
			const onChange = jest.fn();
			const onChangeEnd = jest.fn();
			await mountRow(
				<Rating onChange={onChange} onChangeEnd={onChangeEnd}>
					<Rating.Stars />
				</Rating>
			);
			await touch(10, 60, 110, 240);
			expect(onChange.mock.calls.map(([value]) => value)).toEqual([1, 2, 3, 5]);
			expect(onChangeEnd).toHaveBeenCalledTimes(1);
			expect(onChangeEnd).toHaveBeenCalledWith(5);
			await waitFor(() => expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 5 }));
		});

		test("a drag past the first star holds one star rather than clearing", async () => {
			await mountRow(
				<Rating defaultValue={4}>
					<Rating.Stars />
				</Rating>
			);
			await touch(110, -40);
			await waitFor(() => expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 1 }));
		});

		test("allowClear: a tap on the value already held clears it", async () => {
			const onChange = jest.fn();
			const onChangeEnd = jest.fn();
			await mountRow(
				<Rating allowClear defaultValue={3} onChange={onChange} onChangeEnd={onChangeEnd}>
					<Rating.Stars />
				</Rating>
			);
			await touch(110);
			await waitFor(() =>
				expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 0, text: "0 out of 5" })
			);
			expect(onChange).toHaveBeenLastCalledWith(0);
			expect(onChangeEnd).toHaveBeenLastCalledWith(0);
		});

		test("allowClear: a tap on a different star sets it instead", async () => {
			await mountRow(
				<Rating allowClear defaultValue={3}>
					<Rating.Stars />
				</Rating>
			);
			await touch(210);
			await waitFor(() => expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 5 }));
		});

		test("allowClear: a drag that returns to the held star is not a clear", async () => {
			await mountRow(
				<Rating allowClear defaultValue={3}>
					<Rating.Stars />
				</Rating>
			);
			await touch(110, 210, 110);
			await waitFor(() => expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 3 }));
		});

		test("without allowClear a tap on the held value keeps it", async () => {
			const onChangeEnd = jest.fn();
			await mountRow(
				<Rating defaultValue={3} onChangeEnd={onChangeEnd}>
					<Rating.Stars />
				</Rating>
			);
			await touch(110);
			await waitFor(() => expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 3 }));
			expect(onChangeEnd).toHaveBeenLastCalledWith(3);
		});

		test("controlled: a touch reports and waits for the prop", async () => {
			const onChange = jest.fn();
			await mountRow(
				<Rating onChange={onChange} value={1}>
					<Rating.Stars />
				</Rating>
			);
			await touch(110);
			expect(onChange).toHaveBeenCalledWith(3);
			await waitFor(() => expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 1 }));
		});

		test("isReadOnly ignores the gesture", async () => {
			const onChange = jest.fn();
			const onChangeEnd = jest.fn();
			await mountRow(
				<Rating isReadOnly onChange={onChange} onChangeEnd={onChangeEnd} value={2}>
					<Rating.Stars />
				</Rating>
			);
			await touch(210);
			expect(onChange).not.toHaveBeenCalled();
			expect(onChangeEnd).not.toHaveBeenCalled();
			expect(screen.getByRole("image")).toHaveAccessibilityValue({ now: 2 });
		});

		test("isDisabled ignores the gesture", async () => {
			const onChange = jest.fn();
			const onChangeEnd = jest.fn();
			await mountRow(
				<Rating defaultValue={2} isDisabled onChange={onChange} onChangeEnd={onChangeEnd}>
					<Rating.Stars />
				</Rating>
			);
			await touch(210);
			expect(onChange).not.toHaveBeenCalled();
			expect(onChangeEnd).not.toHaveBeenCalled();
			await waitFor(() => expect(screen.getByRole("adjustable")).toHaveAccessibilityValue({ now: 2 }));
		});
	});
});
