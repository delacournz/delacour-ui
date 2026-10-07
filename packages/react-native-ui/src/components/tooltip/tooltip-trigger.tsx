import { isValidElement, type ReactElement } from "react";
import type { GestureResponderEvent } from "react-native";
import { Slot } from "../../lib/slot";
import { Pressable, type PressableProps } from "../pressable";
import { useTooltipContext } from "./tooltip.context";
import { resolveTooltipAccessibility } from "./tooltip.variants";

export type TooltipTriggerProps = PressableProps;

/** The `accessibilityLabel` an `asChild` trigger's child already carries, if any. */
function childLabel(children: PressableProps["children"]): string | undefined {
	if (!isValidElement<{ accessibilityLabel?: unknown }>(children)) return undefined;
	const label = children.props.accessibilityLabel;
	return typeof label === "string" ? label : undefined;
}

/**
 * The control the tooltip names, and the view the panel is anchored to.
 *
 * On its own it is this library's `Pressable`. **`asChild` donates the
 * gesture** rather than wrapping the child, for `Popover.Trigger`'s reason —
 * a `Button` inside a pressable trigger would win the touch. With the default
 * `openOn="longPress"` the trigger hands the child an `onLongPress`; with
 * `"press"`, an `onPress`. Either is chained ahead of the child's own, so the
 * child's handler still runs, and a long press never costs the child its tap:
 * a tap held past the long-press delay fails, so `onPress` does not fire for
 * it. The measuring ref is composed onto the child's own, so the child has to
 * be built on `Pressable`.
 *
 * The tooltip's `label` becomes the trigger's accessibility label when it has
 * none, or its hint when it does.
 *
 * @example
 * <Tooltip.Trigger asChild>
 *   <Button size="icon-md" variant="ghost"><Icon icon={IconShare} /></Button>
 * </Tooltip.Trigger>
 */
export function TooltipTrigger({
	asChild = false,
	accessibilityLabel,
	children,
	onPress,
	onLongPress,
	onTouchStart,
	...props
}: TooltipTriggerProps): ReactElement {
	const { openOn, label, activate, onTriggerTouchStart, triggerRef } = useTooltipContext();

	const accessibility = resolveTooltipAccessibility({
		label,
		triggerLabel: accessibilityLabel ?? (asChild ? childLabel(children) : undefined),
	});

	const handlers = {
		onTouchStart: (event: GestureResponderEvent) => {
			onTriggerTouchStart();
			onTouchStart?.(event);
		},
		onPress:
			openOn === "press"
				? () => {
						activate("press");
						onPress?.();
					}
				: onPress,
		onLongPress:
			openOn === "longPress"
				? () => {
						activate("longPress");
						onLongPress?.();
					}
				: onLongPress,
	};

	if (asChild) {
		return (
			<Slot {...props} accessibilityLabel={accessibilityLabel} {...accessibility} {...handlers} ref={triggerRef}>
				{children}
			</Slot>
		);
	}

	return (
		<Pressable {...props} accessibilityLabel={accessibilityLabel} {...accessibility} {...handlers} ref={triggerRef}>
			{children}
		</Pressable>
	);
}
TooltipTrigger.displayName = "DelacourUI.Tooltip.Trigger";
