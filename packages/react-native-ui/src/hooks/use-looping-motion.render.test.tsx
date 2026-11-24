import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { AccessibilityInfo, Text } from "react-native";
import { act, fireEvent, renderWithProviders, screen } from "../test/render";
import { CalmMotionProvider } from "./use-calm-motion";
import { resetScreenReaderStore, type UseLoopingMotionOptions, useLoopingMotion } from "./use-looping-motion";

function Probe(options: UseLoopingMotionOptions) {
	const motion = useLoopingMotion(options);
	return (
		<Text
			accessibilityActions={motion.accessibilityActions}
			accessibilityLabel={motion.toggleLabel ?? "held"}
			accessible
			onAccessibilityAction={motion.onAccessibilityAction}
			onPress={motion.toggle}
			testID="probe"
		>
			{motion.hold}
		</Text>
	);
}

let readerListener: ((enabled: boolean) => void) | null = null;
let isReaderOn = false;
let subscribed = 0;
const remove = jest.fn();

beforeEach(() => {
	resetScreenReaderStore();
	readerListener = null;
	isReaderOn = false;
	subscribed = 0;
	remove.mockClear();
	jest.spyOn(AccessibilityInfo, "isScreenReaderEnabled").mockImplementation(() => Promise.resolve(isReaderOn));
	jest.spyOn(AccessibilityInfo, "addEventListener").mockImplementation(((
		event: string,
		listener: (v: boolean) => void
	) => {
		if (event === "screenReaderChanged") {
			readerListener = listener;
			subscribed += 1;
		}
		return { remove };
	}) as unknown as typeof AccessibilityInfo.addEventListener);
});

afterEach(() => {
	jest.restoreAllMocks();
});

const hold = () => screen.getByTestId("probe").props.children;

describe("useLoopingMotion", () => {
	test("moves, and offers pause", async () => {
		await renderWithProviders(<Probe />);
		expect(hold()).toBe("none");
		expect(screen.getByTestId("probe").props.accessibilityActions).toEqual([
			{ name: "pause", label: "Pause animation" },
		]);
	});

	test("the pause action freezes it and offers resume; resume moves it again", async () => {
		await renderWithProviders(<Probe />);
		await act(async () => {
			fireEvent(screen.getByTestId("probe"), "accessibilityAction", { nativeEvent: { actionName: "pause" } });
		});
		expect(hold()).toBe("paused");
		expect(screen.getByLabelText("Resume animation")).toBeTruthy();
		await act(async () => {
			fireEvent(screen.getByTestId("probe"), "accessibilityAction", { nativeEvent: { actionName: "resume" } });
		});
		expect(hold()).toBe("none");
	});

	test("the toggle flips the user's pause", async () => {
		await renderWithProviders(<Probe />);
		await act(async () => fireEvent.press(screen.getByTestId("probe")));
		expect(hold()).toBe("paused");
	});

	test("a controlled pause reports, and follows its prop", async () => {
		const onPausedChange = jest.fn();
		const view = await renderWithProviders(<Probe isPaused={false} onPausedChange={onPausedChange} />);
		await act(async () => fireEvent.press(screen.getByTestId("probe")));
		expect(onPausedChange).toHaveBeenCalledWith(true);
		expect(hold()).toBe("none");
		await view.rerender(<Probe isPaused onPausedChange={onPausedChange} />);
		expect(hold()).toBe("paused");
	});

	test("a screen reader already on holds it at rest, with nothing to offer", async () => {
		isReaderOn = true;
		await renderWithProviders(<Probe />);
		await act(async () => {});
		expect(hold()).toBe("screen-reader");
		expect(screen.getByTestId("probe").props.accessibilityActions).toEqual([]);
		expect(screen.getByLabelText("held")).toBeTruthy();
	});

	test("turning a screen reader on mid-loop holds it; off again moves it", async () => {
		await renderWithProviders(<Probe />);
		await act(async () => readerListener?.(true));
		expect(hold()).toBe("screen-reader");
		await act(async () => readerListener?.(false));
		expect(hold()).toBe("none");
	});

	test("every mounted loop shares one subscription, removed with the last", async () => {
		const view = await renderWithProviders(
			<>
				<Probe />
				<Probe />
				<Probe />
			</>
		);
		const live = () => subscribed - remove.mock.calls.length;
		expect(live()).toBe(1);
		await view.unmount();
		expect(live()).toBe(0);
	});

	test("calm motion holds it, outranking a user pause", async () => {
		await renderWithProviders(
			<CalmMotionProvider isMotionCalm>
				<Probe defaultPaused />
			</CalmMotionProvider>
		);
		expect(hold()).toBe("calm");
	});

	test("translated labels reach the actions", async () => {
		await renderWithProviders(<Probe labels={{ pause: "Pausieren" }} />);
		expect(screen.getByLabelText("Pausieren")).toBeTruthy();
	});
});
