import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import type { ReactElement, ReactNode } from "react";
import { AccessibilityInfo, Platform } from "react-native";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Button } from "../button";
import { OverlayProvider } from "../overlay";
import { Tooltip, type TooltipProps } from "./tooltip";

// Jest has no layout, so the trigger never reports a frame and the panel is
// measured, placed and animated by nothing; what is asserted here is whether
// it is mounted, what the trigger announces, and which gestures toggle it.
// `Platform.OS` is "android" for the suite because the long-press accessibility
// action is only wired there; iOS reaches `onLongPress` through a held touch,
// which Jest cannot produce.

function Overlays({ children }: { children: ReactNode }): ReactElement {
	return <OverlayProvider>{children}</OverlayProvider>;
}

function ShareTooltip(props: Omit<TooltipProps, "children">): ReactElement {
	return (
		<Tooltip {...props}>
			<Tooltip.Trigger asChild>
				<Button>Share</Button>
			</Tooltip.Trigger>
			<Tooltip.Content>
				<Tooltip.Arrow />
				<Tooltip.Text>Share this file</Tooltip.Text>
			</Tooltip.Content>
		</Tooltip>
	);
}

function IconTooltip(props: Omit<TooltipProps, "children">): ReactElement {
	return (
		<Tooltip {...props}>
			<Tooltip.Trigger asChild>
				<Button size="icon-md">{null}</Button>
			</Tooltip.Trigger>
			<Tooltip.Content>
				<Tooltip.Text>Share this file</Tooltip.Text>
			</Tooltip.Content>
		</Tooltip>
	);
}

const hidden = { includeHiddenElements: true } as const;

const longPress = (name: string) =>
	fireEvent(screen.getByRole("button", { name }), "accessibilityAction", {
		nativeEvent: { actionName: "longpress" },
	});

const tap = (name: string) =>
	fireEvent(screen.getByRole("button", { name }), "accessibilityAction", {
		nativeEvent: { actionName: "activate" },
	});

const originalPlatform = Platform.OS;

beforeEach(() => {
	Platform.OS = "android";
	jest.spyOn(AccessibilityInfo, "isScreenReaderEnabled").mockResolvedValue(false);
});

afterEach(() => {
	Platform.OS = originalPlatform;
	jest.restoreAllMocks();
});

