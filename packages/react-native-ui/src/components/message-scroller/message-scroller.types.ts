import type { ReactElement, ReactNode } from "react";
import type { MessageRunPosition } from "./message-scroller.utils";

/** What `renderMessage` is handed for one message row. */
export type MessageScrollerRenderInfo<T> = {
	message: T;
	/** Where the message sits in its sender's run — pass it straight to a bubble's `position`. */
	position: MessageRunPosition;
	/** Arrived after the list's first layout. Gate a row's entrance animation on it. */
	isNew: boolean;
	/** The message's index in `messages`, not in the list's rows. */
	index: number;
};

/**
 * Imperative control over the list, for a search result, a reply chip or a jump of the app's own.
 *
 * Every call is a no-op before the list has mounted.
 */
export type MessageScrollerController = {
	/** Scroll to the newest message. Animated unless calm motion is on, or `animated: false`. */
	scrollToEnd: (options?: { animated?: boolean }) => void;
	/**
	 * Scroll a message into view by its key. `viewPosition` is 0 for the top of the viewport, 1 for
	 * the bottom; default 0.5.
	 */
	scrollToKey: (key: string, options?: { animated?: boolean; viewPosition?: number }) => void;
	/** Whether the reader is at the newest message right now — read from the UI thread's value. */
	isAtEnd: () => boolean;
};

/** What a part, or an app's own overlay, reads to draw itself. */
export type MessageScrollerState = {
	isAtEnd: boolean;
	/** Messages from others appended while the reader was not at the end. */
	unreadCount: number;
	isLoadingOlder: boolean;
};

/** Root props that every message type shares; `MessageScrollerProps<T>` adds the typed ones. */
export type MessageScrollerBaseProps = {
	/** The viewer's sender id. Their own messages never raise the unread count, and sending one always scrolls to the end. */
	viewerId?: string;
	/** A gap longer than this ends a sender's run. Default five minutes. */
	runWindowMs?: number;
	/** Draw a separator at each new calendar day. Default true. */
	separateDates?: boolean;
	/** The separator's label. Default: Today, Yesterday, a weekday inside six days, then the date. */
	formatDate?: (date: Date, now: Date) => string;
	/** Draws the unread divider before this message. */
	firstUnreadKey?: string;

	/** More history exists above the first message. Default false. */
	hasOlder?: boolean;
	/** An older page is in flight: the header shows a spinner and further requests are held. */
	isLoadingOlder?: boolean;
	/** Asked for the next older page, once per reach of the top. */
	onLoadOlder?: () => void;
	/** How near the top, in viewport heights, counts as reaching it. Default 1. */
	loadOlderThreshold?: number;

	/** Points from the end still counted as "at the end". Default 80. */
	stickThreshold?: number;
	/** Where the list opens: the newest message, or the unread divider. Default `end`. */
	initialScrollTarget?: "end" | "unread";
	/**
	 * Distance from the bottom of the list to the bottom of the screen. The keyboard lifts the list's
	 * content, and the jump button, by its height minus this. Default 0.
	 */
	keyboardOffset?: number;
	/** Clearance below the newest message, for a composer drawn over the list. Default 0. */
	bottomInset?: number;
	/**
	 * A rough row height. The default suits a one-line bubble; a list of tall rows should pass its
	 * own, or an older page lands a little off while its rows measure.
	 */
	estimatedItemSize?: number;
	ListHeaderComponent?: ReactElement;
	ListEmptyComponent?: ReactElement;
	/** Called when the reader arrives at, or leaves, the newest message. */
	onAtEndChange?: (isAtEnd: boolean) => void;
	/** Hands over the controller once the list has mounted. */
	onScrollerReady?: (controller: MessageScrollerController) => void;
	/** The positioned container's classes. Size the scroller here — it has no size of its own. */
	className?: string;
	/** The list content's classes, merged over the gutter. */
	contentContainerClassName?: string;
	/** The parts: `MessageScroller.List`, then overlays such as `MessageScroller.JumpButton`. */
	children?: ReactNode;
	testID?: string;
};

/**
 * Everything the scroller needs to turn the app's messages into rows. Generic over the message type,
 * so `renderMessage` receives the app's own `T` with no casts.
 */
export type MessageScrollerProps<T> = MessageScrollerBaseProps & {
	/** Chronological, oldest first. Not sorted here. */
	messages: readonly T[];
	getKey: (message: T) => string;
	getDate: (message: T) => Date;
	getSenderId: (message: T) => string;
	/** The name a screen reader hears in "New message from …". Optional. */
	getSenderName?: (message: T) => string | undefined;
	renderMessage: (info: MessageScrollerRenderInfo<T>) => ReactElement;
};

export type MessageScrollerJumpButtonProps = {
	/** The accessibility label's first half. Default "Jump to latest". */
	label?: string;
	/** Default `end`. */
	placement?: "center" | "end";
	/** Show the unread count beside the arrow. Default true. */
	showCount?: boolean;
	/** Default: scroll to the end. */
	onPress?: () => void;
	/** Replaces the arrow and count. */
	children?: ReactNode;
	className?: string;
	testID?: string;
};
