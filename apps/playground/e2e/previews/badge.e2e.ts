// badge previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("badge/variants-and-colours");

capture("badge/sizes");

capture("badge/composed-icon");

capture("badge/status-dot");

capture("badge/dismissible", async (f) => {
	// Dismissing Reanimated, then Gesture Handler (index 2 once the row has reflowed)
	await f.tap("tag-1-close");
	await f.wait(600);
	await f.tap("tag-2-close");
	await f.wait(700);
	// Reset brings all six back, so the clip loops without a jump cut
	await f.tap("reset-tags");
	await f.hidden({ id: "reset-tags" });
});
