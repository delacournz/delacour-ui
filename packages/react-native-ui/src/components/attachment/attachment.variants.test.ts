import { describe, expect, test } from "bun:test";
import { declaredTokens } from "../../styles/theme-tokens.test";
import { ICON_SIZE_TOKENS } from "../../styles/tokens";
import {
	ATTACHMENT_ACTION_EDGE,
	ATTACHMENT_ACTION_FOREGROUND_TOKEN,
	ATTACHMENT_ACTION_HIT_SLOP,
	ATTACHMENT_ERROR_NUDGE,
	ATTACHMENT_KIND_TONE,
	ATTACHMENT_KINDS,
	ATTACHMENT_LAYOUTS,
	ATTACHMENT_SIZE_POINTS,
	ATTACHMENT_SIZES,
	ATTACHMENT_STATUS_TYPES,
	attachmentVariants,
	resolveAttachmentParts,
} from "./attachment.variants";

const LIGHT = declaredTokens("light");
const DARK = declaredTokens("dark");

const SLOTS = [
	"root",
	"press",
	"preview",
	"previewFallback",
	"glyph",
	"image",
	"content",
	"name",
	"meta",
	"progress",
	"progressTrack",
	"actions",
	"action",
	"dim",
	"badge",
	"group",
] as const;

/** The `size-N` step a class string sets its edge from, in points (Tailwind's 4pt spacing unit). */
function edgeOf(cls: string): number {
	return Number(cls.match(/\bsize-(\d+)\b/)?.[1]) * 4;
}

/** The `h-N` step a class string sets its height from, in points. */
function heightOf(cls: string): number {
	return Number(cls.match(/(?:^|\s)h-(\d+)\b/)?.[1]) * 4;
}

/** Position of a slot's `size-icon-*` token on the shared icon scale. */
function iconStep(cls: string): number {
	const token = cls.match(/\bsize-(icon-[\w-]+)\b/)?.[1];
	return ICON_SIZE_TOKENS.indexOf(token as (typeof ICON_SIZE_TOKENS)[number]);
}

/** Every colour token a class string paints with — `bg-*`, `text-*`, `border-*` — minus prefix and alpha. */
function colorTokens(cls: string): string[] {
	const tokens: string[] = [];
	for (const [, , token] of cls.matchAll(/(?:^|\s)(bg|text|border)-([a-z]+(?:-[a-z]+)*)(?:\/\d+)?(?=\s|$)/g)) {
		if (token === undefined) continue;
		if (/^(xs|sm|base|lg|xl|\dxl|center|left|right|start|end|none|transparent)$/.test(token)) continue;
		tokens.push(token);
	}
	return tokens;
}

function everyCell(): { layout: (typeof ATTACHMENT_LAYOUTS)[number]; size: (typeof ATTACHMENT_SIZES)[number] }[] {
	return ATTACHMENT_LAYOUTS.flatMap((layout) => ATTACHMENT_SIZES.map((size) => ({ layout, size })));
}

describe("every slot resolves", () => {
	test("at every layout × size × status × kind", () => {
		for (const { layout, size } of everyCell()) {
			for (const status of ATTACHMENT_STATUS_TYPES) {
				for (const kind of ATTACHMENT_KINDS) {
					const slots = attachmentVariants({ kind, layout, size, status });
					for (const slot of SLOTS) expect(typeof slots[slot]()).toBe("string");
					expect(slots.root().length).toBeGreaterThan(0);
				}
			}
		}
	});
});

