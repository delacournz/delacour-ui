import { DEFAULT_CONFIG, type DesignSystemConfig, normalizeConfig } from "@delacour/design-system/config";
import { HOUSE_CONFIG } from "@delacour/design-system/house";

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

/** Where a reset can land. */
export type ResetTarget = "house" | "library";

export type ResetTargetEntry = {
	readonly name: ResetTarget;
	readonly config: DesignSystemConfig;
};

/**
 * The two configs a reset can land on, in the order the preset strip offers
 * them: the studio's own first, the shipped default second.
 */
export const RESET_TARGETS: readonly ResetTargetEntry[] = [
	{ name: "house", config: HOUSE_CONFIG },
	{ name: "library", config: DEFAULT_CONFIG },
];

export function resetTarget(target: ResetTarget): DesignSystemConfig {
	return target === "house" ? HOUSE_CONFIG : DEFAULT_CONFIG;
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
