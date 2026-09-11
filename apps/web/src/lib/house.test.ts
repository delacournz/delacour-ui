import { describe, expect, test } from "bun:test";
import { HOUSE_MONO_FONT, houseFonts, isHouseFont } from "./house";

describe("houseFonts", () => {
	test("is Inter, Outfit and Geist Mono", () => {
		expect(houseFonts().map((font) => font.family)).toEqual(["Inter", "Outfit", "Geist Mono"]);
	});

	test("the code face is a real catalogue entry", () => {
		expect(houseFonts().some((font) => font.name === HOUSE_MONO_FONT && font.type === "mono")).toBe(true);
	});

	test("knows its own", () => {
		const [inter] = houseFonts();
		if (!inter) throw new Error("no house fonts");

		expect(isHouseFont(inter)).toBe(true);
		expect(isHouseFont({ ...inter, name: "lora", family: "Lora" })).toBe(false);
	});
});
