import { useMemo } from "react";
import type { QrEncodeOptions, QrEncodeResult } from "./qr-code.constants";
import { encodeQr } from "./qr-code.encode";

/**
 * `encodeQr`, memoised on the value and each option — for a custom renderer
 * (Skia, a printed label) that wants the matrix without the tile.
 */
export function useQRCode(value: string, options: QrEncodeOptions = {}): QrEncodeResult {
	const { errorCorrection, minVersion, maxVersion, mask, boostEcc } = options;
	return useMemo(
		() => encodeQr(value, { errorCorrection, minVersion, maxVersion, mask, boostEcc }),
		[value, errorCorrection, minVersion, maxVersion, mask, boostEcc]
	);
}
