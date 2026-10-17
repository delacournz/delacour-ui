#!/usr/bin/env bun
/**
 * Captures component preview media, through warden.
 *
 * For every demo that opts into capture, in both themes: the chrome-free
 * preview route is opened on a leased simulator, the demo announces itself,
 * and it is photographed or recorded and cropped to its stage — see
 * `e2e/previews/capture.ts`, which is where that happens. This script is the
 * orchestrator around it:
 *
 *   1. plans — which demos' media is stale, by source hash
 *   2. runs `warden e2e previews --flows <components> --count N`, which leases
 *      N simulators, installs the dev build, starts one Metro and runs each
 *      component's spec on one of them
 *   3. assembles `apps/web/src/previews/manifest.ts` from the fragments the
 *      specs wrote
 *   4. prunes media whose demo is gone, and enforces the size budget
 *
 *     bun run previews -- --                    # everything, incremental
 *     bun run previews -- -- --only switch,tabs  # these components, or one demo
 *     bun run previews -- -- --force             # ignore the source hashes
 *     bun run previews -- -- --count 3           # fan out over three simulators
 *     bun run previews -- -- --dry-run           # plan, print, run nothing
 *
 * **It writes into another workspace.** The demos are the source of truth and
 * generators live with their source, so this script owns
 * `apps/web/public/previews/**` and `apps/web/src/previews/manifest.ts`. Both
 * are generated; neither is edited by hand.
 *
 * A run is incremental. Each demo's source, meta, spec block and the encode
 * settings are hashed together, and a demo whose hash is unchanged and whose
 * files are all present is skipped — so a run after touching one component
 * rewrites that component's media and nothing else. That is what keeps
 * captured media from becoming permanent churn in a repository that cannot
 * delta-compress it.
 */

import { mkdir, readdir, rm, stat } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import {
	BUDGET_BYTES,
	DEVICE_PROFILE,
	MANIFEST_PATH,
	MEDIA_DIR,
	mediaPaths,
	PLAYGROUND,
	THEMES,
} from "./previews/config";
import { FRAGMENTS_DIR, type Fragment, fragmentPath, PLAN_PATH, type PlanFile } from "./previews/fragments";
import { type PreviewEntryJson, renderManifest } from "./previews/manifest";
import { hasBinary } from "./previews/media";
import { type PlannedDemo, planDemos } from "./previews/plan";
import { specPath } from "./previews/spec-source";

type Options = {
	only: string[];
	force: boolean;
	count: number;
	prune: boolean;
	dryRun: boolean;
	headless: boolean;
};

function parseArgs(argv: readonly string[]): Options {
	const options: Options = { count: 1, dryRun: false, force: false, headless: false, only: [], prune: true };

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		const next = (): string => {
			const value = argv[index + 1];
			if (!value) throw new Error(`${arg} needs a value`);
			index += 1;
			return value;
		};

		switch (arg) {
			case "--only":
				options.only.push(
					...next()
						.split(",")
						.map((id) => id.trim())
						.filter(Boolean)
				);
				break;
			case "--count":
				options.count = Number(next());
				break;
			case "--force":
				options.force = true;
				break;
			case "--dry-run":
				options.dryRun = true;
				break;
			case "--headless":
				options.headless = true;
				break;
			case "--no-prune":
				options.prune = false;
				break;
			case "--dev":
			case "--port":
			case "--device":
				throw new Error(
					`${arg} is gone: warden owns the simulator, the dev build and Metro now. See apps/playground/AGENTS.md.`
				);
			default:
				throw new Error(`Unknown flag ${arg}`);
		}
	}

	if (!Number.isInteger(options.count) || options.count < 1) throw new Error("--count needs a whole number ≥ 1");
	return options;
}

function fail(message: string): never {
	console.error(`\n✗ ${message}\n`);
	process.exit(1);
}

/**
 * Every check that can fail the run, run before anything is leased.
 *
 * Each one names its own fix. The spec checks are the ones that matter most:
 * a demo marked `flow: true` whose block has no body would be published as a
 * still under a clip's name, and a captured demo with no block at all would
 * never be captured and never be missed.
 */
