import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import * as clack from "@clack/prompts";
import { findConfig, type ResolvedConfig, readConfig } from "../config/resolve";
import { CONFIG_FILENAME, CONFIG_SCHEMA_URL, type Config, type ConfigPaths } from "../config/schema";
import { aliasesForDirectories } from "../project/aliases";
import { buildStylesBlock, patchGlobalCss } from "../project/css";
import { findTailwindEntry } from "../project/css-entry";
import { detectProject, type ProjectInfo } from "../project/detect";
import { patchMetroConfig, readUniwindPaths, type UniwindPaths } from "../project/metro";
import { findRootLayout, renderRootLayout } from "../project/root-layout";
import { UNIWIND_ENV_REFERENCE } from "../project/uniwind-env";
import { NAMESPACES } from "../registry/namespaces";
import { CancelledError, createOutput, type Output, style } from "../ui/output";
import { type AddResult, add } from "./add";
import { checkGestureHandlerRoot, checkStylingConflict, filesImporting, layoutSpecifiers } from "./doctor";

/**
 * Sets a project up to receive components.
 *
 * Three things have to be true before a copied component renders, and only the
 * first is obvious: the files have somewhere to go, Metro compiles `className`
 * through Uniwind, and Tailwind can see the component source to compile its
 * classes from. `init` does all three and then adds the `styles` item, so the
 * project has the tokens the components resolve their colours and sizes
 * against, and the `provider` item, so the root the components need is one
 * import away rather than a second command.
 *
 * What it deliberately does not do is edit `tsconfig.json` or `app.config.ts`.
 * Aliases are read, never written — a project without them gets relative
 * imports, which work whether or not `experiments.tsconfigPaths` is on. The
 * things that genuinely need a human are printed at the end and checked again
 * by `delacour doctor`.
 *
 * It returns what that inner `add` did, because `add` delegates here whenever a
 * project has no config — see `AddResult`.
 */

export type InitOptions = {
	cwd: string;
	yes?: boolean;
	defaults?: boolean;
	silent?: boolean;
	install?: boolean;
	force?: boolean;
	ref?: string;
	registry?: string;
	/** Base directory for source files, e.g. `src`. Skips the prompt. */
	src?: string;
	/** Names the shared package, and selects that layout without prompting. */
	packageName?: string;
	/** Where that package goes, relative to the workspace root. Defaults to `packages/ui`. */
	packagePath?: string;
};

export async function init(components: string[], options: InitOptions): Promise<AddResult | null> {
	const output = createOutput(options);
	output.intro("delacour init");

	const existing = findConfig(options.cwd);
	if (existing && !options.force) {
		output.warn(`${relative(options.cwd, existing) || CONFIG_FILENAME} already exists. Pass --force to rewrite it.`);
		return components.length > 0 ? add(components, { ...options, cwd: options.cwd }) : null;
	}

	const project = await detectProject(options.cwd);
	warnAboutStack(project, output);

	const placement = await choosePlacement(project, options, output);
	const source = await chooseSourceDirectory(options, output);

	// Before the config is built, because a project that arrived with Uniwind
	// already set up has chosen its own CSS entry and Metro compiles that file
	// and no other — see `readUniwindPaths`. Failing that, an entry the app has
	// but has not wired Metro to yet; failing that, the default below.
	const appRoot = project.appRoot ?? placement.root;
	const metroPaths = readUniwindPaths(await read(join(appRoot, "metro.config.js")));
	const existingEntry = findTailwindEntry(appRoot);
	const wired: UniwindPaths = {
		...metroPaths,
		css: metroPaths.css ?? (existingEntry ? relative(appRoot, existingEntry) : undefined),
	};

	const config = buildConfig({
		project,
		root: placement.root,
		source,
		packageName: placement.packageName,
		wired,
		appRoot,
	});
	const resolved = await writeConfigFile(config, placement.root, output);

	await wireUpApp(resolved, resolved.package ? project.workspaceRoot : null, output);

	// The tokens every component's classes resolve against, and the root every
	// pressable needs above it. Adding both here means a fresh project is
	// renderable — and responds to touch — before a single component is chosen.
	const result = await add(["styles", "provider", ...components], {
		...options,
		cwd: placement.root,
		overwrite: true,
	});

	await printFollowUps(resolved, output);
	output.outro(outro(components));

	// Returned rather than swallowed: `add` delegates here for an unconfigured
	// project, and its caller — a script, or the MCP server, which prints
	// nothing of its own — still has to learn what the components need from npm.
	return result;
}

