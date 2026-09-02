import { BASE_COLORS, type BaseColorName, type TokenValues } from "./base-colors";
import type { DesignSystemConfig } from "./config";
import { fontByName } from "./fonts";
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
 * The button's own corner, when the Radius axis names one.
 *
 * `--radius-button-*` sits outside the generic ramp on purpose — a button's
 * corner is half its height, a shape rather than a step — which is why a style
 * writes the three numbers directly and `--radius` never reaches them. That
 * holds for the Style axis and breaks for this one: picking Small squared every
 * surface down to 7.2 and left Sera's buttons at the flat 0 its style set, so
 * the axis named "Radius" visibly did not apply to the roundest control on the
 * screen.
 *
 * So an explicit radius writes the button's corner as well, still capped at half
 * the height the way `styles.ts` caps it — past that the renderer clamps and the
 * number stops meaning what it says. `default` is untouched by design: it means
 * "whatever the style chose", and a style's capsule is exactly what it chose.
 */
function applyButtonRadius(mode: ResolvedMode, value: number): void {
	for (const step of ["sm", "md", "lg"] as const) {
		const height = Number(mode[`spacing-button-${step}`]);
		mode[`radius-button-${step}`] = Number.isFinite(height) ? Math.min(value, height / 2) : value;
	}
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
		applyButtonRadius(light, radius.value);
		applyButtonRadius(dark, radius.value);
	}

	return { light, dark };
}

export type ResolvedFonts = { sans?: string; heading?: string };

/**
 * The family name each rail resolves to, per config.
 *
 * The value is the family embedded in the TTF, not the title: React Native's
 * `fontFamily` takes one name and no fallback list, and the name has to be what
 * iOS registers under and what Android's generated `res/font` XML groups its
 * weights beneath. A mismatch falls back to the system font with no error at all.
 *
 * **Fonts stay out of `resolveTokens` on purpose.** `design-system.test.ts`
 * asserts every key that function writes is declared inside `theme.css`'s
 * `@variant light` and `@variant dark` blocks — and `--font-sans` and
 * `--font-heading` are declared in the `@variant ios` / `@variant android`
 * blocks instead, because no single family name works on both platforms. Folding
 * them in would fail that suite on the first run.
 *
 * It lives here rather than in the playground's store because the store and the
 * CSS emitter both need it, and two copies of "which family does this config
 * mean" is exactly the drift that shows up as a screen rendering one typeface
 * while the file you copied names another.
 */
export function resolveFonts(config: DesignSystemConfig): ResolvedFonts {
	const sans = fontByName(config.font)?.family;
	const heading = config.fontHeading === "inherit" ? sans : fontByName(config.fontHeading)?.family;

	return { sans, heading };
}
