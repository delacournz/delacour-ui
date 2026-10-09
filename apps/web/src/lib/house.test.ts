import { describe, expect, test } from "bun:test";
import { HOUSE_MONO_FONT, houseFonts, isHouseFont } from "./house";

describe("houseFonts", () => {
	test("is JetBrains Mono for the body, the code and the headings", () => {
		expect(houseFonts().map((font) => font.family)).toEqual(["JetBrains Mono"]);
	});

	test("the code face is a real catalogue entry", () => {
		expect(houseFonts().some((font) => font.name === HOUSE_MONO_FONT && font.type === "mono")).toBe(true);
	});

	test("knows its own", () => {
		const [body] = houseFonts();
		if (!body) throw new Error("no house fonts");

		expect(isHouseFont(body)).toBe(true);
		expect(isHouseFont({ ...body, name: "lora", family: "Lora" })).toBe(false);
	});
});
