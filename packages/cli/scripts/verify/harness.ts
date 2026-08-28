import { mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { x } from "tinyexec";

/**
 * Scaffolding and process plumbing for `verify-expo.ts`.
 *
 * The app is written out by hand rather than through `create-expo-app`. A
 * generated template changes underneath us and pulls a router, a splash screen
 * and a dozen files none of this needs — and the point is to test the CLI, not
 * a template. What is here is the smallest thing that is genuinely an Expo app:
 * real dependencies from npm, the standard Metro config so `init` exercises its
 * *patch* path rather than its create path, and a `tsconfig` with the `@/*`
 * alias the Expo templates ship.
 */

export type Reporter = {
	step(message: string): void;
	pass(message: string): void;
	fail(message: string): void;
	detail(message: string): void;
	verbose: boolean;
};

/** Pinned to the SDK this monorepo develops against. */
const EXPO_SDK = "~57.0.15";

const PACKAGE_JSON = {
	name: "delacour-verify-app",
	version: "1.0.0",
	private: true,
	main: "index.ts",
	scripts: {
		start: "expo start",
		typecheck: "tsc --noEmit",
	},
	dependencies: {
		expo: EXPO_SDK,
		react: "19.2.3",
		"react-native": "0.86.2",
		// Uniwind and Tailwind are the styling foundation every component
		// resolves its classes through, so a real consumer has them before the
		// first `add`. Installed here rather than left to the CLI so the run
		// proves `init` copes with a project that already has them.
		uniwind: "^1.11.0",
		tailwindcss: "^4.3.3",
	},
	devDependencies: {
		"@types/react": "~19.2.2",
		typescript: "^5.9.3",
	},
};

const APP_JSON = {
	expo: {
		name: "delacour-verify-app",
		slug: "delacour-verify-app",
		scheme: "delacourverify",
		newArchEnabled: true,
		experiments: { tsconfigPaths: true },
	},
};

const TSCONFIG = {
	extends: "expo/tsconfig.base",
	compilerOptions: {
		strict: true,
		baseUrl: ".",
		paths: { "@/*": ["./src/*"] },
		// The copied components are the subject; a peer's own type errors are not.
		skipLibCheck: true,
		noEmit: true,
	},
	include: ["**/*.ts", "**/*.tsx", "expo-env.d.ts"],
};

/** The stock Expo template, so `init` has a real export to wrap. */
const METRO_CONFIG = `const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

module.exports = config;
`;

const BABEL_CONFIG = `module.exports = (api) => {
	api.cache(true);
	return { presets: ["babel-preset-expo"] };
};
`;

const ENTRY = `import { registerRootComponent } from "expo";
import { App } from "./src/app";

registerRootComponent(App);
`;

/**
 * A screen that renders nothing yet.
 *
 * `add --all` replaces nothing here — this file exists so the app has an entry
 * `tsc` will follow, and so `src/` exists before the CLI writes into it.
 */
const APP_TSX = `import { Text, View } from "react-native";

export function App() {
	return (
		<View>
			<Text>delacour verify</Text>
		</View>
	);
}
`;

/**
 * Where the scaffolded app lives: `packages/cli/.verify/app`.
 *
 * Inside the repository rather than the system temp directory, so a kept app is
 * somewhere you can actually find and open — and so `node_modules` survives
 * between runs, which turns a two-minute install into seconds.
 *
 * It sits below `packages/cli`, which the workspace globs (`packages/*`) do not
 * reach, so Bun never treats it as a workspace member. Biome and `tsconfig`
 * scope themselves to `src` and `scripts`, and it is gitignored.
 */
export const VERIFY_DIR = join(import.meta.dirname, "../../.verify/app");

/**
 * The two shapes a consumer's project can take.
 *
 * `standalone` is an Expo app that owns its components. `monorepo` puts them in
 * a package several apps could share — the layout whose wiring (a workspace
 * link, an `exports` map, Metro's resolver) has no equivalent in the first, and
 * which nothing verified until now.
 */
export type Layout = "standalone" | "monorepo";

export type Workspace = {
	layout: Layout;
	/** Where `bun install` runs, and where `init` is invoked from. */
	installRoot: string;
	/** `init`'s `--package-path`, relative to `installRoot`. */
	packagePath?: string;
	/** Where `init` and `add` run, and where the config lands. */
	configRoot: string;
	/** The Expo app: Metro, the CSS entry, the verify screen, `tsc`. */
	appRoot: string;
	/** Set for the monorepo layout — what the app imports components as. */
	packageName?: string;
};

/** Deliberately not pre-created: whether `init` can produce a usable package is the test. */
export const SHARED_PACKAGE_NAME = "@verify/ui";

export type ScaffoldOptions = {
	install: boolean;
	reporter: Reporter;
	/** Extra `tsconfig` path mappings — the workspace pins, in a monorepo. */
	typePins?: Record<string, string[]>;
	/** Delete `node_modules` too, rather than reusing it. */
	fresh?: boolean;
};

/**
 * Empties the app directory at the *start* of a run, keeping `node_modules`
 * unless `fresh`.
 *
 * Reusing the install is what makes a repeat run fast, and it is safe: the
 * scaffold's `package.json` is written fresh every run, so `bun install`
 * reconciles anything that changed. Only a run that was told to `--keep`
 * leaves an install for the next one to find.
 */
export async function resetVerifyDir(dir: string, options: { fresh?: boolean }): Promise<void> {
	if (options.fresh) {
		await rm(dir, { recursive: true, force: true });
		await mkdir(dir, { recursive: true });
		return;
	}

	await mkdir(dir, { recursive: true });

	for (const entry of await readdir(dir)) {
		if (entry === "node_modules") continue;
		await rm(join(dir, entry), { recursive: true, force: true });
	}
}

/**
 * A Bun workspace has to install flat for React Native tooling to work.
 *
 * Bun's default isolated layout hides packages under `node_modules/.bun/…` and
 * links to them. Metro walks `node_modules` directories and cannot see through
 * that, and TypeScript resolves the linked copy to a different realpath than the
 * app's — so `ComponentRef<typeof Animated.View>` collapses to `never` and every
 * `ref` in the library fails to typecheck.
 *
 * The repository root carries this same file, for the same reason.
 */
const BUNFIG = `[install]
# React Native tooling expects a flat node_modules; Bun's default isolated
# layout hides packages under node_modules/.bun where Metro cannot follow.
linker = "hoisted"
`;

/** The workspace root of a monorepo scaffold — everything else hangs off it. */
const ROOT_PACKAGE_JSON = {
	name: "delacour-verify-workspace",
	version: "1.0.0",
	private: true,
	workspaces: ["apps/*", "packages/*"],
};

export async function scaffoldWorkspace(
	dir: string,
	options: ScaffoldOptions & { layout: Layout }
): Promise<Workspace> {
	if (options.layout === "standalone") {
		await scaffoldExpoApp(dir, options);
		return { layout: "standalone", installRoot: dir, configRoot: dir, appRoot: dir };
	}

	const appRoot = join(dir, "apps/mobile");

	await mkdir(dir, { recursive: true });
	await writeFile(join(dir, "package.json"), `${JSON.stringify(ROOT_PACKAGE_JSON, null, "\t")}\n`, "utf-8");
	await writeFile(join(dir, "bunfig.toml"), BUNFIG, "utf-8");

	// The app is scaffolded whole; `packages/ui` is left absent on purpose.
	await scaffoldExpoApp(appRoot, { ...options, install: false });

	if (options.install) {
		await run("bun", ["install"], { cwd: dir, reporter: options.reporter, label: "bun install" });
		options.reporter.pass("installed the workspace");
	}

	return {
		layout: "monorepo",
		installRoot: dir,
		configRoot: join(dir, "packages/ui"),
		packagePath: "packages/ui",
		appRoot,
		packageName: SHARED_PACKAGE_NAME,
	};
}

export async function scaffoldExpoApp(dir: string, options: ScaffoldOptions): Promise<void> {
	const files: [string, string][] = [
		["package.json", `${JSON.stringify(PACKAGE_JSON, null, "\t")}\n`],
		["app.json", `${JSON.stringify(APP_JSON, null, "\t")}\n`],
		[
			"tsconfig.json",
			`${JSON.stringify(
				{
					...TSCONFIG,
					compilerOptions: {
						...TSCONFIG.compilerOptions,
						paths: { ...TSCONFIG.compilerOptions.paths, ...options.typePins },
					},
				},
				null,
				"\t"
			)}\n`,
		],
		["metro.config.js", METRO_CONFIG],
		["babel.config.js", BABEL_CONFIG],
		["index.ts", ENTRY],
		["src/app.tsx", APP_TSX],
	];

	for (const [path, content] of files) {
		const full = join(dir, path);
		await mkdir(dirname(full), { recursive: true });
		await writeFile(full, content, "utf-8");
	}

	options.reporter.pass(`wrote ${files.length} files`);

	if (!options.install) {
		options.reporter.detail("skipping bun install (--no-install)");
		return;
	}

	await run("bun", ["install"], { cwd: dir, reporter: options.reporter, label: "bun install" });
	options.reporter.pass("installed expo, react-native, uniwind, tailwindcss");
}

/** Builds the CLI and returns the path to the bundle. */
export async function buildCli(reporter: Reporter): Promise<string> {
	const packageRoot = join(import.meta.dirname, "../..");
	await run("bun", ["run", "build"], { cwd: packageRoot, reporter, label: "tsdown" });

	const bundle = join(packageRoot, "dist/index.js");
	if (!(await Bun.file(bundle).exists())) throw new Error(`Build produced no bundle at ${bundle}`);

	reporter.pass("dist/index.js");
	return bundle;
}

export type RunCliOptions = {
	cwd: string;
	reporter: Reporter;
	install: boolean;
};

export async function runCli(bundle: string, args: string[], options: RunCliOptions): Promise<void> {
	// Both spellings, always. `add` and `init` install only when told to, and a
	// script that leaves it unset would sit on a prompt it cannot answer.
	const full = [...args, options.install ? "--install" : "--no-install"];
	await run("node", [bundle, ...full], { cwd: options.cwd, reporter: options.reporter, label: `delacour ${args[0]}` });
	options.reporter.pass(`delacour ${args[0]} succeeded`);
}

type RunOptions = {
	cwd: string;
	reporter: Reporter;
	label: string;
	/**
	 * Return the output instead of throwing on a non-zero exit.
	 *
	 * For a command whose *failure* carries the information — `doctor --json`
	 * exits 1 precisely when it has something to report. Throwing truncated the
	 * JSON to the last 25 lines, so a legitimate failing check surfaced as
	 * "produced no parseable report" and hid what had actually failed.
	 */
	allowFailure?: boolean;
};

/**
 * Runs a command, surfacing its output only when it matters.
 *
 * A successful `bun install` is 30 lines nobody reads; a failing one is the
 * whole reason the script exists. `--verbose` shows everything.
 */
export async function run(command: string, args: string[], options: RunOptions): Promise<string> {
	const result = await x(command, args, {
		nodeOptions: { cwd: options.cwd, env: { ...process.env, CI: "1" } },
		throwOnError: false,
	});

	const output = `${result.stdout}${result.stderr}`;
	if (options.reporter.verbose) options.reporter.detail(output.trim().split("\n").join("\n      "));

	if (result.exitCode !== 0 && !options.allowFailure) {
		const tail = output.trim().split("\n").slice(-25).join("\n      ");
		throw new Error(`${options.label} failed (exit ${result.exitCode}):\n      ${tail}`);
	}

	return output;
}

/**
 * Removes the app directory outright — `node_modules` included.
 *
 * This is what "cleaning up" has to mean. Keeping the install while deleting
 * everything around it left half a gigabyte in a directory that looked empty,
 * which is a worse outcome than either cleaning up or not.
 */
export async function removeVerifyDir(dir: string, reporter: Reporter): Promise<void> {
	const size = await directorySize(dir);
	await rm(dir, { recursive: true, force: true });

	if (size > 0)
		reporter.detail(
			`Cleaned up ${dir.split("/").slice(-2).join("/")} (${formatSize(size)}) — \`--keep\` to retain it.`
		);
}

async function directorySize(dir: string): Promise<number> {
	let total = 0;

	try {
		for (const entry of await readdir(dir, { recursive: true, withFileTypes: true })) {
			if (!entry.isFile()) continue;
			total += (await stat(join(entry.parentPath, entry.name)).catch(() => ({ size: 0 }))).size;
		}
	} catch {
		return 0;
	}

	return total;
}

function formatSize(bytes: number): string {
	if (bytes > 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)}GB`;
	if (bytes > 1_000_000) return `${Math.round(bytes / 1_000_000)}MB`;
	return `${Math.round(bytes / 1000)}KB`;
}
