/**
 * Regenerates the `exports` map in package.json from the files on disk.
 *
 * Exports are granular on purpose: an app that never imports
 * `@delacour/native-ui/bottom-sheet` never makes Metro resolve its optional
 * peer dependency. A package-wide barrel would force every consumer to resolve
 * everything.
 *
 * Components live one per folder and are exported at their folder's `index.ts`
 * (`src/components/button/` → `./button`). Hooks, lib helpers, icons and the
 * Expo-only entry points are flat files exported individually.
 *
 * `src/expo/` is where anything that imports an Expo package lives, kept apart
 * so the coupling is visible in the import path rather than buried. Everything
 * under it depends on an optional peer, which is exactly what the granular
 * exports make safe: an app that never imports `./expo/*` never resolves them.
 *
 * Usage: bun scripts/gen-exports.ts
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");

const FIXED_EXPORTS: Record<string, string> = {
	"./styles": "./src/styles/index.css",
	"./styles/base": "./src/styles/base.css",
	"./styles/tokens": "./src/styles/tokens.css",
	"./styles/theme": "./src/styles/theme.css",
};

/** Skips tests, type shims, and anything that is not TypeScript. */
function isEntryPoint(name: string): boolean {
	if (!name.endsWith(".ts") && !name.endsWith(".tsx")) return false;
	if (name.endsWith(".d.ts")) return false;
	if (name.includes(".test.")) return false;
	return true;
}

/** One export per component folder, pointing at its `index.ts`. */
async function collectComponents(): Promise<Record<string, string>> {
	const exports: Record<string, string> = {};
	const dir = join(ROOT, "src/components");

	let entries: Awaited<ReturnType<typeof readdir>>;
	try {
		entries = await readdir(dir, { withFileTypes: true });
	} catch {
		return exports;
	}

	for (const entry of entries) {
		if (!entry.isDirectory()) continue;
		const index = join(dir, entry.name, "index.ts");
		if (!(await Bun.file(index).exists())) {
			throw new Error(`Component folder src/components/${entry.name} has no index.ts`);
		}
		exports[`./${entry.name}`] = `./src/components/${entry.name}/index.ts`;
	}

	return exports;
}

/** One export per file, for the flat directories. */
async function collectFiles(dir: string, prefix: string): Promise<Record<string, string>> {
	const exports: Record<string, string> = {};

	let entries: string[];
	try {
		entries = await readdir(join(ROOT, dir));
	} catch {
		return exports;
	}

	for (const name of entries) {
		if (!isEntryPoint(name)) continue;
		exports[`./${prefix}${name.replace(/\.tsx?$/, "")}`] = `./${dir}/${name}`;
	}

	return exports;
}

function sorted(entries: Record<string, string>): Record<string, string> {
	return Object.fromEntries(Object.entries(entries).sort(([a], [b]) => a.localeCompare(b)));
}

async function main(): Promise<void> {
	const pkgPath = join(ROOT, "package.json");
	const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));

	const exports = {
		...FIXED_EXPORTS,
		...sorted(await collectComponents()),
		...sorted(await collectFiles("src/expo", "expo/")),
		...sorted(await collectFiles("src/hooks", "hooks/")),
		...sorted(await collectFiles("src/lib", "lib/")),
		...sorted(await collectFiles("src/icons", "icons/")),
	};

	pkg.exports = exports;
	await writeFile(pkgPath, `${JSON.stringify(pkg, null, "\t")}\n`, "utf-8");

	console.log(`Generated ${Object.keys(exports).length} exports in package.json`);
	for (const [key, value] of Object.entries(exports)) {
		console.log(`  ${key} → ${value}`);
	}
}

main();