describe("sizes", () => {
	test("the preview square matches ATTACHMENT_SIZE_POINTS in chip and card", () => {
		for (const layout of ["chip", "card"] as const) {
			for (const size of ATTACHMENT_SIZES) {
				expect(edgeOf(attachmentVariants({ layout, size }).preview())).toBe(ATTACHMENT_SIZE_POINTS[layout][size]);
			}
		}
	});

	test("the tile's own edge matches ATTACHMENT_SIZE_POINTS", () => {
		for (const size of ATTACHMENT_SIZES) {
			expect(edgeOf(attachmentVariants({ layout: "tile", size }).root())).toBe(ATTACHMENT_SIZE_POINTS.tile[size]);
		}
	});

	test("a chip is its preview plus a 4pt inset on each side", () => {
		for (const size of ATTACHMENT_SIZES) {
			const slots = attachmentVariants({ layout: "chip", size });
			expect(heightOf(slots.root())).toBe(ATTACHMENT_SIZE_POINTS.chip[size] + 8);
			expect(slots.root()).toMatch(/\bp-1\b/);
		}
	});

	test("a stretched chip grows its press target, so the cross sits at the far edge", () => {
		const press = attachmentVariants({ layout: "chip" }).press();
		expect(press).toMatch(/(?:^|\s)grow(?:\s|$)/);
		expect(press).toMatch(/(?:^|\s)shrink(?:\s|$)/);
		expect(press).not.toMatch(/\bflex-1\b/);
	});

	test("every scale ascends", () => {
		for (const layout of ATTACHMENT_LAYOUTS) {
			const points = ATTACHMENT_SIZES.map((size) => ATTACHMENT_SIZE_POINTS[layout][size]);
			expect([...points].sort((a, b) => a - b)).toEqual(points);
			expect(new Set(points).size).toBe(points.length);
		}
	});

	test("the glyph sits on the icon scale and never shrinks with size", () => {
		for (const layout of ATTACHMENT_LAYOUTS) {
			const steps = ATTACHMENT_SIZES.map((size) => iconStep(attachmentVariants({ layout, size }).glyph()));
			for (const step of steps) expect(step).toBeGreaterThanOrEqual(0);
			expect([...steps].sort((a, b) => a - b)).toEqual(steps);
		}
	});

	test("no slot sets a w-N and h-N pair — a square is size-N", () => {
		for (const { layout, size } of everyCell()) {
			const slots = attachmentVariants({ layout, size });
			for (const slot of SLOTS) {
				const cls = slots[slot]();
				const hasW = /(?:^|\s)w-\d/.test(cls);
				const hasH = /(?:^|\s)h-\d/.test(cls);
				expect(`${slot}:${hasW && hasH}`).toBe(`${slot}:false`);
			}
		}
	});

	test("no slot aligns itself", () => {
		for (const { layout, size } of everyCell()) {
			const slots = attachmentVariants({ layout, size });
			for (const slot of SLOTS) expect(slots[slot]()).not.toMatch(/(?:^|\s)self-/);
		}
	});
});

describe("layouts", () => {
	test("overflow-hidden is on the tile root only", () => {
		for (const { layout, size } of everyCell()) {
			const root = attachmentVariants({ layout, size }).root();
			expect(/\boverflow-hidden\b/.test(root)).toBe(layout === "tile");
		}
	});

	test("chip and card sit on a bordered card; the tile on muted", () => {
		for (const layout of ["chip", "card"] as const) {
			const root = attachmentVariants({ layout }).root();
			expect(root).toContain("bg-card");
			expect(root).toContain("border-border");
		}
		expect(attachmentVariants({ layout: "tile" }).root()).toContain("bg-muted");
	});

	test("radii come off the generic scale", () => {
		expect(attachmentVariants({ layout: "chip" }).root()).toContain("rounded-xl");
		expect(attachmentVariants({ layout: "tile" }).root()).toContain("rounded-xl");
		expect(attachmentVariants({ layout: "card" }).root()).toContain("rounded-lg");
	});

	test("the card is full width", () => {
		expect(attachmentVariants({ layout: "card" }).root()).toMatch(/\bw-full\b/);
	});
});

describe("states", () => {
	test("error paints a destructive edge and a destructive meta", () => {
		for (const { layout, size } of everyCell()) {
			const slots = attachmentVariants({ layout, size, status: "error" });
			expect(slots.root()).toContain("border-destructive");
			expect(slots.root()).not.toMatch(/\bborder-border\b/);
			expect(slots.meta()).toContain("text-destructive");
			expect(slots.meta()).not.toContain("text-muted-foreground");
		}
	});

	test("disabled dims the whole root", () => {
		expect(attachmentVariants({ isDisabled: true }).root()).toContain("opacity-50");
		expect(attachmentVariants({ isDisabled: false }).root()).not.toContain("opacity-50");
	});

	test("the dim veil is the overlay token", () => {
		expect(attachmentVariants({ layout: "tile" }).dim()).toContain("bg-overlay");
	});
});

