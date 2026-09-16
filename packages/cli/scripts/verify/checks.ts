import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { readConfig } from "../../src/config/resolve";
import { CONFIG_FILENAME } from "../../src/config/schema";
import { classifySource } from "../../src/registry/classify";
import { NAMESPACES } from "../../src/registry/namespaces";
import { scanImports } from "../../src/registry/scan-imports";
import { type RegistryItem, registryIndexSchema, registryItemSchema } from "../../src/registry/schema";
import { type Reporter, run } from "./harness";

/**
 * What "the CLI works" actually means, stated as assertions.
 *
 * Each check answers a question the unit tests cannot: they run against a
 * fixture with no `node_modules`, so an import naming an uninstalled package
 * looks exactly like one naming an installed package. Here there is a real
 * dependency tree to resolve against.
 */

export type CheckContext = {
	/** The Expo app: Metro, the CSS entry, `tsc`, `doctor`. */
	appDir: string;
	/** Where the config and the components are — the same as `appDir` unless they are in a package. */
	configDir: string;
	/** The project's outermost directory. Bounds the module walk. */
	workspaceRoot: string;
	registryDir: string;
	/** The items requested, or `null` for `--all`. */
	only: string[] | null;
	reporter: Reporter;
};

export type CheckResult = {
	ok: boolean;
	summary: string;
	details?: string[];
};

export type Check = {
	name: string;
	/** Meaningless without a dependency tree to resolve against. */
	needsInstall?: boolean;
	run(context: CheckContext): Promise<CheckResult>;
};

/** Packages every React Native app has, which no item needs to declare. */
const AMBIENT = new Set(["react", "react-native", "react/jsx-runtime"]);

