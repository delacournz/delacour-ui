import { describe, expect, jest, test } from "@jest/globals";
import { State } from "react-native-gesture-handler";
import { fireGestureHandler, getByGestureTestId } from "react-native-gesture-handler/jest-utils";
import { act, fireEvent, renderWithProviders, screen } from "../../test/render";
import { Field } from "../field";
import { Switch } from "./switch";
import { SWITCH_THUMB_INSET } from "./switch.variants";

const layout = (width: number) => ({ nativeEvent: { layout: { height: 0, width, x: 0, y: 0 } } });

type Instance = ReturnType<typeof screen.getByTestId>;

/** The track is the root's only child: the node that clips the thumb and reports the travel. */
const track = (id = "switch"): Instance => {
	const [first] = screen.getByTestId(id).children;
	if (typeof first === "string" || first === undefined) throw new Error("the switch root holds no track");
	return first;
};

const translateX = (element: Instance): number | undefined => {
	const { jestAnimatedStyle } = element.props as {
		jestAnimatedStyle?: { value: { transform?: { translateX?: number }[] } };
	};
	return jestAnimatedStyle?.value.transform?.[0]?.translateX;
};

type PanStep = { state: State; translationX?: number; translationY?: number };

/** Sends one pan to the switch, filling in what each step leaves out. */
const pan = async (steps: PanStep[], id = "switch"): Promise<void> => {
	await act(async () => {
		fireGestureHandler(
			getByGestureTestId(`${id}-pan`),
			steps.map((step) => ({ translationX: 0, translationY: 0, velocityX: 0, velocityY: 0, ...step }))
		);
	});
};

type MeasuredProps = { defaultSelected?: boolean; isDisabled?: boolean; onSelectedChange: (next: boolean) => void };

/** A switch with a measured track, so a drag moves the thumb the way it does on a device. */
const renderMeasured = async (props: MeasuredProps) => {
	const view = await renderWithProviders(<Switch {...props} testID="switch" />);
	await fireEvent(track(), "layout", layout(52));
	return view;
};

describe("Switch", () => {
	test("is a switch whose state is announced", async () => {
		await renderWithProviders(<Switch accessibilityLabel="Wi-Fi" />);
		const control = screen.getByRole("switch", { name: "Wi-Fi" });
		expect(control).not.toBeChecked();
	});

	test("uncontrolled: defaultSelected seeds it and an activation flips it", async () => {
		const onSelectedChange = jest.fn();
		await renderWithProviders(
			<Switch accessibilityLabel="Wi-Fi" defaultSelected onSelectedChange={onSelectedChange} />
		);
		const control = screen.getByRole("switch");
		expect(control).toBeChecked();

		await fireEvent(control, "accessibilityTap");
		expect(control).not.toBeChecked();
		expect(onSelectedChange).toHaveBeenLastCalledWith(false);
	});

	test("controlled: reports the change and waits for the prop", async () => {
		const onSelectedChange = jest.fn();
		const view = await renderWithProviders(
			<Switch accessibilityLabel="Wi-Fi" isSelected={false} onSelectedChange={onSelectedChange} />
		);
		await fireEvent(screen.getByRole("switch"), "accessibilityAction", { nativeEvent: { actionName: "activate" } });
		expect(onSelectedChange).toHaveBeenCalledWith(true);
		expect(screen.getByRole("switch")).not.toBeChecked();

		await view.rerender(<Switch accessibilityLabel="Wi-Fi" isSelected onSelectedChange={onSelectedChange} />);
		expect(screen.getByRole("switch")).toBeChecked();
	});

	test("isDisabled is announced and ignores activation", async () => {
		const onSelectedChange = jest.fn();
		await renderWithProviders(<Switch accessibilityLabel="Wi-Fi" isDisabled onSelectedChange={onSelectedChange} />);
		const control = screen.getByRole("switch");
		expect(control).toBeDisabled();
		await fireEvent(control, "accessibilityTap");
		expect(onSelectedChange).not.toHaveBeenCalled();
	});
});

describe("Switch.Thumb", () => {
	test("calls a caller's onLayout and still measures itself", async () => {
		const onLayout = jest.fn();
		await renderWithProviders(
			<Switch defaultSelected testID="switch">
				<Switch.Thumb onLayout={onLayout} testID="thumb" />
			</Switch>
		);

		await fireEvent(track(), "layout", layout(52));
		await fireEvent(screen.getByTestId("thumb"), "layout", layout(24));

		expect(onLayout).toHaveBeenCalledTimes(1);
		// An on-state thumb sits one travel along. With its own width unmeasured
		// the travel would be the whole track less the insets, and the knob would
		// slide out past the clipped end.
		expect(translateX(screen.getByTestId("thumb"))).toBe(52 - 24 - 2 * SWITCH_THUMB_INSET);
	});
});

