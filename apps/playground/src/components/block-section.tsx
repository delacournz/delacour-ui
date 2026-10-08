import { Surface } from "@delacour/react-native-ui/surface";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement, ReactNode } from "react";
import { View } from "react-native";
import { SECTION_GAP } from "@/tokens";

export type BlockSectionProps = {
	kicker: string;
	/** A line under the tray, in the tray's own footer register. */
	footnote?: string;
	children: ReactNode;
};

/**
 * A kicker over a tray — the house grouping every block uses.
 *
 * The children are the tray's panel: a `ListGroup`, a `Card` or a set of fields.
 * A `ListGroup` passed in should carry `className="rounded-xl"` so its corner
 * nests inside the tray's, the way the home screen does.
 */
export function BlockSection({ kicker, footnote, children }: BlockSectionProps): ReactElement {
	return (
		<View className={SECTION_GAP}>
			<Text.Kicker>{kicker}</Text.Kicker>
			<Surface material="tray">{children}</Surface>
			{footnote ? <Text.Caption color="muted">{footnote}</Text.Caption> : null}
		</View>
	);
}
