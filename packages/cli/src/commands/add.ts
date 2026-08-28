import { relative } from "node:path";
import * as clack from "@clack/prompts";
import { findConfig, loadConfig, MissingConfigError, type ResolvedConfig } from "../config/resolve";
import { CONFIG_FILENAME } from "../config/schema";
import { detectProject, type ProjectInfo } from "../project/detect";
import {
	commandLine,
	type DependencyPlan,
	missingPackages,
	planDependencies,
	runInstall,
} from "../project/package-manager";
import { linkPackageToApp, syncSharedPackage } from "../project/shared-package";
import { type PlannedFile, planFiles, writeFiles } from "../project/write-files";
import { createRegistryClient } from "../registry/client";
import { resolveItemGraph } from "../registry/resolve";
import type { RegistryItem } from "../registry/schema";
import { createOutput, type Output, style } from "../ui/output";

/**
 * Copies components into the project, with everything they need.
 *
 * The order matters and is not arbitrary: resolve the graph, plan every file,
 * ask once about conflicts, write, then report what the components need from
 * npm and offer to install it. Installing first would leave a project with new
 * native dependencies and no components if the user answered "no" to the
 * overwrite prompt.
 *
 * The report is unconditional and the install is not. Copying source is local
 * and reversible; running someone's package manager is neither, and a component
 * whose native modules arrive at a version the SDK cannot build fails at the
 * linker rather than here. So `add` always says what is needed, and installs
 * when told to — `--install`, or a yes at the prompt.
 */

export type AddOptions = {
	cwd: string;
	all?: boolean;
	overwrite?: boolean;
	yes?: boolean;
	silent?: boolean;
	/** `true` installs, `false` never does, unset asks when there is someone to ask. */
	install?: boolean;
	offline?: boolean;
	ref?: string;
	registry?: string;
};

/**
 * What a run did, for a caller that printed none of it.
 *
 * `mcp` runs `add` silently — its stdout is a JSON-RPC stream — so the block a
 * human reads has to reach an agent some other way. `null` is a run that copied
 * nothing: an unconfigured project handed to `init`, or a conflict declined.
 */
export type AddResult = {
	/** Every item copied, the dependency closure included. */
	items: string[];
	written: number;
	dependencies: DependencyPlan;
	/** Whether the package manager was actually run. */
	installed: boolean;
};

export async function add(names: string[], options: AddOptions): Promise<AddResult | null> {
	const output = createOutput(options);

	// Interactively, an unconfigured project is a question rather than an error.
	// Non-interactively it stays an error: a script must not be silently
	// reconfigured because a file happened to be missing.
	if (!findConfig(options.cwd) && output.interactive) {
		const { init } = await import("./init");
		const setUp = await output.confirm(`No ${CONFIG_FILENAME} here. Set this project up first?`, true);
		if (!setUp) throw new MissingConfigError(options.cwd);

		await init(names, options);
		return null;
	}

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
		return null;
	}

	const byName = new Map(index.items.map((item) => [item.name, item]));
	const order = resolveItemGraph(requested, (name) => byName.get(name));
	// Metadata first, then the files it names. The client caps how many of those
	// are in flight, so asking for the whole closure at once is safe.
	const items = await output.task(`Fetching ${order.length} item${order.length === 1 ? "" : "s"}`, async () => {
		const fetched = await Promise.all(order.map((name) => client.getItem(name)));
		return Promise.all(fetched.map((item) => client.loadItem(item)));
	});

	const planned = await planFiles(items, config);
	const toWrite = await resolveConflicts(planned, options, output);
	if (toWrite === null) return null;

	await writeFiles(toWrite);
	report(toWrite, planned, requested, output);

	// After the write, so the map is derived from what is on disk rather than
	// from what this run believed it wrote.
	await syncPackage(config, items, output);

	// Into the app, never into a shared package: two copies of a native module
	// register twice and break at runtime.
	const appRoot = project.appRoot ?? project.packageRoot ?? project.cwd;
	const plan = planDependencies(
		{
			packageManager: project.packageManager,
			expoDependencies: collect(items, "expoDependencies"),
			dependencies: collect(items, "dependencies"),
			devDependencies: collect(items, "devDependencies"),
		},
		project.packageJson
	);

	reportDependencies(plan, output);
	const result = { items: items.map((item) => item.name), written: toWrite.length, dependencies: plan };

	if (!(await shouldInstall(plan, options, output))) {
		printSkippedInstall(plan, relative(options.cwd, appRoot), output);
		return { ...result, installed: false };
	}

	for (const group of plan.groups) {
		await output.task(`${group.label}: ${group.packages.join(", ")}`, () =>
			runInstall(group, { cwd: appRoot, silent: output.silent })
		);
	}

	warnAboutNativeRebuild(items, project, output);
	return { ...result, installed: true };
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

