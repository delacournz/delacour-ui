// pagination previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("pagination/numbers", async (f) => {
	// One page on and back with the arrows
	await f.tapText("Next page");
	await f.wait(500);
	await f.tapText("Previous page");
	await f.wait(600);
	// Five pages forward through the trailing gap, then back through the leading one
	await f.tapText("Jump forward 5 pages");
	await f.wait(700);
	await f.tapText("Jump back 5 pages");
});

capture("pagination/compact", async (f) => {
	// Two pages on
	await f.tapText("Next page");
	await f.wait(450);
	await f.tapText("Next page");
	await f.wait(700);
	// And two back, so the clip loops on 3 / 12
	await f.tapText("Previous page");
	await f.wait(450);
	await f.tapText("Previous page");
});

capture("pagination/simple", async (f) => {
	// Back to the first page — Previous fades out, disabled at its end
	await f.tapText("Previous page");
	await f.wait(1100);
	// And on again, so the clip loops on page 2 with both arrows live
	await f.tapText("Next page");
});

capture("pagination/sizes");

capture("pagination/with-summary", async (f) => {
	// Two pages on — the status follows the readout
	await f.tapText("Next page");
	await f.wait(450);
	await f.tapText("Next page");
	await f.wait(700);
	// And two back, so the clip loops on page 3
	await f.tapText("Previous page");
	await f.wait(450);
	await f.tapText("Previous page");
});

capture("pagination/controlled-list", async (f) => {
	// Two pages on — the rows re-slice under each press
	await f.tapText("Next page");
	await f.wait(500);
	await f.tapText("Next page");
	await f.wait(700);
	// And two back, so the clip loops on the first five orders
	await f.tapText("Previous page");
	await f.wait(500);
	await f.tapText("Previous page");
});