async function preflight(all: readonly PlannedDemo[]): Promise<void> {
	if (!(await hasBinary("ffmpeg"))) fail("ffmpeg is not on PATH. Install it with `brew install ffmpeg`.");
	if (!(await hasBinary("warden")))
		fail("warden is not on PATH. Install it with `npm i -g @delacour/warden && warden install`.");

	for (const demo of all) {
		const spec = relative(PLAYGROUND, specPath(demo.component));
		if (!demo.block) fail(`${demo.id} opts into capture but ${spec} has no capture("${demo.id}") block.`);
		if (demo.source.meta.capture?.flow === true && !demo.block.animated) {
			fail(`${demo.id} is marked \`flow: true\` but its capture("${demo.id}") block in ${spec} has no flow body.`);
		}
		if (demo.source.meta.capture?.flow !== true && demo.block.animated) {
			fail(`${demo.id} has a flow body in ${spec} but its meta does not set \`capture.flow: true\`.`);
		}
	}

	// Against the whole tree, never the `--only` subset: "exactly one hero" is a
	// property of a component, and filtering to one demo would fail it every time.
	const byComponent = new Map<string, PlannedDemo[]>();
	for (const demo of all) {
		byComponent.set(demo.component, [...(byComponent.get(demo.component) ?? []), demo]);
	}
	for (const [component, group] of byComponent) {
		const heroes = group.filter((demo) => demo.hero);
		if (heroes.length !== 1) {
			fail(
				`${component} has ${heroes.length} demos marked \`hero: true\`; it needs exactly one.\n` +
					"  The hero fronts that component's card on the components index."
			);
		}
	}
}

async function exists(path: string): Promise<boolean> {
	return await Bun.file(path).exists();
}

/**
 * `Bun.file(dir).exists()` is false for a directory, so directories get their
 * own check. Using the file one here made both the prune pass and the size
 * budget silently no-op — they reported an empty tree and moved on.
 */
async function dirExists(path: string): Promise<boolean> {
	try {
		return (await stat(path)).isDirectory();
	} catch {
		return false;
	}
}

/**
 * Reads back what the last run published.
 *
 * Bun executes TypeScript directly, so the manifest is imported rather than
 * parsed. A cache-buster on the import path keeps a second run in the same
 * process from seeing a stale module.
 */
async function readExistingManifest(): Promise<Map<string, PreviewEntryJson>> {
	if (!(await exists(MANIFEST_PATH))) return new Map();
	try {
		const module = (await import(`${MANIFEST_PATH}?t=${Date.now()}`)) as {
			previews: Record<string, PreviewEntryJson>;
		};
		return new Map(Object.entries(module.previews));
	} catch (error) {
		console.log(`  note: could not read the existing manifest (${String(error)}); capturing everything.`);
		return new Map();
	}
}

/** Whether a demo's published files all exist for the hash the manifest holds. */
async function filesPresent(demo: PlannedDemo): Promise<boolean> {
	const checks = THEMES.flatMap((theme) => {
		const paths = mediaPaths(demo.id, theme, demo.sourceHash);
		return demo.animated ? [exists(paths.poster), exists(paths.video)] : [exists(paths.poster)];
	});
	return (await Promise.all(checks)).every(Boolean);
}

/** What the specs will read: every stale demo, with what a spec cannot cheaply work out itself. */
async function writePlan(stale: readonly PlannedDemo[]): Promise<void> {
	await rm(FRAGMENTS_DIR, { force: true, recursive: true });
	await mkdir(dirname(PLAN_PATH), { recursive: true });
	const plan: PlanFile = { demos: {}, plannedAt: new Date().toISOString() };
	for (const demo of stale) {
		plan.demos[demo.id] = {
			animated: demo.animated,
			caption: demo.source.meta.caption,
			component: demo.component,
			demo: demo.demo,
			frame: demo.frame,
			id: demo.id,
			leadMs: demo.leadMs,
			sourceHash: demo.sourceHash,
			tailMs: demo.tailMs,
			title: demo.source.meta.title,
		};
	}
	await Bun.write(PLAN_PATH, `${JSON.stringify(plan, null, "\t")}\n`);
}

