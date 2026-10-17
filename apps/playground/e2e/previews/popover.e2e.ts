// popover previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("popover/basic", async (f) => {
	// Opening the popover
	await f.tap("open-popover");
	await f.visible({ text: "Version 2.4" });
	await f.wait(1200);
	// Closing it from its own button
	await f.tap("close-popover");
	await f.hidden({ text: "Version 2.4" });
});

capture("popover/placements", async (f) => {
	// Opening each placement in turn
	await f.tap("open-top");
	await f.visible({ text: "Top" });
	await f.wait(600);
	await f.tap("open-right");
	await f.wait(250);
	await f.tap("open-right");
	await f.wait(600);
	await f.tap("open-bottom");
	await f.wait(250);
	await f.tap("open-bottom");
	await f.wait(600);
	await f.tap("open-left");
	await f.wait(250);
	await f.tap("open-left");
	await f.wait(600);
	// Closing the last one, so the clip loops without a jump cut
	await f.tap("open-left");
	await f.wait(600);
});

capture("popover/arrow", async (f) => {
	// Opening the popover from the badge
	await f.tap("open-popover");
	await f.visible({ text: "This feature is still changing. Tell us what breaks." });
	await f.wait(1200);
	// Closing it from the badge, so the clip loops without a jump cut
	await f.tap("open-popover");
	await f.hidden({ text: "This feature is still changing. Tell us what breaks." });
});

capture("popover/trigger-width-form", async (f) => {
	// Opening the rename panel; its field takes focus and the keyboard rises
	await f.tap("open-popover");
	await f.visible({ id: "rename-input" });
	await f.wait(1200);
	// Saving
	await f.tap("rename-save");
	await f.hidden({ id: "rename-input" });
});

capture("popover/scrollable", async (f) => {
	// Opening the capped list
	await f.tap("open-popover");
	await f.visible({ id: "timezone-list" });
	await f.wait(600);
	// Scrolling down past the cap and back up
	await f.swipe({ id: "timezone-list" }, { y: -0.12 }, { momentum: false });
	await f.wait(600);
	await f.swipe({ id: "timezone-list" }, { y: 0.2 }, { momentum: false });
	await f.wait(600);
	// Closing it from the trigger, so the clip loops without a jump cut
	await f.tap("open-popover");
	await f.hidden({ id: "timezone-list" });
});

capture("popover/scrim", async (f) => {
	// Opening the panel; the scrim dims everything behind it
	await f.tap("open-popover");
	await f.visible({ id: "copy-link" });
	await f.wait(1200);
	// Copy link closes it, so the clip loops without a jump cut
	await f.tap("copy-link");
	await f.hidden({ id: "copy-link" });
});
