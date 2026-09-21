import { describe, expect, test } from "bun:test";
import { resolveConfig } from "../config/resolve";
import { configSchema } from "../config/schema";
import { followUps, outro } from "./init";

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

/**
 * The last line of a run.
 *
 * `add` delegates to `init` on an unconfigured project, so by the time this
 * prints the reader has usually just run the command it used to suggest —
 * *"Ready. delacour add button to get started"* after `add button` had already
 * copied it in. And the follow-up block ends on `delacour doctor`, so an outro
 * naming doctor too put it twice in consecutive lines.
 *
 * What is left is the thing that actually happened: the components are theirs.
 */
describe("outro", () => {
	test("points at the first component when nothing was added", () => {
		expect(stripAnsi(outro([]))).toBe("Ready. delacour add button to get started.");
	});

	test("names the one component that landed", () => {
		expect(stripAnsi(outro(["button"]))).toBe("Ready. button is yours to edit.");
	});

	test("names a short list", () => {
		expect(stripAnsi(outro(["button", "switch", "slider"]))).toBe(
			"Ready. button, switch and slider are yours to edit."
		);
	});

	test("counts a long one rather than reciting it", () => {
		expect(stripAnsi(outro(["button", "switch", "slider", "input", "field"]))).toBe(
			"Ready. 5 components are yours to edit."
		);
	});

	test("never mentions doctor, which the follow-ups already do", () => {
		for (const names of [[], ["button"], ["button", "switch", "slider", "input", "field"]]) {
			expect(outro(names)).not.toContain("doctor");
		}
	});
});
