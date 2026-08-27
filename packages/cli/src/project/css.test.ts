import { describe, expect, test } from "bun:test";
import type { Namespace } from "../registry/namespaces";
import { buildStylesBlock, isCovered, parseSources, patchGlobalCss } from "./css";

const IN_APP: Record<Namespace, string> = {
	ui: "/app/src/components/ui",
	lib: "/app/src/lib",
	hooks: "/app/src/hooks",
	styles: "/app/src/styles",
	icons: "/app/src/lib/icons",
};

const IN_PACKAGE: Record<Namespace, string> = {
	ui: "/repo/packages/ui/src/components",
	lib: "/repo/packages/ui/src/lib",
	hooks: "/repo/packages/ui/src/hooks",
	styles: "/repo/packages/ui/src/styles",
	icons: "/repo/packages/ui/src/lib/icons",
};

describe("buildStylesBlock", () => {
	test("imports the theme relative to the entry", () => {
		const block = buildStylesBlock({ cssPath: "/app/src/styles/global.css", directories: IN_APP });
		expect(block).toContain('@import "./index.css";');
	});

	test("emits a source glob for every directory holding copied code", () => {
		const block = buildStylesBlock({ cssPath: "/app/src/styles/global.css", directories: IN_APP });

		expect(block).toContain('@source "../components/ui";');
		expect(block).toContain('@source "../hooks";');
		expect(block).toContain('@source "../lib";');
	});

	test("skips a directory already covered by an enclosing one", () => {
		const block = buildStylesBlock({ cssPath: "/app/src/styles/global.css", directories: IN_APP });
		expect(block).not.toContain("lib/icons");
	});

	test("reaches out of the app when the components live in a package", () => {
		const block = buildStylesBlock({ cssPath: "/repo/apps/mobile/src/styles/global.css", directories: IN_PACKAGE });

		// The real path, not the node_modules symlink Tailwind's scanner cannot follow.
		expect(block).toContain('@source "../../../../packages/ui/src/components";');
		expect(block).toContain('@import "../../../../packages/ui/src/styles/index.css";');
	});
});

describe("patchGlobalCss", () => {
	const block = buildStylesBlock({ cssPath: "/app/src/styles/global.css", directories: IN_APP });

	test("creates an entry with the Tailwind and Uniwind imports when there is none", () => {
		const result = patchGlobalCss(null, block);

		expect(result.changed).toBe(true);
		expect(result.content).toContain('@import "tailwindcss";');
		expect(result.content).toContain('@import "uniwind";');
		expect(result.content).toContain(block);
	});

	test("appends to an existing entry, keeping what was there", () => {
		const existing = '@import "tailwindcss";\n@import "uniwind";\n\n.custom { color: red; }\n';
		const result = patchGlobalCss(existing, block);

		expect(result.content.startsWith(existing)).toBe(true);
		expect(result.content).toContain(block);
	});

	test("replaces the managed block instead of appending a second one", () => {
		const first = patchGlobalCss('@import "tailwindcss";\n', block).content;
		const updated = buildStylesBlock({ cssPath: "/app/src/styles/global.css", directories: IN_PACKAGE });
		const second = patchGlobalCss(first, updated).content;

		expect(second.match(/delacour:start/g)).toHaveLength(1);
		expect(second).toContain("packages/ui/src/components");
		expect(second).not.toContain('@source "../components/ui";');
	});

	test("leaves the file alone when nothing changed, so init is safe to re-run", () => {
		const first = patchGlobalCss('@import "tailwindcss";\n', block).content;
		const second = patchGlobalCss(first, block);

		expect(second.changed).toBe(false);
		expect(second.content).toBe(first);
	});

	test("keeps a developer's own rules outside the block", () => {
		const first = patchGlobalCss('@import "tailwindcss";\n', block).content;
		const edited = `${first}\n.mine { color: blue; }\n`;
		const second = patchGlobalCss(edited, block).content;

		expect(second).toContain(".mine { color: blue; }");
	});
});

describe("parseSources", () => {
	const cssPath = "/app/src/styles/global.css";

	test("reduces a glob to the directory it scans from", () => {
		expect(parseSources('@source "../**/*.{ts,tsx}";', cssPath)).toEqual(["/app/src"]);
	});

	test("reads a bare directory source", () => {
		expect(parseSources('@source "../../../packages/ui/src";', cssPath)).toEqual(["/packages/ui/src"]);
	});

	test("ignores inline sources, which name classes rather than files", () => {
		expect(parseSources('@source inline("underline");', cssPath)).toEqual([]);
	});

	test("collects every source in the file", () => {
		const css = '@source "../**/*.tsx";\n@source "../components";\n';
		expect(parseSources(css, cssPath)).toEqual(["/app/src", "/app/src/components"]);
	});
});

describe("isCovered", () => {
	test("a directory inside a source is covered", () => {
		expect(isCovered("/app/src/components/ui", ["/app/src"])).toBe(true);
		expect(isCovered("/app/src", ["/app/src"])).toBe(true);
	});

	test("a directory outside every source is not", () => {
		expect(isCovered("/repo/packages/ui/src", ["/repo/apps/mobile/src"])).toBe(false);
		expect(isCovered("/app/src", [])).toBe(false);
	});
});
