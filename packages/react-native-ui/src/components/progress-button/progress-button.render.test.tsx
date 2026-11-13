import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { AccessibilityInfo, Platform } from "react-native";
import { resetAnnouncer } from "../../hooks/use-announce";
import { act, fireEvent, renderWithProviders, screen } from "../../test/render";
import { ProgressButton } from "./progress-button";
import { useProgressButton } from "./progress-button.context";

const activate = { nativeEvent: { actionName: "activate" } };

// The hold is not driven here: `fireGestureHandler` always runs a gesture BEGAN, ACTIVE, END in one
// call, so the finger lifts at once and `onFinalize` rewinds the fill before the timing can finish.
// Completion also lives in a UI-thread `withTiming` callback. Both are verified in the playground.
describe("ProgressButton", () => {
	afterEach(() => {
		jest.useRealTimers();
	});

	// Name queries use a regex: RNTL derives the name from every descendant's text, the hidden fill copy
	// included. iOS (RCTRecursiveAccessibilityLabel skips accessibilityElementsHidden) and Android
	// (isSpeakingNode refuses no-hide-descendants) both leave that copy out of the real name.
	test("is a button named by its label, with the hold hint", async () => {
		await renderWithProviders(
			<ProgressButton>
				<ProgressButton.Label>Hold to erase</ProgressButton.Label>
			</ProgressButton>
		);
		const button = screen.getByRole("button", { name: /Hold to erase/ });
		expect(button).toBeOnTheScreen();
		expect(button).toHaveProp("accessibilityHint", "Press and hold to confirm");
	});

	test("a bare string child becomes the label", async () => {
		await renderWithProviders(<ProgressButton>Erase 3 files</ProgressButton>);
		expect(screen.getByRole("button", { name: /Erase 3 files/ })).toBeOnTheScreen();
	});

	test("accessibilityHint replaces the default", async () => {
		await renderWithProviders(<ProgressButton accessibilityHint="Hold two seconds">Pay</ProgressButton>);
		expect(screen.getByRole("button")).toHaveProp("accessibilityHint", "Hold two seconds");
	});

	test("the label is announced once: the fill's copy is hidden", async () => {
		await renderWithProviders(<ProgressButton>Pay</ProgressButton>);
		expect(screen.getAllByText("Pay")).toHaveLength(1);
		expect(screen.getAllByText("Pay", { hidden: true })).toHaveLength(2);
	});

	test("rests unchecked and enabled", async () => {
		await renderWithProviders(<ProgressButton>Pay</ProgressButton>);
		const button = screen.getByRole("button");
		expect(button).toHaveProp("accessibilityState", { checked: false, disabled: false });
		expect(button).toBeEnabled();
	});

	test("isDisabled is announced", async () => {
		await renderWithProviders(<ProgressButton isDisabled>Pay</ProgressButton>);
		expect(screen.getByRole("button")).toBeDisabled();
	});

	test("an activation completes it outright and calls onComplete and onCompletedChange(true)", async () => {
		const onComplete = jest.fn();
		const onCompletedChange = jest.fn();
		await renderWithProviders(
			<ProgressButton onComplete={onComplete} onCompletedChange={onCompletedChange}>
				Pay
			</ProgressButton>
		);
		await fireEvent(screen.getByRole("button"), "accessibilityAction", activate);
		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(onCompletedChange).toHaveBeenCalledTimes(1);
		expect(onCompletedChange).toHaveBeenCalledWith(true);
		expect(screen.getByRole("button")).toHaveProp("accessibilityState", expect.objectContaining({ checked: true }));
	});

	test("an action other than activate does nothing", async () => {
		const onComplete = jest.fn();
		await renderWithProviders(<ProgressButton onComplete={onComplete}>Pay</ProgressButton>);
		await fireEvent(screen.getByRole("button"), "accessibilityAction", { nativeEvent: { actionName: "longpress" } });
		expect(onComplete).not.toHaveBeenCalled();
		expect(screen.getByRole("button")).toHaveProp("accessibilityState", expect.objectContaining({ checked: false }));
	});

	test("a disabled button ignores activation", async () => {
		const onComplete = jest.fn();
		const onCompletedChange = jest.fn();
		await renderWithProviders(
			<ProgressButton isDisabled onComplete={onComplete} onCompletedChange={onCompletedChange}>
				Pay
			</ProgressButton>
		);
		await fireEvent(screen.getByRole("button"), "accessibilityAction", activate);
		expect(onComplete).not.toHaveBeenCalled();
		expect(onCompletedChange).not.toHaveBeenCalled();
		expect(screen.getByRole("button")).toHaveProp("accessibilityState", expect.objectContaining({ checked: false }));
	});

	test("a completed button ignores a second activation", async () => {
		const onComplete = jest.fn();
		await renderWithProviders(<ProgressButton onComplete={onComplete}>Pay</ProgressButton>);
		const button = screen.getByRole("button");
		await fireEvent(button, "accessibilityAction", activate);
		await fireEvent(button, "accessibilityAction", activate);
		expect(onComplete).toHaveBeenCalledTimes(1);
	});

	test("uncontrolled: defaultCompleted seeds it and an activation does not re-fire", async () => {
		const onComplete = jest.fn();
		await renderWithProviders(
			<ProgressButton defaultCompleted onComplete={onComplete}>
				Pay
			</ProgressButton>
		);
		const button = screen.getByRole("button");
		expect(button).toHaveProp("accessibilityState", expect.objectContaining({ checked: true }));
		await fireEvent(button, "accessibilityAction", activate);
		expect(onComplete).not.toHaveBeenCalled();
	});

	test("controlled: reports the completion and waits for the prop", async () => {
		const onCompletedChange = jest.fn();
		const view = await renderWithProviders(
			<ProgressButton isCompleted={false} onCompletedChange={onCompletedChange}>
				Pay
			</ProgressButton>
		);
		await fireEvent(screen.getByRole("button"), "accessibilityAction", activate);
		expect(onCompletedChange).toHaveBeenCalledWith(true);
		expect(screen.getByRole("button")).toHaveProp("accessibilityState", expect.objectContaining({ checked: false }));

		await view.rerender(
			<ProgressButton isCompleted onCompletedChange={onCompletedChange}>
				Pay
			</ProgressButton>
		);
		expect(screen.getByRole("button")).toHaveProp("accessibilityState", expect.objectContaining({ checked: true }));

		await view.rerender(
			<ProgressButton isCompleted={false} onCompletedChange={onCompletedChange}>
				Pay
			</ProgressButton>
		);
		expect(screen.getByRole("button")).toHaveProp("accessibilityState", expect.objectContaining({ checked: false }));
	});

	test("isAutoReset rewinds a completed button after autoResetDelay and reports false", async () => {
		jest.useFakeTimers();
		const onCompletedChange = jest.fn();
		await renderWithProviders(
			<ProgressButton autoResetDelay={500} isAutoReset onCompletedChange={onCompletedChange}>
				Pay
			</ProgressButton>
		);
		await fireEvent(screen.getByRole("button"), "accessibilityAction", activate);
		expect(screen.getByRole("button")).toHaveProp("accessibilityState", expect.objectContaining({ checked: true }));

		await act(async () => {
			jest.advanceTimersByTime(499);
		});
		expect(screen.getByRole("button")).toHaveProp("accessibilityState", expect.objectContaining({ checked: true }));

		await act(async () => {
			jest.advanceTimersByTime(1);
		});
		expect(screen.getByRole("button")).toHaveProp("accessibilityState", expect.objectContaining({ checked: false }));
		expect(onCompletedChange).toHaveBeenLastCalledWith(false);
	});

	test("without isAutoReset a completed button stays completed", async () => {
		jest.useFakeTimers();
		await renderWithProviders(<ProgressButton defaultCompleted>Pay</ProgressButton>);
		await act(async () => {
			jest.advanceTimersByTime(10_000);
		});
		expect(screen.getByRole("button")).toHaveProp("accessibilityState", expect.objectContaining({ checked: true }));
	});

	test("ProgressButton.Done content is drawn, hidden from assistive technology", async () => {
		await renderWithProviders(
			<ProgressButton>
				<ProgressButton.Label>Hold to pay</ProgressButton.Label>
				<ProgressButton.Done>
					<ProgressButton.Label>Paid</ProgressButton.Label>
				</ProgressButton.Done>
			</ProgressButton>
		);
		expect(screen.getByRole("button", { name: /Hold to pay/ })).toBeOnTheScreen();
		expect(screen.queryByText("Paid")).not.toBeOnTheScreen();
		expect(screen.getByText("Paid", { hidden: true })).toBeOnTheScreen();
		expect(screen.getAllByText("Hold to pay", { hidden: true })).toHaveLength(2);
	});

	test("a custom child reads the button's state through useProgressButton", async () => {
		function Probe() {
			const { isCompleted, isDisabled } = useProgressButton();
			return <ProgressButton.Label>{`completed:${isCompleted} disabled:${isDisabled}`}</ProgressButton.Label>;
		}
		await renderWithProviders(
			<ProgressButton isDisabled>
				<Probe />
			</ProgressButton>
		);
		expect(screen.getByText("completed:false disabled:true")).toBeOnTheScreen();
	});

	test("forwards onLayout and other view props", async () => {
		const onLayout = jest.fn();
		await renderWithProviders(
			<ProgressButton onLayout={onLayout} testID="hold">
				Pay
			</ProgressButton>
		);
		const root = screen.getByTestId("hold");
		await fireEvent(root, "layout", { nativeEvent: { layout: { height: 40, width: 200, x: 0, y: 0 } } });
		expect(onLayout).toHaveBeenCalledTimes(1);
	});

	test("Label used outside a ProgressButton throws its documented error", async () => {
		const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
		try {
			await expect(renderWithProviders(<ProgressButton.Label>Pay</ProgressButton.Label>)).rejects.toThrow(
				"ProgressButton.Label must be rendered inside a <ProgressButton>."
			);
		} finally {
			spy.mockRestore();
		}
	});

	test("Done used outside a ProgressButton throws its documented error", async () => {
		const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
		try {
			await expect(renderWithProviders(<ProgressButton.Done />)).rejects.toThrow(
				"ProgressButton.Done must be rendered inside a <ProgressButton>."
			);
		} finally {
			spy.mockRestore();
		}
	});

	test("useProgressButton outside a ProgressButton throws", async () => {
		function Probe() {
			useProgressButton();
			return null;
		}
		const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
		try {
			await expect(renderWithProviders(<Probe />)).rejects.toThrow(
				"useProgressButton must be called inside a <ProgressButton>."
			);
		} finally {
			spy.mockRestore();
		}
	});
});

