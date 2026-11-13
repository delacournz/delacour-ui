import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { AccessibilityInfo, Platform, Text } from "react-native";
import { fireGestureHandler, getByGestureTestId } from "react-native-gesture-handler/jest-utils";
import { resetAnnouncer } from "../../hooks/use-announce";
import { act, fireEvent, renderWithProviders, screen, waitFor } from "../../test/render";
import { SLIDE_BUTTON_GESTURE_TEST_ID, SlideButton } from "./slide-button";
import { useSlideButton } from "./slide-button.context";

const RAIL = { nativeEvent: { layout: { height: 56, width: 288, x: 0, y: 0 } } };

async function mountRail(element: React.ReactElement) {
	const view = await renderWithProviders(element);
	await fireEvent(screen.getByRole("button"), "layout", RAIL);
	return view;
}

function isChecked(element: ReturnType<typeof screen.getByRole>): boolean | undefined {
	return element.props.accessibilityState?.checked;
}

async function drag(translationX: number, velocityX = 0) {
	const pan = getByGestureTestId(SLIDE_BUTTON_GESTURE_TEST_ID);
	await fireGestureHandler(pan, [
		{ translationX: 0, velocityX: 0 },
		{ translationX: translationX / 2, velocityX },
		{ translationX, velocityX },
	]);
}

