// collapsible previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("collapsible/a-section-of-detail", async (f) => {
	// Closing the section
	await f.tap("included");
	await f.wait(1000);
	// And opening it again, so the clip loops without a jump cut
	await f.tap("included");
});

capture("collapsible/variants");

capture("collapsible/sizes");

capture("collapsible/controlled", async (f) => {
	// Closing it from the button outside the collapsible
	await f.tap("controlled-button");
	await f.wait(1000);
	// And opening it from its own trigger, so the clip loops without a jump cut
	await f.tap("controlled-trigger");
});

capture("collapsible/disabled");

capture("collapsible/order-summary", async (f) => {
	// Closing the summary, and the button follows it up
	await f.tap("order-summary");
	await f.wait(1200);
	// And opening it again, so the clip loops without a jump cut
	await f.tap("order-summary");
});
