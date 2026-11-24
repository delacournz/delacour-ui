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
import { warnInteractiveChildInAccessible } from "../../lib/interactive-child";
import { type SortableItemContextValue, SortableItemProvider, useSortablePart } from "./sortable.context";
import {
	resolveSortableMoveActions,
	resolveSortablePosition,
	SORTABLE_LIFT_SCALE,
	SORTABLE_MOVE_DOWN_NAME,
	SORTABLE_MOVE_UP_NAME,
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
	/**
	 * What a screen reader calls this row. It names the handle "Reorder {label}" and the actions
	 * "Move {label} up" / "Move {label} down", so a list of rows is not a list of identical
	 * "Drag to reorder" buttons. Without it the generic strings stand.
	 */
	label?: string;
	className?: string;
};

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
 *
 * **A long-press row is one stop, so a control composed into it is unreachable.** Mirror it as an
 * entry in the row's own `accessibilityActions` and hide the drawn control from assistive
 * technology: a caller's `accessibilityActions` and `onAccessibilityAction` are merged with Move up
 * and Move down, and any other action name goes to the caller's handler. In development a press
 * handler or control role found inside an accessible row warns.
 */
export function SortableItem({
	id,
	isDisabled: isItemDisabled = false,
	isPinned = false,
	activeClassName,
	label,
	className,
	onLayout,
	style,
	children,
	accessible: accessibleProp,
	accessibilityActions: callerActions,
	onAccessibilityAction: callerOnAction,
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
		}
	);

	const shift = useSharedValue(0);
	useAnimatedReaction(
		() => shifts.value[id] ?? 0,
		(next, previous) => {
			if (next === previous) return;
			if (phase.value === 0 || isReducedMotion) shift.value = next;
			else shift.value = withSpring(next, SORTABLE_SHIFT_SPRING);
		}
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

	const accessibilityActions = useMemo<AccessibilityActionInfo[]>(
		() => (canDrag ? resolveSortableMoveActions({ id, label, order, pinned }) : []),
		[canDrag, id, label, order, pinned]
	);

	const onAccessibilityAction = useCallback(
		(event: AccessibilityActionEvent) => {
			if (!canDrag) return;
			if (event.nativeEvent.actionName === SORTABLE_MOVE_UP_NAME) moveUp();
			else if (event.nativeEvent.actionName === SORTABLE_MOVE_DOWN_NAME) moveDown();
		},
		[canDrag, moveDown, moveUp]
	);

	const rowActions = useMemo(
		() => (callerActions ? [...accessibilityActions, ...callerActions] : accessibilityActions),
		[accessibilityActions, callerActions]
	);

	const onRowAccessibilityAction = useCallback(
		(event: AccessibilityActionEvent) => {
			const name = event.nativeEvent.actionName;
			if (name === SORTABLE_MOVE_UP_NAME || name === SORTABLE_MOVE_DOWN_NAME) onAccessibilityAction(event);
			else callerOnAction?.(event);
		},
		[callerOnAction, onAccessibilityAction]
	);

	const isRowAccessible = accessibleProp ?? (isLongPress ? true : undefined);
	warnInteractiveChildInAccessible({ accessible: isRowAccessible, children, component: "Sortable.Item" });

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
			label,
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
			label,
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
			accessibilityActions={isLongPress ? rowActions : callerActions}
			accessibilityValue={isLongPress ? { text: positionText } : undefined}
			accessible={isRowAccessible}
			className={rowClassName}
			onAccessibilityAction={isLongPress ? onRowAccessibilityAction : callerOnAction}
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
