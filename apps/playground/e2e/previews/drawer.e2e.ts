// drawer previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("drawer/navigation", async (f) => {
	// Opening the menu from the start edge
	await f.tap("drawer-navigation-open");
	await f.visible({ text: "Harbour Studio" });
	await f.wait(1200);
	// Choosing a place closes it
	await f.tap("drawer-navigation-inbox");
	await f.hidden({ text: "Harbour Studio" });
	await f.wait(500);
	// Opening it again and swiping it back to the edge
	await f.tap("drawer-navigation-open");
	await f.visible({ id: "drawer-navigation-panel" });
	await f.wait(900);
	await f.swipe({ id: "drawer-navigation-panel" }, { x: -0.37 }, { durationMs: 300 });
	await f.hidden({ text: "Harbour Studio" });
});

capture("drawer/filters", async (f) => {
	// Opening the filter panel from the end edge
	await f.tap("drawer-filters-open");
	await f.visible({ id: "drawer-filters-panel" });
	await f.wait(900);
	// Picking two cuisines
	await f.tap("drawer-filters-pizza");
	await f.wait(400);
	await f.tap("drawer-filters-curry");
	await f.wait(700);
	// Showing the results
	await f.tap("drawer-filters-apply");
	await f.hidden({ id: "drawer-filters-panel" });
});

capture("drawer/notifications", async (f) => {
	// Pulling the tray down from the top
	await f.tap("drawer-notifications-open");
	await f.visible({ id: "drawer-notifications-panel" });
	await f.wait(1400);
	// Swiping it back up
	await f.swipe({ id: "drawer-notifications-panel" }, { y: -0.18 }, { durationMs: 300 });
	await f.hidden({ id: "drawer-notifications-panel" });
});

capture("drawer/sizes", async (f) => {
	// Small
	await f.tap("drawer-sizes-sm");
	await f.visible({ id: "drawer-sizes-panel-sm" });
	await f.wait(800);
	await f.swipe({ id: "drawer-sizes-panel-sm" }, { x: -0.295 }, { durationMs: 300 });
	await f.hidden({ id: "drawer-sizes-panel-sm" });
	await f.wait(300);
	// Large
	await f.tap("drawer-sizes-lg");
	await f.visible({ id: "drawer-sizes-panel-lg" });
	await f.wait(800);
	await f.swipe({ id: "drawer-sizes-panel-lg" }, { x: -0.42 }, { durationMs: 300 });
	await f.hidden({ id: "drawer-sizes-panel-lg" });
	await f.wait(300);
	// Full
	await f.tap("drawer-sizes-full");
	await f.visible({ id: "drawer-sizes-panel-full" });
	await f.wait(800);
	await f.swipe({ id: "drawer-sizes-panel-full" }, { x: -0.45 }, { durationMs: 300 });
	await f.hidden({ id: "drawer-sizes-panel-full" });
});

capture("drawer/rtl");
