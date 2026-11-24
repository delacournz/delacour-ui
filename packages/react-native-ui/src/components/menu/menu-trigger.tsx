import { type ComponentRef, type ReactElement, useCallback, useMemo } from "react";
import type Animated from "react-native-reanimated";
import { useLabels } from "../../hooks/use-labels";
import { composeRefs } from "../../lib/compose-refs";
import { Slot } from "../../lib/slot";
import { Pressable, type PressableProps } from "../pressable";
import { type MenuMeasurable, useMenuPart } from "./menu.context";

export type MenuTriggerProps = PressableProps & { asChild?: boolean };

/**
 * The control that opens the menu, and closes it again.
 *
 * A press measures the trigger with `measureInWindow`, anchors the panel to
 * that rect and opens. Announced `expanded` while open, with the hint
 * "Opens a menu".
 *
 * **`asChild` donates the press rather than wrapping the child**, as
 * `BottomSheet.Trigger` does: two nested taps are not simultaneous, and Gesture
 * Handler gives the touch to the descendant — a `Button` wrapped in a pressable
 * trigger would win the tap and the menu would never open. The child receives
 * `onPress` (chained ahead of its own), the ref the trigger measures, and the
 * accessibility props, through `Slot`. So the child has to be something that
 * handles `onPress` — a `Button`, a `ListGroup.Item`, anything on `Pressable`.
 *
 * @example
 * <Menu.Trigger asChild>
 *   <Button variant="outline">Options</Button>
 * </Menu.Trigger>
 */
export function MenuTrigger({ asChild = false, children, onPress, ref, ...props }: MenuTriggerProps): ReactElement {
	const { isOpen, labels: labelsProp, toggle, triggerRef } = useMenuPart("Menu.Trigger");
	const labels = useLabels("menu", labelsProp);

	const handlePress = useCallback(() => {
		toggle();
		onPress?.();
	}, [onPress, toggle]);

	const setTrigger = useCallback(
		(node: ComponentRef<typeof Animated.View> | null) => {
			triggerRef.current = node as MenuMeasurable | null;
		},
		[triggerRef]
	);
	const composedRef = useMemo(() => composeRefs(ref, setTrigger), [ref, setTrigger]);

	const shared = {
		accessibilityHint: labels.triggerHint,
		accessibilityState: { expanded: isOpen },
		onPress: handlePress,
		ref: composedRef,
		...props,
	};

	return asChild ? <Slot {...shared}>{children}</Slot> : <Pressable {...shared}>{children}</Pressable>;
}
MenuTrigger.displayName = "DelacourUI.Menu.Trigger";
