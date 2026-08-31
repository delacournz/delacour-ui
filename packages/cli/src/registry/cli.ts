import { join } from "node:path";
import { buildRegistry } from "./build";
import { writeRegistry } from "./write";

/**
 * Builds `registry/` from `packages/native-ui`.
 *
 * Run with `bun run registry:build` from `packages/cli`. Release CI runs it and
 * fails if the working tree comes back dirty — the registry is served from the
 * repository, so a commit whose `registry/` does not match its source would
 * publish components that no longer exist.
 */

const PACKAGE_ROOT = join(import.meta.dirname, "../../../native-ui");
const OUT_DIR = join(import.meta.dirname, "../../../../registry");

/** Repo-relative, because that is what an item's `files[].path` resolves against. */
const PACKAGE_DIR = "packages/native-ui";

const result = await buildRegistry({ packageRoot: PACKAGE_ROOT, packageDir: PACKAGE_DIR });
const { written, removed } = await writeRegistry(OUT_DIR, result);

for (const item of result.items) {
	const dependencies = [...item.dependencies, ...item.expoDependencies];
	const summary = [
		`${item.files.length} file${item.files.length === 1 ? "" : "s"}`,
		item.registryDependencies.length > 0 ? `→ ${item.registryDependencies.join(", ")}` : "",
		dependencies.length > 0 ? `+ ${dependencies.join(", ")}` : "",
	]
		.filter(Boolean)
		.join("  ");

	console.log(`  ${item.name.padEnd(24)} ${summary}`);
}

for (const path of removed) console.log(`  removed ${path}`);

console.log(`\nWrote ${written.length} files to registry/ (${result.items.length} items).`);
