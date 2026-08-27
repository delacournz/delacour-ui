import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import * as clack from "@clack/prompts";
import { findConfig, type ResolvedConfig, readConfig } from "../config/resolve";
import { CONFIG_FILENAME, CONFIG_SCHEMA_URL, type Config, type ConfigPaths } from "../config/schema";
import { aliasesForDirectories } from "../project/aliases";
import { buildStylesBlock, patchGlobalCss } from "../project/css";
import { detectProject, type ProjectInfo } from "../project/detect";
import { patchMetroConfig } from "../project/metro";
import { NAMESPACES } from "../registry/namespaces";
import { CancelledError, createOutput, type Output, style } from "../ui/output";
import { add } from "./add";

/**
 * Sets a project up to receive components.
 *
 * Three things have to be true before a copied component renders, and only the
 * first is obvious: the files have somewhere to go, Metro compiles `className`
 * through Uniwind, and Tailwind can see the component source to compile its
 * classes from. `init` does all three and then adds the `styles` item, so the
 * project has the tokens the components resolve their colours and sizes
 * against.
 *
 * What it deliberately does not do is edit `tsconfig.json` or `app.config.ts`.
 * Aliases are read, never written — a project without them gets relative
 * imports, which work whether or not `experiments.tsconfigPaths` is on. The
 * things that genuinely need a human are printed at the end and checked again
 * by `delacour doctor`.
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

export async function init(components: string[], options: InitOptions): Promise<void> {
	const output = createOutput(options);
	output.intro("delacour init");

	const existing = findConfig(options.cwd);
	if (existing && !options.force) {
		output.warn(`${relative(options.cwd, existing) || CONFIG_FILENAME} already exists. Pass --force to rewrite it.`);
		if (components.length > 0) await add(components, { ...options, cwd: options.cwd });
		return;
	}

	const project = await detectProject(options.cwd);
	warnAboutStack(project, output);

	const placement = await choosePlacement(project, options, output);
	const source = await chooseSourceDirectory(options, output);
	const config = buildConfig({ project, root: placement.root, source, packageName: placement.packageName });
	const resolved = await writeConfigFile(config, placement.root, output);

	await wireUpApp(resolved, resolved.package ? project.workspaceRoot : null, output);

	// The tokens every component's classes resolve against. Adding it here means
	// a fresh project is renderable before a single component is chosen.
	await add(["styles", ...components], { ...options, cwd: placement.root, overwrite: true });

	printFollowUps(resolved, output);
	output.outro(`Ready. ${style.code("delacour add button")} to get started.`);
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

	const appRoot = context.project.appRoot ?? context.root;

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
			css: under("styles/global.css"),
			metroConfig: "metro.config.js",
			uniwindTypes: under("uniwind-types.d.ts"),
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

	const block = buildStylesBlock({ cssPath: config.app.resolved.css, directories: config.directories });
	const css = patchGlobalCss(await read(config.app.resolved.css), block);

	if (css.changed) {
		await write(config.app.resolved.css, css.content);
		output.success(`Updated ${style.path(config.app.css)}`);
	}
}

/**
 * What is left, and why the CLI did not just do it.
 *
 * Each of these needs a decision or an AST edit inside a file the project owns.
 * `doctor` re-checks all of them, so this list is a starting point rather than
 * the only chance to see it.
 */
function printFollowUps(config: ResolvedConfig, output: Output): void {
	const items: string[] = [];

	if (Object.keys(config.aliases).length > 0) {
		items.push(
			`Set ${style.code("experiments.tsconfigPaths: true")} in app.config — Metro ignores tsconfig paths without it.`
		);
	}

	// First, because it is the only one of the three that produces no error at
	// all — the app boots and renders every component unstyled.
	items.push(
		`Import ${style.code(`"${config.aliases.styles ?? "."}/${basename(config.app.resolved.css)}"`)} as the first statement of your root layout — without it every component renders unstyled.`
	);
	items.push(
		`Wrap the app root in ${style.code("<GestureHandlerRootView style={{ flex: 1 }}>")} — presses do nothing without it.`
	);

	output.info(
		[
			`A few things need you:`,
			...items.map((line) => `  • ${line}`),
			"",
			`Run ${style.code("delacour doctor")} to check.`,
		].join("\n")
	);
}

function warnAboutStack(project: ProjectInfo, output: Output): void {
	if (!project.packageJson) {
		output.warn("No package.json here. Run this inside your Expo app.");
		return;
	}

	if (!project.expoVersion && !project.reactNativeVersion) {
		output.warn("This does not look like a React Native project — delacour components only run on React Native.");
	}
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
