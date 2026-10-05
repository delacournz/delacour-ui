import { tv } from "../../lib/tv";
import type { QrErrorCorrection } from "./qr-code.constants";

/**
 * The tile's slots and every pure decision the root makes — size, quiet zone,
 * level, label, the contrast guard. No React Native imports, so `bun test`
 * reaches all of it.
 */

export const QR_SIZES = ["sm", "md", "lg"] as const;
export type QrSize = (typeof QR_SIZES)[number];

export const QR_SIZE_DP: Readonly<Record<QrSize, number>> = { sm: 128, md: 192, lg: 256 };
export const QR_DEFAULT_SIZE: QrSize = "md";

/** The standard's minimum quiet zone, in modules. */
export const QR_DEFAULT_QUIET_ZONE = 4;
/** Below this many modules of margin, many scanners cannot find the code's edge. */
export const QR_MIN_SAFE_QUIET_ZONE = 2;

/**
 * Dark modules on a light tile, literally, in both themes. A QR code is read by
 * someone else's camera, and an inverted code fails a large share of scanners —
 * this is the one place the token vocabulary yields to physics.
 */
export const QR_DEFAULT_COLORS = { color: "#000000", backgroundColor: "#ffffff" } as const;

export const QR_LABEL_MAX = 60;
export const QR_UNAVAILABLE_LABEL = "QR code unavailable";
/** Below this contrast a scanner struggles; light modules on a dark tile are flagged whatever the ratio. */
export const QR_MIN_CONTRAST = 3;

export const qrCodeVariants = tv({
	slots: {
		tile: "overflow-hidden rounded-lg",
		logo: "absolute items-center justify-center overflow-hidden rounded-lg",
		logoContent: "flex-1 items-center justify-center",
	},
});

/** A logo is damage the code must correct, so its presence forces the highest level. */
export function resolveEffectiveEcc(requested: QrErrorCorrection, hasLogo: boolean): QrErrorCorrection {
	return hasLogo ? "H" : requested;
}

/** The caller's label, else "QR code: " and the value, cut at 60 characters so a long URL is not read out whole. */
export function resolveQrLabel(value: string, custom?: string): string {
	if (custom) return custom;
	if (value.length === 0) return QR_UNAVAILABLE_LABEL;
	const shown = value.length > QR_LABEL_MAX ? `${value.slice(0, QR_LABEL_MAX)}…` : value;
	return `QR code: ${shown}`;
}

/** A named size, or a positive number of dp; anything else falls back to `md`. */
export function resolveQrSize(size: QrSize | number | undefined): number {
	if (typeof size === "number") return Number.isFinite(size) && size > 0 ? size : QR_SIZE_DP[QR_DEFAULT_SIZE];
	return QR_SIZE_DP[size ?? QR_DEFAULT_SIZE];
}

/** A whole, non-negative number of modules; four when unset or not a number. */
export function resolveQuietZone(quietZone: number | undefined): number {
	if (quietZone === undefined || !Number.isFinite(quietZone)) return QR_DEFAULT_QUIET_ZONE;
	return Math.max(0, Math.floor(quietZone));
}

const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i;

type Rgb = readonly [number, number, number];

/** Hex or `rgb()` / `rgba()`; anything else — a token name, `oklch()` — is `null` rather than a guess. */
function parseRgb(color: string): Rgb | null {
	const hex = HEX.exec(color)?.[1];
	if (hex) {
		const full = hex.length <= 4 ? Array.from(hex, (digit) => digit + digit).join("") : hex;
		return [
			Number.parseInt(full.slice(0, 2), 16),
			Number.parseInt(full.slice(2, 4), 16),
			Number.parseInt(full.slice(4, 6), 16),
		];
	}
	const rgb = RGB.exec(color);
	if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
	return null;
}

function luminance([red, green, blue]: Rgb): number {
	const channel = (value: number): number => {
		const unit = value / 255;
		return unit <= 0.03928 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
}

/** WCAG contrast between two colours, or `null` when either is in a notation this cannot read. */
export function contrastRatio(a: string, b: string): number | null {
	const first = parseRgb(a);
	const second = parseRgb(b);
	if (!first || !second) return null;
	const [light, dark] = [luminance(first), luminance(second)].sort((x, y) => y - x);
	return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
}

/** True when the modules are lighter than the tile; `null` when either colour cannot be read. */
export function isInvertedQr(color: string, background: string): boolean | null {
	const modules = parseRgb(color);
	const tile = parseRgb(background);
	if (!modules || !tile) return null;
	return luminance(modules) > luminance(tile);
}

/** Inverted, or under 3:1. An unreadable pair is skipped rather than guessed at. */
export function shouldWarnContrast(color: string, background: string): boolean {
	const ratio = contrastRatio(color, background);
	if (ratio === null) return false;
	return isInvertedQr(color, background) === true || ratio < QR_MIN_CONTRAST;
}

/** A meaningful value with no label and not decorative: a screen reader would hear only the raw payload. */
export function shouldWarnMissingLabel(value: string, label: string | undefined, isDecorative: boolean): boolean {
	return !isDecorative && !label && value.length > 0;
}
