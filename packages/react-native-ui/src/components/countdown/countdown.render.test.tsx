import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { AccessibilityInfo, Platform } from "react-native";
import { resetAnnouncer } from "../../hooks/use-announce";
import { act, renderWithProviders, screen } from "../../test/render";
import { Countdown } from "./countdown";

const NOW = new Date("2030-01-01T00:00:00.000Z");
const at = (ms: number): Date => new Date(NOW.getTime() + ms);
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** The digits sit under `no-hide-descendants`, so text queries must opt in to hidden elements. */
const hidden = { includeHiddenElements: true } as const;

describe("Countdown", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(NOW);
	});
	afterEach(() => {
		jest.useRealTimers();
	});

	test("is one timer element with a coarse spoken label", async () => {
		await renderWithProviders(<Countdown to={at(2 * DAY + 14 * HOUR + 3 * MINUTE + 22 * SECOND)} />);
		const timer = screen.getByRole("timer");
		expect(timer).toBeOnTheScreen();
		expect(timer.props.accessibilityLabel).toMatch(/2 days/);
		expect(timer.props.accessibilityLabel).toMatch(/14 hours/);
		expect(timer.props.accessibilityLabel).toMatch(/3 minutes/);
		expect(timer.props.accessibilityLabel).toMatch(/left$/);
		expect(timer.props.accessibilityLabel).not.toMatch(/second/);
	});

	test("a caller accessibilityLabel wins over the spoken one", async () => {
		await renderWithProviders(<Countdown accessibilityLabel="Sale ends" to={at(5 * MINUTE)} />);
		expect(screen.getByRole("timer", { name: "Sale ends" })).toBeOnTheScreen();
	});

	test("segmented shows each unit's digits and caption, hidden from assistive tech", async () => {
		await renderWithProviders(<Countdown to={at(2 * DAY + 14 * HOUR + 3 * MINUTE + 22 * SECOND)} />);
		expect(screen.getByText("Days", hidden)).toBeOnTheScreen();
		expect(screen.getByText("Hours", hidden)).toBeOnTheScreen();
		expect(screen.getByText("Minutes", hidden)).toBeOnTheScreen();
		expect(screen.getByText("Seconds", hidden)).toBeOnTheScreen();
		expect(screen.queryByText("Days")).not.toBeOnTheScreen();
	});

	test("custom labels caption the boxes and name the units to a screen reader", async () => {
		await renderWithProviders(
			<Countdown labels={{ minutes: "Mins", seconds: "Secs" }} to={at(5 * MINUTE + 30 * SECOND)} />
		);
		expect(screen.getByText("Mins", hidden)).toBeOnTheScreen();
		expect(screen.getByText("Secs", hidden)).toBeOnTheScreen();
		expect(screen.getByRole("timer").props.accessibilityLabel).toMatch(/Mins|min/i);
	});

	test("inline is one run of text", async () => {
		await renderWithProviders(<Countdown to={at(2 * DAY + 14 * HOUR + 3 * MINUTE + 22 * SECOND)} variant="inline" />);
		expect(screen.getByText("2d 14:03:22", hidden)).toBeOnTheScreen();
		expect(screen.queryByText("Days", hidden)).not.toBeOnTheScreen();
	});

	test("units picks what shows and the largest absorbs everything above it", async () => {
		await renderWithProviders(
			<Countdown to={at(2 * DAY + 3 * HOUR + 4 * MINUTE)} units={["hours", "minutes"]} variant="inline" />
		);
		expect(screen.getByText("51:04", hidden)).toBeOnTheScreen();
	});

	test("trim drops leading zero units, and trim={false} keeps them", async () => {
		const view = await renderWithProviders(<Countdown to={at(3 * MINUTE + 22 * SECOND)} variant="inline" />);
		expect(screen.getByText("3:22", hidden)).toBeOnTheScreen();

		await view.rerender(<Countdown to={at(3 * MINUTE + 22 * SECOND)} trim={false} variant="inline" />);
		expect(screen.getByText("0d 00:03:22", hidden)).toBeOnTheScreen();
	});

	test("seconds round up: the last fraction of a second still reads 0:01", async () => {
		await renderWithProviders(<Countdown to={at(500)} variant="inline" />);
		expect(screen.getByText("0:01", hidden)).toBeOnTheScreen();
	});

	test("the spoken label counts seconds only in the final minute", async () => {
		await renderWithProviders(<Countdown to={at(45 * SECOND)} />);
		expect(screen.getByRole("timer").props.accessibilityLabel).toMatch(/45 seconds/);
	});

	test("ticking re-reads the clock and the announced time changes", async () => {
		await renderWithProviders(<Countdown to={at(3 * MINUTE)} />);
		const timer = screen.getByRole("timer");
		expect(timer.props.accessibilityLabel).toMatch(/3 minutes/);

		await act(async () => {
			jest.advanceTimersByTime(MINUTE);
		});
		expect(screen.getByRole("timer").props.accessibilityLabel).toMatch(/2 minutes/);

		await act(async () => {
			jest.advanceTimersByTime(MINUTE + 30 * SECOND);
		});
		expect(screen.getByRole("timer").props.accessibilityLabel).toMatch(/30 seconds/);
	});

	test("onTick reports the seconds left on mount and whenever they change", async () => {
		const onTick = jest.fn();
		await renderWithProviders(<Countdown onTick={onTick} to={at(3 * SECOND)} />);
		expect(onTick).toHaveBeenLastCalledWith(3);

		await act(async () => {
			jest.advanceTimersByTime(SECOND);
		});
		expect(onTick).toHaveBeenLastCalledWith(2);
		await act(async () => {
			jest.advanceTimersByTime(SECOND);
		});
		expect(onTick).toHaveBeenLastCalledWith(1);
	});

	test("onComplete fires exactly once when time is up, and the label says so", async () => {
		const onComplete = jest.fn();
		await renderWithProviders(<Countdown onComplete={onComplete} to={at(2 * SECOND)} />);
		expect(onComplete).not.toHaveBeenCalled();

		await act(async () => {
			jest.advanceTimersByTime(SECOND);
		});
		expect(onComplete).not.toHaveBeenCalled();

		await act(async () => {
			jest.advanceTimersByTime(SECOND);
		});
		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(screen.getByRole("timer", { name: "Time is up" })).toBeOnTheScreen();

		await act(async () => {
			jest.advanceTimersByTime(10 * SECOND);
		});
		expect(onComplete).toHaveBeenCalledTimes(1);
	});

	test("a target already in the past completes once on mount", async () => {
		const onComplete = jest.fn();
		await renderWithProviders(<Countdown onComplete={onComplete} to={at(-SECOND)} />);
		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(screen.getByRole("timer", { name: "Time is up" })).toBeOnTheScreen();
	});

	test("a new future target re-arms onComplete without firing for the old count", async () => {
		const onComplete = jest.fn();
		const view = await renderWithProviders(<Countdown onComplete={onComplete} to={at(SECOND)} />);
		await act(async () => {
			jest.advanceTimersByTime(SECOND);
		});
		expect(onComplete).toHaveBeenCalledTimes(1);

		const later = new Date(Date.now() + 2 * SECOND);
		await view.rerender(<Countdown onComplete={onComplete} to={later} />);
		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(screen.getByRole("timer").props.accessibilityLabel).not.toBe("Time is up");

		await act(async () => {
			jest.advanceTimersByTime(2 * SECOND);
		});
		expect(onComplete).toHaveBeenCalledTimes(2);
	});

	test("an injected now drives the count instead of the system clock", async () => {
		await renderWithProviders(<Countdown now={() => NOW.getTime() + 10 * SECOND} to={at(40 * SECOND)} />);
		expect(screen.getByRole("timer").props.accessibilityLabel).toMatch(/30 seconds/);
	});

	test("accepts epoch milliseconds as the target", async () => {
		await renderWithProviders(<Countdown to={NOW.getTime() + 5 * MINUTE} variant="inline" />);
		expect(screen.getByText("5:00", hidden)).toBeOnTheScreen();
	});

	test("urgentBelow changes the digits but not the announcement", async () => {
		await renderWithProviders(<Countdown to={at(30 * SECOND)} urgentBelow={60} variant="inline" />);
		expect(screen.getByRole("timer").props.accessibilityLabel).toMatch(/30 seconds/);
		expect(screen.getByText("0:30", hidden)).toBeOnTheScreen();
	});

	test("unmounting stops the timer and never completes", async () => {
		const onComplete = jest.fn();
		const view = await renderWithProviders(<Countdown onComplete={onComplete} to={at(2 * SECOND)} />);
		await view.unmount();
		await act(async () => {
			jest.advanceTimersByTime(5 * SECOND);
		});
		expect(onComplete).not.toHaveBeenCalled();
	});
});

