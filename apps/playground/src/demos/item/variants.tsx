import { Icon } from "@delacour/react-native-ui/icon";
import { IconChevronRight, IconFileText } from "@delacour/react-native-ui/icons/central";
import { ITEM_VARIANTS, Item, type ItemVariant } from "@delacour/react-native-ui/item";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Variants",
	caption: "`default` draws no surface, `outline` a hairline border, `muted` a fill.",
	capture: { align: "stretch" },
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<ItemVariant, string> = {
	default: "Default",
	outline: "Outline",
	muted: "Muted",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{ITEM_VARIANTS.map((variant) => (
				<Item key={variant} onPress={() => {}} testID={`item-${variant}`} variant={variant}>
					<Item.Media variant="icon">
						<Icon icon={IconFileText} />
					</Item.Media>
					<Item.Content>
						<Item.Title>{LABELS[variant]}</Item.Title>
						<Item.Description>Tap to feel the press</Item.Description>
					</Item.Content>
					<Item.Actions>
						<Icon icon={IconChevronRight} />
					</Item.Actions>
				</Item>
			))}
		</View>
	);
}