/** `warden e2e previews --flows <components> --count N`, from the playground, where `warden.config.ts` is. */
function wardenArgv(components: readonly string[], options: Options): string[] {
	return [
		"warden",
		"e2e",
		"previews",
		"--flows",
		components.join(","),
		"--count",
		String(options.count),
		"--profile",
		DEVICE_PROFILE,
		"--report",
		join(dirname(PLAN_PATH), "report.json"),
		...(options.headless ? ["--headless"] : []),
	];
}

/**
 * Runs the suite. A failed flow makes warden exit 1, and that is not the end
 * of the run here: every fragment that was written still counts, and the
 * demos with none are reported by name below.
 */
async function runWarden(argv: readonly string[]): Promise<number> {
	console.log(`\n  $ ${argv.join(" ")}\n`);
	const proc = Bun.spawn([...argv], { cwd: PLAYGROUND, stderr: "inherit", stdin: "inherit", stdout: "inherit" });
	return await proc.exited;
}

async function readFragment(id: string): Promise<Fragment | undefined> {
	const file = Bun.file(fragmentPath(id));
	if (!(await file.exists())) return undefined;
	return (await file.json()) as Fragment;
}

/**
 * Removes media for demos that no longer exist, so a deleted demo does not
 * leave files behind.
 *
 * Recurses to the **leaf** — the directory that actually holds the images —
 * rather than assuming a demo sits exactly two levels down. A folder gallery
 * nests one deeper (`screen/navbar/default`), and a two-level walk would read
 * `screen/navbar` as an unknown demo and delete the whole facet.
 */
async function prune(kept: ReadonlySet<string>): Promise<number> {
	if (!(await dirExists(MEDIA_DIR))) return 0;
	let removed = 0;

	const visit = async (dir: string): Promise<void> => {
		const entries = await readdir(dir, { withFileTypes: true });
		const id = relative(MEDIA_DIR, dir);

		// A directory holding media is a demo; anything else is a path segment.
		if (entries.some((entry) => entry.isFile() && /\.(png|mp4)$/.test(entry.name))) {
			if (!kept.has(id)) {
				await rm(dir, { recursive: true, force: true });
				removed += 1;
			}
			return;
		}

		for (const entry of entries) {
			if (entry.isDirectory()) await visit(join(dir, entry.name));
		}

		// A segment left empty by the deletions above is no longer a path to anything.
		if (id !== "" && (await readdir(dir)).length === 0) await rm(dir, { recursive: true, force: true });
	};

	await visit(MEDIA_DIR);
	return removed;
}

async function directorySize(dir: string): Promise<{ bytes: number; largest: { path: string; bytes: number }[] }> {
	const files: { path: string; bytes: number }[] = [];

	const walk = async (current: string): Promise<void> => {
		for (const entry of await readdir(current, { withFileTypes: true })) {
			const path = join(current, entry.name);
			if (entry.isDirectory()) await walk(path);
			else files.push({ bytes: (await stat(path)).size, path });
		}
	};

	if (await dirExists(dir)) await walk(dir);

	return {
		bytes: files.reduce((total, file) => total + file.bytes, 0),
		largest: files.sort((a, b) => b.bytes - a.bytes).slice(0, 10),
	};
}

