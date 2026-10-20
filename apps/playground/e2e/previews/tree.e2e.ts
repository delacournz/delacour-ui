// tree previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("tree/file-browser", async (f) => {
	// Opening hooks and selecting the file inside it
	await f.tap("file-browser-src/hooks");
	await f.wait(500);
	await f.tap("file-browser-src/hooks/use-theme.ts");
	await f.wait(600);
	// Closing hooks and selecting button.tsx again, so the clip loops without a jump cut
	await f.tap("file-browser-src/hooks");
	await f.wait(500);
	await f.tap("file-browser-src/components/button.tsx");
	await f.wait(500);
});

capture("tree/single-select", async (f) => {
	// Moving the selection down the tree, branches included
	await f.tap("single-trousers");
	await f.wait(500);
	await f.tap("single-shoes");
	await f.wait(500);
	await f.tap("single-accessories");
	await f.wait(500);
	// And back to Tops, so the clip loops without a jump cut
	await f.tap("single-tops");
	await f.wait(500);
});

capture("tree/multi-select", async (f) => {
	// Checking SMS and the digest
	await f.tap("multi-sms");
	await f.wait(400);
	await f.tap("multi-digest");
	await f.wait(600);
	// And unchecking both, so the clip loops without a jump cut
	await f.tap("multi-digest");
	await f.wait(400);
	await f.tap("multi-sms");
	await f.wait(400);
});

capture("tree/lines");

capture("tree/sizes");

capture("tree/lazy-load", async (f) => {
	// Closing Northland and opening Auckland, which fetches its cities behind a spinner
	await f.tap("lazy-Northland");
	await f.wait(400);
	await f.tap("lazy-Auckland");
	await f.wait(1600);
	// Swapping back to Northland, so the clip loops without a jump cut
	await f.tap("lazy-Auckland");
	await f.wait(400);
	await f.tap("lazy-Northland");
	await f.wait(500);
});
