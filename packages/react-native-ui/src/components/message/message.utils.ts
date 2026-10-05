import type { MessageStatus } from "./message.types";
import type { MessageDirection, MessagePosition } from "./message.variants";

const DAY_MS = 86_400_000;

/** Emoji in a single grapheme count no higher than this before it is a sentence. */
const EMOJI_ONLY_MAX = 3;

/** What a receipt says, drawn under the bubble and read by a screen reader. */
export function resolveMessageStatusLabel(status: MessageStatus): string {
	switch (status.type) {
		case "sending":
			return "Sending";
		case "sent":
			return "Sent";
		case "delivered":
			return "Delivered";
		case "read":
			return "Read";
		case "failed": {
			const reason = status.reason?.trim();
			return reason ? `Failed: ${reason}` : "Failed to send";
		}
	}
}

/** Midnight at the start of `date`'s local calendar day. */
function startOfDay(date: Date): number {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * The narrow and ordinary no-break spaces newer ICU data puts before `AM`,
 * folded to a plain space so a test, a snapshot and a copied string all agree.
 */
function normaliseSpaces(text: string): string {
	return text.replace(/[  ]/g, " ");
}

/**
 * A message's time, as a chat list shows it: the time of day today,
 * `Yesterday`, the weekday within the past week, and a short date beyond that —
 * with the year only when it is not this one.
 *
 * Days are calendar days in local time, not 24-hour spans, so 23:59 seen at
 * 00:01 is yesterday. A date in the future on another day is a short date,
 * never a weekday that would read as the past. `Yesterday` comes from
 * `Intl.RelativeTimeFormat`, so it is translated with the rest.
 */
export function formatMessageTime(date: Date, now: Date = new Date(), locale?: string): string {
	const days = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);

	if (days === 0) {
		return normaliseSpaces(date.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" }));
	}

	if (days === 1) {
		const word = new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(-1, "day");
		return word.charAt(0).toLocaleUpperCase(locale) + word.slice(1);
	}

	if (days > 1 && days < 7) {
		return date.toLocaleDateString(locale, { weekday: "long" });
	}

	const sameYear = date.getFullYear() === now.getFullYear();
	return normaliseSpaces(
		date.toLocaleDateString(locale, { day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }) })
	);
}

/** A code point that can start an emoji on its own. */
function isEmojiBase(cp: number): boolean {
	return (
		(cp >= 0x1f000 && cp <= 0x1faff) ||
		(cp >= 0x2600 && cp <= 0x27bf) ||
		(cp >= 0x2300 && cp <= 0x23ff) ||
		(cp >= 0x2b00 && cp <= 0x2bff) ||
		(cp >= 0x2190 && cp <= 0x21ff) ||
		(cp >= 0x25aa && cp <= 0x25fe) ||
		(cp >= 0x2934 && cp <= 0x2935) ||
		cp === 0x00a9 ||
		cp === 0x00ae ||
		cp === 0x203c ||
		cp === 0x2049 ||
		cp === 0x2122 ||
		cp === 0x2139 ||
		cp === 0x3030 ||
		cp === 0x303d ||
		cp === 0x3297 ||
		cp === 0x3299
	);
}

/** A code point that only ever modifies the emoji before it: variation selectors, skin tones, tags, the keycap. */
function isEmojiModifier(cp: number): boolean {
	return (
		cp === 0xfe0f ||
		cp === 0xfe0e ||
		cp === 0x20e3 ||
		(cp >= 0x1f3fb && cp <= 0x1f3ff) ||
		(cp >= 0xe0020 && cp <= 0xe007f)
	);
}

function isRegionalIndicator(cp: number): boolean {
	return cp >= 0x1f1e6 && cp <= 0x1f1ff;
}

function isKeycapBase(cp: number): boolean {
	return (cp >= 0x30 && cp <= 0x39) || cp === 0x23 || cp === 0x2a;
}

function isSpace(cp: number): boolean {
	return cp === 0x20 || cp === 0x09 || cp === 0x0a || cp === 0x0d || cp === 0xa0;
}

/**
 * Whether `text` is one to three emoji and nothing else, whitespace aside —
 * the case an app draws large and unfilled (`tone="plain"`, `size="lg"`).
 *
 * Counts what a reader sees as one emoji: a ZWJ family, a skin-toned hand, a
 * flag's regional-indicator pair, a keycap. Walked by code point against fixed
 * ranges rather than with `Intl.Segmenter` or `\p{Extended_Pictographic}`,
 * neither of which every JavaScript engine React Native ships on supports. The
 * component never calls this on its own; the app decides.
 */
