import { describe, expect, test } from "bun:test";
import {
	areaToHsv,
	contrastForeground,
	describeHue,
	formatColor,
	hexToRgba,
	hslToHsv,
	hsvToArea,
	hsvToHsl,
	hsvToRgb,
	isSameColor,
	normalizeHsva,
	parseColor,
	preserveHue,
	relativeLuminance,
	resolveIncomingColor,
	rgbaToHex,
	rgbToHsv,
	stepHsva,
	trackToValue,
	valueToTrack,
	withAlpha,
} from "./color-picker.color";
import type { Hsva } from "./color-picker.types";

const RED: Hsva = { h: 0, s: 1, v: 1, a: 1 };

describe("hexToRgba", () => {
	test("reads the four hex lengths", () => {
		expect(hexToRgba("#f00")).toEqual({ r: 255, g: 0, b: 0, a: 1 });
		expect(hexToRgba("#f008")?.a).toBeCloseTo(0x88 / 255, 5);
		expect(hexToRgba("#ff0000")).toEqual({ r: 255, g: 0, b: 0, a: 1 });
		expect(hexToRgba("#ff000080")?.a).toBeCloseTo(128 / 255, 5);
	});

	test("is case-insensitive", () => {
		expect(hexToRgba("#FF8000")).toEqual({ r: 255, g: 128, b: 0, a: 1 });
	});

	test("refuses a missing # and every other length", () => {
		expect(hexToRgba("ff0000")).toBeNull();
		expect(hexToRgba("#ff000")).toBeNull();
		expect(hexToRgba("#ff00000")).toBeNull();
		expect(hexToRgba("#ggg")).toBeNull();
	});
});

describe("rgbaToHex", () => {
	test("omits the alpha pair when opaque", () => {
		expect(rgbaToHex({ r: 255, g: 0, b: 0, a: 1 })).toBe("#ff0000");
	});

	test("appends it when translucent, and round-trips 80", () => {
		const rgba = hexToRgba("#ff000080");
		if (!rgba) throw new Error("unparsed");
		expect(rgbaToHex(rgba)).toBe("#ff000080");
	});

	test("rounds and clamps channels", () => {
		expect(rgbaToHex({ r: 300, g: -4, b: 127.6, a: 1 })).toBe("#ff0080");
	});
});

describe("rgbToHsv / hsvToRgb", () => {
	test("primaries, white, black and grey", () => {
		expect(rgbToHsv({ r: 255, g: 0, b: 0, a: 1 })).toEqual(RED);
		expect(rgbToHsv({ r: 0, g: 255, b: 0, a: 1 }).h).toBe(120);
		expect(rgbToHsv({ r: 0, g: 0, b: 255, a: 1 }).h).toBe(240);
		expect(rgbToHsv({ r: 255, g: 255, b: 255, a: 1 })).toEqual({ h: 0, s: 0, v: 1, a: 1 });
		expect(rgbToHsv({ r: 0, g: 0, b: 0, a: 1 })).toEqual({ h: 0, s: 0, v: 0, a: 1 });
		const grey = rgbToHsv({ r: 128, g: 128, b: 128, a: 1 });
		expect(grey.s).toBe(0);
		expect(grey.v).toBeCloseTo(128 / 255, 5);
	});

	test("hsvToRgb reads the primaries back", () => {
		expect(hsvToRgb(RED)).toEqual({ r: 255, g: 0, b: 0, a: 1 });
		expect(hsvToRgb({ h: 120, s: 1, v: 1, a: 0.5 })).toEqual({ r: 0, g: 255, b: 0, a: 0.5 });
		expect(hsvToRgb({ h: 240, s: 1, v: 1, a: 1 })).toEqual({ r: 0, g: 0, b: 255, a: 1 });
	});

	test("hue wraps 360 to 0", () => {
		expect(hsvToRgb({ h: 360, s: 1, v: 1, a: 1 })).toEqual(hsvToRgb(RED));
	});

	test("every channel round-trips within one unit on a 17-step grid", () => {
		const steps = Array.from({ length: 17 }, (_, index) => Math.min(255, index * 16));
		for (const r of steps) {
			for (const g of steps) {
				for (const b of steps) {
					const back = hsvToRgb(rgbToHsv({ r, g, b, a: 1 }));
					expect(Math.abs(back.r - r)).toBeLessThanOrEqual(1);
					expect(Math.abs(back.g - g)).toBeLessThanOrEqual(1);
					expect(Math.abs(back.b - b)).toBeLessThanOrEqual(1);
				}
			}
		}
	});
});

