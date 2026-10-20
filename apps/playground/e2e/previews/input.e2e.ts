// input previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("input/group/controls", { types: true }, async (f) => {
	// Typing a search, which brings the clear button in
	await f.tap("search");
	await f.wait(300);
	await f.type("search", "tabs");
	await f.wait(700);
	// Clearing it, and submitting so the field blurs as it began
	await f.tap("clear");
	await f.wait(300);
	await f.press("clear", "Enter");
	await f.wait(500);
	// Revealing the password and hiding it again
	await f.tap("reveal");
	await f.wait(900);
	await f.tap("reveal");
});

capture("input/group/icons");

capture("input/group/text-affixes");

capture("input/sizes/sizes");

capture("input/states/live-validation", { types: true }, async (f) => {
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

capture("input/variants/at-rest", { types: true }, async (f) => {
	// Focusing the primary field and typing, so both boxes fill
	await f.tap("input-primary");
	await f.wait(300);
	await f.type("input-primary", "Ada");
	await f.wait(500);
	// Moving focus to the secondary field and deleting it all
	await f.tap("input-secondary");
	await f.wait(400);
	await f.press("input-secondary", "Backspace", 3);
	// Submitting blurs the field, so it loops unfocused as it began
	await f.press("input-secondary", "Enter");
});

capture("input/variants/invalid");

capture("input/group/composer", { types: true }, async (f) => {
	// Writing a message, which runs the count in the footer block
	await f.tap("composer-field");
	await f.wait(300);
	await f.type("composer-field", "On my way, see you soon");
	await f.wait(700);
	// Sending clears it, and dismissing the keyboard leaves it as it began
	await f.tap("composer-send");
	await f.wait(400);
	await f.tap("preview-dismiss-keyboard");
	await f.wait(600);
});

capture("input/group/decorative");

capture("input/group/group-button", { types: true }, async (f) => {
	// Typing a search, which brings the group's clear button in
	await f.tap("group-button-search");
	await f.wait(300);
	await f.type("group-button-search", "tabs");
	await f.wait(800);
	// Clearing it with the group button, and submitting so the field blurs as it began
	await f.tap("group-button-clear");
	await f.wait(400);
	await f.press("group-button-search", "Enter");
	await f.wait(500);
});

capture("input/group/separator");
