import { type ReactElement, useEffect, useState, useSyncExternalStore } from "react";
import { AccessibilityInfo, AppState, View } from "react-native";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Overlay } from "../overlay";
import type { ToastItem, ToastPlacement, ToastStore } from "./toast.store";
import { resolveToastStack, TOAST_PLACEMENTS, toastVariants } from "./toast.variants";
import { toastStore } from "./toast-api";
import { ToastViewportItem } from "./toast-item";

/** The gap between a toast and the safe area, in points, when no `offset` is given. */
const DEFAULT_EDGE_GAP = 8;

export type ToastViewportProps = {
	/** Extra points between each stack and its safe-area edge — clear a tab bar with `{ bottom: 56 }`. Default 8 each. */
	offset?: { top?: number; bottom?: number };
	/** The store to draw. Default: the one `toast` writes to. */
	store?: ToastStore;
};

/** Whether VoiceOver or TalkBack is running, kept current. */
function useScreenReaderEnabled(): boolean {
	const [isEnabled, setEnabled] = useState(false);
	useEffect(() => {
		let isMounted = true;
		AccessibilityInfo.isScreenReaderEnabled().then((value) => {
			if (isMounted) setEnabled(value);
		});
		const subscription = AccessibilityInfo.addEventListener("screenReaderChanged", setEnabled);
		return () => {
			isMounted = false;
			subscription.remove();
		};
	}, []);
	return isEnabled;
}

/** False while the app is in the background or inactive — every toast's clock stops. */
function useAppActive(): boolean {
	const [isActive, setActive] = useState(AppState.currentState === "active");
	useEffect(() => {
		const subscription = AppState.addEventListener("change", (state) => setActive(state === "active"));
		return () => subscription.remove();
	}, []);
	return isActive;
}

/**
 * Draws every toast — mount it once, inside `OverlayProvider`, beside the
 * navigator.
 *
 * Two stacks, top and bottom, in the overlay z-order's `toast` band, above
 * every sheet and every dialog. Both are `box-none`: only a toast's own card
 * takes a touch, so the app under the viewport stays tappable. The top stack
 * sits under the status bar; the bottom one above the home indicator, and it
 * rides up with the keyboard. Each stack draws its newest three and queues the
 * rest (`resolveToastStack`).
 *
 * Renders nothing — and holds no overlay registration — while there is no
 * toast. Without an `OverlayProvider` it draws inline and warns once in
 * development, like every overlay.
 *
 * @example
 * <OverlayProvider>
 *   <BottomSheetProvider>
 *     <Stack />
 *     <ToastViewport />
 *   </BottomSheetProvider>
 * </OverlayProvider>
 */
export function ToastViewport({ offset, store = toastStore }: ToastViewportProps): ReactElement | null {
	const items = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
	const insets = useSafeAreaInsets();
	const isAppActive = useAppActive();
	const isScreenReaderEnabled = useScreenReaderEnabled();
	const keyboard = useReanimatedKeyboardAnimation();
	const insetBottom = insets.bottom;
	const topFrontHeight = useSharedValue(0);
	const bottomFrontHeight = useSharedValue(0);

	// The keyboard covers the home indicator, so the bottom stack lifts by the
	// part of the keyboard above that inset — no more.
	const keyboardLift = useAnimatedStyle(() => ({
		transform: [{ translateY: -Math.max(0, -keyboard.height.value - insetBottom) }],
	}));

	if (items.length === 0) return null;

	const byId = new Map<string, ToastItem>(items.map((item) => [item.id, item]));
	const edgeOffsets: Record<ToastPlacement, number> = {
		top: insets.top + (offset?.top ?? DEFAULT_EDGE_GAP),
		bottom: insets.bottom + (offset?.bottom ?? DEFAULT_EDGE_GAP),
	};
	const slots = toastVariants();

	const stacks = TOAST_PLACEMENTS.map((placement) => ({
		placement,
		entries: resolveToastStack(items, placement).filter((entry) => entry.isVisible),
	}));

	return (
		<Overlay.Portal layer="toast">
			<View className={slots.viewport()} pointerEvents="box-none">
				{stacks.map(({ placement, entries }) => (
					<Animated.View
						className={slots.stack()}
						key={placement}
						pointerEvents="box-none"
						style={placement === "bottom" ? keyboardLift : undefined}
					>
						{entries.map((entry) => {
							const item = byId.get(entry.id);
							return item ? (
								<ToastViewportItem
									depth={entry.depth}
									edgeOffset={edgeOffsets[placement]}
									frontHeight={placement === "bottom" ? bottomFrontHeight : topFrontHeight}
									isAppActive={isAppActive}
									isExiting={entry.isExiting}
									isScreenReaderEnabled={isScreenReaderEnabled}
									item={item}
									key={item.id}
									placement={placement}
									store={store}
								/>
							) : null;
						})}
					</Animated.View>
				))}
			</View>
		</Overlay.Portal>
	);
}
ToastViewport.displayName = "DelacourUI.ToastViewport";
