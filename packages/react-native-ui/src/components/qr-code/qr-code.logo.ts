import type { QrEncodeOptions, QrEncodeResult, QrErrorCorrection, QrLogoRegion, QrVersion } from "./qr-code.constants";
import { encodeQr } from "./qr-code.encode";
import { placeData } from "./qr-code.matrix";
import { blockLayout, QR_MAX_VERSION, symbolSize, totalCodewords } from "./qr-code.tables";

/**
 * Where a centre logo may go, and how big it may be before the code stops
 * scanning. A logo is damage the code is built to survive: every codeword it
 * covers is an error Reed–Solomon has to correct, and each block corrects at
 * most half its EC codewords.
 */

export const QR_LOGO_MIN_FRACTION = 0.1;
export const QR_LOGO_MAX_FRACTION = 0.3;
export const QR_LOGO_DEFAULT_FRACTION = 0.2;
/** The share of a block's correction a logo may spend; the rest is left for real-world damage. */
export const QR_LOGO_BUDGET = 0.5;
const SHRINK_STEP = 0.05;

function clampFraction(fraction: number): number {
	if (!Number.isFinite(fraction)) return QR_LOGO_DEFAULT_FRACTION;
	return Math.min(QR_LOGO_MAX_FRACTION, Math.max(QR_LOGO_MIN_FRACTION, fraction));
}

/** The cleared square, centred, with the same parity as `size` so it sits symmetrically. */
export function resolveLogoRegion(size: number, fraction: number): QrLogoRegion {
	let side = Math.ceil(size * clampFraction(fraction) - 1e-9);
	if (side % 2 !== size % 2) side++;
	return { start: (size - side) / 2, side };
}

/** Each codeword that owns at least one module inside the region. Function modules are never counted. */
function affectedCodewords(owner: Int16Array, size: number, region: QrLogoRegion): Set<number> {
	const affected = new Set<number>();
	for (let row = region.start; row < region.start + region.side; row++) {
		for (let col = region.start; col < region.start + region.side; col++) {
			const codeword = owner[row * size + col] ?? -1;
			if (codeword >= 0) affected.add(codeword);
		}
	}
	return affected;
}

export function countAffectedCodewords(owner: Int16Array, size: number, region: QrLogoRegion): number {
	return affectedCodewords(owner, size, region).size;
}

/** Whether a module sits in a finder (with its separator and format strip), a timing line or a version block. */
function isReserved(version: QrVersion, row: number, col: number): boolean {
	const size = symbolSize(version);
	if (row === 6 || col === 6) return true;
	if (row <= 8 && col <= 8) return true;
	if (row <= 8 && col >= size - 8) return true;
	if (row >= size - 8 && col <= 8) return true;
	if (version >= 7) {
		if (row < 6 && col >= size - 11 && col < size - 8) return true;
		if (col < 6 && row >= size - 11 && row < size - 8) return true;
	}
	return false;
}

/** True when the region leaves every finder, timing line, format strip and version block intact. */
export function regionClearsNoReservedModules(version: QrVersion, region: QrLogoRegion): boolean {
	for (let row = region.start; row < region.start + region.side; row++) {
		for (let col = region.start; col < region.start + region.side; col++) {
			if (isReserved(version, row, col)) return false;
		}
	}
	return true;
}

/** Which block a codeword in the interleaved stream belongs to. */
function blockOfCodeword(version: QrVersion, level: QrErrorCorrection): Int16Array {
	const layout = blockLayout(version, level);
	const out = new Int16Array(totalCodewords(version));
	let cursor = 0;
	const longest = layout.long.count > 0 ? layout.long.data : layout.short.data;
	for (let column = 0; column < longest; column++) {
		for (let block = 0; block < layout.blocks; block++) {
			const length = block < layout.short.count ? layout.short.data : layout.long.data;
			if (column < length) out[cursor++] = block;
		}
	}
	for (let column = 0; column < layout.ecPerBlock; column++) {
		for (let block = 0; block < layout.blocks; block++) out[cursor++] = block;
	}
	return out;
}

