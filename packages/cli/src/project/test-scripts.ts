import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import type { ResolvedConfig } from "../config/resolve";
import type { TestRunner } from "../registry/test-runner";

/**
 * The `package.json` scripts that run the copied tests, added when tests are copied.
 *
 * Three names, scoped to the directories the components land in, so the
 * project's own `test` script and suites are left alone: `test:ui` runs every
 * copied suite, `test:ui:unit` the logic suites, `test:ui:render` the render
 * suites. Render suites are Jest's alone, so a Bun or Vitest project gets no
 * render script — it would run nothing.
 *
 * A name the project already has is kept exactly as it is, whatever it runs:
 * the script is theirs once it exists, and the next `add` or `update` writes
 * nothing.
 */

export const TEST_SCRIPT_NAMES = ["test:ui", "test:ui:unit", "test:ui:render"] as const;

export type TestScriptName = (typeof TEST_SCRIPT_NAMES)[number];

const RENDER_SUFFIX = "\\.render\\.test\\.tsx$";

/** The scripts for `runner`, over `dirs` — POSIX paths relative to the package the scripts live in. */
export function testScripts(runner: TestRunner, dirs: readonly string[]): Partial<Record<TestScriptName, string>> {
	const paths = dirs.join(" ");

	switch (runner) {
		case "jest":
			return {
				"test:ui": `jest ${paths}`,
				"test:ui:unit": `jest ${paths} --testPathIgnorePatterns /node_modules/ "${RENDER_SUFFIX}"`,
				"test:ui:render": `jest "(${dirs.map(escapeRegex).join("|")})/.*${RENDER_SUFFIX}"`,
			};
		case "bun": {
			const command = `bun test ${dirs.map((dir) => `./${dir}`).join(" ")}`;
			return { "test:ui": command, "test:ui:unit": command };
		}
		case "vitest": {
			const command = `vitest run ${paths}`;
			return { "test:ui": command, "test:ui:unit": command };
		}
	}
}

export type ScriptPlan = {
	/** The scripts to write. */
	add: Record<string, string>;
	/** The names skipped because the project already has them. */
	kept: string[];
};

export function planScripts(existing: Record<string, string> | undefined, wanted: Record<string, string>): ScriptPlan {
	const add: Record<string, string> = {};
	const kept: string[] = [];
	for (const [name, command] of Object.entries(wanted)) {
		if (existing && name in existing) kept.push(name);
		else add[name] = command;
	}
	return { add, kept };
}

export type TestScriptsResult =
	| { status: "added"; file: string; scripts: string[] }
	| { status: "unchanged"; file: string }
	| { status: "manual"; reason: string };

/**
 * Adds whichever test scripts the package the tests land in lacks — the config's
 * `package.json`, else the app's — and says what it did.
 */
export async function ensureTestScripts(config: ResolvedConfig): Promise<TestScriptsResult> {
	const root = [config.root, config.app.resolved.root].find((dir) => existsSync(join(dir, "package.json")));
	if (root === undefined) return { status: "manual", reason: "there is no package.json to add the test scripts to." };

	const path = join(root, "package.json");
	const file = relative(config.root, path).split(sep).join("/");
	const raw = await readFile(path, "utf-8");
	const manifest = JSON.parse(raw) as { scripts?: Record<string, string> } & Record<string, unknown>;

	const dirs = testDirectories(config, root);
	if (dirs.length === 0) return { status: "unchanged", file };

	const plan = planScripts(manifest.scripts, testScripts(config.testRunner, dirs) as Record<string, string>);
	const added = Object.keys(plan.add);
	if (added.length === 0) return { status: "unchanged", file };

	const next = { ...manifest, scripts: { ...manifest.scripts, ...plan.add } };
	await writeFile(path, `${JSON.stringify(next, null, indentOf(raw))}\n`, "utf-8");
	return { status: "added", file, scripts: added };
}

/** The component directories that exist, relative to `root`, with any inside another dropped. */
function testDirectories(config: ResolvedConfig, root: string): string[] {
	const { ui, lib, hooks, styles, icons } = config.directories;
	const existing = [...new Set([ui, lib, hooks, styles, icons])].filter((dir) => existsSync(dir));
	const outermost = existing.filter(
		(dir) => !existing.some((other) => other !== dir && dir.startsWith(`${other}${sep}`))
	);
	return outermost.map((dir) => relative(root, dir).split(sep).join("/") || ".");
}

function escapeRegex(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** The indent the file already uses, so the patched `package.json` diffs as a few lines. */
function indentOf(raw: string): string {
	return /^([ \t]+)"/m.exec(raw)?.[1] ?? "\t";
}
