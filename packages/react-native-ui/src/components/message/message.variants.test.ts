import { describe, expect, test } from "bun:test";
import { declaredTokens } from "../../styles/theme-tokens.test";
import {
	MESSAGE_DIRECTIONS,
	MESSAGE_FILL_FOREGROUND,
	MESSAGE_POSITIONS,
	MESSAGE_REACTION_PLACEMENTS,
	MESSAGE_SIZES,
	MESSAGE_STATUS_TOKEN,
	MESSAGE_STATUS_TYPES,
	MESSAGE_TONES,
	type MessageCorners,
	messageVariants,
	resolveMessageCornerClass,
	resolveMessageCorners,
	resolveMessageSpacing,
} from "./message.variants";

const LIGHT = declaredTokens("light");
const DARK = declaredTokens("dark");

/** The `bg-*` token a class string fills with, minus the prefix. */
function fillToken(cls: string): string | undefined {
	return cls.match(/\bbg-([a-z-]+)\b/)?.[1];
}

/** The `text-*` colour token a class string resolves to, minus the prefix. */
function colorToken(cls: string): string | undefined {
	return cls.match(/\btext-((?:[a-z]+-)*(?:foreground|background|primary|info|destructive))\b/)?.[1];
}

/** Every semantic colour token a class string names, across `bg-`, `text-`, `border-` and `outline-`. */
function colourTokens(cls: string): string[] {
	const tokens: string[] = [];
	for (const [, , token] of cls.matchAll(/\b(bg|text|border|outline)-([a-z]+(?:-[a-z]+)*)\b/g)) {
		if (token === undefined) continue;
		if (/^(xs|sm|base|lg|xl|\d)/.test(token) || token === "transparent") continue;
		tokens.push(token);
	}
	return tokens;
}

function everySlotClass(): string[] {
	const out: string[] = [];
	for (const direction of MESSAGE_DIRECTIONS) {
		for (const tone of MESSAGE_TONES) {
			for (const size of MESSAGE_SIZES) {
				for (const isSelected of [false, true]) {
					for (const isFailed of [false, true]) {
						const slots = messageVariants({ direction, tone, size, isSelected, isFailed });
						out.push(
							slots.root(),
							slots.column(),
							slots.bubble(),
							slots.text(),
							slots.author(),
							slots.timestamp(),
							slots.status(),
							slots.statusLabel(),
							slots.retry(),
							slots.typingDot()
						);
					}
				}
			}
		}
	}
	return out;
}

const HAS_ABOVE: ReadonlySet<string> = new Set(["middle", "last"]);
const HAS_BELOW: ReadonlySet<string> = new Set(["first", "middle"]);

describe("resolveMessageCorners", () => {
	const corners = (direction: (typeof MESSAGE_DIRECTIONS)[number], position: (typeof MESSAGE_POSITIONS)[number]) =>
		resolveMessageCorners(direction, position);

	test("a single message is round on every corner", () => {
		for (const direction of MESSAGE_DIRECTIONS) {
			expect(corners(direction, "single")).toEqual({
				topStart: "lg",
				topEnd: "lg",
				bottomStart: "lg",
				bottomEnd: "lg",
			});
		}
	});

	test("outgoing joins on the end side", () => {
		expect(corners("outgoing", "first")).toEqual({ topStart: "lg", topEnd: "lg", bottomStart: "lg", bottomEnd: "sm" });
		expect(corners("outgoing", "middle")).toEqual({
			topStart: "lg",
			topEnd: "sm",
			bottomStart: "lg",
			bottomEnd: "sm",
		});
		expect(corners("outgoing", "last")).toEqual({ topStart: "lg", topEnd: "sm", bottomStart: "lg", bottomEnd: "lg" });
	});

	test("incoming mirrors outgoing exactly", () => {
		for (const position of MESSAGE_POSITIONS) {
			const out = corners("outgoing", position);
			expect(corners("incoming", position)).toEqual({
				topStart: out.topEnd,
				topEnd: out.topStart,
				bottomStart: out.bottomEnd,
				bottomEnd: out.bottomStart,
			});
		}
	});

	const RUN_SIDES = MESSAGE_DIRECTIONS.flatMap((direction) =>
		MESSAGE_POSITIONS.map((position) => [direction, position] as const)
	);

	test.each(RUN_SIDES)("%s %s: a joined corner always faces a neighbour", (direction, position) => {
		const c = corners(direction, position);
		const [top, bottom] = direction === "outgoing" ? [c.topEnd, c.bottomEnd] : [c.topStart, c.bottomStart];
		expect(top).toBe(HAS_ABOVE.has(position) ? "sm" : "lg");
		expect(bottom).toBe(HAS_BELOW.has(position) ? "sm" : "lg");
	});
});

