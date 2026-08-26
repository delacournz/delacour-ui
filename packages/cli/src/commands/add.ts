import * as clack from "@clack/prompts";
import { loadConfig } from "../config/resolve";
import { detectProject, type ProjectInfo } from "../project/detect";
import { installCommands, missingPackages, runInstall } from "../project/package-manager";
import { type PlannedFile, planFiles, writeFiles } from "../project/write-files";
import { createRegistryClient } from "../registry/client";
import { resolveItemGraph } from "../registry/resolve";
import type { RegistryItem } from "../registry/schema";
import { createOutput, type Output, style } from "../ui/output";

/**
 * Copies components into the project, with everything they need.
 *
 * The order matters and is not arbitrary: resolve the graph, plan every file,
 * ask once about conflicts, write, then install. Installing first would leave a
 * project with new native dependencies and no components if the user answered
 * "no" to the overwrite prompt.
 */

export type AddOptions = {
	cwd: string;
	all?: boolean;
	overwrite?: boolean;
	yes?: boolean;
	silent?: boolean;
	install?: boolean;
	offline?: boolean;
	ref?: string;
	registry?: string;
};

export async function add(names: string[], options: AddOptions): Promise<void> {
	const output = createOutput(options);
	const config = await loadConfig(options.cwd);
	const project = await detectProject(config.app.resolved.root);

	const client = createRegistryClient({
		cwd: options.cwd,
		url: options.registry ?? config.registry.url,
		ref: options.ref ?? config.registry.ref,
		offline: options.offline,
	});

	const index = await output.task("Reading the registry", () => client.getIndex());
	const requested = options.all ? index.items.filter((item) => item.type === "registry:ui").map((i) => i.name) : names;

	if (requested.length === 0) {
		output.warn("Nothing to add. Name a component, or pass --all.");
		return;
	}

	const byName = new Map(index.items.map((item) => [item.name, item]));
	const order = resolveItemGraph(requested, (name) => byName.get(name));
	const items = await output.task(`Fetching ${order.length} item${order.length === 1 ? "" : "s"}`, () =>
		Promise.all(order.map((name) => client.getItem(name)))
	);

	const planned = await planFiles(items, config);
	const toWrite = await resolveConflicts(planned, options, output);
	if (toWrite === null) return;

	await writeFiles(toWrite);
	report(toWrite, planned, requested, output);

	if (options.install === false) {
		printSkippedInstall(items, output);
		return;
	}

	await install(items, project, output);
	warnAboutNativeRebuild(items, project, output);
}

/**
 * Decides which planned files to actually write.
 *
 * A file already on disk with identical content is not a conflict — that is the
 * normal state of a dependency two components share. Only a genuine difference
 * is worth asking about, because the premise of the tool is that the user owns
 * these files and may well have edited them.
 */
async function resolveConflicts(
	planned: readonly PlannedFile[],
	options: AddOptions,
	output: Output
): Promise<PlannedFile[] | null> {
	const fresh = planned.filter((file) => !file.exists);
	const identical = planned.filter((file) => file.unchanged);
	const conflicts = planned.filter((file) => file.exists && !file.unchanged);

	if (conflicts.length === 0 || options.overwrite) return [...fresh, ...conflicts];

	if (!output.interactive) {
		output.error(
			[
				`${conflicts.length} file${conflicts.length === 1 ? "" : "s"} would be overwritten:`,
				...conflicts.map((file) => `  ${file.displayPath}`),
				"",
				"Pass --overwrite to replace them, or run without --yes to be asked.",
			].join("\n")
		);
		return null;
	}

	output.warn(
		[`These files differ from the registry:`, ...conflicts.map((file) => `  ${style.path(file.displayPath)}`)].join(
			"\n"
		)
	);

	const overwrite = await output.confirm("Overwrite them?", false);
	if (!overwrite && fresh.length === 0) {
		output.info(
			`Nothing written. ${identical.length} file${identical.length === 1 ? " is" : "s are"} already current.`
		);
		return null;
	}

	return overwrite ? [...fresh, ...conflicts] : fresh;
}

function report(
	written: readonly PlannedFile[],
	planned: readonly PlannedFile[],
	requested: readonly string[],
	output: Output
): void {
	const unchanged = planned.length - written.length;
	const items = [...new Set(written.map((file) => file.item))];
	const pulled = items.filter((name) => !requested.includes(name));

	output.success(
		`Wrote ${written.length} file${written.length === 1 ? "" : "s"}${unchanged > 0 ? `, ${unchanged} already current` : ""}.`
	);

	if (!output.silent && written.length > 0) {
		clack.log.message(written.map((file) => `  ${style.path(file.displayPath)}`).join("\n"));
	}

	if (pulled.length > 0) output.info(`Pulled in as dependencies: ${pulled.join(", ")}`);
}

async function install(items: readonly RegistryItem[], project: ProjectInfo, output: Output): Promise<void> {
	const groups = installCommands({
		packageManager: project.packageManager,
		expoDependencies: missingPackages(project.packageJson, collect(items, "expoDependencies")),
		dependencies: missingPackages(project.packageJson, collect(items, "dependencies")),
		devDependencies: missingPackages(project.packageJson, collect(items, "devDependencies")),
	});

	if (groups.length === 0) return;

	// Into the app, never into a shared package: two copies of a native module
	// register twice and break at runtime.
	const cwd = project.appRoot ?? project.packageRoot ?? project.cwd;

	for (const group of groups) {
		await output.task(`${group.label}: ${group.packages.join(", ")}`, () =>
			runInstall(group, { cwd, silent: output.silent })
		);
	}
}

function printSkippedInstall(items: readonly RegistryItem[], output: Output): void {
	const expo = collect(items, "expoDependencies");
	const plain = [...collect(items, "dependencies"), ...collect(items, "devDependencies")];
	if (expo.length === 0 && plain.length === 0) return;

	output.warn(
		[
			"Skipped installing dependencies. These components need:",
			expo.length > 0 ? `  expo install ${expo.join(" ")}` : "",
			plain.length > 0 ? `  ${plain.join(" ")}` : "",
		]
			.filter(Boolean)
			.join("\n")
	);
}

/**
 * A new native module is not live until the app is rebuilt.
 *
 * Reloading the JS bundle will red-box on a module that is not in the binary,
 * and the error names a missing turbo module rather than the component that
 * pulled it in — so it is worth saying plainly, once, at the point it becomes
 * true.
 */
function warnAboutNativeRebuild(items: readonly RegistryItem[], project: ProjectInfo, output: Output): void {
	const added = missingPackages(project.packageJson, collect(items, "expoDependencies"));
	if (added.length === 0) return;

	output.warn(
		[
			`Added native modules: ${added.join(", ")}`,
			"Rebuild the dev client before reloading — a JS reload alone will not pick them up:",
			`  ${style.code("npx expo run:ios")}   ${style.dim("(or run:android)")}`,
		].join("\n")
	);
}

function collect(
	items: readonly RegistryItem[],
	key: "dependencies" | "expoDependencies" | "devDependencies"
): string[] {
	return [...new Set(items.flatMap((item) => item[key]))].sort();
}
