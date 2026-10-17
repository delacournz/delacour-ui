// textarea previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("textarea/rows");

capture("textarea/auto-grow", { types: true }, async (f) => {
	// Typing four short lines, so the field grows a row at a time
	await f.tap("auto-grow");
	await f.wait(250);
	await f.type("auto-grow", "One");
	await f.press("auto-grow", "Enter");
	await f.type("auto-grow", "Two");
	await f.press("auto-grow", "Enter");
	await f.type("auto-grow", "Three");
	await f.press("auto-grow", "Enter");
	await f.type("auto-grow", "Four");
	await f.wait(600);
	// Deleting all eighteen characters, so it shrinks back to two rows
	await f.press("auto-grow", "Backspace", 18);
	await f.wait(300);
	// Tapping the preview's dismiss strip, since return in a textarea is a newline, not a blur
	await f.tap("preview-dismiss-keyboard");
});

capture("textarea/character-count", { types: true }, async (f) => {
	// Focusing, and moving the caret to the end of the text
	await f.tap("status");
	await f.wait(200);
	await f.press("status", "Down", 2);
	// Typing past the limit — the twelfth character turns the count destructive and the thirteenth is refused
	await f.type("status", " Maybe seven.");
	await f.wait(700);
	// Deleting back to 68
	await f.press("status", "Backspace", 12);
	await f.wait(300);
	// Tapping the preview's dismiss strip, since return in a textarea is a newline, not a blur
	await f.tap("preview-dismiss-keyboard");
});

capture("textarea/variants");

capture("textarea/sizes");

capture("textarea/states");

capture("textarea/feedback-form", { types: true }, async (f) => {
	// Sending it empty, so the Field reports the error
	await f.tap("send");
	await f.wait(700);
	// Typing clears the error
	await f.tap("feedback");
	await f.wait(200);
	await f.type("feedback", "Works well.");
	await f.wait(400);
	// Dismissing the keyboard first, which would otherwise cover the button
	await f.tap("preview-dismiss-keyboard");
	await f.wait(300);
	// Sending blurs the fields and clears them; the thank-you times out back to the start
	await f.tap("send");
	await f.wait(2300);
});