describe("resolveMessageCornerClass", () => {
	test("logical classes, base first so tailwind-merge keeps the steps", () => {
		const all: MessageCorners = { topStart: "sm", topEnd: "sm", bottomStart: "sm", bottomEnd: "sm" };
		expect(resolveMessageCornerClass(all)).toBe("rounded-2xl rounded-ss-md rounded-se-md rounded-es-md rounded-ee-md");
	});

	test("a round corner adds nothing past the base", () => {
		expect(resolveMessageCornerClass(resolveMessageCorners("outgoing", "single"))).toBe("rounded-2xl");
	});

	test("never a physical corner class, so RTL mirrors", () => {
		for (const direction of MESSAGE_DIRECTIONS) {
			for (const position of MESSAGE_POSITIONS) {
				expect(resolveMessageCornerClass(resolveMessageCorners(direction, position))).not.toMatch(
					/rounded-(tl|tr|bl|br|l|r|t|b)-/
				);
			}
		}
	});

	test("the bubble slot keeps the stepped corners after the tv merge", () => {
		const cornerClass = resolveMessageCornerClass(resolveMessageCorners("outgoing", "middle"));
		const bubble = messageVariants({ direction: "outgoing" }).bubble({ className: cornerClass });
		expect(bubble).toContain("rounded-2xl");
		expect(bubble).toContain("rounded-se-md");
		expect(bubble).toContain("rounded-ee-md");
	});
});

describe("resolveMessageSpacing", () => {
	test("a run sits tight, the end of a run breathes", () => {
		expect(resolveMessageSpacing("first")).toBe("mb-0.5");
		expect(resolveMessageSpacing("middle")).toBe("mb-0.5");
		expect(resolveMessageSpacing("last")).toBe("mb-2");
		expect(resolveMessageSpacing("single")).toBe("mb-2");
	});

	test("the root slot carries it", () => {
		for (const position of MESSAGE_POSITIONS) {
			expect(messageVariants({ position }).root()).toContain(resolveMessageSpacing(position));
		}
	});
});

describe("messageVariants — fills", () => {
	test("outgoing is the primary fill", () => {
		expect(fillToken(messageVariants({ direction: "outgoing" }).bubble())).toBe("primary");
	});

	test("incoming is muted, and accent swaps it to secondary", () => {
		expect(fillToken(messageVariants({ direction: "incoming" }).bubble())).toBe("muted");
		expect(fillToken(messageVariants({ direction: "incoming", tone: "accent" }).bubble())).toBe("secondary");
	});

	test("plain drops the fill and the padding", () => {
		for (const direction of MESSAGE_DIRECTIONS) {
			const bubble = messageVariants({ direction, tone: "plain" }).bubble();
			expect(bubble).toContain("bg-transparent");
			expect(bubble).toMatch(/\bp-0\b/);
			expect(bubble).not.toMatch(/\bp[xy]-/);
		}
	});

	test("every bubble's text is its fill's foreground pair", () => {
		for (const direction of MESSAGE_DIRECTIONS) {
			for (const tone of MESSAGE_TONES) {
				const slots = messageVariants({ direction, tone });
				const fill = fillToken(slots.bubble());
				expect(fill).toBeDefined();
				expect(colorToken(slots.text())).toBe(MESSAGE_FILL_FOREGROUND[fill as keyof typeof MESSAGE_FILL_FOREGROUND]);
			}
		}
	});

	test("the foreground map names each fill's real pair", () => {
		expect(MESSAGE_FILL_FOREGROUND).toEqual({
			primary: "primary-foreground",
			muted: "foreground",
			secondary: "secondary-foreground",
			transparent: "foreground",
		});
	});
});

