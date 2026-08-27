import { stat } from "node:fs/promises";
import { join } from "node:path";

/**
 * Guards the two properties the published bundle has to keep.
 *
 * **No TypeScript compiler.** `src/registry/scan-imports.ts` imports the whole
 * of `typescript` to read type-only imports out of the library's source. That
 * runs when the registry is built, in this repository. If an entry-point module
 * ever reaches it, the published tarball grows by about ten megabytes and every
 * `bunx delacour` pays for it.
 *
 * **No shebang lost.** `bin` points straight at this file, so without one it is
 * executed as JavaScript by whatever happens to be first on PATH.
 *
 * Run by `prepublishOnly`, so a release cannot skip it.
 */

const BUNDLE = join(import.meta.dirname, "../dist/index.js");
const MAX_BYTES = 2_000_000;

const file = Bun.file(BUNDLE);
if (!(await file.exists())) {
	console.error(`No bundle at ${BUNDLE}. Run \`bun run build\` first.`);
	process.exit(1);
}

const content = await file.text();
const { size } = await stat(BUNDLE);
const problems: string[] = [];

if (!content.startsWith("#!")) problems.push("the bundle has no shebang, so `bin` would not be executable");

// The compiler's own banner, not a mention of the word.
if (content.includes("ts.version") && content.includes("createSourceFile")) {
	problems.push("the TypeScript compiler was bundled — an entry-point module reaches src/registry/scan-imports.ts");
}

if (size > MAX_BYTES) {
	problems.push(`the bundle is ${(size / 1_000_000).toFixed(1)}MB, over the ${MAX_BYTES / 1_000_000}MB ceiling`);
}

if (problems.length > 0) {
	console.error(problems.map((problem) => `  ✗ ${problem}`).join("\n"));
	process.exit(1);
}

console.log(`✓ dist/index.js — ${(size / 1024).toFixed(0)}KB, no runtime dependencies, executable.`);
