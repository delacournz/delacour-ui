import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { canonicaliseFile, canonicaliseMarkdown } from "./canonicalise";
import { classifySource, type SourceClassification } from "./classify";
import { ITEM_META, PACKAGE_INSTALL } from "./config";
import { applyRewrites, type Rewrite } from "./rewrite";
import type { RegistryFile, RegistryIndex, RegistryItem } from "./schema";
import { toIndexEntry } from "./schema";
import { sourceFilePath } from "./source";

/**
 * Builds the registry from `packages/native-ui/src`.
 *
 * There is no `registry.json` to maintain. The library already states which
 * files belong to a component (one folder, one `index.ts`) and which packages
 * it needs (its own `package.json`), so restating that by hand would only give
 * it somewhere to drift. Everything here is read off the source; the builder
 * throws rather than guessing wherever the source is ambiguous.
 *
 * Nor is there a copy of the source. An item names the library file itself, at
 * the ref the item was read from, and carries the specifier rewrites a consumer
 * has to apply to it. The canonicalised text is still produced here — as the
 * thing those rewrites are checked against, not as anything that ships.
 */

export type BuildOptions = {
	/** Absolute path to `packages/native-ui`. */
	packageRoot: string;
	/** The same directory, relative to the repository root — what `files[].path` is built from. */
	packageDir: string;
	homepage?: string;
};

export type BuildResult = {
	items: RegistryItem[];
	index: RegistryIndex;
};

const DEFAULT_HOMEPAGE = "https://github.com/delacournz/delacour-ui";

type SourceFile = {
	/** Path relative to `packages/native-ui/src`. */
	path: string;
	classification: SourceClassification;
};

export async function buildRegistry(options: BuildOptions): Promise<BuildResult> {
	const sourceRoot = join(options.packageRoot, "src");
	const packageJson = await readPackageJson(options.packageRoot);

	const sourcePaths = (await walk(sourceRoot)).sort();
	const packageSubpaths = collectPackageSubpaths(packageJson);

	const grouped = new Map<string, SourceFile[]>();
	for (const path of sourcePaths) {
		const classification = classifySource(path);
		if (!classification) continue;
		const bucket = grouped.get(classification.item) ?? [];
		bucket.push({ path, classification });
		grouped.set(classification.item, bucket);
	}

	const items: RegistryItem[] = [];

	for (const [name, sources] of [...grouped].sort(([a], [b]) => a.localeCompare(b))) {
		items.push(
			await buildItem({
				name,
				sources,
				sourceRoot,
				sourcePaths,
				packageSubpaths,
				packageDir: options.packageDir,
			})
		);
	}

	assertDependenciesResolve(items);

	return {
		items,
		index: {
			name: "delacour",
			homepage: options.homepage ?? DEFAULT_HOMEPAGE,
			items: items.map(toIndexEntry),
		},
	};
}

type BuildItemContext = {
	name: string;
	sources: SourceFile[];
	sourceRoot: string;
	sourcePaths: readonly string[];
	packageSubpaths: ReadonlyMap<string, string>;
	packageDir: string;
};

async function buildItem(context: BuildItemContext): Promise<RegistryItem> {
	const meta = ITEM_META[context.name];
	if (!meta) throw new Error(`No metadata for registry item "${context.name}" — add it to src/registry/config.ts`);

	const first = context.sources[0];
	if (!first) throw new Error(`Registry item "${context.name}" has no files`);

	const files: RegistryFile[] = [];
	const registryDependencies = new Set<string>();
	const bareImports = new Set<string>(meta.dependencies ?? []);

	for (const { path, classification } of context.sources) {
		const raw = await readFile(join(context.sourceRoot, path), "utf-8");

		// CSS carries no module specifiers a scanner could rewrite, and its own
		// `@import "./base.css"` siblings all land in the same directory anyway.
		// Markdown gets the prose rewrite only — it is documentation, not a module.
		const canonical = isTypeScript(path)
			? canonicaliseFile({
					path,
					content: raw,
					sourcePaths: context.sourcePaths,
					packageSubpaths: context.packageSubpaths,
				})
			: path.endsWith(".md")
				? { ...canonicaliseMarkdown(raw, context.packageSubpaths), registryDependencies: [], bareImports: [] }
				: { content: raw, rewrites: [], registryDependencies: [], bareImports: [] };

		for (const dependency of canonical.registryDependencies) registryDependencies.add(dependency);
		for (const bare of canonical.bareImports) bareImports.add(bare);

		assertRewritesReproduce(path, raw, canonical);

		files.push({
			path: sourceFilePath(context.packageDir, path),
			target: classification.target,
			namespace: classification.namespace,
			rewrites: canonical.rewrites,
		});
	}

	const { dependencies, expoDependencies, devDependencies } = classifyPackages(context.name, bareImports);

	return {
		name: context.name,
		type: first.classification.type,
		title: meta.title,
		description: meta.description,
		...(meta.categories ? { categories: meta.categories } : {}),
		registryDependencies: [...registryDependencies].sort(),
		dependencies,
		expoDependencies,
		devDependencies,
		files: files.sort((a, b) => a.target.localeCompare(b.target)),
	};
}

