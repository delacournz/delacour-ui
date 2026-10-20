// empty-state previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("empty-state/anatomy", async (f) => {
	// Starting two drafts, which rewords the description
	await f.tap("compose");
	await f.wait(600);
	await f.tap("compose");
	await f.wait(900);
	// Clearing them, so the clip loops where it began
	await f.tap("reset");
});

capture("empty-state/variants");

capture("empty-state/sizes");

capture("empty-state/media");

capture("empty-state/actions");

capture("empty-state/emptied-list", async (f) => {
	// Removing every item — each removal re-indexes the rest, so remove-0 is always the top row
	await f.tap("remove-0");
	await f.wait(350);
	await f.tap("remove-0");
	await f.wait(350);
	await f.tap("remove-0");
	await f.visible({ id: "restore" });
	await f.wait(900);
	// Restoring them, so the clip loops where it began
	await f.tap("restore");
});
