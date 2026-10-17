// button previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("button/variants", async (f) => {
	// Pressing and holding each variant in turn, so the press feedback reads
	await f.longPress("variant-primary", 260);
	await f.longPress("variant-secondary", 260);
	await f.longPress("variant-tertiary", 260);
	await f.longPress("variant-outline", 260);
	await f.longPress("variant-ghost", 260);
	await f.longPress("variant-destructive", 260);
	await f.longPress("variant-destructive-soft", 260);
});

capture("button/sizes");

capture("button/disabled");

capture("button/loading", async (f) => {
	// Nothing to touch — a loading button is its spinner, so this only holds the camera on it
	await f.wait(2000);
});

capture("button/icons");

capture("button/icon-button", async (f) => {
	// Pressing and holding each icon button in turn, so the press feedback reads
	await f.longPress("favourite-icon-sm", 260);
	await f.longPress("favourite-icon-md", 260);
	await f.longPress("favourite-icon-lg", 260);
	await f.longPress("delete", 260);
	await f.longPress("add", 260);
});

capture("button/group", async (f) => {
	// Pressing and holding across each run, so the press feedback reads member by member
	await f.longPress("group-archive", 260);
	await f.longPress("group-report", 260);
	await f.longPress("group-snooze", 260);
	await f.longPress("group-day", 260);
	await f.longPress("group-week", 260);
	await f.longPress("group-month", 260);
	await f.longPress("group-alone", 260);
});

capture("button/group-orientation", async (f) => {
	// Pressing each member of the horizontal run, then the vertical one
	await f.longPress("horizontal-fewer", 260);
	await f.longPress("horizontal-more", 260);
	await f.wait(150);
	await f.longPress("vertical-more", 260);
	await f.longPress("vertical-fewer", 260);
});

capture("button/group-separator");

capture("button/group-text", async (f) => {
	// Pressing the buttons beside each text member; the text itself takes no press
	await f.longPress("stepper-fewer", 260);
	await f.wait(150);
	await f.longPress("stepper-more", 260);
	await f.wait(150);
	await f.longPress("labelled-domain", 260);
});

capture("button/group-input");

capture("button/group-spaced", async (f) => {
	// Pressing and holding each spaced member, so each one scales on its own
	await f.longPress("spaced-find", 260);
	await f.longPress("spaced-export", 260);
	await f.longPress("spaced-share", 260);
	await f.longPress("spaced-undo", 260);
	await f.longPress("spaced-redo", 260);
	await f.longPress("spaced-clear", 260);
});

capture("button/group-full-width", async (f) => {
	// Pressing and holding across the equal segments, so each share reads on its own
	await f.longPress("full-monthly", 260);
	await f.longPress("full-annual", 260);
	await f.longPress("full-once", 260);
	await f.longPress("full-a", 260);
	await f.longPress("full-annual-plan", 260);
	await f.longPress("full-b", 260);
	await f.longPress("full-confirm", 260);
});
