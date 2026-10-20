// field previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("field/anatomy/all-four");

capture("field/grouping/separator");

capture("field/grouping/set-and-legend");

capture("field/orientation/horizontal-with-a-description", async (f) => {
	// Flipping both boxes
	await f.tap("sync");
	await f.wait(400);
	await f.tap("delete-after-30-days");
	await f.wait(900);
	// And back, so the clip loops without a jump cut
	await f.tap("sync");
	await f.wait(400);
	await f.tap("delete-after-30-days");
});

capture("field/states/live", { types: true }, async (f) => {
	// Typing a name with no @, so the field goes destructive
	await f.tap("email");
	await f.wait(300);
	await f.type("email", "ada");
	await f.wait(900);
	// Finishing the address, so it resolves
	await f.type("email", "@mail.com");
	await f.wait(900);
	// Deleting it all, so the clip loops back to an empty field
	await f.press("email", "Backspace", 12);
	// Submitting blurs the field, so it loops unfocused as it began
	await f.press("email", "Enter");
});

capture("field/states/one-flag-three-things");
