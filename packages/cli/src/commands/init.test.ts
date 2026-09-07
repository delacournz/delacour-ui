import { describe, expect, test } from "bun:test";
import { resolveConfig } from "../config/resolve";
import { configSchema } from "../config/schema";
import { followUps } from "./init";

/**
 * The lines `init` hands back. Their order is the argument: the CSS import
 * first because forgetting it produces no error at all, the provider next
 * because nothing responds without it, the theme last because it is optional.
 */
function config(aliases: Record<string, string>) {
	const parsed = configSchema.parse({
		paths: {
			ui: "src/components/ui",
			lib: "src/lib",
			hooks: "src/hooks",
			styles: "src/styles",
			icons: "src/lib/icons",
		},
		aliases,
	});
	return resolveConfig(parsed, "/repo/app", "/repo/app/native-components.json");
}

describe("followUps", () => {
	test("names DelacourProvider from the ui alias, after the CSS import and before the theme", () => {
		const plain = followUps(config({ ui: "@/components/ui", styles: "@/styles" })).map(stripAnsi);

		const css = plain.findIndex((line) => line.includes("@/styles/global.css"));
		const provider = plain.findIndex((line) => line.includes("<DelacourProvider>"));
		const theme = plain.findIndex((line) => line.includes("theme.css"));

		expect(css).toBeGreaterThanOrEqual(0);
		expect(provider).toBeGreaterThan(css);
		expect(theme).toBeGreaterThan(provider);
		expect(plain[provider]).toContain('"@/components/ui/provider"');
		expect(plain[provider]).toContain("presses do nothing without it");
		expect(plain.join("\n")).not.toContain("GestureHandlerRootView");
	});

	test("falls back to the ui directory when there is no alias", () => {
		const plain = followUps(config({})).map(stripAnsi);
		const provider = plain.find((line) => line.includes("<DelacourProvider>"));

		expect(provider).toContain('"./src/components/ui/provider"');
	});

	// `"./global.css"` was the old fallback — the file is under `styles/`.
	test("names the CSS entry where it landed when there is no alias", () => {
		const plain = followUps(config({})).map(stripAnsi);
		const css = plain.find((line) => line.includes("first statement"));

		expect(css).toContain('"./src/styles/global.css"');
	});
});

/** `style.code` colours its spans; the assertions are about the words. */
function stripAnsi(text: string): string {
	return text.replace(new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g"), "");
}
