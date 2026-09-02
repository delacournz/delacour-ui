import { type PaletteName, palettesForBaseColor } from "@delacour/design-system/config";
import type { ResolvedMode } from "@delacour/design-system/resolve";
import { useMemo } from "react";
import { useAxisPreview } from "@/components/theme/use-axis-preview";

export type PaletteOption = {
	name: PaletteName;
	title: string;
	/** The whole system as this palette would resolve it, for the row's swatch. */
	values: ResolvedMode;
};

/**
 * The palettes on offer, each already resolved against the current base colour.
 *
 * The computation `Theme` and `Chart Color` share — they range over the same
 * list and resolve it the same way, and differ only in which config key they
 * write and which tokens their swatch draws. Sharing the resolution rather than
 * the component is what keeps neither sheet carrying a branch on the other's
 * axis, which is what the single `theme || chartColor` pane had to do.
 *
 * Memoised on `[config, mode, axis]`: eighteen palettes is eighteen full
 * resolutions, and two of these hooks are mounted whenever `/theme` is.
 */
export function usePaletteOptions(axis: "theme" | "chartColor"): readonly PaletteOption[] {
	const { config, preview } = useAxisPreview();

	return useMemo(
		() =>
			palettesForBaseColor(config.baseColor).map((palette) => ({
				name: palette.name,
				title: palette.title,
				values: preview({ [axis]: palette.name }),
			})),
		// `preview` already closes over the config and the mode, and changes
		// identity with either — naming them again here would be a dependency
		// Biome correctly calls unnecessary.
		[axis, config.baseColor, preview]
	);
}
