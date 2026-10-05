import { describe, expect, test } from "bun:test";
import { declaredTokens } from "../../styles/theme-tokens.test";
import { badgeVariants } from "../badge/badge.variants";
import { chipVariants } from "../chip/chip.variants";
import { resolveTicketStatus, SUPPORT_AVAILABILITIES, SUPPORT_TICKET_STATUSES } from "./support.utils";
import {
	resolveReplyColor,
	SUPPORT_CONVERSATION_DOTS,
	SUPPORT_TICKET_BADGE_VARIANT,
	supportVariants,
} from "./support.variants";

const LIGHT = declaredTokens("light");
const DARK = declaredTokens("dark");

/** Every `bg-*`, `border-*` and `text-*` colour token in a class string, minus the prefix. */
function colorTokens(cls: string): string[] {
	const tokens: string[] = [];
	for (const [, token] of cls.matchAll(/\b(?:bg|border|text)-([a-z]+(?:-[a-z]+)*)\b/g)) {
		if (token === undefined) continue;
		if (/^(?:xs|sm|base|lg|xl|\dxl|center|left|right|transparent|\d+)$/.test(token)) continue;
		tokens.push(token);
	}
	return tokens;
}

function expectDeclared(cls: string): void {
	const tokens = colorTokens(cls);
	expect(tokens.length).toBeGreaterThan(0);
	for (const token of tokens) {
		expect({ token, light: LIGHT.has(token) }).toEqual({ token, light: true });
		expect({ token, dark: DARK.has(token) }).toEqual({ token, dark: true });
	}
}

type SlotName = keyof ReturnType<typeof supportVariants>;

/** Every slot, resolved across every axis value, for the whole-surface scans below. */
function everySlotClass(): { slot: SlotName; cls: string }[] {
	const out: { slot: SlotName; cls: string }[] = [];
	const combos = [
		...SUPPORT_AVAILABILITIES.map((availability) => ({ availability })),
		...SUPPORT_CONVERSATION_DOTS.map((dot) => ({ dot })),
		{ selected: true },
		{ selected: false },
		{ isDisabled: true },
		{ isDisabled: false },
	];
	for (const combo of combos) {
		const slots = supportVariants(combo);
		for (const slot of Object.keys(slots) as SlotName[]) {
			// tailwind-variants adds an implicit `base` slot that resolves to nothing.
			if ((slot as string) === "base") continue;
			out.push({ slot, cls: slots[slot]() });
		}
	}
	return out;
}

describe("availability", () => {
	test("every availability paints its dot with a token both themes declare", () => {
		for (const availability of SUPPORT_AVAILABILITIES) {
			expectDeclared(supportVariants({ availability }).statusDot());
		}
	});

	test("the three dots are three different colours", () => {
		const fills = SUPPORT_AVAILABILITIES.map((availability) => supportVariants({ availability }).statusDot());
		expect(new Set(fills).size).toBe(SUPPORT_AVAILABILITIES.length);
	});

	test("online is success, away is warning, offline is muted", () => {
		expect(supportVariants({ availability: "online" }).statusDot()).toContain("bg-success");
		expect(supportVariants({ availability: "away" }).statusDot()).toContain("bg-warning");
		expect(supportVariants({ availability: "offline" }).statusDot()).toContain("bg-muted-foreground");
	});
});

describe("ticket status", () => {
	test("every status resolves a soft badge whose tokens both themes declare", () => {
		for (const status of SUPPORT_TICKET_STATUSES) {
			const slots = badgeVariants({ variant: SUPPORT_TICKET_BADGE_VARIANT, color: resolveTicketStatus(status).color });
			expectDeclared(slots.root());
			expectDeclared(slots.label());
		}
	});

	test("the badge is the soft family", () => {
		expect(SUPPORT_TICKET_BADGE_VARIANT).toBe("soft");
	});
});

describe("conversation dot", () => {
	test("unread and updated are different colours — the two-dot rule", () => {
		const unread = supportVariants({ dot: "unread" }).conversationDot();
		const updated = supportVariants({ dot: "updated" }).conversationDot();
		expect(unread).not.toBe(updated);
		expect(unread).toContain("bg-primary");
		expect(updated).toContain("bg-muted-foreground");
		expectDeclared(unread);
		expectDeclared(updated);
	});

	test("no dot keeps the slot's width, so titles stay in line", () => {
		const none = supportVariants({ dot: "none" }).conversationDot();
		const unread = supportVariants({ dot: "unread" }).conversationDot();
		expect(none).toContain("bg-transparent");
		expect(none.match(/\bsize-[\w.]+/)?.[0]).toBe(unread.match(/\bsize-[\w.]+/)?.[0]);
	});
});

describe("topic", () => {
	test("selected takes the primary border on the tertiary fill", () => {
		const selected = supportVariants({ selected: true });
		expect(selected.topic()).toContain("border-primary");
		expect(selected.topic()).toContain("bg-tertiary");
		expect(selected.topicIndicator()).toContain("border-primary");
	});

	test("rest sits on the card with the hairline border", () => {
		const rest = supportVariants({ selected: false });
		expect(rest.topic()).toContain("border-border");
		expect(rest.topic()).toContain("bg-card");
		expect(rest.topic()).not.toContain("border-primary");
		expect(rest.topicIndicator()).toContain("border-border");
	});

	test("is a card row, rounded-lg", () => {
		expect(supportVariants().topic()).toContain("rounded-lg");
	});
});

describe("reply", () => {
	test("an escalating reply is the primary-soft chip, any other the neutral one", () => {
		expect(resolveReplyColor(true)).toBe("primary");
		expect(resolveReplyColor(false)).toBe("default");
		const escalates = chipVariants({ variant: "soft", color: resolveReplyColor(true) }).root();
		const plain = chipVariants({ variant: "soft", color: resolveReplyColor(false) }).root();
		expect(escalates).toContain("bg-tertiary");
		expect(plain).toContain("bg-muted");
	});
});

describe("disabled", () => {
	test("dims through opacity, which Pressable multiplies into its feedback", () => {
		expect(supportVariants({ isDisabled: true }).topic()).toContain("opacity-50");
		expect(supportVariants({ isDisabled: false }).topic()).not.toContain("opacity-50");
	});
});

describe("the whole surface", () => {
	const all = everySlotClass();

	test("the root carries no self-* — it leaves the parent's alignment alone", () => {
		for (const { slot, cls } of all) {
			if (slot !== "root") continue;
			expect(cls).not.toMatch(/\bself-/);
		}
	});

	test("no dark: prefix and no raw palette colour anywhere", () => {
		for (const { cls } of all) {
			expect(cls).not.toMatch(/\bdark:/);
			expect(cls).not.toMatch(
				/\b(?:bg|text|border)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone|black|white)\b/
			);
		}
	});

	test("text colour sits on text slots only, never on root, rows or containers", () => {
		const containers: SlotName[] = [
			"root",
			"header",
			"statusRow",
			"section",
			"topic",
			"agent",
			"handoff",
			"note",
			"replies",
			"resolution",
			"typing",
		];
		for (const { slot, cls } of all) {
			if (!containers.includes(slot)) continue;
			expect({ slot, cls }).not.toEqual({ slot, cls: expect.stringMatching(/\btext-[a-z-]*foreground\b/) });
		}
	});

	test("every colour token any slot names is declared in both themes", () => {
		for (const { cls } of all) {
			for (const token of colorTokens(cls)) {
				expect({ token, light: LIGHT.has(token) }).toEqual({ token, light: true });
				expect({ token, dark: DARK.has(token) }).toEqual({ token, dark: true });
			}
		}
	});
});
