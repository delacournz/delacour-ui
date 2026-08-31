#!/usr/bin/env node
import { resolve } from "node:path";
import { Command, Option } from "commander";
import { add } from "./commands/add";
import { info, list, search, view } from "./commands/browse";
import { diff } from "./commands/diff";
import { doctor } from "./commands/doctor";
import { init } from "./commands/init";
import { mcp } from "./commands/mcp";
import { theme } from "./commands/theme";
import { MissingConfigError } from "./config/resolve";
import { CONFIG_FILENAME } from "./config/schema";
import { RegistryFetchError } from "./registry/client";
import { UnknownItemError } from "./registry/resolve";
import { DEFAULT_REGISTRY_REF } from "./registry/source";
import { CancelledError, style } from "./ui/output";

/**
 * `delacour` — React Native components you own, for Expo apps.
 *
 * Every command takes the same four registry options, so a project pinned to a
 * fork or a ref does not have to say so twice. `--cwd` is resolved once, here,
 * and every command works from the config nearest to it.
 *
 * `add` and `init` take `--install` and `--no-install` both, which is not
 * redundant: commander only applies a default to a `--no-` option declared
 * alone, so declaring the pair leaves the value **undefined** when neither is
 * passed. Three states, and the third is the one that matters — unset means ask
 * when there is someone to ask, and install nothing when there is not.
 */

const program = new Command()
	.name("delacour")
	.description("Add React Native components to your Expo app. You own the code.")
	.version(process.env.npm_package_version ?? "0.1.0");

/** Shared by every command that reads the registry. */
function withRegistryOptions(command: Command): Command {
	return command
		.addOption(new Option("--registry <url>", "registry to read from: a URL, github:owner/repo, or a local path"))
		.addOption(new Option("--ref <ref>", "git ref to read the registry at").default(DEFAULT_REGISTRY_REF))
		.addOption(new Option("--offline", "use only what is already cached"))
		.addOption(new Option("-c, --cwd <path>", "directory to work in").default(process.cwd()));
}

withRegistryOptions(
	program
		.command("init", { isDefault: false })
		.description(`set this project up and write ${CONFIG_FILENAME}`)
		.argument("[components...]", "components to add straight away")
		.option("-y, --yes", "accept every default without asking")
		.option("-d, --defaults", "use the default layout without asking")
		.option("-f, --force", `rewrite an existing ${CONFIG_FILENAME}`)
		.option("-s, --src <dir>", "base directory for source files")
		.option("--package-name <name>", "put the components in a shared package with this name")
		.option("--package-path <dir>", "where that package goes, relative to the workspace root", "packages/ui")
		// `--install` first, so commander leaves the value undefined when neither
		// is passed. That third state is the prompt: unset means ask.
		.option("--install", "install the packages the components need, without asking")
		.option("--no-install", "write the files and install nothing")
		.option("--silent", "print nothing but errors")
).action((components: string[], options) => run(() => init(components, { ...options, cwd: resolve(options.cwd) })));

withRegistryOptions(
	program
		.command("add")
		.description("copy components into this project")
		.argument("[components...]", "components to add")
		.option("-a, --all", "add every component")
		.option("-o, --overwrite", "replace files that differ")
		.option("-y, --yes", "accept every default without asking")
		.option("--install", "install the packages the components need, without asking")
		.option("--no-install", "write the files and install nothing")
		.option("--silent", "print nothing but errors")
).action((components: string[], options) => run(() => add(components, { ...options, cwd: resolve(options.cwd) })));

withRegistryOptions(
	program.command("list").alias("ls").description("list what the registry holds").option("--json", "print JSON")
).action((options) => run(() => list({ ...options, cwd: resolve(options.cwd) })));

withRegistryOptions(
	program.command("search").description("search the registry").argument("<query>").option("--json", "print JSON")
).action((query: string, options) => run(() => search(query, { ...options, cwd: resolve(options.cwd) })));

withRegistryOptions(
	program
		.command("view")
		.description("show one item and what it pulls in")
		.argument("<name>")
		.option("--json", "print JSON")
).action((name: string, options) => run(() => view(name, { ...options, cwd: resolve(options.cwd) })));

withRegistryOptions(
	program.command("info").description("show the resolved config and what was detected").option("--json", "print JSON")
).action((options) => run(() => info({ ...options, cwd: resolve(options.cwd) })));

withRegistryOptions(
	program
		.command("diff")
		.description("show what has changed upstream since these files were copied")
		.argument("[name]", "one component, or every installed one")
		.option("--silent", "print nothing but errors")
).action((name: string | undefined, options) => run(() => diff(name, { ...options, cwd: resolve(options.cwd) })));

program
	.command("mcp")
	.description("run as an MCP server, so an agent can browse and add components")
	.option("-c, --cwd <path>", "directory to work in", process.cwd())
	.option("--registry <url>", "registry to read from")
	.option("--ref <ref>", "git ref to read the registry at")
	.action((options) => run(() => mcp({ ...options, cwd: resolve(options.cwd) })));

program
	.command("theme")
	.description("bring a shadcn or tweakcn theme across from a web app")
	.argument("[source]", "a CSS file, a URL, or `-` to read stdin")
	.option("-c, --cwd <path>", "directory to work in", process.cwd())
	.option("--dry-run", "print the CSS instead of writing it")
	.option("-y, --yes", "replace theme.css without asking")
	.option("--silent", "print nothing but errors")
	.action((source: string | undefined, options) => run(() => theme(source, { ...options, cwd: resolve(options.cwd) })));

program
	.command("doctor")
	.description("check that this Expo app is wired up for these components")
	.option("-c, --cwd <path>", "directory to work in", process.cwd())
	.option("--json", "print JSON")
	.option("--fast", "skip the checks that shell out to the Expo CLI")
	.option("--silent", "print nothing but errors")
	.action((options) => run(() => doctor({ ...options, cwd: resolve(options.cwd) })));

/**
 * One place where a failure becomes a message.
 *
 * The errors the CLI raises on purpose already say what to do about them, so
 * they are printed as they are. Anything else keeps its stack — an unexpected
 * failure is a bug report, and swallowing the stack costs the person reporting
 * it the only useful part.
 */
async function run(command: () => Promise<unknown>): Promise<void> {
	try {
		// `doctor` returns an exit code; every other command resolves to nothing.
		const code = await command();
		if (typeof code === "number" && code !== 0) process.exit(code);
	} catch (error) {
		if (error instanceof CancelledError) {
			process.stderr.write(`${style.dim("Cancelled.")}\n`);
			process.exit(130);
		}

		if (
			error instanceof MissingConfigError ||
			error instanceof UnknownItemError ||
			error instanceof RegistryFetchError
		) {
			process.stderr.write(`${style.red("✗")} ${error.message}\n`);
			process.exit(1);
		}

		if (error instanceof Error) {
			process.stderr.write(`${style.red("✗")} ${error.message}\n${style.dim(error.stack ?? "")}\n`);
			process.exit(1);
		}

		throw error;
	}
}

program.parseAsync(process.argv);
