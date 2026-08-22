import type { ReactElement, ReactNode } from "react";
import { Text, View } from "react-native";

export type SectionProps = {
	title: string;
	children: ReactNode;
};

/** A labelled block of a gallery screen. */
export function Section({ title, children }: SectionProps): ReactElement {
	return (
		<View className="gap-3">
			<Text className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">{title}</Text>
			{children}
		</View>
	);
}
