import { describe, expect, test } from "bun:test";
import {
	clampProgress,
	formatDuration,
	formatFileSize,
	resolveAttachmentAccessibilityLabel,
	resolveAttachmentAccessibilityValue,
	resolveAttachmentActions,
	resolveAttachmentInteractive,
	resolveAttachmentKind,
	resolveAttachmentMeta,
	resolveAttachmentRole,
	resolveFileExtension,
	resolveProgressAnnouncement,
	resolveRemoveLabel,
	spokenDuration,
	spokenFileSize,
	truncateMiddle,
} from "./attachment.utils";
import { ATTACHMENT_KINDS } from "./attachment.variants";

describe("formatFileSize", () => {
	test("binary steps with KB and MB labels", () => {
		expect(formatFileSize(0, "en-US")).toBe("0 B");
		expect(formatFileSize(1023, "en-US")).toBe("1,023 B");
		expect(formatFileSize(1024, "en-US")).toBe("1 KB");
		expect(formatFileSize(1536, "en-US")).toBe("1.5 KB");
		expect(formatFileSize(2_516_582, "en-US")).toBe("2.4 MB");
		expect(formatFileSize(3 * 1024 ** 3, "en-US")).toBe("3 GB");
	});

	test("a step never rounds up to 1,024 of itself", () => {
		expect(formatFileSize(1024 * 1024 - 1, "en-US")).toBe("1 MB");
	});

	test("nothing to say about a size that is not one", () => {
		expect(formatFileSize(-1)).toBe("");
		expect(formatFileSize(Number.NaN)).toBe("");
		expect(formatFileSize(Number.POSITIVE_INFINITY)).toBe("");
	});

	test("the locale picks the separators", () => {
		expect(formatFileSize(1536, "de-DE")).toBe("1,5 KB");
	});
});

describe("spokenFileSize", () => {
	test("units are words, singular at one", () => {
		expect(spokenFileSize(2_516_582, "en-US")).toBe("2.4 megabytes");
		expect(spokenFileSize(1024, "en-US")).toBe("1 kilobyte");
		expect(spokenFileSize(1, "en-US")).toBe("1 byte");
		expect(spokenFileSize(512, "en-US")).toBe("512 bytes");
		expect(spokenFileSize(-1)).toBe("");
	});
});

describe("formatDuration", () => {
	test("minutes and seconds, hours only when there are some", () => {
		expect(formatDuration(0)).toBe("0:00");
		expect(formatDuration(65_000)).toBe("1:05");
		expect(formatDuration(3_725_000)).toBe("1:02:05");
		expect(formatDuration(59_999)).toBe("0:59");
	});

	test("negatives and nonsense clamp to zero", () => {
		expect(formatDuration(-5000)).toBe("0:00");
		expect(formatDuration(Number.NaN)).toBe("0:00");
	});
});

describe("spokenDuration", () => {
	test("reads as words, skipping empty units", () => {
		expect(spokenDuration(65_000)).toBe("1 minute 5 seconds");
		expect(spokenDuration(120_000)).toBe("2 minutes");
		expect(spokenDuration(3_725_000)).toBe("1 hour 2 minutes 5 seconds");
		expect(spokenDuration(0)).toBe("0 seconds");
	});
});

describe("resolveFileExtension", () => {
	test("the last segment, lowercased", () => {
		expect(resolveFileExtension("a.tar.gz")).toBe("gz");
		expect(resolveFileExtension("Report.PDF")).toBe("pdf");
	});

	test("a dotfile or a bare name has none", () => {
		expect(resolveFileExtension(".env")).toBeUndefined();
		expect(resolveFileExtension("noext")).toBeUndefined();
		expect(resolveFileExtension("trailing.")).toBeUndefined();
	});
});

describe("resolveAttachmentKind", () => {
	test("the MIME type decides first", () => {
		expect(resolveAttachmentKind("image/png", "x")).toBe("image");
		expect(resolveAttachmentKind("video/mp4", "x")).toBe("video");
		expect(resolveAttachmentKind("audio/m4a", "x")).toBe("audio");
		expect(resolveAttachmentKind("IMAGE/JPEG", "x")).toBe("image");
	});

	test("an unknown or generic MIME type falls back to the extension", () => {
		expect(resolveAttachmentKind(undefined, "IMG_0001.HEIC")).toBe("image");
		expect(resolveAttachmentKind("application/octet-stream", "clip.mov")).toBe("video");
		expect(resolveAttachmentKind(undefined, "memo.m4a")).toBe("audio");
	});

	test("anything else is a file", () => {
		expect(resolveAttachmentKind("application/pdf", "report.pdf")).toBe("file");
		expect(resolveAttachmentKind(undefined, "noext")).toBe("file");
	});
});

