// markdown-editor previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("markdown-editor/basic", async (f) => {
	// Flipping to the preview, so the source renders as headings, bold, code and a list
	await f.wait(500);
	await f.tap("markdown-mode-preview");
	await f.wait(1600);
	// And back to the source, so the clip loops without a jump cut
	await f.tap("markdown-mode-write");
	await f.wait(700);
});

capture("markdown-editor/preview-mode");

capture("markdown-editor/custom-toolbar", { types: true }, async (f) => {
	// Starting a bulleted list from the toolbar, then letting Return continue it
	await f.tap("custom-toolbar");
	await f.wait(500);
	await f.tap("markdown-action-bulletList");
	await f.wait(600);
	await f.type("custom-toolbar", "Milk");
	await f.press("custom-toolbar", "Enter");
	await f.wait(200);
	await f.type("custom-toolbar", "Eggs");
	await f.wait(800);
	// Deleting all thirteen characters and blurring, so the clip ends empty and unfocused as it began
	await f.press("custom-toolbar", "Backspace", 13);
	await f.wait(200);
	await f.tap("preview-dismiss-keyboard");
	await f.wait(500);
});

capture("markdown-editor/pill-toolbar");

capture("markdown-editor/in-field");
