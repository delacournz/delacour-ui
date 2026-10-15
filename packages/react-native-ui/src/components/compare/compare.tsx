import { type ReactElement, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { I18nManager, type LayoutChangeEvent, View, type ViewProps } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useAnimatedReaction, useSharedValue, withSpring } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { useControllableState } from "../../hooks/use-controllable-state";
import { useFieldContext } from "../field/field.context";
import { type HapticFeedback, playHaptic } from "../pressable/pressable";
import { type CompareContextValue, CompareProvider } from "./compare.context";
import {
	COMPARE_ANYWHERE_ACTIVE_OFFSET,
	COMPARE_ANYWHERE_FAIL_OFFSET,
	COMPARE_DEFAULT_COLOR,
	COMPARE_DEFAULT_GRAB,
	COMPARE_DEFAULT_ORIENTATION,
	COMPARE_DEFAULT_POSITION,
	COMPARE_DEFAULT_SIZE,
	COMPARE_HANDLE_BAND,
	COMPARE_HANDLE_SPRING,
	COMPARE_SNAP_THRESHOLD,
	COMPARE_STEP,
	type CompareColor,
	type CompareGrab,
	type CompareOrientation,
	type ComparePosition,
	type CompareSide,
	type CompareSize,
	clampPosition,
	compareVariants,
	isWithinGrabBand,
	quantizePosition,
	resolvePositionFromGesture,
	resolveReleaseVelocity,
	resolveRevealTransforms,
	shouldTickCompareHaptic,
	snapPosition,
	stepPosition,
} from "./compare.variants";
import { CompareAfter } from "./compare-after";
import { CompareBefore } from "./compare-before";
import { CompareHandle } from "./compare-handle";
import { CompareLabel } from "./compare-label";

export type CompareProps = Omit<ViewProps, "children"> & {
	/** Controlled position, 0–1 — the share of the frame Before covers. Omit for uncontrolled. */
	position?: ComparePosition;
	/** Starting position while uncontrolled. Default `0.5`. */
	defaultPosition?: ComparePosition;
	/** Fires as the seam moves, at percent resolution, and on every assistive step. */
	onPositionChange?: (position: ComparePosition) => void;
	/** Fires once on release, after snapping. Where a network write belongs. */
	onPositionChangeEnd?: (position: ComparePosition) => void;
	/** `vertical` puts Before on top, and needs a definite height. Default `horizontal`. */
	orientation?: CompareOrientation;
	/** Where a drag may begin. `handle` (default) leaves the rest of the frame to a scroll view. */
	grab?: CompareGrab;
	/** Stops the seam lands on; a release within `snapThreshold` of one is pulled onto it. */
	snapPoints?: readonly ComparePosition[];
	/** In position units. Default `0.04`. Ignored without `snapPoints`. */
	snapThreshold?: number;
	/** What one assistive increment moves the seam by. Default `0.1`. */
	step?: number;
	/** The seam never goes below this. Default `0`. */
	minPosition?: ComparePosition;
	/** The seam never goes above this. Default `1`. */
	maxPosition?: ComparePosition;
	/** The handle and divider's paint. */
	color?: CompareColor;
	/** The handle's size. Its touch band is 44pt at every size. */
	size?: CompareSize;
	/** Blocks the drag and the assistive actions. Inherited from an enclosing `Field`. */
	isDisabled?: boolean;
	/** Played on grab, at snap points and at either bound. `false` silences it. */
	haptic?: false | HapticFeedback;
	/** Names the handle's adjustable. Defaults to an enclosing `Field.Label`'s text. */
	accessibilityLabel?: string;
	/** The frame. Give it a size — `aspect-*` or `h-*`; it has none of its own. */
	className?: string;
	/** `Compare.Before`, `Compare.After`, `Compare.Handle` and any `Compare.Label`s. */
	children: ReactNode;
};

