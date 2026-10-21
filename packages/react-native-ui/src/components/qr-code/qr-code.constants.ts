/**
 * The encoder's vocabulary — tuples, the matrix it produces and the errors it
 * reports. Plain data with no React and no React Native, so every module in the
 * encoder can import it and all of them stay unit-testable.
 */

/** Error-correction levels, weakest first: roughly 7%, 15%, 25% and 30% of codewords recoverable. */
export const QR_ERROR_CORRECTIONS = ["L", "M", "Q", "H"] as const;
export type QrErrorCorrection = (typeof QR_ERROR_CORRECTIONS)[number];

/** The eight data masks the standard defines. */
export const QR_MASKS = [0, 1, 2, 3, 4, 5, 6, 7] as const;
export type QrMask = (typeof QR_MASKS)[number];

/** 1–40, validated at runtime by `encodeQr`. */
export type QrVersion = number;

export type QrMode = "numeric" | "alphanumeric" | "byte";

/** What `encodeQr` takes. Every field is optional. */
export type QrEncodeOptions = {
	/** Default `"M"`. */
	errorCorrection?: QrErrorCorrection;
	/** The smallest version to use. Default 1. */
	minVersion?: QrVersion;
	/** The largest version to try before giving up. Default 40. */
	maxVersion?: QrVersion;
	/** A fixed mask, or `"auto"` (default) for the lowest penalty. */
	mask?: QrMask | "auto";
	/** Raise the level for free when the chosen version still holds the value. Default false. */
	boostEcc?: boolean;
};

/** An encoded symbol: plain data, ready for any renderer. */
export type QrMatrix = {
	version: QrVersion;
	errorCorrection: QrErrorCorrection;
	mask: QrMask;
	mode: QrMode;
	/** Modules per side — `17 + 4 * version`. */
	size: number;
	/** Row-major, `1` = dark, `size * size` long. */
	modules: Uint8Array;
	/** Row-major; `-1` for a function or remainder module, else the index of the codeword that owns it in the interleaved stream. */
	owner: Int16Array;
};

export type QrEncodeError =
	| { kind: "empty" }
	/** `bytes` and `capacity` count the mode's own units — digits, characters or UTF-8 bytes. */
	| { kind: "too-long"; bytes: number; capacity: number; errorCorrection: QrErrorCorrection }
	| { kind: "invalid-option"; option: "minVersion" | "maxVersion" | "mask"; value: number };

/** The encoder's result — a local discriminated union, because the registry cannot assume `@delacour/types`. */
export type QrEncodeResult = { ok: true; matrix: QrMatrix } | { ok: false; error: QrEncodeError };

/** A square of modules, in matrix coordinates (quiet zone excluded). */
export type QrLogoRegion = { start: number; side: number };
