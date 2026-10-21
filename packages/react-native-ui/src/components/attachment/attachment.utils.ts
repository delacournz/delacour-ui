/**
 * The attachment's pure decisions — sizes and durations as text, what kind a
 * file is, how a long name is cut, and everything a screen reader hears.
 *
 * Free of React Native imports so every one of them is unit-testable. See
 * AGENTS.md.
 */
import type { AttachmentKind, AttachmentStatus } from "./attachment.variants";

/** One entry of an image source, restated structurally so this file imports nothing from React Native. */
export type AttachmentSourceEntry = number | { uri?: string };

/** Anything `Image`'s `source` accepts: one entry or a list of resolutions. */
export type AttachmentSource = AttachmentSourceEntry | readonly AttachmentSourceEntry[];

function sourceEntryKey(entry: AttachmentSourceEntry): string | null {
	if (typeof entry === "number") return `asset:${entry}`;
	return entry.uri ? `uri:${entry.uri}` : null;
}

/**
 * A string that changes exactly when the picture changes, or `null` for none.
 *
 * A failed image is remembered by this key, not by object identity: an inline
 * `source={{ uri }}` is a new object every render, and keyed by identity a dead
 * URL would be retried — and flash — on every one.
 */
export function resolveAttachmentSourceKey(source: AttachmentSource | undefined): string | null {
	if (source === undefined) return null;
	const entries: readonly AttachmentSourceEntry[] = Array.isArray(source) ? source : [source as AttachmentSourceEntry];
	const keys = entries.map(sourceEntryKey).filter((key): key is string => key !== null);
	return keys.length > 0 ? keys.join("|") : null;
}

const BINARY_STEP = 1024;
const SIZE_UNITS = ["B", "KB", "MB", "GB", "TB"] as const;
const SPOKEN_SIZE_UNITS = [
	["byte", "bytes"],
	["kilobyte", "kilobytes"],
	["megabyte", "megabytes"],
	["gigabyte", "gigabytes"],
	["terabyte", "terabytes"],
] as const;

/** The step a byte count is shown in, and its value there, rounded to one decimal. */
function scaleBytes(bytes: number): { value: number; unit: number } {
	let unit = 0;
	let value = bytes;
	while (value >= BINARY_STEP && unit < SIZE_UNITS.length - 1) {
		value /= BINARY_STEP;
		unit += 1;
	}
	// 1,048,575 bytes is 1023.999 KB, which rounds to "1,024 KB" — say "1 MB".
	if (Math.round(value * 10) / 10 >= BINARY_STEP && unit < SIZE_UNITS.length - 1) {
		value /= BINARY_STEP;
		unit += 1;
	}
	return { unit, value };
}

function isByteCount(bytes: number): boolean {
	return Number.isFinite(bytes) && bytes >= 0;
}

/**
 * A byte count as a reader expects it: `1,023 B`, `1.5 KB`, `2.4 MB`.
 *
 * Binary steps (1024) with the familiar `KB`/`MB` labels, which is what every
 * phone's own file browser shows, so the number matches the one the user saw
 * when they picked the file. One decimal at most, none for bytes. A negative or
 * non-finite count is an empty string — there is nothing true to say.
 */
export function formatFileSize(bytes: number, locale?: string): string {
	if (!isByteCount(bytes)) return "";
	const { value, unit } = scaleBytes(bytes);
	const number = new Intl.NumberFormat(locale, { maximumFractionDigits: unit === 0 ? 0 : 1 }).format(value);
	return `${number} ${SIZE_UNITS[unit]}`;
}

/** {@link formatFileSize}, with the unit spelled out for a screen reader: `2.4 megabytes`, `1 kilobyte`. */
export function spokenFileSize(bytes: number, locale?: string): string {
	if (!isByteCount(bytes)) return "";
	const { value, unit } = scaleBytes(bytes);
	const rounded = unit === 0 ? Math.round(value) : Math.round(value * 10) / 10;
	const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(rounded);
	const [one, many] = SPOKEN_SIZE_UNITS[unit] ?? SPOKEN_SIZE_UNITS[0];
	return `${number} ${rounded === 1 ? one : many}`;
}

function durationParts(ms: number): { hours: number; minutes: number; seconds: number } {
	const total = Number.isFinite(ms) && ms > 0 ? Math.floor(ms / 1000) : 0;
	return { hours: Math.floor(total / 3600), minutes: Math.floor((total % 3600) / 60), seconds: total % 60 };
}

