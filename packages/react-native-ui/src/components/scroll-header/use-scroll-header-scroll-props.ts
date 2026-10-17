import { useEffect } from "react";
import type { NativeScrollEvent } from "react-native";
import {
	type ScrollHandlerProcessed,
	useAnimatedScrollHandler,
	useComposedEventHandler,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import type { ScrollSourceProps } from "../../hooks/use-scroll-source";
import { useScrollHeaderPart } from "./scroll-header.context";
import type { ScrollHeaderOnScroll } from "./scroll-header.types";

type ScrollHandler = ScrollHandlerProcessed<Record<string, unknown>>;

/** Whether a caller's `onScroll` is a Reanimated handler rather than a plain function. */
function isWorkletHandler(handler: ScrollHeaderOnScroll): handler is ScrollHandler {
	return "workletEventHandler" in handler;
}

const noop = (): void => {};

/**
 * A scroller part's wiring: the header's scroll props with the caller's own `onScroll` composed
 * in, and its registration with the root.
 *
 * A Reanimated handler is composed on the UI thread with `useComposedEventHandler`. A plain
 * function cannot be: an animated `onScroll` replaces a JS one outright, so it is forwarded
 * from the UI thread with `scheduleOnRN`, carrying the event's payload — the `nativeEvent` a
 * plain `ScrollView` would have handed it. That is one bridge hop per frame; pass a Reanimated
 * handler for anything that runs on every frame.
 */
export function useScrollHeaderScrollProps(
	part: string,
	onScroll: ScrollHeaderOnScroll | undefined
): ScrollSourceProps & { onScroll: ScrollHandler } {
	const { scrollProps, registerScroller } = useScrollHeaderPart(part);

	useEffect(() => registerScroller(), [registerScroller]);

	const callerHandler = onScroll && isWorkletHandler(onScroll) ? onScroll : null;
	const callerFunction = onScroll && !isWorkletHandler(onScroll) ? onScroll : null;
	const forward = callerFunction ?? noop;
	const hasFunction = callerFunction !== null;

	const forwarder = useAnimatedScrollHandler(
		{
			onScroll: (event) => {
				if (hasFunction) scheduleOnRN(forward, event as NativeScrollEvent);
			},
		},
		[hasFunction, forward]
	);

	const composed = useComposedEventHandler([scrollProps.onScroll, callerHandler, hasFunction ? forwarder : null]);

	return { ...scrollProps, onScroll: composed };
}
