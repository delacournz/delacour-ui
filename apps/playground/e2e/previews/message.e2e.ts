// message previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("message/directions");

capture("message/runs");

capture("message/status", async (f) => {
	// Walking the top receipt through sent, delivered and read
	await f.tap("message-status-next");
	await f.wait(600);
	await f.tap("message-status-next");
	await f.wait(600);
	await f.tap("message-status-next");
	await f.wait(900);
	// Retrying the failed one, then failing it again
	await f.tapText("Retry");
	await f.wait(900);
	await f.tap("message-status-fail");
	await f.wait(600);
	// And back to sending, so the clip loops without a jump cut
	await f.tap("message-status-next");
});

capture("message/reactions");

capture("message/typing", async (f) => {
	// Nothing to press — the wait makes the capture a recording of the dots
	await f.wait(2400);
});
