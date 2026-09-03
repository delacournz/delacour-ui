import { Text } from "delacour-react-native-ui/text";
import type { ReactElement, ReactNode } from "react";
import { View } from "react-native";

export type SectionProps = {
	title: string;
	children: ReactNode;
};

/** A labelled block of a hand-written `GalleryScreen` page. */
export function Section({ title, children }: SectionProps): ReactElement {
	return (
		<View className="gap-3">
			<Text.Overline size="sm">{title}</Text.Overline>
			{children}
		</View>
	);
}
