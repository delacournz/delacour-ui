import {
	DELACOUR_BOTTOM_CENTRE_Y,
	DELACOUR_CANVAS,
	DELACOUR_CARD_COLOUR,
	DELACOUR_CENTRE_X,
	DELACOUR_CORNER_RADIUS,
	DELACOUR_RECT_X,
	DELACOUR_SQUARE,
	DELACOUR_STROKE,
	DELACOUR_STROKE_COLOUR,
	DELACOUR_TOP_CENTRE_Y,
	delacourRectY,
} from "@delacour/brand";
import { HOUSE_BACKGROUND } from "@/lib/house-meta";
import { type DocsProduct, PRODUCTS, type ProductSeo } from "@/lib/seo";

/**
 * The social card, as an SVG string: 1200×630, the house dark page, the mark,
 * the page title in Outfit and one line under it in Inter.
 *
 * Pure — a string in, a string out — so the layout is testable with no
 * rasteriser, and `routes/og/docs.ts` only has to hand it to resvg. The mark is
 * drawn from `@delacour/brand`'s numbers like every other rendering of it; the
 * colours are the generated house background and the brand's own two
 * literals, which are the icon's and look the same in both themes.
 *
 * `product` picks whose card it is. The charts card carries the charts
 * package's name and line, its own docs URL in the footer, and a small amber
 * line chart along the bottom, so the two read as different things in a feed.
 */

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/** Outfit 600 at 64px on a 1000px measure — a hard wrap past this many characters. */
const TITLE_CHARS_PER_LINE = 30;
const TITLE_MAX_LINES = 3;

/** What the card says when no page title is given: the site's own line. */
export const OG_DEFAULT_TITLE = PRODUCTS.ui.cardTitle;
export const OG_DEFAULT_SUBTITLE = PRODUCTS.ui.cardLine;

export type OgCard = { title?: string; subtitle?: string; product?: DocsProduct };

/** A fixed, gently rising series — the chart is a motif, not data, so it never changes between renders. */
const CHART_SERIES = [0.32, 0.46, 0.38, 0.58, 0.5, 0.7, 0.62, 0.84, 0.76, 0.96];
const CHART_BOX = { x: 640, y: 450, width: 464, height: 110 };

