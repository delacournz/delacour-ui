import { DEFAULT_CONFIG, type DesignSystemConfig, normalizeConfig, withAxis } from "@delacour/design-system/config";
import { resolveFonts, resolveTokens } from "@delacour/design-system/resolve";
import { useSyncExternalStore } from "react";
import { createMMKV } from "react-native-mmkv";
import { Uniwind } from "uniwind";

/** Light and dark are Uniwind's own themes; `system` is a magic string it intercepts. */
export const THEME_MODES = ["system", "light", "dark"] as const;

export type ThemeMode = (typeof THEME_MODES)[number];

const storage = createMMKV({ id: "delacour-playground-design-system" });

const CONFIG_KEY = "config";
const MODE_KEY = "mode";

function isThemeMode(value: string | undefined): value is ThemeMode {
	return (THEME_MODES as readonly string[]).includes(value ?? "");
}

function readConfig(): DesignSystemConfig {
	const raw = storage.getString(CONFIG_KEY);
	if (!raw) return DEFAULT_CONFIG;

	try {
		return normalizeConfig(JSON.parse(raw) as Partial<DesignSystemConfig>);
	} catch {
		// A config written by an older build, or a partial write. The whole
		// point of persisting per-axis defaults is that one bad value is not
		// worth losing the rest, and unparseable JSON is the case where there
		// is no rest to keep.
		return DEFAULT_CONFIG;
	}
}

/**
 * Push a config into Uniwind's variable store, for both modes.
 *
 * `updateCSSVariables` writes `UniwindStore.vars[theme]` — the same map style
 * resolution reads — so this repaints everything already on screen, including
 * what `BottomSheet` renders into a portal outside the React tree. That is the
 * whole reason this is not a `ScopedVariables` boundary around the app.
 *
 * The ACTIVE mode is written last on purpose: Uniwind notifies once per call,
 * and applying the inactive mode afterwards has been observed to win on the
 * first render.
 *
 * Fonts come from `resolveFonts` rather than being worked out here, so the
 * running app and the CSS the documentation site emits cannot disagree about
 * which family a config means.
 */
export function applyConfig(config: DesignSystemConfig): void {
	const tokens = resolveTokens(config);

	const { sans, heading } = resolveFonts(config);

	const fonts: Record<string, string> = {};
	if (sans) fonts["--font-sans"] = sans;
	if (heading) fonts["--font-heading"] = heading;

	const active = Uniwind.currentTheme === "dark" ? "dark" : "light";
	const order = active === "dark" ? (["light", "dark"] as const) : (["dark", "light"] as const);

	for (const mode of order) {
		const values: Record<string, string | number> = { ...fonts };

		for (const [name, value] of Object.entries(tokens[mode])) {
			values[`--${name}`] = value;
		}

		Uniwind.updateCSSVariables(mode, values);
	}
}

let current = readConfig();

const listeners = new Set<() => void>();

function emit(): void {
	for (const listener of listeners) listener();
}

/**
 * Apply the stored config and mode before anything renders.
 *
 * Called at module scope from `app/_layout.tsx`, which is what makes MMKV the
 * right store here: its reads are synchronous, so the restored look is in place
 * for the first paint. An async store would render one frame of the default
 * palette and then repaint, on every cold start.
 */
export function restoreDesignSystem(): void {
	const mode = storage.getString(MODE_KEY);
	if (isThemeMode(mode)) Uniwind.setTheme(mode);

	applyConfig(current);
}

export function getConfig(): DesignSystemConfig {
	return current;
}

/** Change one axis, leaving every other exactly as it was. */
export function setAxis<Key extends keyof DesignSystemConfig>(key: Key, value: DesignSystemConfig[Key]): void {
	current = withAxis(current, key, value);
	storage.set(CONFIG_KEY, JSON.stringify(current));
	applyConfig(current);
	emit();
}

export function resetConfig(): void {
	current = DEFAULT_CONFIG;
	storage.set(CONFIG_KEY, JSON.stringify(current));
	applyConfig(current);
	emit();
}

/**
 * Uniwind does not persist its own theme, so the mode is stored beside the config.
 *
 * Without this the app would come back on the restored design system but always
 * on the system's light/dark, which reads as the setting half-forgetting itself.
 */
export function setThemeMode(mode: ThemeMode): void {
	storage.set(MODE_KEY, mode);
	Uniwind.setTheme(mode);
	emit();
}

function subscribe(listener: () => void): () => void {
	listeners.add(listener);

	return () => {
		listeners.delete(listener);
	};
}

/** The active config, re-rendering the caller when any axis changes. */
export function useDesignSystem(): DesignSystemConfig {
	return useSyncExternalStore(subscribe, getConfig, getConfig);
}
