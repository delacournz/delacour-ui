// bottom-sheet-engine previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("bottom-sheet-engine/anatomy/two-snap-points", async (f) => {
	// Opening at the first snap point
	await f.tap("two-snap-open");
	await f.visible({ id: "two-snap-close" });
	await f.wait(700);
	// Dragging the handle up to the second
	await f.swipe({ id: "two-snap-handle" }, { y: -0.35 }, { durationMs: 300, momentum: false });
	await f.wait(800);
	// And back down to the first
	await f.swipe({ id: "two-snap-handle" }, { y: 0.35 }, { durationMs: 300, momentum: false });
	await f.wait(800);
	// Dragging past the first closes it
	await f.swipe({ id: "two-snap-handle" }, { y: 0.3 }, { durationMs: 250 });
	await f.hidden({ id: "two-snap-close" });
});

capture("bottom-sheet-engine/detached/floating-card", async (f) => {
	// Opening the floating card
	await f.tap("detached-open");
	await f.visible({ text: "Turn on notifications?" });
	await f.wait(700);
	// Dragging the whole card down through the gap to dismiss it
	await f.swipe({ text: "Turn on notifications?" }, { y: 0.22 }, { durationMs: 250 });
	await f.hidden({ text: "Turn on notifications?" });
	await f.wait(500);
	// Opening it again and closing it from its own button
	await f.tap("detached-open");
	await f.visible({ id: "detached-close" });
	await f.wait(800);
	await f.tap("detached-close");
	await f.hidden({ text: "Turn on notifications?" });
});

capture("bottom-sheet-engine/footer/sticky-on-a-short-sheet", async (f) => {
	// Opening the sheet — handle, two lines of copy, and the footer above the home indicator
	await f.tap("footer-short-open");
	await f.visible({ id: "footer-short-discard" });
	await f.wait(1200);
	// Dragging it down to dismiss, the footer travelling with the sheet
	await f.swipe({ id: "footer-short-handle" }, { y: 0.2 }, { durationMs: 250 });
	await f.hidden({ id: "footer-short-discard" });
});

capture("bottom-sheet-engine/keyboard/interactive-with-sticky-footer", { types: true }, async (f) => {
	// Opening the sheet
	await f.tap("kb-interactive-open");
	await f.visible({ id: "kb-interactive-save" });
	await f.wait(600);
	// Focusing a field — the sheet rides the keyboard up and the footer lands on its top edge
	await f.tap("kb-interactive-plain");
	await f.wait(900);
	await f.type("kb-interactive-plain", "Ada");
	await f.wait(400);
	// The next field resizes nothing
	await f.tap("kb-interactive-registered");
	await f.wait(800);
	// Return blurs the field, and the sheet follows the keyboard back down
	await f.press("kb-interactive-registered", "Enter");
	await f.wait(900);
	// Dragging the sheet away
	await f.swipe({ id: "kb-interactive-handle" }, { y: 0.4 }, { durationMs: 250 });
	await f.hidden({ id: "kb-interactive-save" });
});

capture("bottom-sheet-engine/portal/two-sheets-stacked", async (f) => {
	// Opening the first sheet
	await f.tap("stack-open-first");
	await f.visible({ id: "stack-open-second" });
	await f.wait(700);
	// Opening the second from inside it — it stacks on top
	await f.tap("stack-open-second");
	await f.visible({ id: "stack-dismiss-all" });
	await f.wait(1000);
	// Dismissing both at once through the registry
	await f.tap("stack-dismiss-all");
	await f.hidden({ id: "stack-open-second" });
});

capture("bottom-sheet-engine/scrollables/scroll-view-two-snap-points", async (f) => {
	// Opening at the low snap point
	await f.tap("scroll-view-open");
	await f.visible({ matches: "^Row 1$" });
	await f.wait(600);
	// A swipe up inside the list moves the sheet to the high snap point, not the rows
	await f.swipe({ text: "Row 3" }, { y: -0.35 }, { durationMs: 300, momentum: false });
	await f.visible({ matches: "^Row 1$" });
	await f.wait(600);
	// At the high snap point the same swipe scrolls the list
	await f.swipe({ text: "Row 8" }, { y: -0.35 }, { durationMs: 300, momentum: false });
	await f.hidden({ matches: "^Row 1$" });
	await f.wait(600);
	// Scrolling back to the top, then dragging the sheet down and away
	await f.swipe({ id: "scroll-view-list" }, { y: 0.4 }, { durationMs: 300, momentum: false });
	await f.visible({ matches: "^Row 1$" });
	await f.wait(400);
	await f.swipe({ text: "Row 2" }, { y: 0.4 }, { durationMs: 300, momentum: false });
	await f.wait(500);
	await f.swipe({ matches: "^Row 1$" }, { y: 0.3 }, { durationMs: 250 });
	await f.hidden({ matches: "^Row 1$" });
});

capture("bottom-sheet-engine/steps/three-step-form", { types: true }, async (f) => {
	// Opening on the details step and filling both fields
	await f.tap("steps-form-open");
	await f.visible({ id: "steps-form-name" });
	await f.wait(500);
	await f.type("steps-form-name", "Ada");
	await f.type("steps-form-email", "ada@example.com");
	await f.wait(300);
	// Next glides the sheet to the confirm step
	await f.tap("steps-form-next");
	await f.visible({ id: "steps-form-submit" });
	await f.wait(700);
	await f.tap("steps-form-submit");
	await f.visible({ id: "steps-form-done" });
	await f.wait(800);
	// Done closes it and resets the machine
	await f.tap("steps-form-done");
	await f.hidden({ id: "steps-form-done" });
});
