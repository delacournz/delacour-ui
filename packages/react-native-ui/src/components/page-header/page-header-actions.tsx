import type { ReactElement } from "react";
import { View } from "react-native";
import { usePageHeaderPart } from "./page-header.context";
import type { PageHeaderSlotProps } from "./page-header.types";
import { pageHeaderVariants } from "./page-header.variants";

export type PageHeaderActionsProps = PageHeaderSlotProps;

/**
 * A row of the caller's buttons — Follow, Message.
 *
 * Wraps rather than squeezing, so a long label at a large font scale moves to a
 * second line instead of truncating, and aligns with the header.
 */
export function PageHeaderActions({ className, children, ...props }: PageHeaderActionsProps): ReactElement {
	const { variant, align } = usePageHeaderPart("PageHeader.Actions");
	return (
		<View className={pageHeaderVariants({ variant, align }).actions({ className })} {...props}>
			{children}
		</View>
	);
}
PageHeaderActions.displayName = "DelacourUI.PageHeader.Actions";
