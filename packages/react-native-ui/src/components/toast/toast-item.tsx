import { type ReactElement, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, type LayoutChangeEvent, Platform, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	Easing,
	type SharedValue,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withDelay,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";
import { OVERLAY_MOTION } from "../overlay/overlay.variants";
import { playHaptic } from "../pressable";
import { Spinner } from "../spinner";
import { Toast } from "./toast";
import { ToastItemProvider } from "./toast.context";
import type { ToastHandle, ToastItem, ToastPlacement, ToastStore } from "./toast.store";
import {
	createToastTimer,
	pauseToastTimer,
	startToastTimer,
	type ToastTimer,
	toastTimerRemaining,
} from "./toast.timer";
import {
	resolveToastAnnouncement,
	resolveToastDepthStyle,
	resolveToastDrag,
	resolveToastDuration,
	resolveToastEnterDelay,
	resolveToastHaptic,
	resolveToastInterrupts,
	resolveToastRelease,
	resolveToastStackedHeight,
	TOAST_ENTER_DISTANCE,
	toastVariants,
} from "./toast.variants";

const ENTER_EASING = Easing.out(Easing.cubic);
const EXIT_EASING = Easing.in(Easing.cubic);
const SETTLE_SPRING = { damping: 20, stiffness: 260, mass: 0.6 } as const;
const DEPTH_MS = 220;
const SWIPE_OUT_MS = 180;

export type ToastViewportItemProps = {
	item: ToastItem;
	store: ToastStore;
	placement: ToastPlacement;
	depth: number;
	isExiting: boolean;
	/** Points from the screen edge to the toast's edge — safe area plus offset. */
	edgeOffset: number;
	/** False while the app is backgrounded; the clock stops. */
	isAppActive: boolean;
	isScreenReaderEnabled: boolean;
	/** The front toast's height in this stack — the front one writes it, the ones behind take it. */
	frontHeight: SharedValue<number>;
};

/** The default card for a message toast. */
function renderMessage(item: ToastItem & { kind: "message" }, handle: ToastHandle): ReactNode {
	const { action } = item;
	return (
		<Toast onHide={handle.hide} status={item.status} testID={`toast-${item.id}`}>
			<Toast.Indicator>{item.isLoading ? <Spinner /> : undefined}</Toast.Indicator>
			<Toast.Content>
				<Toast.Title>{item.title}</Toast.Title>
				{item.description ? <Toast.Description>{item.description}</Toast.Description> : null}
			</Toast.Content>
			{action ? (
				<Toast.Action onPress={() => action.onPress(handle)} testID={`toast-${item.id}-action`}>
					{action.label}
				</Toast.Action>
			) : null}
			{item.isLoading ? null : <Toast.Close testID={`toast-${item.id}-close`} />}
		</Toast>
	);
}

/**
 * One toast in the viewport: its motion, its clock and its swipe.
 *
 * - **Motion.** It enters from its edge — 16pt and a fade, after its stagger
 *   delay — and recedes with `depth`: further toward the edge, smaller and
 *   fainter, animated as depth changes. Hidden, it fades back toward its edge
 *   and only then leaves the store. Under reduce motion the entrance is a fade.
 * - **Clock.** The auto-hide clock restarts on every update (a promise toast's
 *   success gets a full duration) and pauses while the app is in the
 *   background and while a finger is on the toast.
 * - **Swipe.** A pan follows the finger sideways and toward the edge and
 *   rubber-bands toward the centre; `resolveToastRelease` decides on release.
 *   It activates only past 10pt, so a tap still reaches the action and the ✕.
 * - **Announcement.** Each revision is announced and plays its haptic once.
 */
export function ToastViewportItem({
	item,
	store,
	placement,
	depth,
	isExiting,
	edgeOffset,
	isAppActive,
	isScreenReaderEnabled,
	frontHeight,
}: ToastViewportItemProps): ReactElement {
	const { id, createdAt, batchIndex, revision, onHide } = item;
	const isReduced = useReducedMotion();
	const presence = useSharedValue(0);
	const depthValue = useSharedValue(depth);
	const dragX = useSharedValue(0);
	const dragY = useSharedValue(0);
	const width = useSharedValue(0);
	const height = useSharedValue(0);
	const isFront = depth === 0 && !isExiting;
	const [isTouched, setTouched] = useState(false);

	const hide = useCallback(() => store.dispatch({ type: "hide", id }), [store, id]);
	const handle = useMemo<ToastHandle>(() => ({ id, hide }), [id, hide]);
	const itemContext = useMemo(() => ({ id, hide }), [id, hide]);

	const remove = useCallback(() => {
		store.dispatch({ type: "remove", id });
		onHide?.();
	}, [store, id, onHide]);

	useEffect(() => {
		if (isExiting) {
			presence.value = withTiming(0, { duration: OVERLAY_MOTION.exitMs, easing: EXIT_EASING }, (finished) => {
				if (finished) scheduleOnRN(remove);
			});
			return;
		}
		const delay = resolveToastEnterDelay({ createdAt, batchIndex, now: Date.now() });
		presence.value = withDelay(delay, withTiming(1, { duration: OVERLAY_MOTION.enterMs, easing: ENTER_EASING }));
	}, [isExiting, createdAt, batchIndex, presence, remove]);

	useEffect(() => {
		depthValue.value = withTiming(depth, { duration: DEPTH_MS, easing: ENTER_EASING });
	}, [depth, depthValue]);

	useEffect(() => {
		if (isFront && height.value > 0) frontHeight.value = height.value;
	}, [isFront, height, frontHeight]);

	const duration =
		item.kind === "message"
			? resolveToastDuration(
					{ duration: item.duration, hasAction: item.action !== undefined, isLoading: item.isLoading },
					{ isScreenReaderEnabled }
				)
			: resolveToastDuration({ duration: item.duration }, { isScreenReaderEnabled });
	const isPaused = !isAppActive || isTouched;
	const clock = useRef<{ key: string; timer: ToastTimer } | null>(null);

	useEffect(() => {
		if (isExiting) return;
		const key = `${revision}:${duration}`;
		if (clock.current?.key !== key) clock.current = { key, timer: createToastTimer(duration) };
		if (isPaused) return;
		const running = clock.current;
		running.timer = startToastTimer(running.timer, Date.now());
		const remaining = toastTimerRemaining(running.timer, Date.now());
		const timeout = Number.isFinite(remaining) ? setTimeout(hide, remaining) : null;
		return () => {
			if (timeout !== null) clearTimeout(timeout);
			running.timer = pauseToastTimer(running.timer, Date.now());
		};
	}, [revision, duration, isPaused, isExiting, hide]);

	const status = item.kind === "message" ? item.status : "default";
	const announcement =
		item.kind === "message" ? resolveToastAnnouncement({ title: item.title, description: item.description }) : null;
	const haptic = resolveToastHaptic(status, item.haptic);

	// Once per revision: a promise toast is announced loading and again when it settles.
	// biome-ignore lint/correctness/useExhaustiveDependencies: revision is the trigger; the rest only changes with it
	useEffect(() => {
		if (haptic !== false) scheduleOnUI(playHaptic, haptic);
		if (announcement === null) return;
		if (Platform.OS === "ios" && resolveToastInterrupts(status)) {
			AccessibilityInfo.announceForAccessibilityWithOptions(announcement, { queue: false });
		} else {
			AccessibilityInfo.announceForAccessibility(announcement);
		}
	}, [revision]);

	const pan = useMemo(
		() =>
			Gesture.Pan()
				.activeOffsetX([-10, 10])
				.activeOffsetY([-10, 10])
				.onBegin(() => {
					"worklet";
					scheduleOnRN(setTouched, true);
				})
				.onUpdate((event) => {
					"worklet";
					const drag = resolveToastDrag({
						placement,
						translationX: event.translationX,
						translationY: event.translationY,
					});
					dragX.value = drag.x;
					dragY.value = drag.y;
				})
				.onEnd((event) => {
					"worklet";
					const release = resolveToastRelease({
						placement,
						translationX: event.translationX,
						translationY: event.translationY,
						velocityX: event.velocityX,
						velocityY: event.velocityY,
						width: width.value,
						height: height.value,
					});
					if (release.kind === "settle") {
						dragX.value = withSpring(0, SETTLE_SPRING);
						dragY.value = withSpring(0, SETTLE_SPRING);
						return;
					}
					if (release.axis === "x") {
						dragX.value = withTiming(release.direction * (width.value + 48), { duration: SWIPE_OUT_MS });
					} else {
						dragY.value = withTiming(release.direction * (height.value + edgeOffset + 24), {
							duration: SWIPE_OUT_MS,
						});
					}
					scheduleOnRN(hide);
				})
				.onFinalize(() => {
					"worklet";
					scheduleOnRN(setTouched, false);
				}),
		[placement, dragX, dragY, width, height, edgeOffset, hide]
	);

	const animatedStyle = useAnimatedStyle(() => {
		const stack = resolveToastDepthStyle(depthValue.value, placement);
		const towardEdge = placement === "bottom" ? 1 : -1;
		const enter = isReduced ? 0 : towardEdge * TOAST_ENTER_DISTANCE * (1 - presence.value);
		const stackedHeight = resolveToastStackedHeight({
			depth: depthValue.value,
			natural: height.value,
			front: frontHeight.value,
		});
		return {
			height: stackedHeight ?? undefined,
			opacity: Math.max(0, presence.value * stack.opacity),
			transform: [
				{ translateX: dragX.value },
				{ translateY: stack.translateY + enter + dragY.value },
				{ scale: stack.scale },
			],
		};
	});

	const onLayout = useCallback(
		(event: LayoutChangeEvent) => {
			width.value = event.nativeEvent.layout.width;
		},
		[width]
	);

	// The card's own height, measured inside the clip, so a toast behind still
	// knows how tall it is when it moves up — and the front one publishes it.
	const onCardLayout = useCallback(
		(event: LayoutChangeEvent) => {
			height.value = event.nativeEvent.layout.height;
			if (isFront) frontHeight.value = event.nativeEvent.layout.height;
		},
		[height, isFront, frontHeight]
	);

	const zIndex = 2 * (50 - depth) - (isExiting ? 1 : 0);
	const edge = placement === "bottom" ? { bottom: edgeOffset } : { top: edgeOffset };

	return (
		<View className={toastVariants().item()} pointerEvents="box-none" style={[edge, { zIndex }]}>
			<GestureDetector gesture={pan}>
				<Animated.View
					onLayout={onLayout}
					pointerEvents={isExiting ? "none" : "auto"}
					style={[
						{
							width: "100%",
							maxWidth: 560,
							overflow: "hidden",
							justifyContent: placement === "bottom" ? "flex-end" : "flex-start",
							transformOrigin: placement === "bottom" ? "bottom" : "top",
						},
						animatedStyle,
					]}
				>
					<View onLayout={onCardLayout} style={{ flexShrink: 0 }}>
						<ToastItemProvider value={itemContext}>
							{item.kind === "message" ? renderMessage(item, handle) : item.render(handle)}
						</ToastItemProvider>
					</View>
				</Animated.View>
			</GestureDetector>
		</View>
	);
}
ToastViewportItem.displayName = "DelacourUI.ToastViewport.Item";