describe("tokens", () => {
	test("every colour a slot paints exists in both themes", () => {
		const cells = everyCell().flatMap((cell) =>
			ATTACHMENT_STATUS_TYPES.flatMap((status) =>
				ATTACHMENT_KINDS.flatMap((kind) => [false, true].map((isDisabled) => ({ ...cell, isDisabled, kind, status })))
			)
		);
		const painted = new Set<string>();
		for (const cell of cells) {
			const slots = attachmentVariants(cell);
			for (const slot of SLOTS) {
				for (const token of colorTokens(slots[slot]())) painted.add(`${slot}:${token}`);
			}
		}
		for (const entry of painted) {
			const token = entry.slice(entry.indexOf(":") + 1);
			expect(`${entry}:${LIGHT.has(token)}:${DARK.has(token)}`).toBe(`${entry}:true:true`);
		}
	});

	test("every kind's tone is a surface and its own foreground, in both themes", () => {
		for (const kind of ATTACHMENT_KINDS) {
			const { surface, foreground } = ATTACHMENT_KIND_TONE[kind];
			expect(foreground).toBe(`${surface}-foreground`);
			for (const token of [surface, foreground]) {
				expect(LIGHT.has(token)).toBe(true);
				expect(DARK.has(token)).toBe(true);
			}
		}
	});

	test("the fallback is painted in the kind's tone", () => {
		for (const kind of ATTACHMENT_KINDS) {
			expect(attachmentVariants({ kind }).previewFallback()).toContain(`bg-${ATTACHMENT_KIND_TONE[kind].surface}`);
		}
	});

	test("no two kinds share a tone", () => {
		const surfaces = ATTACHMENT_KINDS.map((kind) => ATTACHMENT_KIND_TONE[kind].surface);
		expect(new Set(surfaces).size).toBe(surfaces.length);
	});

	test("the action glyph's token exists in both themes", () => {
		for (const layout of ATTACHMENT_LAYOUTS) {
			const token = ATTACHMENT_ACTION_FOREGROUND_TOKEN[layout];
			expect(LIGHT.has(token)).toBe(true);
			expect(DARK.has(token)).toBe(true);
		}
	});
});

describe("actions", () => {
	test("the action's edge matches its class, and slop grows it to 44pt", () => {
		for (const layout of ATTACHMENT_LAYOUTS) {
			expect(edgeOf(attachmentVariants({ layout }).action())).toBe(ATTACHMENT_ACTION_EDGE);
		}
		expect(ATTACHMENT_ACTION_EDGE + 2 * ATTACHMENT_ACTION_HIT_SLOP).toBeGreaterThanOrEqual(44);
	});

	test("the tile's actions float top-end", () => {
		const actions = attachmentVariants({ layout: "tile" }).actions();
		expect(actions).toContain("absolute");
		expect(actions).toMatch(/\btop-/);
		expect(actions).toMatch(/\bright-|\bend-/);
	});
});

describe("resolveAttachmentParts", () => {
	test("progress shows only while uploading; retry only in error with a handler", () => {
		expect(resolveAttachmentParts({ hasRemove: true, hasRetry: true, status: { type: "uploading" } })).toEqual({
			showsProgress: true,
			showsRemove: true,
			showsRetry: false,
		});
		expect(
			resolveAttachmentParts({ hasRemove: false, hasRetry: true, status: { message: "x", type: "error" } })
		).toEqual({ showsProgress: false, showsRemove: false, showsRetry: true });
		expect(
			resolveAttachmentParts({ hasRemove: true, hasRetry: false, status: { message: "x", type: "error" } })
		).toEqual({ showsProgress: false, showsRemove: true, showsRetry: false });
		expect(resolveAttachmentParts({ hasRemove: false, hasRetry: false, status: { type: "done" } })).toEqual({
			showsProgress: false,
			showsRemove: false,
			showsRetry: false,
		});
	});
});

describe("motion", () => {
	test("the error nudge is small, symmetric and brief", () => {
		expect(ATTACHMENT_ERROR_NUDGE.distance).toBeGreaterThan(0);
		expect(ATTACHMENT_ERROR_NUDGE.distance).toBeLessThanOrEqual(6);
		expect(ATTACHMENT_ERROR_NUDGE.stepMs * 3).toBeLessThanOrEqual(300);
	});
});

describe("badge", () => {
	test("the video badge is a frosted disc the action's size", () => {
		const badge = attachmentVariants({}).badge();
		expect(badge).toContain("bg-card/85");
		expect(edgeOf(badge)).toBe(ATTACHMENT_ACTION_EDGE);
	});
});

describe("group", () => {
	test("each gap is a gap, and md is the wider", () => {
		const sm = attachmentVariants({ gap: "sm" }).group();
		const md = attachmentVariants({ gap: "md" }).group();
		const step = (cls: string) => Number(cls.match(/\bgap-([\d.]+)\b/)?.[1]);
		expect(step(md)).toBeGreaterThan(step(sm));
		expect(sm).toContain("flex-row");
	});
});
