/**
 * Which components' preview media a branch has made stale — the list to hand `bun run previews`.
 *
 *     bun run previews:affected                     # this branch against origin/develop, working tree included
 *     bun run previews:affected -- --base origin/main
 *     bun run previews:affected -- --json
 *
 * A demo's capture hash covers the demo, its meta and its `capture()` block — not the component it
 * renders. So a change to `button.variants.ts` re-captures nothing on an incremental run, every
 * captured Button goes stale, and so does every Dialog that renders one. This walks the import graph
 * of the library and the demos backwards from each changed file to the components whose pictures it
 * can move, and prints the command that recaptures them.
 *
 * It over-approximates on purpose: an import edge says a file *can* change the pixels, not that it
 * did. A doc-comment edit still lists its component — the agent reading the output decides, and the
 * root `AGENTS.md` says how.
 */

import { dirname, join, normalize } from "node:path";
import { $ } from "bun";

const UI = "packages/react-native-ui/src";
const DEMOS = "apps/playground/src/demos";
const SPECS = "apps/playground/e2e/previews";
const UI_PACKAGE = "@delacour/react-native-ui/";
const ENGINE = /^@delacour\/react-native-(charts|bottom-sheet)(?:\/|$)/;
const ENGINE_PATH = /^packages\/react-native-(charts|bottom-sheet)\//;
const EXTENSIONS = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"];
const SPECIFIER = /(?:from|import)\s*\(?\s*["']([^"']+)["']/g;

export type SourceFile = { path: string; code: string };

/** File → the files and engine packages it imports. Repo-relative paths; an engine is its package name. */
export type ImportGraph = ReadonlyMap<string, ReadonlySet<string>>;

export type AffectedComponent = {
	name: string;
	/** The changed file that reached it. */
	via: string;
};

export type Affected =
	| { kind: "none" }
	/** The capture harness or a stylesheet every preview draws through: recapture everything, `--force`. */
	| { kind: "all"; via: string }
	/** `force` unless every change was to a demo or a spec, whose own hash already moved. */
	| { kind: "components"; components: AffectedComponent[]; force: boolean };

/** A file that cannot move a pixel: tests, their fixtures, docs and ambient types. */
export function isExempt(path: string): boolean {
	return (
		/\.test\.tsx?$/.test(path) ||
		/\.(test-helpers|fixtures)\.tsx?$/.test(path) ||
		path.endsWith(".md") ||
		path.endsWith(".d.ts")
	);
}

/**
 * What every capture draws through: the preview route, the spec helpers that aren't one component's
 * spec, and the stylesheets. None of them is in any demo's hash.
 */
function touchesEverything(path: string): boolean {
	if (path === "apps/playground/src/app/preview.tsx") return true;
	if (path.startsWith(`${SPECS}/`) && !path.endsWith(".e2e.ts")) return true;
	return path.endsWith(".css") && (path.startsWith(`${UI}/styles/`) || path.startsWith("apps/playground/src/styles/"));
}

function resolve(base: string, known: ReadonlySet<string>): string | undefined {
	for (const extension of EXTENSIONS) {
		const candidate = `${base}${extension}`;
		if (known.has(candidate)) return candidate;
	}
	return undefined;
}

/** One import specifier → the file or engine it names, or undefined for a third-party module. */
function resolveSpecifier(specifier: string, from: string, known: ReadonlySet<string>): string | undefined {
	const engine = ENGINE.exec(specifier);
	if (engine) return `@delacour/react-native-${engine[1]}`;
	if (specifier.startsWith(".")) return resolve(normalize(join(dirname(from), specifier)), known);
	if (!specifier.startsWith(UI_PACKAGE)) return undefined;
	const subpath = specifier.slice(UI_PACKAGE.length);
	return resolve(`${UI}/components/${subpath}`, known) ?? resolve(`${UI}/${subpath}`, known);
}

export function buildImportGraph(files: readonly SourceFile[]): ImportGraph {
	const known = new Set(files.map((file) => file.path));
	const graph = new Map<string, Set<string>>();
	for (const file of files) {
		const targets = [...file.code.matchAll(SPECIFIER)].map(([, specifier]) =>
			specifier === undefined ? undefined : resolveSpecifier(specifier, file.path, known)
		);
		graph.set(file.path, new Set(targets.filter((t): t is string => t !== undefined && t !== file.path)));
	}
	return graph;
}

/** The component a file's pixels belong to, if it is one component's source, demo or spec. */
function componentOf(path: string): string | undefined {
	const folder = new RegExp(`^(?:${UI}/components|${DEMOS})/([^/]+)/`).exec(path);
	if (folder) return folder[1];
	return new RegExp(`^${SPECS}/([^/]+)\\.e2e\\.ts$`).exec(path)?.[1];
}

function importersOf(graph: ImportGraph): Map<string, string[]> {
	const importers = new Map<string, string[]>();
	for (const [file, edges] of graph) {
		for (const edge of edges) importers.set(edge, [...(importers.get(edge) ?? []), file]);
	}
	return importers;
}

/** Every component a seed reaches by following importers, breadth first. */
function componentsReachedFrom(seed: string, importers: ReadonlyMap<string, readonly string[]>): string[] {
	const found: string[] = [];
	const seen = new Set([seed]);
	const queue = [seed];
	for (let node = queue.shift(); node !== undefined; node = queue.shift()) {
		const name = componentOf(node);
		if (name !== undefined) found.push(name);
		const next = (importers.get(node) ?? []).filter((importer) => !seen.has(importer));
		for (const importer of next) seen.add(importer);
		queue.push(...next);
	}
	return found;
}

/** The graph node a changed file starts from: an engine file stands for its whole package. */
function seedOf(path: string): { seed: string; force: boolean } {
	const engine = ENGINE_PATH.exec(path);
	if (engine) return { force: true, seed: `@delacour/react-native-${engine[1]}` };
	return { force: path.startsWith(`${UI}/`), seed: path };
}

export function affectedPreviews(input: {
	changed: readonly string[];
	graph: ImportGraph;
	/** Components with a preview spec — the only ones a run can capture. */
	previewed: ReadonlySet<string>;
}): Affected {
	const changed = input.changed.filter((path) => !isExempt(path));
	const everything = changed.find(touchesEverything);
	if (everything !== undefined) return { kind: "all", via: everything };

	const importers = importersOf(input.graph);
	const reached = new Map<string, string>();
	let force = false;
	for (const path of changed) {
		const { seed, force: needsForce } = seedOf(path);
		force ||= needsForce;
		for (const name of componentsReachedFrom(seed, importers)) if (!reached.has(name)) reached.set(name, path);
	}

	const components = [...reached]
		.filter(([name]) => input.previewed.has(name))
		.map(([name, via]) => ({ name, via }))
		.sort((a, b) => a.name.localeCompare(b.name));
	if (components.length === 0) return { kind: "none" };
	return { components, force, kind: "components" };
}

/** The recapture command for a result, or undefined when there is nothing to recapture. */
export function recaptureCommand(affected: Affected): string | undefined {
	switch (affected.kind) {
		case "none":
			return undefined;
		case "all":
			return "bun run previews -- -- --force --headless";
		case "components": {
			const only = affected.components.map((c) => c.name).join(",");
			return `bun run previews -- -- --only ${only}${affected.force ? " --force" : ""} --headless`;
		}
	}
}

async function lines(command: ReturnType<typeof $>): Promise<string[]> {
	return (await command.quiet().text()).split("\n").filter(Boolean);
}

async function changedFiles(base: string): Promise<string[]> {
	const mergeBase = (await lines($`git merge-base ${base} HEAD`))[0] ?? base;
	const committedAndStaged = await lines($`git diff --name-only ${mergeBase}`);
	const untracked = await lines($`git ls-files --others --exclude-standard`);
	return [...new Set([...committedAndStaged, ...untracked])];
}

async function readSources(): Promise<SourceFile[]> {
	const files: SourceFile[] = [];
	for (const root of [UI, DEMOS]) {
		for await (const path of new Bun.Glob(`${root}/**/*.{ts,tsx}`).scan()) {
			if (!isExempt(path)) files.push({ code: await Bun.file(path).text(), path });
		}
	}
	return files;
}

async function previewedComponents(): Promise<Set<string>> {
	const previewed = new Set<string>();
	for await (const path of new Bun.Glob(`${SPECS}/*.e2e.ts`).scan()) {
		const name = componentOf(path);
		if (name !== undefined) previewed.add(name);
	}
	return previewed;
}

function print(affected: Affected, base: string): void {
	if (affected.kind === "none") {
		console.log(`No preview media is stale against ${base}.`);
		return;
	}
	if (affected.kind === "all") console.log(`${affected.via} is drawn by every capture.`);
	else {
		const width = Math.max(...affected.components.map((c) => c.name.length));
		for (const { name, via } of affected.components) console.log(`${name.padEnd(width)}  ${via}`);
	}
	console.log(`\n${recaptureCommand(affected)}`);
}

async function main(): Promise<void> {
	const argv = Bun.argv.slice(2);
	const baseFlag = argv.indexOf("--base");
	const base = baseFlag === -1 ? "origin/develop" : argv[baseFlag + 1];
	if (base === undefined) throw new Error("--base needs a ref");

	const affected = affectedPreviews({
		changed: await changedFiles(base),
		graph: buildImportGraph(await readSources()),
		previewed: await previewedComponents(),
	});
	if (argv.includes("--json"))
		console.log(JSON.stringify({ ...affected, command: recaptureCommand(affected) ?? null }, null, 2));
	else print(affected, base);
}

if (import.meta.main) await main();
