import type { ReactElement, ReactNode } from "react";
import { View } from "react-native";
import { Icon, type IconComponent } from "../icon";
import { Text } from "../text";
import { usePageHeaderPart } from "./page-header.context";
import type { PageHeaderSlotProps } from "./page-header.types";
import { pageHeaderVariants } from "./page-header.variants";

export type PageHeaderMetaProps = Omit<PageHeaderSlotProps, "children"> & {
	/** A Central glyph, drawn small and muted before the text. */
	icon?: IconComponent;
	/** Bare text is wrapped in a muted `Text.Caption`; anything else is drawn as given. */
	children: ReactNode;
};

/**
 * A small fact under the title — a place, a join date, a handle.
 *
 * The glyph is decorative: the text says what it means, so only the text is
 * read.
 */
export function PageHeaderMeta({ icon, className, children, ...props }: PageHeaderMetaProps): ReactElement {
	const { align } = usePageHeaderPart("PageHeader.Meta");
	const isText = typeof children === "string" || typeof children === "number";
	return (
		<View className={pageHeaderVariants({ align }).meta({ className })} {...props}>
			{icon ? <Icon color="muted-foreground" icon={icon} size="sm" /> : null}
			{isText ? <Text.Caption numberOfLines={1}>{children}</Text.Caption> : children}
		</View>
	);
}
PageHeaderMeta.displayName = "DelacourUI.PageHeader.Meta";
