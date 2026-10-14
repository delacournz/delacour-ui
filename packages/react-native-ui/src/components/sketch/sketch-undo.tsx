import type { ReactElement, ReactNode } from "react";
import { IconArrowUndoUp } from "../../icons/central";
import { Button, type ButtonProps } from "../button";
import { Icon } from "../icon";
import { useSketchPart } from "./sketch.context";

export type SketchUndoProps = Omit<ButtonProps, "onPress" | "isDisabled" | "children"> & {
	/** Replaces the default glyph. */
	children?: ReactNode;
};

/**
 * Removes the last mark — an eraser stroke counts as one.
 *
 * Disabled when there is nothing to undo, which a screen reader announces, and
 * announces "Undone" when it works: a drawing gives no other spoken feedback.
 */
export function SketchUndo({
	children,
	size = "icon-md",
	variant = "ghost",
	accessibilityLabel = "Undo",
	...props
}: SketchUndoProps): ReactElement {
	const { items, handle, isDisabled, haptic } = useSketchPart("Sketch.Undo");

	return (
		<Button
			haptic={haptic}
			{...props}
			accessibilityLabel={accessibilityLabel}
			isDisabled={isDisabled || items.length === 0}
			onPress={handle.undo}
			size={size}
			variant={variant}
		>
			{children ?? <Icon icon={IconArrowUndoUp} />}
		</Button>
	);
}
SketchUndo.displayName = "DelacourUI.Sketch.Undo";
