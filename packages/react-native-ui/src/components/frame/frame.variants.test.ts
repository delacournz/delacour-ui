import { describe, expect, test } from "bun:test";
import { createElement, Fragment, type ReactNode } from "react";
import { LIST_GROUP_SIZES } from "../list-group/list-group.variants";
import { SURFACE_FILLED_VARIANTS } from "../surface/surface.variants";
import {
	FRAME_FOOTER_ALIGNS,
	FRAME_PLANES,
	FRAME_SIZES,
	FRAME_VARIANTS,
	frameVariants,
	resolveFrameDivider,
	resolveFrameFooterJustify,
	resolveFrameRootVariant,
	resolveFrameTraySize,
	resolveFrameTrayVariant,
	splitFrameHeaderChildren,
} from "./frame.variants";

const SLOTS = ["root", "header", "headerText", "title", "description", "action", "section", "sectionTitle", "footer"];

/** Every slot the variant function can produce, one call per combination. */
function everyCombination(): ReturnType<typeof frameVariants>[] {
	return FRAME_VARIANTS.flatMap((variant) =>
		FRAME_SIZES.flatMap((size) =>
			FRAME_PLANES.flatMap((plane) =>
				FRAME_FOOTER_ALIGNS.map((align) => frameVariants({ align, plane, size, variant }))
			)
		)
	);
}

describe("frame tuples", () => {
	test("FRAME_VARIANTS is exactly default, plain, inset", () => {
		expect(FRAME_VARIANTS).toEqual(["default", "plain", "inset"]);
	});

	test("FRAME_SIZES is exactly sm, md, lg", () => {
		expect(FRAME_SIZES).toEqual(["sm", "md", "lg"]);
	});

	test("every slot named in the design exists", () => {
		const slots = frameVariants();
		for (const slot of SLOTS) {
			expect(typeof slots[slot as keyof typeof slots]).toBe("function");
		}
	});
});

describe("resolveFrameRootVariant", () => {
	test("a default frame on the page is the secondary fill", () => {
		expect(resolveFrameRootVariant("default", null)).toBe("secondary");
	});

	test("an inset frame on the page is the secondary fill", () => {
		expect(resolveFrameRootVariant("inset", null)).toBe("secondary");
	});

	test("an inset frame on a card is the secondary fill", () => {
		expect(resolveFrameRootVariant("inset", "default")).toBe("secondary");
	});

	test("a default frame on a secondary plane steps to tertiary", () => {
		expect(resolveFrameRootVariant("default", "secondary")).toBe("tertiary");
	});

	test("a plain frame paints nothing, wherever it sits", () => {
		expect(resolveFrameRootVariant("plain", null)).toBe("transparent");
		for (const plane of SURFACE_FILLED_VARIANTS) {
			expect(resolveFrameRootVariant("plain", plane)).toBe("transparent");
		}
	});

	test("a filled shell never matches the plane it sits on", () => {
		for (const variant of ["default", "inset"] as const) {
			for (const plane of SURFACE_FILLED_VARIANTS) {
				expect(resolveFrameRootVariant(variant, plane)).not.toBe(plane);
			}
		}
	});
});

describe("resolveFrameTrayVariant", () => {
	test("the tray is the card fill on every variant", () => {
		for (const variant of FRAME_VARIANTS) {
			expect(resolveFrameTrayVariant(variant)).toBe("default");
		}
	});
});

describe("resolveFrameTraySize", () => {
	test("the tray takes the same ListGroup size", () => {
		for (const size of FRAME_SIZES) {
			expect(resolveFrameTraySize(size)).toBe(size);
			expect(LIST_GROUP_SIZES).toContain(resolveFrameTraySize(size));
		}
	});
});

describe("resolveFrameFooterJustify", () => {
	test("start, end and between name a justify class and leave children alone", () => {
		expect(resolveFrameFooterJustify("start")).toEqual({ justify: "justify-start", item: "" });
		expect(resolveFrameFooterJustify("end")).toEqual({ justify: "justify-end", item: "" });
		expect(resolveFrameFooterJustify("between")).toEqual({ justify: "justify-between", item: "" });
	});

	test("stretch names no justify class and grows every child", () => {
		expect(resolveFrameFooterJustify("stretch")).toEqual({ justify: "", item: "flex-1" });
	});

	test("the footer slot carries the justify class for its align", () => {
		for (const align of FRAME_FOOTER_ALIGNS) {
			const { justify } = resolveFrameFooterJustify(align);
			const footer = frameVariants({ align }).footer();
			if (justify) expect(footer).toContain(justify);
			else expect(footer).not.toMatch(/justify-/);
		}
	});
});

describe("resolveFrameDivider", () => {
	test("two rows are divided by an inset rule", () => {
		expect(resolveFrameDivider(false, false)).toBe("inset");
	});

	test("a section on either side takes a full-bleed rule", () => {
		expect(resolveFrameDivider(true, false)).toBe("full");
		expect(resolveFrameDivider(false, true)).toBe("full");
		expect(resolveFrameDivider(true, true)).toBe("full");
	});
});