describe("Switch accessibility", () => {
	test("keeps reporting checked and disabled when the caller passes its own accessibilityState", async () => {
		await renderWithProviders(
			<Switch accessibilityState={{ busy: true }} defaultSelected isDisabled testID="switch" />
		);

		expect(screen.getByTestId("switch").props.accessibilityState).toEqual({
			busy: true,
			checked: true,
			disabled: true,
		});
	});

	test("is named by a sibling Field.Label", async () => {
		await renderWithProviders(
			<Field>
				<Field.Label>Notifications</Field.Label>
				<Switch />
			</Field>
		);

		expect(screen.getByRole("switch", { name: "Notifications" })).toBeOnTheScreen();
	});

	test("keeps an explicit accessibilityLabel over the Field.Label", async () => {
		await renderWithProviders(
			<Field>
				<Field.Label>Notifications</Field.Label>
				<Switch accessibilityLabel="Push alerts" />
			</Field>
		);

		expect(screen.getByRole("switch", { name: "Push alerts" })).toBeOnTheScreen();
	});
});

describe("Switch gesture", () => {
	test("a stationary press toggles", async () => {
		const onSelectedChange = jest.fn();
		await renderMeasured({ onSelectedChange });

		await pan([{ state: State.BEGAN }, { state: State.END }]);

		expect(onSelectedChange).toHaveBeenCalledWith(true);
	});

	test("a horizontal drag out and back is not a tap", async () => {
		const onSelectedChange = jest.fn();
		await renderMeasured({ onSelectedChange });

		await pan([
			{ state: State.BEGAN },
			{ state: State.ACTIVE },
			{ state: State.ACTIVE, translationX: 12 },
			{ state: State.ACTIVE, translationX: 1 },
			{ state: State.END, translationX: 1 },
		]);

		expect(onSelectedChange).not.toHaveBeenCalled();
	});

	test("a vertical drag out and back is not a tap", async () => {
		const onSelectedChange = jest.fn();
		await renderMeasured({ defaultSelected: true, onSelectedChange });

		await pan([
			{ state: State.BEGAN },
			{ state: State.ACTIVE },
			{ state: State.ACTIVE, translationY: 30 },
			{ state: State.ACTIVE, translationY: 1 },
			{ state: State.END, translationY: 1 },
		]);

		expect(onSelectedChange).not.toHaveBeenCalled();
	});

	test("a pan cancelled before it moved changes nothing", async () => {
		const onSelectedChange = jest.fn();
		await renderMeasured({ onSelectedChange });

		await pan([{ state: State.BEGAN }, { state: State.CANCELLED }]);

		expect(onSelectedChange).not.toHaveBeenCalled();
		expect(screen.getByTestId("switch").props.accessibilityState).toMatchObject({ checked: false });
	});

	test("a pan cancelled after a drag past half way changes nothing", async () => {
		const onSelectedChange = jest.fn();
		await renderMeasured({ onSelectedChange });

		await pan([
			{ state: State.BEGAN },
			{ state: State.ACTIVE },
			{ state: State.ACTIVE, translationX: 40 },
			{ state: State.CANCELLED, translationX: 40 },
		]);

		expect(onSelectedChange).not.toHaveBeenCalled();
		expect(screen.getByTestId("switch").props.accessibilityState).toMatchObject({ checked: false });
	});

	// `fireGestureHandler` ends every sequence it is given, so one gesture cannot
	// span the rerender, and it skips a disabled pan. This checks that a pan sent
	// to a switch disabled after mount commits nothing. The `onFinalize` guard for
	// a native pan disabled under the finger is not reachable from here.
	test("a pan that finalizes after the switch was disabled changes nothing", async () => {
		const onSelectedChange = jest.fn();
		const view = await renderMeasured({ onSelectedChange });

		await view.rerender(<Switch isDisabled onSelectedChange={onSelectedChange} testID="switch" />);
		await pan([{ state: State.BEGAN }, { state: State.CANCELLED }]);
		await pan([{ state: State.BEGAN }, { state: State.END }]);

		expect(onSelectedChange).not.toHaveBeenCalled();
	});
});
