// progress previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("progress/anatomy");

capture("progress/colours");

capture("progress/sizes");

capture("progress/indeterminate", async (f) => {
	// Nothing to touch — the sweep is the behaviour, so this only holds the camera on it
	await f.wait(2400);
});

capture("progress/formatting");

capture("progress/upload", async (f) => {
	// Resuming the paused upload and starting the waiting one
	await f.tap("upload-hero-action");
	await f.wait(200);
	await f.tap("upload-assets-action");
	// Letting Hero shot.jpg land, about two seconds at the demo's tick
	await f.wait(2600);
	// Resetting the queue, so the clip loops where it began
	await f.tap("upload-reset");
});