export function isEmojiOnly(text: string): boolean {
	const cps = Array.from(text, (char) => char.codePointAt(0) ?? 0);
	let count = 0;
	let i = 0;

	while (i < cps.length) {
		const cp = cps[i] ?? 0;

		if (isSpace(cp)) {
			i += 1;
			continue;
		}

		if (isKeycapBase(cp)) {
			let next = i + 1;
			if (cps[next] === 0xfe0f) next += 1;
			if (cps[next] !== 0x20e3) return false;
			i = next + 1;
		} else if (isRegionalIndicator(cp)) {
			i += isRegionalIndicator(cps[i + 1] ?? 0) ? 2 : 1;
		} else if (isEmojiBase(cp)) {
			i += 1;
			for (;;) {
				while (i < cps.length && isEmojiModifier(cps[i] ?? 0)) i += 1;
				if (cps[i] === 0x200d && isEmojiBase(cps[i + 1] ?? 0)) {
					i += 2;
					continue;
				}
				break;
			}
		} else {
			return false;
		}

		count += 1;
		if (count > EMOJI_ONLY_MAX) return false;
	}

	return count > 0;
}

/** Whether a receipt is drawn: outgoing only, and only under the last bubble of a run. */
export function shouldShowStatus(position: MessagePosition, direction: MessageDirection): boolean {
	return direction === "outgoing" && (position === "last" || position === "single");
}

/** Whether `Message.Avatar` draws its children: incoming only, beside the last bubble of a run. */
export function shouldShowAvatar(position: MessagePosition, direction: MessageDirection): boolean {
	return direction === "incoming" && (position === "last" || position === "single");
}

/**
 * Whether a status change is spoken. Only a turn into `failed` is — a receipt
 * ticking over every time would be noise — and only a turn, so a message that
 * mounts already failed (history, or a recycled cell) stays quiet.
 */
export function shouldAnnounceStatusChange(prev: MessageStatus | undefined, next: MessageStatus): boolean {
	return prev !== undefined && prev.type !== "failed" && next.type === "failed";
}

export type MessageAccessibilityLabelInput = {
	author?: string;
	direction: MessageDirection;
	/** Default `single`. The receipt is read only where it is drawn. */
	position?: MessagePosition;
	text?: string;
	time?: string;
	status?: MessageStatus;
	/** `Message.Status`'s `label`, which replaces the receipt's own words. */
	statusLabel?: string;
	/** The message is a typing indicator rather than content. */
	isTyping?: boolean;
};

/**
 * The one label a message is read as: who, when, what, and — for your own last
 * message — its receipt. `"Kate, 9:41 AM, Are we still on for tonight?"`.
 *
 * Outgoing is always `You`, whatever author was passed: a screen reader user
 * scrolling a thread needs the side, not their own name. Blank parts are
 * dropped rather than read as a pause.
 */
export function resolveMessageAccessibilityLabel(input: MessageAccessibilityLabelInput): string {
	const author = input.direction === "outgoing" ? "You" : input.author?.trim() || undefined;

	if (input.isTyping) {
		return author && input.direction === "incoming" ? `${author} is typing` : "Typing";
	}

	const receipt =
		input.status && shouldShowStatus(input.position ?? "single", input.direction)
			? input.statusLabel?.trim() || resolveMessageStatusLabel(input.status)
			: undefined;

	return [author, input.time?.trim(), input.text?.trim(), receipt].filter((part) => part).join(", ");
}

/** An `accessibilityActions` entry. */
export type MessageAccessibilityAction = {
	name: "activate" | "longpress" | "more" | "retry";
	label?: string;
};

/**
 * The actions a message offers a screen reader, so nothing it does needs a
 * gesture to reach. A long press is offered twice: as the platform's own
 * `longpress`, which TalkBack binds to its long-press gesture, and as a named
 * `more` that VoiceOver lists in its actions rotor.
 */
export function resolveMessageAccessibilityActions({
	hasPress,
	hasLongPress,
	hasRetry,
}: {
	hasPress: boolean;
	hasLongPress: boolean;
	hasRetry: boolean;
}): MessageAccessibilityAction[] {
	const actions: MessageAccessibilityAction[] = [];
	if (hasPress) actions.push({ name: "activate" });
	if (hasLongPress) actions.push({ name: "longpress" }, { name: "more", label: "More actions" });
	if (hasRetry) actions.push({ name: "retry", label: "Retry" });
	return actions;
}
