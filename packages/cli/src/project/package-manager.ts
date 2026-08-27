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

export function installCommands(request: InstallRequest): InstallGroup[] {
	const groups: InstallGroup[] = [];
	const [addCommand, addArgs] = ADD[request.packageManager];

	if (request.expoDependencies.length > 0) {
		const [command, args] = EXPO_RUNNER[request.packageManager];
		groups.push({
			label: "expo install",
			command,
			args: [...args, ...request.expoDependencies],
			packages: [...request.expoDependencies],
		});
	}

	if (request.dependencies.length > 0) {
		groups.push({
			label: `${addCommand} add`,
			command: addCommand,
			args: [...addArgs, ...request.dependencies],
			packages: [...request.dependencies],
		});
	}

	if (request.devDependencies.length > 0) {
		groups.push({
			label: `${addCommand} add --dev`,
			command: addCommand,
			args: [...addArgs, DEV_FLAG[request.packageManager], ...request.devDependencies],
			packages: [...request.devDependencies],
		});
	}

	return groups;
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
