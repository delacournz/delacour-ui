// attachment previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("attachment/layouts");

capture("attachment/kinds");

capture("attachment/upload-states", async (f) => {
	// Uploading floor-plan.pdf until the bar fills and it settles
	await f.tap("attachment-upload-start");
	await f.wait(3600);
	// Retrying the failed image clears its error
	await f.tap("attachment-upload-error-retry");
	await f.wait(900);
	// Removing it puts the error back, so the clip loops without a jump cut
	await f.tap("attachment-upload-error-remove");
	await f.wait(900);
});

capture("attachment/composer-tray", async (f) => {
	// Removing the PDF, then the second photo — the rest slide along
	await f.tap("attachment-tray-remove-b");
	await f.wait(700);
	await f.tap("attachment-tray-remove-c");
	await f.wait(800);
	// Resetting the tray fades both back in, so the clip loops without a jump cut
	await f.tap("attachment-tray-reset");
	await f.wait(900);
});

capture("attachment/in-message");
