// menu previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("menu/actions", async (f) => {
	// Opening the menu from the ⋯ button
	await f.tap("menu-actions-trigger");
	await f.visible({ id: "menu-actions-rename" });
	await f.wait(1400);
	// Dismissing it from the scrim, so nothing is chosen and the clip loops
	await f.tapText("Close menu");
	await f.hidden({ id: "menu-actions-rename" });
});

capture("menu/checkbox-and-radio", async (f) => {
	// Opening the menu
	await f.tap("menu-view-trigger");
	await f.visible({ id: "menu-view-done" });
	await f.wait(600);
	// A checkbox row toggles and the menu stays open
	await f.tap("menu-view-done");
	await f.wait(500);
	await f.tap("menu-view-done");
	await f.wait(500);
	// A radio row chooses and closes
	await f.tap("menu-view-compact");
	await f.hidden({ id: "menu-view-done" });
	await f.wait(500);
	// Back to Comfortable, so the clip loops without a jump cut
	await f.tap("menu-view-trigger");
	await f.visible({ id: "menu-view-comfortable" });
	await f.wait(600);
	await f.tap("menu-view-comfortable");
	await f.hidden({ id: "menu-view-done" });
});

capture("menu/submenu", async (f) => {
	// Opening the menu
	await f.tap("menu-sub-trigger");
	await f.visible({ id: "menu-sub-move" });
	await f.wait(500);
	// Expanding Move to in place, then folding it away again
	await f.tap("menu-sub-move");
	await f.wait(1100);
	await f.tap("menu-sub-move");
	await f.wait(600);
	// Choosing Edit closes the menu
	await f.tap("menu-sub-edit");
	await f.hidden({ id: "menu-sub-move" });
});

capture("menu/near-bottom-edge", async (f) => {
	// Opening the menu — with no room below, it flips above the trigger
	await f.tap("menu-bottom-trigger");
	await f.visible({ id: "menu-bottom-rename" });
	await f.wait(1400);
	// Choosing Rename closes it
	await f.tap("menu-bottom-rename");
	await f.hidden({ id: "menu-bottom-rename" });
});

capture("menu/long-list", async (f) => {
	// Opening the capped panel
	await f.tap("menu-zone-trigger");
	await f.visible({ id: "menu-zone-Pacific/Auckland" });
	await f.wait(500);
	// Scrolling the rows — a drag chooses nothing
	await f.swipe({ id: "menu-zone-Asia/Dubai" }, { y: -0.2 }, { durationMs: 500, momentum: false });
	await f.wait(500);
	await f.swipe({ id: "menu-zone-Asia/Dubai" }, { y: 0.2 }, { durationMs: 500, momentum: false });
	await f.wait(500);
	// Choosing the current zone again closes it with nothing changed
	await f.tap("menu-zone-Pacific/Auckland");
	await f.hidden({ id: "menu-zone-Pacific/Auckland" });
});