describe("messageVariants — states", () => {
	test("failed draws a destructive edge on the bubble", () => {
		const bubble = messageVariants({ direction: "outgoing", isFailed: true }).bubble();
		expect(bubble).toContain("border");
		expect(bubble).toContain("border-destructive");
	});

	test("sending dims the bubble", () => {
		expect(messageVariants({ direction: "outgoing", isSending: true }).bubble()).toContain("opacity-70");
	});

	test("selected tints the row and outlines the bubble without moving it", () => {
		const slots = messageVariants({ isSelected: true });
		expect(slots.root()).toContain("bg-accent");
		expect(slots.bubble()).toContain("outline-2");
		expect(slots.bubble()).toContain("outline-ring");
		expect(slots.bubble()).not.toMatch(/\bborder-2\b/);
	});

	test("media-only drops the padding and clips", () => {
		const bubble = messageVariants({ direction: "incoming", isMedia: true }).bubble();
		expect(bubble).toMatch(/\bp-0\b/);
		expect(bubble).toContain("overflow-hidden");
	});

	test("size steps the text and the padding together", () => {
		const text = MESSAGE_SIZES.map(
			(size) =>
				messageVariants({ size })
					.text()
					.match(/\btext-(sm|base|lg)\b/)?.[1]
		);
		expect(text).toEqual(["sm", "base", "lg"]);
		const padding = MESSAGE_SIZES.map(
			(size) =>
				messageVariants({ size })
					.bubble()
					.match(/\bpx-([\d.]+)\b/)?.[1]
		);
		expect(padding).toEqual(["3", "3.5", "4"]);
	});
});

describe("messageVariants — layout", () => {
	test("no self-* on the root: the row never pins its own alignment", () => {
		for (const direction of MESSAGE_DIRECTIONS) {
			expect(messageVariants({ direction }).root()).not.toMatch(/\bself-/);
		}
	});

	test("the row aligns by direction", () => {
		expect(messageVariants({ direction: "outgoing" }).root()).toContain("justify-end");
		expect(messageVariants({ direction: "incoming" }).root()).toContain("justify-start");
		expect(messageVariants({ direction: "outgoing" }).column()).toContain("items-end");
		expect(messageVariants({ direction: "incoming" }).column()).toContain("items-start");
	});

	test("max-w-[80%] is on the column and nowhere else", () => {
		const slots = messageVariants({});
		expect(slots.column()).toContain("max-w-[80%]");
		for (const slot of [slots.root(), slots.bubble(), slots.gutter(), slots.text(), slots.attachments()]) {
			expect(slot).not.toContain("max-w-");
		}
	});

	test("the gutter never shrinks, so a spacer holds its width", () => {
		expect(messageVariants({}).gutter()).toContain("shrink-0");
		expect(messageVariants({}).gutter()).toMatch(/\bw-\d+\b/);
	});

	test("reactions overlap the bubble or sit below it", () => {
		expect(MESSAGE_REACTION_PLACEMENTS).toEqual(["overlap", "below"]);
		expect(messageVariants({ placement: "overlap" }).reactions()).toMatch(/-mt-/);
		expect(messageVariants({ placement: "below" }).reactions()).not.toMatch(/-mt-/);
	});

	test("text colour is on the text, never on the row or the bubble", () => {
		for (const direction of MESSAGE_DIRECTIONS) {
			for (const tone of MESSAGE_TONES) {
				const slots = messageVariants({ direction, tone });
				expect(colorToken(slots.root())).toBeUndefined();
				expect(colorToken(slots.bubble())).toBeUndefined();
			}
		}
	});
});

describe("MESSAGE_STATUS_TOKEN", () => {
	test("covers every status", () => {
		expect(Object.keys(MESSAGE_STATUS_TOKEN).sort()).toEqual([...MESSAGE_STATUS_TYPES].sort());
	});

	test("read is info, failed is destructive, the rest are muted", () => {
		expect(MESSAGE_STATUS_TOKEN).toEqual({
			sending: "muted-foreground",
			sent: "muted-foreground",
			delivered: "muted-foreground",
			read: "info",
			failed: "destructive",
		});
	});

	test("the status label resolves the same token as its glyph", () => {
		for (const type of MESSAGE_STATUS_TYPES) {
			const label = messageVariants({ statusType: type }).statusLabel();
			expect(colorToken(label)).toBe(MESSAGE_STATUS_TOKEN[type]);
		}
	});
});

describe("tokens", () => {
	test("every colour token named exists in both themes", () => {
		const named = new Set([
			...everySlotClass().flatMap(colourTokens),
			...Object.values(MESSAGE_STATUS_TOKEN),
			...Object.values(MESSAGE_FILL_FOREGROUND),
		]);
		const missing = [...named].filter((token) => !LIGHT.has(token) || !DARK.has(token));
		expect(missing).toEqual([]);
		expect(named.size).toBeGreaterThan(8);
	});
});
