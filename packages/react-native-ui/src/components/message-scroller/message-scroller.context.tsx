import type { LegendListRef } from "@legendapp/list/react-native";
import { createContext, type ReactElement, type ReactNode, type RefObject, use } from "react";
import type { LayoutChangeEvent } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import type {
	MessageScrollerController,
	MessageScrollerRenderInfo,
	MessageScrollerState,
} from "./message-scroller.types";
import type { MessageScrollerRow } from "./message-scroller.utils";

/**
 * The scroll behaviour, as one value: what the reader's position is, how to move it, and the props a
 * list spreads so the value can watch it.
 *
 * `MessageScroller` builds one for its own `List`. An app drawing its conversation with
 * `Screen.ChatList` builds one with `useMessageScrollerState`, spreads `listRef`, `sharedValues`,
 * `onLayout` and `onContentSizeChange` onto that list, and puts it in a `MessageScroller.Provider`
 * so `MessageScroller.JumpButton` can read it.
 */
export type MessageScrollerContextValue = {
	state: MessageScrollerState;
	controller: MessageScrollerController;
	/** The list's ref. Spread as `ref`. */
	listRef: RefObject<LegendListRef | null>;
	/**
	 * Spread as the list's `sharedValues`: the list writes its scroll offset here on the UI thread,
	 * and the jump button reads it there, so neither waits on a JS round trip.
	 */
	sharedValues: { scrollOffset: SharedValue<number> };
	/** Spread onto the list. Records the content's height. */
	onContentSizeChange: (width: number, height: number) => void;
	/** Spread onto the list. Records the viewport's height. */
	onLayout: (event: LayoutChangeEvent) => void;
	/** Whether the jump button is showing, resolved with hysteresis on the UI thread. */
	isJumpVisible: SharedValue<boolean>;
	/** Under reduce motion or the app's `isMotionCalm`. */
	isCalm: boolean;
	keyboardOffset: number;
	bottomInset: number;
	/**
	 * Spread onto the list: the stick threshold as the fraction of the viewport LegendList's
	 * `maintainScrollAtEnd` measures in. `undefined` until the viewport has a height.
	 */
	maintainScrollAtEndThreshold: number | undefined;
};

/**
 * What `MessageScroller.List` draws, handed down from the root with the message type erased.
 *
 * The root is generic over `T` and the list is not — it is parameterless, so an app can place
 * overlays beside it — so the rows travel as `unknown` and `renderMessage` is re-typed to match. The
 * root does that cast once; nothing reads a message here except the function that came with it.
 */
export type MessageScrollerListValue = {
	rows: readonly MessageScrollerRow<unknown>[];
	renderMessage: (info: MessageScrollerRenderInfo<unknown>) => ReactElement;
	hasOlder: boolean;
	isLoadingOlder: boolean;
	onStartReached: () => void;
	loadOlderThreshold: number;
	/** The row to open on, when it is not the end. */
	initialRowIndex: number | undefined;
	estimatedItemSize: number;
	ListHeaderComponent: ReactElement | undefined;
	ListEmptyComponent: ReactElement | undefined;
	contentContainerClassName: string | undefined;
	testID: string | undefined;
};

const MessageScrollerContext = createContext<MessageScrollerContextValue | null>(null);
const MessageScrollerListContext = createContext<MessageScrollerListValue | null>(null);

/**
 * Supplies a scroller's state and controller to its subtree.
 *
 * Lives in its own module, importing nothing but types, so a part can read it without importing
 * `./message-scroller`. That import would close a cycle, and Metro serves a partially initialised
 * module for a cycle — leaving the context `undefined` at import time.
 */
export function MessageScrollerProvider({
	value,
	children,
}: {
	value: MessageScrollerContextValue;
	children: ReactNode;
}): ReactElement {
	return <MessageScrollerContext value={value}>{children}</MessageScrollerContext>;
}
MessageScrollerProvider.displayName = "DelacourUI.MessageScroller.Provider";

/** Hands the rows down to `MessageScroller.List`. Internal. */
export function MessageScrollerListProvider({
	value,
	children,
}: {
	value: MessageScrollerListValue;
	children: ReactNode;
}): ReactElement {
	return <MessageScrollerListContext value={value}>{children}</MessageScrollerListContext>;
}
MessageScrollerListProvider.displayName = "DelacourUI.MessageScroller.ListProvider";

/**
 * The enclosing scroller's state, controller and list wiring, or `null` outside one.
 *
 * Lets an app draw its own overlay — a "new messages" pill of its own, a header that reacts to the
 * reader leaving the end — from the same state the parts read.
 */
export function useMessageScroller(): MessageScrollerContextValue | null {
	return use(MessageScrollerContext);
}

/** The enclosing scroller's value, for a part that cannot work without one. Throws outside a scroller. */
export function useMessageScrollerPart(component: string): MessageScrollerContextValue {
	const context = use(MessageScrollerContext);
	if (!context) {
		throw new Error(`${component} must be rendered inside a <MessageScroller> or <MessageScroller.Provider>.`);
	}
	return context;
}

/** The rows `MessageScroller.List` draws. Internal; throws outside a `<MessageScroller>`. */
export function useMessageScrollerList(): MessageScrollerListValue {
	const context = use(MessageScrollerListContext);
	if (!context) {
		throw new Error("MessageScroller.List must be rendered inside a <MessageScroller>.");
	}
	return context;
}
