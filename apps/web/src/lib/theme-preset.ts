import { BASE_COLORS } from "@delacour/design-system/base-colors";
import {
	DEFAULT_CONFIG,
	type DesignSystemConfig,
	palettesForBaseColor,
	withAxis,
} from "@delacour/design-system/config";
import { emitShadcnCss } from "@delacour/design-system/emit";
import { FONT_GROUPS, type FontType, fontByName } from "@delacour/design-system/fonts";
import { decodePreset, encodePreset } from "@delacour/design-system/preset";
import { RADII, radiusByName } from "@delacour/design-system/radii";
import { resolveFonts, resolveTokens } from "@delacour/design-system/resolve";
import { STYLES, styleByName } from "@delacour/design-system/styles";

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

/** The seven axes the builder offers, in the order it stacks them. */
export const AXIS_KEYS = ["style", "radius", "baseColor", "theme", "chartColor", "fontHeading", "font"] as const;

export type AxisKey = (typeof AXIS_KEYS)[number];

export type AxisOption = {
	/** The value this option would set on its axis. */
	value: string;
	title: string;
	/** The whole configuration as this option would leave it, for the specimen beside it. */
	config: DesignSystemConfig;
	/** That configuration as a code — this is the option link's `?preset=`. */
	code: string;
	isSelected: boolean;
};

/** The label the builder puts above each axis. */
export const AXIS_LABELS: Record<AxisKey, string> = {
	style: "Style",
	radius: "Radius",
	baseColor: "Base Color",
	theme: "Theme",
	chartColor: "Chart Color",
	fontHeading: "Heading",
	font: "Font",
};

/** Every value an axis ranges over, before any of it is encoded. */
function axisValues(config: DesignSystemConfig, axis: AxisKey): readonly { value: string; title: string }[] {
	if (axis === "style") return STYLES.map((style) => ({ value: style.name, title: style.title }));
	if (axis === "radius") return RADII.map((radius) => ({ value: radius.name, title: radius.title }));
	if (axis === "baseColor") return BASE_COLORS.map((base) => ({ value: base.name, title: base.title }));
	if (axis === "theme" || axis === "chartColor") {
		return palettesForBaseColor(config.baseColor).map((palette) => ({ value: palette.name, title: palette.title }));
	}

	const families = FONT_GROUPS.flatMap((group) => group.fonts).map((font) => ({
		value: font.name,
		title: font.title,
	}));

	return axis === "fontHeading" ? [{ value: "inherit", title: "Inherit" }, ...families] : families;
}

/**
 * One axis, as a row of destinations.
 *
 * The builder holds no state: an option is a link to this same page carrying the
 * configuration that option would produce, so the entire control surface is a
 * pure function of the code in the URL. That is what keeps the emit below it on
 * the server, the page usable with JavaScript off, and every intermediate state
 * shareable — see `apps/web/AGENTS.md`.
 *
 * `config` is the *resulting* configuration rather than the option's own values,
 * and both the specimen and the code come from it. A base colour's `primary` is
 * not what `primary` becomes once an accent is spread over it, and a tile that
 * previewed the option in isolation would promise a colour the click does not
 * deliver.
 *
 * It goes through `withAxis`, so choosing a Base Color re-homes Theme and Chart
 * Color in the same move. Without that, `stone` would survive in the URL as an
 * accent the Theme row no longer offers.
 */
export function axisOptions(config: DesignSystemConfig, axis: AxisKey): readonly AxisOption[] {
	return axisValues(config, axis).map(({ value, title }) => {
		const next = withAxis(config, axis, value as DesignSystemConfig[AxisKey]);

		return { value, title, config: next, code: encodePreset(next), isSelected: config[axis] === value };
	});
}

export type FontOptionGroup = { type: FontType; label: string; options: readonly AxisOption[] };

/**
 * The same options, split into Sans / Mono / Serif.
 *
 * Twenty-six families in one undifferentiated grid is a wall; the group is the
 * first thing anyone picking a typeface decides. `inherit` belongs to neither
 * rail, so the Heading axis renders it above these rather than inside one.
 */
export function fontOptionGroups(config: DesignSystemConfig, axis: "font" | "fontHeading"): readonly FontOptionGroup[] {
	const byValue = new Map(axisOptions(config, axis).map((option) => [option.value, option]));

	return FONT_GROUPS.map((group) => ({
		type: group.type,
		label: group.label,
		options: group.fonts.flatMap((font) => {
			const option = byValue.get(font.name);
			return option ? [option] : [];
		}),
	}));
}

/** The `inherit` row, which the Heading axis shows above the three groups. */
export function inheritOption(config: DesignSystemConfig): AxisOption | undefined {
	return axisOptions(config, "fontHeading").find((option) => option.value === "inherit");
}