/**
 * Where `native-components.json` goes, and with it the components.
 *
 * In a plain Expo app this is the app. In a monorepo the choice is real: a
 * shared package lets several apps use one copy, and putting them in the app is
 * simpler while there is only one.
 */
export type Placement = {
	/** Where the config and the components go. */
	root: string;
	/** Set only for the shared-package layout — the app's import prefix. */
	packageName?: string;
};

/**
 * The default answer, decided without asking.
 *
 * Pure and exported so the decision table is testable: the prompt branches were
 * previously unreachable from any test, which is how "running inside a package
 * never asks" went unnoticed.
 */
export function defaultPlacement(project: ProjectInfo, cwd: string): Placement {
	const { appRoot, packageRoot, workspaceRoot } = project;

	// Already inside a package that is not the app — `cd packages/ui && init`
	// means the components go there. Now the *default*, not a reason to skip
	// the question.
	if (packageRoot && packageRoot !== appRoot && packageRoot !== workspaceRoot) {
		return { root: packageRoot, packageName: undefined };
	}

	return { root: appRoot ?? packageRoot ?? cwd };
}

/** `fixture-monorepo` → `@fixture-monorepo/ui`; an unnamed root → `@repo/ui`. */
function suggestPackageName(project: ProjectInfo): string {
	const root = project.workspaceRoot ? project.packageJson?.name : null;
	const scope = (root ?? "repo").replace(/^@/, "").split("/")[0];
	return `@${scope}/ui`;
}

/**
 * Where `native-components.json` goes, and with it the components.
 *
 * In a plain Expo app there is exactly one sensible answer, so asking would be
 * noise. In a workspace there are two — a shared package lets several apps use
 * one copy — so it always asks, including from inside a package, which it never
 * used to do.
 */
async function choosePlacement(project: ProjectInfo, options: InitOptions, output: Output): Promise<Placement> {
	const fallback = defaultPlacement(project, options.cwd);

	// The non-interactive equivalent of the two prompts below. The path defaults
	// rather than falling back to the app, since naming a package and then
	// writing into the app would be the opposite of what was asked for.
	if (options.packageName) {
		const base = project.workspaceRoot ?? options.cwd;
		const path = options.packagePath ?? (fallback.root !== project.appRoot ? fallback.root : "packages/ui");
		return { root: resolve(base, path), packageName: options.packageName };
	}

	if (!project.workspaceRoot || !output.interactive || options.defaults) return fallback;

	const app = project.appRoot;
	const inPackage = fallback.root !== app;

	const choice = await clack.select({
		message: "Where should the components live?",
		initialValue: inPackage ? "__package__" : (app ?? "__package__"),
		options: [
			...(app ? [{ value: app, label: `In this app  ${style.dim(short(project.workspaceRoot, app))}` }] : []),
			{ value: "__package__", label: "In a shared package, so several apps can use them" },
		],
	});

	if (clack.isCancel(choice)) throw new CancelledError();
	if (choice !== "__package__") return { root: choice as string };

	const path = await clack.text({
		message: "Path to the shared package",
		initialValue: toPosix(relative(project.workspaceRoot, fallback.root)) || "packages/ui",
		placeholder: "packages/ui",
	});
	if (clack.isCancel(path)) throw new CancelledError();

	const name = await clack.text({
		message: "Package name — what the apps will import",
		initialValue: suggestPackageName(project),
		placeholder: "@acme/ui",
	});
	if (clack.isCancel(name)) throw new CancelledError();

	return { root: resolve(project.workspaceRoot, path), packageName: name };
}