describe("truncateMiddle", () => {
	test("keeps the extension and cuts the middle", () => {
		expect(truncateMiddle("report-q3-final.pdf", 12)).toBe("repo…nal.pdf");
	});

	test("never longer than the budget", () => {
		for (const max of [3, 5, 8, 12, 20]) {
			expect(truncateMiddle("a-very-long-file-name-indeed.jpeg", max).length).toBeLessThanOrEqual(max);
		}
	});

	test("short names come back unchanged", () => {
		expect(truncateMiddle("a.pdf", 12)).toBe("a.pdf");
		expect(truncateMiddle("exactly12.ab", 12)).toBe("exactly12.ab");
	});

	test("an extension too long to keep is cut like the rest", () => {
		const out = truncateMiddle("x.abcdefghijklmnop", 8);
		expect(out.length).toBe(8);
		expect(out).toContain("…");
	});

	test("a name with no extension is cut in the middle", () => {
		expect(truncateMiddle("abcdefghijklmnop", 7)).toBe("abc…nop");
	});
});

describe("clampProgress", () => {
	test("clamps into 0..1 and drops what is not a number", () => {
		expect(clampProgress(1.2)).toBe(1);
		expect(clampProgress(-1)).toBe(0);
		expect(clampProgress(0.4)).toBe(0.4);
		expect(clampProgress(Number.NaN)).toBeUndefined();
		expect(clampProgress(undefined)).toBeUndefined();
	});
});

describe("resolveProgressAnnouncement", () => {
	test("rounds to the nearest ten percent", () => {
		expect(resolveProgressAnnouncement(0.44)).toBe(40);
		expect(resolveProgressAnnouncement(0.46)).toBe(50);
		expect(resolveProgressAnnouncement(0)).toBe(0);
		expect(resolveProgressAnnouncement(1)).toBe(100);
		expect(resolveProgressAnnouncement(1.7)).toBe(100);
	});

	test("a hundred ticks of 1% announce eleven distinct values", () => {
		const steps = new Set(Array.from({ length: 101 }, (_, i) => resolveProgressAnnouncement(i / 100)));
		expect(steps.size).toBe(11);
	});
});

describe("resolveAttachmentMeta", () => {
	test("size, then the extension for a file", () => {
		expect(
			resolveAttachmentMeta({
				extension: "pdf",
				kind: "file",
				locale: "en-US",
				sizeBytes: 2_516_582,
				status: { type: "done" },
			})
		).toBe("2.4 MB · PDF");
	});

	test("duration leads for video and audio", () => {
		expect(
			resolveAttachmentMeta({ durationMs: 65_000, kind: "audio", locale: "en-US", status: { type: "idle" } })
		).toBe("1:05");
		expect(
			resolveAttachmentMeta({
				durationMs: 65_000,
				kind: "video",
				locale: "en-US",
				sizeBytes: 1024,
				status: { type: "done" },
			})
		).toBe("1:05 · 1 KB");
	});

	test("an error replaces it with the message", () => {
		expect(
			resolveAttachmentMeta({ kind: "image", sizeBytes: 10, status: { message: "Too large", type: "error" } })
		).toBe("Too large");
	});

	test("nothing known is an empty string", () => {
		expect(resolveAttachmentMeta({ kind: "image", status: { type: "done" } })).toBe("");
	});
});

