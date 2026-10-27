#!/usr/bin/env bun
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { readConfig } from "../src/config/resolve";
import { CONFIG_FILENAME } from "../src/config/schema";
import { TEST_RUNNERS, type TestRunner } from "../src/registry/test-runner";
import { CHECKS, standaloneItems } from "./verify/checks";
import {
	assertNoCheckoutFallback,
	ENGINE_CASES,
	installUiTarball,
	isPathInside,
	parseConsumerOptions,
	resolveOptionalEngines,
	writeConsumerStyles,
} from "./verify/consumer";
import {
	buildCli,
	EXPO_SDK,
	installWorkspacePackages,
	type Layout,
	removeVerifyArtifacts,
	type Reporter,
	resetVerifyDir,
	runCli,
	scaffoldWorkspace,
	verifyPaths,
} from "./verify/harness";
import {
	bootOnSimulator,
	bundleWithMetro,
	typecheckConsumer,
	writeConsumerScreen,
	writeVerifyScreen,
} from "./verify/render";
import { copiedSuites, prepareTestRunner, runCopiedTests } from "./verify/test-runner";
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
 *   bun run verify:expo --bundle       # compile iOS and Android with Metro
 *   bun run verify:expo --consumer     # check the UI npm tarball in a consumer app
 *   bun run verify:expo --simulator    # also build a dev client and launch it
 *   bun run verify:expo --only button,input
 *   bun run verify:expo --tests jest   # also copy every suite and run it under Jest
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
	/** Copy every component's tests too, and run them under this runner. */
	tests: TestRunner | null;
	/** Where to scaffold, from `--dir`; the default `.verify/app` when unset. */
	dir: string | undefined;
	/** Verify the published UI package from its local npm tarball. */
	consumer: boolean;
};

