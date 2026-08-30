#!/usr/bin/env bun
/**
 * Captures component preview media from a simulator.
 *
 * For every demo that opts into capture, in both themes: deep-link the
 * chrome-free preview route, wait for the demo to announce itself, screenshot,
 * crop the stage out, and write the result into `apps/web/public/previews/`.
 * Then emit the manifest the documentation site reads.
 *
 *     bun run previews                      # everything, incremental
 *     bun run previews -- --only switch     # one component
 *     bun run previews -- --force           # ignore the source hashes
 *     bun run previews -- --dev             # against a running dev client
 *
 * **It writes into another workspace.** The demos are the source of truth and
 * generators live with their source, so this script owns
 * `apps/web/public/previews/**` and `apps/web/src/previews/manifest.ts`. Both
 * are generated; neither is edited by hand.
 *
 * A run is incremental. Each demo's source, meta, flow and the encode settings
 * are hashed together, and a demo whose hash is unchanged and whose files are
 * all present is skipped — so a run after touching one component rewrites that
 * component's media and nothing else. That is what keeps captured media from
 * becoming permanent churn in a repository that cannot delta-compress it.
 */

import { mkdir, readdir, rm, stat } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import {
	awaitElement,
	awaitIdle,
	bootDevice,
	type Device,
	describe,
	devtoolsConnected,
	listDevices,
	openUrl,
	readFlags,
	restartApp,
	runFlow,
	screenshot,
	startRecording,
	stopRecording,
} from "./previews/argent";
import {
	BUDGET_BYTES,
	BUNDLE_ID,
	DEVICE_NAME,
	MANIFEST_PATH,
	MAX_EDGE,
	MEDIA_DIR,
	PAD_POINTS,
	RECORDING_CAP_SECONDS,
	SCHEME,
	THEMES,
	type Theme,
} from "./previews/config";
import { type PreviewEntryJson, renderManifest } from "./previews/manifest";
import {
	boundsCrop,
	type CropRect,
	cropImage,
	type DemoBounds,
	deviceCrop,
	encodeVideo,
	extractPoster,
	hasBinary,
	probeDurationMs,
	targetSize,
} from "./previews/media";
import { type PlannedDemo, planDemos } from "./previews/plan";

type Options = {
	only?: string;
	force: boolean;
	dev: boolean;
	device?: string;
	themes: readonly Theme[];
	prune: boolean;
};

function parseArgs(argv: readonly string[]): Options {
	const options: Options = { dev: false, force: false, prune: true, themes: THEMES };

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		const next = (): string => {
			const value = argv[index + 1];
			if (!value) throw new Error(`${arg} needs a value`);
			index += 1;
			return value;
		};

		if (arg === "--only") options.only = next();
		else if (arg === "--device") options.device = next();
		else if (arg === "--themes") options.themes = next().split(",") as Theme[];
		else if (arg === "--force") options.force = true;
		else if (arg === "--dev") options.dev = true;
		else if (arg === "--no-prune") options.prune = false;
		else throw new Error(`Unknown flag ${arg}`);
	}

	return options;
}

function fail(message: string): never {
	console.error(`\n✗ ${message}\n`);
	process.exit(1);
}

/**
 * Every check that can fail the run, run before anything is captured.
 *
 * Each one names its own fix. The two argent flags are asserted rather than
 * assumed because both default the wrong way for this job, and the failure they
 * cause is invisible until somebody looks closely at published media.
 */
