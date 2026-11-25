import { BottomSheet as Headless } from "@delacour/react-native-bottom-sheet";
import type { ReactElement } from "react";
import { useMinimumHitSlop, useThemeLength } from "../../hooks/use-minimum-hit-target";
import { IconCrossSmall } from "../../icons/central";
import { Icon } from "../icon";
import { Pressable, type PressableProps } from "../pressable";
import { useBottomSheetLabels } from "./bottom-sheet.context";
import {
	BOTTOM_SHEET_CLOSE_SIZE,
	BOTTOM_SHEET_CLOSE_SIZE_VARIABLE,
	bottomSheetVariants,
} from "./bottom-sheet.variants";

export type BottomSheetCloseProps = Omit<PressableProps, "asChild" | "busy" | "children" | "disabled">;

/**
 * The sheet's dismiss control.
 *
 * The engine's `Close asChild` around this library's `Pressable`, so the press
 * is the library's — `fade` rather than a spring, because a scale on a glyph
 * this small reads as a jitter, the reason `Badge.CloseButton` presses the same
 * way — and the close is the engine's: the same path a swipe-down and a scrim
 * press take, so a caller has one `onOpenChange` to watch rather than three.
 *
 * Positioned out of the content's flow, in the top-right of the sheet, so it
 * does not push the title down or take a row of its own. `BottomSheet.Title`
 * reserves the clearance for it on every sheet — see `bottomSheetVariants`.
 * The slop follows the theme's `--spacing-icon-lg`, and is there because a bare glyph in a corner has no padded capsule to
 * bring it up to the 44pt minimum — the case `Checkbox` mints slop for.
 *
 * @example
 * <BottomSheet.Content>
 *   <BottomSheet.Close />
 *   <BottomSheet.Title>Filters</BottomSheet.Title>
 * </BottomSheet.Content>
 */
export function BottomSheetClose({
	accessibilityLabel,
	className,
	feedback = "fade",
	hitSlop,
	onPress,
	...props
}: BottomSheetCloseProps): ReactElement {
	const labels = useBottomSheetLabels();
	const slop = useMinimumHitSlop(useThemeLength(BOTTOM_SHEET_CLOSE_SIZE_VARIABLE, BOTTOM_SHEET_CLOSE_SIZE));
	return (
		<Headless.Close accessibilityLabel={accessibilityLabel ?? labels.close} asChild onPress={onPress}>
			<Pressable
				accessibilityRole="button"
				className={bottomSheetVariants().close({ className })}
				feedback={feedback}
				hitSlop={hitSlop ?? slop}
				{...props}
			>
				<Icon color="muted-foreground" icon={IconCrossSmall} />
			</Pressable>
		</Headless.Close>
	);
}
BottomSheetClose.displayName = "DelacourUI.BottomSheet.Close";
