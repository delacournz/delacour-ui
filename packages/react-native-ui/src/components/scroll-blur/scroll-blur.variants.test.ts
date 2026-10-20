import { describe, expect, test } from "bun:test";
import { resolveBlurLayers, resolveBlurStack, resolveBlurWash, scrollBlurVariants } from "./scroll-blur.variants";

describe("resolveBlurLayers", () => {
	test("splits the band into equal strips ordered edge to inward, intensity falling linearly", () => {
		const strips = resolveBlurLayers({ size: 80, layers: 4, intensity: 40 });
		expect(strips.map((strip) => strip.height)).toEqual([20, 20, 20, 20]);
		expect(strips.map((strip) => strip.offset)).toEqual([0, 20, 40, 60]);
		expect(strips.map((strip) => strip.intensity)).toEqual([40, 30, 20, 10]);
	});

	test("the default eight strips step by a tenth of the band and an eighth of the intensity", () => {
		const strips = resolveBlurLayers({ size: 80, layers: 8, intensity: 56 });
		expect(strips).toHaveLength(8);
		expect(strips[0]?.intensity).toBe(56);
		expect(strips[7]?.intensity).toBe(7);
		expect(strips.map((strip) => strip.offset)).toEqual([0, 10, 20, 30, 40, 50, 60, 70]);
	});

	test("clamps the strip count to 1..16 and floors it", () => {
		expect(resolveBlurLayers({ size: 80, layers: 0, intensity: 40 })).toHaveLength(1);
		expect(resolveBlurLayers({ size: 80, layers: 99, intensity: 40 })).toHaveLength(16);
		expect(resolveBlurLayers({ size: 80, layers: 3.7, intensity: 40 })).toHaveLength(3);
	});

	test("clamps intensity to 0..100", () => {
		expect(resolveBlurLayers({ size: 80, layers: 4, intensity: 150 })[0]?.intensity).toBe(100);
		expect(resolveBlurLayers({ size: 80, layers: 4, intensity: -5 })[0]?.intensity).toBe(0);
	});

	test("draws nothing for a band with no depth", () => {
		expect(resolveBlurLayers({ size: 0, layers: 8, intensity: 56 })).toEqual([]);
		expect(resolveBlurLayers({ size: -10, layers: 8, intensity: 56 })).toEqual([]);
	});
});

describe("resolveBlurStack", () => {
	test("nests every view at the edge, each reaching as far inward as its strip ends", () => {
		const stack = resolveBlurStack(resolveBlurLayers({ size: 80, layers: 4, intensity: 40 }));
		expect(stack.map((view) => view.size)).toEqual([80, 60, 40, 20]);
	});

	test("each view adds an equal share, so a point's summed blur is its strip's intensity", () => {
		const strips = resolveBlurLayers({ size: 80, layers: 4, intensity: 40 });
		const stack = resolveBlurStack(strips);
		expect(stack.map((view) => view.intensity)).toEqual([10, 10, 10, 10]);
		for (const strip of strips) {
			const covering = stack.filter((view) => view.size > strip.offset);
			expect(covering.reduce((sum, view) => sum + view.intensity, 0)).toBe(strip.intensity);
		}
	});

	test("is empty for no strips", () => {
		expect(resolveBlurStack([])).toEqual([]);
	});
});

describe("resolveBlurWash", () => {
	test("passes a tint in range through", () => {
		expect(resolveBlurWash({ tint: 0.95 }).edgeAlpha).toBe(0.95);
	});

	test("clamps a tint to 0..1", () => {
		expect(resolveBlurWash({ tint: 1.4 }).edgeAlpha).toBe(1);
		expect(resolveBlurWash({ tint: -1 }).edgeAlpha).toBe(0);
	});
});

describe("scrollBlurVariants", () => {
	test("the root is a positioning context for its bands", () => {
		expect(scrollBlurVariants().root()).toContain("relative");
	});

	test("a band is absolute, clipped, and spans the cross axis", () => {
		expect(scrollBlurVariants({ orientation: "vertical" }).band()).toBe("absolute overflow-hidden inset-x-0");
		expect(scrollBlurVariants({ orientation: "horizontal" }).band()).toBe("absolute overflow-hidden inset-y-0");
	});

	test("a caller's className reaches the root", () => {
		expect(scrollBlurVariants().root({ className: "flex-1" })).toBe("relative flex-1");
	});
});
