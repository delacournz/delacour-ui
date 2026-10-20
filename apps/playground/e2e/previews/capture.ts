/**
 * The one helper every preview spec goes through.
 *
 * A spec is one file per component holding a `capture()` per captured demo:
 * a bare `capture(id)` for a still, `capture(id, async (f) => { … })` for a
 * clip whose body is what the finger does. Everything else — the route, the
 * theme, the sentinel, the recording, ffmpeg, the fragment the orchestrator
 * reads — lives here, which is what keeps a spec short enough to read.
 *
 * It runs inside `warden e2e previews` (see `warden.config.ts`): warden owns
 * the simulator, the dev build, Metro and the launch arguments, and hands the
 * spec a `device`, a `screen` and an `app`. By hand, with a claimed simulator:
 *
 *     WARDEN_UDID=<udid> WARDEN_BUNDLE_ID=nz.co.delacour.ui.playground \
 *       bun test --preload @delacour/warden-e2e/preload e2e/previews/switch.e2e.ts
 *
 * **The plan decides what is captured.** `scripts/capture-previews.ts` writes
 * `.previews/plan.json` naming every demo whose media is stale, and a
 * `capture()` for a demo that is not in it is skipped. With no plan at all —
 * a hand run — every demo in the file is captured and hashed on the spot.
 */

