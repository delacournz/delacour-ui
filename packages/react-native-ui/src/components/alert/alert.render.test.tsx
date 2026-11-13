import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { AccessibilityInfo, Platform } from "react-native";
import { resetAnnouncer } from "../../hooks/use-announce";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Pressable } from "../pressable";
import { Text } from "../text";
import { Alert } from "./alert";
import { useAlert } from "./alert.context";

function GotIt() {
	const { dismiss } = useAlert();
	return (
		<Pressable accessibilityLabel="Got it" accessibilityRole="button" onPress={dismiss}>
			<Text>Got it</Text>
		</Pressable>
	);
}

/*
 * The root is deliberately not `accessible` (grouping it would swallow the close control and
 * actions), so a role query cannot reach it; it is found by testID and its role asserted as a prop.
 */
describe("Alert", () => {
	test("renders as an alert with its title and description", async () => {
		await renderWithProviders(
			<Alert testID="alert" status="warning">
				<Alert.Indicator />
				<Alert.Content>
					<Alert.Title>Card expiring</Alert.Title>
					<Alert.Description>The card ending 4242 expires next month.</Alert.Description>
				</Alert.Content>
			</Alert>
		);
		expect(screen.getByTestId("alert")).toHaveProp("accessibilityRole", "alert");
		expect(screen.getByText("Card expiring")).toBeOnTheScreen();
		expect(screen.getByText("The card ending 4242 expires next month.")).toBeOnTheScreen();
	});

	test("the indicator is hidden from assistive technology", async () => {
		await renderWithProviders(
			<Alert testID="alert">
				<Alert.Indicator testID="indicator" />
			</Alert>
		);
		const indicator = screen.getByTestId("indicator", { includeHiddenElements: true });
		expect(indicator).toHaveProp("accessibilityElementsHidden", true);
		expect(indicator).toHaveProp("importantForAccessibility", "no-hide-descendants");
	});

	test("the indicator accepts custom children and Alert.Action renders its content", async () => {
		await renderWithProviders(
			<Alert testID="alert">
				<Alert.Indicator>
					<Text>spin</Text>
				</Alert.Indicator>
				<Alert.Content>
					<Alert.Action>
						<Text>Try again</Text>
					</Alert.Action>
				</Alert.Content>
			</Alert>
		);
		expect(screen.getByText("spin", { includeHiddenElements: true })).toBeOnTheScreen();
		expect(screen.getByText("Try again")).toBeOnTheScreen();
	});

	test("is not dismissible by default", async () => {
		await renderWithProviders(<Alert testID="alert" />);
		expect(screen.queryByRole("button")).not.toBeOnTheScreen();
	});

	test("isDismissible composes a Dismiss button, labelled by closeAccessibilityLabel when given", async () => {
		const view = await renderWithProviders(<Alert testID="alert" isDismissible />);
		expect(screen.getByRole("button", { name: "Dismiss" })).toBeOnTheScreen();
		await view.rerender(
			<Alert testID="alert" closeAccessibilityLabel="Close alert" closeTestID="close" isDismissible />
		);
		expect(screen.getByRole("button", { name: "Close alert" })).toBeOnTheScreen();
		expect(screen.getByTestId("close")).toBeOnTheScreen();
	});

	test("uncontrolled: defaultOpen={false} starts hidden", async () => {
		await renderWithProviders(<Alert testID="alert" defaultOpen={false} />);
		expect(screen.queryByTestId("alert")).not.toBeOnTheScreen();
	});

	test("uncontrolled: dismissing hides it and reports false", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<Alert testID="alert" isDismissible onOpenChange={onOpenChange} />);
		await fireEvent(screen.getByRole("button", { name: "Dismiss" }), "accessibilityTap");
		expect(onOpenChange).toHaveBeenCalledTimes(1);
		expect(onOpenChange).toHaveBeenCalledWith(false);
		expect(screen.queryByTestId("alert")).not.toBeOnTheScreen();
	});

	test("controlled: reports false and waits for the prop", async () => {
		const onOpenChange = jest.fn();
		const view = await renderWithProviders(<Alert testID="alert" isDismissible isOpen onOpenChange={onOpenChange} />);
		await fireEvent(screen.getByRole("button", { name: "Dismiss" }), "accessibilityTap");
		expect(onOpenChange).toHaveBeenCalledWith(false);
		expect(screen.getByTestId("alert")).toBeOnTheScreen();

		await view.rerender(<Alert testID="alert" isDismissible isOpen={false} onOpenChange={onOpenChange} />);
		expect(screen.queryByTestId("alert")).not.toBeOnTheScreen();
		await view.rerender(<Alert testID="alert" isDismissible isOpen onOpenChange={onOpenChange} />);
		expect(screen.getByTestId("alert")).toBeOnTheScreen();
	});

	test("the close button calls the caller's onPress after dismissing", async () => {
		const onPress = jest.fn();
		const onOpenChange = jest.fn();
		await renderWithProviders(
			<Alert testID="alert" onOpenChange={onOpenChange}>
				<Alert.CloseButton onPress={onPress} />
			</Alert>
		);
		await fireEvent(screen.getByRole("button", { name: "Dismiss" }), "accessibilityTap");
		expect(onOpenChange).toHaveBeenCalledWith(false);
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("useAlert().dismiss closes the alert from an action", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(
			<Alert testID="alert" onOpenChange={onOpenChange}>
				<Alert.Action>
					<GotIt />
				</Alert.Action>
			</Alert>
		);
		await fireEvent(screen.getByRole("button", { name: "Got it" }), "accessibilityTap");
		expect(onOpenChange).toHaveBeenCalledWith(false);
		expect(screen.queryByTestId("alert")).not.toBeOnTheScreen();
	});

	test("parts used outside an Alert throw their documented error", async () => {
		const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
		try {
			await expect(renderWithProviders(<Alert.Title>x</Alert.Title>)).rejects.toThrow(
				"Alert.Title must be rendered inside an <Alert>."
			);
			await expect(renderWithProviders(<Alert.Indicator />)).rejects.toThrow(
				"Alert.Indicator must be rendered inside an <Alert>."
			);
			await expect(renderWithProviders(<Alert.CloseButton />)).rejects.toThrow(
				"Alert.CloseButton must be rendered inside an <Alert>."
			);
			await expect(renderWithProviders(<GotIt />)).rejects.toThrow("useAlert must be called inside an <Alert>.");
		} finally {
			spy.mockRestore();
		}
	});
});

