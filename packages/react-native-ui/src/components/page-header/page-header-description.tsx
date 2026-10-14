import type { ReactElement } from "react";
import { Text, type TextPresetProps } from "../text";
import { usePageHeaderPart } from "./page-header.context";
import { isEmptyText } from "./page-header.utils";
import { pageHeaderVariants } from "./page-header.variants";

export type PageHeaderDescriptionProps = TextPresetProps;

/**
 * A bio or a summary — `Text.Paragraph` on the muted token, three lines unless
 * told otherwise. An empty description renders nothing.
 */
export function PageHeaderDescription({
	className,
	color = "muted",
	numberOfLines = 3,
	children,
	...props
}: PageHeaderDescriptionProps): ReactElement | null {
	const { align } = usePageHeaderPart("PageHeader.Description");
	if (isEmptyText(children)) return null;
	return (
		<Text.Paragraph
			className={pageHeaderVariants({ align }).description({ className })}
			color={color}
			numberOfLines={numberOfLines}
			{...props}
		>
			{children}
		</Text.Paragraph>
	);
}
PageHeaderDescription.displayName = "DelacourUI.PageHeader.Description";