describe("SlideButton", () => {
	test("is a button named by its label with an activate action", async () => {
		await renderWithProviders(
			<SlideButton accessibilityActionLabel="Ship order">
				<SlideButton.Label>Slide to ship</SlideButton.Label>
			</SlideButton>
		);
		const rail = screen.getByRole("button", { name: "Slide to ship" });
		expect(rail).toBeOnTheScreen();
		expect(rail.props.accessibilityActions).toEqual([{ label: "Ship order", name: "activate" }]);
		expect(isChecked(rail)).toBe(false);
		expect(rail).not.toBeDisabled();
		expect(rail).not.toBeBusy();
	});

	test("an explicit accessibilityLabel wins over the label text", async () => {
		await renderWithProviders(
			<SlideButton accessibilityLabel="Ship the order">
				<SlideButton.Label>Slide to ship</SlideButton.Label>
			</SlideButton>
		);
		expect(screen.getByRole("button", { name: "Ship the order" })).toBeOnTheScreen();
	});

	test("the default activate action label is Confirm", async () => {
		await renderWithProviders(
			<SlideButton>
				<SlideButton.Label>Slide</SlideButton.Label>
			</SlideButton>
		);
		expect(screen.getByRole("button").props.accessibilityActions).toEqual([{ label: "Confirm", name: "activate" }]);
	});

	test("an assistive activation confirms and fires onComplete and onCompletedChange", async () => {
		const onComplete = jest.fn();
		const onCompletedChange = jest.fn();
		await renderWithProviders(
			<SlideButton onComplete={onComplete} onCompletedChange={onCompletedChange}>
				<SlideButton.Label>Slide</SlideButton.Label>
			</SlideButton>
		);
		await fireEvent(screen.getByRole("button"), "accessibilityTap");
		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(onCompletedChange).toHaveBeenLastCalledWith(true);
		expect(isChecked(screen.getByRole("button"))).toBe(true);
	});

	test("the activate accessibility action confirms; another action does not", async () => {
		const onComplete = jest.fn();
		await renderWithProviders(
			<SlideButton onComplete={onComplete}>
				<SlideButton.Label>Slide</SlideButton.Label>
			</SlideButton>
		);
		await fireEvent(screen.getByRole("button"), "accessibilityAction", { nativeEvent: { actionName: "magicTap" } });
		expect(onComplete).not.toHaveBeenCalled();
		await fireEvent(screen.getByRole("button"), "accessibilityAction", { nativeEvent: { actionName: "activate" } });
		expect(onComplete).toHaveBeenCalledTimes(1);
	});

	test("a second activation after confirming does not fire onComplete again", async () => {
		const onComplete = jest.fn();
		await renderWithProviders(
			<SlideButton onComplete={onComplete}>
				<SlideButton.Label>Slide</SlideButton.Label>
			</SlideButton>
		);
		await fireEvent(screen.getByRole("button"), "accessibilityTap");
		await fireEvent(screen.getByRole("button"), "accessibilityTap");
		expect(onComplete).toHaveBeenCalledTimes(1);
	});

	test("isDisabled is announced and refuses activation", async () => {
		const onComplete = jest.fn();
		await renderWithProviders(
			<SlideButton isDisabled onComplete={onComplete}>
				<SlideButton.Label>Slide</SlideButton.Label>
			</SlideButton>
		);
		const rail = screen.getByRole("button");
		expect(rail).toBeDisabled();
		await fireEvent(rail, "accessibilityTap");
		expect(onComplete).not.toHaveBeenCalled();
		expect(isChecked(rail)).toBe(false);
	});

	test("isLoading is announced as busy and refuses activation", async () => {
		const onComplete = jest.fn();
		await renderWithProviders(
			<SlideButton isLoading onComplete={onComplete}>
				<SlideButton.Label>Slide</SlideButton.Label>
			</SlideButton>
		);
		const rail = screen.getByRole("button");
		expect(rail).toBeBusy();
		expect(rail).not.toBeDisabled();
		await fireEvent(rail, "accessibilityTap");
		expect(onComplete).not.toHaveBeenCalled();
	});

	test("uncontrolled: defaultCompleted seeds it and an activation keeps it confirmed", async () => {
		await renderWithProviders(
			<SlideButton defaultCompleted>
				<SlideButton.Label>Slide</SlideButton.Label>
			</SlideButton>
		);
		expect(isChecked(screen.getByRole("button"))).toBe(true);
	});

	test("controlled: reports the request and waits for isCompleted", async () => {
		const onCompletedChange = jest.fn();
		const view = await renderWithProviders(
			<SlideButton isCompleted={false} onCompletedChange={onCompletedChange}>
				<SlideButton.Label>Slide</SlideButton.Label>
			</SlideButton>
		);
		await fireEvent(screen.getByRole("button"), "accessibilityTap");
		expect(onCompletedChange).toHaveBeenCalledWith(true);
		expect(isChecked(screen.getByRole("button"))).toBe(false);

		await view.rerender(
			<SlideButton isCompleted onCompletedChange={onCompletedChange}>
				<SlideButton.Label>Slide</SlideButton.Label>
			</SlideButton>
		);
		expect(isChecked(screen.getByRole("button"))).toBe(true);

		await view.rerender(
			<SlideButton isCompleted={false} onCompletedChange={onCompletedChange}>
				<SlideButton.Label>Slide</SlideButton.Label>
			</SlideButton>
		);
		expect(isChecked(screen.getByRole("button"))).toBe(false);
	});

	test("a rejected onComplete promise reports false and unchecks the control", async () => {
		const onCompletedChange = jest.fn();
		const onComplete = jest.fn(() => Promise.reject(new Error("nope")));
		await renderWithProviders(
			<SlideButton onComplete={onComplete} onCompletedChange={onCompletedChange}>
				<SlideButton.Label>Slide</SlideButton.Label>
			</SlideButton>
		);
		await fireEvent(screen.getByRole("button"), "accessibilityTap");
		await waitFor(() => expect(isChecked(screen.getByRole("button"))).toBe(false));
		expect(onCompletedChange).toHaveBeenNthCalledWith(1, true);
		expect(onCompletedChange).toHaveBeenLastCalledWith(false);
	});

	describe("isAutoReset", () => {
		beforeEach(() => {
			jest.useFakeTimers();
		});
		afterEach(() => {
			jest.useRealTimers();
		});

		test("takes the control home after autoResetDelay", async () => {
			await renderWithProviders(
				<SlideButton autoResetDelay={500} isAutoReset>
					<SlideButton.Label>Slide</SlideButton.Label>
				</SlideButton>
			);
			await fireEvent(screen.getByRole("button"), "accessibilityTap");
			expect(isChecked(screen.getByRole("button"))).toBe(true);
			await jest.advanceTimersByTimeAsync(499);
			expect(isChecked(screen.getByRole("button"))).toBe(true);
			await act(async () => {
				await jest.advanceTimersByTimeAsync(2);
			});
			expect(isChecked(screen.getByRole("button"))).toBe(false);
		});

		test("without isAutoReset it stays confirmed", async () => {
			await renderWithProviders(
				<SlideButton autoResetDelay={500}>
					<SlideButton.Label>Slide</SlideButton.Label>
				</SlideButton>
			);
			await fireEvent(screen.getByRole("button"), "accessibilityTap");
			await jest.advanceTimersByTimeAsync(5000);
			expect(isChecked(screen.getByRole("button"))).toBe(true);
		});
	});

	describe("the drag", () => {
		test("a release past the threshold confirms", async () => {
			const onComplete = jest.fn();
			const onCompletedChange = jest.fn();
			await mountRail(
				<SlideButton onComplete={onComplete} onCompletedChange={onCompletedChange}>
					<SlideButton.Label>Slide</SlideButton.Label>
				</SlideButton>
			);
			await act(async () => {
				await drag(250);
			});
			expect(onComplete).toHaveBeenCalledTimes(1);
			expect(onCompletedChange).toHaveBeenLastCalledWith(true);
			expect(isChecked(screen.getByRole("button"))).toBe(true);
		});

		test("a short release returns home without confirming", async () => {
			const onComplete = jest.fn();
			await mountRail(
				<SlideButton onComplete={onComplete}>
					<SlideButton.Label>Slide</SlideButton.Label>
				</SlideButton>
			);
			await drag(60);
			expect(onComplete).not.toHaveBeenCalled();
			expect(isChecked(screen.getByRole("button"))).toBe(false);
		});

		test("a hard flick from a short way does not confirm", async () => {
			const onComplete = jest.fn();
			await mountRail(
				<SlideButton onComplete={onComplete}>
					<SlideButton.Label>Slide</SlideButton.Label>
				</SlideButton>
			);
			await drag(30, 4000);
			expect(onComplete).not.toHaveBeenCalled();
		});

		test("threshold={1} refuses a release short of the far end", async () => {
			const onComplete = jest.fn();
			await mountRail(
				<SlideButton onComplete={onComplete} threshold={1}>
					<SlideButton.Label>Slide</SlideButton.Label>
				</SlideButton>
			);
			await drag(190);
			expect(onComplete).not.toHaveBeenCalled();
		});

		test("a disabled drag fires nothing", async () => {
			const onComplete = jest.fn();
			const onCompletedChange = jest.fn();
			await mountRail(
				<SlideButton isDisabled onComplete={onComplete} onCompletedChange={onCompletedChange}>
					<SlideButton.Label>Slide</SlideButton.Label>
				</SlideButton>
			);
			await drag(280);
			expect(onComplete).not.toHaveBeenCalled();
			expect(onCompletedChange).not.toHaveBeenCalled();
		});

		test("a loading drag fires nothing", async () => {
			const onComplete = jest.fn();
			await mountRail(
				<SlideButton isLoading onComplete={onComplete}>
					<SlideButton.Label>Slide</SlideButton.Label>
				</SlideButton>
			);
			await drag(280);
			expect(onComplete).not.toHaveBeenCalled();
		});

		test("an already confirmed button takes no further drag", async () => {
			const onComplete = jest.fn();
			await mountRail(
				<SlideButton defaultCompleted onComplete={onComplete}>
					<SlideButton.Label>Slide</SlideButton.Label>
				</SlideButton>
			);
			await drag(280);
			expect(onComplete).not.toHaveBeenCalled();
		});

		test("before the rail is measured a drag has nowhere to go", async () => {
			const onComplete = jest.fn();
			await renderWithProviders(
				<SlideButton onComplete={onComplete}>
					<SlideButton.Label>Slide</SlideButton.Label>
				</SlideButton>
			);
			await drag(280);
			expect(onComplete).not.toHaveBeenCalled();
		});
	});

	describe("compound parts", () => {
		test("Label and Thumb render inside the root, and a custom Thumb replaces the glyph", async () => {
			await renderWithProviders(
				<SlideButton>
					<SlideButton.Thumb>
						<Text>GO</Text>
					</SlideButton.Thumb>
					<SlideButton.Label>Slide to go</SlideButton.Label>
				</SlideButton>
			);
			expect(screen.getByRole("button", { name: "Slide to go" })).toBeOnTheScreen();
			expect(screen.getByText("GO")).toBeOnTheScreen();
		});

		test("a Label used outside its root throws", async () => {
			const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
			await expect(renderWithProviders(<SlideButton.Label>Slide</SlideButton.Label>)).rejects.toThrow(
				"SlideButton.Label must be rendered inside a <SlideButton>."
			);
			spy.mockRestore();
		});

		test("a Thumb used outside its root throws", async () => {
			const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
			await expect(renderWithProviders(<SlideButton.Thumb />)).rejects.toThrow(
				"SlideButton.Thumb must be rendered inside a <SlideButton>."
			);
			spy.mockRestore();
		});

		test("useSlideButton outside the root throws", async () => {
			function Probe() {
				useSlideButton();
				return null;
			}
			const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
			await expect(renderWithProviders(<Probe />)).rejects.toThrow(
				"useSlideButton must be called inside a <SlideButton>."
			);
			spy.mockRestore();
		});
	});
});

