import { describe, expect, test } from "bun:test";
import { declaredTokens } from "../../styles/theme-tokens.test";
import { ALERT_FOREGROUND_TOKEN, ALERT_STATUSES } from "../alert/alert.variants";
import {
	resolveToastAnnouncement,
	resolveToastDepthStyle,
	resolveToastDrag,
	resolveToastDuration,
	resolveToastEnterDelay,
	resolveToastHaptic,
	resolveToastInterrupts,
	resolveToastRelease,
	resolveToastRole,
	resolveToastStack,
	resolveToastStackedHeight,
	TOAST_DURATION,
	TOAST_ENTER_DISTANCE,
	TOAST_FOREGROUND_TOKEN,
	TOAST_PLACEMENTS,
	TOAST_RUBBER_BAND,
	TOAST_STACK,
	TOAST_STAGGER_MS,
	TOAST_STATUSES,
	TOAST_SWIPE,
	type ToastStackInput,
	toastVariants,
} from "./toast.variants";

const LIGHT = declaredTokens("light");
const DARK = declaredTokens("dark");

/** `border-t` and friends set a width, not a colour, and name no token. */
const STRUCTURAL_BORDER_SUFFIXES = new Set(["t", "b", "l", "r", "x", "y", "s", "e"]);

/** Tailwind's own size steps share the `text-` prefix with colours and name no token. */
const TEXT_SIZES = new Set(["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl"]);

/** Every theme token a class string paints with, with any `/alpha` suffix dropped. */
function colorTokens(cls: string): string[] {
	const tokens: string[] = [];
	for (const [, utility, token] of cls.matchAll(/\b(bg|border|text)-([a-z][\w-]*)(?:\/\d+)?\b/g)) {
		if (utility === "border" && STRUCTURAL_BORDER_SUFFIXES.has(token)) continue;
		if (utility === "text" && TEXT_SIZES.has(token)) continue;
		tokens.push(token);
	}
	return tokens;
}

/** The slots this component declares, pinned so a new one has to be added before the sweeps can miss it. */
const SLOT_NAMES = [
	"viewport",
	"stack",
	"item",
	"root",
	"indicator",
	"content",
	"title",
	"description",
	"action",
	"actionLabel",
	"close",
	"icon",
] as const;

describe("toastVariants", () => {
	test("declares every slot", () => {
		const slots = toastVariants();
		for (const name of SLOT_NAMES) expect(typeof slots[name]).toBe("function");
	});

	test("every token a slot paints with exists in both themes, for every status", () => {
		for (const status of TOAST_STATUSES) {
			const slots = toastVariants({ status });
			for (const name of SLOT_NAMES) {
				for (const token of colorTokens(slots[name]() ?? "")) {
					expect(LIGHT.has(token)).toBe(true);
					expect(DARK.has(token)).toBe(true);
				}
			}
		}
	});

	test("the statuses are Alert's", () => {
		expect(TOAST_STATUSES).toBe(ALERT_STATUSES);
		expect(TOAST_FOREGROUND_TOKEN).toBe(ALERT_FOREGROUND_TOKEN);
	});

	test("the title takes Alert's foreground token per status", () => {
		for (const status of TOAST_STATUSES) {
			expect(toastVariants({ status }).title()).toContain(`text-${ALERT_FOREGROUND_TOKEN[status]}`);
		}
	});

	test("the card is a popover surface with the card corner and a hairline, and no shadow", () => {
		const root = toastVariants().root();
		expect(root).toContain("bg-popover");
		expect(root).toMatch(/\bborder\b/);
		expect(root).toContain("border-border");
		expect(root).toContain("rounded-lg");
		expect(root).toContain("flex-row");
		expect(root).toContain("max-w-[560px]");
		expect(root).not.toMatch(/\bshadow/);
	});

	test("the description is muted whatever the status", () => {
		for (const status of TOAST_STATUSES) {
			expect(toastVariants({ status }).description()).toContain("text-muted-foreground");
		}
	});

	test("the action's label is the primary colour, on the label and not the pressable (rule 1)", () => {
		expect(toastVariants().actionLabel()).toContain("text-primary");
		expect(toastVariants().action()).not.toMatch(/\btext-(?!xs|sm|base)/);
	});

	test("the root holds no text colour (rule 1)", () => {
		expect(toastVariants().root()).not.toMatch(/\btext-/);
	});

	test("a caller's className wins on the card", () => {
		const root = toastVariants().root({ className: "px-6" });
		expect(root).toContain("px-6");
		expect(root).not.toMatch(/\bpx-4\b/);
	});
});