/** A clip's length as a player shows it: `0:00`, `1:05`, `1:02:05`. Negatives clamp to zero. */
export function formatDuration(ms: number): string {
	const { hours, minutes, seconds } = durationParts(ms);
	const ss = String(seconds).padStart(2, "0");
	if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${ss}`;
	return `${minutes}:${ss}`;
}

function unitPhrase(count: number, unit: string): string {
	return `${count} ${unit}${count === 1 ? "" : "s"}`;
}

/**
 * {@link formatDuration} as words: `1 minute 5 seconds`.
 *
 * `1:05` is read aloud as "one oh five", which is a time of day, not a length.
 */
export function spokenDuration(ms: number): string {
	const { hours, minutes, seconds } = durationParts(ms);
	const parts: string[] = [];
	if (hours > 0) parts.push(unitPhrase(hours, "hour"));
	if (minutes > 0) parts.push(unitPhrase(minutes, "minute"));
	if (seconds > 0 || parts.length === 0) parts.push(unitPhrase(seconds, "second"));
	return parts.join(" ");
}

/**
 * The lowercased last segment after a dot — `a.tar.gz` is `gz`.
 *
 * A leading dot is a hidden file's name, not an extension, so `.env` has none;
 * nor does a name ending in a dot.
 */
export function resolveFileExtension(name: string): string | undefined {
	const dot = name.lastIndexOf(".");
	if (dot <= 0 || dot === name.length - 1) return undefined;
	return name.slice(dot + 1).toLowerCase();
}

const EXTENSION_KIND: Record<string, AttachmentKind> = {
	avif: "image",
	bmp: "image",
	gif: "image",
	heic: "image",
	heif: "image",
	jpeg: "image",
	jpg: "image",
	png: "image",
	svg: "image",
	tif: "image",
	tiff: "image",
	webp: "image",
	"3gp": "video",
	avi: "video",
	m4v: "video",
	mkv: "video",
	mov: "video",
	mp4: "video",
	webm: "video",
	aac: "audio",
	aiff: "audio",
	caf: "audio",
	flac: "audio",
	m4a: "audio",
	mp3: "audio",
	ogg: "audio",
	opus: "audio",
	wav: "audio",
};

/**
 * What a picked file is, from its MIME type, else its extension.
 *
 * The MIME type decides first because a picker reports it and a name can lie.
 * A generic one — `application/octet-stream`, which document pickers hand back
 * for anything they do not recognise — falls through to the extension, which
 * is how an `IMG_0001.HEIC` with no type still reads as a photo.
 */
export function resolveAttachmentKind(mimeType: string | undefined, name: string): AttachmentKind {
	const family = mimeType?.toLowerCase().split("/")[0];
	if (family === "image" || family === "video" || family === "audio") return family;
	const extension = resolveFileExtension(name);
	return (extension && EXTENSION_KIND[extension]) || "file";
}

const ELLIPSIS = "…";

/**
 * Cuts a name to `max` characters in the middle, keeping its extension:
 * `report-q3-final.pdf` at 12 is `repo…nal.pdf`.
 *
 * For a place with a character budget and no layout — a notification, a
 * spoken summary. `Attachment.Name` on screen uses the platform's own middle
 * ellipsis instead, which cuts by measured width. An extension too long to
 * leave room for a stem either side of the ellipsis is cut with the rest.
 */
export function truncateMiddle(name: string, max: number): string {
	if (name.length <= max) return name;
	if (max <= 1) return ELLIPSIS.slice(0, Math.max(0, max));

	const extension = resolveFileExtension(name);
	const suffix = extension ? name.slice(name.length - extension.length - 1) : "";
	const keepsSuffix = suffix.length > 0 && max - 1 - suffix.length >= 2;
	const stem = keepsSuffix ? name.slice(0, name.length - suffix.length) : name;
	const tail = keepsSuffix ? suffix : "";

	const budget = max - 1 - tail.length;
	const head = Math.ceil(budget / 2);
	const back = budget - head;
	return `${stem.slice(0, head)}${ELLIPSIS}${back > 0 ? stem.slice(stem.length - back) : ""}${tail}`;
}

/** An upload fraction held inside 0..1. `NaN` or nothing is indeterminate — `undefined`. */
export function clampProgress(value: number | undefined): number | undefined {
	if (value === undefined || Number.isNaN(value)) return undefined;
	return Math.min(1, Math.max(0, value));
}

/**
 * The percentage a screen reader is told, in ten-percent steps: `0.44` is 40.
 *
 * An upload reports many times a second, and every distinct value would be
 * announced. Eleven values from start to finish is about what a listener can
 * take in.
 */
export function resolveProgressAnnouncement(progress: number): number {
	const clamped = clampProgress(progress) ?? 0;
	return Math.round(clamped * 10) * 10;
}

/** The line under an attachment's name: `2.4 MB · PDF`, `1:05 · 1 KB`, or the error. */
export function resolveAttachmentMeta({
	kind,
	status,
	sizeBytes,
	durationMs,
	extension,
	locale,
}: {
	kind: AttachmentKind;
	status: AttachmentStatus;
	sizeBytes?: number;
	durationMs?: number;
	extension?: string;
	locale?: string;
}): string {
	if (status.type === "error") return status.message;
	const parts: string[] = [];
	if ((kind === "video" || kind === "audio") && durationMs !== undefined) parts.push(formatDuration(durationMs));
	if (sizeBytes !== undefined) parts.push(formatFileSize(sizeBytes, locale));
	if (kind === "file" && extension) parts.push(extension.toUpperCase());
	return parts.filter(Boolean).join(" · ");
}

const KIND_WORD: Record<AttachmentKind, string> = {
	image: "Photo",
	video: "Video",
	audio: "Audio",
	file: "File",
};

/**
 * Everything an attachment says as one accessibility element:
 * `Photo, vacation.jpg, 2.4 megabytes, uploading`.
 *
 * The upload's percentage is not in it — that is the root's
 * `accessibilityValue` ({@link resolveAttachmentAccessibilityValue}), which is
 * read after the label. Kept apart so the label stays still while the value
 * moves, and the value moves only in ten-percent steps.
 */
export function resolveAttachmentAccessibilityLabel({
	kind,
	name,
	status,
	sizeBytes,
	durationMs,
	locale,
}: {
	kind: AttachmentKind;
	name: string;
	status: AttachmentStatus;
	sizeBytes?: number;
	durationMs?: number;
	locale?: string;
}): string {
	const parts: string[] = [KIND_WORD[kind], name];
	if ((kind === "video" || kind === "audio") && durationMs !== undefined) parts.push(spokenDuration(durationMs));
	if (sizeBytes !== undefined) parts.push(spokenFileSize(sizeBytes, locale));
	switch (status.type) {
		case "idle":
			parts.push("not sent");
			break;
		case "uploading":
			parts.push("uploading");
			break;
		case "error":
			parts.push("upload failed", status.message);
			break;
		case "done":
			break;
	}
	return parts.filter(Boolean).join(", ");
}

/** The root's `accessibilityValue` — the upload's ten-percent step, or none. */
export function resolveAttachmentAccessibilityValue(
	status: AttachmentStatus
): { min: number; max: number; now: number } | undefined {
	if (status.type !== "uploading") return undefined;
	const progress = clampProgress(status.progress);
	if (progress === undefined) return undefined;
	return { max: 100, min: 0, now: resolveProgressAnnouncement(progress) };
}

/**
 * Whether the attachment responds to a press right now.
 *
 * A handler makes it interactive whatever the upload is doing — opening a file
 * that is still uploading is the app's call. Disabled never is.
 */
export function resolveAttachmentInteractive({
	onPress,
	onLongPress,
	isDisabled,
}: {
	onPress?: () => void;
	onLongPress?: () => void;
	isDisabled?: boolean;
	status: AttachmentStatus;
}): boolean {
	if (isDisabled) return false;
	return onPress !== undefined || onLongPress !== undefined;
}

/**
 * The role the root announces: `button` with a handler — disabled included,
 * where it is a dimmed button — `image` for a picture, `text` for the rest.
 */
export function resolveAttachmentRole({
	hasHandler,
	kind,
}: {
	hasHandler: boolean;
	kind: AttachmentKind;
}): "button" | "image" | "text" {
	if (hasHandler) return "button";
	return kind === "image" ? "image" : "text";
}

/** What the remove control is called: `Remove report.pdf`, or `Cancel upload` while uploading. */
export function resolveRemoveLabel({
	name,
	status,
	label,
}: {
	name: string;
	status: AttachmentStatus;
	label?: string;
}): string {
	if (label) return label;
	return status.type === "uploading" ? "Cancel upload" : `Remove ${name}`;
}

/** One entry of the root's `accessibilityActions`. */
export type AttachmentAccessibilityAction = {
	name: "activate" | "longpress" | "retry" | "remove";
	label?: string;
};

/**
 * The actions the root offers a screen reader.
 *
 * Remove and retry are actions on the one element rather than elements of their
 * own: iOS folds every descendant of an accessible view into it, so a button
 * inside could never be reached by swipe. The press target is a child of the
 * root rather than the root, so `activate` and `longpress` are declared here
 * too and routed to the handlers.
 */
export function resolveAttachmentActions({
	status,
	hasPress,
	hasLongPress,
	hasRemove,
	hasRetry,
	removeLabel,
}: {
	status: AttachmentStatus;
	hasPress?: boolean;
	hasLongPress?: boolean;
	hasRemove?: boolean;
	hasRetry?: boolean;
	removeLabel: string;
}): AttachmentAccessibilityAction[] {
	const actions: AttachmentAccessibilityAction[] = [];
	if (hasPress) actions.push({ name: "activate" });
	if (hasLongPress) actions.push({ name: "longpress" });
	if (hasRetry && status.type === "error") actions.push({ label: "Retry upload", name: "retry" });
	if (hasRemove) actions.push({ label: removeLabel, name: "remove" });
	return actions;
}
