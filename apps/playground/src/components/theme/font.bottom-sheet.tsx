import { FONTS } from "@delacour/design-system/fonts";
import type { ReactElement } from "react";
import { AxisSheet, type AxisSheetControlProps, useAxisChoice } from "@/components/theme/axis-sheet";
import { FontOptionList } from "@/components/theme/font-option-list";
import { useDesignSystem } from "@/design-system/store";

/** Every family, the three group labels, and the System row above them. */
const FONT_ROW_COUNT = FONTS.length + 4;

/**
 * The family behind `--font-sans`, which every text surface in the app reads.
 *
 * No Inherit row: the body font is what a heading inherits FROM, so there is
 * nothing above it to follow. Its way of naming no face is `system` — the
 * platform's own sans, and the default, because a fresh install has loaded no
 * other.
 */
export function FontBottomSheet({ isOpen, onOpenChange }: AxisSheetControlProps): ReactElement {
	const config = useDesignSystem();
	const choose = useAxisChoice("font", onOpenChange);

	return (
		<AxisSheet isOpen={isOpen} onOpenChange={onOpenChange} rowCount={FONT_ROW_COUNT} title="Font">
			<FontOptionList onSelect={choose} selected={config.font} withSystem />
		</AxisSheet>
	);
}
FontBottomSheet.displayName = "Playground.FontBottomSheet";
