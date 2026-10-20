// combobox previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("combobox/single", { types: true }, async (f) => {
	// Opening the sheet; the search field focuses once it settles
	await f.tap("combobox-single");
	await f.visible({ id: "combobox-single-search" });
	await f.wait(700);
	// Typing without the accent still finds Österreich, and the match goes bold
	await f.type("combobox-single", "oster");
	await f.wait(700);
	await f.tap("combobox-single-option-at");
	await f.hidden({ id: "combobox-single-search" });
	await f.wait(900);
	// Clearing it, so the clip loops back to the placeholder
	await f.tap("combobox-single-clear");
	await f.wait(600);
});

capture("combobox/multiple-chips", { types: true }, async (f) => {
	// Opening the sheet and finding Swift
	await f.tap("combobox-multiple-chevron");
	await f.visible({ id: "combobox-multiple-search" });
	await f.wait(700);
	await f.type("combobox-multiple-chevron", "sw");
	await f.wait(500);
	// The pick adds a chip and keeps the sheet and the keyboard up
	await f.tap("combobox-multiple-option-swift");
	await f.wait(700);
	await f.tap("combobox-multiple-done");
	await f.hidden({ id: "combobox-multiple-search" });
	await f.wait(700);
	// Removing the new chip from the trigger, so the clip loops with two
	await f.tap("combobox-multiple-remove-swift");
	await f.wait(600);
});

capture("combobox/async-server-filter", { types: true }, async (f) => {
	// Opening the sheet; the simulated server answers after a short delay
	await f.tap("combobox-server");
	await f.visible({ id: "combobox-server-search" });
	await f.wait(900);
	// Typing narrows the results the server sends back
	await f.type("combobox-server", "ar");
	await f.visible({ id: "combobox-server-option-omar" });
	await f.wait(900);
	await f.tap("combobox-server-option-omar");
	await f.hidden({ id: "combobox-server-search" });
	await f.wait(900);
	// Clearing it, so the clip loops back to the placeholder
	await f.tap("combobox-server-clear");
	await f.wait(600);
});

capture("combobox/custom-value", { types: true }, async (f) => {
	// Opening from the chevron, clear of the chips; typing a label no option has brings the create row
	await f.tap("combobox-custom-chevron");
	await f.visible({ id: "combobox-custom-search" });
	await f.wait(700);
	await f.type("combobox-custom-chevron", "Urgent");
	await f.visible({ id: "combobox-custom-create" });
	await f.wait(500);
	await f.tap("combobox-custom-create");
	await f.wait(700);
	await f.tap("combobox-custom-done");
	await f.hidden({ id: "combobox-custom-search" });
	await f.wait(700);
	// Removing it again, so the clip loops with two chips
	await f.tap("combobox-custom-remove-Urgent");
	await f.wait(600);
});

capture("combobox/in-field-invalid");
