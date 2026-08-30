import type { DemoEntry, DemoModule } from "./types";

/**
 * An ordered group of demos, from a component folder's own barrel.
 *
 * The object's key order **is** the gallery's reading order. That is the one
 * editorial decision in the whole registry, so it is authored here rather than
 * derived — `registry.ts` is generated and sorts alphabetically, which would
 * open the Switch gallery with "A glyph in the knob" and bury "Tap or drag"
 * two-thirds of the way down.
 *
 * Splitting it this way keeps each half honest: order is editorial and lives in
 * a barrel a human wrote, completeness is mechanical and lives in a file a
 * script wrote, and `demos.test.ts` checks that the two describe the same set.
 *
 * Keys are the demo filenames, which is what lets that test notice a file added
 * to the folder and never listed here.
 *
 * `Object.entries` preserves insertion order for string keys that are not
 * integer-like, and every slug is kebab-case, so the order written is the order
 * returned.
 */
export function defineDemoGroup(group: string, modules: Record<string, DemoModule>): readonly DemoEntry[] {
	return Object.entries(modules).map(([slug, { meta, Demo }]) => ({
		Demo,
		align: meta.align ?? meta.capture?.align ?? "stretch",
		capture: meta.capture,
		caption: meta.caption,
		group,
		id: `${group}/${slug}`,
		keyboardAware: meta.keyboardAware ?? false,
		note: meta.note,
		slug,
		title: meta.title,
	}));
}

/**
 * Joins a folder gallery's facets into one component-level group, in order.
 *
 * `tabs` has five facet routes, each its own gallery, but a documentation page
 * for Tabs wants every demo across all five in one list.
 */
export function concatDemoGroups(...groups: readonly (readonly DemoEntry[])[]): readonly DemoEntry[] {
	return groups.flat();
}
