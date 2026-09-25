import type { ReactElement } from "react";
import { View } from "react-native";
import { useCardContext } from "../card/card.context";
import { Text } from "../text";
import { useKpiPart } from "./kpi.context";
import type { KpiTextProps } from "./kpi.types";
import { kpiVariants } from "./kpi.variants";

/**
 * The number.
 *
 * Formatted by the caller, not here — separators, currency and units are
 * locale decisions a component would get wrong in a way that is hard to
 * notice and impossible to override. It takes the foreground token of the
 * plane the card landed on, like `Card.Title`, and one line: a number that
 * wraps is no longer read as one.
 *
 * While the KPI is loading it is a muted block the height of the number's
 * line, announced as loading, so the card does not jump when the data lands.
 */
export function KpiValue({ className, ...props }: KpiTextProps): ReactElement {
	const { size, isLoading } = useKpiPart("Kpi.Value");
	const plane = useCardContext()?.plane ?? null;
	const slots = kpiVariants({ plane: plane ?? "none", size });

	if (isLoading) {
		return <View accessibilityLabel="Loading" accessible className={slots.valuePlaceholder()} />;
	}

	return <Text adjustsFontSizeToFit className={slots.value({ className })} numberOfLines={1} {...props} />;
}
KpiValue.displayName = "DelacourUI.Kpi.Value";
