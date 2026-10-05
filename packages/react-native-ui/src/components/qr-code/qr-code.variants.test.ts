import { describe, expect, test } from "bun:test";
import {
	contrastRatio,
	isInvertedQr,
	QR_DEFAULT_COLORS,
	QR_LABEL_MAX,
	QR_SIZE_DP,
	QR_UNAVAILABLE_LABEL,
	qrCodeVariants,
	resolveEffectiveEcc,
	resolveQrLabel,
	resolveQrSize,
	resolveQuietZone,
	shouldWarnContrast,
	shouldWarnMissingLabel,
} from "./qr-code.variants";

describe("resolveEffectiveEcc", () => {
	test("a logo forces H; otherwise the request stands", () => {
		expect(resolveEffectiveEcc("L", true)).toBe("H");
		expect(resolveEffectiveEcc("Q", true)).toBe("H");
		expect(resolveEffectiveEcc("L", false)).toBe("L");
		expect(resolveEffectiveEcc("M", false)).toBe("M");
	});
});

describe("resolveQrLabel", () => {
	test("the caller's label wins outright", () => {
		expect(resolveQrLabel("https://x.co", "Join the Wi-Fi")).toBe("Join the Wi-Fi");
	});

	test("a short value is read in full", () => {
		expect(resolveQrLabel("https://delacour.co.nz")).toBe("QR code: https://delacour.co.nz");
	});

	test("a long value is truncated with an ellipsis", () => {
		const label = resolveQrLabel(`https://x.co/${"a".repeat(500)}`);
		expect(label).toBe(`QR code: ${`https://x.co/${"a".repeat(500)}`.slice(0, QR_LABEL_MAX)}…`);
		expect(QR_LABEL_MAX).toBe(60);
	});

	test("an empty value is unavailable", () => {
		expect(resolveQrLabel("")).toBe(QR_UNAVAILABLE_LABEL);
		expect(QR_UNAVAILABLE_LABEL).toBe("QR code unavailable");
	});
});

describe("contrastRatio", () => {
	test("black on white is 21, a colour on itself is 1", () => {
		expect(contrastRatio("#000", "#fff")).toBeCloseTo(21, 5);
		expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
		expect(contrastRatio("#336699", "#336699")).toBeCloseTo(1, 5);
	});

	test("rgb() parses; a notation it cannot take apart is null", () => {
		expect(contrastRatio("rgb(0, 0, 0)", "rgba(255,255,255,1)")).toBeCloseTo(21, 5);
		expect(contrastRatio("oklch(0.2 0 0)", "#fff")).toBeNull();
		expect(contrastRatio("foreground", "#fff")).toBeNull();
	});
});

describe("isInvertedQr / shouldWarnContrast", () => {
	test("light modules on a dark tile are inverted", () => {
		expect(isInvertedQr("#ffffff", "#000000")).toBe(true);
		expect(isInvertedQr("#000000", "#ffffff")).toBe(false);
		expect(isInvertedQr("oklch(0.9 0 0)", "#000")).toBeNull();
	});

	test("warns for inverted or under 3:1, and never for an unparseable pair", () => {
		expect(shouldWarnContrast("#ffffff", "#000000")).toBe(true);
		expect(shouldWarnContrast("#999999", "#ffffff")).toBe(true);
		expect(shouldWarnContrast("#1d4ed8", "#ffffff")).toBe(false);
		expect(shouldWarnContrast("oklch(0.2 0 0)", "#ffffff")).toBe(false);
	});

	test("the pinned default pair is black on white", () => {
		expect(QR_DEFAULT_COLORS).toEqual({ color: "#000000", backgroundColor: "#ffffff" });
		expect(shouldWarnContrast(QR_DEFAULT_COLORS.color, QR_DEFAULT_COLORS.backgroundColor)).toBe(false);
	});
});

describe("resolveQrSize", () => {
	test("named sizes and a numeric escape hatch", () => {
		expect(QR_SIZE_DP).toEqual({ sm: 128, md: 192, lg: 256 });
		expect(resolveQrSize("sm")).toBe(128);
		expect(resolveQrSize("md")).toBe(192);
		expect(resolveQrSize("lg")).toBe(256);
		expect(resolveQrSize(200)).toBe(200);
	});

	test("nonsense falls back to md", () => {
		expect(resolveQrSize(Number.NaN)).toBe(192);
		expect(resolveQrSize(0)).toBe(192);
		expect(resolveQrSize(-5)).toBe(192);
	});
});

describe("resolveQuietZone", () => {
	test("defaults to the standard's four modules, never negative, whole numbers", () => {
		expect(resolveQuietZone(undefined)).toBe(4);
		expect(resolveQuietZone(2)).toBe(2);
		expect(resolveQuietZone(-1)).toBe(0);
		expect(resolveQuietZone(2.7)).toBe(2);
		expect(resolveQuietZone(Number.NaN)).toBe(4);
	});
});

describe("qrCodeVariants", () => {
	test("the tile is rounded and clips; the logo plate is centred and rounded", () => {
		const { tile, logo, logoContent } = qrCodeVariants();
		expect(tile()).toContain("rounded-lg");
		expect(tile()).toContain("overflow-hidden");
		expect(tile()).not.toMatch(/\bp-|\bbg-/);
		expect(logo()).toContain("absolute");
		expect(logo()).toContain("rounded-lg");
		expect(logoContent()).toContain("items-center");
	});

	test("a caller's corner wins", () => {
		expect(qrCodeVariants().tile({ className: "rounded-none" })).toContain("rounded-none");
		expect(qrCodeVariants().tile({ className: "rounded-none" })).not.toContain("rounded-lg");
	});
});

describe("shouldWarnMissingLabel", () => {
	test("a value with no label warns unless the code is decorative", () => {
		expect(shouldWarnMissingLabel("https://x.co", undefined, false)).toBe(true);
		expect(shouldWarnMissingLabel("https://x.co", "Open the menu", false)).toBe(false);
		expect(shouldWarnMissingLabel("https://x.co", undefined, true)).toBe(false);
		expect(shouldWarnMissingLabel("", undefined, false)).toBe(false);
	});
});
