import type { ReactElement } from "react";
import { View } from "react-native";
import { usePageHeaderPart } from "./page-header.context";
import type { PageHeaderSlotProps } from "./page-header.types";
import { pageHeaderVariants } from "./page-header.variants";

export type PageHeaderContentProps = PageHeaderSlotProps;

/**
 * The title block — a column holding the title, meta lines and description.
 *
 * Sits on the gutter the header's root gave back to its cover, and aligns its
 * children the way the header does: centred under the face, or on the leading
 * edge beside it.
 */
export function PageHeaderContent({ className, children, ...props }: PageHeaderContentProps): ReactElement {
	const { variant, align } = usePageHeaderPart("PageHeader.Content");
	return (
		<View className={pageHeaderVariants({ variant, align }).content({ className })} {...props}>
			{children}
		</View>
	);
}
PageHeaderContent.displayName = "DelacourUI.PageHeader.Content";
