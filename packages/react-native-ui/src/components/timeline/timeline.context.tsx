import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { SharedValue } from "react-native-reanimated";
import type {
	TimelineOrientation,
	TimelineSize,
	TimelineStatus,
	TimelineTone,
	TimelineVariant,
} from "./timeline.variants";

export type TimelineContextValue = {
	/** The current event, zero-based. `-1` leaves every event upcoming. */
	value: number;
	/** How many events the root counted — direct `Timeline.Item` children, or a list's data. `0` when it could not count. */
	count: number;
	variant: TimelineVariant;
	size: TimelineSize;
	orientation: TimelineOrientation;
	/**
	 * The column at the horizontal strip's reading edge, written on the UI thread
	 * by the scroll handler. `null` in a vertical timeline.
	 */
	activeColumn: SharedValue<number> | null;
};

export type TimelineItemContextValue = {
	/** This event's index, zero-based. */
	step: number;
	status: TimelineStatus;
	tone: TimelineTone;
	/** The event draws no trailing rail. */
	isLast: boolean;
	/** Whether the rail leaving this event is filled. */
	isRailComplete: boolean;
	variant: TimelineVariant;
	size: TimelineSize;
	orientation: TimelineOrientation;
};

/** What a `Timeline.List` hands each item it renders, so the item needs none of it as props. */
export type TimelineListItemContextValue = {
	step: number;
	/** The column's width, already resolved from `itemWidth`. Horizontal only. */
	width: number;
	isLast: boolean;
};

const TimelineContext = createContext<TimelineContextValue | null>(null);
const TimelineItemContext = createContext<TimelineItemContextValue | null>(null);
const TimelineListItemContext = createContext<TimelineListItemContextValue | null>(null);

/**
 * Supplies the timeline's value and axes to its items.
 *
 * Lives in its own module, importing nothing but React and types, so a part can
 * read it without importing `./timeline` — which would close a cycle. See
 * AGENTS.md rule 3.
 */
export function TimelineProvider({
	value,
	children,
}: {
	value: TimelineContextValue;
	children: ReactNode;
}): ReactElement {
	return <TimelineContext value={value}>{children}</TimelineContext>;
}
TimelineProvider.displayName = "DelacourUI.Timeline.Provider";

/** Supplies one event's settled state to its indicator, title and the rest. */
export function TimelineItemProvider({
	value,
	children,
}: {
	value: TimelineItemContextValue;
	children: ReactNode;
}): ReactElement {
	return <TimelineItemContext value={value}>{children}</TimelineItemContext>;
}
TimelineItemProvider.displayName = "DelacourUI.Timeline.Item.Provider";

/** Supplies a list cell's position to the item a `renderItem` returns. Internal. */
export function TimelineListItemProvider({
	value,
	children,
}: {
	value: TimelineListItemContextValue;
	children: ReactNode;
}): ReactElement {
	return <TimelineListItemContext value={value}>{children}</TimelineListItemContext>;
}
TimelineListItemProvider.displayName = "DelacourUI.Timeline.List.ItemProvider";

/** The enclosing timeline's context, or null outside one. */
export function useTimelineContext(): TimelineContextValue | null {
	return use(TimelineContext);
}

/**
 * Reads the enclosing timeline's value and axes — for a custom part that has to
 * match the timeline it sits in. Throws outside a `<Timeline>` or `<Timeline.List>`.
 */
export function useTimeline(): TimelineContextValue {
	const context = useTimelineContext();
	if (!context) throw new Error("useTimeline must be called inside a <Timeline> or <Timeline.List>.");
	return context;
}

/** The enclosing event's state, or null outside a `<Timeline.Item>`. */
export function useTimelineItemContext(): TimelineItemContextValue | null {
	return use(TimelineItemContext);
}

/**
 * Reads the enclosing event's settled state — status, tone, position — so a
 * custom child can style itself to match. Throws outside a `<Timeline.Item>`.
 */
export function useTimelineItem(): TimelineItemContextValue {
	const context = useTimelineItemContext();
	if (!context) throw new Error("useTimelineItem must be called inside a <Timeline.Item>.");
	return context;
}

/** The list cell an item was rendered into, or null outside a `Timeline.List`. Internal. */
export function useTimelineListItemContext(): TimelineListItemContextValue | null {
	return use(TimelineListItemContext);
}

/** The enclosing timeline, for a part that cannot work without one. Internal. */
export function useTimelinePart(component: string): TimelineContextValue {
	const context = useTimelineContext();
	if (!context) throw new Error(`${component} must be rendered inside a <Timeline> or <Timeline.List>.`);
	return context;
}

/** The enclosing event, for a part that cannot work without one. Internal. */
export function useTimelineItemPart(component: string): TimelineItemContextValue {
	const context = useTimelineItemContext();
	if (!context) throw new Error(`${component} must be rendered inside a <Timeline.Item>.`);
	return context;
}
