// context-menu previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("context-menu/message-actions", async (f) => {
	// Holding the message past its 350ms delay, so the menu opens at the finger
	await f.longPress("context-menu-message", 600);
	await f.visible({ id: "context-menu-reply" });
	await f.wait(1400);
	// Dismissing it from the scrim, so nothing is chosen and the clip loops
	await f.tapAt(0.5, 0.12);
	await f.hidden({ id: "context-menu-reply" });
});

capture("context-menu/anchored-to-row", async (f) => {
	// Holding the middle row; the panel hangs off the row's leading edge, not the finger
	await f.longPress("context-menu-row-1", 600);
	await f.visible({ id: "context-menu-row-1-rename" });
	await f.wait(1400);
	// Dismissing it from the scrim, so the clip loops
	await f.tapAt(0.5, 0.12);
	await f.hidden({ id: "context-menu-row-1-rename" });
});

capture("context-menu/stateful-rows", async (f) => {
	// Holding the invoice
	await f.longPress("context-menu-stateful", 600);
	await f.visible({ id: "context-menu-stateful-starred" });
	await f.wait(600);
	// A checkbox row toggles and the menu stays open
	await f.tap("context-menu-stateful-starred");
	await f.wait(800);
	await f.tap("context-menu-stateful-starred");
	await f.wait(700);
	// A radio row chooses and closes
	await f.tap("context-menu-stateful-compact");
	await f.hidden({ id: "context-menu-stateful-starred" });
	await f.wait(600);
	// Back to Comfortable, so the clip loops without a jump cut
	await f.longPress("context-menu-stateful", 600);
	await f.visible({ id: "context-menu-stateful-comfortable" });
	await f.wait(500);
	await f.tap("context-menu-stateful-comfortable");
	await f.hidden({ id: "context-menu-stateful-starred" });
});

capture("context-menu/lifted-preview", async (f) => {
	// Holding the middle card, which lifts a copy of it over the dimmed list
	await f.longPress("context-menu-place-Karekare", 600);
	await f.visible({ id: "context-menu-place-Karekare-favourite" });
	await f.wait(1600);
	// Dismissing it from the scrim, so the copy settles back and the clip loops
	await f.tapAt(0.5, 0.12);
	await f.hidden({ id: "context-menu-place-Karekare-favourite" });
});

capture("context-menu/hold-timing", async (f) => {
	// The quick row opens after 150ms
	await f.longPress("context-menu-hold-150", 350);
	await f.visible({ id: "context-menu-hold-150-pin" });
	await f.wait(800);
	await f.tapAt(0.5, 0.12);
	await f.hidden({ id: "context-menu-hold-150-pin" });
	await f.wait(300);
	// The deliberate row has to be held for 800ms
	await f.longPress("context-menu-hold-800", 1050);
	await f.visible({ id: "context-menu-hold-800-pin" });
	await f.wait(800);
	await f.tapAt(0.5, 0.12);
	await f.hidden({ id: "context-menu-hold-800-pin" });
});
