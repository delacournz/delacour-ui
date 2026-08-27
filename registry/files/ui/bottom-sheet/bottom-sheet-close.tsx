import { type ReactElement, useCallback } from "react";
import { IconCrossSmall } from "@registry/icons/central";
import { Icon } from "@registry/ui/icon";
import { Pressable, type PressableProps } from "@registry/ui/pressable";
import { useBottomSheetPart } from "./bottom-sheet.context";
import { BOTTOM_SHEET_CLOSE_HIT_SLOP, bottomSheetVariants } from "./bottom-sheet.variants";

export type BottomSheetCloseProps = Omit<PressableProps, "asChild" | "busy" | "children" | "disabled">;

/**
 * The sheet's dismiss control.
 *
 * Positioned out of the content's flow, in the top-right of the sheet, so it does
 * not push the title down or take a row of its own. `BottomSheet.Title` reserves
 * the clearance for it on every sheet — see `bottomSheetVariants`.
 *
 * Closing goes through the same `onOpenChange` a swipe-down and a backdrop press
 * do, so a caller has one callback to watch rather than three.
 *
 * `fade` rather than a spring: a scale on a glyph this small reads as a jitter,
 * the reason `Badge.CloseButton` presses the same way. The slop is there because
 * a bare glyph in a corner has no padded capsule to bring it up to the 44pt
 * minimum — the case `Checkbox` mints slop for.
 *
 * @example
 * <BottomSheet.Content>
 *   <BottomSheet.Close />
 *   <BottomSheet.Title>Filters</BottomSheet.Title>
 * </BottomSheet.Content>
 */
export function BottomSheetClose({
	accessibilityLabel = "Close",
	className,
	feedback = "fade",
	hitSlop = BOTTOM_SHEET_CLOSE_HIT_SLOP,
	onPress,
	...props
}: BottomSheetCloseProps): ReactElement {
	const { close } = useBottomSheetPart("BottomSheet.Close");

	const handlePress = useCallback(() => {
		close();
		onPress?.();
	}, [close, onPress]);

	return (
		<Pressable
			accessibilityLabel={accessibilityLabel}
			accessibilityRole="button"
			className={bottomSheetVariants().close({ className })}
			feedback={feedback}
			hitSlop={hitSlop}
			onPress={handlePress}
			{...props}
		>
			<Icon color="muted-foreground" icon={IconCrossSmall} />
		</Pressable>
	);
}
BottomSheetClose.displayName = "DelacourUI.BottomSheet.Close";
