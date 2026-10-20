// tabs previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("tabs/composition/composed-icons-and-a-render-prop");

capture("tabs/composition/separators");

capture("tabs/scrolling/twelve-tabs", async (f) => {
	// Walking along the strip — each tab scrolls itself into view
	await f.tap("section-Activity");
	await f.wait(500);
	await f.tap("section-Members");
	await f.wait(500);
	await f.tap("section-Billing");
	await f.wait(700);
	// And back to Overview, so the clip loops without a jump cut
	await f.tap("section-Members");
	await f.wait(500);
	await f.tap("section-Activity");
	await f.wait(500);
	await f.tap("section-Overview");
});

capture("tabs/sizes/every-size");

capture("tabs/swipe/swipeable-the-default", async (f) => {
	// Swiping the pager left twice — the indicator follows the finger
	await f.swipe({ id: "panel-one" }, { x: -0.4 }, { durationMs: 400 });
	await f.wait(500);
	await f.swipe({ id: "panel-two" }, { x: -0.4 }, { durationMs: 400 });
	await f.wait(700);
	// Then tapping back to the first, so the clip loops without a jump cut
	await f.tap("swipeable-one");
});

capture("tabs/variants/every-variant", async (f) => {
	// Walking the primary bar across to Settings
	await f.tap("primary-activity");
	await f.wait(600);
	await f.tap("primary-settings");
	await f.wait(600);
	// Then the secondary bar
	await f.tap("secondary-activity");
	await f.wait(600);
	await f.tap("secondary-settings");
	await f.wait(700);
	// And both back to Overview, so the clip loops without a jump cut
	await f.tap("primary-overview");
	await f.wait(300);
	await f.tap("secondary-overview");
});