describe("hsvToHsl / hslToHsv", () => {
	test("#ff8000 is hsl(30, 100%, 50%)", () => {
		const rgba = hexToRgba("#ff8000");
		if (!rgba) throw new Error("unparsed");
		const hsl = hsvToHsl(rgbToHsv(rgba));
		expect(Math.round(hsl.h)).toBe(30);
		expect(hsl.s).toBeCloseTo(1, 5);
		expect(hsl.l).toBeCloseTo(0.5, 5);
	});

	test("zero saturation and zero brightness", () => {
		expect(hsvToHsl({ h: 200, s: 0, v: 0.5, a: 1 })).toEqual({ h: 200, s: 0, l: 0.5, a: 1 });
		expect(hsvToHsl({ h: 200, s: 1, v: 0, a: 1 })).toEqual({ h: 200, s: 0, l: 0, a: 1 });
		expect(hslToHsv({ h: 200, s: 0, l: 0, a: 1 })).toEqual({ h: 200, s: 0, v: 0, a: 1 });
		expect(hslToHsv({ h: 200, s: 1, l: 1, a: 1 })).toEqual({ h: 200, s: 0, v: 1, a: 1 });
	});

	test("round-trips", () => {
		const hsv: Hsva = { h: 210, s: 0.6, v: 0.8, a: 0.4 };
		const back = hslToHsv(hsvToHsl(hsv));
		expect(back.h).toBe(210);
		expect(back.s).toBeCloseTo(0.6, 5);
		expect(back.v).toBeCloseTo(0.8, 5);
		expect(back.a).toBe(0.4);
	});
});

describe("parseColor", () => {
	test("every hex form", () => {
		expect(parseColor("#f00")).toEqual(RED);
		expect(parseColor("#ff0000")).toEqual(RED);
		expect(parseColor("#ff000080")?.a).toBeCloseTo(128 / 255, 5);
		expect(parseColor("#f008")?.a).toBeCloseTo(0x88 / 255, 5);
	});

	test("rgb() and rgba(), commas or spaces", () => {
		expect(parseColor("rgb(255 0 0)")).toEqual(RED);
		expect(parseColor("rgb(255, 0, 0)")).toEqual(RED);
		expect(parseColor("rgba(255,0,0,.5)")).toEqual({ ...RED, a: 0.5 });
		expect(parseColor("rgb(255 0 0 / 50%)")).toEqual({ ...RED, a: 0.5 });
	});

	test("hsl() and hsla()", () => {
		const green = parseColor("hsl(120, 100%, 50%)");
		expect(green?.h).toBe(120);
		expect(green?.s).toBeCloseTo(1, 5);
		expect(green?.v).toBeCloseTo(1, 5);
		expect(parseColor("hsla(120, 100%, 50%, 0.25)")?.a).toBe(0.25);
		expect(parseColor("hsl(120deg 100% 50%)")?.h).toBe(120);
	});

	test("ignores whitespace and case", () => {
		expect(parseColor("  RGB( 255 , 0 , 0 ) ")).toEqual(RED);
		expect(parseColor(" #FF0000 ")).toEqual(RED);
	});

	test("clamps out-of-range channels", () => {
		expect(parseColor("rgb(300, 0, 0)")).toEqual(RED);
		expect(parseColor("rgba(255, 0, 0, 4)")?.a).toBe(1);
		expect(parseColor("hsl(480, 100%, 50%)")?.h).toBe(120);
	});

	test("garbage is null", () => {
		for (const bad of ["", "red", "#", "rgb(1, 2)", "hsl(a, b, c)", "rgb(1, 2, 3, 4, 5)", "#12345", "f00"]) {
			expect(parseColor(bad)).toBeNull();
		}
	});
});

describe("formatColor", () => {
	test("hex omits alpha at 1 and appends it below", () => {
		expect(formatColor(RED, "hex")).toBe("#ff0000");
		expect(formatColor({ ...RED, a: 0.5 }, "hex")).toBe("#ff000080");
	});

	test("rgb and rgba, alpha to two places", () => {
		expect(formatColor(RED, "rgb")).toBe("rgb(255, 0, 0)");
		expect(formatColor({ ...RED, a: 0.333 }, "rgb")).toBe("rgba(255, 0, 0, 0.33)");
	});

	test("hsl and hsla", () => {
		expect(formatColor({ h: 120, s: 1, v: 1, a: 1 }, "hsl")).toBe("hsl(120, 100%, 50%)");
		expect(formatColor({ h: 120, s: 1, v: 1, a: 0.5 }, "hsl")).toBe("hsla(120, 100%, 50%, 0.5)");
	});
});