describe("resolveToastDuration", () => {
	const quiet = { isScreenReaderEnabled: false };
	const reader = { isScreenReaderEnabled: true };

	test("defaults to 4000, and 6000 with an action", () => {
		expect(resolveToastDuration({}, quiet)).toBe(TOAST_DURATION.default);
		expect(resolveToastDuration({ hasAction: true }, quiet)).toBe(TOAST_DURATION.withAction);
		expect(TOAST_DURATION).toMatchObject({ default: 4000, withAction: 6000 });
	});

	test("an explicit duration wins, and 0 stays until hidden", () => {
		expect(resolveToastDuration({ duration: 1500 }, quiet)).toBe(1500);
		expect(resolveToastDuration({ duration: 0, hasAction: true }, quiet)).toBe(0);
	});

	test("a loading toast stays until updated unless it says otherwise", () => {
		expect(resolveToastDuration({ isLoading: true }, quiet)).toBe(0);
		expect(resolveToastDuration({ isLoading: true, duration: 2000 }, quiet)).toBe(2000);
	});

	test("nonsense falls back to the default", () => {
		expect(resolveToastDuration({ duration: -1 }, quiet)).toBe(TOAST_DURATION.default);
		expect(resolveToastDuration({ duration: Number.NaN }, quiet)).toBe(TOAST_DURATION.default);
	});

	test("under a screen reader every timed toast stays at least 10 seconds (WCAG 2.2.1)", () => {
		expect(TOAST_DURATION.screenReaderMinimum).toBe(10_000);
		expect(resolveToastDuration({}, reader)).toBe(10_000);
		expect(resolveToastDuration({ duration: 1500 }, reader)).toBe(10_000);
		expect(resolveToastDuration({ duration: 20_000 }, reader)).toBe(20_000);
		expect(resolveToastDuration({ duration: 0 }, reader)).toBe(0);
	});
});

function stackItem(id: string, overrides: Partial<ToastStackInput> = {}): ToastStackInput {
	return { id, placement: "bottom", isExiting: false, ...overrides };
}

describe("resolveToastStack", () => {
	test("newest in front, and at most three drawn", () => {
		const items = ["a", "b", "c", "d", "e"].map((id) => stackItem(id));
		expect(resolveToastStack(items, "bottom")).toEqual([
			{ id: "e", depth: 0, isVisible: true, isExiting: false },
			{ id: "d", depth: 1, isVisible: true, isExiting: false },
			{ id: "c", depth: 2, isVisible: true, isExiting: false },
			{ id: "b", depth: 3, isVisible: false, isExiting: false },
			{ id: "a", depth: 4, isVisible: false, isExiting: false },
		]);
		expect(TOAST_STACK.maxVisible).toBe(3);
	});

	test("only the asked placement", () => {
		const items = [stackItem("a", { placement: "top" }), stackItem("b"), stackItem("c", { placement: "top" })];
		expect(resolveToastStack(items, "top").map((entry) => entry.id)).toEqual(["c", "a"]);
	});

	test("an exiting toast keeps its slot while it leaves and frees it for the queue", () => {
		const items = [stackItem("a"), stackItem("b"), stackItem("c"), stackItem("d", { isExiting: true })];
		expect(resolveToastStack(items, "bottom")).toEqual([
			{ id: "d", depth: 0, isVisible: true, isExiting: true },
			{ id: "c", depth: 0, isVisible: true, isExiting: false },
			{ id: "b", depth: 1, isVisible: true, isExiting: false },
			{ id: "a", depth: 2, isVisible: true, isExiting: false },
		]);
	});

	test("an exiting toast that was never drawn is not drawn on its way out", () => {
		const items = [stackItem("a", { isExiting: true }), stackItem("b"), stackItem("c"), stackItem("d")];
		expect(resolveToastStack(items, "bottom")[3]).toEqual({ id: "a", depth: 3, isVisible: false, isExiting: true });
	});
});

