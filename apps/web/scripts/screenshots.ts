#!/usr/bin/env bun
/**
 * Captures the pull request screenshot set from a running docs site.
 *
 *     bun run start                      # or bun run dev, in another shell
 *     bun run screenshots                # everything, into apps/web/screenshots/
 *     bun run screenshots -- --only 01   # one shot, by id prefix
 *     bun run screenshots -- --url http://localhost:5173
 *
 * The output is **not** committed here. It goes on an `assets/<branch>` branch
 * and is linked from the pull request body — see
 * [AGENTS.md](../AGENTS.md#pull-request-screenshots) for why, and for the rule
 * that a change to the site's visuals recaptures this set in the same push.
 *
 * Two things make a capture reproducible rather than a photograph of one
 * moment:
 *
 * - **Reduced motion is emulated**, which is the site's own accessibility path
 *   and not a hack. `app.css` collapses `.reveal` to `opacity: 1` under
 *   `prefers-reduced-motion: reduce`, so a full-page shot cannot catch a
 *   section mid-entrance and no scripted scroll is needed to trip the
 *   observers.
 * - **Fonts are awaited.** The house faces load as webfonts; screenshotting
 *   before `document.fonts.ready` photographs the fallback stack, and the
 *   difference is invisible until someone compares two runs.
 *
 * The theme is set the way a reader sets it — `localStorage.theme`, the key
 * next-themes reads under Fumadocs' `RootProvider` — and then asserted on
 * `<html>`. A wrong key would otherwise shoot the dark theme twice and label
 * one of them light.
 */

import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Page } from "playwright";

/** The pill nav collapses below `lg`; 1440 is wide enough to hold it open. */
const DESKTOP = { width: 1440, height: 878 } as const;

/** A real phone width, and the one the body claims. `deviceScaleFactor` 2 to match. */
const PHONE = { width: 390, height: 844 } as const;

type Theme = "dark" | "light";

type Shot = {
	/** Ordered so the filenames sort into the order the body lays them out in. */
	id: string;
	path: string;
	frame: "desktop" | "phone";
	theme: Theme;
	/** A full-page shot is the whole scroll height, for the `<details>` block. */
	full?: boolean;
};

const SHOTS: Shot[] = [
	{ id: "01-landing-hero-desktop-dark", path: "/", frame: "desktop", theme: "dark" },
	{ id: "02-landing-full-desktop-dark", path: "/", frame: "desktop", theme: "dark", full: true },
	{ id: "03-docs-button-desktop-dark", path: "/docs/native/components/button", frame: "desktop", theme: "dark" },
	{ id: "04-docs-components-desktop-dark", path: "/docs/native/components", frame: "desktop", theme: "dark" },
	{ id: "05-theme-house-desktop-dark", path: "/theme", frame: "desktop", theme: "dark" },
	{ id: "06-404-desktop-dark", path: "/this-route-does-not-exist", frame: "desktop", theme: "dark" },
	{ id: "07-landing-hero-desktop-light", path: "/", frame: "desktop", theme: "light" },
	{ id: "08-docs-button-desktop-light", path: "/docs/native/components/button", frame: "desktop", theme: "light" },
	{ id: "09-landing-hero-mobile-dark", path: "/", frame: "phone", theme: "dark" },
	{ id: "10-landing-full-mobile-dark", path: "/", frame: "phone", theme: "dark", full: true },
	{ id: "11-docs-button-mobile-dark", path: "/docs/native/components/button", frame: "phone", theme: "dark" },
	{ id: "12-compare-hero-desktop-dark", path: "/compare/heroui", frame: "desktop", theme: "dark" },
	{ id: "13-compare-matrix-desktop-dark", path: "/compare/heroui#matrix", frame: "desktop", theme: "dark" },
	{ id: "14-compare-full-desktop-dark", path: "/compare/heroui", frame: "desktop", theme: "dark", full: true },
	{ id: "15-compare-hero-desktop-light", path: "/compare/heroui", frame: "desktop", theme: "light" },
	{ id: "16-compare-case-desktop-dark", path: "/compare/heroui#case", frame: "desktop", theme: "dark" },
	{ id: "17-compare-full-mobile-dark", path: "/compare/heroui", frame: "phone", theme: "dark", full: true },
];

const OUT_DIR = join(import.meta.dir, "..", "screenshots");

function readFlag(name: string): string | undefined {
	const index = process.argv.indexOf(`--${name}`);
	return index === -1 ? undefined : process.argv[index + 1];
}

async function settle(page: Page): Promise<void> {
	await page.waitForLoadState("networkidle");
	await page.evaluate(() => document.fonts.ready);
}

async function main(): Promise<void> {
	const url = readFlag("url") ?? "http://localhost:3000";
	const only = readFlag("only");
	const shots = only ? SHOTS.filter((shot) => shot.id.startsWith(only)) : SHOTS;

	if (shots.length === 0) throw new Error(`--only ${only} matched none of ${SHOTS.length} shots`);

	const response = await fetch(url).catch(() => undefined);
	if (!response) throw new Error(`No docs site on ${url} — run \`bun run start\` or \`bun run dev\` first`);

	await rm(OUT_DIR, { recursive: true, force: true });
	await mkdir(OUT_DIR, { recursive: true });

	const browser = await chromium.launch();

	for (const shot of shots) {
		const frame = shot.frame === "desktop" ? DESKTOP : PHONE;
		const context = await browser.newContext({
			viewport: frame,
			deviceScaleFactor: shot.frame === "desktop" ? 1 : 2,
			reducedMotion: "reduce",
			colorScheme: shot.theme,
		});
		await context.addInitScript(`localStorage.setItem("theme", ${JSON.stringify(shot.theme)})`);

		const page = await context.newPage();
		await page.goto(new URL(shot.path, url).href, { waitUntil: "domcontentloaded" });
		await settle(page);

		const applied = await page.evaluate(() => document.documentElement.classList.value);
		if (!applied.includes(shot.theme)) {
			throw new Error(`${shot.id}: asked for ${shot.theme}, <html> carries "${applied}"`);
		}

		const file = join(OUT_DIR, `${shot.id}.png`);
		await page.screenshot({ path: file, fullPage: shot.full ?? false });
		await context.close();

		console.log(`${shot.id.padEnd(34)} ${shot.path}`);
	}

	await browser.close();
	console.log(`\n${shots.length} shot${shots.length === 1 ? "" : "s"} → ${OUT_DIR}`);
}

await main();