/**
 * The registry ships `rewrites` instead of a rewritten copy, so the two have to
 * agree — and only here can that be checked, where both the source and the
 * canonicalised text exist.
 *
 * The rewrite the builder applies is precise: it replaces a specifier at the
 * offset TypeScript reported it at. `applyRewrites` is a string substitution,
 * which is what keeps the compiler out of the published bundle. Where the two
 * could disagree — a quoted specifier somewhere other than an import — this
 * fails the build rather than shipping a file the consumer would receive
 * differently from the one we reviewed.
 */
function assertRewritesReproduce(path: string, raw: string, canonical: { content: string; rewrites: Rewrite[] }): void {
	if (applyRewrites(raw, canonical.rewrites) === canonical.content) return;

	throw new Error(
		`${path}: the rewrites do not reproduce the canonicalised file. A specifier is probably quoted somewhere other than an import.`
	);
}

/**
 * Sorts bare imports into the three install routes.
 *
 * An unlisted package throws. The alternative — defaulting to the package
 * manager — is how a native module ends up installed at a version the SDK
 * cannot build, which surfaces as a linker error in someone else's repo rather
 * than a failure here.
 */
function classifyPackages(
	item: string,
	bareImports: ReadonlySet<string>
): Pick<RegistryItem, "dependencies" | "expoDependencies" | "devDependencies"> {
	const dependencies = new Set<string>();
	const expoDependencies = new Set<string>();
	const devDependencies = new Set<string>();

	// Deduplicated by package name, not by specifier: `@legendapp/list/keyboard`
	// and `@legendapp/list/reanimated` are two imports of one dependency.
	for (const specifier of [...bareImports].sort()) {
		const packageName = toPackageName(specifier);
		const install = PACKAGE_INSTALL[packageName];

		if (!install) {
			throw new Error(
				`${item}: "${packageName}" is not classified — add it to PACKAGE_INSTALL in src/registry/config.ts`
			);
		}

		if (install === "expo") expoDependencies.add(packageName);
		else if (install === "npm") dependencies.add(packageName);
		else if (install === "dev") devDependencies.add(packageName);
	}

	return {
		dependencies: [...dependencies],
		expoDependencies: [...expoDependencies],
		devDependencies: [...devDependencies],
	};
}

/** `react-native-svg/css` → `react-native-svg`; `@scope/name/sub` → `@scope/name`. */
function toPackageName(specifier: string): string {
	const segments = specifier.split("/");
	return specifier.startsWith("@") ? segments.slice(0, 2).join("/") : (segments[0] as string);
}

/** Every registry dependency must name an item that exists, or `add` would 404 mid-copy. */
function assertDependenciesResolve(items: readonly RegistryItem[]): void {
	const names = new Set(items.map((item) => item.name));

	for (const item of items) {
		for (const dependency of item.registryDependencies) {
			if (!names.has(dependency)) {
				throw new Error(`${item.name} depends on "${dependency}", which is not a registry item`);
			}
		}
	}
}

/**
 * `@delacour/native-ui/button` → `components/button/index.ts`, read off the
 * package's own `exports` map so the two cannot disagree.
 */
function collectPackageSubpaths(packageJson: PackageJson): Map<string, string> {
	const subpaths = new Map<string, string>();
	const name = packageJson.name;
	if (!name) return subpaths;

	for (const [key, value] of Object.entries(packageJson.exports ?? {})) {
		if (typeof value !== "string" || !value.startsWith("./src/")) continue;
		subpaths.set(`${name}/${key.replace(/^\.\//, "")}`, value.slice("./src/".length));
	}

	return subpaths;
}

function isTypeScript(path: string): boolean {
	return (path.endsWith(".ts") || path.endsWith(".tsx")) && !path.endsWith(".d.ts");
}

type PackageJson = {
	name?: string;
	exports?: Record<string, unknown>;
};

async function readPackageJson(packageRoot: string): Promise<PackageJson> {
	return JSON.parse(await readFile(join(packageRoot, "package.json"), "utf-8")) as PackageJson;
}

/** Every file under `root`, as POSIX paths relative to it. */
async function walk(root: string): Promise<string[]> {
	const entries = await readdir(root, { recursive: true, withFileTypes: true });

	return entries
		.filter((entry) => entry.isFile())
		.map((entry) => relative(root, join(entry.parentPath, entry.name)).split(sep).join("/"));
}
