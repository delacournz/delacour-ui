// direction previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("direction/mirrored-rows");

capture("direction/nested-override");

capture("direction/toggle", async (f) => {
	// Flipping the card to right to left
	await f.tap("dir-toggle");
	await f.wait(1200);
	// And back, so the clip loops without a jump cut
	await f.tap("dir-toggle");
	await f.wait(900);
});

capture("direction/uniwind-variants");