const originalOS = Platform.OS;
function setPlatform(os: typeof Platform.OS) {
	Object.defineProperty(Platform, "OS", { configurable: true, get: () => os });
}

describe("Countdown announcements", () => {
	let announceSpy: jest.SpiedFunction<typeof AccessibilityInfo.announceForAccessibility>;
	let withOptionsSpy: jest.SpiedFunction<typeof AccessibilityInfo.announceForAccessibilityWithOptions>;

	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(NOW);
		resetAnnouncer();
		announceSpy = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => {});
		withOptionsSpy = jest.spyOn(AccessibilityInfo, "announceForAccessibilityWithOptions").mockImplementation(() => {});
		announceSpy.mockClear();
		withOptionsSpy.mockClear();
	});
	afterEach(() => {
		setPlatform(originalOS);
		jest.restoreAllMocks();
		jest.useRealTimers();
	});

	async function run(seconds: number): Promise<void> {
		for (let i = 0; i < seconds; i++) {
			await act(async () => {
				jest.advanceTimersByTime(SECOND);
			});
		}
	}

	test("iOS speaks 30 and 10 seconds and expiry once, nothing between", async () => {
		setPlatform("ios");
		await renderWithProviders(<Countdown to={at(31 * SECOND)} />);
		expect(screen.getByRole("timer").props.accessibilityLiveRegion).toBe("none");
		await run(31);
		expect(withOptionsSpy.mock.calls.map((c) => c[0])).toEqual(["30 seconds left", "10 seconds left", "Time is up"]);
		await run(5);
		expect(withOptionsSpy).toHaveBeenCalledTimes(3);
	});

	test("Android announces through the announcer, with no live region", async () => {
		setPlatform("android");
		await renderWithProviders(<Countdown to={at(31 * SECOND)} />);
		expect(screen.getByRole("timer").props.accessibilityLiveRegion).toBe("none");
		await run(31);
		expect(announceSpy.mock.calls.map((c) => c[0])).toEqual(["30 seconds left", "10 seconds left", "Time is up"]);
	});

	test("an already-expired mount is silent", async () => {
		setPlatform("ios");
		await renderWithProviders(<Countdown to={at(-SECOND)} />);
		await run(3);
		expect(withOptionsSpy).not.toHaveBeenCalled();
	});

	test("announce={false} speaks nothing and sets no live region", async () => {
		setPlatform("ios");
		await renderWithProviders(<Countdown announce={false} to={at(3 * SECOND)} />);
		await run(4);
		expect(withOptionsSpy).not.toHaveBeenCalled();
		expect(screen.getByRole("timer").props.accessibilityLiveRegion).toBe("none");
	});
});