import { mkdirSync, readFileSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { type App, type Device, E2eError, expect, type Locator, type Screen, test } from "@delacour/warden-e2e";
import {
	DEVICE_MAX_EDGE,
	MAX_EDGE,
	mediaPaths,
	NAVIGATION_TIMEOUT_MS,
	PAD_POINTS,
	SCHEME,
	THEMES,
	type Theme,
} from "../../scripts/previews/config";
import {
	type Fragment,
	fragmentPath,
	PLAN_PATH,
	type PlanFile,
	type PlannedCapture,
} from "../../scripts/previews/fragments";
import {
	boundsCrop,
	type CropRect,
	cropImage,
	type DemoBounds,
	deviceCrop,
	encodeVideo,
	extractPoster,
	probeDurationMs,
	targetSize,
} from "../../scripts/previews/media";
import { planDemos } from "../../scripts/previews/plan";
import {
	dragPath,
	type GestureEvent,
	parseBounds,
	type TouchPath,
	toPoint,
	toTouchPath,
	untimed,
	type Window,
} from "./geometry";
import { startRecording } from "./video";

/** How a flow names what it touches: a `testID`, visible text, a regex over text, or a screen fraction. */
export type Target = { id: string } | { text: string } | { matches: string } | { x: number; y: number };

export type KeyName = "Enter" | "Backspace" | "Tab" | "Space" | "Escape" | "Delete" | "Up" | "Down" | "Left" | "Right";

/**
 * What a flow body is handed. Every position is a fraction of the screen,
 * because that is what the flows were written in and what survives a change
 * of device; the helper scales by the window the sentinel reports.
 */
export type Flow = {
	screen: Screen;
	device: Device;
	app: App;
	/** The window in points, as the preview route measured it. */
	window: Window;
	/** Holds still. A capture paces itself by the clock on purpose: the clip is the point. */
	wait(ms: number): Promise<void>;
	tap(id: string): Promise<void>;
	tapText(text: string): Promise<void>;
	tapAt(nx: number, ny: number): Promise<void>;
	longPress(id: string, durationMs?: number): Promise<void>;
	/** From a target's centre, by a fraction of the screen. `momentum: false` eases into the release and holds. */
	swipe(
		from: Target,
		by: { x?: number; y?: number },
		options?: { durationMs?: number; momentum?: boolean }
	): Promise<void>;
	type(id: string, text: string): Promise<void>;
	press(id: string, key: KeyName, times?: number): Promise<void>;
	visible(target: Target, options?: { timeout?: number }): Promise<void>;
	hidden(target: Target, options?: { timeout?: number }): Promise<void>;
	containsText(id: string, text: string, options?: { timeout?: number }): Promise<void>;
	/** A multi-waypoint touch path, timed from the first point — the flow's own pauses, replayed exactly. */
	gesture(events: readonly GestureEvent[], options?: { interpolate?: number }): Promise<void>;
};

export type FlowBody = (f: Flow) => Promise<void>;

export type CaptureOptions = {
	/**
	 * The flow drives the software keyboard. The app is relaunched after it,
	 * because a process that has typed answers the next accessibility read
	 * late or not at all, and the next demo's sentinel then never appears.
	 */
	types?: boolean;
};

// ---- the plan ----

let plan: PlanFile | undefined | null = null;

/** Read once per process, synchronously, so `test.skipIf` can be decided at registration. */
function readPlanSync(): PlanFile | undefined {
	if (plan !== null) return plan;
	try {
		plan = JSON.parse(readFileSync(PLAN_PATH, "utf-8")) as PlanFile;
	} catch {
		plan = undefined;
	}
	return plan;
}

async function plannedCapture(id: string, animated: boolean): Promise<PlannedCapture> {
	const planned = readPlanSync()?.demos[id];
	if (planned) return planned;
	const [demo] = await planDemos(id);
	if (!demo || demo.id !== id) throw new E2eError("INVALID_ARGUMENT", `no captured demo at ${id}`);
	return {
		animated,
		caption: demo.source.meta.caption,
		component: demo.component,
		demo: demo.demo,
		frame: demo.frame,
		id,
		leadMs: demo.leadMs,
		settleMs: demo.settleMs,
		sourceHash: demo.sourceHash,
		tailMs: demo.tailMs,
		title: demo.source.meta.title,
	};
}

// ---- the device ----

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

function udid(): string {
	const value = process.env.WARDEN_UDID;
	if (!value) throw new E2eError("SESSION", "WARDEN_UDID is not set; run this under `warden e2e previews`");
	return value;
}

let geometry: { width: number; height: number } | undefined;

/** Device pixel size, read off the first screenshot rather than hardcoded per model. */
async function readGeometry(shot: string): Promise<{ width: number; height: number }> {
	if (geometry) return geometry;
	const result =
		await Bun.$`ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 ${shot}`.quiet();
	const [width, height] = result.stdout.toString().trim().split(",").map(Number);
	if (!width || !height) throw new E2eError("DRIVER", "could not read the device's screen size from a screenshot");
	geometry = { height, width };
	return geometry;
}

let deviceLabel: string | undefined;

/** `warden-iphone-17-pro-1 · iOS 26.5`, for the manifest. */
function readDeviceLabel(): string {
	if (deviceLabel) return deviceLabel;
	const name = process.env.WARDEN_DEVICE_NAME ?? udid();
	let runtime = "";
	try {
		const list = Bun.spawnSync(["xcrun", "simctl", "list", "devices", "-j"]);
		const devices = (JSON.parse(list.stdout.toString()) as { devices: Record<string, { udid: string }[]> }).devices;
		for (const [key, group] of Object.entries(devices)) {
			if (group.some((device) => device.udid === udid())) {
				runtime = key.split(".").pop()?.replace("iOS-", "iOS ").replace("-", ".") ?? "";
			}
		}
	} catch {
		// the label is cosmetic
	}
	deviceLabel = runtime ? `${name} · ${runtime}` : name;
	return deviceLabel;
}

// ---- the flow API ----

function escapeRegex(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
}

function locate(screen: Screen, target: Target): Locator {
	if ("id" in target) return screen.getByTestId(target.id);
	if ("text" in target) return screen.getByText(target.text, { exact: false });
	if ("matches" in target) return screen.getByText(new RegExp(target.matches));
	throw new E2eError("INVALID_ARGUMENT", "a point has no locator");
}

async function centreOf(screen: Screen, target: Target, window: Window): Promise<{ x: number; y: number }> {
	if ("x" in target) return toPoint(target.x, target.y, window);
	const box = await locate(screen, target).boundingBox();
	return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

function makeFlow(fixtures: { screen: Screen; device: Device; app: App }, window: Window): Flow {
	const { screen, device, app } = fixtures;
	return {
		app,
		device,
		screen,
		window,
		wait: sleep,
		tap: (id) => screen.getByTestId(id).tap(),
		tapText: (text) => screen.getByText(text, { exact: false }).tap(),
		tapAt: (nx, ny) => screen.tapAt(toPoint(nx, ny, window)),
		longPress: (id, durationMs) => screen.getByTestId(id).longPress(durationMs === undefined ? {} : { durationMs }),
		async swipe(from, by, options = {}) {
			const start = await centreOf(screen, from, window);
			const end = { x: start.x + (by.x ?? 0) * window.width, y: start.y + (by.y ?? 0) * window.height };
			const durationMs = options.durationMs ?? 300;
			if (options.momentum === false) {
				await replay(screen, dragPath(start, end, { durationMs }));
				return;
			}
			await screen.swipe({ durationMs, from: start, to: end });
		},
		type: (id, text) => screen.getByTestId(id).type(text),
		async press(id, key, times = 1) {
			const field = screen.getByTestId(id);
			for (let press = 0; press < times; press += 1) await field.press(key);
		},
		visible: (target, options) => expect(locate(screen, target)).toBeVisible(options),
		hidden: (target, options) => expect(locate(screen, target)).toBeHidden(options),
		containsText: (id, text, options) => expect(screen.getByTestId(id)).toContainText(text, options),
		gesture: (events) => replay(screen, toTouchPath(events, window)),
	};
}

// ---- one theme of one demo ----

type Captured = { width: number; height: number; durationMs?: number };

/**
 * Replays a timed route. Warden's driver takes timed points, but its
 * `screen.gesture.path` attaches a `durationMs` of its own and the driver then
 * refuses the pair — so the first replay in a process offers the timed route
 * and, on that refusal, this one and every later one go through `untimed`,
 * which keeps the span and loses the holds. The fallback retires itself the
 * day warden's screen API passes a timed path through.
 */
let timedPaths: boolean | undefined;
async function replay(screen: Screen, path: TouchPath): Promise<void> {
	if (timedPaths !== false) {
		try {
			await screen.gesture.path({ paths: [path.points] });
			timedPaths = true;
			return;
		} catch (error) {
			if (!refusesTimedPaths(error)) throw error;
			timedPaths = false;
		}
	}
	const { durationMs, points } = untimed(path);
	await screen.gesture.path({ durationMs, paths: [points] });
}

function refusesTimedPaths(error: unknown): boolean {
	return error instanceof Error && error.message.includes("`durationMs` is for untimed paths");
}

/**
 * The demo's bounds once its layout has stopped moving. The sentinel re-labels
 * itself on every layout pass and the first pass is rarely the last — a chart
 * fills its parent until it has measured it, a list is as tall as its first
 * frame — so the label `waitFor` matched is the one the demo mounted with.
 * Settle, read again, and stop when two reads agree.
 */
async function settledBounds(
	fixtures: { screen: Screen; device: Device },
	id: string,
	theme: Theme,
	first: { bounds: DemoBounds; label: string },
	quietMs: number
): Promise<DemoBounds> {
	let last = first;
	for (let attempt = 0; attempt < 4; attempt += 1) {
		await fixtures.device.settle({ quietMs, timeout: 8000 });
		const next = await awaitSentinel(fixtures.screen, id, theme);
		if (next.label === last.label) return next.bounds;
		last = next;
	}
	return last.bounds;
}

async function awaitSentinel(screen: Screen, id: string, theme: Theme): Promise<{ bounds: DemoBounds; label: string }> {
	const sentinel = `preview-ready:${id}:${theme}:`;
	const locator = screen.getByLabel(new RegExp(`^${escapeRegex(sentinel)}`));
	try {
		await locator.waitFor({ state: "attached", timeout: NAVIGATION_TIMEOUT_MS });
	} catch (error) {
		throw new E2eError(
			"TIMEOUT",
			`the preview never announced itself (${sentinel}). Either the deep link did not navigate, or the demo threw while rendering.\n${error instanceof Error ? error.message : String(error)}`
		);
	}
	const label = await locator.text();
	const bounds = parseBounds(label, sentinel);
	if (!bounds) throw new E2eError("ASSERTION", `could not read the demo's measured bounds from ${label}`);
	return { bounds, label };
}

/**
 * Navigates to a demo in one theme and captures it — a still, or a clip if it
 * has a flow.
 *
 * The order is load-bearing. Recording starts *before* the lead pad so the clip
 * opens on a settled screen rather than mid-transition; the tail pad runs
 * before the stop so the last interaction's touch pulse has faded, which is
 * what stops the loop showing a ghost tap at the seam.
 */
async function captureTheme(
	fixtures: { screen: Screen; device: Device; app: App },
	planned: PlannedCapture,
	theme: Theme,
	flow: FlowBody | undefined
): Promise<Captured> {
	const { screen, device } = fixtures;
	await ensureLoaded(fixtures);
	await device.openLink(`${SCHEME}://preview?component=${planned.component}&demo=${planned.demo}&theme=${theme}`);

	// The screen must hold still before it is worth photographing: almost every
	// component springs from a measured zero, so the first frame after a
	// navigation is reliably wrong — and so are the bounds it announced.
	const first = await awaitSentinel(screen, planned.id, theme);
	const bounds = await settledBounds(fixtures, planned.id, theme, first, planned.settleMs);

	const { dir, poster, video } = mediaPaths(planned.id, theme, planned.sourceHash);
	await mkdir(dir, { recursive: true });

	const shot = await device.screenshot(`${planned.id.replace(/\//g, "-")}-${theme}`);
	const pixels = await readGeometry(shot);
	const crop = planned.frame === "device" ? deviceCrop(pixels) : boundsCrop(pixels, bounds, PAD_POINTS);
	const size = targetSize(crop, planned.frame === "device" ? DEVICE_MAX_EDGE : MAX_EDGE);
	const window = { height: bounds.windowHeight, width: bounds.windowWidth };

	if (!flow) {
		await cropImage(shot, poster, crop, size);
		return size;
	}

	return await captureClip(fixtures, planned, flow, { crop, poster, size, video, window });
}

async function captureClip(
	fixtures: { screen: Screen; device: Device; app: App },
	planned: PlannedCapture,
	flow: FlowBody,
	target: { crop: CropRect; poster: string; size: { width: number; height: number }; video: string; window: Window }
): Promise<Captured> {
	const raw = join(dirname(target.video), `.${planned.sourceHash}.raw.mp4`);
	const recording = await startRecording(fixtures.device, udid(), raw);
	try {
		await sleep(planned.leadMs);
		await flow(makeFlow(fixtures, target.window));
		await sleep(planned.tailMs);
	} finally {
		// Always stop: a recorder left running holds the simulator's single slot
		// and every later clip fails on "a recording is already running".
		await recording.stop();
	}

	await encodeVideo(raw, target.video, target.crop, target.size);
	await extractPoster(target.video, target.poster);
	await rm(raw, { force: true });
	return { ...target.size, durationMs: await probeDurationMs(target.video) };
}

/**
 * Relaunches the app and waits for its home screen — only after a flow that
 * typed. The relaunch goes back through Metro, so the first deep link after it
 * waits on a cold JS load; `NAVIGATION_TIMEOUT_MS` covers that.
 */
/** The app has loaded its bundle and is drawing the home screen's navbar. */
async function awaitLoaded(fixtures: { screen: Screen; device: Device }): Promise<void> {
	await fixtures.screen.getByTestId("theme-toggle").waitFor({ state: "visible", timeout: 90_000 });
	await fixtures.device.settle({ quietMs: 500, timeout: 5000 });
}

async function relaunch(fixtures: { screen: Screen; device: Device; app: App }): Promise<void> {
	await fixtures.app.restart();
	await awaitLoaded(fixtures);
}

/**
 * Once per process: the suite opens the dev client on Metro before the first
 * spec, but the bundle takes 10–20 s to download and boot, and a deep link that
 * reaches expo-dev-launcher while that is still under way cancels the load and
 * leaves the launcher's own home screen up — every sentinel then times out. So
 * the first capture waits for the app to be on screen before it opens a link.
 */
let loaded = false;
async function ensureLoaded(fixtures: { screen: Screen; device: Device }): Promise<void> {
	if (loaded) return;
	await awaitLoaded(fixtures);
	loaded = true;
}

// ---- the spec API ----

/**
 * Registers one test that captures `id` in both themes and writes its fragment.
 *
 *     capture("switch/colours");                              // a still
 *     capture("switch/tap-or-drag", async (f) => { … });      // a clip
 *     capture("input/variants/at-rest", { types: true }, async (f) => { … });
 *
 * The body runs while the screen is recording, between the lead and tail pads
 * the demo's `meta.capture` sets. End where you began: the media loops.
 */
export function capture(id: string, flow?: FlowBody): void;
export function capture(id: string, options: CaptureOptions, flow: FlowBody): void;
export function capture(id: string, second?: CaptureOptions | FlowBody, third?: FlowBody): void {
	const options = typeof second === "function" ? {} : (second ?? {});
	const flow = typeof second === "function" ? second : third;

	// warden's runner relaunches the app before every test unless told not to,
	// and a relaunch on a dev client is a 20-40 s bundle load per demo. The app
	// is opened once per device by the suite's Metro step and reused from there.
	test.use({ launch: "none" });

	const planned = readPlanSync();
	const skipped = planned !== undefined && planned.demos[id] === undefined;

	test.skipIf(skipped)(id, async ({ app, device, screen }) => {
		const demo = await plannedCapture(id, flow !== undefined);
		const fixtures = { app, device, screen };
		let captured: Captured = { height: 0, width: 0 };

		for (const theme of THEMES) {
			captured = await captureTheme(fixtures, demo, theme, flow);
			if (options.types) await relaunch(fixtures);
		}

		const media = (theme: Theme) => {
			const paths = mediaPaths(id, theme, demo.sourceHash);
			return flow ? { poster: paths.posterUrl, video: paths.videoUrl } : { poster: paths.posterUrl };
		};
		const fragment: Fragment = {
			animated: flow !== undefined,
			capturedAt: new Date().toISOString(),
			component: demo.component,
			dark: media("dark"),
			demo: demo.demo,
			description: demo.caption,
			device: readDeviceLabel(),
			durationMs: captured.durationMs,
			frame: demo.frame,
			height: captured.height,
			id,
			light: media("light"),
			sourceHash: demo.sourceHash,
			title: demo.title,
			width: captured.width,
		};
		const path = fragmentPath(id);
		mkdirSync(dirname(path), { recursive: true });
		await Bun.write(path, `${JSON.stringify(fragment, null, "\t")}\n`);
		const seconds = captured.durationMs ? ` · ${(captured.durationMs / 1000).toFixed(1)}s` : "";
		console.log(`  ✓ ${id}  ${captured.width}×${captured.height}${seconds}`);
	});
}
