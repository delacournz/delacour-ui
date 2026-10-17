// avatar previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("avatar/fallbacks");

capture("avatar/sizes");

capture("avatar/variants-and-colours");

capture("avatar/presence", async (f) => {
	// Cycling through all four statuses, which lands back on online
	await f.tap("avatar-presence");
	await f.wait(600);
	await f.tap("avatar-presence");
	await f.wait(600);
	await f.tap("avatar-presence");
	await f.wait(600);
	await f.tap("avatar-presence");
});

capture("avatar/unread-count", async (f) => {
	// Marking read clears the badge, then three new messages bring it back
	await f.tap("unread-clear");
	await f.wait(800);
	await f.tap("unread-add");
	await f.wait(350);
	await f.tap("unread-add");
	await f.wait(350);
	await f.tap("unread-add");
});

capture("avatar/group", async (f) => {
	// Raising max so the +N counts down, then back
	await f.tap("group-more");
	await f.wait(450);
	await f.tap("group-more");
	await f.wait(800);
	await f.tap("group-fewer");
	await f.wait(450);
	await f.tap("group-fewer");
});
