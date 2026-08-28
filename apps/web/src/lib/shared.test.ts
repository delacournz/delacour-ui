import { describe, expect, test } from "bun:test";
import { isFileHref } from "./shared";

/**
 * `isFileHref` decides whether a link leaves the router. Getting it wrong in
 * either direction is a visible bug: too eager and every docs link becomes a
 * full page reload, too shy and `/llms.txt` lands on the 404 page.
 */
describe("isFileHref", () => {
	test("matches the site's server-rendered files", () => {
		expect(isFileHref("/llms.txt")).toBe(true);
		expect(isFileHref("/llms-full.txt")).toBe(true);
		expect(isFileHref("/docs/native/components/button.md")).toBe(true);
		expect(isFileHref("/favicon.ico")).toBe(true);
	});

	test("ignores a query string or a fragment when reading the extension", () => {
		expect(isFileHref("/llms.txt?raw=1")).toBe(true);
		expect(isFileHref("/llms.txt#top")).toBe(true);
	});

	test("leaves docs pages to the router", () => {
		expect(isFileHref("/")).toBe(false);
		expect(isFileHref("/docs/native/getting-started/llms")).toBe(false);
		expect(isFileHref("/docs/native/getting-started/llms#copying-a-page")).toBe(false);
		expect(isFileHref("#copying-a-page")).toBe(false);
	});

	test("leaves external hrefs alone — fumadocs already opens those in a new tab", () => {
		expect(isFileHref("https://example.com/llms.txt")).toBe(false);
		expect(isFileHref("//example.com/llms.txt")).toBe(false);
		expect(isFileHref("mailto:someone@example.com")).toBe(false);
	});

	test("does not read a dotted directory as a file", () => {
		expect(isFileHref("/docs/v1.2/installation")).toBe(false);
	});
});
