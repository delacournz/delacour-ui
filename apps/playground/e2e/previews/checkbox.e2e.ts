// checkbox previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("checkbox/colours", async (f) => {
	// Unticking every colour, top to bottom
	await f.tap("checkbox-default");
	await f.wait(150);
	await f.tap("checkbox-primary");
	await f.wait(150);
	await f.tap("checkbox-success");
	await f.wait(150);
	await f.tap("checkbox-warning");
	await f.wait(150);
	await f.tap("checkbox-destructive");
	await f.wait(150);
	await f.tap("checkbox-info");
	await f.wait(600);
	// And ticking them again, so the clip loops without a jump cut
	await f.tap("checkbox-default");
	await f.wait(150);
	await f.tap("checkbox-primary");
	await f.wait(150);
	await f.tap("checkbox-success");
	await f.wait(150);
	await f.tap("checkbox-warning");
	await f.wait(150);
	await f.tap("checkbox-destructive");
	await f.wait(150);
	await f.tap("checkbox-info");
});

capture("checkbox/sizes");

capture("checkbox/indeterminate", async (f) => {
	// Ticking permissions one at a time — the parent goes indeterminate, then ticked
	await f.tap("checkbox-Read");
	await f.wait(500);
	await f.tap("checkbox-Write");
	await f.wait(500);
	await f.tap("checkbox-Delete");
	await f.wait(900);
	// Then Select all clears every one, so the clip loops without a jump cut
	await f.tap("checkbox-all");
});

capture("checkbox/checkbox-group", async (f) => {
	// Ticking SMS and Push, and watching the value follow
	await f.tap("checkbox-sms");
	await f.wait(500);
	await f.tap("checkbox-push");
	await f.wait(900);
	// And unticking them again, so the clip loops without a jump cut
	await f.tap("checkbox-sms");
	await f.wait(500);
	await f.tap("checkbox-push");
});
