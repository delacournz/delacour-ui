import * as clack from "@clack/prompts";
import { findConfig, readConfig } from "../config/resolve";
import { detectProject } from "../project/detect";
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

export async function view(name: string, options: BrowseOptions): Promise<void> {
	const output = createOutput(options);
	const client = await openRegistry(options);
	const item = await client.getItem(name);

	if (options.json) {
		process.stdout.write(`${JSON.stringify(item, null, 2)}\n`);
		return;
	}

	const index = await client.getIndex();
	const byName = new Map(index.items.map((entry) => [entry.name, entry]));
	const closure = resolveItemGraph([name], (candidate) => byName.get(candidate)).filter(
		(candidate) => candidate !== name
	);

	const lines = [
		`${style.bold(item.title)}  ${style.dim(item.name)}`,
		item.description,
		"",
		`${style.dim("files")}      ${item.files.map((file) => `${file.namespace}/${file.target}`).join("\n           ")}`,
	];

	if (closure.length > 0) lines.push(`${style.dim("copies in")}  ${closure.join(", ")}`);
	if (item.expoDependencies.length > 0) {
		lines.push(`${style.dim("expo")}       ${item.expoDependencies.join(", ")}`);
	}
	if (item.dependencies.length > 0) lines.push(`${style.dim("npm")}        ${item.dependencies.join(", ")}`);

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
