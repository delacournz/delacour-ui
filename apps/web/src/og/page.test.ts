import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { previews } from "@/previews/manifest";
import { readPages } from "./content";
import { captures, pageHeroes } from "./heroes";
import { capturePath, cardCopy, heroOf, isFramed, MOMENTS, PRODUCT_HERO, proofOf } from "./page";

const WEB = join(import.meta.dir, "../..");
const REGENERATE = "run `bun run og-assets` in apps/web";

describe("heroOf", () => {
	test("is the first preview a page names", () => {
		expect(heroOf('# Button\n\n<Preview id="button/variants" />\n\n<Preview id="button/sizes" />')).toBe(
			"button/variants"
		);
	});

	test("is nothing on a page with no preview", () => {
		expect(heroOf("# Installation\n\nbun add it")).toBeUndefined();
	});
});

describe("cardCopy", () => {
	test("a page with a hero is titled for itself and described in its own words", () => {
		const page = { slugs: ["native", "components", "button"], title: "Button", description: "A pressable." };

		expect(cardCopy(page, true)).toEqual({ product: "ui", title: "Button", subtitle: "A pressable." });
	});

	test("a page with no hero keeps its product's line", () => {
		const page = { slugs: ["native", "cli", "add"], title: "add", description: "Copies a component." };

		expect(cardCopy(page, false)).toEqual({ product: "ui", title: "add", subtitle: undefined });
	});

	test("an engine's landing page is the product's own card", () => {
		const page = { slugs: ["charts"], title: "Overview", description: "A headless charting engine." };

		expect(cardCopy(page, true)).toEqual({ product: "charts", title: undefined, subtitle: undefined });
	});
});

describe("proofOf", () => {
	test("a stage capture carries its own proportions", () => {
		const entry = previews["button/variants"];

		expect(proofOf("button/variants", "data:x")).toEqual({
			kind: "stage",
			href: "data:x",
			width: entry.width,
			height: entry.height,
		});
	});

	test("a device capture carries the end of the screen its moment keeps", () => {
		expect(proofOf("toast/statuses", "data:x")).toEqual({ kind: "device", href: "data:x", anchor: "bottom" });
		expect(proofOf("screen/showcase", "data:x")).toEqual({ kind: "device", href: "data:x", anchor: "top" });
	});
});

describe("capturePath", () => {
	test("a still is the committed dark poster", () => {
		expect(capturePath("button/variants")).toBe("public/previews/button/variants/dark.png");
		expect(isFramed("screen/showcase")).toBe(false);
		expect(capturePath("screen/showcase")).toBe("public/previews/screen/showcase/dark.png");
	});

	test("a clip that opens closed is the frame cut from it", () => {
		expect(isFramed("dialog/confirm")).toBe(true);
		expect(capturePath("dialog/confirm")).toBe("src/og/frames/dialog/confirm.png");
	});
});

describe("the generated heroes", () => {
	test("name the hero of every docs page that has one, and no other page", async () => {
		const expected = Object.fromEntries(
			(await readPages()).flatMap((page) => (page.hero ? [[page.key, page.hero]] : []))
		);

		expect(pageHeroes, REGENERATE).toEqual(expected);
	});

	test("carry a capture for every hero and every product default", () => {
		const wanted = new Set([...Object.values(pageHeroes), ...Object.values(PRODUCT_HERO)]);

		expect(Object.keys(captures).sort(), REGENERATE).toEqual([...wanted].sort());
	});

	test("name a moment for every device hero", () => {
		const missing = Object.keys(captures).filter(
			(id) => previews[id as keyof typeof previews].frame === "device" && !MOMENTS[id as keyof typeof previews]
		);

		expect(missing).toEqual([]);
	});

	test("cut every frame from the clip that is committed now", () => {
		for (const [id, capture] of Object.entries(captures)) {
			const preview = id as keyof typeof previews;
			if (!isFramed(preview)) continue;

			expect(capture?.cut, `${id}: ${REGENERATE}`).toBe(previews[preview].sourceHash);
			expect(existsSync(join(WEB, capturePath(preview))), `${id}: ${REGENERATE}`).toBe(true);
		}
	});
});
