/**
 * Screen recording for a capture, on whichever of two routes is available.
 *
 * `@delacour/warden-e2e` is growing a `device.video` API that resolves `start`
 * only once the simulator reports "Recording started". Until the version this
 * repo pins carries it, the fallback below does the same thing by hand on the
 * leased simulator: `simctl io recordVideo`, waiting for that line on stderr
 * before the first touch, and SIGINT on stop so the file is finalised.
 *
 * The wait is the whole point. Returning as soon as the process spawns puts
 * the first half-second of every flow — the tap that opens the sheet — before
 * the first frame, and the clip then opens on a sheet already moving.
 */

import type { Device } from "@delacour/warden-e2e";

export type Recording = { stop(): Promise<void> };

/** The API warden is adding; checked at runtime so the port works on either side of it. */
type DeviceVideo = { video: { start(path: string): Promise<void>; stop(): Promise<void> } };

function hasVideo(device: Device): device is Device & DeviceVideo {
	const candidate = (device as Partial<DeviceVideo>).video;
	return typeof candidate?.start === "function" && typeof candidate?.stop === "function";
}

const START_TIMEOUT_MS = 10_000;
const STOP_TIMEOUT_MS = 15_000;

async function startWithSimctl(udid: string, path: string): Promise<Recording> {
	const proc = Bun.spawn(["xcrun", "simctl", "io", udid, "recordVideo", "--codec", "h264", "--force", path], {
		stderr: "pipe",
		stdin: "ignore",
		stdout: "ignore",
	});

	await new Promise<void>((resolve) => {
		const timer = setTimeout(resolve, START_TIMEOUT_MS);
		const done = (): void => {
			clearTimeout(timer);
			resolve();
		};
		// Keep draining stderr after the marker, so simctl never blocks on a full pipe while finalising.
		void (async () => {
			const decoder = new TextDecoder();
			let seen = "";
			const reader = proc.stderr.getReader();
			for (;;) {
				const { done: closed, value } = await reader.read();
				if (closed) break;
				if (seen.length < 4096) seen += decoder.decode(value, { stream: true });
				if (/recording started/i.test(seen)) done();
			}
			done();
		})();
		void proc.exited.then(done);
	});

	return {
		async stop() {
			if (proc.exitCode !== null) return;
			proc.kill("SIGINT");
			const timer = setTimeout(() => proc.kill("SIGKILL"), STOP_TIMEOUT_MS);
			try {
				await proc.exited;
			} finally {
				clearTimeout(timer);
			}
		},
	};
}

/** Starts recording `device` to `path`, resolving once frames are being written. */
export async function startRecording(device: Device, udid: string, path: string): Promise<Recording> {
	if (hasVideo(device)) {
		await device.video.start(path);
		return { stop: () => device.video.stop() };
	}
	return await startWithSimctl(udid, path);
}
