import { useEffect, useMemo } from "react";
import { useSharedValue } from "react-native-reanimated";
import {
	type AnimationSource,
	CLOSED_INDEX,
	GESTURE_SOURCE,
	SCROLLABLE_TYPE,
	type ScrollableType,
	type SheetIntent,
	type SnapPointSpec,
	UNMEASURED,
} from "../core";
import { ANIM_STATUS, type AnimStatus, type SheetSharedState, type SheetWorkletConfig } from "./state.types";

/**
 * Allocates the raw shared values, once per sheet, and keeps `snapPointSpec` and
 * `config` in step with the props.
 *
 * `snapPointSpec` is written when its **serialisation** changes, not its identity,
 * so a `snapPoints={["40%", "85%"]}` literal in a render body costs nothing —
 * the array identity churn that made the library this replaces re-derive on
 * every render is simply not observed.
 */
export function useSheetState(snapPoints: readonly SnapPointSpec[], config: SheetWorkletConfig): SheetSharedState {
	const containerHeight = useSharedValue(UNMEASURED);
	const containerWidth = useSharedValue(UNMEASURED);
	const containerBottomOffset = useSharedValue(0);
	const handleHeight = useSharedValue(UNMEASURED);
	const contentHeight = useSharedValue(UNMEASURED);
	const footerContentHeight = useSharedValue(UNMEASURED);
	const base = useSharedValue(0);
	const currentIndex = useSharedValue(CLOSED_INDEX);
	const animStatus = useSharedValue<AnimStatus>(ANIM_STATUS.IDLE);
	const animSource = useSharedValue<AnimationSource>("mount");
	const animTarget = useSharedValue(0);
	const gestureSource = useSharedValue<(typeof GESTURE_SOURCE)[keyof typeof GESTURE_SOURCE]>(GESTURE_SOURCE.NONE);
	const scrollOffsetY = useSharedValue(0);
	const scrollLockedAt = useSharedValue(0);
	const scrollableType = useSharedValue<ScrollableType>(SCROLLABLE_TYPE.NONE);
	const keyboardOwned = useSharedValue(false);
	const keyboardProgress = useSharedValue(0);
	const keyboardHeight = useSharedValue(0);
	const intent = useSharedValue<SheetIntent | null>(null);
	const mountPending = useSharedValue(true);
	const snapPointSpec = useSharedValue<readonly SnapPointSpec[]>(snapPoints);
	const configValue = useSharedValue<SheetWorkletConfig>(config);

	const specKey = snapPoints.join("|");
	// biome-ignore lint/correctness/useExhaustiveDependencies: keyed on the serialisation on purpose; the array is only read when it changes
	useEffect(() => {
		snapPointSpec.value = snapPoints;
	}, [specKey, snapPointSpec]);

	const {
		dynamicSizing,
		maxDynamicContentSize,
		hasFooter,
		bottomInset,
		detached,
		enablePanDownToClose,
		enableOverDrag,
		overDragResistanceFactor,
		initialIndex,
		animateOnMount,
		keyboardBehavior,
		keyboardBlurBehavior,
		keyboardScope,
		enableBlurKeyboardOnGesture,
	} = config;
	const detachedKey = detached === null ? "" : `${detached.horizontalMargin}/${detached.bottomOffset}`;
	// biome-ignore lint/correctness/useExhaustiveDependencies: `detached` is keyed by its two numbers, not its identity
	useEffect(() => {
		configValue.value = {
			dynamicSizing,
			maxDynamicContentSize,
			hasFooter,
			bottomInset,
			detached,
			enablePanDownToClose,
			enableOverDrag,
			overDragResistanceFactor,
			initialIndex,
			animateOnMount,
			keyboardBehavior,
			keyboardBlurBehavior,
			keyboardScope,
			enableBlurKeyboardOnGesture,
		};
	}, [
		configValue,
		dynamicSizing,
		maxDynamicContentSize,
		hasFooter,
		bottomInset,
		detachedKey,
		enablePanDownToClose,
		enableOverDrag,
		overDragResistanceFactor,
		initialIndex,
		animateOnMount,
		keyboardBehavior,
		keyboardBlurBehavior,
		keyboardScope,
		enableBlurKeyboardOnGesture,
	]);

	return useMemo<SheetSharedState>(
		() => ({
			containerHeight,
			containerWidth,
			containerBottomOffset,
			handleHeight,
			contentHeight,
			footerContentHeight,
			base,
			currentIndex,
			animStatus,
			animSource,
			animTarget,
			gestureSource,
			scrollOffsetY,
			scrollLockedAt,
			scrollableType,
			keyboardOwned,
			keyboardProgress,
			keyboardHeight,
			intent,
			mountPending,
			snapPointSpec,
			config: configValue,
		}),
		[
			containerHeight,
			containerWidth,
			containerBottomOffset,
			handleHeight,
			contentHeight,
			footerContentHeight,
			base,
			currentIndex,
			animStatus,
			animSource,
			animTarget,
			gestureSource,
			scrollOffsetY,
			scrollLockedAt,
			scrollableType,
			keyboardOwned,
			keyboardProgress,
			keyboardHeight,
			intent,
			mountPending,
			snapPointSpec,
			configValue,
		]
	);
}
