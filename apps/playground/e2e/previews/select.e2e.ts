// select previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("select/single", async (f) => {
	// Opening the sheet and picking Feijoa — a pick closes it
	await f.tap("select-single");
	await f.visible({ id: "select-single-option-feijoa" });
	await f.wait(600);
	await f.tap("select-single-option-feijoa");
	await f.hidden({ id: "select-single-option-feijoa" });
	await f.wait(700);
	// And back to Kiwifruit, so the clip loops without a jump cut
	await f.tap("select-single");
	await f.visible({ id: "select-single-option-kiwifruit" });
	await f.wait(600);
	await f.tap("select-single-option-kiwifruit");
	await f.hidden({ id: "select-single-option-kiwifruit" });
	await f.wait(400);
});

capture("select/multiple", async (f) => {
	// Opening the sheet and ticking a third — the limit disables the rest
	await f.tap("select-multiple");
	await f.visible({ id: "select-multiple-done" });
	await f.wait(600);
	await f.tap("select-multiple-option-olives");
	await f.wait(900);
	// Unticking it again, so the selection ends where it began
	await f.tap("select-multiple-option-olives");
	await f.wait(600);
	await f.tap("select-multiple-done");
	await f.hidden({ id: "select-multiple-done" });
	await f.wait(400);
});

capture("select/grouped-searchable", { types: true }, async (f) => {
	// Opening the sheet and searching — accents fold and emptied groups disappear
	await f.tap("select-grouped");
	await f.visible({ id: "select-grouped-search" });
	await f.wait(500);
	await f.type("select-grouped-search", "zur");
	await f.visible({ id: "select-grouped-option-zrh" });
	await f.wait(900);
	// Closing clears the search and leaves the value unchanged
	await f.tap("select-grouped-close");
	await f.hidden({ id: "select-grouped-search" });
	await f.wait(500);
});

capture("select/in-a-field");

capture("select/disabled-and-loading");
