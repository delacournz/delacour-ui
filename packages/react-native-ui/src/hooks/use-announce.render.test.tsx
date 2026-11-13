import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { AccessibilityInfo, Platform, Text } from "react-native";
import { renderWithProviders, screen } from "../test/render";
import { announce, resetAnnouncer, type UseAnnouncementOptions, useAnnouncement } from "./use-announce";

function Probe({ message, ...options }: UseAnnouncementOptions & { message: string | null }) {
	const live = useAnnouncement(message, options);
	return (
		<Text testID="probe" {...live}>
			{message}
		</Text>
	);
}

const originalOS = Platform.OS;
function setPlatform(os: typeof Platform.OS) {
	Object.defineProperty(Platform, "OS", { configurable: true, get: () => os });
}

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

describe("useAnnouncement on iOS", () => {
	beforeEach(() => setPlatform("ios"));

	test("announces a change, not the first message, and sets no live region", async () => {
		const view = await renderWithProviders(<Probe message="Idle" />);
		expect(announceWithOptionsSpy).not.toHaveBeenCalled();
		expect(screen.getByTestId("probe").props.accessibilityLiveRegion).toBe("none");
		await view.rerender(<Probe message="Saved" />);
		expect(announceWithOptionsSpy).toHaveBeenCalledWith("Saved", { queue: true });
	});

	test("onMount speaks the first message, assertive cutting in", async () => {
		await renderWithProviders(<Probe message="Payment failed" onMount politeness="assertive" />);
		expect(announceWithOptionsSpy).toHaveBeenCalledWith("Payment failed", { queue: false });
	});

	test("the opt-out is silent", async () => {
		const view = await renderWithProviders(<Probe enabled={false} message="a" />);
		await view.rerender(<Probe enabled={false} message="b" />);
		expect(announceWithOptionsSpy).not.toHaveBeenCalled();
	});
});

describe("useAnnouncement on Android", () => {
	beforeEach(() => setPlatform("android"));

	test("the default live region speaks, and the hook never announces as well", async () => {
		const view = await renderWithProviders(<Probe message="1" politeness="assertive" />);
		expect(screen.getByTestId("probe").props.accessibilityLiveRegion).toBe("assertive");
		await view.rerender(<Probe message="2" politeness="assertive" />);
		expect(announceSpy).not.toHaveBeenCalled();
	});

	test("the announcement channel drops the live region and announces instead", async () => {
		const view = await renderWithProviders(<Probe channel="announcement" message="1" />);
		expect(screen.getByTestId("probe").props.accessibilityLiveRegion).toBe("none");
		await view.rerender(<Probe channel="announcement" message="2" />);
		expect(announceSpy).toHaveBeenCalledWith("2");
	});
});

describe("announce", () => {
	test("coalesces a repeat and respects the opt-out", () => {
		setPlatform("android");
		expect(announce("Sent")).toBe("spoken");
		expect(announce("Sent")).toBe("dropped");
		expect(announce("Other", { enabled: false })).toBe("dropped");
		expect(announceSpy).toHaveBeenCalledTimes(1);
	});
});
