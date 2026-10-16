import type { ReactElement } from "react";
import { View, type ViewProps } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import { IconDotGrid2x3 } from "../../icons/central";
import { Icon } from "../icon";
import { useSortableItemPart, useSortablePart } from "./sortable.context";
import { SORTABLE_HANDLE_ICON_TOKEN, sortableVariants } from "./sortable.variants";
import { useSortableDragGesture } from "./use-sortable-drag-gesture";

export type SortableHandleProps = ViewProps & {
	/** What a screen reader calls the handle. Default "Drag to reorder". */
	accessibilityLabel?: string;
	className?: string;
};

/**
 * The grip a row is dragged by: a 44pt touch target around a six-dot glyph. Children replace the
 * glyph.
 *
 * **Not a `Pressable`.** It is a pan surface, the way `Slider.Track` is — a tap recogniser inside
 * would race the pan for the same touch, and a press has no meaning here. It still reads as a
 * button to a screen reader, because that is where its actions live: Move up and Move down, with
 * the row's position as its value, since a drag is invisible to assistive technology.
 *
 * In `long-press` mode the row owns the gesture and the actions, so the handle is only a visual
 * hint and is hidden from assistive technology rather than announced twice.
 */
export function SortableHandle({
	accessibilityLabel = "Drag to reorder",
	className,
	children,
	...props
}: SortableHandleProps): ReactElement {
	const root = useSortablePart("Sortable.Handle");
	const item = useSortableItemPart("Sortable.Handle");
	const isHandleMode = root.activation === "handle";

	const gesture = useSortableDragGesture({
		drag: root.drag,
		id: item.id,
		isEnabled: isHandleMode && item.canDrag,
		longPressDelay: root.longPressDelay,
		mode: "handle",
	});

	const slots = sortableVariants({ isDisabled: item.isDisabled });

	if (!isHandleMode) {
		return (
			<View
				accessibilityElementsHidden
				className={slots.handle({ className })}
				importantForAccessibility="no-hide-descendants"
				{...props}
			>
				{children ?? <Icon className={slots.handleIcon()} color={SORTABLE_HANDLE_ICON_TOKEN} icon={IconDotGrid2x3} />}
			</View>
		);
	}

	return (
		<GestureDetector gesture={gesture}>
			<View
				accessibilityActions={item.accessibilityActions}
				accessibilityLabel={accessibilityLabel}
				accessibilityRole="button"
				accessibilityState={{ disabled: !item.canDrag }}
				accessibilityValue={{ text: item.positionText }}
				accessible
				className={slots.handle({ className })}
				onAccessibilityAction={item.onAccessibilityAction}
				{...props}
			>
				{children ?? <Icon className={slots.handleIcon()} color={SORTABLE_HANDLE_ICON_TOKEN} icon={IconDotGrid2x3} />}
			</View>
		</GestureDetector>
	);
}
SortableHandle.displayName = "DelacourUI.Sortable.Handle";
