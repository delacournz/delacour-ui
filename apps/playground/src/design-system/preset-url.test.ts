import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_CONFIG } from "@delacour/design-system/config";
import { encodePreset } from "@delacour/design-system/preset";
import { DEFAULT_DOCS_SITE_URL, devOriginFrom, presetUrl, THEME_PRESET_PATH, WEB_DEV_PORT } from "./preset-url";

describe("presetUrl", () => {
	test("defaults to the documentation site's theme route", () => {
		expect(presetUrl(DEFAULT_CONFIG)).toStartWith(`${DEFAULT_DOCS_SITE_URL}${THEME_PRESET_PATH}?preset=`);
	});

	test("is a URL a browser will take", () => {
		const url = new URL(presetUrl(DEFAULT_CONFIG));

		expect(url.protocol).toBe("https:");
		expect(url.pathname).toBe(THEME_PRESET_PATH);
		expect(url.searchParams.get("preset")).toBe(encodePreset(DEFAULT_CONFIG));
	});

	test("takes any origin, including a local one", () => {
		const url = new URL(presetUrl(DEFAULT_CONFIG, "http://192.168.1.5:3000"));

		expect(url.origin).toBe("http://192.168.1.5:3000");
		expect(url.pathname).toBe(THEME_PRESET_PATH);
	});

	test("a trailing slash on the origin does not double up", () => {
		expect(presetUrl(DEFAULT_CONFIG, "http://localhost:3000/")).toContain("localhost:3000/theme?");
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
 * The whole reason this is not `localhost`.
 *
 * `bun ios` runs `expo run:ios --device`, and a phone cannot reach the laptop's
 * loopback; an Android emulator's `localhost` is the emulator. Metro already
 * reached the app on a host that works, so the link reuses it.
 */
describe("devOriginFrom", () => {
	const CASES: [string, string, string][] = [
		["a simulator", "localhost:8088", `http://localhost:${WEB_DEV_PORT}`],
		["loopback by address", "127.0.0.1:8088", `http://127.0.0.1:${WEB_DEV_PORT}`],
		["a device on Wi-Fi", "192.168.1.5:8088", `http://192.168.1.5:${WEB_DEV_PORT}`],
		["an Android emulator", "10.0.2.2:8088", `http://10.0.2.2:${WEB_DEV_PORT}`],
		["a host with no port", "192.168.1.5", `http://192.168.1.5:${WEB_DEV_PORT}`],
		["a manifest URL", "exp://192.168.1.5:8088", `http://192.168.1.5:${WEB_DEV_PORT}`],
		["a manifest URL with a path", "exp://192.168.1.5:8088/--/theme", `http://192.168.1.5:${WEB_DEV_PORT}`],
		["an http host", "http://192.168.1.5:8088", `http://192.168.1.5:${WEB_DEV_PORT}`],
		["a hostname", "chris-mbp.local:8088", `http://chris-mbp.local:${WEB_DEV_PORT}`],
	];

	for (const [label, hostUri, expected] of CASES) {
		test(`${label} → ${expected}`, () => {
			expect(devOriginFrom(hostUri)).toBe(expected);
		});
	}

	test("keeps the host and only swaps the port", () => {
		expect(devOriginFrom("192.168.1.5:8088", 4321)).toBe("http://192.168.1.5:4321");
	});

	test("nothing to derive from falls through to the caller's default", () => {
		for (const empty of [undefined, null, "", "://", "/"]) {
			expect(devOriginFrom(empty)).toBeNull();
		}
	});

	test("whatever it is handed, it produces a usable URL or null", () => {
		for (const hostUri of ["!!!", "a".repeat(500), "exp://", ":::", "%00"]) {
			const origin = devOriginFrom(hostUri);
			if (origin !== null) expect(() => new URL(origin)).not.toThrow();
		}
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
describe("the production origin", () => {
	test("matches the one apps/web serves itself from", () => {
		const shared = readFileSync(join(import.meta.dirname, "../../../web/src/lib/shared.ts"), "utf-8");
		const declared = shared.match(/export const siteUrl = "([^"]+)"/)?.[1];

		expect(declared).toBeDefined();
		expect(DEFAULT_DOCS_SITE_URL).toBe(declared as string);
	});
});

/**
 * The dev port has to be the one `apps/web` actually listens on. It is declared
 * in that app's Vite config and restated here, so this is what stops the two
 * drifting into a link that opens a dead port.
 */
describe("the dev port", () => {
	test("matches apps/web's vite config", () => {
		const config = readFileSync(join(import.meta.dirname, "../../../web/vite.config.ts"), "utf-8");
		const declared = config.match(/port:\s*(\d+)/)?.[1];

		expect(declared).toBeDefined();
		expect(WEB_DEV_PORT).toBe(Number(declared));
	});
});