/** Whether a logo of `fraction` at `version` / `level` keeps every block within its budget. */
function logoFits(version: QrVersion, level: QrErrorCorrection, fraction: number): boolean {
	const size = symbolSize(version);
	const region = resolveLogoRegion(size, fraction);
	if (!regionClearsNoReservedModules(version, region)) return false;

	const { owner } = placeData(new Array<number>(totalCodewords(version)).fill(0), version);
	const blocks = blockOfCodeword(version, level);
	const layout = blockLayout(version, level);
	const perBlock = new Array<number>(layout.blocks).fill(0);
	for (const codeword of affectedCodewords(owner, size, region)) {
		const block = blocks[codeword] ?? 0;
		perBlock[block] = (perBlock[block] ?? 0) + 1;
	}
	const budget = Math.floor(layout.ecPerBlock / 2) * QR_LOGO_BUDGET;
	return perBlock.every((count) => count <= budget);
}

export type QrLogoFitOptions = {
	version: QrVersion;
	errorCorrection: QrErrorCorrection;
	fraction: number;
	/** The largest version the fit may grow to. Default 40. */
	maxVersion?: QrVersion;
};

export type QrLogoFit = { version: QrVersion; fraction: number; clearsLogo: boolean };

/**
 * The smallest change that keeps a logo recoverable: first a larger version at
 * the requested size, then a smaller logo, down to the 0.1 floor. When even that
 * does not fit, `clearsLogo` is false and nothing is cleared — the code stays
 * scannable and the logo is dropped.
 */
export function fitLogoToEcc({
	version,
	errorCorrection,
	fraction,
	maxVersion = QR_MAX_VERSION,
}: QrLogoFitOptions): QrLogoFit {
	const requested = clampFraction(fraction);
	for (let size = requested; size >= QR_LOGO_MIN_FRACTION - 1e-9; size -= SHRINK_STEP) {
		const candidate = Math.round(Math.max(size, QR_LOGO_MIN_FRACTION) * 100) / 100;
		for (let next = version; next <= maxVersion; next++) {
			if (logoFits(next, errorCorrection, candidate)) {
				return { version: next, fraction: candidate, clearsLogo: true };
			}
		}
	}
	return { version, fraction: QR_LOGO_MIN_FRACTION, clearsLogo: false };
}

/** What the root renders: the encode, and the logo's cleared square when one fits. */
export type QrCodePlan =
	| { logo: "none"; result: QrEncodeResult; region: null }
	| { logo: "placed"; result: QrEncodeResult; region: QrLogoRegion; fraction: number }
	| { logo: "dropped"; result: QrEncodeResult; region: null };

/**
 * Encodes for a code with or without a logo. With one, the level is H, the
 * version is whatever `fitLogoToEcc` needs, and `region` is the square to clear.
 */
export function planQrCode(value: string, options: QrEncodeOptions, logoFraction: number | null): QrCodePlan {
	if (logoFraction === null) return { logo: "none", result: encodeQr(value, options), region: null };

	const atH: QrEncodeOptions = { ...options, errorCorrection: "H", boostEcc: false };
	const first = encodeQr(value, atH);
	if (!first.ok) return { logo: "none", result: first, region: null };

	const fit = fitLogoToEcc({
		version: first.matrix.version,
		errorCorrection: "H",
		fraction: logoFraction,
		maxVersion: options.maxVersion,
	});
	if (!fit.clearsLogo) return { logo: "dropped", result: first, region: null };

	const result = fit.version === first.matrix.version ? first : encodeQr(value, { ...atH, minVersion: fit.version });
	if (!result.ok) return { logo: "dropped", result: first, region: null };
	return {
		logo: "placed",
		result,
		region: resolveLogoRegion(result.matrix.size, fit.fraction),
		fraction: fit.fraction,
	};
}
