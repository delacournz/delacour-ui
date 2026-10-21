/**
 * The pure decisions behind `MessageScroller`: how messages become rows, when the reader counts as
 * "at the end", when the jump button shows, what counts as unread, when to ask for older history and
 * what to announce. Free of React Native imports so every one of them is unit-testable.
 *
 * The scroll-position helpers carry a `"worklet"` directive because the jump button's visibility is
 * resolved on the UI thread, inside the list's animated scroll handler. The directive is a string
 * expression, so the same functions run unchanged outside the UI thread.
 */

/**
 * Where a message sits in a run of consecutive messages from one sender.
 *
 * Restated locally rather than imported: a message bubble declares the same literal union, and the
 * two are structurally interchangeable, so a scroller row's `position` passes straight to a bubble
 * without either folder importing the other.
 */
export type MessageRunPosition = "single" | "first" | "middle" | "last";

/** One row of the list: a message, a day separator, or the unread divider. */
export type MessageScrollerRow<T> =
	| { kind: "message"; key: string; message: T; position: MessageRunPosition; isNew: boolean; index: number }
	| { kind: "date"; key: string; date: Date; label: string }
	| { kind: "unread"; key: string; count: number };

/** How a key list changed between two renders. */
export type MessageListChange = "append" | "prepend" | "replace" | "none";

/** What an arrival should say to a screen reader. */
export type MessageAnnouncement = "none" | "single" | "batch";

/** The gap between two messages from one sender that ends their run. */
export const DEFAULT_RUN_WINDOW_MS = 5 * 60_000;

/** Points from the end that still count as "at the end". */
export const DEFAULT_STICK_THRESHOLD = 80;

/** The jump button shows only past this multiple of the stick threshold, so it cannot flicker at the edge. */
export const JUMP_SHOW_FACTOR = 1.5;

/** Arrivals inside this window coalesce into one announcement. */
export const ANNOUNCE_COALESCE_MS = 1500;

/** Above this the badge reads `99+`. */
export const UNREAD_COUNT_CAP = 99;

export const DEFAULT_JUMP_LABEL = "Jump to latest";

/** Prefixes for the rows the scroller inserts, chosen so they cannot collide with an app's message key. */
const DATE_KEY_PREFIX = "\u0000message-scroller:date:";
const UNREAD_KEY = "\u0000message-scroller:unread";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

const DAY_MS = 86_400_000;

/** Remaining scroll range below the viewport, never negative. */
export function distanceFromEnd(input: { offset: number; contentHeight: number; viewportHeight: number }): number {
	"worklet";
	return Math.max(0, input.contentHeight - input.viewportHeight - input.offset);
}

/**
 * Whether the reader is close enough to the end that a new message should pull the list with it.
 *
 * Content shorter than the viewport, and an overscroll past either edge, both count as the end.
 */
export function shouldStickToBottom(input: {
	offset: number;
	contentHeight: number;
	viewportHeight: number;
	threshold: number;
}): boolean {
	"worklet";
	return distanceFromEnd(input) <= input.threshold;
}

/**
 * Whether the jump button is showing, with hysteresis: it appears past 1.5 × `threshold`, hides at
 * `threshold`, and in between keeps whatever it was. A single boundary would flicker under a thumb
 * resting on it.
 */
export function resolveJumpVisibility(input: {
	distanceFromEnd: number;
	wasVisible: boolean;
	threshold: number;
}): boolean {
	"worklet";
	if (input.distanceFromEnd <= input.threshold) return false;
	if (input.distanceFromEnd > input.threshold * JUMP_SHOW_FACTOR) return true;
	return input.wasVisible;
}

