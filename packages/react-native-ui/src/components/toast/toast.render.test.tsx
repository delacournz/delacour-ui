import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import type { ReactElement, ReactNode } from "react";
import { AccessibilityInfo } from "react-native";
import { makeMutable, type SharedValue } from "react-native-reanimated";
import { act, fireEvent, renderWithProviders, screen } from "../../test/render";
import { OverlayProvider } from "../overlay";
import { Toast } from "./toast";
import { createToastOffsetStore, type ToastOffsetStore } from "./toast.offset";
import { createToastApi, createToastStore, type ToastApi, type ToastStore } from "./toast.store";
import { ToastViewport } from "./toast-viewport";
import { useToastOffset } from "./use-toast-offset";

function Overlays({ children }: { children: ReactNode }): ReactElement {
	return <OverlayProvider>{children}</OverlayProvider>;
}

type Harness = { store: ToastStore; toast: ToastApi };

function makeHarness(): Harness {
	const store = createToastStore();
	return { store, toast: createToastApi(store) };
}

async function mountViewport(harness: Harness): Promise<void> {
	await renderWithProviders(<ToastViewport store={harness.store} />, { wrapper: Overlays });
}

// Swipe-to-dismiss is a Gesture Handler pan on the card and carries no testID, so it is not driven here;
// its decision logic (resolveToastDrag / resolveToastRelease) is covered by toast.variants.test.ts.
describe("Toast", () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	test("renders nothing until a toast is shown", async () => {
		const harness = makeHarness();
		await mountViewport(harness);
		expect(screen.queryByTestId(/^toast-/)).not.toBeOnTheScreen();
	});

	test("a shown toast draws its title and description", async () => {
		const harness = makeHarness();
		await mountViewport(harness);
		await act(async () => {
			harness.toast.show({ title: "Saved", description: "Your changes are live." });
		});
		expect(screen.getByText("Saved")).toBeOnTheScreen();
		expect(screen.getByText("Your changes are live.")).toBeOnTheScreen();
	});

	test("a plain string is the title", async () => {
		const harness = makeHarness();
		await mountViewport(harness);
		await act(async () => {
			harness.toast("Link copied");
		});
		expect(screen.getByText("Link copied")).toBeOnTheScreen();
	});

	test("the card is one accessible element with a polite live region", async () => {
		const harness = makeHarness();
		await mountViewport(harness);
		await act(async () => {
			harness.toast.info("Heads up");
		});
		const card = screen.getByTestId(/^toast-toast-\d+$/);
		expect(card.props.accessible).toBe(true);
		expect(card.props.accessibilityLiveRegion).toBe("polite");
		expect(card.props.accessibilityRole).toBe("none");
	});

	test("an error toast is announced as an alert", async () => {
		const harness = makeHarness();
		await mountViewport(harness);
		await act(async () => {
			harness.toast.error("Upload failed");
		});
		expect(screen.getByRole("alert")).toBeOnTheScreen();
	});

	test("each revision is announced to a screen reader", async () => {
		const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility");
		const announceWithOptions = jest.spyOn(AccessibilityInfo, "announceForAccessibilityWithOptions");
		const harness = makeHarness();
		await mountViewport(harness);
		await act(async () => {
			harness.toast.success("Saved");
		});
		expect(announce.mock.calls.length + announceWithOptions.mock.calls.length).toBeGreaterThan(0);
		announce.mockRestore();
		announceWithOptions.mockRestore();
	});

	test("the action runs its callback and hides the toast", async () => {
		const onPress = jest.fn();
		const harness = makeHarness();
		await mountViewport(harness);
		await act(async () => {
			harness.toast.show({ title: "Archived", action: { label: "Undo", onPress } });
		});
		await fireEvent(screen.getByRole("button", { name: "Undo" }), "accessibilityTap");
		expect(onPress).toHaveBeenCalledTimes(1);
		expect(harness.store.getSnapshot()[0]?.isExiting).toBe(true);
	});

	test("the close control hides the toast", async () => {
		const harness = makeHarness();
		await mountViewport(harness);
		await act(async () => {
			harness.toast.show({ title: "Saved" });
		});
		await fireEvent(screen.getByRole("button", { name: "Dismiss" }), "accessibilityTap");
		expect(harness.store.getSnapshot()[0]?.isExiting).toBe(true);
	});

	test("a loading toast has no close control", async () => {
		const harness = makeHarness();
		await mountViewport(harness);
		await act(async () => {
			harness.toast.show({ title: "Saving", isLoading: true });
		});
		expect(screen.getByText("Saving")).toBeOnTheScreen();
		expect(screen.queryByRole("button", { name: "Dismiss" })).not.toBeOnTheScreen();
	});

	test("the card exposes activate, escape and dismiss actions to assistive tech", async () => {
		const onPress = jest.fn();
		const harness = makeHarness();
		await mountViewport(harness);
		await act(async () => {
			harness.toast.show({ title: "Archived", action: { label: "Undo", onPress } });
		});
		const card = screen.getByTestId(/^toast-toast-\d+$/);
		const names = (card.props.accessibilityActions as { name: string }[]).map((action) => action.name);
		expect(names).toEqual(expect.arrayContaining(["activate", "escape", "dismiss"]));

		await fireEvent(card, "accessibilityAction", { nativeEvent: { actionName: "activate" } });
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("a toast shown again with its id while leaving survives the old exit", async () => {
		const onHide = jest.fn();
		const harness = makeHarness();
		await mountViewport(harness);
		await act(async () => {
			harness.toast.show({ id: "sync", title: "Syncing", duration: 0, onHide });
		});
		await act(async () => {
			harness.toast.hide("sync");
		});
		await act(async () => {
			harness.toast.show({ id: "sync", title: "Synced", duration: 0, onHide });
		});
		await act(async () => {
			jest.advanceTimersByTime(1000);
		});
		expect(harness.store.getSnapshot().map((item) => item.id)).toEqual(["sync"]);
		expect(screen.getByText("Synced")).toBeOnTheScreen();
		expect(onHide).not.toHaveBeenCalled();
	});

	test("a screen reader's dismiss action hides the toast", async () => {
		const harness = makeHarness();
		await mountViewport(harness);
		await act(async () => {
			harness.toast("Link copied");
		});
		await fireEvent(screen.getByTestId(/^toast-toast-\d+$/), "accessibilityAction", {
			nativeEvent: { actionName: "dismiss" },
		});
		expect(harness.store.getSnapshot()[0]?.isExiting).toBe(true);
	});

	test("auto-dismisses once its duration has run", async () => {
		const harness = makeHarness();
		await mountViewport(harness);
		await act(async () => {
			harness.toast.show({ title: "Gone soon", duration: 1000 });
		});
		expect(harness.store.getSnapshot()[0]?.isExiting).toBe(false);
		await act(async () => {
			jest.advanceTimersByTime(999);
		});
		expect(harness.store.getSnapshot()[0]?.isExiting).toBe(false);
		await act(async () => {
			jest.advanceTimersByTime(2);
		});
		expect(harness.store.getSnapshot()[0]?.isExiting).toBe(true);
	});

	test("duration 0 stays until hidden", async () => {
		const harness = makeHarness();
		await mountViewport(harness);
		await act(async () => {
			harness.toast.show({ title: "Persistent", duration: 0 });
		});
		await act(async () => {
			jest.advanceTimersByTime(60_000);
		});
		expect(harness.store.getSnapshot()[0]?.isExiting).toBe(false);
		expect(screen.getByText("Persistent")).toBeOnTheScreen();
	});

	test("toast.hideAll marks every toast as leaving", async () => {
		const harness = makeHarness();
		await mountViewport(harness);
		await act(async () => {
			harness.toast.show({ title: "One", duration: 0 });
			harness.toast.show({ title: "Two", duration: 0 });
		});
		await act(async () => {
			harness.toast.hideAll();
		});
		expect(harness.store.getSnapshot().every((item) => item.isExiting)).toBe(true);
	});

	test("toast.update changes the text in place", async () => {
		const harness = makeHarness();
		await mountViewport(harness);
		let id = "";
		await act(async () => {
			id = harness.toast.show({ title: "Saving", duration: 0 }).id;
		});
		await act(async () => {
			harness.toast.update(id, { title: "Saved" });
		});
		expect(screen.getByText("Saved")).toBeOnTheScreen();
		expect(screen.queryByText("Saving")).not.toBeOnTheScreen();
	});

	test("a custom render hides the toast it is drawn in without an onHide", async () => {
		const harness = makeHarness();
		await mountViewport(harness);
		await act(async () => {
			harness.toast.show({
				duration: 0,
				render: () => (
					<Toast status="success">
						<Toast.Content>
							<Toast.Title>Invite sent</Toast.Title>
						</Toast.Content>
						<Toast.Close />
					</Toast>
				),
			});
		});
		expect(screen.getByText("Invite sent")).toBeOnTheScreen();
		await fireEvent(screen.getByRole("button", { name: "Dismiss" }), "accessibilityTap");
		expect(harness.store.getSnapshot()[0]?.isExiting).toBe(true);
	});

	test("a part used outside a Toast throws its documented error", async () => {
		const spy = jest.spyOn(console, "error").mockImplementation(() => {});
		try {
			await expect(renderWithProviders(<Toast.Close />)).rejects.toThrow(
				"Toast.Close must be rendered inside a <Toast>."
			);
			await expect(renderWithProviders(<Toast.Title>x</Toast.Title>)).rejects.toThrow(
				"Toast.Title must be rendered inside a <Toast>."
			);
		} finally {
			spy.mockRestore();
		}
	});
});

describe("Toast offset", () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	type OffsetHarness = Harness & { offsets: ToastOffsetStore<SharedValue<number>> };

	function makeOffsetHarness(): OffsetHarness {
		return { ...makeHarness(), offsets: createToastOffsetStore<SharedValue<number>>() };
	}

	function OffsetViewport({ harness, children }: { harness: OffsetHarness; children?: ReactNode }): ReactElement {
		return (
			<>
				{children}
				<ToastViewport offsetStore={harness.offsets} store={harness.store} />
			</>
		);
	}

	/** Registers `bottom` through the hook, the way an app's tab bar does. */
	function TabBarOffset({ bottom, harness }: { bottom: number | null; harness: OffsetHarness }): null {
		useToastOffset(bottom === null ? null : { bottom }, { store: harness.offsets });
		return null;
	}

	async function showToast(harness: Harness, placement: "top" | "bottom" = "bottom"): Promise<void> {
		await act(async () => {
			harness.toast.show({ title: "Saved", duration: 0, placement });
		});
	}

	/** The translateY a stack is drawn at right now. */
	function liftOf(testID: string): number {
		const { jestAnimatedStyle } = screen.getByTestId(testID).props as {
			jestAnimatedStyle?: { value: { transform?: { translateY?: number }[] } };
		};
		// `|| 0` folds -0 into 0.
		return jestAnimatedStyle?.value.transform?.[0]?.translateY || 0;
	}

	/** Reanimated's JS mappers run on animation frames, so let them catch up. */
	async function settle(): Promise<void> {
		await act(async () => {
			jest.advanceTimersByTime(1000);
		});
	}

	test("the bottom stack lifts by a registered shared value", async () => {
		const harness = makeOffsetHarness();
		const source = makeMutable(0);
		await renderWithProviders(<OffsetViewport harness={harness} />, { wrapper: Overlays });
		await showToast(harness);
		await act(async () => {
			harness.offsets.set({ bottom: source });
		});
		await act(async () => {
			source.value = 84;
		});
		await settle();
		expect(liftOf("toast-stack-bottom")).toBe(-84);
	});

	test("useToastOffset animates a number in and back to 0 on null", async () => {
		const harness = makeOffsetHarness();
		const view = await renderWithProviders(
			<OffsetViewport harness={harness}>
				<TabBarOffset bottom={84} harness={harness} />
			</OffsetViewport>,
			{ wrapper: Overlays }
		);
		await showToast(harness);
		await settle();
		expect(liftOf("toast-stack-bottom")).toBe(-84);

		await view.rerender(
			<OffsetViewport harness={harness}>
				<TabBarOffset bottom={null} harness={harness} />
			</OffsetViewport>
		);
		await settle();
		expect(liftOf("toast-stack-bottom")).toBe(0);
		expect(harness.offsets.getSnapshot().bottom).toBeDefined();
	});

	test("useToastOffset releases its registration on unmount", async () => {
		const harness = makeOffsetHarness();
		const view = await renderWithProviders(<TabBarOffset bottom={84} harness={harness} />, { wrapper: Overlays });
		expect(harness.offsets.getSnapshot().bottom).toBeDefined();
		await view.unmount();
		expect(harness.offsets.getSnapshot().bottom).toBeUndefined();
	});

	test("the top stack moves down by a top offset", async () => {
		const harness = makeOffsetHarness();
		await renderWithProviders(<OffsetViewport harness={harness} />, { wrapper: Overlays });
		await showToast(harness, "top");
		await act(async () => {
			harness.offsets.set({ top: makeMutable(44) });
		});
		await settle();
		expect(liftOf("toast-stack-top")).toBe(44);
	});
});
