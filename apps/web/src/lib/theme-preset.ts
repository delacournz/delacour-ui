import { BASE_COLORS } from "@delacour/design-system/base-colors";
import { DEFAULT_CONFIG, type DesignSystemConfig, palettesForBaseColor } from "@delacour/design-system/config";
import { emitShadcnCss } from "@delacour/design-system/emit";
import { fontByName } from "@delacour/design-system/fonts";
import { decodePreset } from "@delacour/design-system/preset";
import { radiusByName } from "@delacour/design-system/radii";
import { type ResolvedMode, resolveFonts, resolveTokens } from "@delacour/design-system/resolve";
import { styleByName } from "@delacour/design-system/styles";

/**
 * A `?preset=` code, made safe to render.
 *
 * The reader arrives from their own phone, so the page's job is to show them
 * something useful whatever the code turns out to be — never a 404 and never an
 * error boundary. A dead link would tell them the feature is broken when what
 * actually happened is that a chat client ate the last character.
 *
 * That is why `config` is present in **every** branch. The status decides
 * whether a notice appears above the CSS; it never decides whether there is CSS.
 * One render path, and no page state that can be half-built.
 *
 * Pure and synchronous, so the route needs neither a loader nor a server
 * function — and so the whole failure matrix is reachable from `bun test` with
 * no renderer involved.
 */

export type ThemePreset =
	| { status: "default"; config: DesignSystemConfig }
	| { status: "resolved"; config: DesignSystemConfig; code: string }
	| { status: "invalid"; config: DesignSystemConfig; code: string };

export function resolvePreset(preset: string | undefined): ThemePreset {
	if (!preset) return { status: "default", config: DEFAULT_CONFIG };

	const config = decodePreset(preset);
	if (!config) return { status: "invalid", config: DEFAULT_CONFIG, code: preset };

	return { status: "resolved", config, code: preset };
}

/** The `globals.css` this configuration means. */
export function presetCss(config: DesignSystemConfig): string {
	return emitShadcnCss(resolveTokens(config), { fonts: resolveFonts(config) });
}

/** Both modes of the palette, for the specimens that have to follow the page's theme. */
export function presetSwatches(config: DesignSystemConfig): { light: ResolvedMode; dark: ResolvedMode } {
	return resolveTokens(config);
}

export type ThemeSummaryRow = {
	/** The axis, as the customizer labels it. */
	label: string;
	/** What it is set to, by the same title the strip shows. */
	value: string;
	/** Which specimen to draw beside it, where the axis has one to give. */
	specimen?: "radius" | "primary" | "charts" | "surface";
};

function paletteTitle(config: DesignSystemConfig, name: string): string {
	return palettesForBaseColor(config.baseColor).find((palette) => palette.name === name)?.title ?? name;
}

/**
 * The axes, named back to the reader.
 *
 * They chose these on a phone and are now looking at a wall of oklch on a
 * laptop, with no way to tell whether this is the theme they built. Every title
 * comes from the shared data rather than a table transcribed here, because a
 * second copy of the labels would drift from the strips on the device — and the
 * one place that matters is exactly here, where someone is comparing the two.
 */
export function themeSummary(config: DesignSystemConfig): readonly ThemeSummaryRow[] {
	const body = fontByName(config.font);
	const heading = config.fontHeading === "inherit" ? body : fontByName(config.fontHeading);

	return [
		{ label: "Style", value: styleByName(config.style)?.title ?? config.style },
		{ label: "Radius", value: radiusByName(config.radius)?.title ?? config.radius, specimen: "radius" },
		{
			label: "Base Color",
			value: BASE_COLORS.find((base) => base.name === config.baseColor)?.title ?? config.baseColor,
			specimen: "surface",
		},
		{ label: "Theme", value: paletteTitle(config, config.theme), specimen: "primary" },
		{ label: "Chart Color", value: paletteTitle(config, config.chartColor), specimen: "charts" },
		{
			label: "Heading",
			// "Inherit" alone leaves the reader wondering what it inherited.
			value:
				config.fontHeading === "inherit"
					? `Inherit (${heading?.title ?? config.font})`
					: (heading?.title ?? config.fontHeading),
		},
		{ label: "Font", value: body?.title ?? config.font },
	];
}

/** A name for the theme, for the browser tab and for a link unfurled into a chat. */
export function themeTitle(config: DesignSystemConfig): string {
	const style = styleByName(config.style)?.title ?? config.style;
	const base = BASE_COLORS.find((candidate) => candidate.name === config.baseColor)?.title ?? config.baseColor;
	const accent = paletteTitle(config, config.theme);

	return accent === base ? `${style} · ${base}` : `${style} · ${base} · ${accent}`;
}
