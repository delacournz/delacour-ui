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
 * The social card, as an SVG string: 1200×630, the house dark page, set the
 * way the site is — JetBrains Mono throughout, headings included, greyscale
 * and hairline-ruled.
 *
 * Two columns. The left is the words: the mark and the tracked wordmark over a
 * hairline, the page title at 600, one line under it at 400, and the docs URL
 * on the bottom edge. The right is the proof, standing the full height of the
 * card and running off its bottom edge the way the hero's device runs off its
 * column.
 *
 * `product` picks whose card it is, and `proof` is what stands in its right
 * column: a simulator photograph of the real thing, in the bezel `DeviceBezel`
 * draws. A `device` proof is a whole screen and fills the glass; a `stage`
 * proof is one component on the capture ground, set on the glass at its own
 * proportions. A page hands in its own hero capture, so a link to Button
 * previews as buttons and a link to Dialog as a dialog.
 *
 * With no proof, `MOTIFS` is the fallback and the one place a product's is
 * named: the charts card draws a line chart and the bottom-sheet card a sheet
 * under two snap point lines in the same phone. The library has none — without
 * a capture its column is empty rather than faked.
 *
 * Pure — strings in, a string out — so the layout is testable with no
 * rasteriser and no file: the caller hands in the capture as a data URL and
 * hands the result to resvg. The mark is drawn from `@delacour/brand`'s numbers
 * like every other rendering of it, and it is the only amber on the card: the
 * house spends colour on status and chart series, so the chart takes the
 * chart blue and everything else drawn here is a grey read off the house
 * tokens.
 */

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

const FONT = "JetBrains Mono";
/** The page gutter: every left edge, and the right edge of the proof column. */
const GUTTER = 72;
/** The words' column. It ends a gutter short of the phone. */
const COLUMN = 644;

/**
 * The house dark tokens as sRGB hex — resvg does not read `oklch()`.
 * `foreground`, `muted-foreground`, `ring`, `card` and `accent` from
 * `house.css`, and the border's white at the alpha it is declared with.
 */
const INK = "#f5f5f5";
const MUTED = "#a1a1a1";
const FAINT = "#737373";
const CARD = "#171717";
const LIFTED = "#222222";
const HAIRLINE = 'stroke="#ffffff" stroke-opacity="0.1"';
/** `chart-2` of the graphite chart ramp — the one colour the house allows a drawing. */
const CHART_COLOUR = "#3b82f6";

/**
 * JetBrains Mono advances 0.6em, so a measure is a character count: the
 * column holds 17 characters of the 60px title and 48 of the 22px line.
 */
const TITLE = { size: 60, lineHeight: 68, chars: 17, maxLines: 3 };
const LINE = { size: 22, lineHeight: 32, chars: 48, maxLines: 2 };

/** What the card says when no page title is given: the site's own line. */
export const OG_DEFAULT_TITLE = PRODUCTS.ui.cardTitle;
export const OG_DEFAULT_SUBTITLE = PRODUCTS.ui.cardLine;

/**
 * A capture standing in the phone, as an `href` resvg can load — a data URL.
 *
 * The card crops the phone, so `anchor` picks which end of a `device` screen
 * survives: `top` stands the phone on the card's top margin and lets the
 * bottom edge cut it, `bottom` does the reverse for a capture whose subject is
 * at the foot of the screen — a sheet, a toast. A `stage` capture carries its
 * intrinsic size, which is what it is scaled from.
 */
export type OgProof =
	| { kind: "device"; href: string; anchor?: "top" | "bottom" }
	| { kind: "stage"; href: string; width: number; height: number };

export type OgCard = {
	title?: string;
	subtitle?: string;
	product?: DocsProduct;
	proof?: OgProof;
};

/**
 * The phone every proof stands in, with `DeviceBezel`'s proportions: a 40px
 * corner and a 6px bezel on a 300px device, scaled to this one. It is taller
 * than the card, so the bottom edge crops it. `SCREEN` is the glass inside the
 * bezel, at the capture's own 662:1440.
 */
