import type { BaseColorName } from "./base-colors";
import { BASE_COLORS } from "./base-colors";
import type { RadiusName } from "./radii";
import type { StyleName } from "./styles";
import { ACCENT_THEMES, type ThemeName } from "./themes";

/** The Theme and Chart Color axes both range over the accents plus the base colour. */
export type PaletteName = ThemeName | BaseColorName;

export type DesignSystemConfig = {
	style: StyleName;
	baseColor: BaseColorName;
	theme: PaletteName;
	chartColor: PaletteName;
	/** A font id from `fonts.ts`. */
	font: string;
	/** A font id, or `inherit` to follow the body font. */
	fontHeading: string;
	radius: RadiusName;
};

/**
 * What the app looks like before anyone touches a control.
 *
 * Vega is the library's own geometry and neutral is its own palette, so the
 * default config resolves to exactly what `native-ui` ships. That is what makes
 * "reset" meaningful and what lets `/preview` pin a known look for the capture
 * pipeline.
 */
export const DEFAULT_CONFIG: DesignSystemConfig = {
	style: "vega",
	baseColor: "neutral",
	theme: "neutral",
	chartColor: "neutral",
	font: "geist",
	fontHeading: "inherit",
	radius: "default",
};

/**
 * The palette options offered for a given base colour.
 *
 * shadcn hides the other six base colours from the Theme list, because a base
 * colour used as an accent would repaint the whole page from a control that is
 * supposed to move only the primary. The selected base stays, as the way to say
 * "no accent".
 */
export function palettesForBaseColor(baseColor: BaseColorName): readonly { name: PaletteName; title: string }[] {
	const base = BASE_COLORS.find((candidate) => candidate.name === baseColor);
	const self = base ? [{ name: base.name as PaletteName, title: base.title }] : [];

	return [...self, ...ACCENT_THEMES.map((theme) => ({ name: theme.name as PaletteName, title: theme.title }))];
}

/**
 * A stored config, made safe to apply.
 *
 * Persisted state outlives the build that wrote it: a renamed style or a
 * dropped font would otherwise be read back and spread over the palette as
 * `undefined`. Every axis falls back to its default independently, so one stale
 * value cannot cost the user the rest of their configuration.
 */
export function normalizeConfig(stored: Partial<DesignSystemConfig> | null): DesignSystemConfig {
	const config = { ...DEFAULT_CONFIG, ...(stored ?? {}) };
	const palettes = palettesForBaseColor(config.baseColor).map((palette) => palette.name);

	return {
		...config,
		theme: palettes.includes(config.theme) ? config.theme : config.baseColor,
		chartColor: palettes.includes(config.chartColor) ? config.chartColor : config.baseColor,
	};
}
