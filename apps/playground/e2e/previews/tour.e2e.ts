// tour previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("tour/basic", async (f) => {
	// Starting the tour — the screen dims and a hole opens around Search
	await f.tap("tour-basic-start");
	await f.visible({ id: "tour-basic-next" });
	await f.wait(1100);
	// Next glides the hole to Notifications, then Settings
	await f.tap("tour-basic-next");
	await f.wait(1100);
	await f.tap("tour-basic-next");
	await f.wait(1100);
	// Done closes it, so the clip loops back to the closed screen
	await f.tap("tour-basic-next");
	await f.hidden({ id: "tour-basic-card" });
});

capture("tour/circle-shape", async (f) => {
	// Starting on the heading, in the tour's rounded rectangle
	await f.tap("tour-circle-start");
	await f.visible({ id: "tour-circle-next" });
	await f.wait(1100);
	// Next morphs the hole into a circle around the add button
	await f.tap("tour-circle-next");
	await f.wait(1300);
	// Done closes it, so the clip loops back to the closed screen
	await f.tap("tour-circle-next");
	await f.hidden({ id: "tour-circle-card" });
});

capture("tour/placement", async (f) => {
	// auto puts the card below the first row
	await f.tap("tour-placement-start");
	await f.visible({ id: "tour-placement-next" });
	await f.wait(1100);
	// top moves it above the second, bottom back below the third
	await f.tap("tour-placement-next");
	await f.wait(1100);
	await f.tap("tour-placement-next");
	await f.wait(1100);
	// Done closes it, so the clip loops back to the closed screen
	await f.tap("tour-placement-next");
	await f.hidden({ id: "tour-placement-card" });
});

capture("tour/interactive", async (f) => {
	// Starting the tour on the heart
	await f.tap("tour-interactive-start");
	await f.visible({ id: "tour-interactive-card" });
	await f.wait(1100);
	// Tapping the heart through the hole likes it and advances to the bookmark
	await f.tap("tour-interactive-like");
	await f.wait(1100);
	// Saving finishes the tour
	await f.tap("tour-interactive-save");
	await f.hidden({ id: "tour-interactive-card" });
	await f.wait(700);
	// Unlike and unsave, so the clip loops back to where it began
	await f.tap("tour-interactive-like");
	await f.wait(250);
	await f.tap("tour-interactive-save");
});

capture("tour/custom-labels", async (f) => {
	// Starting the French tour — no Skip, progress as 1/2
	await f.tap("tour-labels-start");
	await f.visible({ id: "tour-labels-next" });
	await f.wait(1200);
	// Suivant moves to the second step, where Retour appears
	await f.tap("tour-labels-next");
	await f.wait(1200);
	// Terminé closes it, so the clip loops back to the closed screen
	await f.tap("tour-labels-next");
	await f.hidden({ id: "tour-labels-card" });
});
