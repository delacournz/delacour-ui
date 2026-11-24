import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { AccessibilityInfo, Platform } from "react-native";
import { resetScreenReaderStore } from "../../hooks/use-looping-motion";
import { IconSparkle } from "../../icons/central";
import { act, fireEvent, renderWithProviders, screen, within } from "../../test/render";
import { AnimatedBadge } from "./animated-badge";

/**
 * The root, by testID: its inner label is also a `text`-role element, so a role query would find two.
 */
function root() {
	return screen.getByTestId("badge");
}

/*
 * The roll itself (exit, swap, enter) runs on Reanimated timings that Jest does not advance, so
 * what is asserted is what a screen reader sees: the label, the role, busy, the live region and
 * what is hidden. Layout, the width spring and the pulse are verified in the playground.
 */
describe("AnimatedBadge", () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	test("is a text element named by its label", async () => {
		await renderWithProviders(
			<AnimatedBadge testID="badge" status="success">
				Live
			</AnimatedBadge>
		);
		expect(root()).toBeOnTheScreen();
		expect(root().props.accessibilityRole).toBe("text");
		expect(root()).toHaveAccessibleName("Live");
		expect(screen.getByText("Live")).toBeOnTheScreen();
	});

	test("defaults to neutral and is not busy", async () => {
		await renderWithProviders(<AnimatedBadge testID="badge">Idle</AnimatedBadge>);
		expect(root()).not.toBeBusy();
	});

	test("loading is announced as busy", async () => {
		await renderWithProviders(
			<AnimatedBadge testID="badge" status="loading">
				Building
			</AnimatedBadge>
		);
		expect(root()).toBeBusy();
		expect(root()).toHaveAccessibleName("Building");
	});

	test("joins an array of text children into the label", async () => {
		await renderWithProviders(
			<AnimatedBadge testID="badge" status="info">
				{["3", " reviews"]}
			</AnimatedBadge>
		);
		expect(root()).toHaveAccessibleName("3 reviews");
	});

	test("a number child is the label", async () => {
		await renderWithProviders(<AnimatedBadge testID="badge">{7}</AnimatedBadge>);
		expect(root()).toHaveAccessibleName("7");
	});

	test("an accessibilityLabel beats the label text", async () => {
		await renderWithProviders(
			<AnimatedBadge testID="badge" accessibilityLabel="Deploy status: live">
				Live
			</AnimatedBadge>
		);
		expect(root()).toHaveAccessibleName("Deploy status: live");
	});

	test("announce is a polite live region on the root, announce={false} is not", async () => {
		const view = await renderWithProviders(<AnimatedBadge testID="badge">Live</AnimatedBadge>);
		expect(root().props.accessibilityLiveRegion).toBe("polite");

		await view.rerender(
			<AnimatedBadge testID="badge" announce={false}>
				Live
			</AnimatedBadge>
		);
		expect(root().props.accessibilityLiveRegion).toBe("none");
	});

	test("the invisible measurer is hidden from assistive technology", async () => {
		await renderWithProviders(<AnimatedBadge testID="badge">Live</AnimatedBadge>);
		expect(within(root()).getAllByText("Live", { hidden: true })).toHaveLength(2);
		expect(within(root()).getAllByText("Live")).toHaveLength(1);
	});

	test("accepts a custom icon, and showIcon={false}, without losing the name", async () => {
		const view = await renderWithProviders(
			<AnimatedBadge testID="badge" icon={IconSparkle} status="info">
				Suggested
			</AnimatedBadge>
		);
		expect(root()).toHaveAccessibleName("Suggested");

		await view.rerender(
			<AnimatedBadge testID="badge" showIcon={false} status="info">
				Suggested
			</AnimatedBadge>
		);
		expect(root()).toHaveAccessibleName("Suggested");
	});

	test("a status change with the same words updates busy", async () => {
		const view = await renderWithProviders(
			<AnimatedBadge testID="badge" status="loading">
				Build
			</AnimatedBadge>
		);
		expect(root()).toBeBusy();

		await view.rerender(
			<AnimatedBadge testID="badge" status="success">
				Build
			</AnimatedBadge>
		);
		expect(root()).not.toBeBusy();
		expect(root()).toHaveAccessibleName("Build");
	});

	test("does not announce on mount, on iOS", async () => {
		const original = Platform.OS;
		Platform.OS = "ios";
		const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => undefined);
		try {
			await renderWithProviders(<AnimatedBadge testID="badge">Live</AnimatedBadge>);
			expect(announce).not.toHaveBeenCalled();
		} finally {
			Platform.OS = original;
		}
	});

	describe("pulse pause", () => {
		let isReaderOn = false;

		beforeEach(() => {
			resetScreenReaderStore();
			isReaderOn = false;
			jest.spyOn(AccessibilityInfo, "isScreenReaderEnabled").mockImplementation(() => Promise.resolve(isReaderOn));
			jest
				.spyOn(AccessibilityInfo, "addEventListener")
				.mockImplementation((() => ({ remove: jest.fn() })) as unknown as typeof AccessibilityInfo.addEventListener);
		});

		function names(): string[] {
			return (root().props.accessibilityActions ?? []).map((action: { name: string }) => action.name);
		}

		test("a pulsing badge offers pause, and resume once paused", async () => {
			const onPausedChange = jest.fn();
			const view = await renderWithProviders(
				<AnimatedBadge testID="badge" status="loading" onPausedChange={onPausedChange}>
					Building
				</AnimatedBadge>
			);
			expect(names()).toEqual(["pause"]);
			await act(async () => fireEvent(root(), "accessibilityAction", { nativeEvent: { actionName: "pause" } }));
			expect(onPausedChange).toHaveBeenCalledWith(true);
			expect(names()).toEqual(["resume"]);
			await view.unmount();
		});

		test("isPaused controls the pause", async () => {
			await renderWithProviders(
				<AnimatedBadge testID="badge" status="loading" isPaused>
					Building
				</AnimatedBadge>
			);
			expect(names()).toEqual(["resume"]);
		});

		test("a screen reader holds the pulse and leaves no action to offer", async () => {
			isReaderOn = true;
			const view = await renderWithProviders(
				<AnimatedBadge testID="badge" status="loading">
					Building
				</AnimatedBadge>
			);
			await act(async () => {});
			expect(names()).toEqual([]);
			await view.unmount();
		});

		test("a badge that does not pulse offers no pause", async () => {
			await renderWithProviders(
				<AnimatedBadge testID="badge" status="success">
					Live
				</AnimatedBadge>
			);
			expect(names()).toEqual([]);
		});
	});
});
