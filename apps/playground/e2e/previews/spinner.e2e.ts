// spinner previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("spinner/sizes", async (f) => {
	// Nothing to touch — a spinner is its motion, so this only holds the camera on it
	await f.wait(2000);
});

capture("spinner/colours", async (f) => {
	// Nothing to touch — a spinner is its motion, so this only holds the camera on it
	await f.wait(2000);
});
