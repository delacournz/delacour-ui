import { type ReactElement, useCallback, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { cn } from "../../lib/cn";
import {
	MessageScrollerListProvider,
	type MessageScrollerListValue,
	MessageScrollerProvider,
} from "./message-scroller.context";
import type { MessageScrollerProps, MessageScrollerRenderInfo } from "./message-scroller.types";
import {
	buildMessageRows,
	DEFAULT_RUN_WINDOW_MS,
	detectChange,
	formatSeparatorDate,
	shouldRequestOlder,
} from "./message-scroller.utils";
import { messageScrollerVariants } from "./message-scroller.variants";
import { MessageScrollerDateSeparator } from "./message-scroller-date-separator";
import { MessageScrollerJumpButton } from "./message-scroller-jump-button";
import { MessageScrollerList } from "./message-scroller-list";
import { MessageScrollerLoadingOlder } from "./message-scroller-loading-older";
import { MessageScrollerUnreadDivider } from "./message-scroller-unread-divider";
import { useMessageScrollerState } from "./use-message-scroller-state";

/** Suits a one-line bubble. A list of taller rows passes its own. */
const DEFAULT_ESTIMATED_ITEM_SIZE = 56;

/** The keys the list opened with, plus every key that has not arrived by appending since. */
type KeyBaseline = { keys: readonly string[]; seen: ReadonlySet<string> };

function MessageScrollerRoot<T>({
	messages,
	getKey,
	getDate,
	getSenderId,
	getSenderName,
	renderMessage,
	viewerId,
	runWindowMs = DEFAULT_RUN_WINDOW_MS,
	separateDates = true,
	formatDate = formatSeparatorDate,
	firstUnreadKey,
	hasOlder = false,
	isLoadingOlder = false,
	onLoadOlder,
	loadOlderThreshold = 1,
	stickThreshold,
	initialScrollTarget = "end",
	keyboardOffset,
	bottomInset,
	estimatedItemSize = DEFAULT_ESTIMATED_ITEM_SIZE,
	ListHeaderComponent,
	ListEmptyComponent,
	onAtEndChange,
	onScrollerReady,
	className,
	contentContainerClassName,
	children,
	testID,
}: MessageScrollerProps<T>): ReactElement {
	const keys = useMemo(() => messages.map(getKey), [messages, getKey]);
	const byKey = useMemo(() => new Map(messages.map((message) => [getKey(message), message])), [messages, getKey]);

	// A key is new when it arrived by appending after the first render. An older page, or a list
	// replaced wholesale, joins the baseline: those rows are history, not arrivals. Tracked during
	// render, the way React stores information from a previous render, so `isNew` is right on the
	// very render the row first appears in.
	const [baseline, setBaseline] = useState<KeyBaseline>(() => ({ keys, seen: new Set(keys) }));
	let current = baseline;
	if (baseline.keys !== keys) {
		const change = detectChange(baseline.keys, keys);
		if (change !== "none") {
			current = { keys, seen: change === "append" ? baseline.seen : new Set(keys) };
			setBaseline(current);
		}
	}
	const newKeys = useMemo(() => new Set(current.keys.filter((key) => !current.seen.has(key))), [current]);

	const isOwn = useCallback(
		(key: string) => {
			const message = byKey.get(key);
			return viewerId !== undefined && message !== undefined && getSenderId(message) === viewerId;
		},
		[byKey, getSenderId, viewerId]
	);
	const senderName = useCallback(
		(key: string) => {
			const message = byKey.get(key);
			return message === undefined ? undefined : getSenderName?.(message);
		},
		[byKey, getSenderName]
	);

	const scroller = useMessageScrollerState({
		keys,
		isOwn,
		getSenderName: senderName,
		stickThreshold,
		isLoadingOlder,
		keyboardOffset,
		bottomInset,
		onAtEndChange,
		onScrollerReady,
	});

	const rows = useMemo(
		() =>
			buildMessageRows(messages, {
				getKey,
				getDate,
				getSenderId,
				runWindowMs,
				separateDates,
				now: new Date(),
				formatDate,
				firstUnreadKey,
				newKeys,
			}),
		[messages, getKey, getDate, getSenderId, runWindowMs, separateDates, formatDate, firstUnreadKey, newKeys]
	);

	// Frozen at mount: the list reads its initial index once, and an unread divider that moves later
	// must not drag the reader back to it.
	const [initialRowIndex] = useState(() => {
		if (initialScrollTarget !== "unread") return undefined;
		const index = rows.findIndex((row) => row.kind === "unread");
		return index === -1 ? undefined : index;
	});

	const requestedForKeyRef = useRef<string | undefined>(undefined);
	const firstKey = keys[0];
	const onStartReached = useCallback(() => {
		if (
			!shouldRequestOlder({
				hasOlder,
				isLoadingOlder,
				alreadyRequestedForKey: requestedForKeyRef.current,
				firstKey,
			})
		) {
			return;
		}
		requestedForKeyRef.current = firstKey;
		onLoadOlder?.();
	}, [hasOlder, isLoadingOlder, firstKey, onLoadOlder]);

	// The one place the message type is erased: the list is not generic, so the rows and the render
	// function travel as `unknown` together, and only the function that came with them reads a row.
	const listValue = useMemo<MessageScrollerListValue>(
		() => ({
			rows,
			renderMessage: renderMessage as (info: MessageScrollerRenderInfo<unknown>) => ReactElement,
			hasOlder,
			isLoadingOlder,
			onStartReached,
			loadOlderThreshold,
			initialRowIndex,
			estimatedItemSize,
			ListHeaderComponent,
			ListEmptyComponent,
			contentContainerClassName,
			testID,
		}),
		[
			rows,
			renderMessage,
			hasOlder,
			isLoadingOlder,
			onStartReached,
			loadOlderThreshold,
			initialRowIndex,
			estimatedItemSize,
			ListHeaderComponent,
			ListEmptyComponent,
			contentContainerClassName,
			testID,
		]
	);

	const slots = messageScrollerVariants();
	const parts = children ?? (
		<>
			<MessageScrollerList />
			<MessageScrollerJumpButton />
		</>
	);

	return (
		<MessageScrollerProvider value={scroller}>
			<MessageScrollerListProvider value={listValue}>
				<View className={cn(slots.root(), className)}>{parts}</View>
			</MessageScrollerListProvider>
		</MessageScrollerProvider>
	);
}

/**
 * A conversation list: anchored at the newest message, following it while the reader is there,
 * leaving them alone when they have scrolled up, offering a jump back with an unread count, loading
 * older history at the top and rising with the keyboard.
 *
 * It owns scroll behaviour, not appearance — each message is the app's own, from `renderMessage`,
 * which gets the message's place in its sender's run to pass to a bubble. Day separators and the
 * unread divider are drawn between rows. With no children it draws `List` and `JumpButton`; pass
 * children to add overlays of your own or to restyle the button.
 *
 * Generic over the message type, so `renderMessage` receives the app's own `T` with no casts.
 *
 * @example
 * ```tsx
 * <MessageScroller
 *   className="flex-1"
 *   messages={messages}
 *   getKey={(m) => m.id}
 *   getDate={(m) => m.sentAt}
 *   getSenderId={(m) => m.authorId}
 *   viewerId={me.id}
 *   hasOlder={hasOlder}
 *   isLoadingOlder={isFetching}
 *   onLoadOlder={fetchOlder}
 *   renderMessage={({ message, position }) => <Bubble message={message} position={position} />}
 * />
 * ```
 *
 * @example With `Screen.ChatList`, through the hook
 * ```tsx
 * const scroller = useMessageScrollerState({ keys, isOwn });
 * <MessageScroller.Provider value={scroller}>
 *   <Screen.ChatList ref={scroller.listRef} sharedValues={scroller.sharedValues}
 *     onLayout={scroller.onLayout} onContentSizeChange={scroller.onContentSizeChange} … />
 *   <MessageScroller.JumpButton />
 * </MessageScroller.Provider>
 * ```
 */
export const MessageScroller = Object.assign(MessageScrollerRoot, {
	/** The list itself. Parameterless — everything it needs comes from the root. */
	List: MessageScrollerList,
	/** The floating "jump to latest" pill, with the unread count. */
	JumpButton: MessageScrollerJumpButton,
	/** A day's label between hairlines; a header to assistive technology. */
	DateSeparator: MessageScrollerDateSeparator,
	/** The "N new messages" rule above the first unread message. */
	UnreadDivider: MessageScrollerUnreadDivider,
	/** The spinner row shown while an older page loads. */
	LoadingOlder: MessageScrollerLoadingOlder,
	/** Supplies a scroller built with `useMessageScrollerState` to parts outside a `<MessageScroller>`. */
	Provider: MessageScrollerProvider,
	displayName: "DelacourUI.MessageScroller",
});
