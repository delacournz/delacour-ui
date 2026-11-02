import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const COMPONENTS = join(import.meta.dirname, "components");

/**
 * Every component folder must carry a `{name}.render.test.tsx`.
 *
 * Render tests run under Jest (`test:render`), which `bun test` cannot do — so,
 * like `docs.test.ts`, this reads the folder tree and imports nothing.
 *
 * `PENDING` is the rollout: the components whose render tests are still being
 * written, one block per batch so each batch deletes its own lines without
 * touching another's. A folder listed here that already has its test fails too,
 * so the list can only shrink. When it is empty, delete it.
 */
const PENDING: ReadonlySet<string> = new Set([
	// RNTL P1 — primitives
	"animated-badge",
	"avatar",
	"badge",
	"card",
	"direction",
	"frame",
	"icon",
	"label",
	"provider",
	"separator",
	"skeleton",
	"spinner",
	"surface",
	"text",
	"theme-selector",

	// RNTL P2 — press & actions
	"alert",
	"chip",
	"empty-state",
	"fab",
	"feedback",
	"kpi",
	"pressable",
	"progress-button",
	"rating",
	"slide-button",
	"support",
	"toggle-button",

	// RNTL P3 — form controls
	"checkbox",
	"combobox",
	"field",
	"input",
	"number-input",
	"otp-input",
	"radio",
	"search-bar",
	"select",
	"slider",
	"tag-input",
	"textarea",

	// RNTL P4 — date/time & pickers
	"calendar",
	"color-picker",
	"countdown",
	"date-picker",
	"date-time-picker",
	"planner",
	"questionnaire",
	"selection-mode",
	"time-picker",
	"timeline",

	// RNTL P5 — overlays
	"bottom-sheet",
	"context-menu",
	"drawer",
	"image-viewer",
	"menu",
	"overlay",
	"page-header",
	"popover",
	"screen",
	"toast",
	"tooltip",
	"tour",

	// RNTL P6 — navigation & layout
	"accordion",
	"breadcrumb",
	"collapsible",
	"grid-item",
	"item",
	"list-group",
	"pagination",
	"section-progress",
	"section-rail",
	"split-view",
	"splitter",
	"steps",
	"table",
	"tabs",
	"tree",

	// RNTL P7 — scroll & motion
	"carousel",
	"circular-text",
	"compare",
	"flip-card",
	"marquee",
	"message-scroller",
	"scroll-blur",
	"scroll-canvas",
	"scroll-fade",
	"scroll-header",
	"scroll-text",
	"sortable",
	"stack-card",
	"swipe",
	"text-animation",

	// RNTL P8 — rich & media
	"attachment",
	"chart",
	"flow",
	"leaderboard",
	"map",
	"markdown-editor",
	"marker",
	"message",
	"meter",
	"post",
	"progress",
	"qr-code",
	"signature",
	"sketch",
]);

function componentFolders(): string[] {
	return readdirSync(COMPONENTS, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort();
}

const hasRenderTest = (name: string): boolean => existsSync(join(COMPONENTS, name, `${name}.render.test.tsx`));

describe("render tests", () => {
	test("every component has one, or is pending", () => {
		const missing = componentFolders().filter((name) => !(hasRenderTest(name) || PENDING.has(name)));
		expect(missing).toEqual([]);
	});

	test("a pending component has none yet — take it off the list", () => {
		const done = [...PENDING].filter(hasRenderTest);
		expect(done).toEqual([]);
	});

	test("every pending name is a component folder", () => {
		const folders = new Set(componentFolders());
		const stale = [...PENDING].filter((name) => !folders.has(name));
		expect(stale).toEqual([]);
	});
});
