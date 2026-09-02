import { x } from "tinyexec";
import type { PackageJson, PackageManager } from "./detect";

/**
 * Installing dependencies, split by how they have to be installed.
 *
 * The `expo install` route is the reason this file is not one line. Expo pins
 * every native module to a version its SDK can build, and `bun add
 * react-native-reanimated` fetches the newest release instead — which for
 * anything but the current SDK is a package that fails at the linker rather
 * than at install time. `expo install` asks the SDK what it supports and
 * installs that.
 *
 * Packages also go into the **app**, never into the shared package the
 * components might live in. A native module resolved from two places registers
 * twice and breaks at runtime; the app owns exactly one copy of each.
 */

export type InstallGroup = {
	label: string;
	command: string;
	args: string[];
	packages: string[];
};

export type InstallRequest = {
	packageManager: PackageManager;
	/** Version-matched to the Expo SDK. */
	expoDependencies: readonly string[];
	dependencies: readonly string[];
	devDependencies: readonly string[];
};

const ADD: Record<PackageManager, [string, string[]]> = {
	bun: ["bun", ["add"]],
	pnpm: ["pnpm", ["add"]],
	yarn: ["yarn", ["add"]],
	npm: ["npm", ["install"]],
};

const DEV_FLAG: Record<PackageManager, string> = {
	bun: "--dev",
	pnpm: "--save-dev",
	yarn: "--dev",
	npm: "--save-dev",
};

/** `expo` is a dependency of the app, so each of these runs the locally installed CLI. */
const EXPO_RUNNER: Record<PackageManager, [string, string[]]> = {
	bun: ["bunx", ["expo", "install"]],
	pnpm: ["pnpm", ["expo", "install"]],
	yarn: ["yarn", ["expo", "install"]],
	npm: ["npx", ["expo", "install"]],
};

/**
 * Packages whose `latest` deliberately points at nothing.
 *
 * This repository is in Changesets pre mode, so `@delacour/charts` publishes to
 * the `alpha` dist-tag and `latest` is empty — a bare `bun add @delacour/charts`
 * fails outright. It has never bitten because no registry item had ever depended
 * on a Delacour package until `chart`.
 *
 * Applied to the command's ARGS only, never to `packages`: `missingPackages`
 * compares bare names against the project's own `package.json`, and a tagged
 * spec there would never match anything and would reinstall on every run.
 *
 * Delete this map when `changeset pre exit` runs — see the root AGENTS.md.
 */
const DIST_TAG: Record<string, string> = {
	"@delacour/charts": "alpha",
};

/** A package name with its pinned dist-tag, where it has one. */
function toSpec(name: string): string {
	const tag = DIST_TAG[name];
	return tag === undefined ? name : `${name}@${tag}`;
}

export function installCommands(request: InstallRequest): InstallGroup[] {
	const groups: InstallGroup[] = [];
	const [addCommand, addArgs] = ADD[request.packageManager];

	if (request.expoDependencies.length > 0) {
		const [command, args] = EXPO_RUNNER[request.packageManager];
		groups.push({
			label: "expo install",
			command,
			args: [...args, ...request.expoDependencies.map(toSpec)],
			packages: [...request.expoDependencies],
		});
	}

	if (request.dependencies.length > 0) {
		groups.push({
			label: `${addCommand} add`,
			command: addCommand,
			args: [...addArgs, ...request.dependencies.map(toSpec)],
			packages: [...request.dependencies],
		});
	}

	if (request.devDependencies.length > 0) {
		groups.push({
			label: `${addCommand} add --dev`,
			command: addCommand,
			args: [...addArgs, DEV_FLAG[request.packageManager], ...request.devDependencies.map(toSpec)],
			packages: [...request.devDependencies],
		});
	}

	return groups;
}

/**
 * What a set of components needs from npm, and what is left to do about it.
 *
 * Separated from `installCommands` because the report is now the default and
 * the install is the opt-in: `add` prints this whether or not it goes on to run
 * anything, so the same numbers describe a run that installed, a run that was
 * declined, and a run where the project already had everything.
 *
 * `satisfied` is not noise. A component listing five native modules and needing
 * none of them installed is the common case, and saying so is the difference
 * between "this needs nothing" and "this printed nothing".
 */
export type DependencyPlan = {
	/** Every package the components need, satisfied or not. */
	wanted: string[];
	/** Already in the project's `package.json`. */
	satisfied: string[];
	/** Not there yet — the union of every group's packages. */
	missing: string[];
	/** One command per install route, covering `missing` only. */
	groups: InstallGroup[];
};

export function planDependencies(request: InstallRequest, packageJson: PackageJson | null): DependencyPlan {
	const groups = installCommands({
		packageManager: request.packageManager,
		expoDependencies: missingPackages(packageJson, request.expoDependencies),
		dependencies: missingPackages(packageJson, request.dependencies),
		devDependencies: missingPackages(packageJson, request.devDependencies),
	});

	const wanted = unique([...request.expoDependencies, ...request.dependencies, ...request.devDependencies]);
	const missing = unique(groups.flatMap((group) => group.packages));
	const missingSet = new Set(missing);

	return { wanted, satisfied: wanted.filter((name) => !missingSet.has(name)), missing, groups };
}

/** A group as the line someone could paste into a terminal. */
export function commandLine(group: InstallGroup): string {
	return `${group.command} ${group.args.join(" ")}`;
}

function unique(names: readonly string[]): string[] {
	return [...new Set(names)].sort();
}

/** The packages in `wanted` that the project does not already have. */
export function missingPackages(packageJson: PackageJson | null, wanted: readonly string[]): string[] {
	const installed = new Set([
		...Object.keys(packageJson?.dependencies ?? {}),
		...Object.keys(packageJson?.devDependencies ?? {}),
	]);

	return wanted.filter((name) => !installed.has(name));
}

export type RunOptions = {
	cwd: string;
	silent?: boolean;
};

export async function runInstall(group: InstallGroup, options: RunOptions): Promise<void> {
	const result = await x(group.command, group.args, {
		nodeOptions: { cwd: options.cwd, stdio: options.silent ? "pipe" : "inherit" },
		throwOnError: false,
	});

	if (result.exitCode !== 0) {
		const detail = options.silent ? `\n${result.stderr.trim()}` : "";
		throw new Error(`\`${group.command} ${group.args.join(" ")}\` failed with exit code ${result.exitCode}.${detail}`);
	}
}
