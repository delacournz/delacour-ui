// tag-input previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("tag-input/basic", { types: true }, async (f) => {
	// Typing a topic and committing it with a comma
	await f.tap("tag-input-basic-input");
	await f.wait(300);
	await f.type("tag-input-basic-input", "expo,");
	await f.wait(900);
	// Backspace arms the new chip, a second removes it
	await f.press("tag-input-basic-input", "Backspace");
	await f.wait(800);
	await f.press("tag-input-basic-input", "Backspace");
	await f.wait(600);
	// Return on the empty field blurs it, so the clip loops unfocused as it began
	await f.press("tag-input-basic-input", "Enter");
	await f.wait(300);
});

capture("tag-input/email-validation", { types: true }, async (f) => {
	// A word that is not an address is refused and stays in the field, with the error below
	await f.tap("tag-input-email-input");
	await f.wait(300);
	await f.type("tag-input-email-input", "aria ");
	await f.wait(900);
	// Finishing the address commits it as a chip
	await f.type("tag-input-email-input", "@mail.com ");
	await f.wait(900);
	// Backspace twice removes it again, and Return on the empty field blurs, so the clip loops
	await f.press("tag-input-email-input", "Backspace");
	await f.wait(600);
	await f.press("tag-input-email-input", "Backspace");
	await f.wait(500);
	await f.press("tag-input-email-input", "Enter");
	await f.wait(300);
});

capture("tag-input/max-and-counter", { types: true }, async (f) => {
	// Two more tags fill the list, and the input steps aside at 5/5
	await f.tap("tag-input-max-input");
	await f.wait(300);
	await f.type("tag-input-max-input", "Go,");
	await f.wait(400);
	await f.type("tag-input-max-input", "Rust,");
	await f.wait(1000);
	// Removing both, so the clip loops back to 3/5
	await f.tap("tag-input-max-tag-4-remove");
	await f.wait(500);
	await f.tap("tag-input-max-tag-3-remove");
	await f.wait(500);
});

capture("tag-input/overflow-invalid", { types: true }, async (f) => {
	// Removing the fourth brings the list to 3/3, and the field is valid again
	await f.tap("tag-input-overflow-tag-3-remove");
	await f.wait(900);
	// Adding it back goes over, and the field turns invalid
	await f.tap("tag-input-overflow-input");
	await f.wait(300);
	await f.type("tag-input-overflow-input", "Dunedin,");
	await f.wait(700);
	// Return on the empty field blurs it, so the clip loops unfocused as it began
	await f.press("tag-input-overflow-input", "Enter");
	await f.wait(300);
});

capture("tag-input/in-field-with-clear");

capture("tag-input/sizes-and-variants");
