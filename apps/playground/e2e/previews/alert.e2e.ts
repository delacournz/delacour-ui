// alert previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("alert/statuses");

capture("alert/surface-variant");

capture("alert/sizes");

capture("alert/dismissible", async (f) => {
	// Dismissing both alerts — each fades out and the layout follows
	await f.tap("dismissible-tip-close");
	await f.wait(600);
	await f.tap("dismissible-success-close");
	await f.wait(700);
	// Reset remounts them, so the clip loops without a jump cut
	await f.tap("dismissible-reset");
	await f.visible({ id: "dismissible-tip-close" });
});

capture("alert/actions", async (f) => {
	// Retrying — the button spins, then the description counts the retry
	await f.tap("actions-retry");
	await f.wait(1600);
	// Got it closes the second alert from inside it, through useAlert().dismiss
	await f.tap("actions-got-it");
	await f.visible({ id: "actions-reset" });
	await f.wait(500);
	// Reset clears the count and brings the alert back, so the clip loops
	await f.tap("actions-reset");
	await f.visible({ id: "actions-got-it" });
});

capture("alert/custom-indicator", async (f) => {
	// Letting the sync finish — the spinner gives way to the cloud glyph
	await f.visible({ id: "custom-sync-again" });
	await f.wait(1000);
	// Syncing again, and stopping mid-sync so the clip loops back to its opening
	await f.tap("custom-sync-again");
	await f.hidden({ id: "custom-sync-again" });
	await f.wait(400);
});

capture("alert/checkout", async (f) => {
	// Retrying the charge — the button spins for 1.2 s, then the alert turns to success
	await f.tap("checkout-retry");
	await f.visible({ id: "checkout-reset" });
	await f.wait(1000);
	// Starting over, so the clip loops back to the declined card
	await f.tap("checkout-reset");
	await f.visible({ id: "checkout-retry" });
});