describe("areaToHsv / hsvToArea", () => {
	test("the corners", () => {
		expect(areaToHsv(0, 0, 200, 100)).toEqual({ s: 0, v: 1 });
		expect(areaToHsv(200, 0, 200, 100)).toEqual({ s: 1, v: 1 });
		expect(areaToHsv(0, 100, 200, 100)).toEqual({ s: 0, v: 0 });
	});

	test("clamps a touch outside the box", () => {
		expect(areaToHsv(-40, 300, 200, 100)).toEqual({ s: 0, v: 0 });
		expect(areaToHsv(400, -10, 200, 100)).toEqual({ s: 1, v: 1 });
	});

	test("an unmeasured box is not NaN", () => {
		expect(areaToHsv(10, 10, 0, 0)).toEqual({ s: 0, v: 1 });
	});

	test("hsvToArea is the inverse within a pixel", () => {
		for (const [x, y] of [
			[13, 77],
			[150, 2],
			[199, 99],
		] as const) {
			const { s, v } = areaToHsv(x, y, 200, 100);
			const back = hsvToArea(s, v, 200, 100);
			expect(Math.abs(back.x - x)).toBeLessThanOrEqual(1);
			expect(Math.abs(back.y - y)).toBeLessThanOrEqual(1);
		}
	});
});

describe("trackToValue / valueToTrack", () => {
	test("maps and clamps", () => {
		expect(trackToValue(50, 100, 360)).toBe(180);
		expect(trackToValue(-5, 100, 360)).toBe(0);
		expect(trackToValue(150, 100, 1)).toBe(1);
		expect(valueToTrack(180, 100, 360)).toBe(50);
		expect(valueToTrack(500, 100, 360)).toBe(100);
	});

	test("zero width returns 0, never NaN", () => {
		expect(trackToValue(10, 0, 360)).toBe(0);
		expect(valueToTrack(10, 0, 360)).toBe(0);
	});
});

describe("stepHsva", () => {
	test("saturation, brightness and alpha clamp", () => {
		expect(stepHsva({ h: 10, s: 0.98, v: 0.5, a: 1 }, "saturation", 1, 0.05).s).toBe(1);
		expect(stepHsva({ h: 10, s: 0.5, v: 0.02, a: 1 }, "brightness", -1, 0.05).v).toBe(0);
		expect(stepHsva({ h: 10, s: 0.5, v: 0.5, a: 1 }, "alpha", 1, 0.05).a).toBe(1);
		expect(stepHsva({ h: 10, s: 0.5, v: 0.5, a: 0.5 }, "alpha", -1, 0.1).a).toBeCloseTo(0.4, 5);
	});

	test("hue wraps both ways", () => {
		expect(stepHsva({ h: 358, s: 1, v: 1, a: 1 }, "hue", 1, 5).h).toBe(3);
		expect(stepHsva({ h: 2, s: 1, v: 1, a: 1 }, "hue", -1, 5).h).toBe(357);
	});
});

describe("preserveHue", () => {
	test("a grey keeps the previous hue", () => {
		expect(preserveHue({ h: 0, s: 0, v: 0.5, a: 1 }, { h: 210, s: 0.6, v: 0.8, a: 1 })).toEqual({
			h: 210,
			s: 0,
			v: 0.5,
			a: 1,
		});
	});

	test("black keeps the previous hue and saturation", () => {
		expect(preserveHue({ h: 0, s: 0, v: 0, a: 1 }, { h: 210, s: 0.6, v: 0.8, a: 1 })).toEqual({
			h: 210,
			s: 0.6,
			v: 0,
			a: 1,
		});
	});

	test("a chromatic colour passes through", () => {
		const next: Hsva = { h: 40, s: 0.5, v: 0.5, a: 1 };
		expect(preserveHue(next, RED)).toEqual(next);
	});
});

