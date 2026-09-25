import { x } from "tinyexec";
import { type Channel, CLI_CHANNEL } from "./channel";
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
	/** The dist-tag line Delacour packages come from. Defaults to this build's own. */
	channel?: Channel;
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
 * The packages this repository publishes, which follow the CLI's channel.
 *
 * On the alpha channel they are installed as `name@alpha`: the snapshot a
 * merge to `develop` published, not the last stable release `latest` serves.
 * Everything else is always installed untagged.
 *
 * Applied to the command's ARGS only, never to `packages`: `missingPackages`
 * compares bare names against the project's own `package.json`, and a tagged
 * spec there would never match anything and would reinstall on every run.
 */
const DELACOUR_PACKAGES: ReadonlySet<string> = new Set(["@delacour/react-native-charts", "@delacour/react-native-ui"]);

/** A package name with the dist-tag its channel pins, where it has one. */
function toSpec(name: string, channel: Channel): string {
	return channel === "alpha" && DELACOUR_PACKAGES.has(name) ? `${name}@alpha` : name;
}

/**
 * The range a shared package declares for a peer it does not pin.
 *
 * `*` is the usual answer, and it is wrong for a Delacour package: semver's
 * `*` admits no prerelease, so a peer on `@delacour/react-native-charts`
 * written as `*` matches nothing an `x.y.z-alpha.N` can ever satisfy. Bun then
 * treats the peer as unmet and goes to the registry for a version that does
 * not exist — which is how `add` failed inside `expo install`, a step that
 * never named the package. `>=0.0.0-0` admits every prerelease and every
 * stable version, so it holds on either channel.
 */
export function peerRange(name: string): string {
	return DELACOUR_PACKAGES.has(name) ? ">=0.0.0-0" : "*";
}

export function installCommands(request: InstallRequest): InstallGroup[] {
	const groups: InstallGroup[] = [];
	const channel = request.channel ?? CLI_CHANNEL;
	const spec = (name: string): string => toSpec(name, channel);
	const [addCommand, addArgs] = ADD[request.packageManager];

	if (request.expoDependencies.length > 0) {
		const [command, args] = EXPO_RUNNER[request.packageManager];
		groups.push({
			label: "expo install",
			command,
			args: [...args, ...request.expoDependencies.map(spec)],
			packages: [...request.expoDependencies],
		});
	}

	if (request.dependencies.length > 0) {
		groups.push({
			label: `${addCommand} add`,
			command: addCommand,
			args: [...addArgs, ...request.dependencies.map(spec)],
			packages: [...request.dependencies],
		});
	}

	if (request.devDependencies.length > 0) {
		groups.push({
			label: `${addCommand} add --dev`,
			command: addCommand,
			args: [...addArgs, DEV_FLAG[request.packageManager], ...request.devDependencies.map(spec)],
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
		channel: request.channel,
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
