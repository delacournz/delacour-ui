import type { LegendListRef } from "@legendapp/list/react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, type LayoutChangeEvent } from "react-native";
import { useAnimatedReaction, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import type { MessageScrollerContextValue } from "./message-scroller.context";
import type { MessageScrollerController } from "./message-scroller.types";
import {
	ANNOUNCE_COALESCE_MS,
	DEFAULT_STICK_THRESHOLD,
	detectChange,
	distanceFromEnd,
	resolveAnnouncementText,
	resolveFollowAnimation,
	resolveJumpVisibility,
	resolveUnreadCount,
	shouldAnnounceNewMessages,
} from "./message-scroller.utils";

export type UseMessageScrollerStateOptions = {
	/** The message keys, oldest first — the same keys the list's `keyExtractor` returns. */
	keys: readonly string[];
	/** Whether a key is the viewer's own message. Own messages never count as unread, and always scroll to the end. */
	isOwn?: (key: string) => boolean;
	/** The name a screen reader hears in "New message from …". */
	getSenderName?: (key: string) => string | undefined;
	/** Points from the end still counted as "at the end". Default 80. */
	stickThreshold?: number;
	isLoadingOlder?: boolean;
	keyboardOffset?: number;
	bottomInset?: number;
	onAtEndChange?: (isAtEnd: boolean) => void;
	onScrollerReady?: (controller: MessageScrollerController) => void;
};

const NEVER_OWN = (): boolean => false;
const NO_NAME = (): undefined => undefined;

/** Pending arrivals waiting to be announced, and when the last announcement went out. */
type AnnounceQueue = {
	pending: number;
	senderName: string | undefined;
	lastAnnouncedAt: number;
	timer: ReturnType<typeof setTimeout> | null;
};

/**
 * The scroll behaviour behind `MessageScroller`, as a hook: where the reader is, how many messages
 * arrived while they were away, and a controller to move them.
 *
 * `MessageScroller` calls it for its own `List`. An app drawing its conversation with another list —
 * `Screen.ChatList`, say — calls it directly, spreads `listRef`, `sharedValues`, `onLayout` and
 * `onContentSizeChange` onto that list, and wraps the result in `MessageScroller.Provider` so
 * `MessageScroller.JumpButton` can read it.
 *
 * Position is resolved on the UI thread: the list writes its offset into `sharedValues.scrollOffset`,
 * a reaction derives "at the end" and the jump button's hysteresis there, and only a crossing of the
 * end boundary comes back to React.
 */
export function useMessageScrollerState({
	keys,
	isOwn = NEVER_OWN,
	getSenderName = NO_NAME,
	stickThreshold = DEFAULT_STICK_THRESHOLD,
	isLoadingOlder = false,
	keyboardOffset = 0,
	bottomInset = 0,
	onAtEndChange,
	onScrollerReady,
}: UseMessageScrollerStateOptions): MessageScrollerContextValue {
	const isCalm = useCalmMotion();
	const listRef = useRef<LegendListRef | null>(null);
	const scrollOffset = useSharedValue(0);
	const contentHeight = useSharedValue(0);
	const viewportHeightValue = useSharedValue(0);
	const isAtEndValue = useSharedValue(true);
	const isJumpVisible = useSharedValue(false);

	const [isAtEnd, setIsAtEnd] = useState(true);
	const [unreadCount, setUnreadCount] = useState(0);
	const [viewportHeight, setViewportHeight] = useState(0);

	useAnimatedReaction(
		() =>
			distanceFromEnd({
				offset: scrollOffset.value,
				contentHeight: contentHeight.value,
				viewportHeight: viewportHeightValue.value,
			}),
		(distance) => {
			isJumpVisible.value = resolveJumpVisibility({
				distanceFromEnd: distance,
				wasVisible: isJumpVisible.value,
				threshold: stickThreshold,
			});
			const atEnd = distance <= stickThreshold;
			if (atEnd !== isAtEndValue.value) {
				isAtEndValue.value = atEnd;
				scheduleOnRN(setIsAtEnd, atEnd);
			}
		},
		[stickThreshold]
	);

	useEffect(() => {
		if (isAtEnd) setUnreadCount(0);
		onAtEndChange?.(isAtEnd);
	}, [isAtEnd, onAtEndChange]);

	const controller = useMemo<MessageScrollerController>(
		() => ({
			scrollToEnd: (options) => {
				void listRef.current?.scrollToEnd({ animated: options?.animated ?? !isCalm });
			},
			scrollToKey: (key, options) => {
				const list = listRef.current;
				const index = list?.getState().indexByKey(key);
				if (!list || index === undefined) return;
				void list.scrollToIndex({
					index,
					animated: options?.animated ?? !isCalm,
					viewPosition: options?.viewPosition ?? 0.5,
				});
			},
			isAtEnd: () => isAtEndValue.value,
		}),
		[isCalm, isAtEndValue]
	);

	useEffect(() => {
		onScrollerReady?.(controller);
	}, [controller, onScrollerReady]);

	const announceRef = useRef<AnnounceQueue>({ pending: 0, senderName: undefined, lastAnnouncedAt: 0, timer: null });

	const flushAnnouncements = useCallback(() => {
		const queue = announceRef.current;
		const now = Date.now();
		const kind = shouldAnnounceNewMessages({ count: queue.pending, lastAnnouncedAt: queue.lastAnnouncedAt, now });
		if (kind === "none") {
			if (queue.pending > 0 && queue.timer === null) {
				queue.timer = setTimeout(
					() => {
						announceRef.current.timer = null;
						flushAnnouncements();
					},
					Math.max(0, ANNOUNCE_COALESCE_MS - (now - queue.lastAnnouncedAt))
				);
			}
			return;
		}
		AccessibilityInfo.announceForAccessibility(
			resolveAnnouncementText({ count: queue.pending, senderName: queue.senderName })
		);
		queue.pending = 0;
		queue.senderName = undefined;
		queue.lastAnnouncedAt = now;
	}, []);

	useEffect(
		() => () => {
			const { timer } = announceRef.current;
			if (timer !== null) clearTimeout(timer);
		},
		[]
	);

	const previousKeysRef = useRef<readonly string[]>(keys);

	useEffect(() => {
		const previousKeys = previousKeysRef.current;
		previousKeysRef.current = keys;
		const change = detectChange(previousKeys, keys);
		if (change === "none") return undefined;

		const wasAtEnd = isAtEndValue.value;
		setUnreadCount((previousCount) =>
			resolveUnreadCount({ previousKeys, nextKeys: keys, isOwn, isAtEnd: wasAtEnd, previousCount })
		);
		if (change !== "append") return undefined;

		const added = keys.slice(previousKeys.length);
		if (added.some(isOwn)) {
			const distance = distanceFromEnd({
				offset: scrollOffset.value,
				contentHeight: contentHeight.value,
				viewportHeight: viewportHeightValue.value,
			});
			const animated = resolveFollowAnimation({ distance, viewportHeight: viewportHeightValue.value, isCalm });
			const frame = requestAnimationFrame(() => {
				void listRef.current?.scrollToEnd({ animated });
			});
			return () => cancelAnimationFrame(frame);
		}

		const fromOthers = added.filter((key) => !isOwn(key));
		if (wasAtEnd && fromOthers.length > 0) {
			const queue = announceRef.current;
			queue.pending += fromOthers.length;
			queue.senderName = queue.pending === 1 ? getSenderName(fromOthers[0] as string) : undefined;
			flushAnnouncements();
		}
		return undefined;
	}, [
		keys,
		isOwn,
		getSenderName,
		isCalm,
		flushAnnouncements,
		isAtEndValue,
		scrollOffset,
		contentHeight,
		viewportHeightValue,
	]);

	const onContentSizeChange = useCallback(
		(_width: number, height: number) => {
			contentHeight.value = height;
		},
		[contentHeight]
	);

	const onLayout = useCallback(
		(event: LayoutChangeEvent) => {
			const { height } = event.nativeEvent.layout;
			viewportHeightValue.value = height;
			setViewportHeight(height);
		},
		[viewportHeightValue]
	);

	const sharedValues = useMemo(() => ({ scrollOffset }), [scrollOffset]);
	const state = useMemo(() => ({ isAtEnd, unreadCount, isLoadingOlder }), [isAtEnd, unreadCount, isLoadingOlder]);

	return {
		state,
		controller,
		listRef,
		sharedValues,
		onContentSizeChange,
		onLayout,
		isJumpVisible,
		isCalm,
		keyboardOffset,
		bottomInset,
		maintainScrollAtEndThreshold: viewportHeight > 0 ? stickThreshold / viewportHeight : undefined,
	};
}
