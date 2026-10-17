// screen previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("screen/inbox", async (f) => {
	// Scrolling the list under the navbar
	await f.swipe({ x: 0.5, y: 0.7 }, { y: -0.35 }, { durationMs: 700, momentum: false });
	await f.wait(600);
	// And back to the top, so the clip loops without a jump cut
	await f.swipe({ x: 0.5, y: 0.35 }, { y: 0.35 }, { durationMs: 700, momentum: false });
});

capture("screen/a-pushed-screen", async (f) => {
	// Going back to the contacts list
	await f.tap("back");
	await f.wait(900);
	// And tapping the row again, so the clip loops on the pushed screen
	await f.tap("row-ada");
});

capture("screen/loading-and-error");

capture("screen/showcase");