describe("SlideButton announcements", () => {
	const originalOS = Platform.OS;
	let spy: jest.SpiedFunction<typeof AccessibilityInfo.announceForAccessibility>;
	let optionsSpy: jest.SpiedFunction<typeof AccessibilityInfo.announceForAccessibilityWithOptions>;

	function setPlatform(os: typeof Platform.OS) {
		Object.defineProperty(Platform, "OS", { configurable: true, get: () => os });
	}

	beforeEach(() => {
		resetAnnouncer();
		spy = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => {});
		optionsSpy = jest.spyOn(AccessibilityInfo, "announceForAccessibilityWithOptions").mockImplementation(() => {});
		spy.mockClear();
		optionsSpy.mockClear();
		setPlatform("android");
	});

	afterEach(() => {
		setPlatform(originalOS);
		jest.restoreAllMocks();
	});

	const slide = (props: Partial<React.ComponentProps<typeof SlideButton>> = {}) => (
		<SlideButton {...props}>
			<SlideButton.Label>Slide</SlideButton.Label>
		</SlideButton>
	);

	test("a screen reader's activation says Confirmed once", async () => {
		await renderWithProviders(slide());
		await fireEvent(screen.getByRole("button"), "accessibilityTap");
		await waitFor(() => expect(spy).toHaveBeenCalledWith("Confirmed"));
		expect(spy).toHaveBeenCalledTimes(1);
	});

	test("a resolving promise says Working then Confirmed, once each", async () => {
		await renderWithProviders(slide({ onComplete: () => Promise.resolve() }));
		await fireEvent(screen.getByRole("button"), "accessibilityTap");
		await waitFor(() => expect(spy).toHaveBeenCalledWith("Confirmed"));
		expect(spy.mock.calls.map(([message]) => message)).toEqual(["Working", "Confirmed"]);
	});

	test("a rejecting promise says Failed, assertively on iOS", async () => {
		setPlatform("ios");
		await renderWithProviders(slide({ onComplete: () => Promise.reject(new Error("no")) }));
		await fireEvent(screen.getByRole("button"), "accessibilityTap");
		await waitFor(() => expect(optionsSpy).toHaveBeenCalledWith("Failed. Slide to try again", { queue: false }));
		expect(optionsSpy.mock.calls.map(([message]) => message)).not.toContain("Confirmed");
	});

	test("controlled: Confirmed is said when isCompleted answers, not on the request", async () => {
		const view = await renderWithProviders(slide({ isCompleted: false }));
		await fireEvent(screen.getByRole("button"), "accessibilityTap");
		expect(spy).not.toHaveBeenCalled();
		await view.rerender(slide({ isCompleted: true }));
		await waitFor(() => expect(spy).toHaveBeenCalledWith("Confirmed"));
		expect(spy).toHaveBeenCalledTimes(1);
	});

	test("isLoading turning on says Working", async () => {
		const view = await renderWithProviders(slide());
		await view.rerender(slide({ isLoading: true }));
		await waitFor(() => expect(spy).toHaveBeenCalledWith("Working"));
	});

	test("a slide that starts completed is silent on mount", async () => {
		await renderWithProviders(slide({ defaultCompleted: true }));
		expect(spy).not.toHaveBeenCalled();
	});

	test("announce={false} is silent", async () => {
		await renderWithProviders(slide({ announce: false, onComplete: () => Promise.reject(new Error("no")) }));
		await fireEvent(screen.getByRole("button"), "accessibilityTap");
		await waitFor(() => expect(isChecked(screen.getByRole("button"))).toBe(false));
		expect(spy).not.toHaveBeenCalled();
	});
});
