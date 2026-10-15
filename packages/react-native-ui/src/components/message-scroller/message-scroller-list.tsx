import { KeyboardAwareLegendList } from "@legendapp/list/keyboard";
import type { LegendListRenderItemProps } from "@legendapp/list/react-native";
import { type ReactElement, useCallback, useMemo } from "react";
import { View } from "react-native";
import { useResolveClassNames } from "uniwind";
import { cn } from "../../lib/cn";
import { useMessageScrollerList, useMessageScrollerPart } from "./message-scroller.context";
import type { MessageScrollerRow } from "./message-scroller.utils";
import { messageScrollerVariants } from "./message-scroller.variants";
import { MessageScrollerDateSeparator } from "./message-scroller-date-separator";
import { MessageScrollerLoadingOlder } from "./message-scroller-loading-older";
import { MessageScrollerUnreadDivider } from "./message-scroller-unread-divider";

type Row = MessageScrollerRow<unknown>;

const keyExtractor = (row: Row): string => row.key;
const getItemType = (row: Row): Row["kind"] => row.kind;

/** Fills the root, which the caller sizes. */
const LIST_STYLE = { flex: 1 } as const;

/**
 * The conversation itself: a keyboard-aware LegendList, anchored at the end, chronological.
 *
 * Not inverted, on purpose. An inverted list draws newest-first and flips it back with a transform,
 * which leaves the accessibility order reversed — VoiceOver would walk the conversation backwards.
 * `alignItemsAtEnd` gets the same bottom anchoring with the order left alone.
 *
 * `className`s reach the list through `useResolveClassNames` rather than a `withUniwind` wrapper:
 * `Screen.ChatList` already wraps `KeyboardAwareLegendList`, and a third-party component is wrapped
 * once, in one file. The root's own `View` takes the caller's `className`.
 */
export function MessageScrollerList(): ReactElement {
	const scroller = useMessageScrollerPart("MessageScroller.List");
	const list = useMessageScrollerList();
	const slots = messageScrollerVariants();
	const contentContainerStyle = useResolveClassNames(cn(slots.content(), list.contentContainerClassName));

	const { renderMessage } = list;
	const renderItem = useCallback(
		({ item }: LegendListRenderItemProps<Row>): ReactElement => {
			switch (item.kind) {
				case "date":
					return <MessageScrollerDateSeparator label={item.label} />;
				case "unread":
					return <MessageScrollerUnreadDivider count={item.count} />;
				case "message":
					return renderMessage({
						message: item.message,
						position: item.position,
						isNew: item.isNew,
						index: item.index,
					});
			}
		},
		[renderMessage]
	);

	const showLoadingOlder = list.hasOlder && list.isLoadingOlder;
	const header = useMemo<ReactElement>(
		() => (
			<>
				{list.ListHeaderComponent}
				{showLoadingOlder ? <MessageScrollerLoadingOlder /> : null}
			</>
		),
		[list.ListHeaderComponent, showLoadingOlder]
	);
	const footer = useMemo<ReactElement>(() => <View style={{ height: scroller.bottomInset }} />, [scroller.bottomInset]);

	const initialScroll =
		list.initialRowIndex === undefined
			? { initialScrollAtEnd: true }
			: { initialScrollIndex: { index: list.initialRowIndex, viewPosition: 0 } };

	return (
		<KeyboardAwareLegendList
			{...initialScroll}
			accessibilityLabel="Conversation"
			accessibilityRole="list"
			alignItemsAtEnd
			automaticallyAdjustContentInsets={false}
			contentContainerStyle={contentContainerStyle}
			contentInsetAdjustmentBehavior="never"
			data={list.rows}
			estimatedItemSize={list.estimatedItemSize}
			getItemType={getItemType}
			keyboardDismissMode="interactive"
			keyboardOffset={scroller.keyboardOffset}
			keyboardShouldPersistTaps="handled"
			keyExtractor={keyExtractor}
			ListEmptyComponent={list.ListEmptyComponent}
			ListFooterComponent={footer}
			ListHeaderComponent={header}
			maintainScrollAtEnd={{ animated: !scroller.isCalm }}
			maintainScrollAtEndThreshold={scroller.maintainScrollAtEndThreshold}
			maintainVisibleContentPosition={{ data: true, size: false }}
			onContentSizeChange={scroller.onContentSizeChange}
			onLayout={scroller.onLayout}
			onStartReached={list.onStartReached}
			onStartReachedThreshold={list.loadOlderThreshold}
			ref={scroller.listRef}
			renderItem={renderItem}
			sharedValues={scroller.sharedValues}
			showsVerticalScrollIndicator={false}
			style={LIST_STYLE}
			testID={list.testID}
		/>
	);
}
MessageScrollerList.displayName = "DelacourUI.MessageScroller.List";