function parseOptions(argv: string[]): Options {
	const value = (flag: string): string | undefined => {
		const index = argv.indexOf(flag);
		return index === -1 ? undefined : argv[index + 1];
	};

	const only = value("--only");

	const simulator = argv.includes("--simulator");
	let consumerOptions: ReturnType<typeof parseConsumerOptions>;
	try {
		consumerOptions = parseConsumerOptions(argv);
	} catch (error) {
		console.error(error instanceof Error ? error.message : String(error));
		process.exit(2);
	}
	const tests = value("--tests");
	if (tests !== undefined && !TEST_RUNNERS.includes(tests as TestRunner)) {
		console.error(`--tests takes one of ${TEST_RUNNERS.join(", ")}, not "${tests}"`);
		process.exit(2);
	}

	return {
		install: consumerOptions.install,
		keep: argv.includes("--keep") || simulator,
		verbose: argv.includes("--verbose"),
		fresh: argv.includes("--fresh"),
		layout: consumerOptions.layout,
		bundle: argv.includes("--bundle") || simulator,
		simulator,
		registry: value("--registry") ?? join(import.meta.dirname, "../../../registry"),
		only: only ? only.split(",").map((name) => name.trim()) : null,
		tests: (tests as TestRunner | undefined) ?? null,
		dir: value("--dir"),
		consumer: consumerOptions.consumer,
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
  --bundle         Metro resolves iOS and Android bundles and compiles every class
  --simulator      the components render on a device (needs a Mac with Xcode)
  --tests <runner> every copied suite passes under bun, jest or vitest, set up
                   the way the docs say (combines with any level above)

Options
  --only <names>   comma-separated components instead of the whole registry
  --consumer       install the UI npm tarball; check Button/Input, then both engines
  --keep           do not clean up afterwards — keeps node_modules, so the next
                   run skips the install entirely (implied by --simulator)
  --fresh          discard anything a previous --keep left, node_modules included
  --layout <name>  standalone (default) or monorepo — components in a shared
                   package the app imports by name
  --registry <p>   a registry directory or URL (default: this repo's)
  --dir <path>     scaffold here instead of .verify/app; the CLI build and the
                   packed engines go beside it, so runs with different
                   directories can run at the same time. Consumer apps must
                   be outside this repository
  --verbose        stream every subprocess
  --help           this

Notes
  --consumer needs installs and cannot combine with --no-install, --only, --tests
  or --simulator. It checks the UI tarball first, then the packed engine tarballs.
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

const checkoutRoot = resolve(import.meta.dirname, "../../..");
const requestedDir = options.dir ? resolve(process.cwd(), options.dir) : undefined;
if (options.consumer && requestedDir && isPathInside(checkoutRoot, requestedDir)) {
	console.error("--consumer --dir must be outside the repository checkout");
	process.exit(2);
}
const consumerDir =
	options.consumer && !requestedDir ? await mkdtemp(join(tmpdir(), "delacour-consumer-")) : requestedDir;
const paths = verifyPaths(consumerDir, process.cwd());
const appDir = paths.app;
// Every subprocess inherits it, so each `bun add` and `bunx` this run makes uses its own cache.
if (paths.cache) process.env.BUN_INSTALL_CACHE_DIR = paths.cache;
await resetVerifyDir(appDir, { fresh: options.fresh || options.consumer });

let failures = 0;

try {
	reporter.step("Building the CLI");
	const cli = await buildCli(paths.cli, reporter);

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

	if (options.consumer) {
		await verifyConsumerPackage(workspace, paths, cli, options, reporter);
	} else {
		// Before `add`, which would otherwise try npm for a package that lives in
		// this repo — and, until its first publish, is not on npm at all.
		if (options.install) {
			reporter.step("Installing the workspace packages the registry depends on");
			await installWorkspacePackages(workspace, paths.packages, reporter);
		}

		// Before `add`, which reads the runner off this package.json to decide what
		// the copied suites import.
		if (options.tests) {
			reporter.step(`Setting the project up on ${options.tests}`);
			await prepareTestRunner(workspace, options.tests, { expoSdk: EXPO_SDK, install: options.install, reporter });
		}
		const withTests = options.tests ? ["--tests"] : [];

		if (options.only) {
			reporter.step(`delacour add ${options.only.join(" ")}`);
			await runCli(
				cli,
				["add", ...options.only, ...withTests, "--overwrite", "--yes", "--registry", options.registry],
				{
					cwd: workspace.configRoot,
					reporter,
					install: options.install,
				}
			);
		} else {
			// `--all` is components and what they pull in, matching the convention
			// shadcn set. The standalone utilities — the expo navigation theme and
			// its two helpers — are reachable only by name, so they are named here:
			// this run has to cover every item, not most of them.
			reporter.step(`delacour add --all${options.tests ? " --tests" : ""}`);
			await runCli(cli, ["add", "--all", ...withTests, "--overwrite", "--yes", "--registry", options.registry], {
				cwd: workspace.configRoot,
				reporter,
				install: options.install,
			});

			const rest = await standaloneItems(options.registry, workspace.configRoot);
			if (rest.length > 0) {
				reporter.step(`delacour add ${rest.join(" ")}`);
				await runCli(cli, ["add", ...rest, ...withTests, "--overwrite", "--yes", "--registry", options.registry], {
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
				cli,
				only: options.only,
				tests: options.tests,
				reporter,
			});

			if (result.ok) reporter.pass(result.summary);
			else {
				failures += 1;
				reporter.fail(result.summary);
				for (const line of result.details ?? []) reporter.detail(line);
			}
		}

		if (options.tests && options.install) {
			reporter.step(`Every copied suite passes under ${options.tests}`);
			const expected = await copiedSuites(workspace.configRoot);
			const result = await runCopiedTests(workspace.configRoot, options.tests, reporter);

			// The count matters as much as the failures: a runner that matched no
			// files, or skipped a folder, passes everything it found.
			if (result.failed === 0 && result.files === expected.length && expected.length > 0) {
				reporter.pass(`${result.tests} tests across ${result.files} copied suites`);
			} else {
				failures += 1;
				reporter.fail(`${result.failed} failed; ${result.files} suites ran of the ${expected.length} the lock records`);
				for (const line of result.failures.slice(0, 20)) reporter.detail(line);
			}
		} else if (options.tests) {
			reporter.step(`Every copied suite passes under ${options.tests} — skipped (--no-install)`);
		}

		if (options.simulator && failures === 0) {
			reporter.step("Building a dev client and launching it (this takes a while)");
			await bootOnSimulator(workspace.appRoot, reporter);
			reporter.pass("the app is running on a simulator");
			reporter.detail("Verify what it renders with `warden ui`; the app is left in place below.");
		}
	}
} finally {
	// Cleanup means the whole directory, `node_modules` included. Emptying
	// everything *except* it left a 540MB husk behind and called it cleaned.
	if (options.keep)
		console.log(`\nVerification artifacts left beside ${relative(process.cwd(), appDir)} — \`--fresh\` discards them.`);
	else await removeVerifyArtifacts(paths, reporter);
}

console.log(
	failures === 0
		? options.consumer
			? "\n\x1b[32m✓\x1b[0m The UI npm package works in a consumer Expo app.\n"
			: "\n\x1b[32m✓\x1b[0m The CLI produces a working Expo app.\n"
		: `\n\x1b[31m✗\x1b[0m ${failures} check${failures === 1 ? "" : "s"} failed.\n`
);

process.exit(failures === 0 ? 0 : 1);

async function verifyConsumerPackage(
	workspace: Awaited<ReturnType<typeof scaffoldWorkspace>>,
	paths: ReturnType<typeof verifyPaths>,
	cli: string,
	options: Options,
	reporter: Reporter
): Promise<void> {
	reporter.step("delacour add button input (install core native peers)");
	await runCli(cli, ["add", "button", "input", "--overwrite", "--yes", "--registry", options.registry], {
		cwd: workspace.configRoot,
		reporter,
		install: true,
	});

	reporter.step("Packing and installing the UI npm tarball");
	await installUiTarball(workspace, paths.packages, reporter);
	const appPackage = JSON.parse(await Bun.file(join(workspace.appRoot, "package.json")).text()) as {
		dependencies?: Record<string, string>;
		devDependencies?: Record<string, string>;
		optionalDependencies?: Record<string, string>;
	};
	const resolvedEngines = await resolveOptionalEngines(workspace.appRoot);
	if (resolvedEngines.length > 0) {
		throw new Error(`core consumer resolves optional engines before installation: ${resolvedEngines.join(", ")}`);
	}
	await assertNoCheckoutFallback(workspace.appRoot, checkoutRoot, appPackage);
	const config = await readConfig(join(workspace.configRoot, CONFIG_FILENAME));
	const styles = config.aliases.styles ?? "./styles";
	reporter.step("Checking the consumer Button and Input imports");
	await writeConsumerStyles(workspace.appRoot, config.app.resolved.css);
	await writeConsumerScreen(workspace.appRoot, styles, "core", reporter);
	await typecheckConsumer(workspace.appRoot, reporter);
	if (options.bundle) await bundleWithMetro(workspace.appRoot, reporter);
	reporter.pass("the core npm consumer resolves Button and Input before optional engines are added");

	reporter.step("Installing the packed Chart and BottomSheet engines");
	await installWorkspacePackages(workspace, paths.packages, reporter);
	await runCli(cli, ["add", "chart", "bottom-sheet", "--overwrite", "--yes", "--registry", options.registry], {
		cwd: workspace.configRoot,
		reporter,
		install: true,
	});
	reporter.detail(`Engine tarballs installed: ${ENGINE_CASES.join(", ")}`);
	const appPackageAfterEngines = JSON.parse(
		await Bun.file(join(workspace.appRoot, "package.json")).text()
	) as typeof appPackage;
	await assertNoCheckoutFallback(workspace.appRoot, checkoutRoot, appPackageAfterEngines);
	reporter.step("Checking the consumer Chart and BottomSheet imports");
	await writeConsumerStyles(workspace.appRoot, config.app.resolved.css);
	await writeConsumerScreen(workspace.appRoot, styles, "engines", reporter);
	await typecheckConsumer(workspace.appRoot, reporter);
	if (options.bundle) await bundleWithMetro(workspace.appRoot, reporter);
	reporter.pass("the UI npm tarball and both engine tarballs resolve in the Expo app");
}
