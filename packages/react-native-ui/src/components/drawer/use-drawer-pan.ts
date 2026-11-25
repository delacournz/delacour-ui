import { type PanGesture, usePanGesture } from "react-native-gesture-handler";
import { cancelAnimation, Easing, type SharedValue, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { OVERLAY_MOTION } from "../overlay/overlay.variants";
import { playHaptic } from "../pressable";
import {
	DRAWER_DISMISS_FRACTION,
	DRAWER_PAN_ACTIVE_OFFSET,
	type DrawerEdge,
	resolveDrawerDrag,
	resolveDrawerDragFraction,
	resolveDrawerExitDuration,
	resolveDrawerRelease,
} from "./drawer.variants";

export type UseDrawerPanOptions = {
	edge: DrawerEdge;
	/** The panel's width or height along its axis. */
	extent: number;
	isEnabled: boolean;
	/** The panel's displacement along its axis, physical sign — written by the pan, read by the panel's style. */
	drag: SharedValue<number>;
	/** Called once a dismissing release has carried the panel off its edge. */
	onDismiss: () => void;
};

const RESTORE_EASING = Easing.out(Easing.cubic);
const PAN_RANGE: [number, number] = [-DRAWER_PAN_ACTIVE_OFFSET, DRAWER_PAN_ACTIVE_OFFSET];

/**
 * The panel's swipe-to-dismiss.
 *
 * The pan claims the touch only after `DRAWER_PAN_ACTIVE_OFFSET` of travel
 * along the panel's axis and fails on the same travel across it, so a tap
 * reaches the row under it and a vertical scroll in a start or end drawer's
 * body never moves the drawer.
 *
 * While it runs the panel follows the finger toward its edge and rubber-bands
 * away from it (`resolveDrawerDrag`), and a `selection` haptic marks each
 * crossing of the dismiss threshold — the moment letting go changes what
 * happens. On release `resolveDrawerRelease` decides: a dismiss **continues
 * from where the finger left the panel**, at the release speed, and closes the
 * drawer when it lands; a restore eases back to docked.
 *
 * The handlers are built in this hook, so they may call the module-scope
 * worklets in `drawer.variants` — those, being module-scope, call nothing.
 * Per-gesture memory lives in shared values: each worklet gets its own copy of
 * a captured `let`.
 *
 * The release is `onDeactivate`, not `onFinalize`: Gesture Handler 3's
 * `onFinalize` event carries only the pointer's position, no translation or
 * velocity, and `onDeactivate` runs on every path out of an ACTIVE pan.
 */
export function useDrawerPan({ edge, extent, isEnabled, drag, onDismiss }: UseDrawerPanOptions): PanGesture {
	const isDragging = useSharedValue(false);
	const isPastThreshold = useSharedValue(false);

	const isHorizontal = edge === "left" || edge === "right";
	const sign = edge === "left" || edge === "top" ? -1 : 1;

	return usePanGesture({
		enabled: isEnabled,
		shouldCancelWhenOutside: false,
		activeOffsetX: isHorizontal ? PAN_RANGE : undefined,
		failOffsetY: isHorizontal ? PAN_RANGE : undefined,
		activeOffsetY: isHorizontal ? undefined : PAN_RANGE,
		failOffsetX: isHorizontal ? undefined : PAN_RANGE,
		onActivate: () => {
			"worklet";
			cancelAnimation(drag);
			isDragging.value = true;
			isPastThreshold.value = false;
		},
		onUpdate: (event) => {
			"worklet";
			const translation = isHorizontal ? event.translationX : event.translationY;
			drag.value = resolveDrawerDrag(edge, translation);

			const isPast = resolveDrawerDragFraction(edge, translation, extent) > DRAWER_DISMISS_FRACTION;
			if (isPast !== isPastThreshold.value) {
				isPastThreshold.value = isPast;
				playHaptic("selection");
			}
		},
		onDeactivate: (event) => {
			"worklet";
			// Only an activated pan reaches here, but a dismiss may still be animating
			// `drag` under a touch that began late: the flag keeps one release per drag.
			if (!isDragging.value) return;
			isDragging.value = false;

			const translation = isHorizontal ? event.translationX : event.translationY;
			const velocity = isHorizontal ? event.velocityX : event.velocityY;
			const release = resolveDrawerRelease({ edge, extent, translation, velocity });

			if (release === "dismiss") {
				const duration = resolveDrawerExitDuration({
					remaining: Math.max(0, extent - Math.abs(drag.value)),
					velocity,
				});
				drag.value = withTiming(sign * extent, { duration, easing: Easing.linear }, (finished) => {
					if (finished) scheduleOnRN(onDismiss);
				});
				return;
			}

			drag.value = withTiming(0, { duration: OVERLAY_MOTION.enterMs, easing: RESTORE_EASING });
		},
	});
}
