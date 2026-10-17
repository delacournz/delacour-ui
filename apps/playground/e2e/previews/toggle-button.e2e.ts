// toggle-button previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("toggle-button/variants", async (f) => {
	// Flipping each off button on, top to bottom
	await f.tap("variant-default-off");
	await f.wait(350);
	await f.tap("variant-outline-off");
	await f.wait(350);
	await f.tap("variant-ghost-off");
	await f.wait(800);
	// And off again, so the clip loops without a jump cut
	await f.tap("variant-ghost-off");
	await f.wait(350);
	await f.tap("variant-outline-off");
	await f.wait(350);
	await f.tap("variant-default-off");
});

capture("toggle-button/sizes");

capture("toggle-button/controlled");

capture("toggle-button/formatting", async (f) => {
	// Adding Italic and Underline alongside Bold
	await f.tap("formatting-italic");
	await f.wait(450);
	await f.tap("formatting-underline");
	await f.wait(800);
	// And taking them off again, so the clip loops without a jump cut
	await f.tap("formatting-underline");
	await f.wait(450);
	await f.tap("formatting-italic");
});

capture("toggle-button/single-selection", async (f) => {
	// Moving the alignment across, each pick clearing the last
	await f.tap("alignment-center");
	await f.wait(450);
	await f.tap("alignment-right");
	await f.wait(450);
	await f.tap("range-month");
	await f.wait(800);
	// And back to where it began, so the clip loops without a jump cut
	await f.tap("range-week");
	await f.wait(450);
	await f.tap("alignment-left");
});

capture("toggle-button/filters", async (f) => {
	// Adding Done and dropping Open, so the list reshapes twice
	await f.tap("filter-done");
	await f.wait(600);
	await f.tap("filter-open");
	await f.wait(800);
	// And back to Open and In review, so the clip loops without a jump cut
	await f.tap("filter-open");
	await f.wait(600);
	await f.tap("filter-done");
});
