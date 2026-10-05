import type { ReactNode } from "react";
import type { QrEncodeError, QrErrorCorrection, QrMask, QrVersion } from "./qr-code.constants";
import type { QrModuleStyle } from "./qr-code.path";
import type { QrSize } from "./qr-code.variants";

export type QRCodeProps = {
	/** The string to encode. UTF-8 bytes unless it is all digits or all QR-alphanumeric. */
	value: string;
	/** Default `"M"`. Raised to `"H"` whenever a `QRCode.Logo` is present. */
	errorCorrection?: QrErrorCorrection;
	/** Default `"square"`. Finders stay concentric shapes in every style. */
	moduleStyle?: QrModuleStyle;
	/** Default `"md"`. A number is dp — the tile's side, quiet zone included. */
	size?: QrSize | number;
	/** Quiet-zone width in modules. Default 4, the standard's minimum; below 2 warns. */
	quietZone?: number;
	/** A fixed mask, or `"auto"` (default) for the lowest penalty. */
	mask?: QrMask | "auto";
	/** The smallest version to use. Default 1. */
	minVersion?: QrVersion;
	/** Module colour: a literal or a theme token. Default pinned `#000000`, in both themes. */
	color?: string;
	/** Tile colour: a literal or a theme token. Default pinned `#ffffff`, in both themes. */
	backgroundColor?: string;
	/** The share of the code's side a `QRCode.Logo` may take, 0.1–0.3. Default 0.2. */
	logoSize?: number;
	/** Names the code to assistive tech. Default `"QR code: <value>"`, truncated. */
	accessibilityLabel?: string;
	/** Hide the code from assistive tech — for when its value is printed beside it. */
	isDecorative?: boolean;
	/** Called with the reason when the value cannot be encoded. The tile still renders, empty. */
	onEncodeError?: (error: QrEncodeError) => void;
	/** The tile — corner, margin. Its fill is `backgroundColor`, never a class. */
	className?: string;
	testID?: string;
	/** `QRCode.Logo` only. */
	children?: ReactNode;
};

export type QRCodeLogoProps = {
	className?: string;
	/** The mark — an `Image`, an `Icon`, anything. */
	children: ReactNode;
};