async function chooseSourceDirectory(options: InitOptions, output: Output): Promise<string> {
	if (options.src) return options.src;
	if (!output.interactive || options.defaults) return "src";

	const answer = await clack.text({
		message: "Base directory for source files",
		initialValue: "src",
		placeholder: "src",
	});

	if (clack.isCancel(answer)) throw new CancelledError();
	return answer.replace(/^\.\//, "").replace(/\/+$/, "") || ".";
}

type BuildConfigContext = {
	project: ProjectInfo;
	root: string;
	source: string;
	/** Set for the shared-package layout only. */
	packageName?: string;
	/** What an already-wired Metro config names, which wins over the defaults. */
	wired: UniwindPaths;
	appRoot: string;
};

function buildConfig(context: BuildConfigContext): Config {
	const under = (path: string) => (context.source === "." ? path : `${context.source}/${path}`);

	const paths: ConfigPaths = {
		ui: under("components/ui"),
		lib: under("lib"),
		hooks: under("hooks"),
		styles: under("styles"),
		icons: under("lib/icons"),
	};

	const directories = Object.fromEntries(
		NAMESPACES.map((namespace) => [namespace, resolve(context.root, paths[namespace])])
	) as Record<(typeof NAMESPACES)[number], string>;

	const { appRoot } = context;

	// A path Metro already names is relative to the Metro config, which lives in
	// the app; `app.css` is relative to wherever this config is being written.
	const fromApp = (path: string) => toPosix(relative(context.root, resolve(appRoot, path)));

	return {
		$schema: CONFIG_SCHEMA_URL,
		framework: context.project.expoVersion ? "expo" : "react-native",
		typescript: true,
		registry: {},
		registries: {},
		paths,
		// Read from tsconfig, never written to it. Absent means relative imports.
		aliases: aliasesForDirectories(directories, context.project.pathMappings),
		...(context.packageName ? { package: { name: context.packageName } } : {}),
		app: {
			root: toPosix(relative(context.root, appRoot)) || ".",
			css: context.wired.css ? fromApp(context.wired.css) : under("styles/global.css"),
			metroConfig: "metro.config.js",
			uniwindTypes: context.wired.types ? fromApp(context.wired.types) : under("uniwind-types.d.ts"),
		},
	};
}

async function writeConfigFile(config: Config, root: string, output: Output): Promise<ResolvedConfig> {
	const path = join(root, CONFIG_FILENAME);

	await mkdir(root, { recursive: true });
	await writeFile(path, `${JSON.stringify(config, null, "\t")}\n`, "utf-8");
	output.success(`Wrote ${style.path(CONFIG_FILENAME)}`);

	const resolved = await readConfig(path);
	if (Object.keys(resolved.aliases).length === 0) {
		output.info("No path aliases found in tsconfig.json — components will import each other by relative path.");
	}

	return resolved;
}

/** Metro and the Tailwind entry, the two files the app needs to have changed. */
async function wireUpApp(config: ResolvedConfig, workspaceRoot: string | null, output: Output): Promise<void> {
	const metro = patchMetroConfig(await read(config.app.resolved.metroConfig), {
		metroConfigPath: config.app.resolved.metroConfig,
		cssPath: config.app.resolved.css,
		typesPath: config.app.resolved.uniwindTypes,
		// Only when the components sit outside the app — otherwise Metro's
		// default resolution already reaches them.
		workspaceRoot: workspaceRoot ?? undefined,
	});

	if (metro.status === "created" || metro.status === "patched") {
		await write(config.app.resolved.metroConfig, metro.content);
		output.success(`${metro.status === "created" ? "Wrote" : "Wrapped"} ${style.path(config.app.metroConfig)}`);
	} else if (metro.status === "manual") {
		output.warn(
			[`Could not safely wrap ${style.path(config.app.metroConfig)}. Add this yourself:`, "", metro.snippet].join("\n")
		);
	}

	await ensureUniwindEnv(config, output);
	await ensureExpoEnv(config, output);

	const block = buildStylesBlock({ cssPath: config.app.resolved.css, directories: config.directories });
	const css = patchGlobalCss(await read(config.app.resolved.css), block);

	if (css.changed) {
		await write(config.app.resolved.css, css.content);
		output.success(`Updated ${style.path(config.app.css)}`);
	}
}

/**
 * Gives the app the Uniwind type augmentation when the components do not live in it.
 *
 * `uniwind-env.d.ts` is one line — `/// <reference types="uniwind/types" />` —
 * and it is the whole reason a React Native component accepts `className` in
 * TypeScript at all. The `styles` item writes it beside the components, which is
 * enough when they are in the app: the app's `tsconfig` `include` picks it up.
 *
 * In a shared package it lands outside the app's `include`, and nothing imports
 * it — a `.d.ts` carrying only a triple-slash reference cannot be reached by an
 * import. So the augmentation never loads and every `className` on an Animated
 * component becomes a type error naming neither the file nor the cause.
 */
async function ensureUniwindEnv(config: ResolvedConfig, output: Output): Promise<void> {
	if (!config.package) return;

	const path = join(config.app.resolved.root, "uniwind-env.d.ts");
	if (existsSync(path)) return;

	await write(path, `${UNIWIND_ENV_REFERENCE}\n`);
	output.success(`Wrote ${style.path("uniwind-env.d.ts")} — the app needs it too, not just the package`);
}

/**
 * The file Expo's own CLI writes on first `start`, and nothing before that.
 *
 * `expo/types` is what declares `*.css` as a module. Several templates ship no
 * `expo-env.d.ts` — `blank-typescript`, and `with-router-uniwind` too — so the
 * CSS import fails `tsc` with "Cannot find module … './styles/global.css'"
 * until the app has been started once. Metro is fine either way; only the
 * typecheck a reader runs first is not.
 */
async function ensureExpoEnv(config: ResolvedConfig, output: Output): Promise<void> {
	if (config.framework !== "expo") return;

	const path = join(config.app.resolved.root, "expo-env.d.ts");
	if (existsSync(path)) return;

	await write(path, `${EXPO_ENV_REFERENCE}\n`);
	output.success(`Wrote ${style.path("expo-env.d.ts")} — it declares *.css as a module`);
}

const EXPO_ENV_REFERENCE = `/// <reference types="expo/types" />

// NOTE: This file should not be edited and should be in your git ignore`;

/** How many names the outro recites before it counts them instead. */
const OUTRO_NAME_LIMIT = 3;

/**
 * The last line of a run.
 *
 * `add` delegates here whenever a project has no config, so by the time this
 * prints the reader has usually just run the command the outro used to
 * suggest — *"Ready. delacour add button to get started"* after `add button`
 * had already copied it in.
 *
 * It does not name `doctor` either. The follow-up block directly above ends on
 * it, and two consecutive lines pointing at the same command read as a glitch
 * rather than as emphasis. So what is left for the last line is the thing that
 * actually happened: the components are the reader's now.
 *
 * Exported so the wording is testable without a terminal.
 */
export function outro(components: readonly string[]): string {
	if (components.length === 0) return `Ready. ${style.code("delacour add button")} to get started.`;

	if (components.length > OUTRO_NAME_LIMIT) {
		return `Ready. ${components.length} components are yours to edit.`;
	}

	const named = components.map((name) => style.code(name));
	const list =
		named.length === 1 ? `${named[0]} is` : `${named.slice(0, -1).join(", ")} and ${named[named.length - 1]} are`;

	return `Ready. ${list} yours to edit.`;
}

/**
 * What is left, and why the CLI did not just do it.
 *
 * Each of these needs a decision or an AST edit inside a file the project owns.
 * `doctor` re-checks all of them, so this list is a starting point rather than
 * the only chance to see it.
 */
async function printFollowUps(config: ResolvedConfig, output: Output): Promise<void> {
	// Asked rather than assumed. A project scaffolded from Expo's
	// `with-router-uniwind` example already imports its CSS entry from the root
	// layout, and telling a reader to add an import that is on line one of the
	// file they were just sent to is how a list of instructions stops being read.
	const done = {
		cssImported: (await filesImporting(config.app.resolved.root, config.app.resolved.css)).length > 0,
		providerMounted: (await checkGestureHandlerRoot(config)).status === "pass",
	};

	const items = followUps(config, done);
	if (items.length === 0) return;

	// Two of those bullets are edits to one file. Printing it whole turns them
	// into a paste — and names the right file, which on Expo Router is a
	// `_layout.tsx` rather than the `App.tsx` a reader would otherwise open.
	const layout = done.cssImported && done.providerMounted ? null : rootLayoutBlock(config);

	output.info(
		[
			`A few things need you:`,
			...items.map((line) => `  • ${line}`),
			...(layout ? ["", ...layout] : []),
			"",
			`Run ${style.code("delacour doctor")} to check.`,
		].join("\n")
	);
}

/** The root layout, whole, or nothing when there is no file to name. */
function rootLayoutBlock(config: ResolvedConfig): string[] | null {
	const layout = findRootLayout(config.app.resolved.root);
	if (!layout) return null;

	const file = renderRootLayout(layout, layoutSpecifiers(config));

	return [
		style.path(layout.path),
		// An empty line stays empty: indenting one leaves trailing whitespace
		// down the side of the block.
		...file.split("\n").map((line) => (line === "" ? "" : `  ${line}`)),
		"",
		layout.router
			? `Already rendering a ${style.code("<Stack>")}? Keep it — wrap it, rather than replacing it with ${style.code("<Slot />")}.`
			: "Wrap whatever this file already renders, rather than replacing it.",
	];
}

/**
 * The follow-up lines themselves, in the order they are printed.
 *
 * Exported so the order is testable: the CSS import goes first because it is
 * the only one of these that produces no error at all, and the provider before
 * the theme because a theme is a choice and a root that receives touches is not.
 *
 * `done` is what the project already has. A scaffold that arrives with Uniwind
 * set up has the CSS import on line one of its root layout, and an instruction
 * to add it is worse than no instruction: it teaches the reader that this list
 * is not about their project.
 */
export type FollowUpsDone = { cssImported?: boolean; providerMounted?: boolean };

export function followUps(config: ResolvedConfig, done: FollowUpsDone = {}): string[] {
	const items: string[] = [];

	if (Object.keys(config.aliases).length > 0) {
		items.push(
			`Set ${style.code("experiments.tsconfigPaths: true")} in app.config — Metro ignores tsconfig paths without it.`
		);
	}

	// First, because it is the only one of the three that produces no error at
	// all — the app boots and renders every component unstyled.
	// `cssImportSpecifier` is `doctor`'s, deliberately: it prints the same
	// instruction, and two spellings of one line is one of them being wrong.
	const cssImport = layoutSpecifiers(config).css;
	if (!done.cssImported) {
		items.push(
			`Import ${style.code(`"${cssImport}"`)} as the first statement of your root layout — without it every component renders unstyled.`
		);
	}
	// The provider is already copied in; what is left is mounting it. The
	// specifier is the root layout's, the same one the printed file uses —
	// a bullet and a snippet disagreeing about one import is worse than either.
	const providerImport = layoutSpecifiers(config).provider;
	if (!done.providerMounted) {
		items.push(
			`Wrap the app root in ${style.code("<DelacourProvider>")} from ${style.code(`"${providerImport}"`)} — presses do nothing without it.`
		);
	}
	items.push(
		`${style.code("theme.css")} is the file to edit — replace it with the theme.css tab from https://ui.delacour.co.nz/theme, or paste a shadcn or tweakcn globals.css over it and run ${style.code("delacour theme")}.`
	);

	return items;
}

function warnAboutStack(project: ProjectInfo, output: Output): void {
	if (!project.packageJson) {
		output.warn("No package.json here. Run this inside your Expo app.");
		return;
	}

	if (!project.expoVersion && !project.reactNativeVersion) {
		output.warn("This does not look like a React Native project — delacour components only run on React Native.");
	}

	// Before Metro is wrapped, not after. `doctor` reports the same thing, but by
	// then the second transform is already installed and the reader is debugging
	// a build that names neither library.
	const styling = checkStylingConflict(project);
	if (styling.status === "fail") output.warn([styling.detail, styling.fix].filter(Boolean).join("\n"));
}

function short(from: string, path: string): string {
	return toPosix(relative(from, path)) || ".";
}

function toPosix(path: string): string {
	return sep === "/" ? path : path.split(sep).join("/");
}

async function read(path: string): Promise<string | null> {
	try {
		return await readFile(path, "utf-8");
	} catch {
		return null;
	}
}

async function write(path: string, content: string): Promise<void> {
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, content, "utf-8");
}
