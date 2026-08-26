/**
 * Thin wrappers over the argent CLI.
 *
 * `argent run <tool>` exposes every MCP tool to a script, which is what lets a
 * capture loop drive the simulator with no agent in the loop. Everything here
 * shells out and parses `--json`; nothing holds a connection.
 */

import { $ } from "bun";
import { REPO } from "./config";

/**
 * Every argent call runs from the repo root, and that is not cosmetic.
 *
 * argent resolves its "project" scope to the nearest ancestor holding a
 * `.git`, `.argent` or `package.json`. From `apps/playground` that is the
 * playground itself, so the repo-root `.argent/flags.json` is invisible and
 * argent reports the global defaults instead — which means the watermark
 * preflight passes while the watermark is still on. It also makes
 * `.argent/flows/...` paths resolve.
 */
const AT_REPO = { cwd: REPO } as const;

export type Device = {
	udid: string;
	name: string;
	runtime: string;
	state: string;
	platform: string;
};

type DeviceList = { devices: Device[] };

async function runJson<T>(tool: string, args: readonly string[]): Promise<T> {
	const result = await $`argent run ${tool} ${args} --json`.cwd(AT_REPO.cwd).quiet();
	if (result.exitCode !== 0) {
		throw new Error(`argent run ${tool} failed:\n${result.stderr.toString() || result.stdout.toString()}`);
	}
	return JSON.parse(result.stdout.toString()) as T;
}

export async function listDevices(): Promise<Device[]> {
	const { devices } = await runJson<DeviceList>("list-devices", []);
	return devices;
}

export async function bootDevice(udid: string): Promise<void> {
	await runJson("boot-device", ["--udid", udid]);
}

/**
 * Terminates and relaunches, rather than `launch-app`.
 *
 * argent injects its native-devtools bridge at process start, and that bridge
 * is what resolves a flow's `id:` selectors against the full view hierarchy. A
 * `launch-app` against an already-running process just foregrounds it, so the
 * process stays stale, every `tap: { id: … }` fails with "no
 * native-devtools-connected apps", and the whole flow is skipped.
 */
export async function restartApp(udid: string, bundleId: string): Promise<void> {
	await runJson("restart-app", ["--udid", udid, "--bundleId", bundleId]);
}

/** Whether argent's bridge is live for this app — the precondition for `id:` selectors. */
export async function devtoolsConnected(udid: string, bundleId: string): Promise<boolean> {
	const result = await runJson<{ connected: boolean }>("native-devtools-status", [
		"--udid",
		udid,
		"--bundleId",
		bundleId,
	]);
	return result.connected;
}

export async function startRecording(udid: string, timeLimitSeconds: number): Promise<void> {
	// trimStatic off: its "keep a second of each still stretch" heuristic makes
	// the clip length unpredictable, which breaks both the duration reported to
	// the page and any hope of a loop that does not jump. The lead and tail pads
	// are explicit instead. showTouches on, so the video shows where each tap
	// landed rather than a control moving under an invisible finger.
	await runJson("screen-recording-start", [
		"--udid",
		udid,
		"--timeLimitSeconds",
		String(timeLimitSeconds),
		"--no-trimStatic",
		"--showTouches",
	]);
}

export type Recording = { video: string; durationMs: number; warning?: string };

export async function stopRecording(udid: string): Promise<Recording> {
	return await runJson<Recording>("screen-recording-stop", ["--udid", udid]);
}

/** Replays a flow fragment against whatever is currently on screen. */
export async function runFlow(flowPath: string, udid: string): Promise<{ ok: boolean; detail: string }> {
	const result = await $`argent flow run ${flowPath} --device ${udid} --json`.cwd(AT_REPO.cwd).quiet().nothrow();
	const text = result.stdout.toString();

	try {
		const report = JSON.parse(text) as {
			ok: boolean;
			steps?: { status: string; reason?: string }[];
		};
		const bad = report.steps?.find((step) => step.status === "error" || step.status === "fail");
		return { detail: bad?.reason ?? "", ok: report.ok };
	} catch {
		return { detail: text.slice(0, 400), ok: false };
	}
}

export async function openUrl(udid: string, url: string): Promise<void> {
	await runJson("open-url", ["--udid", udid, "--url", url]);
}

/**
 * Blocks until an element exists, and reports whether it appeared.
 *
 * Returns rather than throws: the caller turns a miss into a per-demo failure
 * naming the demo, which is far more useful than a stack trace naming a
 * selector.
 */
export async function awaitElement(udid: string, text: string, timeoutMs = 10_000): Promise<boolean> {
	const result = await runJson<{ success: boolean }>("await-ui-element", [
		"--udid",
		udid,
		"--condition",
		"exists",
		"--selector-json",
		JSON.stringify({ text }),
		"--timeoutMs",
		String(timeoutMs),
	]);
	return result.success;
}

/**
 * Waits for the screen to stop changing.
 *
 * This is what covers the measure-then-animate problem. Almost every component
 * in this library springs from a measured zero — a `Switch` mounted
 * `defaultSelected` draws its thumb on the left until `onLayout` reports the
 * track's width, and `Tabs.Indicator` renders at zero opacity until it has
 * measured its tabs — so the first frame after a navigation is reliably wrong.
 * A stable-for window is the signal; a fixed sleep is a guess.
 */
export async function awaitIdle(udid: string, minStableMs = 500, timeoutMs = 8000): Promise<boolean> {
	const result = await runJson<{ settled: boolean }>("await-screen-idle", [
		"--udid",
		udid,
		"--timeoutMs",
		String(timeoutMs),
		"--minStableMs",
		String(minStableMs),
		"--pollIntervalMs",
		"150",
	]);
	return result.settled;
}

/**
 * The full accessibility tree, as text.
 *
 * Used to read the preview sentinel's label back — `await-ui-element` proves an
 * element matching a substring exists, but only `describe` hands over the whole
 * label, which is where the demo's measured bounds ride.
 */
export async function describe(udid: string): Promise<string> {
	const result = await runJson<{ description: string }>("describe", ["--udid", udid]);
	return result.description;
}

export async function screenshot(udid: string, out: string): Promise<void> {
	const result =
		await $`argent run screenshot --udid ${udid} --scale 1 --includeImageInContext false --out ${out}`
			.cwd(AT_REPO.cwd)
			.quiet();
	if (result.exitCode !== 0) {
		throw new Error(`screenshot failed:\n${result.stderr.toString() || result.stdout.toString()}`);
	}
}

export type FlagState = Record<string, boolean>;

/**
 * Reads the effective feature flags.
 *
 * Two of them are load-bearing for capture and both default the wrong way, so
 * the script asserts rather than assumes — see the preflight in
 * `capture-previews.ts`.
 */
export async function readFlags(): Promise<FlagState> {
	const result = await $`argent flags`.cwd(AT_REPO.cwd).quiet();
	const text = result.stdout.toString();
	const flags: FlagState = {};
	for (const line of text.split("\n")) {
		const match = line.match(/^\s{2}([a-z-]+)\s+(enabled|disabled)/);
		if (match?.[1]) flags[match[1]] = match[2] === "enabled";
	}
	return flags;
}
