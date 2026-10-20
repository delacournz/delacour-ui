// table previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("table/basic");

capture("table/columns");

capture("table/sortable", async (f) => {
	// Sorting by team name, then reversing it
	await f.tapText("Team");
	await f.wait(700);
	await f.tapText("Team");
	await f.wait(700);
	// Back to points — ascending, then descending, where the clip began
	await f.tapText("Points");
	await f.wait(700);
	await f.tapText("Points");
});

capture("table/selectable", async (f) => {
	// Selecting the last row, then the first
	await f.tap("table-selectable-INV-044");
	await f.wait(600);
	await f.tap("table-selectable-INV-041");
	await f.wait(600);
	// The disabled row ignores the press
	await f.tap("table-selectable-INV-043");
	await f.wait(600);
	// And back to INV-042, so the clip loops without a jump cut
	await f.tap("table-selectable-INV-042");
});

capture("table/frame");

capture("table/wide-scroll", async (f) => {
	// Scrolling to the last month
	await f.swipe({ id: "table-wide" }, { x: -0.45 }, { durationMs: 800, momentum: false });
	await f.wait(700);
	// And flicked back to the start, so the clip loops without a jump cut
	await f.swipe({ id: "table-wide" }, { x: 0.45 }, { durationMs: 500 });
	await f.wait(600);
});
