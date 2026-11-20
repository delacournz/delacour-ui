import { afterEach, describe, expect, jest, test } from "@jest/globals";
import { Platform } from "react-native";
import { State } from "react-native-gesture-handler";
import { fireGestureHandler, getByGestureTestId } from "react-native-gesture-handler/jest-utils";
import { act, fireEvent, renderWithProviders, screen, waitFor } from "../../test/render";
import { Field } from "../field";
import { Switch } from "./switch";
import { SWITCH_THUMB_INSET } from "./switch.variants";

const layout = (width: number) => ({ nativeEvent: { layout: { height: 0, width, x: 0, y: 0 } } });

type Instance = ReturnType<typeof screen.getByTestId>;

// Puts back a `Platform.OS` a test replaced.
afterEach(() => {
	jest.restoreAllMocks();
});

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

const opacity = (element: Instance): number | undefined => {
	const { jestAnimatedStyle } = element.props as { jestAnimatedStyle?: { value: { opacity?: number } } };
	return jestAnimatedStyle?.value.opacity;
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
		await fireEvent(screen.getByRole("switch"), "accessibilityTap");
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
	// The first layout's frame is waited for through the travel it writes — the
	// whole track less the insets while the thumb is unmeasured, nothing while the
	// track is — so the opacity is read after the style ran, not before it.
	test.each([
		["the track", "the thumb", 52 - 2 * SWITCH_THUMB_INSET],
		["the thumb", "the track", 0],
	])("stays hidden when %s reports before %s, then shows at its measured place", async (first, _second, travel) => {
		await renderWithProviders(
			<Switch defaultSelected testID="switch">
				<Switch.Thumb testID="thumb" />
			</Switch>
		);
		const thumb = () => screen.getByTestId("thumb");
		const measureTrack = () => fireEvent(track(), "layout", layout(52));
		const measureThumb = () => fireEvent(thumb(), "layout", layout(24));

		await (first === "the track" ? measureTrack() : measureThumb());
		await waitFor(() => expect(translateX(thumb())).toBe(travel));
		expect(opacity(thumb())).toBe(0);

		await (first === "the track" ? measureThumb() : measureTrack());
		await waitFor(() => expect(opacity(thumb())).toBe(1));
		await waitFor(() => expect(translateX(thumb())).toBe(52 - 24 - 2 * SWITCH_THUMB_INSET));
	});

	test("finds a thumb written inside a fragment, and adds no second one", async () => {
		// Built apart from the switch so the fragment is the one child it receives.
		const parts = (
			<>
				<Switch.Thumb testID="thumb" />
				<Switch.StartContent testID="start" />
			</>
		);
		await renderWithProviders(<Switch testID="switch">{parts}</Switch>);

		const layers = track().children.filter((child) => typeof child !== "string");
		expect(layers.map((layer) => layer.props.testID)).toEqual(["start", "thumb"]);
	});

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
		// slide out past the clipped end. Waited for, because under Jest Reanimated
		// runs the style mapper on the next animation frame, not inside the event.
		await waitFor(() => expect(translateX(screen.getByTestId("thumb"))).toBe(52 - 24 - 2 * SWITCH_THUMB_INSET));
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

	test("offers no custom accessibility action on iOS, where onAccessibilityTap activates it", async () => {
		await renderWithProviders(<Switch accessibilityLabel="Wi-Fi" testID="switch" />);

		expect(screen.getByTestId("switch").props.accessibilityActions).toBeUndefined();
	});

	test.each(["ios", "android"] as const)(
		"on %s, a caller's custom action reaches its handler and activation still toggles",
		async (os) => {
			jest.replaceProperty(Platform, "OS", os);
			const onAccessibilityAction = jest.fn();
			const onSelectedChange = jest.fn();
			await renderWithProviders(
				<Switch
					accessibilityActions={[{ label: "Help", name: "help" }]}
					accessibilityLabel="Wi-Fi"
					onAccessibilityAction={onAccessibilityAction}
					onSelectedChange={onSelectedChange}
					testID="switch"
				/>
			);
			const control = screen.getByTestId("switch");

			await fireEvent(control, "accessibilityAction", { nativeEvent: { actionName: "help" } });
			expect(onAccessibilityAction).toHaveBeenCalledTimes(1);
			expect(onSelectedChange).not.toHaveBeenCalled();

			// TalkBack activates through the `activate` action, VoiceOver through
			// `onAccessibilityTap`.
			if (os === "android") {
				expect(control.props.accessibilityActions).toEqual([{ label: "Help", name: "help" }, { name: "activate" }]);
				await fireEvent(control, "accessibilityAction", { nativeEvent: { actionName: "activate" } });
			} else {
				expect(control.props.accessibilityActions).toEqual([{ label: "Help", name: "help" }]);
				await fireEvent(control, "accessibilityTap");
			}
			expect(onSelectedChange).toHaveBeenCalledWith(true);
			expect(onAccessibilityAction).toHaveBeenCalledTimes(1);
		}
	);

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

	test.each([
		["springing on", false, true],
		["springing off", true, false],
	])("a vertical swipe caught while %s keeps the state", async (_, from, to) => {
		const onSelectedChange = jest.fn();
		const view = await renderWithProviders(
			<Switch isSelected={from} onSelectedChange={onSelectedChange} testID="switch" />
		);
		await fireEvent(track(), "layout", layout(52));

		// The prop flips and the thumb starts springing; the swipe lands before it
		// has crossed half way, so its position still says the old state.
		await view.rerender(<Switch isSelected={to} onSelectedChange={onSelectedChange} testID="switch" />);
		await pan([
			{ state: State.BEGAN },
			{ state: State.ACTIVE },
			{ state: State.ACTIVE, translationY: 30 },
			{ state: State.END, translationY: 30 },
		]);

		expect(onSelectedChange).not.toHaveBeenCalled();
	});
});
