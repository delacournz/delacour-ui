#!/usr/bin/env bun
import { join, relative } from "node:path";
import { readConfig } from "../src/config/resolve";
import { CONFIG_FILENAME } from "../src/config/schema";
import { CHECKS, standaloneItems } from "./verify/checks";
import {
	buildCli,
	type Layout,
	type Reporter,
	removeVerifyDir,
	resetVerifyDir,
	runCli,
	scaffoldWorkspace,
	VERIFY_DIR,
} from "./verify/harness";
import { bootOnSimulator, bundleWithMetro, writeVerifyScreen } from "./verify/render";

/**
 * Proves the CLI works against a real Expo app, for every component at once.
 *
 * The unit tests copy files into a fixture directory and assert on the result.
 * That catches a broken path but not a broken *component*: an import naming a
 * package nobody installed, a peer the registry never classified, a type that
 * only resolves inside this monorepo. Those surface the first time someone runs
 * the CLI in a real project, which is the worst place to find them.
 *
 * So this scaffolds an actual Expo app in a temp directory, installs Uniwind
 * and Tailwind the way a consumer would, runs `init` and `add --all`, and then
 * typechecks the result. If `tsc` is clean, every one of the copied components
 * resolves every import it makes.
 *
 * It installs from npm and drives the Expo CLI, so it is a script rather than a
 * test — `bun test` has to stay fast and offline.
 *
 * Usage:
 *   bun run verify:expo                # the full run
 *   bun run verify:expo --no-install   # structure only, no network
 *   bun run verify:expo --keep         # leave the app behind, node_modules and all
 *   bun run verify:expo --fresh        # discard whatever a previous --keep left
 *   bun run verify:expo --bundle       # also compile it with Metro
 *   bun run verify:expo --simulator    # also build a dev client and launch it
 *   bun run verify:expo --only button,input
 */

type Options = {
	install: boolean;
	keep: boolean;
	registry: string;
	only: string[] | null;
	verbose: boolean;
	/** Discard `node_modules` as well, rather than reusing the previous install. */
	fresh: boolean;
	layout: Layout;
	/** Run the components through Metro, which is the only stage that exercises the Uniwind transform. */
	bundle: boolean;
	/** Build a dev client and launch it. Implies `bundle`. Needs a Mac with Xcode. */
	simulator: boolean;
};

function parseOptions(argv: string[]): Options {
	const value = (flag: string): string | undefined => {
		const index = argv.indexOf(flag);
		return index === -1 ? undefined : argv[index + 1];
	};

	const only = value("--only");

	const simulator = argv.includes("--simulator");

	return {
		install: !argv.includes("--no-install"),
		keep: argv.includes("--keep") || simulator,
		verbose: argv.includes("--verbose"),
		fresh: argv.includes("--fresh"),
		layout: value("--layout") === "monorepo" || argv.includes("--monorepo") ? "monorepo" : "standalone",
		bundle: argv.includes("--bundle") || simulator,
		simulator,
		registry: value("--registry") ?? join(import.meta.dirname, "../../../registry"),
		only: only ? only.split(",").map((name) => name.trim()) : null,
	};
}

const HELP = `delacour verify:expo — prove the CLI produces a working Expo app

  Scaffolds a real Expo app in a temp directory, installs Uniwind and Tailwind,
  runs \`delacour init\`, adds every registry item, and checks the result.

Usage
  bun run verify:expo [options]

Levels, each catching what the one above cannot
  --no-install     the right files land, with the right imports (offline, seconds)
  (default)        every import resolves and every type lines up (tsc)
  --bundle         Metro resolves every module and Uniwind compiles every class
  --simulator      the components render on a device (needs a Mac with Xcode)

Options
  --only <names>   comma-separated components instead of the whole registry
  --keep           do not clean up afterwards — keeps node_modules, so the next
                   run skips the install entirely (implied by --simulator)
  --fresh          discard anything a previous --keep left, node_modules included
  --layout <name>  standalone (default) or monorepo — components in a shared
                   package the app imports by name
  --registry <p>   a registry directory or URL (default: this repo's)
  --verbose        stream every subprocess
  --help           this

Notes
  --simulator builds a dev client in Release, so the JS is embedded and the app
  renders without a Metro server. Expo Go cannot load it: Reanimated, Gesture
  Handler and the keyboard controller are native modules.
`;

if (process.argv.includes("--help") || process.argv.includes("-h")) {
	console.log(HELP);
	process.exit(0);
}

