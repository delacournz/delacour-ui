// support previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("support/help-screen");

capture("support/availability", async (f) => {
	// Cycle to away — the dot turns amber and both lines change together
	await f.tap("support-cycle");
	await f.wait(900);
	// Cycle to offline
	await f.tap("support-cycle");
	await f.wait(900);
	// Cycle back to online, so the clip loops
	await f.tap("support-cycle");
	await f.wait(900);
});

capture("support/topics", async (f) => {
	// Pick Billing, which enables Continue
	await f.tap("support-topic-billing");
	await f.wait(900);
	// Pick An order — the selection moves, never doubles
	await f.tap("support-topic-order");
	await f.wait(900);
	// Continue sends the request and clears the form, so the clip loops without a jump cut
	await f.tap("support-continue");
	await f.wait(700);
});

capture("support/conversations");

capture("support/thread", async (f) => {
	// Let the typing dots run
	await f.wait(1800);
	// Stop typing — the status line returns to role and availability
	await f.tap("support-typing-toggle");
	await f.wait(1200);
	// Start typing again, so the clip loops
	await f.tap("support-typing-toggle");
	await f.wait(900);
});