function mb(bytes: number): string {
	return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function selected(all: readonly PlannedDemo[], only: readonly string[]): PlannedDemo[] {
	if (only.length === 0) return [...all];
	return all.filter((demo) => only.some((wanted) => demo.id === wanted || demo.id.startsWith(`${wanted}/`)));
}

async function main(): Promise<void> {
	const options = parseArgs(process.argv.slice(2));
	const all = await planDemos();
	const demos = selected(all, options.only);

	if (demos.length === 0) {
		fail(
			options.only.length > 0
				? `No captured demos match "${options.only.join(", ")}".`
				: "No demos opt into capture yet."
		);
	}

	await preflight(all);

	const previous = await readExistingManifest();
	const stale: PlannedDemo[] = [];
	for (const demo of demos) {
		const entry = previous.get(demo.id);
		const unchanged = entry?.sourceHash === demo.sourceHash && (await filesPresent(demo));
		if (!options.force && unchanged) continue;
		stale.push(demo);
	}

	const components = [...new Set(stale.map((demo) => demo.component))];
	console.log(`\n  ${demos.length} demos selected · ${stale.length} to capture across ${components.length} specs`);
	for (const demo of demos) {
		if (!stale.includes(demo)) console.log(`  · ${demo.id} (unchanged)`);
	}

	const failures: { id: string; reason: string }[] = [];
	const entries = new Map<string, PreviewEntryJson>();

	if (stale.length > 0) {
		await writePlan(stale);
		const argv = wardenArgv(components, options);
		if (options.dryRun) {
			console.log(`\n  would run: ${argv.join(" ")}`);
			console.log(`  plan written to ${relative(PLAYGROUND, PLAN_PATH)}:`);
			for (const demo of stale) console.log(`    ${demo.animated ? "▶" : "▪"} ${demo.id}`);
			return;
		}

		const exit = await runWarden(argv);
		if (exit !== 0) console.log(`\n  warden e2e exited ${exit}; assembling what was captured.`);

		for (const demo of stale) {
			const fragment = await readFragment(demo.id);
			if (fragment && fragment.sourceHash === demo.sourceHash) {
				entries.set(demo.id, fragment);
				continue;
			}
			// A flake must not delete working media, so the previous entry stands
			// and the run reports the failure instead of publishing a gap.
			failures.push({
				id: demo.id,
				reason: fragment ? "the fragment is from another hash" : "no fragment was written",
			});
			const old = previous.get(demo.id);
			if (old) entries.set(demo.id, old);
		}
	}

	// Everything that was not captured this run keeps its entry: the unchanged
	// selection, and — only a full run knows the complete set — on a filtered
	// run, every demo outside the selection as well.
	for (const demo of all) {
		if (entries.has(demo.id)) continue;
		const entry = previous.get(demo.id);
		if (entry && (demos.includes(demo) || options.only.length > 0)) entries.set(demo.id, entry);
	}

	const sorted = [...entries.values()].sort((a, b) => a.id.localeCompare(b.id));

	const byComponent = new Map<string, string[]>();
	for (const demo of all) {
		const ids = byComponent.get(demo.component) ?? [];
		if (entries.has(demo.id)) ids.push(demo.id);
		byComponent.set(demo.component, ids);
	}

	const heroes = new Map<string, string>();
	for (const demo of all) {
		if (demo.hero && entries.has(demo.id)) heroes.set(demo.component, demo.id);
	}

	await mkdir(dirname(MANIFEST_PATH), { recursive: true });
	await Bun.write(MANIFEST_PATH, renderManifest(sorted, byComponent, heroes));

	if (options.prune && options.only.length === 0) {
		const removed = await prune(new Set(entries.keys()));
		if (removed > 0) console.log(`\n  pruned ${removed} demo${removed === 1 ? "" : "s"} whose source is gone`);
	}

	const { bytes, largest } = await directorySize(MEDIA_DIR);
	console.log(`\n  ${sorted.length} entries · ${mb(bytes)}`);

	if (failures.length > 0) {
		console.error(`\n  ${failures.length} demo${failures.length === 1 ? "" : "s"} failed:`);
		for (const failure of failures) console.error(`    ${failure.id}  (${failure.reason})`);
		console.error(
			`\n  Evidence: ${relative(PLAYGROUND, join(dirname(PLAN_PATH), "report.json"))}, then the batch dir it names.`
		);
		process.exit(1);
	}

	if (bytes > BUDGET_BYTES) {
		console.error(`\n  Media is ${mb(bytes)}, over the ${mb(BUDGET_BYTES)} budget. Largest files:`);
		for (const file of largest) console.error(`    ${mb(file.bytes).padStart(9)}  ${file.path}`);
		console.error(
			"\n  Cut demos, lower MAX_EDGE or DEVICE_MAX_EDGE, or raise BUDGET_BYTES deliberately in scripts/previews/config.ts."
		);
		process.exit(1);
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