describe("isSameColor", () => {
	test("an echoed value is the same colour, whatever hue the picker remembers", () => {
		const remembered: Hsva = { h: 210, s: 0, v: 0.5, a: 1 };
		expect(isSameColor(formatColor(remembered, "hex"), remembered, "hex")).toBe(true);
		expect(isSameColor(formatColor(remembered, "rgb"), remembered, "rgb")).toBe(true);
		expect(isSameColor(formatColor(remembered, "hsl"), remembered, "hsl")).toBe(true);
	});

	test("a black echo keeps the hue at v=0", () => {
		const remembered: Hsva = { h: 210, s: 0.7, v: 0, a: 1 };
		expect(isSameColor("#000000", remembered, "hex")).toBe(true);
	});

	test("a lossy hsl echo is still the same colour", () => {
		const live: Hsva = { h: 207.4, s: 0.431, v: 0.613, a: 1 };
		expect(isSameColor(formatColor(live, "hsl"), live, "hsl")).toBe(true);
	});

	test("a different colour, or garbage, is not", () => {
		expect(isSameColor("#00ff00", RED, "hex")).toBe(false);
		expect(isSameColor("nope", RED, "hex")).toBe(false);
	});
});

describe("relativeLuminance / contrastForeground", () => {
	test("known values", () => {
		expect(relativeLuminance({ r: 255, g: 255, b: 255, a: 1 })).toBeCloseTo(1, 5);
		expect(relativeLuminance({ r: 0, g: 0, b: 0, a: 1 })).toBe(0);
		expect(relativeLuminance({ r: 255, g: 0, b: 0, a: 1 })).toBeCloseTo(0.2126, 4);
	});

	test("black on light, white on dark", () => {
		expect(contrastForeground({ r: 255, g: 255, b: 0, a: 1 })).toBe("black");
		expect(contrastForeground({ r: 0, g: 0, b: 128, a: 1 })).toBe("white");
	});
});

describe("describeHue", () => {
	test("names the wheel", () => {
		expect(describeHue(0)).toBe("red");
		expect(describeHue(30)).toBe("orange");
		expect(describeHue(60)).toBe("yellow");
		expect(describeHue(120)).toBe("green");
		expect(describeHue(180)).toBe("cyan");
		expect(describeHue(240)).toBe("blue");
		expect(describeHue(300)).toBe("magenta");
		expect(describeHue(359)).toBe("red");
	});
});

describe("withAlpha", () => {
	test("keeps the RGB and swaps the alpha — never the keyword transparent", () => {
		expect(withAlpha({ r: 10, g: 20, b: 30, a: 1 }, 0)).toBe("rgba(10, 20, 30, 0)");
		expect(withAlpha({ r: 10, g: 20, b: 30, a: 0.2 }, 1)).toBe("rgba(10, 20, 30, 1)");
	});
});

describe("resolveIncomingColor", () => {
	const red: Hsva = { h: 0, s: 1, v: 1, a: 1 };
	const blue: Hsva = { h: 240, s: 0.5, v: 0.8, a: 1 };

	test("a value the picker already holds changes nothing", () => {
		expect(resolveIncomingColor("#ff0000", red, "hex", false)).toBeNull();
	});

	test("a new value re-derives the model", () => {
		expect(resolveIncomingColor("#00ff00", red, "hex", false)).toEqual({ h: 120, s: 1, v: 1, a: 1 });
	});

	test("unparseable text changes nothing", () => {
		expect(resolveIncomingColor("nope", red, "hex", false)).toBeNull();
	});

	test("a grey keeps the remembered hue, black keeps hue and saturation", () => {
		expect(resolveIncomingColor("#808080", blue, "hex", false)?.h).toBe(240);
		const black = resolveIncomingColor("#000000", blue, "hex", false);
		expect(black).toEqual({ h: 240, s: 0.5, v: 0, a: 1 });
	});

	test("without hasAlpha the alpha is pinned at one", () => {
		expect(resolveIncomingColor("#00ff0080", red, "hex", false)?.a).toBe(1);
		expect(resolveIncomingColor("#00ff0080", red, "hex", true)?.a).toBeCloseTo(128 / 255, 5);
	});
});

describe("normalizeHsva", () => {
	test("pins alpha without hasAlpha and clamps every channel", () => {
		expect(normalizeHsva({ h: 400, s: 2, v: -1, a: 0.5 }, false)).toEqual({ h: 40, s: 1, v: 0, a: 1 });
		expect(normalizeHsva({ h: -30, s: 0.5, v: 0.5, a: 0.5 }, true)).toEqual({ h: 330, s: 0.5, v: 0.5, a: 0.5 });
	});

	test("keeps a hue of exactly 360 as the track's right end", () => {
		expect(normalizeHsva({ h: 360, s: 1, v: 1, a: 1 }, false).h).toBe(360);
	});
});
