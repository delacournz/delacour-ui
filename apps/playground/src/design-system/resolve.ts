import { BASE_COLORS, type BaseColorName, type TokenValues } from "./base-colors";
import type { DesignSystemConfig } from "./config";
import { radiusByName } from "./radii";
import { styleByName } from "./styles";
import { ACCENT_THEMES, type ThemeName } from "./themes";

/** One mode's worth of resolved variables, keyed WITHOUT the leading `--`. */
export type ResolvedMode = Record<string, string | number>;

export type ResolvedTokens = { light: ResolvedMode; dark: ResolvedMode };

function baseColor(name: BaseColorName) {
	const found = BASE_COLORS.find((candidate) => candidate.name === name);
	if (!found) throw new Error(`no base colour named ${name}`);

	return found;
}

/**
 * An accent, or `undefined` when the theme names the base colour itself.
 *
 * The Theme axis offers the current base colour alongside the seventeen
 * accents, and picking it means "no accent" rather than an eighteenth patch —
 * so a lookup miss here is the expected path, not an error.
 */
function accent(name: ThemeName | BaseColorName) {
	return ACCENT_THEMES.find((candidate) => candidate.name === name);
}

function chartKeys(values: TokenValues): TokenValues {
	const picked: TokenValues = {};

	for (let step = 1; step <= 5; step += 1) {
		const key = `chart-${step}`;
		const value = values[key];
		if (value) picked[key] = value;
	}

	return picked;
}

/**
 * Every axis, composed into the two sets of variables the store injects.
 *
 * The colour half is shadcn's algorithm and nothing more: a base colour's full
 * ramp, an accent spread over it, then the chart hues overwritten. There is no
 * merge strategy beyond object spread, and the order IS the precedence.
 *
 * Two departures from shadcn, both deliberate:
 *
 * - An accent carries no `secondary`. shadcn hardcodes it to a zinc grey
 *   whatever the base colour, so stone + blue yields a stone page with a zinc
 *   secondary — invisible on a web card, obvious on a `Button variant="secondary"`
 *   and a `ListGroup`. Dropping it lets the base colour's own secondary stand.
 * - The geometry is a real axis. shadcn's styles are stylesheets and write no
 *   variables at all; here a style is a bundle of numbers, so it composes with
 *   the palette in the same pass. Radius is applied last so the Radius axis can
 *   override the style's own corner without replacing the rest of its geometry.
 *
 * Pure, and free of React Native imports, so the whole matrix is reachable from
 * `bun test`.
 */
export function resolveTokens(config: DesignSystemConfig): ResolvedTokens {
	const base = baseColor(config.baseColor);
	const theme = accent(config.theme);
	const chart = accent(config.chartColor);

	const light: ResolvedMode = { ...base.light, ...(theme?.light ?? {}) };
	const dark: ResolvedMode = { ...base.dark, ...(theme?.dark ?? {}) };

	// The chart axis is the base colour's own ramp when it names the base.
	const chartLight = chart ? chartKeys(chart.light) : chartKeys(base.light);
	const chartDark = chart ? chartKeys(chart.dark) : chartKeys(base.dark);

	Object.assign(light, chartLight);
	Object.assign(dark, chartDark);

	const style = styleByName(config.style);
	if (style) {
		Object.assign(light, style.geometry);
		Object.assign(dark, style.geometry);
	}

	const radius = radiusByName(config.radius);
	if (radius && radius.value !== null) {
		light.radius = radius.value;
		dark.radius = radius.value;
	}

	return { light, dark };
}
