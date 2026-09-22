import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_DOCS_SITE_URL } from "@/design-system/preset-url";
import { PRIVACY_POLICY_PATH, PRIVACY_POLICY_URL } from "./privacy-url";

/**
 * The policy lives on the documentation site and the app only links to it, so
 * the path has two owners — `privacyRoute` in `apps/web/src/lib/shared.ts` and
 * the constant here. Read as text, the way `preset-url.test.ts` reads the site
 * origin: a route renamed on one side is a store-review link that 404s, and App
 * Review is the first place anyone would notice.
 */
const WEB = join(import.meta.dirname, "..", "..", "..", "web");
const SHARED = readFileSync(join(WEB, "src", "lib", "shared.ts"), "utf-8");

describe("the privacy policy link", () => {
	test("names the same path as the documentation site", () => {
		expect(/\bprivacyRoute = "([^"]+)"/.exec(SHARED)?.[1]).toBe(PRIVACY_POLICY_PATH);
	});

	test("points at a route the site actually has", () => {
		expect(existsSync(join(WEB, "src", "routes", `${PRIVACY_POLICY_PATH.slice(1)}.tsx`))).toBeTrue();
	});

	// The published policy, never a local dev server: this is the page the store
	// listing names, and a dev build opening a localhost 404 would read as broken.
	test("is the production page", () => {
		const url = new URL(PRIVACY_POLICY_URL);

		expect(url.origin).toBe(DEFAULT_DOCS_SITE_URL);
		expect(url.pathname).toBe(PRIVACY_POLICY_PATH);
	});
});