const originalOS = Platform.OS;
function setPlatform(os: typeof Platform.OS) {
	Object.defineProperty(Platform, "OS", { configurable: true, get: () => os });
}

let announceSpy: jest.SpiedFunction<typeof AccessibilityInfo.announceForAccessibility>;
let announceWithOptionsSpy: jest.SpiedFunction<typeof AccessibilityInfo.announceForAccessibilityWithOptions>;

/** The announcer holds a second message for one key until its 500 ms window closes. */
const waitOutWindow = () => new Promise((resolve) => setTimeout(resolve, 600));

function Message({
	status = "info",
	title = "Saved",
	description = "All changes stored.",
	...props
}: {
	status?: "info" | "warning" | "destructive";
	title?: string;
	description?: string;
	announce?: boolean;
	isOpen?: boolean;
}) {
	return (
		<Alert testID="alert" status={status} {...props}>
			<Alert.Content>
				<Alert.Title>{title}</Alert.Title>
				<Alert.Description>{description}</Alert.Description>
			</Alert.Content>
		</Alert>
	);
}

describe("Alert announcements", () => {
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

	test("iOS speaks title and description once on mount, polite, with no live region", async () => {
		setPlatform("ios");
		await renderWithProviders(<Message />);
		expect(announceWithOptionsSpy).toHaveBeenCalledTimes(1);
		expect(announceWithOptionsSpy).toHaveBeenCalledWith("Saved. All changes stored.", { queue: true });
		expect(screen.getByTestId("alert")).toHaveProp("accessibilityLiveRegion", "none");
		expect(screen.getByTestId("alert")).toHaveProp("accessibilityRole", "alert");
	});

	test("iOS speaks a warning or failure assertively", async () => {
		setPlatform("ios");
		await renderWithProviders(<Message status="destructive" title="Payment failed" description="Declined." />);
		expect(announceWithOptionsSpy).toHaveBeenCalledWith("Payment failed. Declined.", { queue: false });
	});

	test("Android speaks through the announcement route once, never also a live region", async () => {
		setPlatform("android");
		await renderWithProviders(<Message />);
		expect(announceSpy).toHaveBeenCalledTimes(1);
		expect(announceSpy).toHaveBeenCalledWith("Saved. All changes stored.");
		expect(screen.getByTestId("alert")).toHaveProp("accessibilityLiveRegion", "none");
	});

	test("the web keeps the live region, politeness from the status, and announces nothing", async () => {
		setPlatform("web");
		const view = await renderWithProviders(<Message status="warning" />);
		expect(screen.getByTestId("alert")).toHaveProp("accessibilityLiveRegion", "assertive");
		await view.rerender(<Message status="info" />);
		expect(screen.getByTestId("alert")).toHaveProp("accessibilityLiveRegion", "polite");
		expect(announceSpy).not.toHaveBeenCalled();
		expect(announceWithOptionsSpy).not.toHaveBeenCalled();
	});

	test("a changed title or description is spoken again", async () => {
		setPlatform("ios");
		const view = await renderWithProviders(<Message />);
		announceWithOptionsSpy.mockClear();
		await waitOutWindow();
		await view.rerender(<Message description="Something else." />);
		expect(announceWithOptionsSpy).toHaveBeenCalledWith("Saved. Something else.", { queue: true });
	});

	test("closing says nothing, and re-opening speaks again", async () => {
		setPlatform("ios");
		const view = await renderWithProviders(<Message isOpen />);
		announceWithOptionsSpy.mockClear();
		await waitOutWindow();
		await view.rerender(<Message isOpen={false} />);
		expect(announceWithOptionsSpy).not.toHaveBeenCalled();
		await view.rerender(<Message isOpen />);
		expect(announceWithOptionsSpy).toHaveBeenCalledWith("Saved. All changes stored.", { queue: true });
	});

	test("announce={false} is silent on every platform and sets no live region", async () => {
		setPlatform("ios");
		await renderWithProviders(<Message announce={false} />);
		setPlatform("android");
		await renderWithProviders(<Message announce={false} />);
		expect(announceSpy).not.toHaveBeenCalled();
		expect(announceWithOptionsSpy).not.toHaveBeenCalled();
	});
});
