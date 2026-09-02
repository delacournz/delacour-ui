import { type ChartFont, useSystemFont } from "@delacour/charts";
import { useCSSVariable } from "uniwind";

/**
 * The font Skia draws axis labels with.
 *
 * The family comes from `--font-sans`, which `theme.css` declares per platform
 * under `@variant ios` / `@variant android`. It is deliberately **not** aliased
 * through `@theme inline` — aliasing a font would redefine each name as itself
 * and every `font-*` utility would silently draw nothing — so the raw variable
 * is the only thing there to read, which is exactly what `useCSSVariable` takes.
 *
 * An unresolved family is not a failure. `matchFont` then picks the platform's
 * own default, which is what `--font-sans` names on both platforms anyway; the
 * variable only matters once an app overrides it.
 *
 * No font file ships with this package or with `@delacour/charts`. That is the
 * same choice `theme.css` already made for the rest of the type: OS-bundled
 * families mean nothing has to be loaded through `expo-font` and a consuming
 * app needs no config plugin.
 */
export function useChartFont(size: number): ChartFont {
	const family = useCSSVariable("--font-sans") as string | undefined;
	return useSystemFont(family, size);
}
