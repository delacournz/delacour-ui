// accordion previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("accordion/variants", async (f) => {
	// Opening the first row of each variant
	await f.tap("variant-default");
	await f.wait(250);
	await f.tap("variant-secondary");
	await f.wait(250);
	await f.tap("variant-tertiary");
	await f.wait(250);
	await f.tap("variant-transparent");
	await f.wait(700);
	// And closing them again, so the clip loops without a jump cut
	await f.tap("variant-default");
	await f.wait(250);
	await f.tap("variant-secondary");
	await f.wait(250);
	await f.tap("variant-tertiary");
	await f.wait(250);
	await f.tap("variant-transparent");
});

capture("accordion/sizes", async (f) => {
	// Closing each size in turn, so the panel spring reads at every scale
	await f.tap("size-sm");
	await f.wait(350);
	await f.tap("size-md");
	await f.wait(350);
	await f.tap("size-lg");
	await f.wait(700);
	// And opening them again, so the clip loops without a jump cut
	await f.tap("size-sm");
	await f.wait(350);
	await f.tap("size-md");
	await f.wait(350);
	await f.tap("size-lg");
});

capture("accordion/one-at-a-time", async (f) => {
	// Opening Returns, which closes Shipping
	await f.tap("faq-returns");
	await f.wait(800);
	// Then Warranty, which closes Returns
	await f.tap("faq-warranty");
	await f.wait(800);
	// And Shipping again, so the clip loops without a jump cut
	await f.tap("faq-shipping");
});

capture("accordion/any-number-at-once", async (f) => {
	// Opening Shipping and Warranty alongside Returns
	await f.tap("multi-shipping");
	await f.wait(700);
	await f.tap("multi-warranty");
	await f.wait(900);
	// And closing both again, so the clip loops without a jump cut
	await f.tap("multi-shipping");
	await f.wait(700);
	await f.tap("multi-warranty");
});

capture("accordion/a-glyph-beside-the-title", async (f) => {
	// Opening the row, so the glyph and title stay put while the chevron turns
	await f.tap("delivery");
	await f.wait(1200);
	// And closing it, so the clip loops without a jump cut
	await f.tap("delivery");
});
