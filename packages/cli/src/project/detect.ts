import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { type PathMapping, parsePathMappings } from "./aliases";
import { parseJsonc } from "./jsonc";

/**
 * Reads what the CLI needs to know about the project it has been pointed at.
 *
 * All of it is inferred rather than asked for, because every answer is already
 * written down somewhere: the package manager in the lockfile, the Expo SDK in
 * `package.json`, the aliases in `tsconfig.json`. `init` only prompts for the
 * things a project genuinely has not decided yet.
 */

export const PACKAGE_MANAGERS = ["bun", "pnpm", "yarn", "npm"] as const;
export type PackageManager = (typeof PACKAGE_MANAGERS)[number];

export type PackageJson = {
	name?: string;
	packageManager?: string;
	workspaces?: string[] | { packages?: string[] };
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
};

export type ProjectInfo = {
	cwd: string;
	/** Nearest directory with a `package.json`. */
	packageRoot: string | null;
	packageJson: PackageJson | null;
	/** Monorepo root, when this package is part of one. */
	workspaceRoot: string | null;
	packageManager: PackageManager;
	/** Nearest package that depends on `expo` — where Metro and the CSS entry live. */
	appRoot: string | null;
	expoVersion: string | null;
	reactNativeVersion: string | null;
	hasUniwind: boolean;
	hasTailwind: boolean;
	tsconfigPath: string | null;
	pathMappings: PathMapping[];
};

const LOCKFILES: [string, PackageManager][] = [
	["bun.lock", "bun"],
	["bun.lockb", "bun"],
	["pnpm-lock.yaml", "pnpm"],
	["yarn.lock", "yarn"],
	["package-lock.json", "npm"],
];

export async function detectProject(cwd: string): Promise<ProjectInfo> {
	const packageJsonPath = findUp(cwd, "package.json");
	const packageRoot = packageJsonPath ? dirname(packageJsonPath) : null;
	const packageJson = packageJsonPath ? await readJson<PackageJson>(packageJsonPath) : null;
	const workspaceRoot = await findWorkspaceRoot(packageRoot ?? cwd);
	const appRoot = await findAppRoot(cwd, workspaceRoot);
	const appPackage = appRoot ? await readJson<PackageJson>(join(appRoot, "package.json")) : null;

	const tsconfigPath = findUp(cwd, "tsconfig.json");
	const tsconfig = tsconfigPath ? await readJsonc<TsConfig>(tsconfigPath) : null;

	return {
		cwd,
		packageRoot,
		packageJson,
		workspaceRoot,
		packageManager: detectPackageManager(workspaceRoot ?? packageRoot ?? cwd, packageJson),
		appRoot,
		expoVersion: versionOf(appPackage ?? packageJson, "expo"),
		reactNativeVersion: versionOf(appPackage ?? packageJson, "react-native"),
		hasUniwind: versionOf(appPackage ?? packageJson, "uniwind") !== null,
		hasTailwind: versionOf(appPackage ?? packageJson, "tailwindcss") !== null,
		tsconfigPath,
		pathMappings: tsconfigPath
			? parsePathMappings(tsconfig?.compilerOptions?.paths, dirname(tsconfigPath), tsconfig?.compilerOptions?.baseUrl)
			: [],
	};
}

/**
 * The lockfile decides, not the `packageManager` field.
 *
 * A `packageManager` line is a declaration of intent that can be stale or
 * inherited from a template; a lockfile is what actually installed the tree the
 * CLI is about to add to.
 */
export function detectPackageManager(root: string, packageJson: PackageJson | null): PackageManager {
	for (const [lockfile, manager] of LOCKFILES) {
		if (existsSync(join(root, lockfile))) return manager;
	}

	const declared = packageJson?.packageManager?.split("@")[0];
	if (declared && (PACKAGE_MANAGERS as readonly string[]).includes(declared)) return declared as PackageManager;

	return "npm";
}

/** Walks up looking for a directory that declares workspaces. */
async function findWorkspaceRoot(from: string): Promise<string | null> {
	let directory = resolve(from);

	while (true) {
		if (existsSync(join(directory, "pnpm-workspace.yaml"))) return directory;

		const packageJson = await readJson<PackageJson>(join(directory, "package.json"));
		if (packageJson?.workspaces) return directory;

		const parent = dirname(directory);
		if (parent === directory) return null;
		directory = parent;
	}
}

/**
 * The Expo app, which is not always the package the CLI was run from.
 *
 * Components may live in a shared package; Metro, the CSS entry and the native
 * dependencies still belong to the app that consumes it. Checks upwards first,
 * then across the monorepo's `apps` directory.
 */
async function findAppRoot(cwd: string, workspaceRoot: string | null): Promise<string | null> {
	let directory = resolve(cwd);

	while (true) {
		const packageJson = await readJson<PackageJson>(join(directory, "package.json"));
		if (packageJson && versionOf(packageJson, "expo")) return directory;

		const parent = dirname(directory);
		if (parent === directory || (workspaceRoot && directory === workspaceRoot)) break;
		directory = parent;
	}

	if (!workspaceRoot) return null;
	return findExpoPackageIn(join(workspaceRoot, "apps"));
}

async function findExpoPackageIn(directory: string): Promise<string | null> {
	const { readdir } = await import("node:fs/promises");

	let entries: string[];
	try {
		entries = await readdir(directory);
	} catch {
		return null;
	}

	for (const entry of entries.sort()) {
		const candidate = join(directory, entry);
		const packageJson = await readJson<PackageJson>(join(candidate, "package.json"));
		if (packageJson && versionOf(packageJson, "expo")) return candidate;
	}

	return null;
}

export function versionOf(packageJson: PackageJson | null, name: string): string | null {
	if (!packageJson) return null;
	return packageJson.dependencies?.[name] ?? packageJson.devDependencies?.[name] ?? null;
}

/** `~57.0.15` → `57`. `null` when the range names no major, as `catalog:` does. */
export function majorOf(range: string | null): number | null {
	const match = /(\d+)\./.exec(range ?? "");
	return match?.[1] ? Number(match[1]) : null;
}

export function findUp(from: string, filename: string): string | null {
	let directory = resolve(from);

	while (true) {
		const candidate = join(directory, filename);
		if (existsSync(candidate)) return candidate;

		const parent = dirname(directory);
		if (parent === directory) return null;
		directory = parent;
	}
}

type TsConfig = {
	compilerOptions?: { baseUrl?: string; paths?: Record<string, string[]> };
};

async function readJson<T>(path: string): Promise<T | null> {
	try {
		return JSON.parse(await readFile(path, "utf-8")) as T;
	} catch {
		return null;
	}
}

async function readJsonc<T>(path: string): Promise<T | null> {
	try {
		return parseJsonc<T>(await readFile(path, "utf-8"));
	} catch {
		return null;
	}
}