const PHONE = { x: 780, y: 60, width: 348, height: 757, radius: 46, bezel: 7 };
const SCREEN = {
	x: PHONE.x + PHONE.bezel,
	y: PHONE.y + PHONE.bezel,
	width: PHONE.width - PHONE.bezel * 2,
	height: Math.round(((PHONE.width - PHONE.bezel * 2) * 1440) / 662),
	radius: PHONE.radius - PHONE.bezel,
};
/** How far the phone moves up when it stands on the card's bottom margin instead of its top one. */
const BOTTOM_SHIFT = PHONE.y + PHONE.height - (OG_HEIGHT - PHONE.y);
/** The tallest a stage capture is drawn, which keeps it inside what the card shows of the glass. */
const STAGE_MAX_HEIGHT = 500;
/** What a drawn screen keeps clear of the glass's edge. */
const INSET = 26;

/** A fixed, gently rising series — the chart is a motif, not data, so it never changes between renders. */
const CHART_SERIES = [0.18, 0.4, 0.32, 0.66, 0.6, 0.94];
const CHART_BOX = { x: 716, y: 196, width: 412, height: 300 };

function escapeXml(text: string): string {
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Greedy word wrap at `chars`, a word longer than the measure taking a line to itself. */
function greedy(words: string[], chars: number): string[] {
	const lines: string[] = [];
	let current = "";

	for (const word of words) {
		const candidate = current ? `${current} ${word}` : word;
		if (candidate.length <= chars || !current) {
			current = candidate;
		} else {
			lines.push(current);
			current = word;
		}
	}
	if (current) lines.push(current);
	return lines;
}

/**
 * Word wrap onto at most `maxLines` lines of `chars`, balanced, the last one
 * ellipsised when the text is longer than that.
 *
 * Balanced means the measure is narrowed for as long as the line count holds,
 * so a line and a half becomes two near-equal lines rather than a full one over
 * a single orphaned word. A title that arrives over a URL is untrusted
 * length-wise: anything the column cannot hold is cut with an ellipsis rather
 * than allowed to run under the phone, and so is a single over-long word.
 */
function wrap(text: string, { chars, maxLines }: { chars: number; maxLines: number }): string[] {
	const clip = (line: string): string => (line.length > chars ? `${line.slice(0, chars - 1).trimEnd()}…` : line);
	const words = text.trim().split(/\s+/).filter(Boolean);
	let lines = greedy(words, chars);

	if (lines.length > maxLines) {
		const kept = lines.slice(0, maxLines).map(clip);
		const last = kept[maxLines - 1] ?? "";
		kept[maxLines - 1] = last.endsWith("…") ? last : `${last.slice(0, chars - 1).trimEnd()}…`;
		return kept;
	}

	for (let measure = chars - 1; measure > 0; measure -= 1) {
		const narrower = greedy(words, measure);
		if (narrower.length !== lines.length || narrower.some((line) => line.length > measure)) break;
		lines = narrower;
	}
	return lines.map(clip);
}

/** The title's lines: at most three of 17 characters. */
export function wrapTitle(title: string): string[] {
	return wrap(title, TITLE);
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
		`<g id="mark" transform="translate(${x} ${y}) scale(${scale})">`,
		`<rect width="${DELACOUR_CANVAS}" height="${DELACOUR_CANVAS}" rx="${DELACOUR_CORNER_RADIUS}" fill="${DELACOUR_CARD_COLOUR}"/>`,
		`<g fill="none" stroke="${DELACOUR_STROKE_COLOUR}" stroke-width="${DELACOUR_STROKE}" stroke-linejoin="miter" stroke-miterlimit="10">`,
		rect(DELACOUR_TOP_CENTRE_Y),
		rect(DELACOUR_BOTTOM_CENTRE_Y),
		"</g>",
		"</g>",
	].join("");
}

/** The phone's body: the card fill under a hairline, cropped by an edge of the canvas. `lift` moves it up. */
function bezel(lift = 0): string {
	const { x, y, width, height, radius } = PHONE;
	return `<rect x="${x}" y="${y - lift}" width="${width}" height="${height}" rx="${radius}" fill="${CARD}" ${HAIRLINE} stroke-width="2"/>`;
}

