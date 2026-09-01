import { FONTS } from "@delacour/design-system/fonts";
import type { ReactElement } from "react";
import { AxisSheet, type AxisSheetControlProps, useAxisChoice } from "@/components/theme/axis-sheet";
import { FontOptionList } from "@/components/theme/font-option-list";
import { useDesignSystem } from "@/design-system/store";

/** Every family, plus the three group labels standing between them. */
const FONT_ROW_COUNT = FONTS.length + 3;

/**
 * The family behind `--font-sans`, which every text surface in the app reads.
 *
 * No Inherit row: the body font is what a heading inherits FROM, so there is
 * nothing above it to follow.
 */
export function FontBottomSheet({ isOpen, onOpenChange }: AxisSheetControlProps): ReactElement {
	const config = useDesignSystem();
	const choose = useAxisChoice("font", onOpenChange);

	return (
		<AxisSheet isOpen={isOpen} onOpenChange={onOpenChange} rowCount={FONT_ROW_COUNT} title="Font">
			<FontOptionList onSelect={choose} selected={config.font} />
		</AxisSheet>
	);
}
FontBottomSheet.displayName = "Playground.FontBottomSheet";