describe("resolveAttachmentAccessibilityLabel", () => {
	const base = { locale: "en-US", name: "vacation.jpg", sizeBytes: 2_516_582 } as const;

	test("kind, name, size, then the status", () => {
		expect(
			resolveAttachmentAccessibilityLabel({ ...base, kind: "image", status: { progress: 0.4, type: "uploading" } })
		).toBe("Photo, vacation.jpg, 2.4 megabytes, uploading");
	});

	test("every kind × status cell names the kind and the file", () => {
		const statuses = [
			{ type: "idle" },
			{ progress: 0.5, type: "uploading" },
			{ type: "uploading" },
			{ message: "Network lost", type: "error" },
			{ type: "done" },
		] as const;
		const words = { audio: "Audio", file: "File", image: "Photo", video: "Video" } as const;
		for (const kind of ATTACHMENT_KINDS) {
			for (const status of statuses) {
				const label = resolveAttachmentAccessibilityLabel({ ...base, kind, status });
				expect(label.startsWith(`${words[kind]}, vacation.jpg`)).toBe(true);
			}
		}
	});

	test("idle is waiting, error carries its message, done says nothing more", () => {
		expect(resolveAttachmentAccessibilityLabel({ kind: "file", name: "a.pdf", status: { type: "idle" } })).toBe(
			"File, a.pdf, not sent"
		);
		expect(
			resolveAttachmentAccessibilityLabel({
				kind: "file",
				name: "a.pdf",
				status: { message: "Network lost", type: "error" },
			})
		).toBe("File, a.pdf, upload failed, Network lost");
		expect(resolveAttachmentAccessibilityLabel({ kind: "file", name: "a.pdf", status: { type: "done" } })).toBe(
			"File, a.pdf"
		);
	});

	test("a recording reads its duration", () => {
		expect(
			resolveAttachmentAccessibilityLabel({
				durationMs: 65_000,
				kind: "audio",
				name: "memo.m4a",
				status: { type: "done" },
			})
		).toBe("Audio, memo.m4a, 1 minute 5 seconds");
	});
});

describe("resolveAttachmentAccessibilityValue", () => {
	test("determinate upload publishes its ten-percent step", () => {
		expect(resolveAttachmentAccessibilityValue({ progress: 0.44, type: "uploading" })).toEqual({
			max: 100,
			min: 0,
			now: 40,
		});
	});

	test("every other state publishes none", () => {
		expect(resolveAttachmentAccessibilityValue({ type: "uploading" })).toBeUndefined();
		expect(resolveAttachmentAccessibilityValue({ type: "done" })).toBeUndefined();
		expect(resolveAttachmentAccessibilityValue({ message: "x", type: "error" })).toBeUndefined();
	});
});

describe("resolveAttachmentInteractive", () => {
	const noop = () => {};

	test("a handler makes it interactive, whatever the status", () => {
		expect(resolveAttachmentInteractive({ onPress: noop, status: { type: "uploading" } })).toBe(true);
		expect(resolveAttachmentInteractive({ onLongPress: noop, status: { type: "done" } })).toBe(true);
	});

	test("disabled never is, and nothing to do is not", () => {
		expect(resolveAttachmentInteractive({ isDisabled: true, onPress: noop, status: { type: "done" } })).toBe(false);
		expect(resolveAttachmentInteractive({ status: { type: "done" } })).toBe(false);
	});
});

describe("resolveAttachmentRole", () => {
	test("a button with a handler, an image for a picture, text for the rest", () => {
		expect(resolveAttachmentRole({ hasHandler: true, kind: "file" })).toBe("button");
		expect(resolveAttachmentRole({ hasHandler: false, kind: "image" })).toBe("image");
		expect(resolveAttachmentRole({ hasHandler: false, kind: "video" })).toBe("text");
	});
});

describe("resolveRemoveLabel", () => {
	test("names the file, or cancels an upload", () => {
		expect(resolveRemoveLabel({ name: "a.pdf", status: { type: "done" } })).toBe("Remove a.pdf");
		expect(resolveRemoveLabel({ name: "a.pdf", status: { progress: 0.2, type: "uploading" } })).toBe("Cancel upload");
	});

	test("the caller's label wins", () => {
		expect(resolveRemoveLabel({ label: "Delete", name: "a.pdf", status: { type: "uploading" } })).toBe("Delete");
	});
});

describe("resolveAttachmentActions", () => {
	test("remove when there is a handler, retry only in error", () => {
		expect(
			resolveAttachmentActions({
				hasRemove: true,
				hasRetry: true,
				removeLabel: "Remove a",
				status: { type: "done" },
			})
		).toEqual([{ label: "Remove a", name: "remove" }]);
		expect(
			resolveAttachmentActions({
				hasRemove: true,
				hasRetry: true,
				removeLabel: "Remove a",
				status: { message: "x", type: "error" },
			})
		).toEqual([
			{ label: "Retry upload", name: "retry" },
			{ label: "Remove a", name: "remove" },
		]);
	});

	test("a pressable root also declares activate and longpress", () => {
		expect(
			resolveAttachmentActions({
				hasLongPress: true,
				hasPress: true,
				removeLabel: "Remove a",
				status: { type: "done" },
			}).map((action) => action.name)
		).toEqual(["activate", "longpress"]);
	});
});
