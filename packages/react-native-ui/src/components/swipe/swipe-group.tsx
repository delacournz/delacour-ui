import { type ReactElement, useCallback, useMemo, useRef } from "react";
import { View, type ViewProps } from "react-native";
import { cn } from "../../lib/cn";
import { type SwipeGroupContextValue, SwipeGroupProvider } from "./swipe.context";

export type SwipeGroupProps = ViewProps & {
	className?: string;
	/** One row open at a time: opening one closes the rest. Default `true`. */
	isExclusive?: boolean;
};

/**
 * Coordinates the rows beneath it. Renders a plain `View`.
 *
 * **Rows register themselves through context**, rather than the group walking
 * its children, so a row nested in a `ListGroup`, a `.map()` or a custom
 * component still belongs. The registry is a ref — joining or leaving it
 * re-renders nothing.
 */
export function SwipeGroup({ className, isExclusive = true, children, ...props }: SwipeGroupProps): ReactElement {
	const rows = useRef(new Map<string, () => void>());

	const register = useCallback((id: string, close: () => void) => {
		rows.current.set(id, close);
		return () => {
			if (rows.current.get(id) === close) rows.current.delete(id);
		};
	}, []);

	const notifyOpen = useCallback(
		(id: string) => {
			if (!isExclusive) return;
			for (const [other, close] of rows.current) if (other !== id) close();
		},
		[isExclusive]
	);

	const closeAll = useCallback(() => {
		for (const close of rows.current.values()) close();
	}, []);

	const value = useMemo<SwipeGroupContextValue>(
		() => ({ closeAll, notifyOpen, register }),
		[closeAll, notifyOpen, register]
	);

	return (
		<SwipeGroupProvider value={value}>
			<View className={cn(className)} {...props}>
				{children}
			</View>
		</SwipeGroupProvider>
	);
}
SwipeGroup.displayName = "DelacourUI.Swipe.Group";
