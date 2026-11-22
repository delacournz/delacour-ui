/**
 * Writes `src/routeTree.gen.ts` without a `vite build` — the only thing `typecheck` needs from one.
 *
 * TanStack Start's Vite plugin runs `@tanstack/router-generator`'s `Generator` during `buildStart`
 * with the router config plus a footer: the `declare module "@tanstack/react-start"` block whose
 * `Register` gives every `createFileRoute` its types. The bare `Generator` writes no footer, so this
 * builds the same one (`route-tree-footer.ts` in `@tanstack/start-plugin-core`) from the router and
 * start entries.
 *
 * `--check` is the guard on that copy: run right after a real `vite build` (CI's `build` job does),
 * it regenerates the file in place and fails unless the result is byte-identical to what the plugin
 * wrote. A Start upgrade that changes the footer then fails CI by name, rather than `typecheck`
 * quietly checking against a stale shape.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Generator, getConfig } from "@tanstack/router-generator";

const ROOT = join(import.meta.dir, "..");
const SRC = join(ROOT, "src");

/** The Register block TanStack Start appends, for `src/router.tsx` and (when present) `src/start.ts`. */
export function startFooter(hasStartFile: boolean): string[] {
	const lines = ["import type { getRouter } from './router.tsx'"];
	lines.push(
		hasStartFile
			? "import type { startInstance } from './start.ts'"
			: "import type { createStart } from '@tanstack/react-start'"
	);
	lines.push("declare module '@tanstack/react-start' {");
	lines.push("  interface Register {");
	lines.push("    ssr: true");
	lines.push("    router: Awaited<ReturnType<typeof getRouter>>");
	if (hasStartFile) lines.push("    config: Awaited<ReturnType<typeof startInstance.getOptions>>");
	lines.push("  }");
	lines.push("}");
	return [lines.join("\n")];
}

export async function generateRouteTree(): Promise<string> {
	const config = getConfig(
		{
			target: "react",
			routesDirectory: join(SRC, "routes"),
			generatedRouteTree: join(SRC, "routeTree.gen.ts"),
			routeTreeFileFooter: startFooter(existsSync(join(SRC, "start.ts"))),
		},
		ROOT
	);
	await new Generator({ config, root: ROOT }).run();
	return config.generatedRouteTree;
}

if (import.meta.main) {
	const target = join(SRC, "routeTree.gen.ts");
	const check = process.argv.includes("--check");
	const before = check && existsSync(target) ? readFileSync(target, "utf8") : null;
	if (check && before === null) {
		console.error(`✗ --check needs the plugin's ${target}: run vite build first`);
		process.exit(1);
	}
	await generateRouteTree();
	const after = readFileSync(target, "utf8");
	if (before !== null && before !== after) {
		writeFileSync(target, before);
		console.error("✗ the route tree this writes differs from TanStack Start's; update startFooter() to match");
		process.exit(1);
	}
	console.log(check ? "✓ identical to TanStack Start's route tree" : `✓ ${target}`);
}
