import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import type { ResolvedConfig } from "../config/resolve";
import { NAMESPACES } from "../registry/namespaces";
import { buildExportsMap, type WrittenFiles } from "./exports-map";
import { mergePackageJson, type PackageJson, sharedTsconfig } from "./package-scaffold";

/**
 * Keeps a shared components package consumable by the apps around it.
 *
 * Called after every write, so the `exports` map is derived from what is
 * actually on disk rather than from what the last `add` believed it wrote. A map
 * that drifts from the files is worse than none: the import resolves to nothing
 * and Metro reports a missing module, pointing at the app rather than here.
 *
 * Does nothing at all when the components live in the app itself — there is no
 * package boundary to cross, and the app imports them by alias or by relative
 * path as it always has.
 */

export type SyncResult = {
	packageJsonPath: string;
	exportCount: number;
	created: boolean;
};

export async function syncSharedPackage(config: ResolvedConfig, peers: readonly string[]): Promise<SyncResult | null> {
	if (!config.package) return null;

	const path = join(config.root, "package.json");
	const existing = await readJson<PackageJson>(path);

	const merged = mergePackageJson(existing, {
		name: config.package.name,
		exports: buildExportsMap(config.paths, await collectWritten(config)),
		peers,
	});

	await mkdir(config.root, { recursive: true });
	await writeFile(path, `${JSON.stringify(merged, null, "\t")}\n`, "utf-8");

	const tsconfigPath = join(config.root, "tsconfig.json");
	if (!existsSync(tsconfigPath)) {
		await writeFile(tsconfigPath, `${JSON.stringify(sharedTsconfig(), null, "\t")}\n`, "utf-8");
	}

	return {
		packageJsonPath: path,
		exportCount: Object.keys(merged.exports ?? {}).length,
		created: existing === null,
	};
}

/**
 * Adds the shared package to the app's dependencies.
 *
 * `workspace:*` rather than a version: the package is never published, and the
 * package manager has to link the working copy so an edit is live without a
 * release. Left alone if the app already depends on it, however they spelled it.
 */
export async function linkPackageToApp(config: ResolvedConfig): Promise<boolean> {
	if (!config.package) return false;
	if (config.app.resolved.root === config.root) return false;

	const path = join(config.app.resolved.root, "package.json");
	const app = await readJson<PackageJson>(path);
	if (!app) return false;

	const name = config.package.name;
	if (app.dependencies?.[name] || app.peerDependencies?.[name]) return false;

	app.dependencies = sortedRecord({ ...app.dependencies, [name]: "workspace:*" });
	await writeFile(path, `${JSON.stringify(app, null, "\t")}\n`, "utf-8");

	return true;
}

/** Every file the CLI has written, per namespace, as namespace-relative targets. */
async function collectWritten(config: ResolvedConfig): Promise<WrittenFiles> {
	const written = {} as Record<(typeof NAMESPACES)[number], string[]>;

	for (const namespace of NAMESPACES) {
		const root = config.directories[namespace];
		// Only `ui` nests — one directory per component. The rest are flat, and
		// listing them recursively would double-count: `icons` sits inside `lib`
		// by default, so `central.ts` would be exported as both `./icons/central`
		// and `./lib/icons/central`, and the second one resolves to a file the
		// package does not mean to expose there.
		written[namespace] = existsSync(root) ? await listFiles(root, namespace === "ui") : [];
	}

	return written;
}

async function listFiles(root: string, recursive: boolean): Promise<string[]> {
	const entries = await readdir(root, { recursive, withFileTypes: true });

	return entries
		.filter((entry) => entry.isFile())
		.map((entry) => toPosix(relative(root, join(entry.parentPath, entry.name))))
		.sort();
}

async function readJson<T>(path: string): Promise<T | null> {
	try {
		return JSON.parse(await readFile(path, "utf-8")) as T;
	} catch {
		return null;
	}
}

function sortedRecord(record: Record<string, string>): Record<string, string> {
	return Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));
}

function toPosix(path: string): string {
	return sep === "/" ? path : path.split(sep).join("/");
}