describe("frameVariants root slot", () => {
	test("carries no text colour on any variant (rule 1)", () => {
		for (const variant of FRAME_VARIANTS) {
			expect(frameVariants({ variant }).root()).not.toMatch(/(?:^|\s)text-/);
		}
	});

	test("plain paints no fill and has no padding", () => {
		const root = frameVariants({ variant: "plain" }).root();
		expect(root).not.toMatch(/(?:^|\s)bg-/);
		expect(root).not.toMatch(/(?:^|\s)p-/);
	});

	test("default is a 4pt lip, inset an 8pt band", () => {
		expect(frameVariants({ variant: "default" }).root()).toMatch(/(?:^|\s)p-1(?:\s|$)/);
		expect(frameVariants({ variant: "inset" }).root()).toMatch(/(?:^|\s)p-2(?:\s|$)/);
	});

	test("the filled shells take the card corner", () => {
		for (const variant of ["default", "inset"] as const) {
			const root = frameVariants({ variant }).root();
			expect(root).toContain("rounded-lg");
			expect(root).toContain("border-continuous");
		}
	});

	test("the resolved fill wins over the variant's default fill", () => {
		const root = frameVariants({ fill: "tertiary", variant: "default" }).root();
		expect(root).toContain("bg-tertiary");
		expect(root).not.toContain("bg-secondary");
	});
});

describe("frameVariants", () => {
	test("no combination emits a shadow class", () => {
		for (const slots of everyCombination()) {
			for (const slot of SLOTS) {
				expect(slots[slot as keyof typeof slots]()).not.toMatch(/shadow/);
			}
		}
	});

	test("layout slots carry no text colour (rule 1)", () => {
		for (const slots of everyCombination()) {
			for (const slot of ["root", "header", "headerText", "action", "section", "footer"] as const) {
				expect(slots[slot]()).not.toMatch(/(?:^|\s)text-(?!xs|sm|base|lg)/);
			}
		}
	});

	test("the title steps sm, base, lg with the size", () => {
		expect(frameVariants({ size: "sm" }).title()).toContain("text-sm");
		expect(frameVariants({ size: "md" }).title()).toContain("text-base");
		expect(frameVariants({ size: "lg" }).title()).toContain("text-lg");
	});

	test("the title reads its plane's foreground token", () => {
		expect(frameVariants({ plane: "secondary" }).title()).toContain("text-secondary-foreground");
		expect(frameVariants({ plane: "tertiary" }).title()).toContain("text-tertiary-foreground");
		expect(frameVariants({ plane: "default" }).title()).toContain("text-card-foreground");
		expect(frameVariants({ plane: "none" }).title()).toContain("text-foreground");
	});

	test("the description and section caption are muted", () => {
		expect(frameVariants().description()).toContain("text-muted-foreground");
		expect(frameVariants().sectionTitle()).toContain("text-muted-foreground");
	});

	test("the section caption lines up with the rows' own inset", () => {
		expect(frameVariants({ size: "sm" }).sectionTitle()).toContain("px-3");
		expect(frameVariants({ size: "md" }).sectionTitle()).toContain("px-4");
		expect(frameVariants({ size: "lg" }).sectionTitle()).toContain("px-5");
	});

	test("the action reserves a 44pt hit target", () => {
		expect(frameVariants().action()).toContain("min-h-11");
	});

	test("header and footer padding follow the variant", () => {
		expect(frameVariants({ variant: "default" }).header()).toContain("px-3");
		expect(frameVariants({ variant: "plain" }).header()).not.toMatch(/(?:^|\s)px-/);
		expect(frameVariants({ variant: "inset" }).header()).toContain("px-2");
		expect(frameVariants({ variant: "default" }).footer()).toContain("py-2");
		expect(frameVariants({ variant: "plain" }).footer()).toContain("pt-3");
		expect(frameVariants({ variant: "inset" }).footer()).toContain("pt-3");
	});
});

describe("splitFrameHeaderChildren", () => {
	function Action(): null {
		return null;
	}
	const isAction = (node: ReactNode) => typeof node === "object" && node !== null && "type" in node && node.type === Action;

	test("lifts actions out wherever they are written, keeping text order", () => {
		const children = [
			createElement(Action, { key: "a" }),
			createElement(Fragment, { key: "t" }, "Title"),
			"Description",
		];
		const { text, actions } = splitFrameHeaderChildren(children, isAction);
		expect(actions).toHaveLength(1);
		expect(text).toHaveLength(2);
		expect(text[1]).toBe("Description");
	});

	test("drops the nulls and booleans a conditional child leaves", () => {
		const { text, actions } = splitFrameHeaderChildren([null, false, "Title", undefined], isAction);
		expect(text).toEqual(["Title"]);
		expect(actions).toEqual([]);
	});
});