function CompareRoot({
	position: positionProp,
	defaultPosition = COMPARE_DEFAULT_POSITION,
	onPositionChange,
	onPositionChangeEnd,
	orientation = COMPARE_DEFAULT_ORIENTATION,
	grab = COMPARE_DEFAULT_GRAB,
	snapPoints,
	snapThreshold = COMPARE_SNAP_THRESHOLD,
	step = COMPARE_STEP,
	minPosition = 0,
	maxPosition = 1,
	color = COMPARE_DEFAULT_COLOR,
	size = COMPARE_DEFAULT_SIZE,
	isDisabled: isDisabledProp,
	haptic = "selection",
	accessibilityLabel: accessibilityLabelProp,
	className,
	children,
	onLayout,
	...props
}: CompareProps): ReactElement {
	const field = useFieldContext();
	const isDisabled = isDisabledProp ?? field?.isDisabled ?? false;
	const accessibilityLabel = accessibilityLabelProp ?? field?.label ?? undefined;
	const isCalm = useCalmMotion();
	const isRtl = I18nManager.isRTL;
	const isVertical = orientation === "vertical";
	const points = snapPoints ?? EMPTY_POINTS;

	const [current, setCurrent] = useControllableState<ComparePosition>({
		defaultValue: clampPosition(defaultPosition, minPosition, maxPosition),
		onChange: onPositionChange,
		value: positionProp,
	});

	const position = useSharedValue(current);
	const frameSize = useSharedValue(0);
	const grabbed = useSharedValue(0);
	// UI-thread flags for one drag: whether it is live, and where on the handle the
	// finger took hold, so grabbing the capsule off-centre does not jump the seam.
	const tracking = useSharedValue(0);
	const grabOffset = useSharedValue(0);

	const isDragging = useRef(false);
	// Where the seam was last sent on the UI thread. The sync below compares
	// against it, so a value the drag itself produced is not animated to twice.
	const lastWritten = useRef(current);
	const currentRef = useRef(current);
	currentRef.current = current;
	// Bumped on every release. A controlled parent that rejects the value leaves
	// `current` unchanged, and without a token that moves the sync would never
	// re-run to spring the seam back — Slider's `settledDrags`.
	const [settledDrags, setSettledDrags] = useState(0);

	// biome-ignore lint/correctness/useExhaustiveDependencies: `settledDrags` is the re-run trigger, see above
	useEffect(() => {
		if (isDragging.current) return;
		const target = clampPosition(current, minPosition, maxPosition);
		if (target === lastWritten.current && position.value === target) return;
		lastWritten.current = target;
		position.value = isCalm ? target : withSpring(target, COMPARE_HANDLE_SPRING);
	}, [current, isCalm, maxPosition, minPosition, position, settledDrags]);

	const [labels, setLabels] = useState<{ before?: string; after?: string }>({});
	const registerLabel = useCallback((side: CompareSide, text: string | null) => {
		setLabels((previous) => {
			if ((previous[side] ?? null) === text) return previous;
			const next = { ...previous };
			if (text === null) delete next[side];
			else next[side] = text;
			return next;
		});
	}, []);

	const setDragging = useCallback((dragging: boolean) => {
		isDragging.current = dragging;
	}, []);

	const commitLive = useCallback(
		(next: number) => {
			if (next === currentRef.current) return;
			setCurrent(next);
		},
		[setCurrent]
	);

	const commitEnd = useCallback(
		(next: number) => {
			lastWritten.current = next;
			if (next !== currentRef.current) setCurrent(next);
			setSettledDrags((count) => count + 1);
			onPositionChangeEnd?.(next);
		},
		[onPositionChangeEnd, setCurrent]
	);

	const stepBy = useCallback(
		(direction: 1 | -1) => {
			const from = currentRef.current;
			const stepped = stepPosition(from, direction, step, { min: minPosition, max: maxPosition });
			const next = clampPosition(snapPosition(stepped, points, snapThreshold), minPosition, maxPosition);
			if (next === from) return;
			lastWritten.current = next;
			position.value = isCalm ? next : withSpring(next, COMPARE_HANDLE_SPRING);
			setCurrent(next);
			onPositionChangeEnd?.(next);
		},
		[isCalm, maxPosition, minPosition, onPositionChangeEnd, points, position, setCurrent, snapThreshold, step]
	);

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			const { width, height } = event.nativeEvent.layout;
			frameSize.value = isVertical ? height : width;
			onLayout?.(event);
		},
		[frameSize, isVertical, onLayout]
	);

	const gesture = useMemo(() => {
		// Declared beside their callers rather than at module scope: a worklet bound
		// at import time is how a helper ends up `undefined` on the UI thread.
		const seamAlong = () => {
			"worklet";
			return resolveRevealTransforms(position.value, frameSize.value, orientation, isRtl).handleOffset;
		};

		const tick = (previous: number, next: number) => {
			"worklet";
			if (haptic !== false && shouldTickCompareHaptic(previous, next, points, minPosition, maxPosition)) {
				playHaptic(haptic);
			}
		};

		const moveTo = (along: number) => {
			"worklet";
			const raw = resolvePositionFromGesture({ along, size: frameSize.value, orientation, isRtl });
			const next = clampPosition(raw, minPosition, maxPosition);
			const previous = position.value;
			if (next === previous) return;
			position.value = next;
			tick(previous, next);
		};

		const begin = (offset: number) => {
			"worklet";
			tracking.value = 1;
			grabOffset.value = offset;
			grabbed.value = 1;
			scheduleOnRN(setDragging, true);
			if (haptic !== false) playHaptic(haptic);
		};

		const release = (velocity: number) => {
			"worklet";
			if (tracking.value !== 1) return;
			tracking.value = 0;
			grabbed.value = 0;
			const from = position.value;
			const target = clampPosition(snapPosition(from, points, snapThreshold), minPosition, maxPosition);
			if (target !== from) {
				tick(from, target);
				const spring = {
					...COMPARE_HANDLE_SPRING,
					velocity: resolveReleaseVelocity(velocity, frameSize.value, orientation, isRtl),
				};
				position.value = isCalm ? target : withSpring(target, spring);
			}
			// Order matters: the root must stop treating this as a live drag before
			// `commitEnd` re-syncs. `scheduleOnRN` keeps them in queue order.
			scheduleOnRN(setDragging, false);
			scheduleOnRN(commitEnd, target);
		};

		const pan = Gesture.Pan()
			.enabled(!isDisabled)
			.shouldCancelWhenOutside(false)
			.onUpdate((event) => {
				"worklet";
				if (tracking.value !== 1) return;
				moveTo((isVertical ? event.y : event.x) - grabOffset.value);
			})
			.onFinalize((event) => {
				"worklet";
				release(isVertical ? event.velocityY : event.velocityX);
			});

		if (grab === "handle") {
			return pan
				.minDistance(0)
				.onTouchesDown((event, manager) => {
					"worklet";
					const touch = event.allTouches[0];
					if (!touch) return;
					const along = isVertical ? touch.y : touch.x;
					if (!isWithinGrabBand(along, seamAlong(), COMPARE_HANDLE_BAND)) manager.fail();
				})
				.onBegin((event) => {
					"worklet";
					const along = isVertical ? event.y : event.x;
					const seam = seamAlong();
					if (!isWithinGrabBand(along, seam, COMPARE_HANDLE_BAND)) return;
					begin(along - seam);
				});
		}

		const axis: [number, number] = [-COMPARE_ANYWHERE_ACTIVE_OFFSET, COMPARE_ANYWHERE_ACTIVE_OFFSET];
		const cross: [number, number] = [-COMPARE_ANYWHERE_FAIL_OFFSET, COMPARE_ANYWHERE_FAIL_OFFSET];
		const drag = (
			isVertical ? pan.activeOffsetY(axis).failOffsetX(cross) : pan.activeOffsetX(axis).failOffsetY(cross)
		).onStart((event) => {
			"worklet";
			const along = isVertical ? event.y : event.x;
			begin(0);
			moveTo(along);
		});

		// A tap jumps the seam to the finger. It is its own recogniser rather than a
		// write in the pan's `onBegin`, which would also fire at the start of a
		// vertical flick the scroll view goes on to win.
		const tap = Gesture.Tap()
			.enabled(!isDisabled)
			.onEnd((event, success) => {
				"worklet";
				if (!success) return;
				begin(0);
				moveTo(isVertical ? event.y : event.x);
				release(0);
			});

		return Gesture.Race(drag, tap);
	}, [
		commitEnd,
		frameSize,
		grab,
		grabOffset,
		grabbed,
		haptic,
		isCalm,
		isDisabled,
		isVertical,
		maxPosition,
		minPosition,
		orientation,
		points,
		position,
		setDragging,
		snapThreshold,
		tracking,
	]);

	// The one hop back to React during a drag, at percent resolution, so a
	// full-frame drag is a hundred commits at most rather than one per frame. Off
	// outside a drag: a release spring is drawn, not reported.
	useAnimatedReaction(
		() => (tracking.value === 1 ? quantizePosition(position.value) : -1),
		(next, previous) => {
			if (next < 0 || next === previous) return;
			scheduleOnRN(commitLive, next);
		},
		[commitLive]
	);

	useUnnamedWarning(accessibilityLabel);

	const context = useMemo<CompareContextValue>(
		() => ({
			accessibilityLabel,
			color,
			current,
			frameSize,
			grabbed,
			haptic,
			isCalm,
			isDisabled,
			isRtl,
			labels,
			maxPosition,
			minPosition,
			orientation,
			position,
			registerLabel,
			size,
			step,
			stepBy,
		}),
		[
			accessibilityLabel,
			color,
			current,
			frameSize,
			grabbed,
			haptic,
			isCalm,
			isDisabled,
			labels,
			maxPosition,
			minPosition,
			orientation,
			position,
			registerLabel,
			size,
			step,
			stepBy,
		]
	);

	return (
		<CompareProvider value={context}>
			<GestureDetector gesture={gesture}>
				<View className={compareVariants().root({ className })} onLayout={handleLayout} {...props}>
					{children}
				</View>
			</GestureDetector>
		</CompareProvider>
	);
}

