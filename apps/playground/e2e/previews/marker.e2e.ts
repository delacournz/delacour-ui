// marker previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("marker/conversation", async (f) => {
	// Opening the search step to show what it covered
	await f.wait(400);
	await f.tap("conversation-search");
	await f.wait(1500);
	// And collapsing it, so the clip loops without a jump cut
	await f.tap("conversation-search");
	await f.wait(600);
});

capture("marker/variants");

capture("marker/pressable", async (f) => {
	// Expanding the step the marker summarises
	await f.wait(400);
	await f.tap("explored-files");
	await f.wait(1500);
	// And collapsing it, so the clip loops without a jump cut
	await f.tap("explored-files");
	await f.wait(600);
});

capture("marker/running", async (f) => {
	// Running the step, so the text shimmers for two whole cycles
	await f.tap("toggle-running");
	await f.wait(3200);
	// Finishing it, so the clip ends on the still marker it began with
	await f.tap("toggle-running");
	await f.wait(700);
});

capture("marker/disabled");