async function preflight(options: Options, all: readonly PlannedDemo[]): Promise<void> {
	if (!(await hasBinary("ffmpeg"))) fail("ffmpeg is not on PATH. Install it with `brew install ffmpeg`.");

	const flags = await readFlags();
	if (flags["video-watermark"] !== false) {
		fail(
			"argent's video-watermark flag is on, so every recording would carry its logo.\n" +
				"  Fix: argent disable video-watermark --scope project"
		);
	}
	if (flags["disable-auto-screenshot"] !== true) {
		fail(
			"argent's disable-auto-screenshot flag is off, so every interaction round-trips a\n" +
				"  screenshot nothing reads.\n  Fix: argent enable disable-auto-screenshot --scope project"
		);
	}

	for (const demo of all) {
		if (demo.flowPath && !(await Bun.file(demo.flowPath).exists())) {
			fail(`${demo.id} names a flow that does not exist: ${demo.flowPath}`);
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

	if (!options.dev) {
		console.log("  note: --dev not passed, but the Release build step is not wired up yet.");
	}
}

async function resolveDevice(options: Options): Promise<Device> {
	const devices = await listDevices();
	const wanted = options.device;

	const match = wanted
		? devices.find((device) => device.udid === wanted || device.name === wanted)
		: (devices.find((device) => device.name === DEVICE_NAME && device.state === "Booted") ??
			devices.find((device) => device.name === DEVICE_NAME));

	if (!match) fail(`No simulator matching ${wanted ?? DEVICE_NAME}. Run \`argent run list-devices\`.`);
	if (match.state !== "Booted") {
		console.log(`  booting ${match.name}…`);
		await bootDevice(match.udid);
	}

	return match;
}

/**
 * Where a demo's media lives, and the URLs the manifest points at.
 *
 * Keyed on the **full id**, not component + demo. A folder gallery nests
 * (`screen/navbar/default`), and two facets are free to name a demo the same
 * thing — `screen/navbar/default` and `screen/chat/default` would collide the
 * moment the path were flattened to component + name.
 */
function mediaPaths(demo: PlannedDemo, theme: Theme, hash: string) {
	const dir = join(MEDIA_DIR, demo.id);
	return {
		dir,
		poster: join(dir, `${theme}.png`),
		posterUrl: `/previews/${demo.id}/${theme}.png?v=${hash}`,
		video: join(dir, `${theme}.mp4`),
		videoUrl: `/previews/${demo.id}/${theme}.mp4?v=${hash}`,
	};
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

/**
 * Pulls the demo's measured rect out of the sentinel's accessibility label.
 *
 * The label is `preview-ready:<id>:<theme>:<x>,<y>,<w>,<h>:<winW>x<winH>`, all
 * in points. Points rather than pixels because that is what React Native
 * measures in; the caller scales by the screenshot's own width.
 */
function parseBounds(description: string, sentinel: string): DemoBounds | null {
	for (const line of description.split("\n")) {
		const index = line.indexOf(sentinel);
		if (index === -1) continue;

		const match = line.slice(index + sentinel.length).match(/^(-?\d+),(-?\d+),(\d+),(\d+):(\d+)x(\d+)/);
		if (!match) continue;

		const [, x, y, width, height, windowWidth, windowHeight] = match.map(Number);
		if (width === undefined || height === undefined) continue;

		return {
			height,
			width,
			windowHeight: windowHeight as number,
			windowWidth: windowWidth as number,
			x: x as number,
			y: y as number,
		};
	}
	return null;
}

type Captured = { width: number; height: number; durationMs?: number };

/**
 * Navigates to a demo and captures it — a still, or a clip if it names a flow.
 *
 * The order is load-bearing. Recording starts *before* the lead pad so the clip
 * opens on a settled screen rather than mid-transition; the tail pad runs
 * before the stop so the last interaction's touch pulse has faded, which is
 * what stops the loop showing a ghost tap at the seam.
 */
async function captureDemo(
	udid: string,
	demo: PlannedDemo,
	theme: Theme,
	geometry: { width: number; height: number }
): Promise<Captured> {
	const url = `${SCHEME}://preview?component=${demo.component}&demo=${demo.demo}&theme=${theme}`;
	await openUrl(udid, url);

	const sentinel = `preview-ready:${demo.id}:${theme}:`;
	if (!(await awaitElement(udid, sentinel))) {
		throw new Error(
			`the preview never announced itself (${sentinel}).\n` +
				"      Either the deep link did not navigate, or the demo threw while rendering."
		);
	}

	// The screen must hold still before it is worth photographing — see awaitIdle.
	await awaitIdle(udid);

	const bounds = parseBounds(await describe(udid), sentinel);
	if (!bounds) throw new Error(`could not read the demo's measured bounds from ${sentinel}`);

	const { dir, poster, video } = mediaPaths(demo, theme, demo.sourceHash);
	await mkdir(dir, { recursive: true });

	const crop = demo.frame === "device" ? deviceCrop(geometry) : boundsCrop(geometry, bounds, PAD_POINTS);
	const size = targetSize(crop, MAX_EDGE);

	if (!demo.flowPath) {
		const raw = join(dir, `.${theme}.raw.png`);
		await screenshot(udid, raw);
		await cropImage(raw, poster, crop, size);
		await rm(raw, { force: true });
		return size;
	}

	return await captureMotion(udid, demo, { crop, dir, poster, size, theme, video });
}

async function captureMotion(
	udid: string,
	demo: PlannedDemo,
	target: {
		crop: CropRect;
		dir: string;
		poster: string;
		size: { width: number; height: number };
		theme: Theme;
		video: string;
	}
): Promise<Captured> {
	const lead = demo.leadMs;
	const tail = demo.tailMs;

	await startRecording(udid, RECORDING_CAP_SECONDS);

	let raw: string;
	let warning: string | undefined;
	try {
		await Bun.sleep(lead);
		const flow = await runFlow(demo.flowPath as string, udid);
		if (!flow.ok) throw new Error(`the flow failed: ${flow.detail || "see argent flow run output"}`);
		await Bun.sleep(tail);
	} finally {
		// Always stop: a recording left running holds the device's single slot
		// and every later demo fails on "a recording is already running".
		const recording = await stopRecording(udid);
		raw = recording.video;
		warning = recording.warning;
	}

	// Outside the `finally` on purpose. A throw in there replaces whatever the
	// try block was throwing, so a failed flow got reported as an untrustworthy
	// recording and the operator never saw the message that would have helped.
	if (warning) throw new Error(`the recording is not trustworthy: ${warning}`);

	await encodeVideo(raw, target.video, target.crop, target.size);
	await extractPoster(target.video, target.poster);
	await rm(raw, { force: true });

	return { ...target.size, durationMs: await probeDurationMs(target.video) };
}

/** Device pixel size, read off the first screenshot rather than hardcoded per model. */
async function readGeometry(udid: string): Promise<{ width: number; height: number }> {
	const probe = join(MEDIA_DIR, ".probe.png");
	await mkdir(dirname(probe), { recursive: true });
	await screenshot(udid, probe);

	const result =
		await Bun.$`ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 ${probe}`.quiet();
	await rm(probe, { force: true });

	const [width, height] = result.stdout.toString().trim().split(",").map(Number);
	if (!width || !height) throw new Error("could not read the device's screen size from a screenshot");
	return { height, width };
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

async function main(): Promise<void> {
	const options = parseArgs(process.argv.slice(2));
	const all = await planDemos();
	const demos = options.only
		? all.filter((demo) => demo.id === options.only || demo.id.startsWith(`${options.only}/`))
		: all;

	if (demos.length === 0) {
		fail(options.only ? `No captured demos match "${options.only}".` : "No demos opt into capture yet.");
	}

	await preflight(options, all);

	const device = await resolveDevice(options);
	const deviceLabel = `${device.name} · ${device.runtime.split(".").pop()?.replace("iOS-", "iOS ").replace("-", ".")}`;
	console.log(`\n  ${device.name} (${device.udid})`);
	console.log(`  ${demos.length} demos × ${options.themes.length} themes\n`);

	// restart, not launch — see restartApp. A stale process has no devtools
	// bridge, and every flow's `id:` selector then fails.
	await restartApp(device.udid, BUNDLE_ID);
	await Bun.sleep(6000);

	if (demos.some((demo) => demo.flowPath) && !(await devtoolsConnected(device.udid, BUNDLE_ID))) {
		fail(
			"argent's native-devtools bridge is not connected, so a flow's `id:` selectors\n" +
				"  cannot resolve and every animated demo would record a still screen.\n" +
				`  Check: argent run native-devtools-status --udid ${device.udid} --bundleId ${BUNDLE_ID}`
		);
	}

	const geometry = await readGeometry(device.udid);

	const previous = await readExistingManifest();
	const entries: PreviewEntryJson[] = [];
	const failures: { id: string; reason: string }[] = [];
	const capturedAt = new Date().toISOString();

	for (const demo of demos) {
		const stale = previous.get(demo.id);
		const unchanged = stale?.sourceHash === demo.sourceHash;
		const filesPresent =
			unchanged &&
			(
				await Promise.all(
					options.themes.flatMap((theme) => {
						const paths = mediaPaths(demo, theme, demo.sourceHash);
						return demo.flowPath ? [exists(paths.poster), exists(paths.video)] : [exists(paths.poster)];
					})
				)
			).every(Boolean);

		if (!options.force && unchanged && filesPresent && stale) {
			console.log(`  · ${demo.id} (unchanged)`);
			entries.push(stale);
			continue;
		}

		try {
			let captured: Captured = { height: 0, width: 0 };
			for (const theme of options.themes) {
				captured = await captureDemo(device.udid, demo, theme, geometry);
			}

			const animated = demo.flowPath !== undefined;
			const media = (theme: Theme) => {
				const paths = mediaPaths(demo, theme, demo.sourceHash);
				return animated ? { poster: paths.posterUrl, video: paths.videoUrl } : { poster: paths.posterUrl };
			};

			entries.push({
				animated,
				capturedAt,
				component: demo.component,
				dark: media("dark"),
				demo: demo.demo,
				description: demo.source.meta.caption,
				device: deviceLabel,
				durationMs: captured.durationMs,
				frame: demo.frame,
				height: captured.height,
				id: demo.id,
				light: media("light"),
				sourceHash: demo.sourceHash,
				title: demo.source.meta.title,
				width: captured.width,
			});

			const seconds = captured.durationMs ? ` · ${(captured.durationMs / 1000).toFixed(1)}s` : "";
			console.log(`  ✓ ${demo.id}  ${captured.width}×${captured.height}${seconds}`);
		} catch (error) {
			// A flake must not delete working media, so the previous entry stands
			// and the run reports the failure instead of publishing a gap.
			const reason = error instanceof Error ? error.message : String(error);
			failures.push({ id: demo.id, reason });
			if (stale) entries.push(stale);
			console.log(`  ✗ ${demo.id}\n      ${reason}`);
		}
	}

	// Only a full run knows the complete set, so a filtered one leaves the rest
	// of the manifest and the media alone.
	if (!options.only) {
		for (const [id, entry] of previous) {
			if (!entries.some((existing) => existing.id === id) && !demos.some((demo) => demo.id === id)) continue;
			if (!entries.some((existing) => existing.id === id)) entries.push(entry);
		}
	} else {
		for (const [id, entry] of previous) {
			if (!entries.some((existing) => existing.id === id)) entries.push(entry);
		}
	}

	entries.sort((a, b) => a.id.localeCompare(b.id));

	const byComponent = new Map<string, string[]>();
	for (const demo of all) {
		const ids = byComponent.get(demo.component) ?? [];
		if (entries.some((entry) => entry.id === demo.id)) ids.push(demo.id);
		byComponent.set(demo.component, ids);
	}

	const heroes = new Map<string, string>();
	for (const demo of all) {
		if (demo.hero && entries.some((entry) => entry.id === demo.id)) heroes.set(demo.component, demo.id);
	}

	await mkdir(dirname(MANIFEST_PATH), { recursive: true });
	await Bun.write(MANIFEST_PATH, renderManifest(entries, byComponent, heroes));

	if (options.prune && !options.only) {
		const removed = await prune(new Set(entries.map((entry) => entry.id)));
		if (removed > 0) console.log(`\n  pruned ${removed} demo${removed === 1 ? "" : "s"} whose source is gone`);
	}

	const { bytes, largest } = await directorySize(MEDIA_DIR);
	console.log(`\n  ${entries.length} entries · ${mb(bytes)}`);

	if (failures.length > 0) {
		console.error(`\n  ${failures.length} demo${failures.length === 1 ? "" : "s"} failed:`);
		for (const failure of failures) console.error(`    ${failure.id}`);
		process.exit(1);
	}

	if (bytes > BUDGET_BYTES) {
		console.error(`\n  Media is ${mb(bytes)}, over the ${mb(BUDGET_BYTES)} budget. Largest files:`);
		for (const file of largest) console.error(`    ${mb(file.bytes).padStart(9)}  ${file.path}`);
		console.error("\n  Cut demos, lower MAX_EDGE, or raise BUDGET_BYTES deliberately in scripts/previews/config.ts.");
		process.exit(1);
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