function escapeXml(text: string): string {
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Greedy word wrap onto at most three lines, the last one ellipsised.
 *
 * A title that arrives over a URL is untrusted length-wise; three lines of
 * 64px is what fits above the subtitle, and anything longer is cut with an
 * ellipsis rather than allowed to run off the canvas.
 */
export function wrapTitle(title: string): string[] {
	const words = title.trim().split(/\s+/).filter(Boolean);
	const lines: string[] = [];
	let current = "";

	for (const word of words) {
		const candidate = current ? `${current} ${word}` : word;
		if (candidate.length <= TITLE_CHARS_PER_LINE || !current) {
			current = candidate;
		} else {
			lines.push(current);
			current = word;
		}
	}
	if (current) lines.push(current);

	if (lines.length <= TITLE_MAX_LINES) return lines;

	const kept = lines.slice(0, TITLE_MAX_LINES);
	const last = kept[TITLE_MAX_LINES - 1] ?? "";
	kept[TITLE_MAX_LINES - 1] = `${last.slice(0, TITLE_CHARS_PER_LINE - 1).trimEnd()}…`;
	return kept;
}

/** The host, plus the product's docs path when it is not the site's own. */
function footer(seo: ProductSeo): string {
	const host = "ui.delacour.co.nz";
	return seo === PRODUCTS.ui ? host : `${host}${seo.path}`;
}

/** The mark at `size` px, top-left at (x, y), rounded the way the favicon is. */
function mark(x: number, y: number, size: number): string {
	const scale = size / DELACOUR_CANVAS;
	const rect = (centreY: number): string =>
		`<rect x="${DELACOUR_RECT_X}" y="${delacourRectY(centreY)}" width="${DELACOUR_SQUARE}" height="${DELACOUR_SQUARE}" transform="rotate(45 ${DELACOUR_CENTRE_X} ${centreY})"/>`;

	return [
		`<g transform="translate(${x} ${y}) scale(${scale})">`,
		`<rect width="${DELACOUR_CANVAS}" height="${DELACOUR_CANVAS}" rx="${DELACOUR_CORNER_RADIUS}" fill="${DELACOUR_CARD_COLOUR}"/>`,
		`<g fill="none" stroke="${DELACOUR_STROKE_COLOUR}" stroke-width="${DELACOUR_STROKE}" stroke-linejoin="miter" stroke-miterlimit="10">`,
		rect(DELACOUR_TOP_CENTRE_Y),
		rect(DELACOUR_BOTTOM_CENTRE_Y),
		"</g>",
		"</g>",
	].join("");
}

/** A line and its area over three hairlines, in the mark's amber, inside `CHART_BOX`. */
function chart(): string {
	const { x, y, width, height } = CHART_BOX;
	const step = width / (CHART_SERIES.length - 1);
	const points = CHART_SERIES.map(
		(value, index) => [Math.round(x + index * step), Math.round(y + height - value * height)] as const
	);
	const path = points.map(([px, py], index) => `${index ? "L" : "M"}${px} ${py}`).join(" ");
	const last = points[points.length - 1] ?? [x + width, y];
	const grid = [0, 0.5, 1]
		.map((at) => {
			const gy = Math.round(y + at * height);
			return `<line x1="${x}" y1="${gy}" x2="${x + width}" y2="${gy}" stroke="#27272a" stroke-width="2"/>`;
		})
		.join("");

	return [
		'<g id="chart">',
		grid,
		`<path d="${path} L${x + width} ${y + height} L${x} ${y + height} Z" fill="${DELACOUR_STROKE_COLOUR}" fill-opacity="0.12"/>`,
		`<path d="${path}" fill="none" stroke="${DELACOUR_STROKE_COLOUR}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>`,
		`<circle cx="${last[0]}" cy="${last[1]}" r="9" fill="${DELACOUR_STROKE_COLOUR}"/>`,
		"</g>",
	].join("");
}

export function ogCardSvg({ title, subtitle, product = "ui" }: OgCard = {}): string {
	const seo = PRODUCTS[product];
	const lines = wrapTitle(title?.trim() || seo.cardTitle);
	const line = subtitle?.trim() || seo.cardLine;
	const titleSize = lines.length === 1 ? 72 : 64;
	const lineHeight = titleSize * 1.12;
	const titleTop = 300 - ((lines.length - 1) * lineHeight) / 2;

	const titleText = lines
		.map(
			(text, index) =>
				`<text x="96" y="${Math.round(titleTop + index * lineHeight)}" font-family="Outfit" font-weight="600" font-size="${titleSize}" letter-spacing="-1.5" fill="#fafafa">${escapeXml(text)}</text>`
		)
		.join("");

	const subtitleTop = Math.round(titleTop + (lines.length - 1) * lineHeight + 64);

	return [
		`<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">`,
		`<rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="${HOUSE_BACKGROUND.dark}"/>`,
		mark(96, 96, 72),
		`<text x="192" y="146" font-family="Outfit" font-weight="600" font-size="34" letter-spacing="-0.5" fill="#fafafa">${escapeXml(seo.name)}</text>`,
		titleText,
		`<circle cx="102" cy="${subtitleTop - 9}" r="5" fill="${DELACOUR_STROKE_COLOUR}"/>`,
		`<text x="120" y="${subtitleTop}" font-family="Inter" font-size="28" fill="#a1a1aa">${escapeXml(line)}</text>`,
		product === "charts" ? chart() : "",
		`<text x="96" y="${OG_HEIGHT - 72}" font-family="Inter" font-size="24" fill="#71717a">${escapeXml(footer(seo))}</text>`,
		"</svg>",
	].join("\n");
}