const EMPTY_POINTS: readonly ComparePosition[] = [];

/**
 * Warns in development when the handle would be an unnamed adjustable.
 *
 * Deferred a tick: a `Field.Label` registers its text in an effect, so on the
 * first commit an enclosing field has not named the control yet.
 */
function useUnnamedWarning(name: string | undefined): void {
	useEffect(() => {
		if (process.env.NODE_ENV === "production" || name) return;
		const timer = setTimeout(() => {
			console.warn(
				"Compare: the handle is an unnamed adjustable. Pass `accessibilityLabel`, or wrap it in a `Field` with a `Field.Label`."
			);
		}, 0);
		return () => clearTimeout(timer);
	}, [name]);
}

/**
 * Two layers of one frame with a seam the finger drags across — before and
 * after, a screen in two themes, a redesign against the original.
 *
 * **Revealed, never squashed.** Both layers are laid out once at the full frame
 * size and only a mask moves, so the halves stay in register at every position.
 * Content is arbitrary — an image, a `Card`, a map — there is no image primitive
 * here and the comparison does not need one.
 *
 * **The seam is a drag target, not the whole frame.** By default only the
 * handle's 44pt band claims a touch, so a comparison in a feed still scrolls.
 * `grab="anywhere"` lets a drag start anywhere, with axis-aware activation so a
 * vertical flick still goes to the scroll view, and a tap jumps the seam.
 *
 * **Slider semantics.** The handle is the `adjustable`: it reads the Before
 * layer's share, steps by `step` from an assistive swipe, snaps to `snapPoints`
 * on release and ticks a haptic as it lands. `onPositionChange` follows the drag;
 * `onPositionChangeEnd` fires once, after the snap.
 *
 * **The frame has no size of its own.** Give `className` an `aspect-*` or an
 * `h-*` — and a `vertical` comparison a definite height.
 *
 * @example
 * <Compare accessibilityLabel="Retouch" className="aspect-[4/3]">
 *   <Compare.Before><Image accessibilityLabel="Original" className="size-full" source={original} /></Compare.Before>
 *   <Compare.After><Image accessibilityLabel="Retouched" className="size-full" source={edited} /></Compare.After>
 *   <Compare.Label side="before">Original</Compare.Label>
 *   <Compare.Label side="after">Retouched</Compare.Label>
 *   <Compare.Handle />
 * </Compare>
 */
export const Compare = Object.assign(CompareRoot, {
	/** The front layer, on the leading side, revealed by a sliding mask. */
	Before: CompareBefore,
	/** The back layer: the full frame, never moved. */
	After: CompareAfter,
	/** The divider, the grip and the whole accessibility surface. */
	Handle: CompareHandle,
	/** A caption pinned to one side, fading as that side is covered. */
	Label: CompareLabel,
	displayName: "DelacourUI.Compare",
});
