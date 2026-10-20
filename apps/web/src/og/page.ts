import { type DocsProduct, docsProduct } from "@/lib/seo";
import { type PreviewId, previews } from "@/previews/manifest";
import type { OgCard, OgProof } from "./card";

/**
 * Which capture a docs page's social card stands in its phone, and what the
 * card says beside it. Pure: `routes/og/docs.ts` and the two scripts both read
 * it, so the card a reviewer renders is the card the server serves.
 *
 * A page's hero is the first `<Preview id>` in its MDX. A `stage` hero's dark
 * poster is used as it is. A `device` hero's is not: every one of them is a
 * clip that opens on the closed state, and its poster has to stay that first
 * frame or the docs page flicks when playback starts. So `MOMENTS` names, per
 * clip, the moment worth a card, and `bun run og-assets` cuts that frame into
 * `src/og/frames/`, where it is committed — the server has no `ffmpeg`.
 */

export type Moment = {
	/** How far through the clip the frame is, 0–1. `0` is the poster itself. */
	at: number;
	/** Which end of the screen the card keeps — see `OgProof`. */
	anchor: "top" | "bottom";
};

const POSTER: Moment = { at: 0, anchor: "top" };

/** The frame of each device clip that shows what its page is about. */
export const MOMENTS: Partial<Record<PreviewId, Moment>> = {
	"screen/showcase": POSTER,
	"screen/inbox": POSTER,
	"bottom-sheet/anatomy/the-whole-composition": { at: 0.24, anchor: "bottom" },
	"breadcrumb/ellipsis-sheet": { at: 0.25, anchor: "bottom" },
	"combobox/single": { at: 0.45, anchor: "top" },
	"context-menu/message-actions": { at: 0.55, anchor: "bottom" },
	"dialog/confirm": { at: 0.3, anchor: "top" },
	"drawer/navigation": { at: 0.3, anchor: "top" },
	"feedback/basic": { at: 0.8, anchor: "top" },
	"menu/actions": { at: 0.6, anchor: "bottom" },
	"page-header/in-a-screen": POSTER,
	"popover/basic": { at: 0.6, anchor: "top" },
	"select/single": { at: 0.25, anchor: "bottom" },
	"time-picker/basic-sheet": { at: 0.35, anchor: "bottom" },
	"toast/statuses": { at: 0.3, anchor: "bottom" },
	"tooltip/icon-buttons": { at: 0.35, anchor: "top" },
	"bottom-sheet-engine/anatomy/two-snap-points": { at: 0.3, anchor: "top" },
	"bottom-sheet-engine/detached/floating-card": { at: 0.3, anchor: "bottom" },
	"bottom-sheet-engine/footer/sticky-on-a-short-sheet": { at: 0.45, anchor: "bottom" },
	"bottom-sheet-engine/keyboard/interactive-with-sticky-footer": { at: 0.3, anchor: "top" },
	"bottom-sheet-engine/portal/two-sheets-stacked": { at: 0.6, anchor: "top" },
	"bottom-sheet-engine/scrollables/scroll-view-two-snap-points": { at: 0.3, anchor: "top" },
	"bottom-sheet-engine/steps/three-step-form": { at: 0.5, anchor: "top" },
};

/** The capture a product's card stands on when the page has no hero of its own. */
export const PRODUCT_HERO: Record<DocsProduct, PreviewId> = {
	ui: "screen/showcase",
	charts: "charts/animation/morph",
	"bottom-sheet": "bottom-sheet-engine/anatomy/two-snap-points",
};

/** One capture the card can stand in its phone, as `heroes.ts` lists it. */
export type Capture = {
	/** The clip's `sourceHash` when its frame was cut. Absent on a capture used as committed. */
	cut?: string;
	/** The image as a data URL, bundled on demand rather than with the route. */
	load: () => Promise<{ default: string }>;
};

export type DocsPage = { slugs: readonly string[]; title: string; description?: string };

export function isPreviewId(id: string): id is PreviewId {
	return Object.hasOwn(previews, id);
}

/** The page's key in `pageHeroes` and in `/og/docs?page=`. */
export function pageKey(slugs: readonly string[]): string {
	return slugs.join("/");
}

/** The first preview a page's MDX names — its hero. */
export function heroOf(mdx: string): string | undefined {
	return mdx.match(/<Preview id="([^"]+)"/)?.[1];
}

/** Whether a capture's card image is a frame cut from its clip rather than its poster. */
export function isFramed(id: PreviewId): boolean {
	return previews[id].frame === "device" && (MOMENTS[id]?.at ?? 0) > 0;
}

/** Where a capture's card image is committed, relative to `apps/web`. */
export function capturePath(id: PreviewId): string {
	return isFramed(id) ? `src/og/frames/${id}.png` : `public/previews/${id}/dark.png`;
}

export function proofOf(id: PreviewId, href: string): OgProof {
	const entry = previews[id];
	if (entry.frame === "stage") return { kind: "stage", href, width: entry.width, height: entry.height };

	return { kind: "device", href, anchor: MOMENTS[id]?.anchor ?? "top" };
}

/**
 * The words on a page's card. An engine's landing page is the product's own
 * card; a page with a hero is described in its own words; a page with none
 * keeps its product's line under its title.
 */
export function cardCopy(page: DocsPage, hasHero: boolean): Pick<OgCard, "product" | "title" | "subtitle"> {
	const product = docsProduct(page.slugs);
	if (product !== "ui" && page.slugs.length === 1) return { product, title: undefined, subtitle: undefined };

	return { product, title: page.title, subtitle: hasHero ? page.description : undefined };
}
