import { type ComponentRef, type ReactElement, useCallback, useEffect, useState } from "react";
import { type AccessibilityActionEvent, View } from "react-native";
import Animated, {
	type SharedValue,
	scrollTo,
	useAnimatedRef,
	useAnimatedScrollHandler,
	useAnimatedStyle,
	useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import type { InputSize } from "../input/input.variants";
import { playHaptic } from "../pressable";
import { Text } from "../text";
import {
	indexToOffset,
	offsetToIndex,
	resolveColumnAccessibilityValue,
	resolveWheelPadding,
	resolveWheelRowAppearance,
	TIME_WHEEL_COLUMN_LABELS,
	type TimeWheelColumnKind,
	type TimeWheelRow,
	timePickerVariants,
} from "./time-picker.variants";

/**
 * Below this release speed a drag is a placement, not a flick: no momentum
 * follows, so the drag's end is where the column settles.
 */
const STILL_RELEASE_VELOCITY = 0.05;

export type TimeWheelColumnProps = {
	kind: TimeWheelColumnKind;
	rows: readonly TimeWheelRow[];
	/** The row the column should rest on. A change scrolls to it. */
	selectedIndex: number;
	rowHeight: number;
	visibleRows: number;
	size: InputSize;
	isDisabled: boolean;
	/** The row a hand-scroll or an accessibility action came to rest on. */
	onSettle: (kind: TimeWheelColumnKind, index: number) => void;
};

/**
 * One snapping column of the wheel. Internal — `TimePickerWheel` lays them out.
 *
 * **A plain `Animated.ScrollView`, not a list.** The longest column is sixty
 * rows, which a scroll view draws without help, and a virtualised list would
 * recycle the rows whose per-frame appearance the scroll handler drives.
 *
 * **The UI thread owns the motion; React owns the value.** The scroll handler
 * writes the offset to a shared value every frame and each row derives its
 * opacity and scale from it; the selection tick fires there too, de-duplicated
 * by the centred index, so it lands in the frame a row crosses the line. React
 * hears about one thing only: the row the column came to rest on.
 *
 * **Resting is decided twice, and only a hand-scroll counts.** A flick rests on
 * momentum end; a drag released still has no momentum, so it rests on drag end.
 * A programmatic scroll — the column moving to a value set from outside, or back
 * off a dimmed row — also ends in a momentum event on iOS, and is ignored, which
 * is what keeps a controlled value from echoing back through `onValueChange`.
 *
 * **A dimmed row is bounced off by the parent, not here.** The column reports
 * the row it landed on; the wheel pulls the time inside the bounds and hands back
 * a `selectedIndex`, and the effect below scrolls to it whenever the column is
 * resting anywhere else — including when that index did not change.
 *
 * **To a screen reader the column is one adjustable element.** Its rows are
 * hidden; swiping up or down steps one row and settles exactly as a scroll does.
 */
export function TimeWheelColumn({
	kind,
	rows,
	selectedIndex,
	rowHeight,
	visibleRows,
	size,
	isDisabled,
	onSettle,
}: TimeWheelColumnProps): ReactElement {
	const isCalm = useCalmMotion();
	const scrollRef = useAnimatedRef<ComponentRef<typeof Animated.ScrollView>>();
	const scrollY = useSharedValue(indexToOffset(selectedIndex, rowHeight));
	const centredIndex = useSharedValue(selectedIndex);
	const isUserScroll = useSharedValue(false);
	const count = rows.length;
	const padding = resolveWheelPadding(rowHeight, visibleRows);

	// Bumped on every settle so the effect below re-checks the resting row even
	// when the parent hands back the same `selectedIndex` — which is exactly the
	// case of a column flung onto a dimmed row and pulled back to where it was.
	const [settleCount, setSettleCount] = useState(0);

	const settle = useCallback(
		(index: number) => {
			setSettleCount((current) => current + 1);
			onSettle(kind, index);
		},
		[kind, onSettle]
	);

	useEffect(() => {
		void settleCount;
		const target = indexToOffset(selectedIndex, rowHeight);
		if (Math.abs(scrollY.value - target) < 0.5) return;
		// On the UI thread, through the animated ref, the way `Tabs` scrolls —
		// the ref's JS-side type does not carry `scrollTo`.
		scheduleOnUI(() => {
			"worklet";
			scrollTo(scrollRef, 0, target, true);
		});
	}, [rowHeight, scrollRef, scrollY, selectedIndex, settleCount]);

	const scrollHandler = useAnimatedScrollHandler({
		onBeginDrag: () => {
			isUserScroll.value = true;
		},
		onScroll: (event) => {
			scrollY.value = event.contentOffset.y;
			const index = offsetToIndex(event.contentOffset.y, rowHeight, count);
			if (index === centredIndex.value) return;
			centredIndex.value = index;
			if (isUserScroll.value) playHaptic("selection");
		},
		onEndDrag: (event) => {
			const velocity = event.velocity?.y ?? 0;
			if (Math.abs(velocity) >= STILL_RELEASE_VELOCITY) return;
			isUserScroll.value = false;
			scheduleOnRN(settle, offsetToIndex(event.contentOffset.y, rowHeight, count));
		},
		onMomentumEnd: (event) => {
			if (!isUserScroll.value) return;
			isUserScroll.value = false;
			scheduleOnRN(settle, offsetToIndex(event.contentOffset.y, rowHeight, count));
		},
	});

	const handleAccessibilityAction = useCallback(
		(event: AccessibilityActionEvent) => {
			const step = event.nativeEvent.actionName === "increment" ? 1 : -1;
			const next = Math.min(Math.max(selectedIndex + step, 0), count - 1);
			if (next !== selectedIndex) settle(next);
		},
		[count, selectedIndex, settle]
	);

	const slots = timePickerVariants({ size });
	const current = rows[selectedIndex];

	return (
		<View
			accessibilityActions={isDisabled ? undefined : ACCESSIBILITY_ACTIONS}
			accessibilityLabel={TIME_WHEEL_COLUMN_LABELS[kind]}
			accessibilityRole="adjustable"
			accessibilityState={{ disabled: isDisabled }}
			accessibilityValue={{ text: current ? resolveColumnAccessibilityValue(kind, current.label) : "" }}
			accessible
			className={slots.column()}
			onAccessibilityAction={handleAccessibilityAction}
			style={{ height: rowHeight * visibleRows }}
		>
			<Animated.ScrollView
				accessibilityElementsHidden
				contentContainerStyle={{ paddingVertical: padding }}
				contentOffset={{ x: 0, y: indexToOffset(selectedIndex, rowHeight) }}
				decelerationRate="fast"
				importantForAccessibility="no-hide-descendants"
				nestedScrollEnabled
				onScroll={scrollHandler}
				ref={scrollRef}
				scrollEnabled={!isDisabled}
				scrollEventThrottle={16}
				showsVerticalScrollIndicator={false}
				snapToInterval={rowHeight}
			>
				{rows.map((row, index) => (
					<TimeWheelRowView
						index={index}
						isCalm={isCalm}
						isSelected={index === selectedIndex}
						key={row.key}
						row={row}
						rowHeight={rowHeight}
						scrollY={scrollY}
						size={size}
					/>
				))}
			</Animated.ScrollView>
		</View>
	);
}
TimeWheelColumn.displayName = "DelacourUI.TimePickerWheel.Column";

type TimeWheelRowViewProps = {
	row: TimeWheelRow;
	index: number;
	rowHeight: number;
	scrollY: SharedValue<number>;
	isCalm: boolean;
	isSelected: boolean;
	size: InputSize;
};

/**
 * One row. Its opacity and scale follow its distance from the centre line, on
 * the UI thread, so the wheel's depth costs no React render per frame.
 */
function TimeWheelRowView({
	row,
	index,
	rowHeight,
	scrollY,
	isCalm,
	isSelected,
	size,
}: TimeWheelRowViewProps): ReactElement {
	const animatedStyle = useAnimatedStyle(() => {
		const appearance = resolveWheelRowAppearance(scrollY.value / rowHeight - index, isCalm);
		return { opacity: appearance.opacity, transform: [{ scale: appearance.scale }] };
	});
	const slots = timePickerVariants({ size, isSelected, isRowDisabled: row.isDisabled });

	return (
		<Animated.View className={slots.row()} style={[{ height: rowHeight }, animatedStyle]}>
			<Text className={slots.rowText()} numberOfLines={1}>
				{row.label}
			</Text>
		</Animated.View>
	);
}
TimeWheelRowView.displayName = "DelacourUI.TimePickerWheel.Row";

/** Module scope, so the prop is the same array every render. */
const ACCESSIBILITY_ACTIONS = [{ name: "increment" }, { name: "decrement" }] as const;