export const CHECKS: Check[] = [
	{
		name: "Every registry item matches the published schema",
		async run({ registryDir }) {
			const index = registryIndexSchema.safeParse(
				JSON.parse(await readFile(join(registryDir, "registry.json"), "utf-8"))
			);
			if (!index.success) {
				return { ok: false, summary: "registry.json does not match the index schema", details: issues(index.error) };
			}

			const problems: string[] = [];
			for (const entry of index.data.items) {
				const raw = JSON.parse(await readFile(join(registryDir, "r", `${entry.name}.json`), "utf-8"));
				const item = registryItemSchema.safeParse(raw);

				if (!item.success) problems.push(`${entry.name}: ${issues(item.error).join("; ")}`);
				else if (item.data.files.length === 0) problems.push(`${entry.name}: no files`);
			}

			return problems.length === 0
				? { ok: true, summary: `${index.data.items.length} items valid` }
				: { ok: false, summary: `${problems.length} invalid`, details: problems };
		},
	},

	{
		name: "The index and the item files agree",
		async run({ registryDir }) {
			const index = registryIndexSchema.parse(JSON.parse(await readFile(join(registryDir, "registry.json"), "utf-8")));
			const onDisk = (await readdir(join(registryDir, "r")))
				.filter((name) => name.endsWith(".json"))
				.map((name) => name.replace(/\.json$/, ""))
				.sort();

			const listed = index.items.map((item) => item.name).sort();
			const missing = listed.filter((name) => !onDisk.includes(name));
			const orphaned = onDisk.filter((name) => !listed.includes(name));

			return missing.length === 0 && orphaned.length === 0
				? { ok: true, summary: `${listed.length} items, index and files match` }
				: {
						ok: false,
						summary: "index and item files disagree",
						details: [
							...missing.map((name) => `listed but no file: ${name}`),
							...orphaned.map((name) => `file but not listed: ${name}`),
						],
					};
		},
	},

	{
		name: "Every item's files exist in the library, and no library file is dropped",
		async run({ registryDir }) {
			const index = registryIndexSchema.parse(JSON.parse(await readFile(join(registryDir, "registry.json"), "utf-8")));
			const referenced = new Set<string>();

			for (const entry of index.items) {
				const item = registryItemSchema.parse(
					JSON.parse(await readFile(join(registryDir, "r", `${entry.name}.json`), "utf-8"))
				);
				for (const file of item.files) referenced.add(file.path);
			}

			// The registry serves the library itself, so `files[].path` resolves
			// against the ref — the directory holding `registry/`, which on disk is
			// the repository root.
			const repoRoot = dirname(registryDir);
			const libraryRoot = join(repoRoot, "packages", "native-ui", "src");

			const library = new Set(
				(await readdir(libraryRoot, { recursive: true, withFileTypes: true }))
					.filter((entry) => entry.isFile())
					.map((entry) => relative(libraryRoot, join(entry.parentPath, entry.name)).split(sep).join("/"))
					.filter((path) => classifySource(path) !== null)
					.map((path) => `packages/native-ui/src/${path}`)
			);

			// An item naming a file that is not there is a 404 mid-copy. A library
			// file no item names is a component the registry silently drops —
			// which is what a renamed folder looks like before anyone notices.
			const missing = [...referenced].filter((path) => !existsSync(join(repoRoot, path))).sort();
			const dropped = [...library].filter((path) => !referenced.has(path)).sort();

			return missing.length === 0 && dropped.length === 0
				? { ok: true, summary: `${referenced.size} library files, all referenced` }
				: {
						ok: false,
						summary: "items and the library disagree",
						details: [
							...missing.map((path) => `referenced but not in the library: ${path}`),
							...dropped.map((path) => `in the library but no item names it: ${path}`),
						].slice(0, 20),
					};
		},
	},

	{
		name: "Every requested item landed on disk",
		async run(context) {
			const { config, items } = await loadTarget(context);
			const missing: string[] = [];

			for (const item of items) {
				for (const file of item.files) {
					const path = join(config.directories[file.namespace], file.target);
					if (!existsSync(path)) missing.push(`${item.name}: ${file.namespace}/${file.target}`);
				}
			}

			const total = items.reduce((count, item) => count + item.files.length, 0);
			return missing.length === 0
				? { ok: true, summary: `${total} files from ${items.length} items` }
				: { ok: false, summary: `${missing.length} missing`, details: missing.slice(0, 20) };
		},
	},

	{
		name: "No placeholder or source-package reference survived",
		async run(context) {
			const problems: string[] = [];

			for (const { path, content, display } of await copiedFiles(context)) {
				if (content.includes("@registry/")) problems.push(`${display}: unresolved @registry/ placeholder`);
				if (content.includes("@delacour/native-ui")) problems.push(`${display}: still cites @delacour/native-ui`);
				if (path.endsWith(".test.ts") || path.endsWith(".test.tsx")) problems.push(`${display}: a test was copied`);
			}

			return problems.length === 0
				? { ok: true, summary: "every import points at the consumer's own tree" }
				: { ok: false, summary: `${problems.length} problems`, details: problems.slice(0, 20) };
		},
	},

	{
		name: "Every relative import resolves to a file that exists",
		async run(context) {
			const problems: string[] = [];

			for (const { path, content, display } of await copiedFiles(context)) {
				if (!isTypeScript(path)) continue;

				for (const { specifier } of scanImports(content)) {
					if (!specifier.startsWith(".")) continue;
					if (!resolveRelative(dirname(path), specifier)) problems.push(`${display} → ${specifier}`);
				}
			}

			return problems.length === 0
				? { ok: true, summary: "no dangling relative imports" }
				: { ok: false, summary: `${problems.length} unresolved`, details: problems.slice(0, 20) };
		},
	},

	{
		name: "Every package imported is actually installed",
		needsInstall: true,
		async run(context) {
			const config = await readConfig(join(context.configDir, CONFIG_FILENAME));
			const problems = new Set<string>();

			// An aliased import looks exactly like a scoped package: `@/lib/cn`
			// parses as scope `@`, name `lib`. The configured aliases are the only
			// way to tell them apart, so they come from the config the CLI wrote.
			const aliases = Object.values(config.aliases).filter((alias): alias is string => Boolean(alias));

			for (const { path, content, display } of await copiedFiles(context)) {
				if (!isTypeScript(path)) continue;

				for (const { specifier } of scanImports(content)) {
					if (specifier.startsWith(".") || specifier.startsWith("node:")) continue;
					if (AMBIENT.has(specifier)) continue;
					if (aliases.some((alias) => specifier === alias || specifier.startsWith(`${alias}/`))) continue;

					const name = packageName(specifier);
					if (!isInstalled(name, context)) problems.add(`${name} — imported by ${display}`);
				}
			}

			return problems.size === 0
				? { ok: true, summary: "every imported package is present in node_modules" }
				: {
						ok: false,
						summary: `${problems.size} missing — the registry did not declare them`,
						details: [...problems],
					};
		},
	},

	{
		name: "The app is wired up (delacour doctor)",
		needsInstall: true,
		async run({ configDir, reporter }) {
			const bundle = join(import.meta.dirname, "../../dist/index.js");
			// From the config, not the app: `findConfig` walks *up*, and in the
			// shared-package layout the config is a sibling of the app rather than
			// an ancestor. `doctor` finds the app through `app.root` regardless.
			const output = await run("node", [bundle, "doctor", "--json", "--fast"], {
				cwd: configDir,
				reporter,
				label: "delacour doctor",
				// doctor exits 1 exactly when it has findings, which is the case
				// this check exists to report.
				allowFailure: true,
			});

			const json = output.slice(output.indexOf("["), output.lastIndexOf("]") + 1);
			let checks: { name: string; status: string; detail: string }[];
			try {
				checks = JSON.parse(json);
			} catch {
				return { ok: false, summary: "doctor produced no parseable report", details: [output.slice(0, 400)] };
			}

			// The gesture root lives in the consumer's own layout, which this
			// scaffold deliberately does not write — the CLI never creates it.
			const failed = checks.filter((check) => check.status === "fail");

			return failed.length === 0
				? { ok: true, summary: `${checks.filter((c) => c.status === "pass").length} checks passed` }
				: {
						ok: false,
						summary: `${failed.length} doctor checks failed`,
						details: failed.map((check) => `${check.name}: ${check.detail}`),
					};
		},
	},

	{
		name: "The whole app typechecks",
		needsInstall: true,
		async run({ appDir, reporter }) {
			try {
				await run("bun", ["x", "tsc", "--noEmit"], { cwd: appDir, reporter, label: "tsc" });
				return { ok: true, summary: "tsc --noEmit clean across every copied component" };
			} catch (error) {
				const message = (error as Error).message;
				const lines = message
					.split("\n")
					.filter((line) => line.includes("error TS"))
					.slice(0, 15);

				return { ok: false, summary: "tsc reported errors", details: lines.length > 0 ? lines : [message] };
			}
		},
	},
];

