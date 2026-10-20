// fab previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("fab/over-a-list", async (f) => {
	// Scrolling the list under the fab, which stays pinned
	await f.swipe({ id: "fab-list" }, { y: -0.3 }, { momentum: false });
	await f.wait(600);
	// And back to the top, so the clip loops without a jump cut
	await f.swipe({ id: "fab-list" }, { y: 0.3 }, { momentum: false });
	await f.wait(600);
});

capture("fab/extended");

capture("fab/speed-dial", async (f) => {
	// Opening the dial, the plus turning into a cross
	await f.tap("fab-dial");
	await f.wait(1100);
	// Pressing an action runs it and folds the dial away
	await f.tap("fab-dial-photo");
	await f.wait(900);
	// Open again and close from the cross, so the clip ends closed where it began
	await f.tap("fab-dial");
	await f.wait(1000);
	await f.tap("fab-dial");
	await f.wait(900);
});

capture("fab/sizes-and-variants");

capture("fab/placements");