describe("resolveToastDepthStyle", () => {
	test("the front toast is untouched", () => {
		expect(resolveToastDepthStyle(0, "bottom")).toEqual({ translateY: 0, scale: 1, opacity: 1 });
	});

	test("each older toast sits 8pt further toward the entry edge, smaller and fainter", () => {
		expect(resolveToastDepthStyle(1, "bottom")).toEqual({ translateY: 8, scale: 0.95, opacity: 0.75 });
		const top = resolveToastDepthStyle(2, "top");
		expect(top.translateY).toBe(-16);
		expect(top.scale).toBeCloseTo(0.9);
		expect(top.opacity).toBeCloseTo(0.5);
	});
});

describe("resolveToastStackedHeight", () => {
	test("the front toast keeps its own height", () => {
		expect(resolveToastStackedHeight({ depth: 0, natural: 90, front: 60 })).toBe(90);
	});

	test("a toast behind takes the front one's height, so a taller one cannot show over it", () => {
		expect(resolveToastStackedHeight({ depth: 1, natural: 90, front: 60 })).toBe(60);
		expect(resolveToastStackedHeight({ depth: 2, natural: 40, front: 60 })).toBe(60);
	});

	test("moving to the front, it eases from the front's height back to its own", () => {
		expect(resolveToastStackedHeight({ depth: 0.5, natural: 90, front: 60 })).toBe(75);
	});

	test("unmeasured, it is left alone", () => {
		expect(resolveToastStackedHeight({ depth: 1, natural: 0, front: 60 })).toBeNull();
		expect(resolveToastStackedHeight({ depth: 1, natural: 90, front: 0 })).toBeNull();
	});
});

describe("resolveToastEnterDelay", () => {
	test("toasts shown in one tick enter 220ms apart", () => {
		expect(TOAST_STAGGER_MS).toBe(220);
		expect(resolveToastEnterDelay({ createdAt: 0, batchIndex: 0, now: 0 })).toBe(0);
		expect(resolveToastEnterDelay({ createdAt: 0, batchIndex: 2, now: 0 })).toBe(440);
	});

	test("a queued toast drawn later owes no delay", () => {
		expect(resolveToastEnterDelay({ createdAt: 0, batchIndex: 4, now: 5000 })).toBe(0);
	});
});

describe("resolveToastDrag", () => {
	test("sideways and toward the entry edge follow the finger", () => {
		expect(resolveToastDrag({ placement: "bottom", translationX: -50, translationY: 30 })).toEqual({ x: -50, y: 30 });
		expect(resolveToastDrag({ placement: "top", translationX: 0, translationY: -30 })).toEqual({ x: 0, y: -30 });
	});

	test("toward the centre rubber-bands, never past the limit", () => {
		const pulled = resolveToastDrag({ placement: "bottom", translationX: 0, translationY: -400 });
		expect(pulled.y).toBeLessThan(0);
		expect(pulled.y).toBeGreaterThan(-TOAST_RUBBER_BAND);
		const small = resolveToastDrag({ placement: "top", translationX: 0, translationY: 10 });
		expect(small.y).toBeGreaterThan(0);
		expect(small.y).toBeLessThan(10);
	});
});

