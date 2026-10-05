import {
	QR_ERROR_CORRECTIONS,
	type QrEncodeOptions,
	type QrEncodeResult,
	type QrErrorCorrection,
	type QrMask,
	type QrMode,
	type QrVersion,
} from "./qr-code.constants";
import { formatWord, placeFormatWord } from "./qr-code.format";
import { rsRemainder } from "./qr-code.gf";
import { applyMask, chooseMask, scorePenalty } from "./qr-code.mask";
import { placeData } from "./qr-code.matrix";
import {
	blockLayout,
	dataCodewords,
	QR_ALPHANUMERIC_CHARSET,
	QR_MAX_VERSION,
	QR_MIN_VERSION,
	symbolSize,
} from "./qr-code.tables";

/**
 * The encoder: one segment, numeric / alphanumeric / byte, versions 1–40,
 * levels L–H. No multi-segment optimisation, no Kanji, no ECI, no Micro QR.
 */

const NUMERIC = /^[0-9]+$/;

/** All digits → numeric; all in the 45-character set → alphanumeric; anything else → byte (UTF-8). */
export function selectMode(value: string): QrMode {
	if (NUMERIC.test(value)) return "numeric";
	for (const character of value) {
		if (!QR_ALPHANUMERIC_CHARSET.includes(character)) return "byte";
	}
	return "alphanumeric";
}

const MODE_INDICATOR: Readonly<Record<QrMode, number>> = { numeric: 0b0001, alphanumeric: 0b0010, byte: 0b0100 };

const COUNT_BITS: Readonly<Record<QrMode, readonly [number, number, number]>> = {
	numeric: [10, 12, 14],
	alphanumeric: [9, 11, 13],
	byte: [8, 16, 16],
};

/** The width of the character-count field, which grows at versions 10 and 27. */
export function characterCountBits(mode: QrMode, version: QrVersion): number {
	const band = version <= 9 ? 0 : version <= 26 ? 1 : 2;
	return COUNT_BITS[mode][band];
}

/** UTF-8 bytes, without `TextEncoder` — this runs on every JS engine React Native ships. */
export function encodeUtf8(value: string): number[] {
	const bytes: number[] = [];
	for (const character of value) {
		const point = character.codePointAt(0) ?? 0;
		if (point < 0x80) bytes.push(point);
		else if (point < 0x800) bytes.push(0xc0 | (point >> 6), 0x80 | (point & 0x3f));
		else if (point < 0x10000) bytes.push(0xe0 | (point >> 12), 0x80 | ((point >> 6) & 0x3f), 0x80 | (point & 0x3f));
		else {
			bytes.push(
				0xf0 | (point >> 18),
				0x80 | ((point >> 12) & 0x3f),
				0x80 | ((point >> 6) & 0x3f),
				0x80 | (point & 0x3f)
			);
		}
	}
	return bytes;
}

/** How many of the mode's units the value is — digits, characters or bytes. */
function unitsOf(value: string, mode: QrMode): number {
	return mode === "byte" ? encodeUtf8(value).length : value.length;
}

/** Bits the payload itself takes, header excluded. */
function payloadBits(mode: QrMode, units: number): number {
	switch (mode) {
		case "numeric":
			return 10 * Math.floor(units / 3) + ([0, 4, 7][units % 3] ?? 0);
		case "alphanumeric":
			return 11 * Math.floor(units / 2) + 6 * (units % 2);
		case "byte":
			return 8 * units;
	}
}

function fits(mode: QrMode, units: number, version: QrVersion, level: QrErrorCorrection): boolean {
	const countBits = characterCountBits(mode, version);
	if (units >= 2 ** countBits) return false;
	return 4 + countBits + payloadBits(mode, units) <= dataCodewords(version, level) * 8;
}

/** The most units of `mode` one version and level can hold. */
export function characterCapacity(mode: QrMode, version: QrVersion, level: QrErrorCorrection): number {
	const available = dataCodewords(version, level) * 8 - 4 - characterCountBits(mode, version);
	const perUnit = mode === "numeric" ? 10 / 3 : mode === "alphanumeric" ? 5.5 : 8;
	let units = Math.ceil(available / perUnit) + 1;
	while (units > 0 && !fits(mode, units, version, level)) units--;
	return units;
}

export type QrVersionChoice =
	| { ok: true; version: QrVersion; mode: QrMode }
	| { ok: false; units: number; capacity: number };

/** The smallest version in `min..max` that holds the value at `level`. */
export function selectVersion(
	value: string,
	level: QrErrorCorrection,
	min: QrVersion,
	max: QrVersion
): QrVersionChoice {
	const mode = selectMode(value);
	const units = unitsOf(value, mode);
	for (let version = min; version <= max; version++) {
		if (fits(mode, units, version, level)) return { ok: true, version, mode };
	}
	return { ok: false, units, capacity: characterCapacity(mode, max, level) };
}

function pushBits(bits: number[], value: number, length: number): void {
	for (let index = length - 1; index >= 0; index--) bits.push((value >>> index) & 1);
}

