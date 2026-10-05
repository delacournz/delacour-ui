import { describe, expect, test } from "bun:test";
import {
	isThemeMode,
	resolveModeLabel,
	resolveNextMode,
	resolveOptions,
	resolveSelectedMode,
	resolveThemeFamily,
	restoreThemeMode,
	THEME_MODE_LABELS,
	THEME_MODES,
} from "./theme-selector.logic";

describe("THEME_MODES", () => {
	test("offers system first, then light, then dark", () => {
		expect(THEME_MODES).toEqual(["system", "light", "dark"]);
	});

	test("every mode has a default label", () => {
		expect(Object.keys(THEME_MODE_LABELS).sort()).toEqual([...THEME_MODES].sort());
	});
});

describe("resolveThemeFamily", () => {
	test("dark is dark", () => {
		expect(resolveThemeFamily("dark")).toBe("dark");
	});

	test("anything else is light", () => {
		expect(resolveThemeFamily("light")).toBe("light");
		expect(resolveThemeFamily("house")).toBe("light");
		expect(resolveThemeFamily("")).toBe("light");
	});
});

describe("resolveSelectedMode", () => {
	test("adaptive themes mean System is selected, whatever it resolved to", () => {
		expect(resolveSelectedMode({ hasAdaptiveThemes: true, theme: "light" })).toBe("system");
		expect(resolveSelectedMode({ hasAdaptiveThemes: true, theme: "dark" })).toBe("system");
	});

	test("a pinned theme selects itself", () => {
		expect(resolveSelectedMode({ hasAdaptiveThemes: false, theme: "light" })).toBe("light");
		expect(resolveSelectedMode({ hasAdaptiveThemes: false, theme: "dark" })).toBe("dark");
	});

	test("a pinned custom theme falls back to its family", () => {
		expect(resolveSelectedMode({ hasAdaptiveThemes: false, theme: "house" })).toBe("light");
	});
});

describe("isThemeMode", () => {
	test("accepts the three modes and nothing else", () => {
		for (const mode of THEME_MODES) expect(isThemeMode(mode)).toBe(true);
		expect(isThemeMode("Dark")).toBe(false);
		expect(isThemeMode("midnight")).toBe(false);
		expect(isThemeMode(undefined)).toBe(false);
		expect(isThemeMode(null)).toBe(false);
		expect(isThemeMode(1)).toBe(false);
	});
});

describe("restoreThemeMode", () => {
	test("passes a stored mode through", () => {
		expect(restoreThemeMode("dark")).toBe("dark");
		expect(restoreThemeMode("light")).toBe("light");
		expect(restoreThemeMode("system")).toBe("system");
	});

	test("falls back to system for nothing stored", () => {
		expect(restoreThemeMode(null)).toBe("system");
		expect(restoreThemeMode(undefined)).toBe("system");
		expect(restoreThemeMode("")).toBe("system");
	});

	test("falls back to system for anything unknown, and never throws", () => {
		expect(restoreThemeMode("Dark")).toBe("system");
		expect(restoreThemeMode("midnight")).toBe("system");
		expect(restoreThemeMode(" dark ")).toBe("system");
	});
});

describe("resolveNextMode", () => {
	test("a re-press of the current mode is no change", () => {
		expect(resolveNextMode({ current: "dark", pressed: "dark" })).toBeNull();
	});

	test("a different mode is the next one", () => {
		expect(resolveNextMode({ current: "dark", pressed: "light" })).toBe("light");
		expect(resolveNextMode({ current: "light", pressed: "system" })).toBe("system");
	});

	test("an unknown value is no change", () => {
		expect(resolveNextMode({ current: "dark", pressed: "midnight" })).toBeNull();
		expect(resolveNextMode({ current: "dark", pressed: undefined })).toBeNull();
	});
});

describe("resolveModeLabel", () => {
	test("defaults", () => {
		expect(resolveModeLabel("system")).toBe("System");
		expect(resolveModeLabel("light")).toBe("Light");
		expect(resolveModeLabel("dark")).toBe("Dark");
	});

	test("an override wins", () => {
		expect(resolveModeLabel("system", { system: "Auto" })).toBe("Auto");
	});

	test("a blank override is ignored", () => {
		expect(resolveModeLabel("system", { system: "" })).toBe("System");
		expect(resolveModeLabel("dark", { dark: "   " })).toBe("Dark");
	});
});

describe("resolveOptions", () => {
	test("defaults to every mode in order", () => {
		expect(resolveOptions({})).toEqual([
			{ label: "System", mode: "system" },
			{ label: "Light", mode: "light" },
			{ label: "Dark", mode: "dark" },
		]);
	});

	test("takes a subset, in the order given", () => {
		expect(resolveOptions({ modes: ["dark", "light"] }).map((option) => option.mode)).toEqual(["dark", "light"]);
	});

	test("drops duplicates, keeping the first", () => {
		expect(resolveOptions({ modes: ["light", "dark", "light"] }).map((option) => option.mode)).toEqual([
			"light",
			"dark",
		]);
	});

	test("an empty list falls back to every mode", () => {
		expect(resolveOptions({ modes: [] }).map((option) => option.mode)).toEqual([...THEME_MODES]);
	});

	test("applies label overrides and ignores blank ones", () => {
		expect(resolveOptions({ labels: { dark: "Night", light: " " } })).toEqual([
			{ label: "System", mode: "system" },
			{ label: "Light", mode: "light" },
			{ label: "Night", mode: "dark" },
		]);
	});
});
