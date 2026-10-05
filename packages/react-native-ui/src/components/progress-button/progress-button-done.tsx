import type { ReactElement, ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { IconCheckmark2 } from "../../icons/central";
import { cn } from "../../lib/cn";
import { Icon } from "../icon";
import { useProgressButtonPart } from "./progress-button.context";

export type ProgressButtonDoneProps = ViewProps & {
	/** Replaces the default tick. A bare `Icon` inherits the fill's foreground and the button's icon size. */
	children?: ReactNode;
	className?: string;
};

/**
 * What the button shows once the hold completes.
 *
 * The root lifts this part out of its children by type and draws it over the
 * full fill, fading and scaling it in as the labels fade out. With no children
 * it draws a tick; the root draws one of these by itself when the caller writes
 * none, so the tick is there by default.
 *
 * Size and colour come from the `IconDefaultsProvider` the root wraps it in, so
 * a composed `Icon` matches the default tick with nothing said at the call site.
 */
export function ProgressButtonDone({ children, className, ...props }: ProgressButtonDoneProps): ReactElement {
	useProgressButtonPart("ProgressButton.Done");
	return (
		<View className={cn("flex-row items-center justify-center gap-2", className)} {...props}>
			{children ?? <Icon icon={IconCheckmark2} />}
		</View>
	);
}
ProgressButtonDone.displayName = "DelacourUI.ProgressButton.Done";
