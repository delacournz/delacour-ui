// steps previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("steps/horizontal", async (f) => {
	// Moving forward with Next
	await f.tap("steps-horizontal-next");
	await f.wait(700);
	// Jumping back to the first step by tapping it
	await f.tap("steps-horizontal-0");
	await f.wait(700);
	// And forward to the second, so the clip loops without a jump cut
	await f.tap("steps-horizontal-1");
});

capture("steps/vertical", async (f) => {
	// Advancing to the last step
	await f.tap("steps-vertical-3");
	await f.wait(700);
	// Back to the second
	await f.tap("steps-vertical-1");
	await f.wait(700);
	// And to the third, so the clip loops without a jump cut
	await f.tap("steps-vertical-2");
});

capture("steps/variants", async (f) => {
	// Moving both to Review
	await f.tap("steps-primary-2");
	await f.wait(250);
	await f.tap("steps-secondary-2");
	await f.wait(800);
	// And back to Details, so the clip loops without a jump cut
	await f.tap("steps-primary-1");
	await f.wait(250);
	await f.tap("steps-secondary-1");
});

capture("steps/sizes");

capture("steps/states", async (f) => {
	// Loading outranks invalid, so the cross becomes a spinner
	await f.tap("steps-toggle-loading");
	await f.wait(900);
	await f.tap("steps-toggle-loading");
	await f.wait(400);
	// Enabling Confirm, then disabling it again, so the clip loops without a jump cut
	await f.tap("steps-toggle-disabled");
	await f.wait(800);
	await f.tap("steps-toggle-disabled");
});

capture("steps/custom-indicator");
