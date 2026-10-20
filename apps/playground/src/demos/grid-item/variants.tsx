import { GRID_ITEM_VARIANTS, GridItem, type GridItemVariant } from "@delacour/react-native-ui/grid-item";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Variants",
	caption:
		"`default` a card, `outline` a border, `muted` a fill, `plain` nothing. Every variant reserves the same border, so switching one never moves the content.",
	capture: { align: "stretch" },
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<GridItemVariant, string> = {
	default: "Default",
	outline: "Outline",
	muted: "Muted",
	plain: "Plain",
};

export function Demo(): ReactElement {
	return (
		<GridItem.Group aspect={1.6} columns={2}>
			{GRID_ITEM_VARIANTS.map((variant) => (
				<GridItem key={variant} testID={`grid-item-${variant}`} variant={variant}>
					<GridItem.Title>{LABELS[variant]}</GridItem.Title>
					<GridItem.Value>1,284</GridItem.Value>
					<GridItem.Description>Visits today</GridItem.Description>
				</GridItem>
			))}
		</GridItem.Group>
	);
}
