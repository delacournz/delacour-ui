import type { ReactElement, ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { Text } from "../text";
import { supportVariants } from "./support.variants";

export type SupportHeaderProps = Omit<ViewProps, "children"> & {
	title: string;
	description?: string;
	/** Trailing slot for the faces of the people who answer — an `Avatar.Group`. */
	trailing?: ReactNode;
	className?: string;
};

/**
 * The top of a help screen: who you are talking to and what they can do, with the faces of the
 * people who answer in the trailing slot. The title is announced as a header.
 */
export function SupportHeader({ title, description, trailing, className, ...props }: SupportHeaderProps): ReactElement {
	const slots = supportVariants();

	return (
		<View className={slots.header({ className })} {...props}>
			<View className={slots.headerText()}>
				<Text accessibilityRole="header" className={slots.title()}>
					{title}
				</Text>
				{description ? <Text className={slots.description()}>{description}</Text> : null}
			</View>
			{trailing}
		</View>
	);
}
SupportHeader.displayName = "DelacourUI.Support.Header";
