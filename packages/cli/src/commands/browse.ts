import * as clack from "@clack/prompts";
import { findConfig, readConfig } from "../config/resolve";
import { detectProject } from "../project/detect";
import { commandLine, installCommands } from "../project/package-manager";
import { createRegistryClient } from "../registry/client";
import { resolveItemGraph } from "../registry/resolve";
import type { RegistryIndexEntry } from "../registry/schema";
import { createOutput, type Output, style } from "../ui/output";

/**
 * The read-only commands: `list`, `search`, `view` and `info`.
 *
 * None of them need a `native-components.json` — browsing the registry should work
 * before a project is initialised, which is exactly when someone is deciding
 * whether to. `info` reads the config if there is one and reports what was
 * detected either way.
 */

export type BrowseOptions = {
	cwd: string;
	silent?: boolean;
	json?: boolean;
	ref?: string;
	registry?: string;
	offline?: boolean;
};

async function openRegistry(options: BrowseOptions) {
	const configPath = findConfig(options.cwd);
	const config = configPath ? await readConfig(configPath) : null;

	return createRegistryClient({
		cwd: options.cwd,
		url: options.registry ?? config?.registry.url,
		ref: options.ref ?? config?.registry.ref,
		offline: options.offline,
	});
}

export async function list(options: BrowseOptions): Promise<void> {
	const output = createOutput(options);
	const index = await (await openRegistry(options)).getIndex();

	if (options.json) {
		process.stdout.write(`${JSON.stringify(index.items, null, 2)}\n`);
		return;
	}

	printGroups(index.items, output);
}

export async function search(query: string, options: BrowseOptions): Promise<void> {
	const output = createOutput(options);
	const index = await (await openRegistry(options)).getIndex();
	const needle = query.toLowerCase();

	const matches = index.items.filter((item) =>
		[item.name, item.title, item.description, ...(item.categories ?? [])].join(" ").toLowerCase().includes(needle)
	);

	if (options.json) {
		process.stdout.write(`${JSON.stringify(matches, null, 2)}\n`);
		return;
	}

	if (matches.length === 0) {
		output.warn(`Nothing matches "${query}".`);
		return;
	}

	printGroups(matches, output);
}

/**
 * One item: its files, what it copies in, and what it installs.
 *
 * The install lines are the whole closure, not this item's own `dependencies`.
 * `bottom-sheet` lists five native modules and renders `icon`, which needs
 * `react-native-svg` — so the item's own list under-reports what `add` would
 * install by exactly the packages a reader is deciding about. They are rendered
 * as real commands, against the package manager this project is on, because
 * `expo install` versus `bun add` is the distinction that decides whether the
 * build compiles.
 */
export async function view(name: string, options: BrowseOptions): Promise<void> {
	const output = createOutput(options);
	const client = await openRegistry(options);
	const item = await client.getItem(name);

	// `--json` is the machine-readable form of the whole item, so it carries the
	// files themselves. The human view lists their names and needs none of them.
	if (options.json) {
		process.stdout.write(`${JSON.stringify(await client.loadItem(item), null, 2)}\n`);
		return;
	}

	const index = await client.getIndex();
	const byName = new Map(index.items.map((entry) => [entry.name, entry]));
	const order = resolveItemGraph([name], (candidate) => byName.get(candidate));
	const closure = order.filter((candidate) => candidate !== name);
	const resolved = order.flatMap((candidate) => byName.get(candidate) ?? []);

	const configPath = findConfig(options.cwd);
	const config = configPath ? await readConfig(configPath) : null;
	const project = await detectProject(config?.app.resolved.root ?? options.cwd);
	const union = (key: "expoDependencies" | "dependencies" | "devDependencies") =>
		[...new Set(resolved.flatMap((entry) => entry[key]))].sort();

	const commands = installCommands({
		packageManager: project.packageManager,
		expoDependencies: union("expoDependencies"),
		dependencies: union("dependencies"),
		devDependencies: union("devDependencies"),
	});

	const lines = [
		`${style.bold(item.title)}  ${style.dim(item.name)}`,
		item.description,
		"",
		`${style.dim("files")}      ${item.files.map((file) => `${file.namespace}/${file.target}`).join("\n           ")}`,
	];

	if (closure.length > 0) lines.push(`${style.dim("copies in")}  ${closure.join(", ")}`);

	if (commands.length > 0) {
		lines.push(
			"",
			style.dim("needs installing"),
			...commands.map((group) => `  ${style.code(commandLine(group))}`),
			style.dim("  Run these in the app, never in a shared package.")
		);
	}

	output.log(lines.join("\n"));
}

export async function info(options: BrowseOptions): Promise<void> {
	const output = createOutput(options);
	const configPath = findConfig(options.cwd);
	const config = configPath ? await readConfig(configPath) : null;
	const project = await detectProject(config?.app.resolved.root ?? options.cwd);
	const client = await openRegistry(options);

	const report = {
		config: configPath ?? null,
		registry: client.source,
		project: {
			packageManager: project.packageManager,
			expo: project.expoVersion,
			reactNative: project.reactNativeVersion,
			uniwind: project.hasUniwind,
			tailwind: project.hasTailwind,
			workspaceRoot: project.workspaceRoot,
			appRoot: project.appRoot,
			aliases: project.pathMappings.map((mapping) => `${mapping.prefix}* → ${mapping.directory}`),
		},
		paths: config?.directories ?? null,
	};

	if (options.json) {
		process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
		return;
	}

	output.log(JSON.stringify(report, null, 2));
}

function printGroups(items: readonly RegistryIndexEntry[], output: Output): void {
	if (output.silent) return;

	const components = items.filter((item) => item.type === "registry:ui");
	const rest = items.filter((item) => item.type !== "registry:ui");
	const width = Math.max(...items.map((item) => item.name.length));

	const render = (entry: RegistryIndexEntry) =>
		`  ${style.cyan(entry.name.padEnd(width))}  ${style.dim(entry.description)}`;

	if (components.length > 0) {
		clack.log.message([style.bold("Components"), ...components.map(render)].join("\n"));
	}

	if (rest.length > 0) {
		clack.log.message(
			[
				style.bold("Utilities"),
				...rest.map(render),
				"",
				style.dim("Pulled in automatically when a component needs them."),
			].join("\n")
		);
	}
}
