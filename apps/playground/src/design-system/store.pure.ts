import { DEFAULT_CONFIG, type DesignSystemConfig, normalizeConfig } from "@delacour/design-system/config";
import { fontByName } from "@delacour/design-system/fonts";
import { DELACOUR_AMBER_CONFIG, HOUSE_CONFIG } from "@delacour/design-system/house";

/**
 * The half of the store `bun test` can reach.
 *
 * `store.ts` is MMKV plus `Uniwind.updateCSSVariables`, and both pull React
 * Native in — Flow-typed source Bun's transpiler cannot parse — so every
 * decision that does not need a device lives here instead: what an empty or
 * broken store falls back to, which configs "reset" can land on, and which
 * light/dark mode a fresh install opens in. `store.ts` reads them and adds the
 * persistence.
 */

/** Light and dark are Uniwind's own themes; `system` is a magic string it intercepts. */
export const THEME_MODES = ["system", "light", "dark"] as const;

export type ThemeMode = (typeof THEME_MODES)[number];

/**
 * A fresh install opens dark.
 *
 * The studio site is dark by default and the playground is that site continued
 * onto a phone, so the first frame is the house on its own ground. `system` is
 * still a mode the store persists — it is just not the one nothing has chosen.
 */
export const DEFAULT_THEME_MODE: ThemeMode = "dark";

export function isThemeMode(value: string | undefined): value is ThemeMode {
	return (THEME_MODES as readonly string[]).includes(value ?? "");
}

/** The stored mode, or the default when nothing valid was stored. */
export function parseStoredMode(raw: string | undefined): ThemeMode {
	return isThemeMode(raw) ? raw : DEFAULT_THEME_MODE;
}

/**
 * The stored config, or the house when there is none worth keeping.
 *
 * Every fallback here is `HOUSE_CONFIG`, never `DEFAULT_CONFIG`: a fresh
 * install, a config written by an older build, and a partial write all land on
 * the studio's own look. The library default is one tap away in the preset
 * strip; it is what `/preview` forces for the documentation captures, and it is
 * not what this app opens in.
 *
 * A partial config fills its gaps from the house rather than from the library,
 * for the same reason `normalizeConfig` fills them at all: one stale axis is
 * not worth losing the rest.
 */
export function parseStoredConfig(raw: string | undefined): DesignSystemConfig {
	if (!raw) return HOUSE_CONFIG;

	try {
		const parsed: unknown = JSON.parse(raw);
		if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return HOUSE_CONFIG;

		return normalizeConfig({ ...HOUSE_CONFIG, ...(parsed as Partial<DesignSystemConfig>) });
	} catch {
		return HOUSE_CONFIG;
	}
}

/** The house as it stood before its headings moved from Inter to the body's mono. */
const INTER_HEADING_HOUSE: DesignSystemConfig = { ...HOUSE_CONFIG, fontHeading: "inter" };

/**
 * Moves a config persisted under an earlier house onto the current one.
 *
 * Amber was the playground's default until the Devl house replaced it, so a
 * stored config that equals it exactly, on a build that has never run this
 * migration, is the old default and not a choice. After the first run the flag
 * is set, and amber — now a preset shortcut — can only have been picked on
 * purpose, so it is left alone. A customised config never matches.
 *
 * The Inter-heading house moves whatever the flag says: no shortcut has offered
 * it since the headings went mono, so a stored copy is always the old default.
 */
export function migrateStoredConfig(config: DesignSystemConfig, hasMigrated: boolean): DesignSystemConfig {
	if (configEquals(config, INTER_HEADING_HOUSE)) return HOUSE_CONFIG;
	if (hasMigrated) return config;
	return configEquals(config, DELACOUR_AMBER_CONFIG) ? HOUSE_CONFIG : config;
}

/** Where a reset can land. */
export type ResetTarget = "house" | "amber" | "library";

export type ResetTargetEntry = {
	readonly name: ResetTarget;
	readonly config: DesignSystemConfig;
};

/**
 * The configs a reset can land on, in the order the preset strip offers them:
 * the studio's own first, its former amber look second, the shipped default
 * last.
 */
export const RESET_TARGETS: readonly ResetTargetEntry[] = [
	{ name: "house", config: HOUSE_CONFIG },
	{ name: "amber", config: DELACOUR_AMBER_CONFIG },
	{ name: "library", config: DEFAULT_CONFIG },
];

export function resetTarget(target: ResetTarget): DesignSystemConfig {
	if (target === "house") return HOUSE_CONFIG;
	return target === "amber" ? DELACOUR_AMBER_CONFIG : DEFAULT_CONFIG;
}

const AXES: readonly (keyof DesignSystemConfig)[] = [
	"style",
	"baseColor",
	"theme",
	"chartColor",
	"font",
	"fontHeading",
	"radius",
];

/**
 * Do two configs name the same theme, axis for axis?
 *
 * Structural rather than by identity, because the applied config is a fresh
 * object from MMKV on every launch while a preset's is a module constant. The
 * preset strip reads this to mark which shortcut, if any, is what is on screen.
 */
export function configEquals(a: DesignSystemConfig, b: DesignSystemConfig): boolean {
	return AXES.every((axis) => a[axis] === b[axis]);
}

/**
 * The family `--font-mono` should name under a config, or `undefined` for the
 * platform's own (Menlo, `monospace`).
 *
 * The axes have no mono rail, so it is read off the two that exist: a mono body
 * wins, then a mono heading. Without this `Text.Kicker` and `Text.Code` draw in
 * Menlo while every face around them is JetBrains Mono — two monos on one
 * screen, which reads as a mistake rather than a choice.
 */
export function resolveMonoFamily(config: DesignSystemConfig): string | undefined {
	const faces = [config.font, config.fontHeading].map(fontByName);
	return faces.find((face) => face?.type === "mono")?.family;
}