describe("Tooltip", () => {
	test("renders only its trigger while closed", async () => {
		await renderWithProviders(<ShareTooltip />, { wrapper: Overlays });
		expect(screen.getByRole("button", { name: "Share" })).toBeOnTheScreen();
		expect(screen.queryByText("Share this file", hidden)).not.toBeOnTheScreen();
	});

	test("defaultOpen mounts the panel, hidden from assistive technology", async () => {
		await renderWithProviders(<ShareTooltip defaultOpen />, { wrapper: Overlays });
		expect(screen.getByText("Share this file", hidden)).toBeOnTheScreen();
		expect(screen.queryByText("Share this file")).not.toBeOnTheScreen();
	});

	test("a long press opens it and reports true", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<ShareTooltip onOpenChange={onOpenChange} />, { wrapper: Overlays });
		await longPress("Share");
		expect(onOpenChange).toHaveBeenLastCalledWith(true);
		expect(screen.getByText("Share this file", hidden)).toBeOnTheScreen();
	});

	test("a long press on the open trigger closes it again", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<ShareTooltip defaultOpen onOpenChange={onOpenChange} />, { wrapper: Overlays });
		await longPress("Share");
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
	});

	test("a plain tap leaves a long-press tooltip shut and still runs the child's own press", async () => {
		const onOpenChange = jest.fn();
		const onPress = jest.fn();
		await renderWithProviders(
			<Tooltip onOpenChange={onOpenChange}>
				<Tooltip.Trigger onPress={onPress} accessibilityLabel="Share">
					<Tooltip.Text>Share</Tooltip.Text>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<Tooltip.Text>Share this file</Tooltip.Text>
				</Tooltip.Content>
			</Tooltip>,
			{ wrapper: Overlays }
		);
		await tap("Share");
		expect(onPress).toHaveBeenCalledTimes(1);
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	test("openOn press opens it on a tap and runs the trigger's own press", async () => {
		const onOpenChange = jest.fn();
		const onPress = jest.fn();
		await renderWithProviders(
			<Tooltip openOn="press" onOpenChange={onOpenChange}>
				<Tooltip.Trigger onPress={onPress} accessibilityLabel="About sync">
					<Tooltip.Text>i</Tooltip.Text>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<Tooltip.Text>Changes sync within a minute.</Tooltip.Text>
				</Tooltip.Content>
			</Tooltip>,
			{ wrapper: Overlays }
		);
		await tap("About sync");
		expect(onPress).toHaveBeenCalledTimes(1);
		expect(onOpenChange).toHaveBeenLastCalledWith(true);
		expect(screen.getByText("Changes sync within a minute.", hidden)).toBeOnTheScreen();
	});

	test("openOn press ignores a long press", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<ShareTooltip openOn="press" onOpenChange={onOpenChange} />, { wrapper: Overlays });
		await longPress("Share");
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	test("controlled: isOpen decides, the gesture only asks", async () => {
		const onOpenChange = jest.fn();
		const { rerender } = await renderWithProviders(<ShareTooltip isOpen={false} onOpenChange={onOpenChange} />, {
			wrapper: Overlays,
		});
		await longPress("Share");
		expect(onOpenChange).toHaveBeenCalledWith(true);
		expect(screen.queryByText("Share this file", hidden)).not.toBeOnTheScreen();

		await rerender(<ShareTooltip isOpen onOpenChange={onOpenChange} />);
		expect(screen.getByText("Share this file", hidden)).toBeOnTheScreen();
	});

	test("opening one tooltip closes the other", async () => {
		const onFirst = jest.fn();
		await renderWithProviders(
			<>
				<Tooltip defaultOpen onOpenChange={onFirst}>
					<Tooltip.Trigger accessibilityLabel="First">
						<Tooltip.Text>First</Tooltip.Text>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<Tooltip.Text>First words</Tooltip.Text>
					</Tooltip.Content>
				</Tooltip>
				<Tooltip>
					<Tooltip.Trigger accessibilityLabel="Second">
						<Tooltip.Text>Second</Tooltip.Text>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<Tooltip.Text>Second words</Tooltip.Text>
					</Tooltip.Content>
				</Tooltip>
			</>,
			{ wrapper: Overlays }
		);
		await longPress("Second");
		expect(onFirst).toHaveBeenLastCalledWith(false);
	});

	describe("what the trigger announces", () => {
		test("label names an icon trigger that has no name of its own", async () => {
			await renderWithProviders(<IconTooltip label="Share" />, { wrapper: Overlays });
			expect(screen.getByRole("button", { name: "Share" })).toBeOnTheScreen();
		});

		test("label becomes the hint when the trigger already has a name", async () => {
			await renderWithProviders(
				<Tooltip label="Sync every device">
					<Tooltip.Trigger accessibilityLabel="Sync now">
						<Tooltip.Text>Sync now</Tooltip.Text>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<Tooltip.Text>Sync every device</Tooltip.Text>
					</Tooltip.Content>
				</Tooltip>,
				{ wrapper: Overlays }
			);
			const trigger = screen.getByRole("button", { name: "Sync now" });
			expect(trigger).toBeOnTheScreen();
			expect(trigger.props.accessibilityHint).toBe("Sync every device");
		});
	});

	describe("with a screen reader running", () => {
		test("a long press no longer opens it", async () => {
			jest.spyOn(AccessibilityInfo, "isScreenReaderEnabled").mockResolvedValue(true);
			const onOpenChange = jest.fn();
			await renderWithProviders(<ShareTooltip onOpenChange={onOpenChange} />, { wrapper: Overlays });
			await longPress("Share");
			expect(onOpenChange).not.toHaveBeenCalled();
		});
	});

	describe("outside its root", () => {
		test.each([
			["Tooltip.Trigger", <Tooltip.Trigger key="t" accessibilityLabel="x" />],
			["Tooltip.Content", <Tooltip.Content key="c" />],
		])("%s throws", async (_name, part) => {
			const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
			await expect(renderWithProviders(part, { wrapper: Overlays })).rejects.toThrow(
				"Tooltip parts must be used inside a <Tooltip>."
			);
			spy.mockRestore();
		});
	});
});
