// search-bar previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("search-bar/basic", { types: true }, async (f) => {
	// Focusing the field, so Cancel slides in
	await f.tap("search");
	await f.wait(700);
	// Clearing keeps the keyboard and focus
	await f.tap("search-clear");
	await f.wait(500);
	// Typing the query back, so the clear button returns
	await f.type("search-clear", "Wellington");
	await f.wait(500);
	// Submitting blurs the field and Cancel slides out, so the clip loops as it began
	await f.press("search-clear", "Enter");
	await f.wait(700);
});

capture("search-bar/debounced-filter-list", { types: true }, async (f) => {
	// Typing a query; the list filters once typing pauses
	await f.tap("city-search");
	await f.wait(300);
	await f.type("city-search", "wel");
	await f.wait(1000);
	// Clearing reports at once, so the full list returns without the debounce
	await f.tap("city-search-clear");
	await f.wait(600);
	// Submitting blurs the field, so the clip loops unfocused as it began
	await f.press("city-search-clear", "Enter");
	await f.wait(600);
});

capture("search-bar/with-cancel", async (f) => {
	// Focusing the on-focus bar slides its Cancel in
	await f.tap("cancel-focus");
	await f.wait(800);
	// Cancel blurs it and slides back out, so the clip loops as it began
	await f.tap("cancel-focus-cancel");
	await f.wait(800);
});

capture("search-bar/loading-and-tokens");

capture("search-bar/sizes-and-shapes");
