// countdown previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("countdown/segmented", async (f) => {
	// Nothing to touch — a countdown is its motion, so this only holds the camera while the seconds slide
	await f.wait(3000);
});

capture("countdown/inline", async (f) => {
	// Nothing to touch — a countdown is its motion, so this only holds the camera while the seconds tick
	await f.wait(3000);
});

capture("countdown/sizes");

capture("countdown/units");

capture("countdown/urgent", async (f) => {
	// Nothing to touch — the urgent digits tick down on their own, so this only holds the camera on them
	await f.wait(3000);
});

capture("countdown/labels");
