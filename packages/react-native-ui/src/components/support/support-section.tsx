import type { ReactElement } from "react";
import { View } from "react-native";
import { Text } from "../text";
import type { SupportSectionProps } from "./support.types";
import { supportVariants } from "./support.variants";

/**
 * A heading, an optional line under it, and the rows — the shell `Support.Channels`,
 * `Support.Conversations`, `Support.Articles` and `Support.Topics` share, so none of them restates
 * the title markup. Internal: not on the compound surface.
 */
export function SupportSection({
	title,
	description,
	className,
	children,
	...props
}: SupportSectionProps): ReactElement {
	const slots = supportVariants();
	const hasHeader = Boolean(title) || Boolean(description);

	return (
		<View className={slots.section({ className })} {...props}>
			{hasHeader ? (
				<View className={slots.sectionHeader()}>
					{title ? (
						<Text accessibilityRole="header" className={slots.sectionTitle()}>
							{title}
						</Text>
					) : null}
					{description ? <Text className={slots.sectionDescription()}>{description}</Text> : null}
				</View>
			) : null}
			{children}
		</View>
	);
}
SupportSection.displayName = "DelacourUI.Support.Section";
