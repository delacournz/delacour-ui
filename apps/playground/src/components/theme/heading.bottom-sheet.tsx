import { FONTS } from "@delacour/design-system/fonts";
import type { ReactElement } from "react";
import { AxisSheet, type AxisSheetControlProps, useAxisChoice } from "@/components/theme/axis-sheet";
import { FontOptionList } from "@/components/theme/font-option-list";
import { useDesignSystem } from "@/design-system/store";

/** Every family, the three group labels, and the Inherit row above them. */
const HEADING_ROW_COUNT = FONTS.length + 4;

/**
 * The family behind `--font-heading`, which only `Text.Display`, `.Title` and
 * `.Header` read.
 *
 * The one axis with a value that is not a family: `inherit` follows the body
 * font, and it is the default because a heading that silently stops tracking
 * the font axis is the more surprising of the two behaviours.
 */
export function HeadingBottomSheet({ isOpen, onOpenChange }: AxisSheetControlProps): ReactElement {
	const config = useDesignSystem();
	const choose = useAxisChoice("fontHeading", onOpenChange);

	return (
		<AxisSheet isOpen={isOpen} onOpenChange={onOpenChange} rowCount={HEADING_ROW_COUNT} title="Heading">
			<FontOptionList onSelect={choose} selected={config.fontHeading} withInherit />
		</AxisSheet>
	);
}
HeadingBottomSheet.displayName = "Playground.HeadingBottomSheet";