/**
 * Items `--all` does not reach: everything that is not a component and that no
 * component depends on. Named explicitly so a verification run covers the whole
 * registry rather than most of it.
 */
export async function standaloneItems(registryDir: string, _appDir: string): Promise<string[]> {
	const index = registryIndexSchema.parse(JSON.parse(await readFile(join(registryDir, "registry.json"), "utf-8")));
	const reached = new Set<string>();

	const visit = (name: string) => {
		if (reached.has(name)) return;
		reached.add(name);
		const item = index.items.find((entry) => entry.name === name);
		for (const dependency of item?.registryDependencies ?? []) visit(dependency);
	};

	for (const item of index.items) {
		if (item.type === "registry:ui") visit(item.name);
	}

	return index.items.filter((item) => !reached.has(item.name)).map((item) => item.name);
}

/**
 * Whether a package is resolvable from the app, the way Node resolves it.
 *
 * Walks up through each `node_modules`, because a hoisted workspace installs to
 * the root rather than to the app — checking only the app's own directory
 * reports every shared dependency missing.
 *
 * **Bounded at the project root**, and that bound is load-bearing: the scaffold
 * lives inside this repository, so an unbounded walk would find this repo's own
 * `node_modules` and pass for a package the project never installed.
 */
function isInstalled(name: string, context: CheckContext): boolean {
	let directory = context.appDir;

	while (true) {
		if (existsSync(join(directory, "node_modules", name))) return true;
		if (directory === context.workspaceRoot) return false;

		const parent = dirname(directory);
		if (parent === directory) return false;
		directory = parent;
	}
}

type CopiedFile = { path: string; display: string; content: string };

/** Every file the CLI wrote, across all five namespaces. */
async function copiedFiles(context: CheckContext): Promise<CopiedFile[]> {
	const config = await readConfig(join(context.configDir, CONFIG_FILENAME));
	const files: CopiedFile[] = [];

	for (const namespace of NAMESPACES) {
		const root = config.directories[namespace];
		if (!existsSync(root)) continue;

		for (const entry of await readdir(root, { recursive: true, withFileTypes: true })) {
			if (!entry.isFile()) continue;
			const path = join(entry.parentPath, entry.name);
			files.push({
				path,
				display: path.slice(context.appDir.length + 1),
				content: await readFile(path, "utf-8"),
			});
		}
	}

	return files;
}

async function loadTarget(
	context: CheckContext
): Promise<{ config: Awaited<ReturnType<typeof readConfig>>; items: RegistryItem[] }> {
	const config = await readConfig(join(context.configDir, CONFIG_FILENAME));
	const names = (await readdir(join(context.registryDir, "r")))
		.filter((name) => name.endsWith(".json"))
		.map((name) => name.replace(/\.json$/, ""));

	const items: RegistryItem[] = [];
	for (const name of names) {
		items.push(
			registryItemSchema.parse(JSON.parse(await readFile(join(context.registryDir, "r", `${name}.json`), "utf-8")))
		);
	}

	// With `--only`, the closure was copied but the rest was not, so assert on
	// what was actually asked for plus whatever it pulled in.
	if (!context.only) return { config, items };

	const wanted = new Set<string>();
	const visit = (name: string) => {
		if (wanted.has(name)) return;
		wanted.add(name);
		for (const dependency of items.find((item) => item.name === name)?.registryDependencies ?? []) visit(dependency);
	};
	for (const name of context.only) visit(name);

	return { config, items: items.filter((item) => wanted.has(item.name)) };
}

/** `.ts`/`.tsx` only — CSS and Markdown carry no module specifiers. */
function isTypeScript(path: string): boolean {
	return (path.endsWith(".ts") || path.endsWith(".tsx")) && !path.endsWith(".d.ts");
}

function resolveRelative(from: string, specifier: string): boolean {
	const base = resolve(from, specifier);
	const candidates = [
		base,
		`${base}.ts`,
		`${base}.tsx`,
		`${base}.css`,
		join(base, "index.ts"),
		join(base, "index.tsx"),
	];
	return candidates.some((candidate) => existsSync(candidate));
}

function packageName(specifier: string): string {
	const segments = specifier.split("/");
	return specifier.startsWith("@") ? segments.slice(0, 2).join("/") : (segments[0] as string);
}

function issues(error: { issues: { path: PropertyKey[]; message: string }[] }): string[] {
	return error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`);
}