/** The glass, as a rounded rect — the capture's clip and a drawn screen's ground. */
function glass(attributes: string, lift = 0): string {
	const { x, y, width, height, radius } = SCREEN;
	return `<rect x="${x}" y="${y - lift}" width="${width}" height="${height}" rx="${radius}" ${attributes}/>`;
}

/** A rounded bar standing in for a line of text. */
function bar(x: number, y: number, width: number, fill: string): string {
	return `<rect x="${x}" y="${y}" width="${width}" height="10" rx="5" fill="${fill}"/>`;
}

/**
 * A whole-screen capture behind the bezel, clipped to the glass. It is a
 * photograph of the real components, so nothing here redraws one.
 */
function device({ href, anchor = "top" }: Extract<OgProof, { kind: "device" }>): string {
	const lift = anchor === "bottom" ? BOTTOM_SHIFT : 0;
	const { x, y, width, height } = SCREEN;

	return [
		'<g id="device">',
		`<clipPath id="glass">${glass("", lift)}</clipPath>`,
		bezel(lift),
		`<image href="${escapeXml(href)}" x="${x}" y="${y - lift}" width="${width}" height="${height}" preserveAspectRatio="xMidYMin slice" clip-path="url(#glass)"/>`,
		"</g>",
	].join("");
}

/**
 * One component's capture on the glass: as wide as the screen unless that
 * would make it taller than `STAGE_MAX_HEIGHT`, and centred in the part of the
 * glass the card shows. The glass is filled with the page colour the capture
 * was photographed on, so the capture has no edge.
 */
function stage({ href, width, height }: Extract<OgProof, { kind: "stage" }>): string {
	const scale = Math.min(SCREEN.width / width, STAGE_MAX_HEIGHT / height);
	const drawnWidth = Math.round(width * scale);
	const drawnHeight = Math.round(height * scale);
	const x = Math.round(SCREEN.x + (SCREEN.width - drawnWidth) / 2);
	const y = Math.round((SCREEN.y + OG_HEIGHT - drawnHeight) / 2);

	return [
		'<g id="stage">',
		`<clipPath id="glass">${glass("")}</clipPath>`,
		bezel(),
		glass(`fill="${HOUSE_BACKGROUND.dark}"`),
		`<image href="${escapeXml(href)}" x="${x}" y="${y}" width="${drawnWidth}" height="${drawnHeight}" clip-path="url(#glass)"/>`,
		"</g>",
	].join("");
}

/** A smoothed line and its area over four hairlines, in the chart blue, inside `CHART_BOX`. */
function chart(): string {
	const { x, y, width, height } = CHART_BOX;
	const step = width / (CHART_SERIES.length - 1);
	const points = CHART_SERIES.map(
		(value, index) => [Math.round(x + index * step), Math.round(y + height - value * height)] as const
	);
	const half = Math.round(step / 2);
	const path = points
		.map(([px, py], index) => {
			const previous = points[index - 1];
			return previous ? `C${previous[0] + half} ${previous[1]} ${px - half} ${py} ${px} ${py}` : `M${px} ${py}`;
		})
		.join(" ");
	const last = points[points.length - 1] ?? [x + width, y];
	const grid = [0, 1 / 3, 2 / 3, 1]
		.map((at) => {
			const gy = Math.round(y + at * height);
			return `<line x1="${x}" y1="${gy}" x2="${x + width}" y2="${gy}" ${HAIRLINE} stroke-width="2"/>`;
		})
		.join("");

	return [
		'<g id="chart">',
		grid,
		`<path d="${path} L${x + width} ${y + height} L${x} ${y + height} Z" fill="${CHART_COLOUR}" fill-opacity="0.12"/>`,
		`<path d="${path}" fill="none" stroke="${CHART_COLOUR}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>`,
		`<circle cx="${last[0]}" cy="${last[1]}" r="10" fill="${CHART_COLOUR}" stroke="${HOUSE_BACKGROUND.dark}" stroke-width="5"/>`,
		"</g>",
	].join("");
}

/**
 * A sheet resting on a snap point inside the phone, in the house greys: the
 * screen behind it as three lines of content, two dashed hairlines for the
 * snap points it could settle at, and the panel with its rounded top corners,
 * its handle pill and two lines of its own.
 */