/** The data codewords: mode, count, payload, terminator, byte padding, then 0xEC / 0x11 to capacity. */
export function encodeBitStream(value: string, mode: QrMode, version: QrVersion, level: QrErrorCorrection): number[] {
	const bits: number[] = [];
	pushBits(bits, MODE_INDICATOR[mode], 4);

	if (mode === "numeric") {
		pushBits(bits, value.length, characterCountBits(mode, version));
		for (let index = 0; index < value.length; index += 3) {
			const group = value.slice(index, index + 3);
			pushBits(bits, Number.parseInt(group, 10), group.length * 3 + 1);
		}
	} else if (mode === "alphanumeric") {
		pushBits(bits, value.length, characterCountBits(mode, version));
		for (let index = 0; index < value.length; index += 2) {
			const first = QR_ALPHANUMERIC_CHARSET.indexOf(value.charAt(index));
			if (index + 1 < value.length) {
				pushBits(bits, first * 45 + QR_ALPHANUMERIC_CHARSET.indexOf(value.charAt(index + 1)), 11);
			} else {
				pushBits(bits, first, 6);
			}
		}
	} else {
		const bytes = encodeUtf8(value);
		pushBits(bits, bytes.length, characterCountBits(mode, version));
		for (const byte of bytes) pushBits(bits, byte, 8);
	}

	const capacity = dataCodewords(version, level) * 8;
	pushBits(bits, 0, Math.min(4, capacity - bits.length));
	pushBits(bits, 0, (8 - (bits.length % 8)) % 8);

	const codewords: number[] = [];
	for (let index = 0; index < bits.length; index += 8) {
		let byte = 0;
		for (let offset = 0; offset < 8; offset++) byte = (byte << 1) | (bits[index + offset] ?? 0);
		codewords.push(byte);
	}
	for (let pad = 0xec; codewords.length < capacity / 8; pad ^= 0xec ^ 0x11) codewords.push(pad);
	return codewords;
}

/** Column-wise across blocks: every block's data, then every block's EC. Short blocks drop out of the last data column. */
export function interleave(
	blocksData: readonly (readonly number[])[],
	blocksEc: readonly (readonly number[])[]
): number[] {
	const out: number[] = [];
	for (const blocks of [blocksData, blocksEc]) {
		const longest = Math.max(...blocks.map((block) => block.length));
		for (let column = 0; column < longest; column++) {
			for (const block of blocks) {
				const value = block[column];
				if (value !== undefined) out.push(value);
			}
		}
	}
	return out;
}

/** Splits the data codewords into the version's blocks and appends Reed–Solomon EC to each, interleaved. */
export function buildCodewords(data: readonly number[], version: QrVersion, level: QrErrorCorrection): number[] {
	const layout = blockLayout(version, level);
	const blocksData: number[][] = [];
	let cursor = 0;
	for (let block = 0; block < layout.blocks; block++) {
		const length = block < layout.short.count ? layout.short.data : layout.long.data;
		blocksData.push(data.slice(cursor, cursor + length));
		cursor += length;
	}
	return interleave(
		blocksData,
		blocksData.map((block) => rsRemainder(block, layout.ecPerBlock))
	);
}

function isVersion(value: number): boolean {
	return Number.isInteger(value) && value >= QR_MIN_VERSION && value <= QR_MAX_VERSION;
}

/**
 * Encodes a string as a QR symbol.
 *
 * Never throws: an empty value, a value too long for `maxVersion` at the level,
 * or an impossible option is an `{ ok: false }` result naming what went wrong.
 * Deterministic — the same input always yields the same modules, and `"auto"`
 * yields exactly what passing the mask it picked would.
 */
export function encodeQr(value: string, options: QrEncodeOptions = {}): QrEncodeResult {
	const { minVersion = QR_MIN_VERSION, maxVersion = QR_MAX_VERSION, mask = "auto", boostEcc = false } = options;
	let level: QrErrorCorrection = options.errorCorrection ?? "M";

	if (value.length === 0) return { ok: false, error: { kind: "empty" } };
	if (!isVersion(minVersion))
		return { ok: false, error: { kind: "invalid-option", option: "minVersion", value: minVersion } };
	if (!isVersion(maxVersion) || maxVersion < minVersion) {
		return { ok: false, error: { kind: "invalid-option", option: "maxVersion", value: maxVersion } };
	}
	if (mask !== "auto" && !(Number.isInteger(mask) && mask >= 0 && mask <= 7)) {
		return { ok: false, error: { kind: "invalid-option", option: "mask", value: mask } };
	}

	const choice = selectVersion(value, level, minVersion, maxVersion);
	if (!choice.ok) {
		return {
			ok: false,
			error: { kind: "too-long", bytes: choice.units, capacity: choice.capacity, errorCorrection: level },
		};
	}
	const { version, mode } = choice;

	if (boostEcc) {
		const units = unitsOf(value, mode);
		for (const stronger of QR_ERROR_CORRECTIONS.slice(QR_ERROR_CORRECTIONS.indexOf(level) + 1)) {
			if (fits(mode, units, version, stronger)) level = stronger;
		}
	}

	const codewords = buildCodewords(encodeBitStream(value, mode, version, level), version, level);
	const { modules: unmasked, owner, isFunction } = placeData(codewords, version);
	const size = symbolSize(version);

	const finalise = (candidate: QrMask): Uint8Array => {
		const masked = applyMask(unmasked, isFunction, size, candidate);
		placeFormatWord(formatWord(level, candidate), size, (row, col, dark) => {
			masked[row * size + col] = dark;
		});
		return masked;
	};

	const chosen = mask === "auto" ? chooseMask((candidate) => scorePenalty(finalise(candidate), size)) : mask;

	return {
		ok: true,
		matrix: { version, errorCorrection: level, mask: chosen, mode, size, modules: finalise(chosen), owner },
	};
}
