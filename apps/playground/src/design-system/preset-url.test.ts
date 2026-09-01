import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_CONFIG } from "@delacour/design-system/config";
import { encodePreset } from "@delacour/design-system/preset";
import { DEFAULT_DOCS_SITE_URL, presetUrl, THEME_PRESET_PATH } from "./preset-url";

describe("presetUrl", () => {
	test("points at the documentation site's theme route", () => {
		expect(presetUrl(DEFAULT_CONFIG)).toStartWith(`${DEFAULT_DOCS_SITE_URL}${THEME_PRESET_PATH}?preset=`);
	});

	test("is a URL a browser will take", () => {
		const url = new URL(presetUrl(DEFAULT_CONFIG));

		expect(url.protocol).toBe("https:");
		expect(url.pathname).toBe(THEME_PRESET_PATH);
		expect(url.searchParams.get("preset")).toBe(encodePreset(DEFAULT_CONFIG));
	});

	/**
	 * The codec's alphabet is base64url, so escaping is a no-op — and pinning
	 * that is the point. A codec that started emitting `+` or `/` would still
	 * encode fine here and arrive truncated on someone else's machine, which is
	 * a failure that only ever shows up in a bug report.
	 */
	test("needs no escaping, and the codec has to keep it that way", () => {
		const code = encodePreset({ ...DEFAULT_CONFIG, style: "rhea", baseColor: "stone", theme: "blue" });

		expect(encodeURIComponent(code)).toBe(code);
	});

	test("a different config gives a different link", () => {
		expect(presetUrl({ ...DEFAULT_CONFIG, style: "rhea" })).not.toBe(presetUrl(DEFAULT_CONFIG));
	});
});

/**
 * One origin, two owners.
 *
 * The docs site declares it for its Open Graph tags; this app declares it to
 * build a link. Neither can import the other, so the only thing standing between
 * them is this — read as source text, the way `tokens-page.test.ts` and
 * `app.css.test.ts` already read the files they pin.
 */
describe("the origin", () => {
	test("matches the one apps/web serves itself from", () => {
		const shared = readFileSync(join(import.meta.dirname, "../../../web/src/lib/shared.ts"), "utf-8");
		const declared = shared.match(/export const siteUrl = "([^"]+)"/)?.[1];

		expect(declared).toBeDefined();
		expect(DEFAULT_DOCS_SITE_URL).toBe(declared as string);
	});
});
