import { type ReactElement, useCallback, useMemo, useState } from "react";
import type { AccessibilityActionEvent, AccessibilityActionInfo, LayoutChangeEvent, ViewProps } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, {
	useAnimatedReaction,
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { cn } from "../../lib/cn";
import { type SortableItemContextValue, SortableItemProvider, useSortablePart } from "./sortable.context";
import {
	resolveMoveAction,
	resolveSortablePosition,
	SORTABLE_LIFT_SCALE,
	SORTABLE_SHIFT_SPRING,
	sortableVariants,
} from "./sortable.variants";
import { useSortableDragGesture } from "./use-sortable-drag-gesture";

export type SortableItemProps = ViewProps & {
	/** The row's id — one of the list's `value`. */
	id: string;
	/** The row cannot be lifted. The others still move past it. */
	isDisabled?: boolean;
	/** The row never moves, by drag or by action, and the others reorder around it. */
	isPinned?: boolean;
	/** Classes added while the row is lifted, after the built-in raised surface. */
	activeClassName?: string;
	className?: string;
};

const MOVE_UP: AccessibilityActionInfo = { label: "Move up", name: "moveUp" };
const MOVE_DOWN: AccessibilityActionInfo = { label: "Move down", name: "moveDown" };

/**
 * One row of a `Sortable` — the box that is measured, lifted and moved.
 *
 * **Its position is a transform, never a re-render.** While another row is dragged this one springs
 * to the shift the root publishes for it; while it is the dragged row it follows the finger. Both
 * are read in one animated style, so a drag renders nothing. The one render a drag costs is this
 * row's own, at lift and at landing, to add `itemActive` and `activeClassName` — the raised, opaque
 * surface that keeps the rows it passes from showing through.
 *
 * **A shift snaps when the list is resting.** The root zeroes every shift in the commit that renders
 * the new order; springing back from there would replay the move in reverse. Reduce motion snaps
 * every shift.
 *
 * In `long-press` mode the row carries the gesture and is the accessibility element — it merges its
 * content into one stop, like a `Pressable`, and publishes Move up / Move down. In `handle` mode the
 * handle does both and the row is a plain box.
 */
export function SortableItem({
	id,
	isDisabled: isItemDisabled = false,
	isPinned = false,
	activeClassName,
	className,
	onLayout,
	style,
	children,
	...props
}: SortableItemProps): ReactElement {
	const root = useSortablePart("Sortable.Item");
	const { activeId, dragY, lift, shifts, phase, isReducedMotion, setHeight, move, order, pinned } = root;
	const index = order.indexOf(id);
	const count = order.length;
	const isDisabled = root.isDisabled || isItemDisabled;
	const canDrag = !isDisabled && !isPinned;
	const isLongPress = root.activation === "long-press";

	const isActive = useDerivedValue(() => activeId.value === id);
	const [isLifted, setLifted] = useState(false);
	useAnimatedReaction(
		() => activeId.value === id,
		(next, previous) => {
			if (previous !== null && next !== previous) scheduleOnRN(setLifted, next);
		},
		[id]
	);

	const shift = useSharedValue(0);
	useAnimatedReaction(
		() => shifts.value[id] ?? 0,
		(next, previous) => {
			if (next === previous) return;
			if (phase.value === 0 || isReducedMotion) shift.value = next;
			else shift.value = withSpring(next, SORTABLE_SHIFT_SPRING);
		},
		[id, isReducedMotion]
	);

	const animatedStyle = useAnimatedStyle(() => {
		const active = activeId.value === id;
		return {
			transform: [
				{ translateY: active ? dragY.value : shift.value },
				{ scale: active ? 1 + (SORTABLE_LIFT_SCALE - 1) * lift.value : 1 },
			],
			zIndex: active ? 1 : 0,
		};
	});

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			setHeight(id, event.nativeEvent.layout.height);
			onLayout?.(event);
		},
		[id, onLayout, setHeight]
	);

	const moveUp = useCallback(() => move(id, "up"), [id, move]);
	const moveDown = useCallback(() => move(id, "down"), [id, move]);

	const accessibilityActions = useMemo(() => {
		if (!canDrag) return [];
		const actions: AccessibilityActionInfo[] = [];
		if (resolveMoveAction(order, id, "up", pinned).kind === "move") actions.push(MOVE_UP);
		if (resolveMoveAction(order, id, "down", pinned).kind === "move") actions.push(MOVE_DOWN);
		return actions;
	}, [canDrag, id, order, pinned]);

	const onAccessibilityAction = useCallback(
		(event: AccessibilityActionEvent) => {
			if (event.nativeEvent.actionName === MOVE_UP.name) moveUp();
			else if (event.nativeEvent.actionName === MOVE_DOWN.name) moveDown();
		},
		[moveDown, moveUp]
	);

	const positionText = resolveSortablePosition(index, count);

	const context = useMemo<SortableItemContextValue>(
		() => ({
			accessibilityActions,
			canDrag,
			count,
			id,
			index,
			isActive,
			isDisabled,
			isPinned,
			moveDown,
			moveUp,
			onAccessibilityAction,
			positionText,
		}),
		[
			accessibilityActions,
			canDrag,
			count,
			id,
			index,
			isActive,
			isDisabled,
			isPinned,
			moveDown,
			moveUp,
			onAccessibilityAction,
			positionText,
		]
	);

	const gesture = useSortableDragGesture({
		drag: root.drag,
		id,
		isEnabled: isLongPress && canDrag,
		longPressDelay: root.longPressDelay,
		mode: "long-press",
	});

	const slots = sortableVariants();
	const rowClassName = cn(slots.item(), isLifted && slots.itemActive(), className, isLifted && activeClassName);

	const row = (
		<Animated.View
			accessibilityActions={isLongPress ? accessibilityActions : undefined}
			accessibilityValue={isLongPress ? { text: positionText } : undefined}
			accessible={isLongPress ? true : undefined}
			className={rowClassName}
			onAccessibilityAction={isLongPress ? onAccessibilityAction : undefined}
			onLayout={handleLayout}
			style={[animatedStyle, style]}
			{...props}
		>
			{children}
		</Animated.View>
	);

	return (
		<SortableItemProvider value={context}>
			{isLongPress ? <GestureDetector gesture={gesture}>{row}</GestureDetector> : row}
		</SortableItemProvider>
	);
}
SortableItem.displayName = "DelacourUI.Sortable.Item";
