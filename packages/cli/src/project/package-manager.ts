import { x } from "tinyexec";
import { type Channel, CLI_CHANNEL } from "./channel";
import type { PackageJson, PackageManager } from "./detect";

/**
 * Installing dependencies, split by how they have to be installed.
 *
 * The `expo install` route is the reason this file is not one line. Expo pins
 * every native module to a version its SDK can build, and a plain `npm install
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
const EXPO_BIN: Record<PackageManager, [string, string[]]> = {
	bun: ["bunx", ["expo"]],
	pnpm: ["pnpm", ["expo"]],
	yarn: ["yarn", ["expo"]],
	npm: ["npx", ["expo"]],
};

/**
 * An Expo CLI call as the project's own package manager spells it, for
 * advice the CLI prints — `pnpm expo run:ios`, not an `npx` a pnpm user has to
 * translate.
 */
export function expoCommand(packageManager: PackageManager, args: readonly string[]): string {
	const [command, prefix] = EXPO_BIN[packageManager];
	return [command, ...prefix, ...args].join(" ");
}

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
const DELACOUR_PACKAGES: ReadonlySet<string> = new Set([
	"@delacour/react-native-bottom-sheet",
	"@delacour/react-native-charts",
	"@delacour/react-native-ui",
]);

/**
 * The range each plain npm package the library depends on installs at — the
 * one `@delacour/react-native-ui`'s own `package.json` declares.
 *
 * Untagged, `add` took npm's newest major: tailwind-variants 4.0.0 moved
 * `twMergeConfig` to another entry point and every copied `*.variants.ts`
 * broke in someone else's app. The library has since moved to 4, and the
 * pin stays so the next major cannot do the same. Applied to the args only,
 * like the alpha tag.
 * `package-manager.test.ts` fails when one drifts from the library's range.
 */
export const NPM_RANGES: Readonly<Record<string, string>> = {
	"@central-icons-react-native/round-outlined-radius-1-stroke-1.5": "^1.1",
	cn: "^0.5.0",
	tailwindcss: "^4",
	"tailwind-merge": "^3.6.0",
	"tailwind-variants": "^4.0.0",
};

/** A package name with the dist-tag its channel pins, or the range the library declares. */
function toSpec(name: string, channel: Channel): string {
	if (channel === "alpha" && DELACOUR_PACKAGES.has(name)) return `${name}@alpha`;
	const range = NPM_RANGES[name];
	return range ? `${name}@${range}` : name;
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
 * stable version, so it holds on either channel. A package `NPM_RANGES` pins
 * declares that range, so the peer does not admit the major the install avoids.
 */
export function peerRange(name: string): string {
	if (DELACOUR_PACKAGES.has(name)) return ">=0.0.0-0";
	return NPM_RANGES[name] ?? "*";
}

export function installCommands(request: InstallRequest): InstallGroup[] {
	const groups: InstallGroup[] = [];
	const channel = request.channel ?? CLI_CHANNEL;
	const spec = (name: string): string => toSpec(name, channel);
	const [addCommand, addArgs] = ADD[request.packageManager];

	if (request.expoDependencies.length > 0) {
		const [command, prefix] = EXPO_BIN[request.packageManager];
		groups.push({
			label: "expo install",
			command,
			args: [...prefix, "install", ...request.expoDependencies.map(spec)],
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
