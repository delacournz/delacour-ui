// radio previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("radio/variants-and-states", async (f) => {
	// Moving each group to its second option
	await f.tap("radio-primary-off");
	await f.wait(400);
	await f.tap("radio-secondary-off");
	await f.wait(700);
	// And back, so the clip loops without a jump cut
	await f.tap("radio-primary-on");
	await f.wait(400);
	await f.tap("radio-secondary-on");
});

capture("radio/sizes");

capture("radio/per-option-description", async (f) => {
	// Choosing Express
	await f.tap("radio-express");
	await f.wait(900);
	// And back to Standard, so the clip loops without a jump cut
	await f.tap("radio-standard");
});

capture("radio/custom-indicator", async (f) => {
	// Choosing the second option
	await f.tap("radio-trailing");
	await f.wait(900);
	// And back to the first, so the clip loops without a jump cut
	await f.tap("radio-custom");
});