/** Same calendar day in the device's time zone — a daylight-saving day included. */
export function isSameCalendarDay(a: Date, b: Date): boolean {
	return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * Whole calendar days from `date` back to `now`, by local date rather than by 24-hour blocks, so
 * 23:59 → 00:01 is one day and a 23- or 25-hour daylight-saving day is still one.
 */
function calendarDaysBetween(date: Date, now: Date): number {
	const from = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
	const to = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
	return Math.round((to - from) / DAY_MS);
}

/**
 * The label a day separator shows: `Today`, `Yesterday`, a weekday inside the last six days,
 * `12 Sep` earlier this year, and `12 Sep 2025` before that. A future date is written out.
 *
 * Without a `locale` the words are English and spelled here, not by `Intl`: ICU versions disagree on
 * the short form of September, and a separator that changes spelling between devices reads as a bug.
 * With one, `Intl.DateTimeFormat` writes the weekday and date in that locale.
 */
export function formatSeparatorDate(date: Date, now: Date, locale?: string): string {
	const days = calendarDaysBetween(date, now);
	if (days === 0) return "Today";
	if (days === 1) return "Yesterday";
	if (days > 1 && days <= 6) {
		return locale ? new Intl.DateTimeFormat(locale, { weekday: "long" }).format(date) : (WEEKDAYS[date.getDay()] ?? "");
	}
	const sameYear = date.getFullYear() === now.getFullYear();
	if (locale) {
		return new Intl.DateTimeFormat(locale, {
			day: "numeric",
			month: "short",
			...(sameYear ? {} : { year: "numeric" }),
		}).format(date);
	}
	const dayMonth = `${date.getDate()} ${MONTHS[date.getMonth()] ?? ""}`;
	return sameYear ? dayMonth : `${dayMonth} ${date.getFullYear()}`;
}

/** Local `YYYY-MM-DD`, for a separator's key. */
function dayKey(date: Date): string {
	return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export type BuildMessageRowsOptions<T> = {
	getKey: (message: T) => string;
	getDate: (message: T) => Date;
	getSenderId: (message: T) => string;
	runWindowMs: number;
	separateDates: boolean;
	now: Date;
	formatDate: (date: Date, now: Date) => string;
	firstUnreadKey?: string;
	/** Keys that arrived after the list's first layout; their rows carry `isNew`. */
	newKeys?: ReadonlySet<string>;
};

/**
 * Turns chronological messages into the list's rows: day separators, the unread divider, and each
 * message's position in its run.
 *
 * A run is broken by a change of sender, a gap longer than `runWindowMs`, a new calendar day (with or
 * without a separator drawn for it) and the unread divider. Input order is the caller's — nothing is
 * sorted, and a timestamp running backwards is measured by its size, not its sign.
 */
export function buildMessageRows<T>(
	messages: readonly T[],
	options: BuildMessageRowsOptions<T>
): MessageScrollerRow<T>[] {
	const count = messages.length;
	if (count === 0) return [];

	const keys = messages.map(options.getKey);
	const dates = messages.map(options.getDate);
	const senders = messages.map(options.getSenderId);
	const unreadIndex = options.firstUnreadKey === undefined ? -1 : keys.indexOf(options.firstUnreadKey);
	const starts = keys.map((_, index) =>
		startsRun(index, { dates, senders, unreadIndex, runWindowMs: options.runWindowMs })
	);
	const rows: MessageScrollerRow<T>[] = [];
	// Keyed by the day, so a separator keeps its identity when an older page lands above it. A day
	// seen twice (input out of order) takes a suffix rather than a duplicate key.
	const seenDays = new Map<string, number>();

	for (let index = 0; index < count; index++) {
		const key = keys[index] as string;
		const date = dates[index] as Date;
		const previousDate = index > 0 ? dates[index - 1] : undefined;

		if (options.separateDates && (previousDate === undefined || !isSameCalendarDay(date, previousDate))) {
			rows.push(dateRow(date, seenDays, options));
		}
		if (index === unreadIndex) {
			rows.push({ kind: "unread", key: UNREAD_KEY, count: count - unreadIndex });
		}
		rows.push({
			kind: "message",
			key,
			message: messages[index] as T,
			position: runPosition(starts[index] === true, index === count - 1 || starts[index + 1] === true),
			isNew: options.newKeys?.has(key) ?? false,
			index,
		});
	}

	return rows;
}

/**
 * Whether the message at `index` opens a new run: the first message, the first unread one, a change
 * of sender, a new calendar day, or a gap longer than the window.
 */
function startsRun(
	index: number,
	context: { dates: readonly Date[]; senders: readonly string[]; unreadIndex: number; runWindowMs: number }
): boolean {
	if (index === 0 || index === context.unreadIndex) return true;
	const previous = index - 1;
	if (context.senders[index] !== context.senders[previous]) return true;
	const date = context.dates[index] as Date;
	const previousDate = context.dates[previous] as Date;
	if (!isSameCalendarDay(date, previousDate)) return true;
	return Math.abs(date.getTime() - previousDate.getTime()) > context.runWindowMs;
}

/** A message's place in its run, from whether it opens one and whether the next message opens another. */
function runPosition(isStart: boolean, isEnd: boolean): MessageRunPosition {
	if (isStart) return isEnd ? "single" : "first";
	return isEnd ? "last" : "middle";
}

/** A day separator, keyed by its day, with a suffix for a day the input revisits. */
function dateRow<T>(
	date: Date,
	seenDays: Map<string, number>,
	options: Pick<BuildMessageRowsOptions<T>, "formatDate" | "now">
): MessageScrollerRow<T> {
	const day = dayKey(date);
	const seen = seenDays.get(day) ?? 0;
	seenDays.set(day, seen + 1);
	return {
		kind: "date",
		key: `${DATE_KEY_PREFIX}${day}${seen > 0 ? `:${seen}` : ""}`,
		date,
		label: options.formatDate(date, options.now),
	};
}

/**
 * How the key list moved: new keys after the old last one (`append`), before the old first one
 * (`prepend`), nothing (`none`) or anything else (`replace`). A first load from nothing is a
 * `replace` — it is not a message arriving.
 *
 * Checks the old list's ends against the new one rather than every key: a conversation can be
 * thousands long and this runs on every change.
 */
export function detectChange(previousKeys: readonly string[], nextKeys: readonly string[]): MessageListChange {
	const previousLength = previousKeys.length;
	const nextLength = nextKeys.length;
	if (previousLength === nextLength && previousKeys.every((key, index) => key === nextKeys[index])) return "none";
	if (previousLength === 0 || nextLength <= previousLength) return "replace";

	const first = previousKeys[0];
	const last = previousKeys[previousLength - 1];
	if (nextKeys[0] === first && nextKeys[previousLength - 1] === last) return "append";
	const offset = nextLength - previousLength;
	if (nextKeys[offset] === first && nextKeys[nextLength - 1] === last) return "prepend";
	return "replace";
}

/**
 * The jump button's unread count after a change: appended messages from others add to it, an older
 * page or the viewer's own messages do not, reaching the end clears it, and a list that shrank caps
 * it at its new length.
 */
export function resolveUnreadCount(input: {
	previousKeys: readonly string[];
	nextKeys: readonly string[];
	isOwn: (key: string) => boolean;
	isAtEnd: boolean;
	previousCount: number;
}): number {
	if (input.isAtEnd) return 0;
	const change = detectChange(input.previousKeys, input.nextKeys);
	if (change === "append") {
		const added = input.nextKeys.slice(input.previousKeys.length);
		return input.previousCount + added.filter((key) => !input.isOwn(key)).length;
	}
	if (change === "replace") return Math.max(0, Math.min(input.previousCount, input.nextKeys.length));
	return input.previousCount;
}

/**
 * Whether reaching the top should ask for an older page. Once per first key: the list engine fires
 * its start-reached callback again as momentum carries the reader back across the threshold, and the
 * page that answers the first call moves the first key, which is what re-arms it.
 */
export function shouldRequestOlder(input: {
	hasOlder: boolean;
	isLoadingOlder: boolean;
	alreadyRequestedForKey: string | undefined;
	firstKey: string | undefined;
}): boolean {
	if (!input.hasOlder || input.isLoadingOlder || input.firstKey === undefined) return false;
	return input.firstKey !== input.alreadyRequestedForKey;
}

/**
 * Whether following a new message animates: only for a move shorter than one viewport, and never
 * under calm motion. Animating across a long conversation is a blur that ends where a jump would.
 */
export function resolveFollowAnimation(input: { distance: number; viewportHeight: number; isCalm: boolean }): boolean {
	if (input.isCalm) return false;
	return input.distance < input.viewportHeight;
}

/**
 * Whether pending arrivals are announced now. Inside the coalescing window the answer is `none` and
 * the caller holds the count, so a burst of three is one "3 new messages" rather than three
 * interruptions.
 */
export function shouldAnnounceNewMessages(input: {
	count: number;
	lastAnnouncedAt: number;
	now: number;
}): MessageAnnouncement {
	if (input.count <= 0) return "none";
	if (input.now - input.lastAnnouncedAt < ANNOUNCE_COALESCE_MS) return "none";
	return input.count === 1 ? "single" : "batch";
}

/** What a screen reader hears for an arrival, or a burst of them. */
export function resolveAnnouncementText(input: { count: number; senderName?: string }): string {
	if (input.count === 1) return input.senderName ? `New message from ${input.senderName}` : "New message";
	return `${input.count} new messages`;
}

/** The badge text: empty at zero, capped at `99+`. */
export function formatUnreadCount(count: number): string {
	if (count <= 0) return "";
	return count > UNREAD_COUNT_CAP ? `${UNREAD_COUNT_CAP}+` : String(count);
}

/** The jump button's accessibility label, with the unread count when there is one. */
export function resolveJumpButtonLabel(unreadCount: number, base: string = DEFAULT_JUMP_LABEL): string {
	if (unreadCount <= 0) return base;
	return `${base}, ${formatUnreadCount(unreadCount)} unread`;
}

/** The unread divider's text. */
export function formatUnreadDividerLabel(count: number): string {
	return count === 1 ? "1 new message" : `${count} new messages`;
}