const originalOS = Platform.OS;
function setPlatform(os: typeof Platform.OS) {
	Object.defineProperty(Platform, "OS", { configurable: true, get: () => os });
}

describe("ProgressButton announcement", () => {
	let announceSpy: jest.SpiedFunction<typeof AccessibilityInfo.announceForAccessibility>;
	let announceWithOptionsSpy: jest.SpiedFunction<typeof AccessibilityInfo.announceForAccessibilityWithOptions>;

	beforeEach(() => {
		resetAnnouncer();
		announceSpy = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => {});
		announceWithOptionsSpy = jest
			.spyOn(AccessibilityInfo, "announceForAccessibilityWithOptions")
			.mockImplementation(() => {});
		announceSpy.mockClear();
		announceWithOptionsSpy.mockClear();
	});

	afterEach(() => {
		setPlatform(originalOS);
		jest.restoreAllMocks();
	});

	test("iOS: an activation speaks Done once through the options route", async () => {
		setPlatform("ios");
		await renderWithProviders(<ProgressButton>Pay</ProgressButton>);
		expect(announceWithOptionsSpy).not.toHaveBeenCalled();
		await fireEvent(screen.getByRole("button"), "accessibilityAction", activate);
		expect(announceWithOptionsSpy).toHaveBeenCalledTimes(1);
		expect(announceWithOptionsSpy).toHaveBeenCalledWith("Done", { queue: true });
		expect(announceSpy).not.toHaveBeenCalled();
	});

	test("Android: speaks once through announceForAccessibility, with no live region on the button", async () => {
		setPlatform("android");
		await renderWithProviders(<ProgressButton completedAnnouncement="Paid">Pay</ProgressButton>);
		await fireEvent(screen.getByRole("button"), "accessibilityAction", activate);
		expect(announceSpy).toHaveBeenCalledTimes(1);
		expect(announceSpy).toHaveBeenCalledWith("Paid");
		expect(screen.getByRole("button").props.accessibilityLiveRegion).toBeUndefined();
	});

	test("a controlled completion speaks, and the reset after it does not", async () => {
		setPlatform("ios");
		const view = await renderWithProviders(<ProgressButton isCompleted={false}>Pay</ProgressButton>);
		await view.rerender(<ProgressButton isCompleted>Pay</ProgressButton>);
		expect(announceWithOptionsSpy).toHaveBeenCalledTimes(1);
		await view.rerender(<ProgressButton isCompleted={false}>Pay</ProgressButton>);
		expect(announceWithOptionsSpy).toHaveBeenCalledTimes(1);
	});

	test("mounting already completed is silent", async () => {
		setPlatform("ios");
		await renderWithProviders(<ProgressButton defaultCompleted>Pay</ProgressButton>);
		expect(announceWithOptionsSpy).not.toHaveBeenCalled();
	});

	test("announce={false} is silent", async () => {
		setPlatform("ios");
		await renderWithProviders(<ProgressButton announce={false}>Pay</ProgressButton>);
		await fireEvent(screen.getByRole("button"), "accessibilityAction", activate);
		expect(announceWithOptionsSpy).not.toHaveBeenCalled();
		expect(announceSpy).not.toHaveBeenCalled();
	});
});
