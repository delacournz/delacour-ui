import { type DesignSystemConfig, withAxis } from "@delacour/design-system/config";
import { resolveFonts, resolveTokens } from "@delacour/design-system/resolve";
import { useSyncExternalStore } from "react";
import { Platform } from "react-native";
import { createMMKV } from "react-native-mmkv";
import { Uniwind } from "uniwind";
import {
	parseStoredConfig,
	parseStoredMode,
	type ResetTarget,
	resetTarget,
	THEME_MODES,
	type ThemeMode,
} from "@/design-system/store.pure";

export { THEME_MODES, type ThemeMode };

const storage = createMMKV({ id: "delacour-playground-design-system" });

const CONFIG_KEY = "config";
const MODE_KEY = "mode";

/**
 * What the store holds, or the house when it holds nothing worth keeping.
 *
 * The fallbacks are `parseStoredConfig`'s — a fresh install, an older build's
 * config and a partial write all land on `HOUSE_CONFIG` rather than the
 * library's own default, which is what `/preview` forces and the one thing
 * this app is not meant to open in.
 */
function readConfig(): DesignSystemConfig {
	return parseStoredConfig(storage.getString(CONFIG_KEY));
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
 *
 * A rail that resolves to no family — `system`, or a heading inheriting it —
 * is written as the platform's own font rather than skipped. `updateCSSVariables`
 * merges, so a skipped key would keep whatever was there last: choose Lora,
 * then choose System, and the app would stay in Lora with the picker saying
 * otherwise. The two names are the ones `theme.css` ships in its `@variant ios`
 * and `@variant android` blocks, so "reset" lands on exactly what a fresh
 * install draws.
 */
const PLATFORM_SANS = Platform.select({ ios: "System", default: "sans-serif" });

export function applyConfig(config: DesignSystemConfig): void {
	const tokens = resolveTokens(config);

	const { sans, heading } = resolveFonts(config);

	const fonts: Record<string, string> = {
		"--font-sans": sans ?? PLATFORM_SANS,
		"--font-heading": heading ?? PLATFORM_SANS,
	};

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
	Uniwind.setTheme(parseStoredMode(storage.getString(MODE_KEY)));

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

/**
 * Land on one of the two presets, replacing every axis at once.
 *
 * `house` is the studio's own look and what a fresh install opens in; `library`
 * is what `delacour init` ships and what the documentation captures show. Both
 * are written to the store rather than cleared from it, so a reset to the
 * library default survives a restart exactly as a hand-built theme does.
 */
export function resetConfig(target: ResetTarget): void {
	current = resetTarget(target);
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
