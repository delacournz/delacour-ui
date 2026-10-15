import type { ImageSourcePropType } from "react-native";
import type { AttachmentKind } from "./attachment.variants";

export type { AttachmentKind, AttachmentLayout, AttachmentSize, AttachmentStatus } from "./attachment.variants";

/**
 * What the attachment holds, discriminated by `kind`.
 *
 * `source` is required for an image and impossible for audio or a file, so a
 * photo with no thumbnail is a type error rather than a blank square. A video's
 * `source` is its poster frame, and is optional — with none it shows its glyph.
 */
export type AttachmentMedia =
	| { kind: "image"; source: ImageSourcePropType; width?: number; height?: number }
	| { kind: "video"; source?: ImageSourcePropType; durationMs?: number }
	| { kind: "audio"; durationMs?: number }
	/** `extension` is read from `name` when omitted: `report.pdf` is `PDF`. */
	| { kind: "file"; extension?: string };

/** The media fields every part reads, flattened out of {@link AttachmentMedia}. */
export type AttachmentMediaFields = {
	kind: AttachmentKind;
	source?: ImageSourcePropType;
	durationMs?: number;
	extension?: string;
};

/** Shared by the parts that only take a class and their own children. */
export type AttachmentSlotProps = {
	className?: string;
};