const options = parseOptions(process.argv.slice(2));
const reporter: Reporter = {
	step: (message) => console.log(`\n\x1b[36m→\x1b[0m ${message}`),
	pass: (message) => console.log(`  \x1b[32m✓\x1b[0m ${message}`),
	fail: (message) => console.log(`  \x1b[31m✗\x1b[0m ${message}`),
	detail: (message) => console.log(`      \x1b[2m${message}\x1b[0m`),
	verbose: options.verbose,
};

const appDir = VERIFY_DIR;
await resetVerifyDir(appDir, { fresh: options.fresh });

let failures = 0;

try {
	reporter.step("Building the CLI");
	const cli = await buildCli(reporter);

	reporter.step(`Scaffolding a ${options.layout} project in ${relative(process.cwd(), appDir)}`);
	const workspace = await scaffoldWorkspace(appDir, {
		install: options.install,
		reporter,
		layout: options.layout,
	});

	reporter.step("delacour init");
	await runCli(
		cli,
		[
			"init",
			"--defaults",
			"--yes",
			"--registry",
			options.registry,
			// Selects the shared-package layout without a prompt, and names it.
			...(workspace.packageName ? ["--package-name", workspace.packageName] : []),
			...(workspace.packagePath ? ["--package-path", workspace.packagePath] : []),
		],
		// From the workspace root, not the package: the package does not exist
		// yet, and a process cannot have a cwd that is not there. This is also
		// the real invocation — `init` decides the location, rather than being
		// told by having been run inside it.
		{ cwd: workspace.installRoot, reporter, install: options.install }
	);

	if (options.only) {
		reporter.step(`delacour add ${options.only.join(" ")}`);
		await runCli(cli, ["add", ...options.only, "--overwrite", "--yes", "--registry", options.registry], {
			cwd: workspace.configRoot,
			reporter,
			install: options.install,
		});
	} else {
		// `--all` is components and what they pull in, matching the convention
		// shadcn set. The standalone utilities — the expo navigation theme and
		// its two helpers — are reachable only by name, so they are named here:
		// this run has to cover every item, not most of them.
		reporter.step("delacour add --all");
		await runCli(cli, ["add", "--all", "--overwrite", "--yes", "--registry", options.registry], {
			cwd: workspace.configRoot,
			reporter,
			install: options.install,
		});

		const rest = await standaloneItems(options.registry, workspace.configRoot);
		if (rest.length > 0) {
			reporter.step(`delacour add ${rest.join(" ")}`);
			await runCli(cli, ["add", ...rest, "--overwrite", "--yes", "--registry", options.registry], {
				cwd: workspace.configRoot,
				reporter,
				install: options.install,
			});
		}
	}

	// Always, not only under --bundle. This is the step that performs the CLI's
	// own documented follow-up — importing the CSS entry — so skipping it left
	// the default level checking an app that was knowingly misconfigured.
	reporter.step("Writing a screen that mounts every component");
	await writeVerifyScreen({
		appDir: workspace.appRoot,
		config: await readConfig(join(workspace.configRoot, CONFIG_FILENAME)),
		reporter,
	});

	if (options.bundle) {
		reporter.step("Bundling with Metro (expo export)");
		await bundleWithMetro(workspace.appRoot, reporter);
		reporter.pass("Metro resolved every module and Uniwind compiled every class");
	}

	for (const check of CHECKS) {
		if (check.needsInstall && !options.install) {
			reporter.step(`${check.name} — skipped (--no-install)`);
			continue;
		}

		reporter.step(check.name);
		const result = await check.run({
			appDir: workspace.appRoot,
			configDir: workspace.configRoot,
			workspaceRoot: workspace.installRoot,
			registryDir: options.registry,
			only: options.only,
			reporter,
		});

		if (result.ok) reporter.pass(result.summary);
		else {
			failures += 1;
			reporter.fail(result.summary);
			for (const line of result.details ?? []) reporter.detail(line);
		}
	}
	if (options.simulator && failures === 0) {
		reporter.step("Building a dev client and launching it (this takes a while)");
		await bootOnSimulator(workspace.appRoot, reporter);
		reporter.pass("the app is running on a simulator");
		reporter.detail("Verify what it renders with argent; the app is left in place below.");
	}
} finally {
	// Cleanup means the whole directory, `node_modules` included. Emptying
	// everything *except* it left a 540MB husk behind and called it cleaned.
	if (options.keep) console.log(`\nApp left at ${relative(process.cwd(), appDir)} — \`--fresh\` discards it.`);
	else await removeVerifyDir(appDir, reporter);
}

console.log(
	failures === 0
		? "\n\x1b[32m✓\x1b[0m The CLI produces a working Expo app.\n"
		: `\n\x1b[31m✗\x1b[0m ${failures} check${failures === 1 ? "" : "s"} failed.\n`
);

process.exit(failures === 0 ? 0 : 1);