/**
 * What these components need from npm, printed every time.
 *
 * Every time, including the run where nothing is missing. A component that
 * needs `@gorhom/bottom-sheet` and got it three components ago is not the same
 * thing as a component that needs nothing, and a reader who sees no block at
 * all cannot tell which they are looking at.
 *
 * The missing packages are shown as the commands that would install them rather
 * than as a list of names, because the commands are the part that is not
 * obvious: a native module goes through `expo install` so the SDK picks a
 * version it can build, and a plain one through whichever package manager this
 * project is on.
 */
function reportDependencies(plan: DependencyPlan, output: Output): void {
	if (plan.wanted.length === 0) return;

	const lines = plan.groups.map((group) => `  ${style.code(commandLine(group))}`);
	if (plan.satisfied.length > 0) {
		lines.push(`  ${style.dim(`already installed — ${plan.satisfied.join(", ")}`)}`);
	}

	output.info(
		[
			plan.missing.length === 0
				? `Needs ${count(plan.wanted, "external package")}, all already here.`
				: `Needs ${count(plan.wanted, "external package")}, ${plan.missing.length} not here yet:`,
			...lines,
		].join("\n")
	);
}

/**
 * Whether to actually run the package manager.
 *
 * Unset means ask, and a run with no one to ask installs nothing — a script, a
 * CI job or an agent gets the report and decides for itself. `--install` is how
 * any of them says yes.
 */
async function shouldInstall(plan: DependencyPlan, options: AddOptions, output: Output): Promise<boolean> {
	if (plan.groups.length === 0) return false;
	if (options.install !== undefined) return options.install;
	if (!output.interactive) return false;

	return output.confirm(`Install ${count(plan.missing, "package")} now?`, true);
}

/**
 * Keeps the shared package's `exports` map and peers in step with its contents.
 *
 * A no-op when the components live in the app: there is no package boundary to
 * cross, so nothing needs exporting.
 *
 * The peers are the same packages `install` puts in the **app** — the app owns
 * the versions, because `expo install` pins them against the SDK. Recording them
 * as peers here rather than dependencies is the rule that keeps one copy of each
 * native module in the tree.
 */
async function syncPackage(config: ResolvedConfig, items: readonly RegistryItem[], output: Output): Promise<void> {
	const peers = [...collect(items, "expoDependencies"), ...collect(items, "dependencies")];
	const result = await syncSharedPackage(config, peers);
	if (!result) return;

	output.success(`${result.created ? "Wrote" : "Updated"} package.json — ${result.exportCount} exports`);

	if (await linkPackageToApp(config)) {
		output.info(`Added ${style.code(`"${config.package?.name}": "workspace:*"`)} to the app. Re-run your install.`);
	}
}

/**
 * Says the components will not build yet, and where to fix that.
 *
 * `appPath` matters more than it looks. The components may live in a shared
 * package, and running the install from there is the one thing that reliably
 * breaks the app — a native module resolved from two realpaths registers twice.
 */
function printSkippedInstall(plan: DependencyPlan, appPath: string, output: Output): void {
	if (plan.groups.length === 0) return;

	output.warn(
		`Nothing installed — these components will not build until you run the ${
			plan.groups.length === 1 ? "command" : "commands"
		} above${appPath === "" || appPath === "." ? "" : ` in ${style.path(appPath)}`}, or re-run with ${style.code("--install")}.`
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

function count(items: readonly unknown[], noun: string): string {
	return `${items.length} ${noun}${items.length === 1 ? "" : "s"}`;
}

function collect(
	items: readonly RegistryItem[],
	key: "dependencies" | "expoDependencies" | "devDependencies"
): string[] {
	return [...new Set(items.flatMap((item) => item[key]))].sort();
}