function sheet(): string {
	const left = SCREEN.x;
	const right = SCREEN.x + SCREEN.width;
	const inner = left + INSET;
	const panelTop = 396;
	const radius = SCREEN.radius;
	const panel = [
		`M${left} ${OG_HEIGHT + 4}`,
		`L${left} ${panelTop + radius}`,
		`Q${left} ${panelTop} ${left + radius} ${panelTop}`,
		`L${right - radius} ${panelTop}`,
		`Q${right} ${panelTop} ${right} ${panelTop + radius}`,
		`L${right} ${OG_HEIGHT + 4}`,
		"Z",
	].join(" ");
	const handleWidth = 64;
	const snapPoints = [236, 316]
		.map(
			(dy) =>
				`<line x1="${inner}" y1="${dy}" x2="${right - INSET}" y2="${dy}" stroke="#ffffff" stroke-opacity="0.18" stroke-width="2" stroke-dasharray="6 8"/>`
		)
		.join("");

	return [
		'<g id="sheet">',
		bezel(),
		glass(`fill="${HOUSE_BACKGROUND.dark}"`),
		bar(inner, 122, 150, FAINT),
		bar(inner, 148, 220, LIFTED),
		bar(inner, 174, 184, LIFTED),
		snapPoints,
		`<path d="${panel}" fill="${LIFTED}" stroke="#ffffff" stroke-opacity="0.16" stroke-width="2" stroke-linejoin="round"/>`,
		`<rect x="${Math.round((left + right - handleWidth) / 2)}" y="${panelTop + 16}" width="${handleWidth}" height="6" rx="3" fill="${FAINT}"/>`,
		bar(inner, panelTop + 58, 168, INK),
		bar(inner, panelTop + 88, 240, FAINT),
		bar(inner, panelTop + 114, 196, FAINT),
		`<rect x="${inner}" y="${panelTop + 158}" width="${right - INSET - inner}" height="56" rx="14" fill="${INK}"/>`,
		"</g>",
	].join("");
}

/** What a product's card draws in its right column when it is handed no capture. */
const MOTIFS: Record<DocsProduct, () => string> = {
	ui: () => "",
	charts: chart,
	"bottom-sheet": sheet,
};

function proofOrMotif(product: DocsProduct, proof: OgProof | undefined): string {
	if (!proof) return MOTIFS[product]();
	return proof.kind === "device" ? device(proof) : stage(proof);
}

function text(attributes: string, content: string): string {
	return `<text font-family="${FONT}" ${attributes}>${escapeXml(content)}</text>`;
}

export function ogCardSvg(card: OgCard = {}): string {
	const { title, subtitle, product = "ui", proof } = card;
	const seo = PRODUCTS[product];
	const titleLines = wrap(title?.trim() || seo.cardTitle, TITLE);
	const lines = wrap(subtitle?.trim() || seo.cardLine, LINE);
	const titleTop = 318 - (titleLines.length - 1) * 28;
	const lineTop = titleTop + (titleLines.length - 1) * TITLE.lineHeight + 52;

	return [
		`<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">`,
		`<rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="${HOUSE_BACKGROUND.dark}"/>`,
		mark(GUTTER, 60, 48),
		text(
			`x="${GUTTER + 68}" y="92" font-weight="600" font-size="22" letter-spacing="6.2" fill="${INK}"`,
			seo.name.toUpperCase()
		),
		`<line x1="${GUTTER}" y1="148" x2="${GUTTER + COLUMN}" y2="148" ${HAIRLINE} stroke-width="2"/>`,
		...titleLines.map((content, index) =>
			text(
				`x="${GUTTER}" y="${titleTop + index * TITLE.lineHeight}" font-weight="600" font-size="${TITLE.size}" fill="${INK}"`,
				content
			)
		),
		...lines.map((content, index) =>
			text(
				`x="${GUTTER}" y="${lineTop + index * LINE.lineHeight}" font-weight="400" font-size="${LINE.size}" fill="${MUTED}"`,
				content
			)
		),
		proofOrMotif(product, proof),
		text(`x="${GUTTER}" y="${OG_HEIGHT - 64}" font-weight="400" font-size="20" fill="${FAINT}"`, footer(seo)),
		"</svg>",
	].join("\n");
}