describe("resolveToastRelease", () => {
	const size = { width: 300, height: 60 };
	const still = { velocityX: 0, velocityY: 0 };

	test("a short drag settles back", () => {
		expect(resolveToastRelease({ placement: "bottom", translationX: 20, translationY: 10, ...still, ...size })).toEqual(
			{ kind: "settle" }
		);
	});

	test("past 40% sideways dismisses that way", () => {
		expect(TOAST_SWIPE.distanceRatio).toBe(0.4);
		expect(resolveToastRelease({ placement: "bottom", translationX: 130, translationY: 0, ...still, ...size })).toEqual(
			{ kind: "dismiss", axis: "x", direction: 1 }
		);
		expect(resolveToastRelease({ placement: "top", translationX: -130, translationY: 0, ...still, ...size })).toEqual({
			kind: "dismiss",
			axis: "x",
			direction: -1,
		});
	});

	test("past 40% of its height toward the entry edge dismisses", () => {
		expect(resolveToastRelease({ placement: "bottom", translationX: 0, translationY: 30, ...still, ...size })).toEqual({
			kind: "dismiss",
			axis: "y",
			direction: 1,
		});
		expect(resolveToastRelease({ placement: "top", translationX: 0, translationY: -30, ...still, ...size })).toEqual({
			kind: "dismiss",
			axis: "y",
			direction: -1,
		});
	});

	test("toward the centre never dismisses, however far", () => {
		expect(
			resolveToastRelease({ placement: "bottom", translationX: 0, translationY: -200, ...still, ...size })
		).toEqual({ kind: "settle" });
		expect(
			resolveToastRelease({
				placement: "top",
				translationX: 0,
				translationY: 200,
				velocityX: 0,
				velocityY: 2000,
				...size,
			})
		).toEqual({ kind: "settle" });
	});

	test("a fling over 800pt/s dismisses however short", () => {
		expect(TOAST_SWIPE.velocity).toBe(800);
		expect(
			resolveToastRelease({
				placement: "bottom",
				translationX: 10,
				translationY: 0,
				velocityX: 900,
				velocityY: 0,
				...size,
			})
		).toEqual({ kind: "dismiss", axis: "x", direction: 1 });
		expect(
			resolveToastRelease({
				placement: "top",
				translationX: 0,
				translationY: -5,
				velocityX: 0,
				velocityY: -900,
				...size,
			})
		).toEqual({ kind: "dismiss", axis: "y", direction: -1 });
	});

	test("the dominant axis wins when both would dismiss", () => {
		expect(
			resolveToastRelease({
				placement: "bottom",
				translationX: 200,
				translationY: 40,
				velocityX: 0,
				velocityY: 0,
				...size,
			})
		).toEqual({ kind: "dismiss", axis: "x", direction: 1 });
	});
});

describe("resolveToastHaptic", () => {
	test("success, warning and destructive play their notification; the rest are silent", () => {
		expect(resolveToastHaptic("success", undefined)).toBe("success");
		expect(resolveToastHaptic("warning", undefined)).toBe("warning");
		expect(resolveToastHaptic("destructive", undefined)).toBe("error");
		expect(resolveToastHaptic("info", undefined)).toBe(false);
		expect(resolveToastHaptic("default", undefined)).toBe(false);
	});

	test("the caller's choice wins, including false", () => {
		expect(resolveToastHaptic("success", false)).toBe(false);
		expect(resolveToastHaptic("default", "light")).toBe("light");
	});
});

describe("accessibility", () => {
	test("the announcement is the title, then the description", () => {
		expect(resolveToastAnnouncement({ title: "Saved" })).toBe("Saved");
		expect(resolveToastAnnouncement({ title: "Upload failed", description: "Try again" })).toBe(
			"Upload failed. Try again"
		);
	});

	test("warnings and failures interrupt; the rest queue", () => {
		expect(resolveToastInterrupts("destructive")).toBe(true);
		expect(resolveToastInterrupts("warning")).toBe(true);
		expect(resolveToastInterrupts("success")).toBe(false);
		expect(resolveToastInterrupts("default")).toBe(false);
	});

	test("only a failure is an alert", () => {
		expect(resolveToastRole("destructive")).toBe("alert");
		expect(resolveToastRole("warning")).toBe("none");
		expect(resolveToastRole("success")).toBe("none");
	});
});

describe("constants", () => {
	test("placements, entrance and stack steps", () => {
		expect(TOAST_PLACEMENTS).toEqual(["top", "bottom"]);
		expect(TOAST_ENTER_DISTANCE).toBe(16);
		expect(TOAST_STACK).toMatchObject({ depthOffset: 8, depthScale: 0.05, depthOpacity: 0.25 });
	});
});
